// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useKeyboardStore } from "@/store/keyboardStore";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { Text, GlobalKeyboardAccessory } from "@/components/ui";
import {
  Calendar as CalendarIcon,
  Phone,
  User as UserIcon,
  Clock,
  FileText,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Wallet,
  X,
} from "lucide-react-native";
import { TextInput as RNTextInput } from "react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const icGpay = require("@/assets/icons/google-pay.png");
const icPhonepe = require("@/assets/icons/icons8-phone-pe-48.png");
const icPaytm = require("@/assets/icons/paytm.png");
const icCash = require("@/assets/icons/pay-50.png");
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { Calendar } from "react-native-calendars";
import { TimePickerModal } from "./TimePickerModal";
import { z } from "zod";
import { SportsService } from "../services/sports.service";
import { generateTimeSlots, parseTimeTo24Hour } from "../utils/time.utils";
import { calculateSlotPrice } from "../utils/pricing.utils";
import { getShortGroundName } from "../hooks/useSportsHome";
import perf from "@react-native-firebase/perf";
import { useDebounce } from "@/hooks/useDebounce";

interface OfflineBookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  venueId: string;
  _groundId: string;
  selectedDate: Date;
  onSuccess: (optimisticData?: any) => Promise<void> | void;
  onCheckHistory?: () => void;
  _sportsType: string;
}

const offlineBookingSchema = z
  .object({
    mobile: z.string().optional().or(z.literal("")),
    name: z.string().optional().or(z.literal("")),
    totalPayment: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Total payment must be greater than zero.",
    }),
    advancePaid: z
      .string()
      .refine(val => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
        message: "Advance paid must be a valid number.",
      })
      .optional(),
    fromTime: z.string().refine(val => val !== "Start Time", "Please select a Start Time."),
    toTime: z.string().refine(val => val !== "End Time", "Please select an End Time."),
  })
  .refine(
    data => {
      const total = parseFloat(data.totalPayment);
      const advance = parseFloat(data.advancePaid || "0");
      return advance <= total;
    },
    {
      message: "Advance paid cannot exceed total payment.",
      path: ["advancePaid"],
    },
  );

const SectionHeader = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <View style={styles.sectionHeaderRow}>
    <Icon size={ms(20)} color="#000" />
    <Text variant="body1" weight="bold" color="#000">
      {text}
    </Text>
  </View>
);

const FieldBox = ({
  icon: Icon,
  iconColor = "#63A1FD",
  iconBg = "#E8F0FE",
  label,
  value,
  placeholder,
  onPress,
  rightElement,
  isInput = false,
  prefix,
  hasBorder = false,
  style,
  ...textInputProps
}: any) => {
  const inputRef = React.useRef<RNTextInput>(null);
  const setIsNumericFocused = useKeyboardStore(state => state.setIsNumericFocused);
  const isNumericType =
    textInputProps.keyboardType === "numeric" ||
    textInputProps.keyboardType === "number-pad" ||
    textInputProps.keyboardType === "decimal-pad" ||
    textInputProps.keyboardType === "phone-pad";

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isInput && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const content = (
    <View
      style={[styles.fieldBox, hasBorder && styles.fieldBoxBorder, style]}
      pointerEvents={onPress ? "none" : "auto"}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Icon size={ms(18)} color={iconColor} />
      </View>
      <View style={styles.fieldContent}>
        <Text
          variant="body1"
          weight="bold"
          color="#000"
          style={[(isInput || value || placeholder) && { marginBottom: vs(2) }]}>
          {label}
        </Text>
        {isInput ? (
          <View style={styles.customerDetailsHeaderRight}>
            {prefix ? (
              <Text variant="body1" weight="semiBold" color="#000" style={{ marginRight: hs(4) }}>
                {prefix}
              </Text>
            ) : null}
            <RNTextInput
              ref={inputRef}
              style={styles.fieldInput}
              placeholder={placeholder}
              placeholderTextColor={COLORS.text.muted}
              value={value}
              onFocus={e => {
                if (isNumericType) setIsNumericFocused(true);
                textInputProps.onFocus?.(e);
              }}
              onBlur={e => {
                if (isNumericType) setIsNumericFocused(false);
                textInputProps.onBlur?.(e);
              }}
              {...textInputProps}
            />
          </View>
        ) : value || placeholder ? (
          <Text
            variant="body1"
            weight="semiBold"
            color={value && value !== placeholder ? "#000" : COLORS.text.muted}>
            {value || placeholder}
          </Text>
        ) : null}
      </View>
      {rightElement}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={handlePress}
      style={styles.fullWidth}>
      {content}
    </TouchableOpacity>
  );
};

export const OfflineBookingSheet = ({
  isVisible,
  onClose,
  venueId,
  _groundId,
  selectedDate: initialDate,
  onSuccess,
  onCheckHistory,
  _sportsType,
}: OfflineBookingSheetProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const isKeyboardVisible = useKeyboardVisible();

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [totalPayment, setTotalPayment] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [isAdvanceFocused, setIsAdvanceFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">(
    "cash",
  );
  const [bookedHours, setBookedHours] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Guest Autocomplete Search State
  const [searchResults, setSearchResults] = useState<{ name: string; phone: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const isSelectingFromResults = useRef(false);

  // Pricing State
  const [pricing, setPricing] = useState({ day: 0, night: 0, default: 0, slotDurationMinutes: 60 });

  // Hour Selection State
  const [fromTime, setFromTime] = useState("Start Time");
  const [toTime, setToTime] = useState("End Time");
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);

  // Category and Ground state
  const [internalGroundId, setInternalGroundId] = useState<string>(_groundId);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    _sportsType ? _sportsType.toLowerCase().replace(/ /g, "_") : "",
  );
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [allGrounds, setAllGrounds] = useState<any[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isGroundDropdownOpen, setIsGroundDropdownOpen] = useState(false);

  // Database slots cache for exact bounds matching
  const [allDbSlots, setAllDbSlots] = useState<any[]>([]);

  const detectedSlotDuration = useMemo(() => {
    if (allDbSlots.length === 0) {
      return pricing.slotDurationMinutes || 60;
    }
    let minDur = pricing.slotDurationMinutes || 60;
    allDbSlots.forEach((slot: any) => {
      const [sh, sm] = slot.start_time.split(":").map(Number);
      const [eh, em] = slot.end_time.split(":").map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      // FIX: Database sometimes stores end of day slots as 23:59:59
      if (eh === 23 && (em === 59 || em === 58)) {
        diff = 24 * 60 - (sh * 60 + sm);
      }
      if (diff < 0) diff += 24 * 60;
      // Also protect against tiny durations
      if (diff >= 30 && diff < minDur) {
        minDur = diff;
      }
    });
    return minDur;
  }, [allDbSlots, pricing.slotDurationMinutes]);

  const startTimes = useMemo(() => {
    return generateTimeSlots(6, 27, detectedSlotDuration);
  }, [detectedSlotDuration]);

  const endTimes = useMemo(() => {
    return generateTimeSlots(6, 27, detectedSlotDuration);
  }, [detectedSlotDuration]);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const resetForm = useCallback(() => {
    setCurrentDate(initialDate);
    setMobile("");
    setName("");
    setTotalPayment("");
    setAdvancePaid("");
    setFromTime("Start Time");
    setToTime("End Time");
    setHasHistory(false);
    setSearchResults([]);
    setShowSearchResults(false);
    isSelectingFromResults.current = false;
    setIsFetchingSlots(false);
    setAllDbSlots([]);
  }, [initialDate]);

  const handleNameChange = (text: string) => {
    isSelectingFromResults.current = false;
    setName(text);
  };

  const debouncedName = useDebounce(name, 500);

  useEffect(() => {
    const fetchGuests = async () => {
      if (isSelectingFromResults.current) {
        return;
      }

      if (debouncedName.trim().length >= 1) {
        const results = await SportsService.lookupGuestsByName(venueId, debouncedName);
        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };
    fetchGuests();
  }, [debouncedName, venueId]);

  // Fetch all grounds to populate category and ground dropdowns
  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const groundsData = await SportsService.getGrounds(venueId);
        setAllGrounds(groundsData || []);

        const categories = Array.from(
          new Set(groundsData?.map((g: any) => g.sports_type).filter(Boolean)),
        ) as string[];
        setAvailableCategories(categories);

        // Auto-select first available if empty
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        console.error("Error fetching grounds:", err);
      }
    };
    if (isVisible && venueId) {
      fetchGrounds();
    }
  }, [venueId, isVisible, selectedCategory]);

  // Synchronize with external props when sheet opens
  useEffect(() => {
    if (isVisible) {
      // Normalize to DB format (lowercase_underscored) so filter matches sports_type column
      if (_sportsType) setSelectedCategory(_sportsType.toLowerCase().replace(/ /g, "_"));
      if (_groundId) setInternalGroundId(_groundId);
    }
  }, [isVisible, _sportsType, _groundId]);

  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!isVisible || !internalGroundId) {
        setIsFetchingSlots(false);
        return;
      }
      setIsFetchingSlots(true);
      try {
        const dateStr = getLocalDateString(currentDate);
        const allSlots = await SportsService.getAllVenueSlots(venueId, dateStr);

        const parentId = allGrounds.find((g: any) => g.id === internalGroundId)?.parent_ground_id;
        const childIds = allGrounds
          .filter((g: any) => g.parent_ground_id === internalGroundId)
          .map((g: any) => g.id);
        const parentSlots = parentId ? allSlots.filter((s: any) => s.ground_id === parentId) : [];
        const childrenSlots =
          childIds.length > 0 ? allSlots.filter((s: any) => childIds.includes(s.ground_id)) : [];

        const data = allSlots
          .filter((s: any) => s.ground_id === internalGroundId)
          .map((slot: any) => {
            let slotStatus = slot.status;
            if (slotStatus === "available") {
              if (parentId) {
                const matchingParentSlot = parentSlots.find(
                  (ps: any) => ps.start_time <= slot.start_time && ps.end_time > slot.start_time,
                );
                if (matchingParentSlot && matchingParentSlot.status !== "available")
                  slotStatus = "booked";
              }
              if (childIds.length > 0) {
                const matchingChildSlots = childrenSlots.filter(
                  (cs: any) => cs.start_time <= slot.start_time && cs.end_time > slot.start_time,
                );
                if (matchingChildSlots.some((cs: any) => cs.status !== "available"))
                  slotStatus = "booked";
              }
            }
            return { ...slot, status: slotStatus };
          });

        setAllDbSlots(data || []);

        let minDur = pricing.slotDurationMinutes || 60;
        (data || []).forEach((slot: any) => {
          const [sh, sm] = slot.start_time.split(":").map(Number);
          const [eh, em] = slot.end_time.split(":").map(Number);
          let diff = eh * 60 + em - (sh * 60 + sm);
          // FIX: Database sometimes stores end of day slots as 23:59:59
          if (eh === 23 && (em === 59 || em === 58)) {
            diff = 24 * 60 - (sh * 60 + sm);
          }
          if (diff < 0) diff += 24 * 60;
          if (diff >= 30 && diff < minDur) {
            minDur = diff;
          }
        });

        const formattedBooked = (data || [])
          .filter((slot: any) => slot.status !== "available")
          .map((slot: any) => {
            const [h, m] = slot.start_time.split(":");
            const hourInt = parseInt(h, 10);
            const ampm = hourInt >= 12 && hourInt < 24 ? "PM" : "AM";
            let displayHour = hourInt % 12;
            if (displayHour === 0) displayHour = 12;

            if (minDur < 60) {
              return `${displayHour}:${m} ${ampm}`;
            }
            return `${displayHour} ${ampm}`;
          });
        setBookedHours(formattedBooked);
      } catch (err) {
        console.error("Error checking slot availability:", err);
      } finally {
        setIsFetchingSlots(false);
      }
    };
    fetchSlotsData();
  }, [allGrounds, currentDate, internalGroundId, isVisible, pricing.slotDurationMinutes, venueId]);

  const prevGroundId = React.useRef<string | null>(null);

  // Clear form ONLY if the ground actually changes to a different one.
  // Preserve customer details (name & mobile) so the user doesn't have
  // to re-search every time they switch ground or category.
  useEffect(() => {
    if (prevGroundId.current !== null && internalGroundId !== prevGroundId.current) {
      // Only reset time & payment fields, NOT the customer details
      setCurrentDate(initialDate);
      setTotalPayment("");
      setAdvancePaid("");
      setFromTime("Start Time");
      setToTime("End Time");
      setHasHistory(false);
      setAllDbSlots([]);
      setIsFetchingSlots(false);
    }
    prevGroundId.current = internalGroundId;
  }, [internalGroundId, initialDate]);

  useEffect(() => {
    const checkGuest = async () => {
      const cleanMobile = mobile.replace(/[^\d]/g, "");

      // FIX: Trigger lookup if input is 10 digits OR 12 digits (with 91 prefix)
      const isValidLength =
        cleanMobile.length === 10 || (cleanMobile.length === 12 && cleanMobile.startsWith("91"));

      if (!isValidLength) {
        setHasHistory(false);
        return;
      }

      try {
        const { foundName, hasHistory: profileHasHistory } = await SportsService.lookupGuestProfile(
          cleanMobile,
        );

        // Only update if we actually found something to avoid clearing manual typing
        if (foundName) setName(foundName);
        setHasHistory(profileHasHistory);
      } catch (err) {
        console.error("Sheet lookup error:", err);
        setHasHistory(false);
      }
    };
    checkGuest();
  }, [mobile]);

  // Set pricing based on the currently selected ground
  useEffect(() => {
    if (!isVisible || !internalGroundId || allGrounds.length === 0) return;

    const ground = allGrounds.find(g => g.id === internalGroundId);
    if (ground) {
      setPricing({
        day: Number(ground.price_per_slot) || 0,
        night: Number(ground.night_price_per_slot) || Number(ground.price_per_slot) || 0,
        default: Number(ground.price_per_slot) || 0,
        slotDurationMinutes: Number(ground.slot_duration_minutes) || 60,
      });
    }
  }, [internalGroundId, allGrounds, isVisible, isAdvanceFocused]);

  // AUTO-CALCULATE TOTAL PAYMENT
  useEffect(() => {
    if (
      !fromTime ||
      !toTime ||
      fromTime === "Start Time" ||
      toTime === "End Time" ||
      pricing.default === 0
    ) {
      return;
    }

    const startIdx = startTimes.indexOf(fromTime);
    const endIdx = endTimes.indexOf(toTime);

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return;

    const selectedHours = startTimes.slice(startIdx, endIdx);
    let total = 0;

    const ground = allGrounds.find(g => g.id === internalGroundId);

    selectedHours.forEach(hour => {
      const hIdx = startTimes.indexOf(hour);
      // For fallback comparison, find the index of 5 PM or closest match
      const fivePMIdx = startTimes.findIndex(h => h.includes("5 PM") || h.includes("5:00 PM"));
      const boundaryIdx = fivePMIdx !== -1 ? fivePMIdx : startTimes.length / 2;
      const multiplier = (detectedSlotDuration || 60) / 60;

      if (ground && ground.custom_pricing) {
        total += calculateSlotPrice(ground, hour, boundaryIdx, hIdx) * multiplier;
      } else {
        // Safe fallback in case ground object isn't perfectly mapped yet
        if (hIdx < boundaryIdx) {
          total += (pricing.day || pricing.default) * multiplier;
        } else {
          total += (pricing.night || pricing.default) * multiplier;
        }
      }
    });

    setTotalPayment(total.toString());
  }, [
    fromTime,
    toTime,
    pricing,
    startTimes,
    endTimes,
    detectedSlotDuration,
    allGrounds,
    internalGroundId,
  ]);

  const handleBookNow = async () => {
    const cleanMobile = mobile.replace(/[^\d]/g, "");
    const finalName = name.trim() || "Unknown";
    const finalMobile = cleanMobile || "Unknown";

    const validationResult = offlineBookingSchema.safeParse({
      mobile: finalMobile,
      name: finalName,
      totalPayment,
      advancePaid,
      fromTime,
      toTime,
    });

    if (!validationResult.success) {
      Alert.alert("Required Fields", validationResult.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    const trace = await perf().startTrace("create_offline_booking");
    try {
      const formattedDate = getLocalDateString(currentDate);
      const startTime24 = parseTimeTo24Hour(fromTime, false);
      const endTime24 = parseTimeTo24Hour(toTime, true);
      const numericTotal = parseFloat(totalPayment);
      const numericAdvance = parseFloat(advancePaid || "0");

      const bookingParams = {
        venueId,
        groundId: internalGroundId,
        dateStr: formattedDate,
        startTime24,
        endTime24,
        numericTotal,
        advancePaid: numericAdvance,
        paymentMethod: numericAdvance > 0 ? selectedMethod : undefined,
        guestName: finalName,
        guestPhone: finalMobile,
        bookingSource: "offline",
        sportsBookingType: "offline",
        slotDurationMinutes: detectedSlotDuration,
        sportCategory: _sportsType,
      };

      const optimisticBooking = {
        id: `temp-${Date.now()}`,
        name: finalName,
        phone: finalMobile,
        date: formattedDate,
        time: `${fromTime} - ${toTime}`,
        price: numericTotal.toString(),
        status: "Offline",
        isOfflineRecord: true,
        startTimeRaw: startTime24,
        endTimeRaw: endTime24,
        idChain: [],
        sports_booking_type: "offline",
        sports_type: selectedCategory,
        ground_id: internalGroundId,
        rawSubtotal: numericTotal,
        rawPaidAmount: numericAdvance,
        rawDiscountAmount: 0,
      };

      if (onSuccess) onSuccess(optimisticBooking);
      onClose();
      resetForm();

      SportsService.createOfflineBooking(bookingParams)
        .catch((error: any) => {
          Alert.alert("Booking Failed", error.message || "Something went wrong.");
        })
        .finally(async () => {
          await trace.stop();
          setIsSubmitting(false);
        });
    } catch (error: any) {
      Alert.alert("Booking Failed", error.message || "Something went wrong.");
      await trace.stop();
      setIsSubmitting(false);
    }
  };

  // Get current real-world time for disabling past hours
  // Removed unused isToday and currentHour as we now use Date objects directly

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.keyboardAvoid}>
              <View style={styles.bottomSheetContainer}>
                <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
                  </TouchableOpacity>
                  <View style={styles.venueInfo}>
                    <Text variant="h3" weight="bold" color="#000" style={styles.headerTitle}>
                      OFFLINE BOOKING
                    </Text>
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.sheetContent}>
                  <SectionHeader icon={UserIcon} text="CUSTOMER DETAILS" />
                  <FieldBox
                    icon={Phone}
                    label="Mobile No"
                    placeholder="Enter Mobile No"
                    value={mobile}
                    isInput={true}
                    prefix=""
                    keyboardType="phone-pad"
                    onChangeText={(text: string) => {
                      let clean = text.replace(/\D/g, "");
                      setMobile(clean);
                    }}
                  />

                  <View style={styles.autocompleteContainer}>
                    <FieldBox
                      icon={UserIcon}
                      label="Name"
                      placeholder="Enter customers name"
                      value={name}
                      isInput={true}
                      onChangeText={handleNameChange}
                      onFocus={() => {
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
                    {showSearchResults && searchResults.length > 0 && (
                      <View style={styles.dropdownContainer}>
                        <View style={styles.dropdownHeader}>
                          <Text style={styles.dropdownHeaderText}>Select Customer</Text>
                          <TouchableOpacity
                            onPress={() => {
                              setShowSearchResults(false);
                            }}>
                            <X size={ms(20)} color="#000" />
                          </TouchableOpacity>
                        </View>
                        <ScrollView
                          keyboardShouldPersistTaps="always"
                          style={styles.dropdownScroll}>
                          {searchResults.map((item, index) => (
                            <TouchableOpacity
                              key={`${item.name}_${item.phone}_${index}`}
                              style={styles.dropdownItem}
                              onPress={() => {
                                isSelectingFromResults.current = true;
                                setName(item.name);
                                const cleanPhone = item.phone.replace(/[^\d]/g, "").slice(-10);
                                setMobile(cleanPhone);
                                setSearchResults([]);
                                setShowSearchResults(false);
                              }}>
                              <Text style={styles.dropdownItemTextLeft}>{item.name}</Text>
                              <Text style={styles.dropdownItemTextRight}>{item.phone}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={styles.bookingDetailsSection}>
                    <SectionHeader icon={CalendarIcon} text="BOOKING DETAILS" />

                    <View style={[styles.row, styles.zIndex100]}>
                      <View
                        style={[
                          styles.flex1,
                          isCategoryDropdownOpen ? styles.zIndex1000 : styles.zIndex1,
                        ]}>
                        <FieldBox
                          icon={CalendarIcon}
                          label="Category"
                          value={
                            selectedCategory
                              ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                              : ""
                          }
                          onPress={() => {
                            setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                            setIsGroundDropdownOpen(false);
                          }}
                          rightElement={<ChevronDown size={ms(16)} color="#000" />}
                        />
                        {isCategoryDropdownOpen && (
                          <View style={[styles.dropdownContainer, styles.dropdownOverride]}>
                            <ScrollView
                              style={styles.dropdownScroll}
                              nestedScrollEnabled={true}
                              keyboardShouldPersistTaps="handled">
                              {availableCategories.map(cat => (
                                <TouchableOpacity
                                  key={cat}
                                  style={styles.dropdownItem}
                                  onPress={() => {
                                    setSelectedCategory(cat);
                                    setIsCategoryDropdownOpen(false);
                                    // Also include child grounds that have a parent with this sports_type
                                    const catGrounds = allGrounds.filter(g => {
                                      let type = g.sports_type;
                                      if (!type && g.parent_ground_id) {
                                        type = allGrounds.find(
                                          (p: any) => p.id === g.parent_ground_id,
                                        )?.sports_type;
                                      }
                                      return type === cat;
                                    });
                                    if (catGrounds.length > 0) {
                                      setInternalGroundId(catGrounds[0].id);
                                    }
                                  }}>
                                  <Text style={styles.dropdownItemTextLeft}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                      <View
                        style={[
                          styles.flex1,
                          isGroundDropdownOpen ? styles.zIndex1000 : styles.zIndex1,
                        ]}>
                        <FieldBox
                          icon={CalendarIcon}
                          label="Ground"
                          value={
                            getShortGroundName(
                              allGrounds.find(g => g.id === internalGroundId)?.name || "",
                              selectedCategory || "",
                            ) || "Select"
                          }
                          onPress={() => {
                            // Don't open if grounds haven't loaded yet
                            if (allGrounds.length === 0) return;
                            setIsGroundDropdownOpen(!isGroundDropdownOpen);
                            setIsCategoryDropdownOpen(false);
                          }}
                          rightElement={<ChevronDown size={ms(16)} color="#000" />}
                        />
                        {isGroundDropdownOpen &&
                          (() => {
                            const groundsForCategory = allGrounds.filter((g: any) => {
                              let type = g.sports_type;
                              if (!type && g.parent_ground_id) {
                                type = allGrounds.find(
                                  (p: any) => p.id === g.parent_ground_id,
                                )?.sports_type;
                              }
                              return type === selectedCategory;
                            });
                            // Only auto-close if grounds have loaded but none match — prevents
                            // closing on first render when allGrounds is still loading (empty)
                            if (allGrounds.length > 0 && groundsForCategory.length === 0) {
                              setTimeout(() => setIsGroundDropdownOpen(false), 0);
                              return null;
                            }
                            // Still loading — render nothing but keep dropdown open
                            if (allGrounds.length === 0) {
                              return null;
                            }
                            return (
                              <View style={[styles.dropdownContainer, styles.dropdownOverride]}>
                                <ScrollView
                                  style={styles.dropdownScroll}
                                  nestedScrollEnabled={true}
                                  keyboardShouldPersistTaps="handled">
                                  {groundsForCategory.map(ground => (
                                    <TouchableOpacity
                                      key={ground.id}
                                      style={styles.dropdownItem}
                                      onPress={() => {
                                        setInternalGroundId(ground.id);
                                        setIsGroundDropdownOpen(false);
                                      }}>
                                      <Text style={styles.dropdownItemTextLeft} numberOfLines={1}>
                                        {getShortGroundName(ground.name, selectedCategory)}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            );
                          })()}
                      </View>
                    </View>

                    <FieldBox
                      icon={CalendarIcon}
                      label="Date"
                      value={currentDate.toLocaleDateString("en-GB").replace(/\//g, " / ")}
                      onPress={() => setIsDatePickerOpen(true)}
                      rightElement={<ChevronDown size={ms(16)} color="#000" />}
                    />
                    <View style={styles.row}>
                      <View style={styles.flex1}>
                        <FieldBox
                          icon={Clock}
                          label="From"
                          value={fromTime === "Start Time" ? "" : fromTime}
                          placeholder="Start Time"
                          onPress={() => setShowHourPicker("from")}
                        />
                      </View>
                      <View style={styles.flex1}>
                        <FieldBox
                          icon={Clock}
                          label="To"
                          value={toTime === "End Time" ? "" : toTime}
                          placeholder="End Time"
                          onPress={() => setShowHourPicker("to")}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={{ marginTop: vs(16) }}>
                    <SectionHeader icon={Wallet} text="PAYMENT DETAILS" />
                    <View style={styles.row}>
                      <View style={styles.flex1}>
                        <FieldBox
                          icon={Wallet}
                          iconColor="#00B562"
                          iconBg="#E6F7F0"
                          label="Total Amount"
                          placeholder="₹ 1000"
                          value={totalPayment ? `₹${totalPayment}` : ""}
                          isInput={true}
                          keyboardType="numeric"
                          onChangeText={(text: string) =>
                            setTotalPayment(text.replace(/[^\d.]/g, ""))
                          }
                          hasBorder={false}
                        />
                      </View>
                      <View style={styles.flex1}>
                        <FieldBox
                          icon={Wallet}
                          iconColor="#00B562"
                          iconBg="#E6F7F0"
                          label="Advance"
                          placeholder="₹0"
                          value={advancePaid ? `₹${advancePaid}` : ""}
                          isInput={true}
                          keyboardType="numeric"
                          onFocus={() => {
                            setIsAdvanceFocused(true);
                            if (advancePaid === "0" || advancePaid === "0.00") {
                              setAdvancePaid("");
                            }
                          }}
                          onBlur={() => {
                            setIsAdvanceFocused(false);
                          }}
                          onChangeText={(text: string) => {
                            const clean = text.replace(/[^\d.]/g, "");
                            const val = parseFloat(clean) || 0;
                            const total = parseFloat(totalPayment) || 0;
                            if (val > total) {
                              setAdvancePaid(total.toString());
                            } else {
                              setAdvancePaid(clean);
                            }
                          }}
                          hasBorder={false}
                        />
                      </View>
                    </View>

                    {/* Inline Payment Method Selection */}
                    {(isAdvanceFocused || parseFloat(advancePaid) > 0) && (
                      <View style={{ marginTop: vs(10), marginBottom: vs(-10) }}>
                        <Text variant="body2" weight="bold" style={styles.inputLabel}>
                          Payment Method
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
                              variant="body2"
                              weight="bold"
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
                              variant="body2"
                              weight="bold"
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
                              variant="body2"
                              weight="bold"
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
                              variant="body2"
                              weight="bold"
                              style={[
                                styles.methodText,
                                selectedMethod === "paytm" && styles.methodTextSelected,
                              ]}>
                              Paytm
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {hasHistory && (
                      <View style={styles.historyButton}>
                        <FieldBox
                          icon={FileText}
                          label="Previous History"
                          rightElement={<ChevronRight size={ms(20)} color="#000" />}
                          hasBorder={true}
                          iconBg="#E8F0FE"
                          style={{ paddingVertical: vs(10) }}
                          onPress={() => {
                            if (onCheckHistory) {
                              onCheckHistory();
                            } else {
                              onClose();
                            }
                            // Delay navigation slightly to allow the Modal to start closing,
                            // avoiding native animation conflicts that swallow the navigation action.
                            setTimeout(() => {
                              navigation.navigate("GuestHistory", {
                                guestId: mobile,
                                bookingId: "",
                                vertical: "sports",
                                venueId: venueId,
                              });
                            }, 300);
                          }}
                        />
                      </View>
                    )}
                  </View>
                </ScrollView>
                {!isKeyboardVisible && (
                  <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, vs(16)) }]}>
                    <TouchableOpacity
                      style={styles.saveButton}
                      activeOpacity={0.8}
                      onPress={handleBookNow}
                      disabled={isSubmitting}>
                      {isSubmitting ? (
                        <ActivityIndicator color={COLORS.text.inverse} />
                      ) : (
                        <Text variant="h3" weight="bold" color={COLORS.text.inverse}>
                          BOOK NOW
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </TouchableOpacity>

          <TimePickerModal
            useModal={false}
            visible={!!showHourPicker}
            onClose={() => setShowHourPicker(null)}
            title={`Select ${showHourPicker === "from" ? "Start" : "End"} Time`}
            hours={showHourPicker === "from" ? startTimes : endTimes}
            ground={allGrounds.find(g => g.id === internalGroundId)}
            allGrounds={allGrounds}
            selectedTime={showHourPicker === "from" ? fromTime : toTime}
            onSelectTime={hour => {
              if (showHourPicker === "from") {
                setFromTime(hour);
                const idx = startTimes.indexOf(hour);
                if (idx !== -1 && idx + 1 < startTimes.length) {
                  setToTime(startTimes[idx + 1]);
                } else {
                  setToTime("End Time");
                }
              } else {
                setToTime(hour);
              }
              setShowHourPicker(null);
            }}
            isHourDisabled={(hour, _index) => {
              const [hStr, mStr] = parseTimeTo24Hour(hour).split(":");
              const parsedHour = parseInt(hStr, 10);
              const parsedMin = parseInt(mStr, 10);

              const slotDate = new Date(currentDate);
              slotDate.setHours(parsedHour, parsedMin, 0, 0);
              // Slots from 12 AM to 5 AM belong to the next calendar day
              if (parsedHour < 6) {
                slotDate.setDate(slotDate.getDate() + 1);
              }

              if (showHourPicker === "from") {
                const isBooked = bookedHours.includes(hour);

                // Disable past time slots for today's date (From field only)
                const now = new Date();
                const isToday =
                  currentDate.getFullYear() === now.getFullYear() &&
                  currentDate.getMonth() === now.getMonth() &&
                  currentDate.getDate() === now.getDate();
                if (isToday && slotDate <= now) {
                  return true;
                }

                return isBooked;
              } else {
                const fromIndex = startTimes.indexOf(fromTime);
                const toIndex = endTimes.indexOf(hour);
                if (fromIndex === -1 || toIndex === -1) return true;
                if (toIndex <= fromIndex) return true;

                const intermediateHours = startTimes.slice(fromIndex, toIndex + 1);
                const hasBookingInBetween = intermediateHours.some(h => bookedHours.includes(h));
                return hasBookingInBetween;
              }
            }}
            isFetching={isFetchingSlots}
          />

          {isDatePickerOpen && (
            <View style={[styles.timePickerContainer, styles.zIndex999]}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setIsDatePickerOpen(false)}>
                <View style={styles.calendarContainer}>
                  <Calendar
                    current={currentDate.toISOString().split("T")[0]}
                    minDate={new Date().toISOString().split("T")[0]}
                    onDayPress={(day: any) => {
                      setCurrentDate(new Date(day.timestamp));
                      setIsDatePickerOpen(false);
                    }}
                    markedDates={{
                      [currentDate.toISOString().split("T")[0]]: {
                        selected: true,
                        selectedColor: COLORS.primary,
                      },
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

          <GlobalKeyboardAccessory />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bookingDetailsSection: { marginTop: vs(16), zIndex: 900 },
  timePickerContainer: { ...StyleSheet.absoluteFillObject },
  zIndex999: { zIndex: 999 },
  zIndex100: { zIndex: 100 },
  zIndex1000: { zIndex: 1000 },
  zIndex1: { zIndex: 1 },
  dropdownOverride: { left: 0, right: 0 },
  historyFieldBox: { paddingVertical: vs(10) },
  disabledOpacity: { opacity: 0.7 },
  overlay: { flex: 1, backgroundColor: COLORS.background },
  keyboardAvoid: { flex: 1 },
  saveButtonDisabled: { opacity: 0.7 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(24),
  },
  backButton: {
    marginRight: hs(12),
  },
  venueInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  venueImage: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    marginRight: hs(10),
  },
  sportDropdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    textTransform: "uppercase",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    marginBottom: vs(8),
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F8FB",
    borderRadius: ms(12),
    padding: ms(14),
    marginBottom: vs(8),
  },
  fieldBoxBorder: {
    borderWidth: 1,
    borderColor: "#A9C7F9",
  },
  iconWrapper: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
  },
  fieldContent: {
    flex: 1,
    justifyContent: "center",
  },
  fieldInput: {
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
    padding: 0,
    flex: 1,
  },
  sheetContent: { paddingBottom: vs(40) },
  row: { flexDirection: "row", gap: hs(12), width: "100%" },
  flex1: { flex: 1 },
  historyButton: {
    width: "100%",
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(50),
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
  },
  autocompleteContainer: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownContainer: {
    position: "absolute",
    top: vs(64),
    left: vs(6),
    right: vs(6),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    maxHeight: vs(280),
    zIndex: 1001,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  dropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#cbdffe",
  },
  dropdownHeaderText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: "#000",
  },
  dropdownScroll: {
    width: "100%",
    padding: ms(10),
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: ms(10),
    borderRadius: ms(5),
    backgroundColor: "transparent",
    minHeight: vs(36),
    marginBottom: vs(4),
  },
  dropdownItemTextLeft: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Medium",
    color: "#000",
  },
  dropdownItemTextRight: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Medium",
    color: COLORS.text.secondary,
  },
  paymentModalContainer: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(16),
  },
  amountBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(24),
  },
  amountBox: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    borderWidth: 2,
    borderColor: "#A9C7F9",
    borderRadius: ms(8),
    paddingVertical: vs(12),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: hs(4),
  },
  amountBoxLabel: {
    color: "#000",
    marginBottom: vs(4),
  },
  amountBoxValueRed: {
    color: "#E55959",
  },
  amountBoxValueGreen: {
    color: "#00B562",
  },
  inputLabel: {
    marginBottom: vs(8),
    color: "#000",
    fontSize: fs(18),
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: "#A9C7F9",
    paddingHorizontal: hs(12),
    height: vs(48),
    marginBottom: vs(24),
  },
  rupeePrefix: {
    marginRight: hs(8),
    color: "#000",
    fontSize: fs(16),
  },
  amountInput: {
    flex: 1,
    fontSize: fs(16),
    color: "#000",
  },
  methodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(32),
  },
  methodBox: {
    alignItems: "center",
    justifyContent: "center",
    width: "23%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#D1E0FB",
  },
  methodBoxSelectedBlue: {
    backgroundColor: "#63A1FD",
    borderColor: "#63A1FD",
  },
  methodIcon: {
    width: ms(36),
    height: ms(36),
    resizeMode: "contain",
  },
  methodIconSelected: {
    tintColor: undefined, // ensure native colors unless strictly needed
  },
  methodText: {
    fontSize: fs(12),
    marginTop: vs(4),
    color: "#000",
  },
  methodTextSelected: {
    color: "#fff",
  },
  addMoneyBtn: {
    backgroundColor: "#63A1FD",
    borderRadius: ms(12),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  addMoneyBtnText: {
    color: "#fff",
    fontSize: fs(18),
  },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: vs(60),
    paddingHorizontal: hs(10),
  },
  footer: {
    paddingHorizontal: hs(10),
    paddingTop: vs(12),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderColor: "#EBEBEB",
  },
  customerDetailsHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  fullWidth: {
    width: "100%",
  },
  modalRoot: {
    flex: 1,
  },
  keyboardAccessoryWrapper: {
    position: "absolute",
    right: hs(10),
    bottom: vs(10),
    backgroundColor: "transparent",
    zIndex: 10,
  },
  keyboardAccessoryButton: {
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
  },
});
