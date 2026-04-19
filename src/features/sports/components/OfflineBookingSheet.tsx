// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
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

  // Date Picker State
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Form States
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [totalPayment, setTotalPayment] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hour Selection State
  const [fromTime, setFromTime] = useState("Start Time");
  const [toTime, setToTime] = useState("End Time");
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);

  const HOURS = [
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
  ];

  useEffect(() => {
    if (isVisible) {
      setCurrentDate(initialDate);
      setMobile("");
      setName("");
      setTotalPayment("");
      setAdvancePaid("");
      setFromTime("7 AM");
      setToTime("8 AM");
    }
  }, [initialDate, isVisible]);

  // AUTO-FILL & CLEAR LOGIC
  useEffect(() => {
    const lookupGuest = async () => {
      const cleanMobile = mobile.replace(/[^\d]/g, "");

      // 1. If the number is incomplete (e.g., user hits backspace), actively clear the name
      if (cleanMobile.length < 10) {
        setName("");
        return; // Stop execution here so we don't hit the database
      }

      // 2. Only run the database check if we have a full 10-digit number
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("phone", mobile) // Using exactly what they typed
          .single();

        if (data?.full_name) {
          setName(data.full_name);
        } else {
          // New user (not in DB), keep the name cleared so vendor can type it
          setName("");
        }
      } catch (err) {
        // Error or no match found
        setName("");
      }
    };

    lookupGuest();
  }, [mobile]);

  // --- FETCH VENUE PRICING ---
  useEffect(() => {
    const fetchVenuePricing = async () => {
      if (!venueId) return;

      try {
        // Replace 'sports_venues' with your actual pricing table name if different
        const { data } = await supabase
          .from("venues")
          .select("price_per_hour, min_advance_amount")
          .eq("id", venueId)
          .single();

        if (data) {
          // Auto-fill the pricing inputs with defaults from the database
          setTotalPayment(data.price_per_hour?.toString() || "");
          setAdvancePaid(data.min_advance_amount?.toString() || "");
        }
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
      }
    };

    if (isVisible) {
      fetchVenuePricing();
    }
  }, [venueId, isVisible]);

  // --- UPDATED MOBILE & NAME LOOKUP ---
  useEffect(() => {
    const lookupGuest = async () => {
      const cleanMobile = mobile.replace(/[^\d]/g, "");

      if (cleanMobile.length < 10) return;

      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("phone", mobile)
          .single();

        if (data?.full_name) {
          setName(data.full_name);
        } else {
          // If it's a new number, clear the name to allow fresh entry
          setName("");
        }
      } catch (err) {
        setName("");
      }
    };

    lookupGuest();
  }, [mobile]);

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
      const firstErrorMessage = validationResult.error.issues[0].message;
      Alert.alert("Required Fields", firstErrorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Resolve User (Same as before)
      let { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", mobile)
        .single();

      let userId = existingProfile?.id;
      if (!userId) throw new Error("User profile not found.");

      // 2. Format Dates & Times
      const formattedDate = currentDate.toISOString().split("T")[0];
      const startTime24 = parseTimeTo24Hour(fromTime);
      const endTime24 = parseTimeTo24Hour(toTime);
      const numericTotal = parseFloat(totalPayment);

      // 3. ATTEMPT INSERT FIRST (The "Upsert" Pattern)
      // This is more reliable than "Select then Insert" because it handles concurrency
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

      // 4. IF INSERT FAILED (Because it already exists), FIND IT
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

      if (!slotId) {
        throw new Error("Could not resolve Slot ID. Check if Ground ID is correct.");
      }

      // 5. Finalize Booking [cite: 159]
      const { error: bookingError } = await supabase.from("sports_bookings").insert({
        user_id: userId,
        venue_id: venueId,
        slot_id: slotId,
        booking_status: "confirmed",
        subtotal: numericTotal,
        discount_amount: 0,
        platform_fee: 0,
        gateway_fee: 0,
        total_amount: numericTotal,
        vendor_payout: numericTotal,
        notes: `Offline Booking - Guest: ${name}`,
      });

      if (bookingError) throw bookingError;

      Alert.alert("Success", "Booking Saved!");
      onSuccess();
    } catch (error: any) {
      Alert.alert("Booking Failed", error.message);
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
            {/* Date Selection Trigger */}
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

            {/* Hourly Selectors */}
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

            <TouchableOpacity
              style={styles.historyRow}
              activeOpacity={0.7}
              onPress={() => {
                onClose();
                navigation.navigate("GuestHistory", { guestId: mobile || "unknown" });
              }}>
              <FileText size={ms(20)} color={COLORS.text.primary} />
              <Text variant="body2" weight="semiBold" style={styles.historyText}>
                Previous History
              </Text>
              <ChevronRight size={ms(20)} color={COLORS.text.primary} />
            </TouchableOpacity>

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

      {/* Hourly Picker Modal */}
      <Modal visible={!!showHourPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHourPicker(null)}>
          <View style={styles.hourPickerContainer}>
            <Text variant="body1" weight="bold" style={styles.pickerHeader}>
              Select {showHourPicker === "from" ? "Start" : "End"} Time
            </Text>
            <ScrollView style={styles.hourList} showsVerticalScrollIndicator={false}>
              {HOURS.map(hour => (
                <TouchableOpacity
                  key={hour}
                  style={styles.hourItem}
                  onPress={() => {
                    if (showHourPicker === "from") setFromTime(hour);
                    else setToTime(hour);
                    setShowHourPicker(null);
                  }}>
                  <Text
                    variant="body1"
                    weight={fromTime === hour || toTime === hour ? "bold" : "medium"}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={isDatePickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}>
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
              theme={{
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
                textDayFontFamily: "Gilroy-SemiBold",
                textMonthFontFamily: "Gilroy-ExtraBold",
                textDayHeaderFontFamily: "Gilroy-SemiBold",
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  bottomSheetContainer: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.border.navBar,
    paddingTop: vs(12),
    paddingHorizontal: hs(12),
    paddingBottom: vs(30),
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 10,
  },
  handle: {
    width: hs(40),
    height: vs(4),
    backgroundColor: COLORS.surface.fallback,
    borderRadius: ms(2),
    alignSelf: "center",
    marginBottom: vs(12),
  },
  sheetHeader: {
    marginBottom: vs(16),
    paddingHorizontal: hs(6),
  },
  headerText: {
    textTransform: "uppercase",
  },
  sheetContent: {
    paddingBottom: vs(20),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
    width: "100%",
  },
  flex1: {
    flex: 1,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(40),
    marginBottom: vs(16),
  },
  historyText: {
    flex: 1,
    marginLeft: hs(6),
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: {
    fontSize: fs(20),
    textTransform: "uppercase",
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
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  hourPickerContainer: {
    width: "80%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(20),
    maxHeight: "60%",
  },
  pickerHeader: {
    marginBottom: vs(15),
    textAlign: "center",
    textTransform: "uppercase",
  },
  hourList: {
    width: "100%",
  },
  hourItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.navBar,
    alignItems: "center",
  },
});
