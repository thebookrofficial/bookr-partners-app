// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
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
  Users,
  Star,
} from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Calendar } from "react-native-calendars";
import { supabase } from "@/lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { z } from "zod";

interface DineOfflineBookingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  venueId: string;
  selectedDate: Date;
  onSuccess: () => void;
}

const offlineBookingSchema = z.object({
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits.")
    .regex(/^\d+$/, "Mobile number can only contain digits."),
  name: z.string().min(2, "Please provide a valid guest name."),
  guestCount: z.string().min(1, "Guest count is required."),
  selectedTime: z.string().min(1, "Please select a time slot."),
});

const CustomLabel = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <View style={styles.labelRow}>
    <Icon size={ms(18)} color={COLORS.primary} />
    <Text variant="body2" weight="medium" color={COLORS.text.primary}>
      {text}
    </Text>
  </View>
);

export const DineOfflineBookingSheet = ({
  isVisible,
  onClose,
  venueId,
  selectedDate: initialDate,
  onSuccess,
}: DineOfflineBookingSheetProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [guestCount, setGuestCount] = useState("Select Guest");
  const [occasion, setOccasion] = useState("");
  const [selectedTime, setSelectedTime] = useState("Select Time");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);

  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const GUEST_OPTIONS = Array.from({ length: 20 }, (_, i) => (i + 1).toString());

  // Helper to format time for display (e.g., "19:00:00" -> "7 PM")
  const formatTime12h = (time24h: string) => {
    const [h, m] = time24h.split(":");
    const hourInt = parseInt(h, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    const displayMins = m === "00" ? "" : `:${m}`;
    return `${displayHour}${displayMins} ${ampm}`;
  };

  // Helper to format time for DB (e.g., "7 PM" -> "19:00:00")
  const parseTimeTo24h = (time12h: string) => {
    const parts = time12h.split(" ");
    if (parts.length < 2) return "00:00:00";
    const [time, period] = parts;
    const [hours, mins] = time.split(":");
    let hourInt = parseInt(hours, 10);
    if (period.toLowerCase() === "pm" && hourInt < 12) hourInt += 12;
    if (period.toLowerCase() === "am" && hourInt === 12) hourInt = 0;
    return `${hourInt.toString().padStart(2, "0")}:${(mins || "00").padStart(2, "0")}:00`;
  };

  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!isVisible || !venueId) return;

      setIsFetchingSlots(true);
      try {
        const dateStr = currentDate.toISOString().split("T")[0];

        // 1. Fetch Venue Capacity (Sum of all table capacities)
        const { data: tables, error: tableError } = await supabase
          .from("dining_tables")
          .select("capacity")
          .eq("venue_id", venueId);

        let totalCapacity = 100; // Default fallback
        if (!tableError && tables && tables.length > 0) {
          totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);
        }

        // 2. Fetch all bookings for this date and venue
        const { data: bookings, error } = await supabase
          .from("dining_bookings")
          .select("reservation_time, party_size")
          .eq("venue_id", venueId)
          .eq("reservation_date", dateStr)
          .neq("booking_status", "cancelled");

        if (error) throw error;

        // 3. Define standard slots (Lunch & Dinner)
        const BASE_SLOTS = [
          "12:00:00",
          "12:30:00",
          "13:00:00",
          "13:30:00",
          "19:00:00",
          "19:30:00",
          "20:00:00",
          "20:30:00",
          "21:00:00",
          "21:30:00",
        ];

        // 4. Group party sizes by time
        const bookedTotals: Record<string, number> = {};
        (bookings || []).forEach(b => {
          const t = b.reservation_time;
          bookedTotals[t] = (bookedTotals[t] || 0) + (b.party_size || 0);
        });

        // 5. Create final slot objects
        const formattedSlots = BASE_SLOTS.map(s => {
          const booked = bookedTotals[s] || 0;
          const displayTime = formatTime12h(s);
          const ratio = booked / totalCapacity;

          let status = "available";
          if (ratio === 0) status = "neutral";
          else if (ratio > 0.8) status = "danger";
          else if (ratio > 0.5) status = "warning";

          return {
            time: displayTime,
            rawTime: s,
            capacity: `${booked}/${totalCapacity}`,
            status,
          };
        });

        setTimeSlots(formattedSlots);

        // Ensure selectedTime is valid or set to first available
        if (selectedTime === "Select Time") {
          setSelectedTime(formatTime12h(BASE_SLOTS[0]));
        }
      } catch (err) {
        console.error("Error fetching slot data:", err);
      } finally {
        setIsFetchingSlots(false);
      }
    };

    fetchSlotsData();
  }, [currentDate, venueId, isVisible, selectedTime]);

  useEffect(() => {
    if (isVisible) {
      setCurrentDate(initialDate);
      setMobile("");
      setName("");
      setGuestCount("Select Guest");
      setOccasion("");
      setSelectedTime("Select Time");
      setHasHistory(false);
    }
  }, [initialDate, isVisible]);

  // Lookup Guest and History when mobile changes
  useEffect(() => {
    const lookupGuestAndHistory = async () => {
      const cleanMobile = mobile.replace(/[^\d]/g, "");

      if (cleanMobile.length < 10) {
        setName("");
        setHasHistory(false);
        return;
      }

      try {
        // 1. Try to Resolve Bookr Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("phone", cleanMobile)
          .maybeSingle();

        let foundName = profile?.full_name || "";

        // 2. If no Bookr Profile, lookup latest name from history
        if (!foundName) {
          const { data: lastBooking } = await supabase
            .from("dining_bookings")
            .select("profiles(full_name)")
            .eq("profiles.phone", cleanMobile)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastBooking?.profiles) {
            const profileArr = Array.isArray(lastBooking.profiles)
              ? lastBooking.profiles[0]
              : lastBooking.profiles;
            foundName = profileArr?.full_name || "";
          }
        }

        if (foundName) setName(foundName);

        // 3. Check for Previous History
        const { count, error: historyError } = await supabase
          .from("dining_bookings")
          .select("id", { count: "exact", head: true })
          .or(`user_id.eq.${profile?.id || "00000000-0000-0000-0000-000000000000"}`);

        setHasHistory(!historyError && !!count && count > 0);
      } catch (err) {
        console.error("Lookup error:", err);
        setHasHistory(false);
      }
    };

    lookupGuestAndHistory();
  }, [mobile]);

  const handleBookNow = async () => {
    const cleanMobile = mobile.replace(/[^\d]/g, "");

    const validation = offlineBookingSchema.safeParse({
      mobile: cleanMobile,
      name: name.trim(),
      guestCount,
      selectedTime,
    });

    if (!validation.success) {
      Alert.alert("Required Fields", validation.error.issues[0].message);
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

      // Local-safe date string (YYYY-MM-DD)
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const formattedTime = parseTimeTo24h(selectedTime);

      const { error: insertError } = await supabase.from("dining_bookings").insert({
        venue_id: venueId,
        user_id: userId,
        guest_name: name.trim(),
        guest_phone: cleanMobile,
        reservation_date: formattedDate,
        reservation_time: formattedTime,
        party_size: parseInt(guestCount, 10),
        special_requests: occasion,
        booking_status: "confirmed",
        paid_amount: 0,
        bill_amount: 0,
      });

      if (insertError) throw insertError;

      Alert.alert("Success", "Offline booking created successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Booking error:", error);
      Alert.alert("Booking Failed", error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string, isSelected: boolean) => {
    if (isSelected) return COLORS.primary;
    switch (status) {
      case "available":
        return "#00B562";
      case "warning":
        return "#FF8A3D";
      case "danger":
        return "#E55959";
      default:
        return "#8C8C8C";
    }
  };

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}>
            {/* Header */}
            <View style={styles.sectionHeader}>
              <Text variant="body1" weight="bold" style={styles.headerText}>
                OFFLINE BOOKING
              </Text>
            </View>

            {/* Time Slots Section */}
            <View style={styles.timeSlotsSection}>
              <Text variant="body1" weight="bold" style={styles.sectionTitle}>
                TIME SLOTS
              </Text>
              {isFetchingSlots ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginVertical: vs(20) }} />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.slotsScroll}>
                  {timeSlots.map(slot => {
                    const isSelected = selectedTime === slot.time;
                    const statusColor = getStatusColor(slot.status, isSelected);
                    return (
                      <TouchableOpacity
                        key={slot.rawTime}
                        onPress={() => setSelectedTime(slot.time)}
                        style={[styles.slotCard, isSelected && styles.selectedSlotCard]}>
                        <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                          {slot.time}
                        </Text>
                        <Text variant="body2" weight="semiBold">
                          <Text style={{ color: statusColor }}>{slot.capacity.split("/")[0]}</Text>
                          <Text color={COLORS.text.primary}>/{slot.capacity.split("/")[1]}</Text>
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.formGrid}>
              <View style={styles.row}>
                <TouchableOpacity style={styles.flex1} onPress={() => setIsDatePickerOpen(true)}>
                  <TextInput
                    label={<CustomLabel icon={CalendarIcon} text="Date" />}
                    value={currentDate.toLocaleDateString("en-GB")}
                    editable={false}
                    pointerEvents="none"
                    variant="filled"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.flex1} onPress={() => setShowTimePicker(true)}>
                  <TextInput
                    label={<CustomLabel icon={Clock} text="Time" />}
                    value={selectedTime}
                    rightIcon={<ChevronDown size={ms(18)} color={COLORS.text.primary} />}
                    editable={false}
                    pointerEvents="none"
                    variant="filled"
                  />
                </TouchableOpacity>
              </View>

              <TextInput
                label={<CustomLabel icon={Phone} text="Mobile No" />}
                value={mobile}
                onChangeText={setMobile}
                placeholder="+91 78349 89934"
                keyboardType="phone-pad"
                variant="filled"
              />

              <TextInput
                label={<CustomLabel icon={UserIcon} text="Name" />}
                value={name}
                onChangeText={setName}
                placeholder="Yash"
                variant="filled"
              />

              <View style={styles.row}>
                <TouchableOpacity style={styles.flex1} onPress={() => setShowGuestPicker(true)}>
                  <TextInput
                    label={<CustomLabel icon={Users} text="No of guest" />}
                    value={guestCount}
                    rightIcon={<ChevronDown size={ms(18)} color={COLORS.text.primary} />}
                    editable={false}
                    pointerEvents="none"
                    variant="filled"
                  />
                </TouchableOpacity>
                <View style={styles.flex1}>
                  <TextInput
                    label={<CustomLabel icon={Star} text="Occasion" />}
                    value={occasion}
                    onChangeText={setOccasion}
                    variant="filled"
                  />
                </View>
              </View>
            </View>

            {/* History Row */}
            {hasHistory && (
              <TouchableOpacity
                style={styles.historyRow}
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  navigation.navigate("GuestHistory", { guestId: mobile });
                }}>
                <View style={styles.historyLeft}>
                  <FileText size={ms(20)} color={COLORS.text.primary} />
                  <Text variant="body2" weight="semiBold" style={styles.historyText}>
                    Previous History
                  </Text>
                </View>
                <ChevronRight size={ms(20)} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}

            {/* Book Now Button */}
            <TouchableOpacity
              style={[styles.bookButton, isSubmitting && styles.disabledButton]}
              onPress={handleBookNow}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.text.inverse} />
              ) : (
                <Text
                  variant="h3"
                  weight="bold"
                  color={COLORS.text.inverse}
                  style={styles.bookButtonText}>
                  BOOK NOW
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      <Modal
        visible={isDatePickerOpen}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setIsDatePickerOpen(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => setIsDatePickerOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.calendarModal}>
            <Calendar
              current={getLocalISODate(currentDate)}
              onDayPress={(day: any) => {
                setCurrentDate(new Date(day.year, day.month - 1, day.day));
                setIsDatePickerOpen(false);
              }}
              markedDates={{
                [getLocalISODate(currentDate)]: {
                  selected: true,
                  selectedColor: COLORS.primary,
                },
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.selectionModal}>
            <Text variant="body1" weight="bold" style={styles.pickerTitle}>
              Select Time
            </Text>
            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={true}>
              {timeSlots.map(slot => (
                <TouchableOpacity
                  key={slot.rawTime}
                  style={styles.selectionItem}
                  onPress={() => {
                    setSelectedTime(slot.time);
                    setShowTimePicker(false);
                  }}>
                  <Text variant="body1" color={COLORS.text.primary}>
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Guest Selection Modal */}
      <Modal
        visible={showGuestPicker}
        transparent
        animationType="fade"
        hardwareAccelerated
        statusBarTranslucent
        onRequestClose={() => setShowGuestPicker(false)}>
        <View style={styles.modalOverlayCenter}>
          <TouchableWithoutFeedback onPress={() => setShowGuestPicker(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.selectionModal}>
            <Text variant="body1" weight="bold" style={styles.pickerTitle}>
              No of Guests
            </Text>
            <ScrollView style={styles.selectionList} showsVerticalScrollIndicator={true}>
              {GUEST_OPTIONS.map(count => (
                <TouchableOpacity
                  key={count}
                  style={styles.selectionItem}
                  onPress={() => {
                    setGuestCount(count);
                    setShowGuestPicker(false);
                  }}>
                  <Text variant="body1" color={COLORS.text.primary}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheetContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingTop: vs(10),
    paddingHorizontal: hs(12),
    paddingBottom: vs(30),
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  handle: {
    width: hs(40),
    height: vs(4),
    backgroundColor: COLORS.surface.fallback,
    borderRadius: ms(2),
    alignSelf: "center",
    marginBottom: vs(10),
  },
  sheetContent: {
    gap: vs(15),
  },
  sectionHeader: {
    paddingHorizontal: hs(6),
  },
  headerText: {
    fontSize: ms(16),
    color: COLORS.text.primary,
  },
  timeSlotsSection: {
    gap: vs(10),
    paddingHorizontal: hs(6),
  },
  sectionTitle: {
    fontSize: ms(16),
    color: COLORS.text.primary,
  },
  slotsScroll: {
    flexDirection: "row",
  },
  slotCard: {
    width: hs(60),
    height: vs(76),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(25),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(10),
    gap: vs(8),
  },
  selectedSlotCard: {
    borderColor: "rgba(99, 161, 253, 0.8)",
    backgroundColor: "#F4F7FC",
  },
  formGrid: {
    gap: vs(12),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
  },
  flex1: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingHorizontal: hs(12),
    paddingVertical: vs(12),
    marginTop: vs(5),
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  historyText: {
    fontSize: ms(14),
  },
  bookButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(48),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(10),
  },
  bookButtonText: {
    fontSize: ms(20),
    fontFamily: "Gilroy-Bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  calendarModal: {
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
    width: "90%",
  },
  selectionModal: {
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(20),
    width: "80%",
    maxHeight: "60%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pickerTitle: {
    textAlign: "center",
    marginBottom: vs(15),
    fontSize: ms(18),
  },
  selectionList: {
    width: "100%",
  },
  selectionItem: {
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "#CBDFFE",
    alignItems: "center",
  },
});
