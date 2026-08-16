// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
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
    mobile: z
      .string()
      .length(10, "Mobile number must be exactly 10 digits.")
      .regex(/^\d+$/, "Mobile number can only contain digits."),
    name: z.string().min(2, "Please provide a valid guest name."),
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
      if (diff < 0) diff += 24 * 60;
      if (diff > 0 && diff < minDur) {
        minDur = diff;
      }
    });
    return minDur;
  }, [allDbSlots, pricing.slotDurationMinutes]);

  const startTimes = useMemo(() => {
    return generateTimeSlots(6, 24, detectedSlotDuration);
  }, [detectedSlotDuration]);

  const endTimes = useMemo(() => {
    return generateTimeSlots(6, 24, detectedSlotDuration);
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

  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!isVisible || !_groundId) {
        setIsFetchingSlots(false);
        return;
      }
      setIsFetchingSlots(true);
      try {
        const dateStr = getLocalDateString(currentDate);
        const data = await SportsService.getSlots(venueId, _groundId, dateStr);
        setAllDbSlots(data || []);

        let minDur = pricing.slotDurationMinutes || 60;
        (data || []).forEach((slot: any) => {
          const [sh, sm] = slot.start_time.split(":").map(Number);
          const [eh, em] = slot.end_time.split(":").map(Number);
          let diff = eh * 60 + em - (sh * 60 + sm);
          if (diff < 0) diff += 24 * 60;
          if (diff > 0 && diff < minDur) {
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
  }, [currentDate, _groundId, isVisible, pricing.slotDurationMinutes, venueId]);

  const prevGroundId = React.useRef<string | null>(null);

  // Clear form ONLY if the ground actually changes to a different one
  useEffect(() => {
    // Only reset if we had a previous ground ID and the new one is different
    if (prevGroundId.current !== null && _groundId !== prevGroundId.current) {
      resetForm();
    }
    prevGroundId.current = _groundId;
  }, [_groundId, resetForm]);

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

  useEffect(() => {
    const fetchVenuePricing = async () => {
      if (!venueId || !isVisible) return;
      try {
        const data: any = await SportsService.getVenuePricing(venueId);
        if (data) {
          setPricing({
            day: data.day_price || data.price_per_hour || 0,
            night: data.night_price || data.price_per_hour || 0,
            default: data.price_per_hour || 0,
            slotDurationMinutes: data.slot_duration_minutes || 60,
          });
          setAdvancePaid(data.min_advance_amount?.toString() || "");
        }
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
      }
    };
    fetchVenuePricing();
  }, [venueId, isVisible]);

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

    selectedHours.forEach(hour => {
      // Day Session: 6 AM to 5 PM
      // Night Session: 5 PM to 12 AM
      const hIdx = startTimes.indexOf(hour);
      // For fallback comparison, find the index of 5 PM or closest match
      const fivePMIdx = startTimes.findIndex(h => h.includes("5 PM") || h.includes("5:00 PM"));

      const boundaryIdx = fivePMIdx !== -1 ? fivePMIdx : startTimes.length / 2;
      const multiplier = (detectedSlotDuration || 60) / 60;

      if (hIdx < boundaryIdx) {
        total += (pricing.day || pricing.default) * multiplier;
      } else {
        total += (pricing.night || pricing.default) * multiplier;
      }
    });

    setTotalPayment(total.toString());
  }, [fromTime, toTime, pricing, startTimes, endTimes, detectedSlotDuration]);

  const handleBookNow = async () => {
    const cleanMobile = mobile.replace(/[^\d]/g, "");
    const validationResult = offlineBookingSchema.safeParse({
      mobile: cleanMobile,
      name: name.trim(),
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
        groundId: _groundId,
        dateStr: formattedDate,
        startTime24,
        endTime24,
        numericTotal,
        advancePaid: numericAdvance,
        paymentMethod: numericAdvance > 0 ? selectedMethod : undefined,
        guestName: name.trim(),
        guestPhone: cleanMobile,
        bookingSource: "offline",
        sportsBookingType: "offline",
        slotDurationMinutes: detectedSlotDuration,
      };

      const optimisticBooking = {
        id: `temp-${Date.now()}`,
        name: name.trim(),
        phone: cleanMobile,
        date: formattedDate,
        time: `${fromTime} - ${toTime}`,
        price: numericTotal.toString(),
        status: "Offline",
        isOfflineRecord: true,
        startTimeRaw: startTime24,
        endTimeRaw: endTime24,
        idChain: [],
        sports_booking_type: "offline",
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
  const now = new Date();
  const isToday =
    currentDate.getDate() === now.getDate() &&
    currentDate.getMonth() === now.getMonth() &&
    currentDate.getFullYear() === now.getFullYear();
  const currentHour = now.getHours();

  return (
    <>
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}>
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
                    if (
                      text.includes("+") ||
                      (clean.length > 10 && (clean.startsWith("91") || clean.startsWith("0")))
                    ) {
                      clean = clean.slice(-10);
                    } else if (clean.length > 10) {
                      clean = clean.slice(0, 10);
                    }
                    setMobile(clean);
                    if (clean.length < 10) {
                      setName("");
                    }
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
                      <ScrollView keyboardShouldPersistTaps="always" style={styles.dropdownScroll}>
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

                <View style={{ marginTop: vs(16) }}>
                  <SectionHeader icon={CalendarIcon} text="BOOKING DETAILS" />
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
          }}
          isHourDisabled={(hour, index) => {
            const hour24 =
              hour === "12 AM" ? 24 : parseInt(parseTimeTo24Hour(hour).split(":")[0], 10);
            const isPast = isToday && hour24 <= currentHour;

            if (showHourPicker === "from") {
              const isBooked = bookedHours.includes(hour);
              return isBooked || isPast;
            } else {
              const fromIndex = startTimes.indexOf(fromTime);
              if (fromIndex === -1) return true;
              if (index <= fromIndex) return true;

              const intermediateHours = startTimes.slice(fromIndex, index);
              const hasBookingInBetween = intermediateHours.some(h => bookedHours.includes(h));
              return hasBookingInBetween || (isPast && !bookedHours.includes(hour));
            }
          }}
          isFetching={isFetchingSlots}
        />

        {isDatePickerOpen && (
          <View style={[StyleSheet.absoluteFillObject, { zIndex: 999 }]}>
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
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
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
