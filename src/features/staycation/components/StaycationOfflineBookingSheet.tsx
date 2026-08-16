// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Linking,
  TouchableWithoutFeedback,
  Image,
  Keyboard,
} from "react-native";
import { Text } from "@/components/ui";
import {
  User,
  Phone,
  Wallet,
  ArrowLeft,
  Users,
  X,
  Calendar,
  ArrowRightToLine,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/constants/theme";
import { CustomDatePickerModal } from "@/components/ui/CustomDatePickerModal";
import { supabase } from "@/lib/supabase";
import { useCreateStaycationOfflineBooking } from "../hooks/useCreateStaycationOfflineBooking";
import { useDebounce } from "@/hooks/useDebounce";

import MoneySvg from "@/assets/icons/ic-tdesign-money.svg";

const icGpay = require("@/assets/icons/google-pay.png");
const icPhonepe = require("@/assets/icons/icons8-phone-pe-48.png");
const icPaytm = require("@/assets/icons/paytm.png");
const icCash = require("@/assets/icons/pay-50.png");

interface StaycationOfflineBookingSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  activeCategory: "Farmhouse" | "Rooms";
  venueId: string;
}

interface RoomConfig {
  maxOccupancy: number;
  extraGuestCharge: number;
  totalInventory: number;
  pricePerNight: number;
}

const formatYMD = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const StaycationOfflineBookingSheet = ({
  visible,
  onClose,
  onSuccess,
  activeCategory,
  venueId,
}: StaycationOfflineBookingSheetProps) => {
  const isFarmhouse = activeCategory === "Farmhouse";
  const { createBooking, isLoading } = useCreateStaycationOfflineBooking();
  const insets = useSafeAreaInsets();
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">(
    "cash",
  );

  const [searchResults, setSearchResults] = useState<{ name: string; phone: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const isSelectingFromResults = useRef(false);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const subs = [
      Keyboard.addListener("keyboardWillShow", () => setIsKeyboardVisible(true)),
      Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true)),
      Keyboard.addListener("keyboardWillHide", () => setIsKeyboardVisible(false)),
      Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false)),
    ];
    return () => {
      subs.forEach(s => s.remove());
    };
  }, []);

  const lookupGuestsByName = async (vId: string, q: string) => {
    try {
      const { data } = await supabase
        .from("staycation_bookings")
        .select("guest_name, guest_phone")
        .eq("venue_id", vId)
        .ilike("guest_name", `%${q}%`)
        .not("guest_name", "is", null)
        .order("guest_name", { ascending: true })
        .limit(30);
      if (!data) return [];
      const unique = new Map();
      data.forEach(d => {
        if (d.guest_name && d.guest_phone && !unique.has(d.guest_phone)) {
          unique.set(d.guest_phone, { name: d.guest_name, phone: d.guest_phone });
        }
      });
      return Array.from(unique.values());
    } catch (e) {
      return [];
    }
  };

  const handleNameChange = (text: string) => {
    isSelectingFromResults.current = false;
    setName(text);
  };

  const [name, setName] = useState("");
  const debouncedName = useDebounce(name, 500);

  useEffect(() => {
    const fetchGuests = async () => {
      if (isSelectingFromResults.current) {
        return;
      }

      if (debouncedName.trim().length >= 1) {
        const results = await lookupGuestsByName(venueId, debouncedName);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };
    fetchGuests();
  }, [debouncedName, venueId]);

  const [bookingFor, setBookingFor] = useState(isFarmhouse ? "Farmhouse" : "Cottages");
  const [roomType, setRoomType] = useState("");
  const [unitCount, setUnitCount] = useState("1");
  const [guestCount, setGuestCount] = useState("2");
  const [groupType, setGroupType] = useState("Family");

  const [phone, setPhone] = useState("");
  const [totalPayment, setTotalPayment] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [isAdvanceActive, setIsAdvanceActive] = useState(false);

  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 1)),
  );
  const [showDatePicker, setShowDatePicker] = useState<"in" | "out" | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<{
    type: string;
    options: string[];
    title: string;
  } | null>(null);

  const guestCountRef = useRef<View>(null);
  const groupTypeRef = useRef<View>(null);
  const mobileInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const totalPaymentRef = useRef<TextInput>(null);
  const advancePaymentRef = useRef<TextInput>(null);

  const [dropdownLayout, setDropdownLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const [roomConfigs, setRoomConfigs] = useState<Record<string, RoomConfig>>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookingDots, setBookingDots] = useState<Record<string, { key: string; color: string }[]>>(
    {},
  );
  const [availableUnitsForCurrentDates, setAvailableUnitsForCurrentDates] = useState<number>(1);
  const [farmhouseConfig, setFarmhouseConfig] = useState<{
    basePrice: number;
    extraCharge: number;
    maxOccupancy: number;
  } | null>(null);

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const activeRoomConfig = roomConfigs[roomType];
  const unitsInt = parseInt(unitCount, 10) || 1;
  const currentGuestInt = parseInt(guestCount, 10) || 1;

  const maxStandardGuests = isFarmhouse
    ? farmhouseConfig?.maxOccupancy || 0
    : activeRoomConfig
    ? activeRoomConfig.maxOccupancy * unitsInt
    : 2;
  const maxExtraGuests = isFarmhouse ? 10 : activeRoomConfig ? unitsInt : 0;
  const totalAllowedGuests = maxStandardGuests + maxExtraGuests;
  const extraGuestsCount = Math.max(0, currentGuestInt - maxStandardGuests);

  const displayNights = Math.max(
    1,
    Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  let extraGuestAmount = 0;
  if (isFarmhouse && farmhouseConfig) {
    extraGuestAmount = extraGuestsCount * farmhouseConfig.extraCharge * displayNights;
  } else if (!isFarmhouse && activeRoomConfig) {
    extraGuestAmount = extraGuestsCount * activeRoomConfig.extraGuestCharge * displayNights;
  }

  useEffect(() => {
    if (visible && isFarmhouse && venueId) {
      const fetchFarmhouseConfig = async () => {
        const { data } = await supabase
          .from("staycation_venues")
          .select("base_price_per_night, extra_guest_charge, max_guests")
          .eq("venue_id", venueId)
          .maybeSingle();

        if (data) {
          setFarmhouseConfig({
            basePrice: data.base_price_per_night || 0,
            extraCharge: data.extra_guest_charge || 0,
            maxOccupancy: data.max_guests || 0,
          });
        }
      };
      fetchFarmhouseConfig();
    }
  }, [visible, isFarmhouse, venueId]);

  useEffect(() => {
    const nights = Math.max(
      1,
      Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    let total = 0;

    if (isFarmhouse && farmhouseConfig) {
      const baseCost = farmhouseConfig.basePrice * nights;
      const extraCost = extraGuestsCount * farmhouseConfig.extraCharge * nights;
      total = baseCost + extraCost;
    } else if (!isFarmhouse && activeRoomConfig) {
      const baseCost = activeRoomConfig.pricePerNight * unitsInt * nights;
      const extraCost = extraGuestsCount * activeRoomConfig.extraGuestCharge * nights;
      total = baseCost + extraCost;
    }

    if (total > 0 && total.toString() !== totalPayment) {
      setTotalPayment(total.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFarmhouse,
    farmhouseConfig,
    activeRoomConfig,
    guestCount,
    checkInDate,
    checkOutDate,
    extraGuestsCount,
    unitsInt,
  ]);

  useEffect(() => {
    if (visible && !isFarmhouse && venueId) {
      const fetchVenueRooms = async () => {
        const { data } = await supabase
          .from("staycation_rooms")
          .select("room_name, max_occupancy, extra_guest_charge, price_per_night")
          .eq("venue_id", venueId)
          .eq("is_active", true);

        if (data) {
          const configs: Record<string, RoomConfig> = {};
          data.forEach(r => {
            if (!configs[r.room_name]) {
              configs[r.room_name] = {
                maxOccupancy: r.max_occupancy,
                extraGuestCharge: r.extra_guest_charge || 0,
                totalInventory: 0,
                pricePerNight: r.price_per_night || 0,
              };
            }
            configs[r.room_name].totalInventory += 1;
          });
          setRoomConfigs(configs);
          const types = Object.keys(configs);
          if (types.length > 0 && !roomType) {
            setRoomType(types[0]);
          }
        }
      };
      fetchVenueRooms();
    }
  }, [visible, isFarmhouse, venueId, roomType]);

  useEffect(() => {
    if (isFarmhouse || !venueId || !roomType || !visible) return;

    const fetchAvailabilityForDates = async () => {
      const { data: rooms } = await supabase
        .from("staycation_rooms")
        .select("id")
        .eq("venue_id", venueId)
        .eq("room_name", roomType)
        .eq("is_active", true);

      const roomIds = rooms?.map(r => r.id) || [];
      if (roomIds.length === 0) {
        setAvailableUnitsForCurrentDates(0);
        return;
      }

      const dInStr = formatYMD(checkInDate);
      const dOutStr = formatYMD(checkOutDate);

      const { data: blocks } = await supabase
        .from("staycation_availability")
        .select("room_id, date")
        .eq("venue_id", venueId)
        .in("room_id", roomIds)
        .eq("is_blocked", true)
        .gte("date", dInStr)
        .lt("date", dOutStr);

      const blockCountsPerDate: Record<string, Set<string>> = {};
      blocks?.forEach(b => {
        if (!blockCountsPerDate[b.date]) blockCountsPerDate[b.date] = new Set();
        if (b.room_id) blockCountsPerDate[b.date].add(b.room_id);
      });

      let maxBlocked = 0;
      for (const dateSet of Object.values(blockCountsPerDate)) {
        if (dateSet.size > maxBlocked) maxBlocked = dateSet.size;
      }

      setAvailableUnitsForCurrentDates(Math.max(0, roomIds.length - maxBlocked));
    };

    fetchAvailabilityForDates();
  }, [venueId, roomType, checkInDate, checkOutDate, isFarmhouse, visible]);

  useEffect(() => {
    if (!isFarmhouse && activeRoomConfig && currentGuestInt > totalAllowedGuests) {
      setGuestCount(Math.max(1, totalAllowedGuests).toString());
    }
  }, [unitsInt, roomType, isFarmhouse, currentGuestInt, totalAllowedGuests, activeRoomConfig]);

  useEffect(() => {
    if (!visible || !venueId) return;

    const fetchBlockedDates = async () => {
      const todayStr = formatYMD(new Date());

      if (isFarmhouse) {
        const dates = new Set<string>();
        const newBookingDots: Record<string, { key: string; color: string }[]> = {};

        const { data: blocks } = await supabase
          .from("staycation_availability")
          .select("date")
          .eq("venue_id", venueId)
          .eq("is_blocked", true)
          .gte("date", todayStr);
        blocks?.forEach(b => dates.add(b.date));

        const { data: bookings } = await supabase
          .from("staycation_bookings")
          .select("check_in_date, check_out_date, booking_source")
          .eq("venue_id", venueId)
          .eq("booking_type", "full_property")
          .neq("booking_status", "cancelled")
          .gte("check_out_date", todayStr);

        bookings?.forEach(b => {
          let curr = new Date(b.check_in_date);
          const end = new Date(b.check_out_date);
          const dotColor = b.booking_source === "offline" ? "red" : "blue";

          while (curr < end) {
            const dateStr = formatYMD(curr);
            dates.add(dateStr);
            if (!newBookingDots[dateStr]) newBookingDots[dateStr] = [];
            // Adding a single dot per booking day to keep it clean for Farmhouse
            newBookingDots[dateStr].push({ key: `booking_${Math.random()}`, color: dotColor });
            curr.setDate(curr.getDate() + 1);
          }
        });

        const { data: closedDates } = await supabase
          .from("venue_closed_dates")
          .select("start_date, end_date")
          .eq("venue_id", venueId);

        closedDates?.forEach(c => {
          let curr = new Date(c.start_date);
          const end = c.end_date ? new Date(c.end_date) : new Date(c.start_date);
          while (curr <= end) {
            dates.add(formatYMD(curr));
            curr.setDate(curr.getDate() + 1);
          }
        });

        setBlockedDates(Array.from(dates));
        setBookingDots(newBookingDots);
      } else {
        if (!roomType) return;

        const { data: rooms } = await supabase
          .from("staycation_rooms")
          .select("id")
          .eq("venue_id", venueId)
          .eq("room_name", roomType)
          .eq("is_active", true);

        const roomIds = rooms?.map(r => r.id) || [];
        const totalRoomsOfType = roomIds.length;

        if (totalRoomsOfType === 0) {
          setBlockedDates([]);
          return;
        }

        const dateCounts: Record<string, number> = {};
        const newBookingDots: Record<string, { key: string; color: string }[]> = {};

        const { data: bookings } = await supabase
          .from("staycation_bookings")
          .select("check_in_date, check_out_date, unit_count, booking_source")
          .eq("venue_id", venueId)
          .in("room_id", roomIds)
          .neq("booking_status", "cancelled")
          .gte("check_out_date", todayStr);

        bookings?.forEach(b => {
          let curr = new Date(b.check_in_date);
          const end = new Date(b.check_out_date);
          const dotColor = b.booking_source === "offline" ? "red" : "blue";
          const units = b.unit_count || 1;

          while (curr < end) {
            const dStr = formatYMD(curr);
            dateCounts[dStr] = (dateCounts[dStr] || 0) + units;

            if (!newBookingDots[dStr]) newBookingDots[dStr] = [];
            // Add one dot per unit booked or just one per booking
            for (let i = 0; i < Math.min(units, 3); i++) {
              newBookingDots[dStr].push({ key: `booking_${Math.random()}`, color: dotColor });
            }

            curr.setDate(curr.getDate() + 1);
          }
        });

        const fullDates = [];
        for (const [date, count] of Object.entries(dateCounts)) {
          if (totalRoomsOfType - count < unitsInt) {
            fullDates.push(date);
          }
        }
        setBlockedDates(fullDates);
        setBookingDots(newBookingDots);
      }
    };

    fetchBlockedDates();
  }, [visible, venueId, isFarmhouse, roomType, unitsInt]);

  useEffect(() => {
    const lookupGuest = async () => {
      const cleanMobile = phone.replace(/[^\d]/g, "");
      if (cleanMobile.length !== 10) return;
      const phoneVariants = [cleanMobile, `+91${cleanMobile}`, `+91 ${cleanMobile}`];
      const phoneOrQuery = phoneVariants.map(v => `phone.eq.${v}`).join(",");
      const guestPhoneOrQuery = phoneVariants.map(v => `guest_phone.eq.${v}`).join(",");

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .or(phoneOrQuery)
          .maybeSingle();
        let foundName = profile?.full_name || "";

        if (!foundName) {
          const { data: stayBooking } = await supabase
            .from("staycation_bookings")
            .select("guest_name")
            .or(guestPhoneOrQuery)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (stayBooking?.guest_name) foundName = stayBooking.guest_name;
        }
        if (foundName) setName(foundName);
      } catch (err) {}
    };
    lookupGuest();
  }, [phone]);

  useEffect(() => {
    if (visible) {
      setBookingFor(isFarmhouse ? "Farmhouse" : "Rooms");
      setUnitCount("1");
      setGuestCount(isFarmhouse ? "10" : "2");
      setTotalPayment("");
      setName("");
      setPhone("");
      setAdvancePaid("");
      setIsAdvanceActive(false);
    }
  }, [isFarmhouse, visible]);

  useEffect(() => {
    if (!visible) return;

    const currentCheckInStr = formatYMD(checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInTime = new Date(checkInDate);
    checkInTime.setHours(0, 0, 0, 0);

    if (blockedDates.includes(currentCheckInStr) || checkInTime < today) {
      let checkDate = new Date();
      if (checkInTime > checkDate) {
        checkDate = new Date(checkInDate);
      }

      for (let i = 0; i < 60; i++) {
        const dStr = formatYMD(checkDate);
        if (!blockedDates.includes(dStr)) {
          setCheckInDate(checkDate);
          const tomorrow = new Date(checkDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          setCheckOutDate(tomorrow);
          break;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
    }
  }, [visible, blockedDates, checkInDate]);

  const handleDropdownSelect = (option: string) => {
    if (!activeDropdown) return;
    if (activeDropdown.type === "bookingFor") setBookingFor(option);
    if (activeDropdown.type === "roomType") setRoomType(option);
    if (activeDropdown.type === "guestCount") setGuestCount(option);
    if (activeDropdown.type === "groupType") setGroupType(option);

    if (activeDropdown.type === "unitCount") {
      if (option.includes("(Booked)")) {
        Alert.alert("Unavailable", "You cannot select this many units for the chosen dates.");
        return;
      }
      const cleanValue = option.split(" ")[0];
      setUnitCount(cleanValue);
    }
    setActiveDropdown(null);
  };

  const handleBookNow = async () => {
    if (isLoading) return;
    if (!venueId) {
      Alert.alert("Error", "Venue information missing.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Error", "Please enter the guest name.");
      return;
    }
    if (!phone.trim() || phone.replace(/[^\d]/g, "").length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!isFarmhouse && unitsInt > availableUnitsForCurrentDates) {
      Alert.alert("Error", "Not enough units available for the selected dates.");
      return;
    }

    if (isFarmhouse) {
      let hasConflict = false;
      let curr = new Date(checkInDate);
      while (curr < checkOutDate) {
        if (blockedDates.includes(formatYMD(curr))) {
          hasConflict = true;
          break;
        }
        curr.setDate(curr.getDate() + 1);
      }
      if (hasConflict) {
        Alert.alert("Error", "The selected dates are already booked or the venue is closed.");
        return;
      }
    }

    if (!totalPayment.trim() || isNaN(parseFloat(totalPayment))) {
      Alert.alert("Error", "Please enter a valid total payment amount.");
      return;
    }
    const numericTotal = parseFloat(totalPayment);
    const numericAdvance = parseFloat(advancePaid || "0");

    if (numericAdvance > numericTotal) {
      Alert.alert("Error", "Advance paid cannot exceed total payment.");
      return;
    }

    const result = await createBooking({
      venueId,
      guestName: name.trim(),
      guestPhone: phone.trim(),
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      guestCount: currentGuestInt,
      totalPayment: parseFloat(totalPayment) || 0,
      advancePaid: parseFloat(advancePaid) || 0,
      paymentMode: selectedMethod,
      bookingType: bookingFor.toLowerCase(),
      roomType: isFarmhouse ? undefined : roomType,
      roomId: undefined,
      groupType: groupType,
      unitCount: isFarmhouse ? 1 : unitsInt,
      bookingSource: "offline",
    });

    if (result.success) {
      const dueAmount = numericTotal - numericAdvance;
      const appLink =
        Platform.OS === "ios"
          ? "https://apps.apple.com/app/bookr/idYOUR_APP_ID"
          : "https://play.google.com/store/apps/details?id=com.bookr_mobile";
      const spicyLine =
        "🔥 Don't let your slot get snatched! Lock in your favorite time instantly on the Bookr app.";
      const shareMessage = `Booking Confirmed! 🎉\nHi ${name.trim()},\nYour slot at ${
        result.venueName || "our venue"
      } is locked in via Bookr.\n\nDate: ${formatDateLabel(checkInDate)} to ${formatDateLabel(
        checkOutDate,
      )}\n\nPayment Summary:\nTotal: ₹${totalPayment}\nPaid: ₹${advancePaid}\nDue: ₹${dueAmount}\n\n${spicyLine}\n${appLink}\n\nThank you!`;

      Alert.alert("Booking Success", "Offline booking created successfully.", [
        {
          text: "Okay",
          style: "cancel",
          onPress: () => {
            onSuccess?.();
            onClose();
          },
        },
        {
          text: "Send to WhatsApp",
          onPress: async () => {
            const cleanPhone = phone.replace(/\D/g, "");
            const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(
              shareMessage,
            )}`;
            try {
              const supported = await Linking.canOpenURL(whatsappUrl);
              await Linking.openURL(
                supported
                  ? whatsappUrl
                  : `https://wa.me/${formattedPhone}?text=${encodeURIComponent(shareMessage)}`,
              );
            } catch (err) {
              Alert.alert("Error", "Could not open WhatsApp.");
            }
            onSuccess?.();
            onClose();
          },
        },
      ]);
    } else {
      Alert.alert("Error", "Failed to create booking. Please check availability.");
    }
  };

  const onDateChange = (selectedDate: Date) => {
    const dateStr = formatYMD(selectedDate);
    if (showDatePicker === "in") {
      if (blockedDates.includes(dateStr)) {
        Alert.alert("Date Unavailable", "Not enough rooms available for the selected dates.");
        setShowDatePicker(null);
        return;
      }
      const newCheckIn = selectedDate;
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      setCheckInDate(newCheckIn);
      setCheckOutDate(nextDay);
      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (selectedDate >= checkOutDate) {
        setCheckOutDate(tomorrow);
      } else {
        let hasBlock = false;
        let curr = new Date(selectedDate);
        while (curr < checkOutDate) {
          if (blockedDates.includes(formatYMD(curr))) {
            hasBlock = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }
        if (hasBlock) {
          Alert.alert(
            "Range Adjusted",
            "Your previous check-out date overlapped with booked dates. It has been automatically adjusted.",
          );
          setCheckOutDate(tomorrow);
        }
      }
    } else if (showDatePicker === "out") {
      if (selectedDate <= checkInDate) {
        Alert.alert("Invalid Date", "Check-out date must be after check-in date.");
      } else {
        let hasBlock = false;
        let curr = new Date(checkInDate);
        while (curr < selectedDate) {
          if (blockedDates.includes(formatYMD(curr))) {
            hasBlock = true;
            break;
          }
          curr.setDate(curr.getDate() + 1);
        }
        if (hasBlock) {
          Alert.alert(
            "Date Unavailable",
            "The selected date range contains days without enough available rooms.",
          );
        } else {
          setCheckOutDate(selectedDate);
        }
      }
    }
    setShowDatePicker(null);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={false}
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}>
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={styles.sheetContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
                  </TouchableOpacity>

                  <View style={styles.headerTitleWrap}>
                    <Text weight="bold" style={styles.title}>
                      Add Bookings
                    </Text>
                  </View>
                </View>

                {/* BOOKING DETAILS */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Calendar size={ms(20)} color="#000" />
                    <Text weight="bold" style={styles.sectionTitle}>
                      BOOKING DETAILS
                    </Text>
                  </View>
                  <View style={styles.grid}>
                    {/* Check In */}
                    <TouchableOpacity
                      style={styles.gridCard}
                      onPress={() => setShowDatePicker("in")}
                      activeOpacity={0.7}>
                      <View style={styles.iconBox}>
                        <Calendar size={ms(18)} color="#4A80F0" />
                      </View>
                      <View style={styles.gridCardContent}>
                        <Text style={styles.gridCardLabel}>Check In</Text>
                        <Text style={styles.gridCardValue}>{formatDateLabel(checkInDate)}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Check Out */}
                    <TouchableOpacity
                      style={styles.gridCard}
                      onPress={() => setShowDatePicker("out")}
                      activeOpacity={0.7}>
                      <View style={styles.iconBox}>
                        <Calendar size={ms(18)} color="#4A80F0" />
                      </View>
                      <View style={styles.gridCardContent}>
                        <Text style={styles.gridCardLabel}>Check Out</Text>
                        <Text style={styles.gridCardValue}>{formatDateLabel(checkOutDate)}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* No Of Guest */}
                    <View style={styles.halfWidth} ref={guestCountRef}>
                      <TouchableOpacity
                        style={[styles.gridCard, styles.fullWidth]}
                        onPress={() => {
                          guestCountRef.current?.measure((x, y, width, height, pageX, pageY) => {
                            setDropdownLayout({
                              top: pageY + height + vs(4),
                              left: pageX,
                              width: ms(200),
                            });
                            setActiveDropdown({
                              type: "guestCount",
                              options: Array.from(
                                { length: Math.max(1, totalAllowedGuests) },
                                (_, i) => (i + 1).toString(),
                              ),
                              title: "Select Guest Count",
                            });
                          });
                        }}
                        activeOpacity={0.7}>
                        <View style={styles.iconBox}>
                          <Users size={ms(18)} color="#4A80F0" />
                        </View>
                        <View style={styles.gridCardContent}>
                          <Text style={styles.gridCardLabel}>No Of Guest</Text>
                          <Text style={styles.gridCardValue}>{guestCount}</Text>
                        </View>
                      </TouchableOpacity>
                      {extraGuestAmount > 0 && (
                        <Text style={styles.extraGuestText}>
                          + ₹{extraGuestAmount} for {extraGuestsCount} extra guest(s)
                        </Text>
                      )}
                    </View>

                    {/* Group Type / Room Type */}
                    <View style={styles.halfWidth} ref={groupTypeRef}>
                      <TouchableOpacity
                        style={[styles.gridCard, styles.fullWidth]}
                        onPress={() => {
                          groupTypeRef.current?.measure((x, y, width, height, pageX, pageY) => {
                            setDropdownLayout({
                              top: pageY + height + vs(4),
                              left: pageX + width - ms(200),
                              width: ms(200),
                            });
                            if (isFarmhouse) {
                              setActiveDropdown({
                                type: "groupType",
                                options: ["Family", "Friends", "Corporate", "Couple", "Other"],
                                title: "Select Group Type",
                              });
                            } else {
                              setActiveDropdown({
                                type: "roomType",
                                options: Object.keys(roomConfigs),
                                title: "Select Room Type",
                              });
                            }
                          });
                        }}
                        activeOpacity={0.7}>
                        <View style={styles.iconBox}>
                          <Users size={ms(18)} color="#4A80F0" />
                        </View>
                        <View style={styles.gridCardContent}>
                          <Text style={styles.gridCardLabel}>
                            {isFarmhouse ? "Group Type" : "Room Type"}
                          </Text>
                          <Text style={styles.gridCardValue}>
                            {isFarmhouse ? groupType : roomType}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* CUSTOMER DETAILS */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <User size={ms(20)} color="#000" />
                    <Text weight="bold" style={styles.sectionTitle}>
                      CUSTOMER DETAILS
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.inputContainer}
                    activeOpacity={1}
                    onPress={() => mobileInputRef.current?.focus()}>
                    <View style={styles.inputIconBox}>
                      <Phone size={ms(18)} color="#4A80F0" />
                    </View>
                    <View style={styles.inputContent}>
                      <Text style={styles.inputLabelText}>Mobile No</Text>
                      <View style={styles.phoneInputRow}>
                        <TextInput
                          ref={mobileInputRef}
                          style={styles.textInput}
                          placeholder="Enter Mobile No"
                          placeholderTextColor={COLORS.text.muted}
                          keyboardType="phone-pad"
                          value={phone}
                          onFocus={() => setIsKeyboardVisible(true)}
                          onChangeText={text => {
                            let clean = text.replace(/\D/g, "");
                            if (
                              text.includes("+") ||
                              (clean.length > 10 &&
                                (clean.startsWith("91") || clean.startsWith("0")))
                            ) {
                              clean = clean.slice(-10);
                            } else if (clean.length > 10) {
                              clean = clean.slice(0, 10);
                            }
                            setPhone(clean);
                            if (clean.length < 10) setName("");
                          }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.autocompleteWrapper}>
                    <TouchableOpacity
                      style={styles.inputContainer}
                      activeOpacity={1}
                      onPress={() => nameInputRef.current?.focus()}>
                      <View style={styles.inputIconBox}>
                        <User size={ms(18)} color="#4A80F0" />
                      </View>
                      <View style={styles.inputContent}>
                        <Text style={styles.inputLabelText}>Name</Text>
                        <TextInput
                          ref={nameInputRef}
                          style={styles.textInput}
                          placeholder="Enter customers name"
                          placeholderTextColor={COLORS.text.muted}
                          value={name}
                          onChangeText={handleNameChange}
                          onFocus={() => {
                            setIsKeyboardVisible(true);
                            if (name.trim().length >= 1 && searchResults.length > 0) {
                              setShowSearchResults(true);
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowSearchResults(false), 300);
                          }}
                          autoCorrect={false}
                          spellCheck={false}
                          autoComplete="off"
                        />
                      </View>
                    </TouchableOpacity>

                    {showSearchResults && searchResults.length > 0 && (
                      <View style={styles.dropdownContainer}>
                        <View style={styles.dropdownHeader}>
                          <Text style={styles.dropdownHeaderText}>Select Customer</Text>
                          <TouchableOpacity onPress={() => setShowSearchResults(false)}>
                            <X size={ms(20)} color="#000" />
                          </TouchableOpacity>
                        </View>
                        <ScrollView
                          keyboardShouldPersistTaps="always"
                          style={styles.autocompleteScroll}>
                          {searchResults.map((item, index) => (
                            <TouchableOpacity
                              key={`${item.phone}_${index}`}
                              style={styles.autocompleteItem}
                              onPress={() => {
                                isSelectingFromResults.current = true;
                                setName(item.name);
                                const cleanPhone = item.phone.replace(/[^\d]/g, "").slice(-10);
                                setPhone(cleanPhone);
                                setSearchResults([]);
                                setShowSearchResults(false);
                              }}>
                              <Text style={styles.autocompleteTextLeft}>{item.name}</Text>
                              <Text style={styles.autocompleteTextRight}>{item.phone}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* PAYMENT DETAILS */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Wallet size={ms(20)} color="#000" />
                    <Text weight="bold" style={styles.sectionTitle}>
                      PAYMENT DETAILS
                    </Text>
                  </View>
                  <View style={styles.grid}>
                    <TouchableOpacity
                      style={styles.gridCard}
                      activeOpacity={1}
                      onPress={() => totalPaymentRef.current?.focus()}>
                      <View style={styles.iconBox}>
                        <Wallet size={ms(18)} color="#4A80F0" />
                      </View>
                      <View style={styles.gridCardContent}>
                        <Text style={styles.gridCardLabel}>Total Amount</Text>
                        <View style={styles.currencyRow}>
                          <Text style={styles.currencySymbol}>₹</Text>
                          <TextInput
                            ref={totalPaymentRef}
                            style={styles.amountInput}
                            placeholder={isFarmhouse ? "1000" : "2500"}
                            placeholderTextColor={COLORS.text.muted}
                            keyboardType="numeric"
                            value={totalPayment}
                            onFocus={() => setIsKeyboardVisible(true)}
                            onChangeText={setTotalPayment}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.gridCard}
                      activeOpacity={1}
                      onPress={() => advancePaymentRef.current?.focus()}>
                      <View style={styles.iconBoxGreen}>
                        <MoneySvg width={ms(18)} height={ms(18)} color="#00B562" />
                      </View>
                      <View style={styles.gridCardContent}>
                        <Text style={styles.gridCardLabel}>Advance</Text>
                        <View style={styles.currencyRow}>
                          <Text style={styles.currencySymbol}>₹</Text>
                          <TextInput
                            ref={advancePaymentRef}
                            style={styles.amountInput}
                            placeholder="0"
                            placeholderTextColor="#8C8C8C"
                            keyboardType="numeric"
                            value={advancePaid}
                            onFocus={() => {
                              setIsAdvanceActive(true);
                              setIsKeyboardVisible(true);
                            }}
                            onChangeText={text => {
                              const val = parseFloat(text) || 0;
                              const total = parseFloat(totalPayment) || 0;
                              if (val > total) setAdvancePaid(total.toString());
                              else setAdvancePaid(text);
                            }}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {isAdvanceActive || parseFloat(advancePaid) > 0 ? (
                    <View style={{ marginTop: vs(16) }}>
                      <Text weight="bold" style={styles.inputLabelText}>
                        Method
                      </Text>
                      <View style={styles.methodsRow}>
                        {/* Cash */}
                        <TouchableOpacity
                          style={[
                            styles.methodBox,
                            selectedMethod === "cash" && styles.methodBoxSelectedBlue,
                          ]}
                          onPress={() => setSelectedMethod("cash")}>
                          <Image
                            source={icCash}
                            style={[
                              styles.methodIcon,
                              selectedMethod === "cash" && styles.methodIconSelected,
                            ]}
                          />
                          <Text
                            style={[
                              styles.methodText,
                              selectedMethod === "cash" && styles.methodTextSelected,
                            ]}>
                            Cash
                          </Text>
                        </TouchableOpacity>
                        {/* GPay */}
                        <TouchableOpacity
                          style={[
                            styles.methodBox,
                            selectedMethod === "gpay" && styles.methodBoxSelectedBlue,
                          ]}
                          onPress={() => setSelectedMethod("gpay")}>
                          <Image
                            source={icGpay}
                            style={[
                              styles.methodIcon,
                              selectedMethod === "gpay" && styles.methodIconSelected,
                            ]}
                          />
                          <Text
                            style={[
                              styles.methodText,
                              selectedMethod === "gpay" && styles.methodTextSelected,
                            ]}>
                            GPay
                          </Text>
                        </TouchableOpacity>
                        {/* PhonePe */}
                        <TouchableOpacity
                          style={[
                            styles.methodBox,
                            selectedMethod === "phonepe" && styles.methodBoxSelectedBlue,
                          ]}
                          onPress={() => setSelectedMethod("phonepe")}>
                          <Image
                            source={icPhonepe}
                            style={[
                              styles.methodIcon,
                              selectedMethod === "phonepe" && styles.methodIconSelected,
                            ]}
                          />
                          <Text
                            style={[
                              styles.methodText,
                              selectedMethod === "phonepe" && styles.methodTextSelected,
                            ]}>
                            PhonePe
                          </Text>
                        </TouchableOpacity>
                        {/* Paytm */}
                        <TouchableOpacity
                          style={[
                            styles.methodBox,
                            selectedMethod === "paytm" && styles.methodBoxSelectedBlue,
                          ]}
                          onPress={() => setSelectedMethod("paytm")}>
                          <Image
                            source={icPaytm}
                            style={[
                              styles.methodIcon,
                              selectedMethod === "paytm" && styles.methodIconSelected,
                            ]}
                          />
                          <Text
                            style={[
                              styles.methodText,
                              selectedMethod === "paytm" && styles.methodTextSelected,
                            ]}>
                            Paytm
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              {!isKeyboardVisible && (
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, vs(16)) }]}>
                  <TouchableOpacity
                    style={styles.bookNowBtn}
                    onPress={handleBookNow}
                    disabled={isLoading}>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text weight="bold" family="bison" style={styles.bookNowBtnText}>
                        BOOK NOW
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {isKeyboardVisible && (
                <View
                  style={{
                    alignItems: "flex-end",
                    padding: hs(10),
                    paddingBottom: vs(10),
                    backgroundColor: "transparent",
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: COLORS.primary,
                      width: ms(44),
                      height: ms(44),
                      borderRadius: ms(10),
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                    onPress={() => Keyboard.dismiss()}>
                    <ArrowRightToLine size={ms(24)} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>

        <CustomDatePickerModal
          isVisible={!!showDatePicker}
          onClose={() => setShowDatePicker(null)}
          selectedDate={showDatePicker === "in" ? checkInDate : checkOutDate}
          onSelectDate={onDateChange}
          minDate={
            showDatePicker === "in"
              ? new Date()
              : new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1))
          }
          blockedDates={
            showDatePicker === "out"
              ? blockedDates.filter(d => {
                  const dateObj = new Date(d);
                  dateObj.setDate(dateObj.getDate() - 1);
                  const prevDateStr = formatYMD(dateObj);
                  return blockedDates.includes(prevDateStr);
                })
              : blockedDates
          }
          bookingDots={bookingDots}
          useModal={false}
        />

        {!!activeDropdown && (
          <View style={[StyleSheet.absoluteFill, styles.overlayWrapper]}>
            <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
              <View style={styles.overlayInner}>
                <TouchableWithoutFeedback>
                  <View
                    style={[
                      styles.dropdownMenu,
                      dropdownLayout
                        ? [
                            styles.dropdownAbsolute,
                            {
                              top: dropdownLayout.top,
                              left: dropdownLayout.left,
                              width: dropdownLayout.width,
                            },
                          ]
                        : {},
                    ]}>
                    <View style={styles.dropdownHeader2}>
                      <Text style={styles.dropdownTitle}>{activeDropdown?.title}</Text>
                      <TouchableOpacity
                        onPress={() => setActiveDropdown(null)}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                        <X size={ms(20)} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView showsVerticalScrollIndicator={true} style={styles.dropdownScroll}>
                      {activeDropdown?.options.map(option => {
                        const isOverLimit =
                          activeDropdown.type === "guestCount" &&
                          parseInt(option, 10) > maxStandardGuests;

                        let isSelected = false;
                        if (activeDropdown.type === "guestCount")
                          isSelected = guestCount === option;
                        if (activeDropdown.type === "groupType") isSelected = groupType === option;
                        if (activeDropdown.type === "roomType") isSelected = roomType === option;
                        if (activeDropdown.type === "bookingFor")
                          isSelected = bookingFor === option;
                        if (activeDropdown.type === "unitCount")
                          isSelected = unitCount === option.split(" ")[0];

                        return (
                          <TouchableOpacity
                            key={option}
                            style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                            onPress={() => handleDropdownSelect(option)}>
                            <Text
                              style={[
                                styles.dropdownItemText,
                                option.includes("(Booked)") && { color: COLORS.danger },
                                isOverLimit && { color: COLORS.danger },
                              ]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.background },
  sheetContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: vs(50),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: hs(16),
    marginBottom: vs(24),
  },
  backButton: { marginRight: hs(12), marginLeft: -hs(8) },
  avatarPlaceholder: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: "#ccc",
    marginRight: hs(12),
  },
  headerTitleWrap: { flex: 1, justifyContent: "center", marginTop: vs(10) },
  title: { fontSize: fs(20), color: COLORS.text.primary, fontFamily: "Gilroy-Bold" },
  subtitle: { fontSize: fs(14), color: "#000", fontFamily: "Gilroy-Medium" },

  scrollContent: { paddingHorizontal: hs(16), paddingBottom: vs(24) },

  section: { marginBottom: vs(24) },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    marginBottom: vs(12),
  },
  sectionTitle: { fontSize: fs(16), color: "#000", fontFamily: "Gilroy-Bold" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: hs(12),
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  gridCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF3FC",
    borderRadius: ms(12),
    padding: ms(10),
    marginBottom: vs(12),
  },
  iconBox: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#CBDFFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(10),
  },
  iconBoxGreen: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#D6FFE9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(10),
  },
  gridCardContent: { flex: 1 },
  gridCardLabel: {
    fontSize: fs(16),
    color: "#000",
    fontFamily: "Gilroy-Bold",
    marginBottom: vs(2),
  },
  gridCardValue: { fontSize: fs(16), color: "#444", fontFamily: "Gilroy-Medium" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF3FC",
    borderRadius: ms(12),
    padding: ms(12),
    marginBottom: vs(12),
  },
  inputIconBox: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#CBDFFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
  },
  inputContent: { flex: 1, justifyContent: "center" },
  inputLabelText: {
    fontSize: fs(16),
    color: "#000",
    fontFamily: "Gilroy-Bold",
    marginBottom: vs(2),
  },
  phoneInputRow: { flexDirection: "row", alignItems: "center" },
  phonePrefix: {
    fontSize: fs(16),
    color: "#8C8C8C",
    fontFamily: "Gilroy-Medium",
    marginRight: hs(4),
  },
  textInput: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(16),
    color: COLORS.text.primary,
    flex: 1,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  currencyRow: { flexDirection: "row", alignItems: "center" },
  currencySymbol: {
    fontSize: fs(16),
    color: "#000",
    fontFamily: "Gilroy-Medium",
    marginRight: hs(2),
  },
  amountInput: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(18),
    color: COLORS.text.primary,
    flex: 1,
    paddingVertical: 0,
    includeFontPadding: false,
  },

  methodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(16),
    marginTop: vs(8),
    gap: hs(8),
  },
  methodBox: {
    flex: 1,
    height: vs(75),
    backgroundColor: "#F4F7FB",
    borderRadius: ms(8),
    alignItems: "center",
    justifyContent: "center",
    padding: ms(4),
  },
  methodBoxSelectedBlue: {
    backgroundColor: "#63a1fd",
  },
  methodIcon: {
    width: ms(32),
    height: ms(32),
    resizeMode: "contain",
  },
  methodIconSelected: {
    tintColor: "",
  },
  methodText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(12),
    color: "#000000",
    marginTop: vs(4),
  },
  methodTextSelected: {
    color: "#FFFFFF",
  },
  autocompleteWrapper: { zIndex: 10, ...Platform.select({ ios: { zIndex: 10 } }) },

  dropdownContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: ms(8),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
    marginTop: vs(4),
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownHeaderText: { fontSize: fs(14), fontFamily: "Gilroy-Bold", color: "#000" },
  autocompleteScroll: { maxHeight: vs(150) },
  autocompleteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  autocompleteTextLeft: { fontSize: fs(14), fontFamily: "Gilroy-Medium", color: "#000" },
  autocompleteTextRight: { fontSize: fs(14), fontFamily: "Gilroy-Medium", color: "#666" },

  footer: {
    paddingTop: vs(12),
    marginBottom: vs(10),
    paddingHorizontal: hs(18),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderColor: "#EBEBEB",
  },
  bookNowBtn: {
    backgroundColor: "#000000",
    borderRadius: ms(12),
    height: vs(60),
    justifyContent: "center",
    alignItems: "center",
  },
  bookNowBtnText: { color: "#FFFFFF", fontSize: fs(24), textTransform: "uppercase" },

  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: ms(12),
    paddingBottom: ms(8),
    width: ms(200),
    maxHeight: vs(300),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: ms(16),
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    marginBottom: vs(8),
  },
  dropdownTitle: { fontSize: fs(14), fontFamily: "Gilroy-Bold", color: "#000" },
  dropdownScroll: { maxHeight: vs(250) },
  dropdownItem: {
    paddingVertical: vs(10),
    paddingHorizontal: ms(12),
    marginHorizontal: ms(8),
    borderRadius: ms(8),
    minHeight: vs(35),
    justifyContent: "center",
    marginBottom: vs(2),
  },
  dropdownItemSelected: {
    backgroundColor: "#E6E6E6",
  },
  dropdownItemText: { fontSize: fs(14), fontFamily: "Gilroy-Medium", color: "#000" },
  halfWidth: { width: "48%" },
  fullWidth: { width: "100%" },
  extraGuestText: {
    fontSize: fs(13),
    color: COLORS.danger,
    marginTop: vs(-8),
    marginBottom: vs(8),
    fontFamily: "Gilroy-Medium",
    paddingHorizontal: hs(4),
  },
  overlayWrapper: { zIndex: 9999, elevation: 9999 },
  overlayInner: { flex: 1, backgroundColor: "transparent" },
  dropdownAbsolute: { position: "absolute" },
});
