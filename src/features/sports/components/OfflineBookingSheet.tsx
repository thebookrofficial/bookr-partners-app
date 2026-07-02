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
  Pressable,
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
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { Calendar } from "react-native-calendars";
import { z } from "zod";
import { SportsService } from "../services/sports.service";

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

const parseTimeTo24Hour = (time12h: string, isEnd = false) => {
  // If it's 12 AM and it's the end time, make it 24:00:00
  if (time12h === "12 AM") return isEnd ? "24:00:00" : "00:00:00";

  const [time, modifier] = time12h.split(" ");
  let hours = parseInt(time, 10);
  if (hours === 12 && modifier === "AM") hours = 0;
  if (hours < 12 && modifier === "PM") hours += 12;
  return `${hours.toString().padStart(2, "0")}:00:00`;
};

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

  // Pricing State
  const [pricing, setPricing] = useState({ day: 0, night: 0, default: 0 });

  // Hour Selection State
  const [fromTime, setFromTime] = useState("Start Time");
  const [toTime, setToTime] = useState("End Time");
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);

  const HOURS = useMemo(
    () => [
      "6 AM",
      "7 AM",
      "8 AM",
      "9 AM",
      "10 AM",
      "11 AM",
      "12 PM",
      "1 PM",
      "2 PM",
      "3 PM",
      "4 PM",
      "5 PM",
      "6 PM",
      "7 PM",
      "8 PM",
      "9 PM",
      "10 PM",
      "11 PM",
      "12 AM",
    ],
    [],
  );

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
  }, [initialDate]);

  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    const fetchUnavailableSlots = async () => {
      if (!isVisible || !_groundId) return;
      setIsFetchingSlots(true);
      try {
        const dateStr = getLocalDateString(currentDate);
        const data = await SportsService.getUnavailableSlotsForDate(_groundId, dateStr);
        const formattedBooked = (data || []).map((slot: any) => {
          const [h] = slot.start_time.split(":");
          const hourInt = parseInt(h, 10);
          const ampm = hourInt >= 12 ? "PM" : "AM";
          const displayHour = hourInt % 12 || 12;
          return `${displayHour} ${ampm}`;
        });
        setBookedHours(formattedBooked);
      } catch (err) {
        console.error("Error checking slot availability:", err);
      } finally {
        setIsFetchingSlots(false);
      }
    };
    fetchUnavailableSlots();
  }, [currentDate, _groundId, isVisible]);

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

    const startIdx = HOURS.indexOf(fromTime);
    const endIdx = HOURS.indexOf(toTime);

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return;

    const selectedHours = HOURS.slice(startIdx, endIdx);
    let total = 0;

    selectedHours.forEach(hour => {
      // Day Session: 6 AM to 5 PM
      // Night Session: 5 PM to 12 AM
      const hIdx = HOURS.indexOf(hour);
      const fivePMIdx = HOURS.indexOf("5 PM");

      if (hIdx < fivePMIdx) {
        total += pricing.day || pricing.default;
      } else {
        total += pricing.night || pricing.default;
      }
    });

    setTotalPayment(total.toString());
  }, [fromTime, toTime, pricing, HOURS]);

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
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.bottomSheetContainer}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text variant="body1" weight="bold" style={styles.headerText}>
              Offline Booking
            </Text>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
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
            {/* {mobile.length >= 10 && ( */}
            <TextInput
              variant="filled"
              label={<CustomLabel icon={UserIcon} text="Name" />}
              placeholder="Guest Name"
              value={name}
              onChangeText={setName}
            />
            {/* )} */}
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
                  });
                }}>
                <FileText size={ms(20)} color={COLORS.text.primary} />
                <Text variant="body2" weight="semiBold" style={styles.historyText}>
                  Previous History
                </Text>
                <ChevronRight size={ms(20)} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
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
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* FIXED HOUR PICKER MODAL */}
      <Modal visible={!!showHourPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowHourPicker(null)} />
          <View style={styles.hourPickerContainer}>
            <Text variant="body1" weight="bold" style={styles.pickerHeader}>
              Select {showHourPicker === "from" ? "Start" : "End"} Time
            </Text>
            {isFetchingSlots ? (
              <ActivityIndicator color={COLORS.primary} style={{ margin: vs(20) }} />
            ) : (
              <ScrollView
                style={styles.hourList}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}>
                {HOURS.map((hour, index) => {
                  const isBooked = bookedHours.includes(hour);

                  // FIX: Treat 12 AM as the end of the day (24:00) so it isn't incorrectly marked as past
                  const hour24 =
                    hour === "12 AM" ? 24 : parseInt(parseTimeTo24Hour(hour).split(":")[0], 10);
                  const isPast = isToday && hour24 <= currentHour;

                  let isDisabled = false;
                  let reasonText = "";

                  if (showHourPicker === "from") {
                    if (isBooked) {
                      isDisabled = true;
                      reasonText = "(Booked)";
                    } else if (isPast) {
                      isDisabled = true;
                      reasonText = "(Unavailable)";
                    }
                  } else {
                    const fromIndex = HOURS.indexOf(fromTime);
                    if (index <= fromIndex) {
                      isDisabled = true;
                    } else {
                      // For "to" time, we check if any slot strictly between the start time
                      // and this end time is booked.
                      // A slot starting at `hour` is fine to be an end time for an earlier slot.
                      // We check from `fromIndex` up to `index - 1`.
                      const intermediateHours = HOURS.slice(fromIndex, index);
                      const hasBookingInBetween = intermediateHours.some(h =>
                        bookedHours.includes(h),
                      );

                      if (hasBookingInBetween) {
                        isDisabled = true;
                        reasonText = "(Unavailable)";
                      } else if (isPast && !isBooked) {
                        // Standard past time check
                        isDisabled = true;
                        reasonText = "(Unavailable)";
                      }
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourItem,
                        isDisabled && styles.hourItemDisabled,
                        (fromTime === hour || toTime === hour) && {
                          backgroundColor: COLORS.surface.primary,
                        },
                      ]}
                      disabled={isDisabled}
                      onPress={() => {
                        if (showHourPicker === "from") {
                          setFromTime(hour);
                          setToTime("End Time");
                        } else {
                          setToTime(hour);
                        }
                        setShowHourPicker(null);
                      }}>
                      <Text
                        variant="body1"
                        weight="bold"
                        color={
                          isDisabled && reasonText !== "(Booked)"
                            ? COLORS.text.secondary
                            : COLORS.text.primary
                        }>
                        {hour}
                        {reasonText ? (
                          <Text
                            variant="body1"
                            weight="bold"
                            color={
                              reasonText === "(Booked)" ? COLORS.danger : COLORS.text.secondary
                            }>
                            {" "}
                            {reasonText}
                          </Text>
                        ) : null}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  saveButtonDisabled: { opacity: 0.7 },
  bottomSheetContainer: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingTop: vs(12),
    paddingHorizontal: hs(12),
    paddingBottom: vs(30),
    maxHeight: "85%",
  },
  handle: {
    width: hs(40),
    height: vs(4),
    backgroundColor: COLORS.surface.fallback,
    borderRadius: ms(2),
    alignSelf: "center",
    marginBottom: vs(12),
  },
  sheetHeader: { marginBottom: vs(16), paddingHorizontal: hs(6) },
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
  hourPickerContainer: {
    width: "80%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(20),
    maxHeight: "60%",
  },
  pickerHeader: { marginBottom: vs(15), textAlign: "center", textTransform: "uppercase" },
  hourList: { width: "100%" },
  hourItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.navBar,
    alignItems: "center",
  },
  hourItemDisabled: { backgroundColor: COLORS.surface.fallback, opacity: 0.6 },
});
