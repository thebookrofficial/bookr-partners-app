// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput } from "@/components/ui";
import {
  Calendar as CalendarIcon,
  Phone,
  User as UserIcon,
  Clock,
  FileText,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { Calendar } from "react-native-calendars";
import { TimePickerModal } from "./TimePickerModal";
import { z } from "zod";
import { SportsService } from "../services/sports.service";
import { generateTimeSlots, parseTimeTo24Hour } from "../utils/time.utils";

interface OfflineBookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  venueId: string;
  _groundId: string;
  selectedDate: Date;
  onSuccess: () => void;
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
    // UPDATE THESE TWO LINES:
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

const CustomLabel = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <View style={styles.labelRow}>
    <Icon size={ms(16)} color={COLORS.primary} />
    <Text variant="body2" weight="medium">
      {text}
    </Text>
  </View>
);

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

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [totalPayment, setTotalPayment] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);
  const [bookedHours, setBookedHours] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Guest Autocomplete Search State
  const [searchResults, setSearchResults] = useState<{ name: string; phone: string }[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSelectingFromResults, setIsSelectingFromResults] = useState(false);

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
    setIsSelectingFromResults(false);
    setIsFetchingSlots(false);
    setAllDbSlots([]);
  }, [initialDate]);

  const handleNameChange = async (text: string) => {
    setName(text);
    if (isSelectingFromResults) {
      setIsSelectingFromResults(false);
      return;
    }

    if (text.trim().length >= 2) {
      const results = await SportsService.lookupGuestsByName(venueId, text);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

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
        guestName: name.trim(),
        guestPhone: cleanMobile,
        bookingSource: "offline",
        sportsBookingType: "offline",
        slotDurationMinutes: detectedSlotDuration,
      };

      // CRITICAL FIX: Removed profile lookup and userId passing
      await SportsService.createOfflineBooking(bookingParams);

      Alert.alert("Success", "Booking Saved!");
      resetForm();
      onSuccess();
    } catch (error: any) {
      Alert.alert("Booking Failed", error.message || "Something went wrong.");
    } finally {
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
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={styles.keyboardAvoid}>
          <View style={styles.bottomSheetContainer}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
              </TouchableOpacity>
              <Text variant="body1" weight="bold" style={styles.headerText}>
                Offline Booking
              </Text>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetContent}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsDatePickerOpen(true)}>
                <TextInput
                  variant="filled"
                  label={<CustomLabel icon={CalendarIcon} text="Selected Date" />}
                  value={currentDate.toLocaleDateString("en-GB")}
                  rightIcon={<ChevronDown size={ms(16)} color={COLORS.text.primary} />}
                  editable={false}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              <TextInput
                variant="filled"
                label={<CustomLabel icon={Phone} text="Mobile No" />}
                placeholder="+91 00000 00000"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={text => {
                  const clean = text.replace(/[^\d]/g, "").slice(0, 10);
                  setMobile(clean);
                  if (clean.length < 10) {
                    setName("");
                  }
                }}
              />
              <View style={styles.autocompleteContainer}>
                <TextInput
                  variant="filled"
                  label={<CustomLabel icon={UserIcon} text="Name" />}
                  placeholder="Guest Name"
                  value={name}
                  onChangeText={handleNameChange}
                  onFocus={() => {
                    if (name.trim().length >= 2 && searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSearchResults(false), 300);
                  }}
                />
                {showSearchResults && searchResults.length > 0 && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView keyboardShouldPersistTaps="always" style={styles.dropdownScroll}>
                      {searchResults.map((item, index) => (
                        <TouchableOpacity
                          key={`${item.name}_${item.phone}_${index}`}
                          style={[
                            styles.dropdownItem,
                            index < searchResults.length - 1 && styles.dropdownItemDivider,
                          ]}
                          onPress={() => {
                            setIsSelectingFromResults(true);
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
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowHourPicker("from")}>
                    <TextInput
                      variant="filled"
                      label={<CustomLabel icon={Clock} text="From" />}
                      value={fromTime}
                      rightIcon={<ChevronDown size={ms(16)} color={COLORS.text.primary} />}
                      editable={false}
                      pointerEvents="none"
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.flex1}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowHourPicker("to")}>
                    <TextInput
                      variant="filled"
                      label={<CustomLabel icon={Clock} text="To" />}
                      value={toTime}
                      rightIcon={<ChevronDown size={ms(16)} color={COLORS.text.primary} />}
                      editable={false}
                      pointerEvents="none"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flex1}>
                  <TextInput
                    variant="filled"
                    label={<CustomLabel icon={Clock} text="Total Payment" />}
                    placeholder="₹ 1000"
                    keyboardType="numeric"
                    value={totalPayment}
                    onChangeText={setTotalPayment}
                  />
                </View>
                <View style={styles.flex1}>
                  <TextInput
                    variant="filled"
                    label={
                      <Text variant="body2" weight="medium">
                        Advance Paid
                      </Text>
                    }
                    placeholder="₹"
                    keyboardType="numeric"
                    value={advancePaid}
                    // ADD THIS LINE:
                    onFocus={() => {
                      if (advancePaid === "0" || advancePaid === "0.00") {
                        setAdvancePaid("");
                      }
                    }}
                    onChangeText={text => {
                      const val = parseFloat(text) || 0;
                      const total = parseFloat(totalPayment) || 0;
                      if (val > total) {
                        setAdvancePaid(total.toString());
                      } else {
                        setAdvancePaid(text);
                      }
                    }}
                  />
                </View>
              </View>
              {hasHistory && (
                <TouchableOpacity
                  style={styles.historyRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (onCheckHistory) {
                      onCheckHistory();
                    } else {
                      onClose();
                    }
                    navigation.navigate("GuestHistory", {
                      guestId: mobile,
                      bookingId: "",
                      vertical: "sports",
                      venueId: venueId,
                    });
                  }}>
                  <FileText size={ms(20)} color={COLORS.text.primary} />
                  <Text variant="body2" weight="semiBold" style={styles.historyText}>
                    Previous History
                  </Text>
                  <ChevronRight size={ms(20)} color={COLORS.text.primary} />
                </TouchableOpacity>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleBookNow}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.text.inverse} />
              ) : (
                <Text
                  variant="h3"
                  family="nichrome"
                  color={COLORS.text.inverse}
                  style={styles.saveText}>
                  BOOK NOW
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableOpacity>

      <TimePickerModal
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

      <Modal
        visible={isDatePickerOpen}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}>
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
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.background },
  keyboardAvoid: { flex: 1 },
  saveButtonDisabled: { opacity: 0.7 },
  bottomSheetContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: vs(80), // SafeArea for status bar
    paddingHorizontal: hs(12),
    paddingBottom: vs(30),
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(16),
    paddingHorizontal: hs(6),
  },
  backButton: {
    marginRight: hs(12),
  },
  headerText: { textTransform: "uppercase" },
  sheetContent: { paddingBottom: vs(20) },
  mobileLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  row: { flexDirection: "row", gap: hs(20), width: "100%" },
  flex1: { flex: 1 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(44),
    marginBottom: vs(16),
  },
  historyText: { flex: 1, marginLeft: hs(6) },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(20),
  },
  saveText: { fontSize: fs(20), textTransform: "uppercase" },
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
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    maxHeight: vs(180),
    zIndex: 1001,
    elevation: 5,
    overflow: "hidden",
  },
  dropdownScroll: {
    width: "100%",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: hs(12),
    backgroundColor: COLORS.background,
  },
  dropdownItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.navBar,
  },
  dropdownItemTextLeft: {
    fontSize: fs(14),
    fontWeight: "500",
    color: COLORS.text.primary,
  },
  dropdownItemTextRight: {
    fontSize: fs(12),
    color: COLORS.text.secondary,
  },
});
