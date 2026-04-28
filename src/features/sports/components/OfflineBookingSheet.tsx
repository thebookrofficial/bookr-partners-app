// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useMemo } from "react";
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
import { supabase } from "@/lib/supabase";
import { Calendar } from "react-native-calendars";
import { z } from "zod";

interface OfflineBookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  venueId: string;
  _groundId: string;
  selectedDate: Date;
  onSuccess: () => void;
}

const offlineBookingSchema = z.object({
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits.")
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
  fromTime: z.string().min(1, "Start time is required."),
  toTime: z.string().min(1, "End time is required."),
});

const parseTimeTo24Hour = (time12h: string) => {
  if (time12h === "12 AM") return "00:00:00";
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
}: OfflineBookingSheetProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // Form States
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

  useEffect(() => {
    const fetchUnavailableSlots = async () => {
      if (!isVisible || !_groundId) return;

      setIsFetchingSlots(true);
      try {
        const dateStr = currentDate.toISOString().split("T")[0];

        const { data, error } = await supabase
          .from("sports_slots")
          .select("start_time")
          .eq("ground_id", _groundId)
          .eq("slot_date", dateStr)
          .neq("status", "available"); // Fetch anything that isn't available

        if (error) throw error;

        // Convert "07:00:00" to "7 AM" for comparison with our HOURS array
        const formattedBooked = (data || []).map(slot => {
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

  useEffect(() => {
    if (isVisible) {
      setCurrentDate(initialDate);
      setMobile("");
      setName("");
      setTotalPayment("");
      setAdvancePaid("");
      setFromTime("Start Time");
      setToTime("End Time");
      setHasHistory(false);
    }
  }, [initialDate, isVisible]);

  // UPDATED AUTO-FILL & HISTORY CHECK LOGIC
  useEffect(() => {
    const lookupGuestAndHistory = async () => {
      // Clean the mobile number to digits only
      const cleanMobile = mobile.replace(/[^\d]/g, "");

      // ONLY trigger the database lookup when we have exactly 10 digits (Standard Indian Mobile)
      if (cleanMobile.length !== 10) {
        setHasHistory(false);
        return;
      }

      // Generate the variants to match how it might be saved in the database
      const phoneVariants = [cleanMobile, `+91${cleanMobile}`, `+91 ${cleanMobile}`];

      // Build safe OR query strings for Supabase
      const phoneOrQuery = phoneVariants.map(v => `phone.eq.${v}`).join(",");
      const guestPhoneOrQuery = phoneVariants.map(v => `guest_phone.eq.${v}`).join(",");

      try {
        // 1. Try to Resolve Bookr Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .or(phoneOrQuery)
          .maybeSingle();

        let foundName = profile?.full_name || "";

        // 2. If no Bookr Profile, lookup latest Manual Guest Name from Sports
        if (!foundName) {
          const { data: sportsBooking } = await supabase
            .from("sports_bookings")
            .select("guest_name")
            .or(guestPhoneOrQuery)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (sportsBooking?.guest_name) {
            foundName = sportsBooking.guest_name;
          }
        }

        // 3. If still nothing, check Dining Bookings
        if (!foundName) {
          const { data: diningBooking } = await supabase
            .from("dining_bookings")
            .select("guest_name")
            .or(guestPhoneOrQuery)
            .not("guest_name", "is", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (diningBooking?.guest_name) {
            foundName = diningBooking.guest_name;
          }
        }

        // IMPORTANT: Only set the name if we ACTUALLY found one in the DB!
        // This prevents erasing the name if the vendor has already started typing it manually.
        if (foundName) {
          setName(foundName);
        }

        // 4. Check for Previous History (For the History Button)
        const historyOrQuery = guestPhoneOrQuery + (profile?.id ? `,user_id.eq.${profile.id}` : "");
        const { count, error: historyError } = await supabase
          .from("sports_bookings")
          .select("id", { count: "exact", head: true })
          .or(historyOrQuery);

        setHasHistory(!historyError && !!count && count > 0);
      } catch (err) {
        console.error("Lookup error:", err);
        setHasHistory(false);
      }
    };

    lookupGuestAndHistory();
  }, [mobile]);

  // FETCH VENUE PRICING
  useEffect(() => {
    const fetchVenuePricing = async () => {
      if (!venueId || !isVisible) return;
      try {
        const { data } = await supabase
          .from("venues")
          .select("price_per_hour, day_price, night_price, min_advance_amount")
          .eq("id", venueId)
          .single();

        if (data) {
          setPricing({
            day: (data as any).day_price || data.price_per_hour || 0,
            night: (data as any).night_price || data.price_per_hour || 0,
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", cleanMobile)
        .maybeSingle();

      const userId = profile?.id || null;
      const formattedDate = currentDate.toISOString().split("T")[0];
      const startTime24 = parseTimeTo24Hour(fromTime);
      const endTime24 = parseTimeTo24Hour(toTime);
      const numericTotal = parseFloat(totalPayment);

      const { data: newSlot, error: insertError } = await supabase
        .from("sports_slots")
        .insert({
          venue_id: venueId,
          ground_id: _groundId,
          slot_date: formattedDate,
          start_time: startTime24,
          end_time: endTime24,
          price: numericTotal,
          status: "booked",
        })
        .select("id")
        .maybeSingle();

      let slotId = newSlot?.id;

      if (insertError || !slotId) {
        const { data: foundSlot } = await supabase
          .from("sports_slots")
          .select("id, status")
          .eq("venue_id", venueId)
          .eq("ground_id", _groundId)
          .eq("slot_date", formattedDate)
          .eq("start_time", startTime24)
          .eq("end_time", endTime24)
          .single();

        if (foundSlot?.status !== "available" && !insertError) {
          throw new Error("This slot is already taken.");
        }
        slotId = foundSlot?.id;
      }

      if (!slotId) throw new Error("Could not resolve Slot ID.");

      const { error: bookingError } = await supabase.from("sports_bookings").insert({
        user_id: userId,
        guest_name: userId ? null : name.trim(),
        guest_phone: userId ? null : cleanMobile,
        venue_id: venueId,
        slot_id: slotId,
        booking_status: "confirmed",
        subtotal: numericTotal,
        discount_amount: 0,
        platform_fee: 0,
        gateway_fee: 0,
        total_amount: numericTotal,
        vendor_payout: numericTotal,
        notes: `Offline Booking${userId ? " (Bookr User)" : ""}`,
        paid_amount: parseFloat(advancePaid || "0"),
      });

      if (bookingError) throw bookingError;

      Alert.alert("Success", "Booking Saved!");
      onSuccess();
    } catch (error: any) {
      Alert.alert("Booking Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              onChangeText={setMobile}
            />

            <TextInput
              variant="filled"
              label={<CustomLabel icon={UserIcon} text="Name" />}
              placeholder="Guest Name"
              value={name}
              onChangeText={setName}
            />

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
                  onChangeText={setAdvancePaid}
                />
              </View>
            </View>

            {/* CONDITIONAL HISTORY BUTTON */}
            {hasHistory && (
              <TouchableOpacity
                style={styles.historyRow}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  navigation.navigate("GuestHistory", { guestId: mobile, bookingId: "" });
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
                  let isDisabled = false;
                  let reasonText = "";

                  if (showHourPicker === "from") {
                    // START TIME: Cannot pick a time that is already booked
                    isDisabled = isBooked;
                    if (isBooked) reasonText = "(Booked)";
                  } else {
                    // END TIME LOGIC
                    const fromIndex = HOURS.indexOf(fromTime);

                    // 1. Cannot be earlier than or equal to Start Time
                    if (index <= fromIndex) {
                      isDisabled = true;
                    }

                    // 2. Cannot skip over a booked slot
                    // If there's a booked slot between fromTime and this hour, disable it
                    const hasBookingInBetween = HOURS.slice(fromIndex, index).some(h =>
                      bookedHours.includes(h),
                    );
                    if (hasBookingInBetween) {
                      isDisabled = true;
                      reasonText = "(Unavailable)";
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourItem,
                        isDisabled && styles.hourItemDisabled,
                        // Highlight current selection
                        (fromTime === hour || toTime === hour) && {
                          backgroundColor: COLORS.surface.primary,
                        },
                      ]}
                      disabled={isDisabled}
                      onPress={() => {
                        if (showHourPicker === "from") {
                          setFromTime(hour);
                          setToTime("End Time"); // Reset To-time when From-time changes
                        } else {
                          setToTime(hour);
                        }
                        setShowHourPicker(null);
                      }}>
                      <Text
                        variant="body1"
                        weight={fromTime === hour || toTime === hour ? "bold" : "bold"}
                        color={isDisabled ? COLORS.text.secondary : COLORS.text.primary}>
                        {hour} {reasonText}
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
  hourItemDisabled: {
    backgroundColor: COLORS.surface.fallback, // Light grey background
    opacity: 0.6,
  },
});
