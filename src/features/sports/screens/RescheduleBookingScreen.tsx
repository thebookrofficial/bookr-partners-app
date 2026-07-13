// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput as RNTextInput,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { ArrowLeft, Calendar, Clock, DollarSign, Plus, Minus } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { Calendar as CalendarPicker } from "react-native-calendars";
import { TimePickerModal } from "../components/TimePickerModal";
import { SportsService } from "../services/sports.service";
import { useBookingDetails } from "../hooks/useBookingDetails";
import { generateTimeSlots } from "../utils/time.utils";

export const RescheduleBookingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "RescheduleBooking">>();
  const { bookingId, venueId, groundId } = route.params;

  const { booking, loading } = useBookingDetails(bookingId);

  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [fromTime, setFromTime] = useState("Start Time");
  const [toTime, setToTime] = useState("End Time");
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);
  const [totalPrice, setTotalPrice] = useState("");
  const [isAddingAmount, setIsAddingAmount] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [pricing, setPricing] = useState({ day: 0, night: 0, default: 0, slotDurationMinutes: 60 });

  const HOURS = React.useMemo(
    () => generateTimeSlots(6, 24, pricing.slotDurationMinutes),
    [pricing.slotDurationMinutes],
  );

  const currentPaid = Number(booking?.paid_amount) || 0;
  const totalDiscount = Number(booking?.discount_amount) || 0;
  const totalFees = booking?.platform_fee || 0;

  const sportsType = booking?.venues?.sports_venues?.[0]?.sports_type || "";
  const isPickleball = sportsType.toLowerCase().includes("pickleball");

  const displayAmountPaid =
    currentPaid +
    totalDiscount -
    (isPickleball ? totalFees : 0) +
    Number(cashAmount) +
    Number(onlineAmount);
  const remainingAmount = Math.max(0, Number(totalPrice) - displayAmountPaid);

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatHour = (timeStr: string) => {
    if (!timeStr) return "";
    const [h] = timeStr.split(":");
    const hourInt = parseInt(h, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  React.useEffect(() => {
    if (booking?.sports_slots) {
      if (booking.sports_slots.slot_date) {
        setRescheduleDate(new Date(booking.sports_slots.slot_date));
      }
      if (booking.sports_slots.start_time) {
        setFromTime(formatHour(booking.sports_slots.start_time));
      }
      if (booking.sports_slots.end_time) {
        setToTime(formatHour(booking.sports_slots.end_time));
      }
    }
  }, [booking]);

  React.useEffect(() => {
    const fetchVenuePricing = async () => {
      try {
        const data: any = await SportsService.getVenuePricing(venueId);
        if (data) {
          setPricing({
            day: data.day_price || data.price_per_hour || 0,
            night: data.night_price || data.price_per_hour || 0,
            default: data.price_per_hour || 0,
            slotDurationMinutes: data.slot_duration_minutes || 60,
          });
        }
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
      }
    };
    fetchVenuePricing();
  }, [venueId]);

  React.useEffect(() => {
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
      const hIdx = HOURS.indexOf(hour);
      const fivePMIdx = HOURS.findIndex(h => h.includes("5 PM") || h.includes("5:00 PM"));
      const boundaryIdx = fivePMIdx !== -1 ? fivePMIdx : HOURS.length / 2;

      if (hIdx < boundaryIdx) {
        total += pricing.day || pricing.default;
      } else {
        total += pricing.night || pricing.default;
      }
    });

    setTotalPrice(total.toString());
  }, [fromTime, toTime, pricing, HOURS]);

  const handleConfirmReschedule = async () => {
    if (fromTime === "Start Time" || toTime === "End Time") {
      Alert.alert("Error", "Please select a start and end time.");
      return;
    }
    setIsRescheduling(true);
    try {
      await SportsService.rescheduleBookingWithRange({
        bookingId,
        venueId,
        groundId,
        dateStr: getLocalISODate(rescheduleDate),
        fromTime,
        toTime,
        totalPrice: Number(totalPrice),
        addAmount: Number(cashAmount) + Number(onlineAmount),
      });
      Alert.alert("Success", "Booking rescheduled successfully!");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reschedule booking");
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(20)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold">
          Reschedule Booking
        </Text>
      </View>

      <Text variant="body2" color={COLORS.text.muted} style={styles.subtitle}>
        Select a new date and time slot to move this booking.
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : booking ? (
        <View style={styles.currentBookingCard}>
          <Text variant="body1" weight="bold" style={styles.currentBookingTitle}>
            Current Booking Details:
          </Text>
          <View style={styles.infoRow}>
            <Calendar size={ms(16)} color={COLORS.text.secondary} />
            <Text variant="body2" color={COLORS.text.secondary} style={styles.infoText}>
              {booking.sports_slots?.slot_date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={ms(16)} color={COLORS.text.secondary} />
            <Text variant="body2" color={COLORS.text.secondary} style={styles.infoText}>
              {booking.sports_slots?.start_time} - {booking.sports_slots?.end_time}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <DollarSign size={ms(16)} color={COLORS.text.secondary} />
            <Text variant="body2" color={COLORS.text.secondary} style={styles.infoText}>
              Total Paid: ₹{booking.paid_amount} / Total: ₹{booking.total_amount}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.formContainer}>
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Calendar size={ms(16)} color={COLORS.primary} />
            <Text variant="body2" weight="bold">
              Date
            </Text>
          </View>
          <TouchableOpacity onPress={() => setIsDatePickerOpen(true)} activeOpacity={0.7}>
            <View style={styles.inputBoxReadOnly}>
              <Text variant="body2" weight="semiBold" style={styles.inputText}>
                {getFormattedDate(rescheduleDate)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Clock size={ms(16)} color={COLORS.primary} />
            <Text variant="body2" weight="bold">
              Time Slots
            </Text>
          </View>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.subLabel}>
                From
              </Text>
              <TouchableOpacity onPress={() => setShowHourPicker("from")} activeOpacity={0.7}>
                <View style={styles.inputBoxReadOnly}>
                  <Text
                    variant="body2"
                    weight="semiBold"
                    style={[
                      styles.inputText,
                      fromTime === "Start Time" && { color: COLORS.text.muted },
                    ]}>
                    {fromTime === "Start Time" ? "Start Time" : fromTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.subLabel}>
                To
              </Text>
              <TouchableOpacity onPress={() => setShowHourPicker("to")} activeOpacity={0.7}>
                <View style={styles.inputBoxReadOnly}>
                  <Text
                    variant="body2"
                    weight="semiBold"
                    style={[
                      styles.inputText,
                      toTime === "End Time" && { color: COLORS.text.muted },
                    ]}>
                    {toTime === "End Time" ? "End Time" : toTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
            Total Payment
          </Text>
          <View style={styles.inputBox}>
            <RNTextInput
              style={styles.inputText}
              value={totalPrice}
              onChangeText={setTotalPrice}
              keyboardType="numeric"
              placeholder="Total Price"
              placeholderTextColor={COLORS.text.muted}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
            Remaining Amount
          </Text>
          <View style={styles.inputBoxReadOnly}>
            <Text
              variant="body2"
              weight="semiBold"
              color={remainingAmount > 0 ? "#E55959" : "#00B562"}>
              ₹ {remainingAmount}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
            Amount Paid
          </Text>
          <View style={styles.inputBoxRow}>
            <Text variant="body2" weight="semiBold" color="#00B562" style={styles.inputText}>
              ₹ {displayAmountPaid}
            </Text>

            <TouchableOpacity
              style={styles.inlineAddBtn}
              activeOpacity={0.7}
              onPress={() => setIsAddingAmount(!isAddingAmount)}>
              <Text
                variant="body2"
                weight="semiBold"
                color={isAddingAmount ? COLORS.danger : "#00B562"}>
                {isAddingAmount ? "Cancel" : "Add"}
              </Text>
              {isAddingAmount ? (
                <Minus size={ms(16)} color={COLORS.danger} />
              ) : (
                <Plus size={ms(16)} color="#00B562" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isAddingAmount && (
          <>
            <View style={styles.splitBox}>
              <Text variant="body2" weight="medium" style={styles.splitLabel}>
                Cash
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.inputText, styles.splitInputText]}
                  keyboardType="numeric"
                  placeholder="₹ 0"
                  placeholderTextColor={COLORS.text.muted}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                />
              </View>

              <Text variant="body2" weight="medium" style={styles.splitLabel}>
                Online
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={[styles.inputText, styles.splitInputText]}
                  keyboardType="numeric"
                  placeholder="₹ 0"
                  placeholderTextColor={COLORS.text.muted}
                  value={onlineAmount}
                  onChangeText={setOnlineAmount}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={() => setIsAddingAmount(false)}>
              <Text
                variant="h3"
                family="nichrome"
                color={COLORS.text.inverse}
                style={styles.saveText}>
                ADD
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.confirmRescheduleBtn}
          onPress={handleConfirmReschedule}
          disabled={isRescheduling}>
          {isRescheduling ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text variant="h3" family="nichrome" color="#FFF" align="center">
              Confirm Reschedule
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={isDatePickerOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDatePickerOpen(false)} />
          <View style={styles.calendarContainer}>
            <CalendarPicker
              current={getLocalISODate(rescheduleDate)}
              minDate={getLocalISODate(new Date())}
              onDayPress={(day: any) => {
                setRescheduleDate(new Date(day.timestamp));
                setIsDatePickerOpen(false);
              }}
              theme={{
                selectedDayBackgroundColor: COLORS.primary,
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
                textDayFontFamily: "Gilroy-Medium",
                textMonthFontFamily: "Gilroy-Medium",
                textDayHeaderFontFamily: "Gilroy-Medium",
              }}
            />
          </View>
        </View>
      </Modal>

      <TimePickerModal
        visible={!!showHourPicker}
        onClose={() => setShowHourPicker(null)}
        title={`Select ${showHourPicker === "from" ? "Start" : "End"} Time`}
        hours={HOURS}
        selectedTime={showHourPicker === "from" ? fromTime : toTime}
        onSelectTime={(hour: string) => {
          if (showHourPicker === "from") {
            setFromTime(hour);
            setToTime("End Time");
          } else {
            setToTime(hour);
          }
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
  },
  backBtn: {
    marginRight: hs(10),
    padding: ms(5),
  },
  subtitle: {
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  loader: {
    marginVertical: vs(10),
  },
  currentBookingCard: {
    backgroundColor: COLORS.surface.primary,
    padding: ms(15),
    borderRadius: ms(12),
    marginBottom: vs(20),
    borderWidth: 1,
    borderColor: COLORS.border.pillActive,
  },
  currentBookingTitle: {
    marginBottom: vs(10),
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(6),
  },
  infoText: {
    marginLeft: hs(8),
  },
  formContainer: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  row: {
    flexDirection: "row",
    gap: hs(12),
  },
  flex1: {
    flex: 1,
  },
  subLabel: {
    fontSize: fs(14),
    marginBottom: vs(4),
  },
  fieldGroup: {
    marginBottom: vs(16),
  },
  standaloneLabel: {
    marginBottom: vs(4),
  },
  inlineAddBtn: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: hs(4),
    paddingHorizontal: hs(4),
    paddingVertical: vs(2),
  },
  splitBox: {
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingVertical: vs(10),
    paddingHorizontal: hs(16),
    gap: vs(10),
    marginBottom: vs(20),
  },
  splitLabel: {
    marginBottom: -vs(4),
  },
  saveButton: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(16),
  },
  saveText: {
    fontSize: fs(20),
  },
  inputBoxReadOnly: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(10),
    paddingHorizontal: hs(10),
    justifyContent: "center",
    minHeight: vs(40),
  },
  inputBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(8),
    paddingHorizontal: hs(10),
    minHeight: vs(46),
  },
  inputBox: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(10),
    paddingHorizontal: hs(10),
    justifyContent: "center",
    minHeight: vs(30),
  },
  inputText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
  },
  splitInputText: {
    textAlign: "center",
  },
  confirmRescheduleBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: ms(10),
    paddingHorizontal: ms(16),
    borderRadius: ms(30),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: vs(30),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
  },
  calendarContainer: {
    backgroundColor: COLORS.background,
    marginHorizontal: hs(20),
    borderRadius: ms(15),
    padding: ms(15),
  },
});
