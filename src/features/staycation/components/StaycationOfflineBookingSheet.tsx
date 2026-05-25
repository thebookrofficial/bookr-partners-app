// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { Text } from "@/components/ui";
import { User, Phone, Calendar, ChevronDown, Wallet, Hash } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { supabase } from "@/lib/supabase";
import { useCreateStaycationOfflineBooking } from "../hooks/useCreateStaycationOfflineBooking";

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

// 1. Move this OUTSIDE the component (e.g., above the component definition)
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

  const [bookingFor, setBookingFor] = useState(isFarmhouse ? "Farmhouse" : "Cottages");
  const [roomType, setRoomType] = useState("");
  const [unitCount, setUnitCount] = useState("1");
  const [guestCount, setGuestCount] = useState("2");
  const [groupType, setGroupType] = useState("Family");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [totalPayment, setTotalPayment] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");

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

  const [roomConfigs, setRoomConfigs] = useState<Record<string, RoomConfig>>({});
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [availableUnitsForCurrentDates, setAvailableUnitsForCurrentDates] = useState<number>(1);
  const [farmhouseConfig, setFarmhouseConfig] = useState<{
    basePrice: number;
    extraCharge: number;
    maxOccupancy: number;
  } | null>(null);

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // --- Derived Values for Dynamic Guest Logic ---
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
  const totalExtraCharge = isFarmhouse
    ? extraGuestsCount * (farmhouseConfig?.extraCharge || 0)
    : activeRoomConfig
    ? extraGuestsCount * activeRoomConfig.extraGuestCharge
    : 0;
  const currentInventoryCount = activeRoomConfig ? activeRoomConfig.totalInventory : 1;

  // Fetch Farmhouse Config
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

  // Auto-calculation for Total Payment
  // Unified Auto-calculation
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
      // Rooms calculation: (Price * Units * Nights) + Extra Guest Charges
      const baseCost = activeRoomConfig.pricePerNight * unitsInt * nights;
      const extraCost = extraGuestsCount * activeRoomConfig.extraGuestCharge * nights;
      total = baseCost + extraCost;
    }

    // Only update if the value actually changed to prevent unnecessary re-renders
    if (total > 0 && total.toString() !== totalPayment) {
      setTotalPayment(total.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFarmhouse,
    farmhouseConfig,
    activeRoomConfig, // Tracks room price changes
    guestCount,
    checkInDate,
    checkOutDate,
    extraGuestsCount,
    unitsInt, // Tracks unit count changes
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

  // Track exactly how many units are available for the currently selected Check In/Out dates
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

      const dateCounts: Record<string, number> = {};
      const dInStr = formatYMD(checkInDate);
      const dOutStr = formatYMD(checkOutDate);

      // Fetch Bookings with unit_count!
      const { data: bookings } = await supabase
        .from("staycation_bookings")
        .select("check_in_date, check_out_date, unit_count")
        .eq("venue_id", venueId)
        .in("room_id", roomIds)
        .neq("booking_status", "cancelled")
        .lt("check_in_date", dOutStr)
        .gt("check_out_date", dInStr);

      bookings?.forEach(b => {
        let curr = new Date(b.check_in_date);
        const end = new Date(b.check_out_date);
        while (curr < end) {
          const dStr = formatYMD(curr);
          if (dStr >= dInStr && dStr < dOutStr) {
            // CRITICAL FIX: Add b.unit_count instead of just +1
            dateCounts[dStr] = (dateCounts[dStr] || 0) + (b.unit_count || 1);
          }
          curr.setDate(curr.getDate() + 1);
        }
      });

      let maxOccupied = 0;
      for (const count of Object.values(dateCounts)) {
        if (count > maxOccupied) maxOccupied = count;
      }

      // Check for Closed Dates
      // Let's just fetch all and check overlap manually to be safe if query is complex
      const { data: allClosed } = await supabase
        .from("venue_closed_dates")
        .select("start_date, end_date")
        .eq("venue_id", venueId);

      let isClosedInRange = false;
      allClosed?.forEach(c => {
        const cStart = c.start_date;
        const cEnd = c.end_date || c.start_date;
        if (cStart < dOutStr && cEnd >= dInStr) {
          isClosedInRange = true;
        }
      });

      if (isClosedInRange) {
        setAvailableUnitsForCurrentDates(0);
      } else {
        setAvailableUnitsForCurrentDates(Math.max(0, roomIds.length - maxOccupied));
      }
    };

    fetchAvailabilityForDates();
  }, [venueId, roomType, checkInDate, checkOutDate, isFarmhouse, visible]);

  // Ensure guestCount resets if units change and current guest count exceeds new max
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
        const { data: blocks } = await supabase
          .from("staycation_availability")
          .select("date")
          .eq("venue_id", venueId)
          .eq("is_blocked", true)
          .gte("date", todayStr);
        blocks?.forEach(b => dates.add(b.date));

        const { data: bookings } = await supabase
          .from("staycation_bookings")
          .select("check_in_date, check_out_date")
          .eq("venue_id", venueId)
          .eq("booking_type", "full_property")
          .neq("booking_status", "cancelled")
          .gte("check_out_date", todayStr);

        bookings?.forEach(b => {
          let curr = new Date(b.check_in_date);
          const end = new Date(b.check_out_date);
          while (curr < end) {
            dates.add(formatYMD(curr));
            curr.setDate(curr.getDate() + 1);
          }
        });

        // 3. Fetch Closed Dates
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

        // Fixed TypeScript Error: Added unit_count to the select statement
        const { data: bookings } = await supabase
          .from("staycation_bookings")
          .select("check_in_date, check_out_date, unit_count")
          .eq("venue_id", venueId)
          .in("room_id", roomIds)
          .neq("booking_status", "cancelled")
          .gte("check_out_date", todayStr);

        bookings?.forEach(b => {
          let curr = new Date(b.check_in_date);
          const end = new Date(b.check_out_date);
          while (curr < end) {
            const dStr = formatYMD(curr);
            // CRITICAL FIX: Add b.unit_count instead of just +1
            dateCounts[dStr] = (dateCounts[dStr] || 0) + (b.unit_count || 1);
            curr.setDate(curr.getDate() + 1);
          }
        });

        const fullDates = [];
        for (const [date, count] of Object.entries(dateCounts)) {
          // Block if the remaining rooms are less than the units we want to book
          if (totalRoomsOfType - count < unitsInt) {
            fullDates.push(date);
          }
        }
        setBlockedDates(fullDates);
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
      } catch (err) {
        // Fallback silently on error
      }
    };
    lookupGuest();
  }, [phone]);

  useEffect(() => {
    setBookingFor(isFarmhouse ? "Farmhouse" : "Rooms");
    setUnitCount("1");
    setGuestCount(isFarmhouse ? "10" : "2");
    setTotalPayment("");
    setName("");
    setPhone("");
    setAdvancePaid("");
  }, [isFarmhouse, visible]);

  // Add this effect to StaycationOfflineBookingSheet.tsx
  useEffect(() => {
    if (!visible || isFarmhouse || !venueId || !roomType) return;

    const findFirstAvailableDate = async () => {
      let checkDate = new Date(); // Start from today
      // let found = false;

      // Safety break at 30 days to prevent infinite loops
      for (let i = 0; i < 30; i++) {
        const dStr = formatYMD(checkDate);

        // We need to check if this specific date has availability
        // Re-using similar logic to your block calculation
        const { data: bookings } = await supabase
          .from("staycation_bookings")
          .select("check_in_date, check_out_date, unit_count")
          .eq("venue_id", venueId)
          .neq("booking_status", "cancelled")
          .lte("check_in_date", dStr)
          .gt("check_out_date", dStr);

        const totalOccupied = bookings?.reduce((acc, b) => acc + (b.unit_count || 1), 0) || 0;

        // Assume totalInventory is available in roomConfigs
        const totalInventory = Object.values(roomConfigs).reduce(
          (acc, c) => acc + c.totalInventory,
          0,
        );

        if (totalOccupied < totalInventory) {
          setCheckInDate(checkDate);
          const tomorrow = new Date(checkDate);
          tomorrow.setDate(tomorrow.getDate() + 1);
          setCheckOutDate(tomorrow);
          // found = true;
          break;
        }

        checkDate.setDate(checkDate.getDate() + 1);
      }
    };

    findFirstAvailableDate();
  }, [visible, isFarmhouse, venueId, roomType, roomConfigs]);

  const handleDropdownSelect = (option: string) => {
    if (!activeDropdown) return;
    if (activeDropdown.type === "bookingFor") setBookingFor(option);
    if (activeDropdown.type === "roomType") setRoomType(option);
    if (activeDropdown.type === "guestCount") setGuestCount(option);
    if (activeDropdown.type === "groupType") setGroupType(option);

    if (activeDropdown.type === "unitCount") {
      if (option.includes("(Booked)")) {
        Alert.alert(
          "Unavailable",
          "You cannot select this many units for the chosen dates. They are already booked.",
        );
        return;
      }
      // Strip "(Booked)" out if we ever manually bypass the alert, just to be safe
      const cleanValue = option.split(" ")[0];
      setUnitCount(cleanValue);
    }

    setActiveDropdown(null);
  };

  const handleBookNow = async () => {
    if (isLoading) {
      console.warn("[DEBUG: UI] Prevented double submission!");
      return;
    }
    if (!venueId) {
      Alert.alert("Error", "Venue information missing.");
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

    const finalName = name.trim();
    const finalPhone = phone.trim();

    if (!finalName) {
      Alert.alert("Error", "Please enter the guest name.");
      return;
    }

    if (!finalPhone) {
      Alert.alert("Error", "Please enter the mobile number.");
      return;
    }

    if (!totalPayment.trim() || isNaN(parseFloat(totalPayment))) {
      Alert.alert("Error", "Please enter a valid total payment amount.");
      return;
    }

    if (!advancePaid.trim() || isNaN(parseFloat(advancePaid))) {
      Alert.alert("Error", "Please enter the advance paid amount. Enter 0 if none.");
      return;
    }

    const result = await createBooking({
      venueId,
      guestName: finalName,
      guestPhone: finalPhone,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      guestCount: currentGuestInt,
      totalPayment: parseFloat(totalPayment) || 0,
      advancePaid: parseFloat(advancePaid) || 0,
      bookingType: bookingFor.toLowerCase(),
      roomType: isFarmhouse ? undefined : roomType,
      roomId: undefined,
      groupType: isFarmhouse ? groupType : undefined,
      unitCount: isFarmhouse ? 1 : unitsInt,
    });

    if (result.success) {
      const dueAmount = (parseFloat(totalPayment) || 0) - (parseFloat(advancePaid) || 0);
      const shareMessage = `Booking Confirmed! 🎉
Hi ${finalName},
Your slot at ${result.venueName || "our venue"} is locked in via Bookr.
Date: ${formatDateLabel(checkInDate)} to ${formatDateLabel(checkOutDate)}
Payment Summary:
Total: ₹${totalPayment || 0}
Paid: ₹${advancePaid || 0}
Due at Venue: ₹${dueAmount}
Thank you for booking with Bookr!`;

      try {
        await Share.share({ message: shareMessage });
      } catch (error) {
        // Fallback silently
      }

      Alert.alert("Success", "Offline booking created successfully.");
      onSuccess?.();
      onClose();
    } else {
      Alert.alert("Error", "Failed to create booking. Please check availability.");
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      const dateStr = formatYMD(selectedDate);
      if (showDatePicker === "in") {
        if (blockedDates.includes(dateStr)) {
          Alert.alert("Date Unavailable", "Not enough rooms available for the selected dates.");
          setShowDatePicker(null);
          return;
        }
        const newCheckIn = selectedDate;
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1); // Force checkout to be at least tomorrow

        setCheckInDate(newCheckIn);
        setCheckOutDate(nextDay);
        // setCheckInDate(selectedDate);
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
    }
    setShowDatePicker(null);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent={true}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

          <View style={styles.sheetContainer}>
            <View style={styles.header}>
              <Text weight="bold" style={styles.title}>
                OFFLINE BOOKING
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <User size={ms(20)} color={COLORS.text.primary} />
                  <Text weight="medium" style={styles.label}>
                    Name
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Yash"
                    placeholderTextColor={COLORS.text.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Mobile No */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Phone size={ms(20)} color={COLORS.text.primary} />
                  <Text weight="medium" style={styles.label}>
                    Mobile No
                  </Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 78349 89934"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* Booking For & Type (OR Units) */}
              {!isFarmhouse && (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Hash size={ms(20)} color={COLORS.text.primary} />
                      <Text weight="medium" style={styles.label}>
                        No. of Units
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownWrapper}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveDropdown({
                          type: "unitCount",
                          options: Array.from({ length: currentInventoryCount }, (_, i) => {
                            const num = i + 1;
                            const isAvailable = num <= availableUnitsForCurrentDates;
                            return `${num}${isAvailable ? "" : " (Booked)"}`;
                          }),
                          title: `Select Units (${availableUnitsForCurrentDates} Available)`,
                        })
                      }>
                      <Text weight="semiBold" style={styles.dropdownText}>
                        {unitCount}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text weight="medium" style={styles.label}>
                        Type
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownWrapper}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveDropdown({
                          type: "roomType",
                          options: Object.keys(roomConfigs),
                          title: "Select Room Type",
                        })
                      }>
                      <Text weight="semiBold" style={styles.dropdownText}>
                        {roomType}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Check In & Check Out */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Calendar size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Check In
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker("in")}>
                    <Text weight="semiBold" style={styles.inputText}>
                      {formatDateLabel(checkInDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Calendar size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Check Out
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.inputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker("out")}>
                    <Text weight="semiBold" style={styles.inputText}>
                      {formatDateLabel(checkOutDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Guest Selection */}
              {isFarmhouse ? (
                <View style={styles.row}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <User size={ms(20)} color={COLORS.text.primary} />
                      <Text weight="medium" style={styles.label}>
                        Select Guest
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownWrapper}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveDropdown({
                          type: "guestCount",
                          options: Array.from({ length: 20 }, (_, i) => (i + 1).toString()),
                          title: "Select Guest Count",
                        })
                      }>
                      <Text weight="semiBold" style={styles.dropdownText}>
                        {guestCount}{" "}
                        {extraGuestsCount > 0 && (
                          <Text style={{ color: COLORS.danger }}>({extraGuestsCount} Extra)</Text>
                        )}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    {extraGuestsCount > 0 && (
                      <Text style={styles.extraChargeText}>
                        Extra Guest Charge: ₹{totalExtraCharge}
                      </Text>
                    )}
                  </View>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <User size={ms(20)} color={COLORS.text.primary} />
                      <Text weight="medium" style={styles.label}>
                        Group Type
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dropdownWrapper}
                      activeOpacity={0.7}
                      onPress={() =>
                        setActiveDropdown({
                          type: "groupType",
                          options: ["Family", "Friends", "Corporate", "Couple", "Other"],
                          title: "Select Group Type",
                        })
                      }>
                      <Text weight="medium" style={styles.dropdownText}>
                        {groupType}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <User size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Select Guest
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dropdownWrapper}
                    activeOpacity={0.7}
                    onPress={() =>
                      setActiveDropdown({
                        type: "guestCount",
                        options: Array.from({ length: Math.max(1, totalAllowedGuests) }, (_, i) =>
                          (i + 1).toString(),
                        ),
                        title: "Select Guest Count",
                      })
                    }>
                    <Text weight="medium" style={styles.dropdownText}>
                      Select the number of Guest
                    </Text>
                    <View style={styles.guestCountRight}>
                      <Text weight="semiBold" style={styles.guestCountNum}>
                        {guestCount}{" "}
                        {extraGuestsCount > 0 && (
                          <Text style={{ color: COLORS.danger }}>({extraGuestsCount} Extra)</Text>
                        )}
                      </Text>
                      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
                    </View>
                  </TouchableOpacity>
                  {extraGuestsCount > 0 && (
                    <Text style={styles.extraChargeText}>
                      Extra Guest Charge: ₹{totalExtraCharge}
                    </Text>
                  )}
                </View>
              )}

              {/* Payment Details */}
              <View style={styles.row}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Wallet size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Total Payment
                    </Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder={isFarmhouse ? "₹ 1000" : "₹ 2500"}
                      placeholderTextColor={COLORS.text.muted}
                      keyboardType="numeric"
                      value={totalPayment}
                      onChangeText={setTotalPayment}
                    />
                  </View>
                </View>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Wallet size={ms(20)} color={COLORS.text.primary} />
                    <Text weight="medium" style={styles.label}>
                      Advance Paid
                    </Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="₹ 0"
                      placeholderTextColor="#8C8C8C"
                      keyboardType="numeric"
                      value={advancePaid}
                      onChangeText={setAdvancePaid}
                    />
                  </View>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.bookNowButton}
                activeOpacity={0.8}
                onPress={handleBookNow}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text weight="bold" family="bison" style={styles.bookNowText}>
                    Book Now
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "in" ? checkInDate : checkOutDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={
            showDatePicker === "in"
              ? new Date()
              : new Date(new Date(checkInDate).setDate(checkInDate.getDate() + 1))
          }
        />
      )}

      {/* Dropdown Modal overlay */}
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdown(null)}>
        <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
          <View style={styles.dropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dropdownMenu}>
                <Text variant="h3" weight="bold" style={styles.dropdownTitle}>
                  {activeDropdown?.title}
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={styles.dropdownScroll}>
                  {activeDropdown?.options.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownItem}
                      onPress={() => handleDropdownSelect(option)}>
                      <Text
                        variant="body1"
                        weight="medium"
                        style={[
                          styles.dropdownItemText,
                          option.includes("(Booked)") && { color: COLORS.danger },
                        ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 0.4)" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: hs(16),
    paddingTop: vs(20),
    paddingBottom: vs(30),
    maxHeight: "90%",
  },
  header: { marginBottom: vs(16) },
  title: { fontSize: fs(16), color: COLORS.text.primary, textTransform: "uppercase" },
  scrollContent: { gap: vs(16) },
  inputGroup: { gap: vs(8) },
  row: { flexDirection: "row", gap: hs(16) },
  col: { flex: 1, gap: vs(8) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  label: { fontSize: fs(14), color: COLORS.text.primary, textTransform: "capitalize" },
  inputWrapper: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    height: vs(44),
    justifyContent: "center",
  },
  textInput: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: COLORS.text.primary,
    padding: 0,
    margin: 0,
  },
  inputText: { fontSize: fs(14), color: COLORS.text.primary },
  dropdownWrapper: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    height: vs(44),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: { fontSize: fs(14), color: COLORS.text.primary, flex: 1 },
  mutedText: { color: "#8C8C8C" },
  guestCountRight: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  guestCountNum: { fontSize: fs(14), color: COLORS.text.primary },
  extraChargeText: { fontSize: fs(12), color: COLORS.danger, marginTop: vs(2), textAlign: "right" },
  bookNowButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(50),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(16),
  },
  bookNowText: { color: "#FFFFFF", fontSize: fs(20), textTransform: "uppercase" },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: hs(30),
  },
  dropdownMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: ms(12),
    padding: ms(16),
    maxHeight: vs(300),
  },
  dropdownTitle: { marginBottom: vs(12), textAlign: "center" },
  dropdownScroll: { maxHeight: vs(250) },
  dropdownItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#F4F7FC",
    alignItems: "center",
  },
  dropdownItemText: { color: COLORS.text.primary },
});
