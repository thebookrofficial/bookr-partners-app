// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput as RNTextInput,
  Image,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Calendar, Clock } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { Calendar as CalendarPicker } from "react-native-calendars";
import { TimePickerModal } from "../components/TimePickerModal";
import { SportsService } from "../services/sports.service";
import { TimeSlotGrid } from "../components/TimeSlotGrid";
import { LegendIndicator } from "../components/LegendIndicator";
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
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">("cash");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [pricing, setPricing] = useState({ day: 0, night: 0, default: 0, slotDurationMinutes: 60 });

  const [grounds, setGrounds] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroundId, setSelectedGroundId] = useState<string>(groundId);

  const [slots, setSlots] = useState<any[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const HOURS = useMemo(
    () => generateTimeSlots(6, 24, pricing.slotDurationMinutes),
    [pricing.slotDurationMinutes],
  );

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const data = await SportsService.getGrounds(venueId);
        setGrounds(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGrounds();
  }, [venueId, groundId]);

  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!selectedGroundId) return;
      setIsFetchingSlots(true);
      try {
        const dateStr = getLocalISODate(rescheduleDate);
        const data = await SportsService.getSlots(venueId, selectedGroundId, dateStr);
        const formattedSlots = (data || []).map((slot: any) => {
          const isManualBooking = slot.sports_bookings?.some(
            (b: any) =>
              b.booking_status !== "cancelled" &&
              b.booking_status !== "refunded" &&
              b.booking_source !== "online" &&
              b.booking_source !== "app",
          );
          return {
            ...slot,
            raw_start_time: slot.start_time,
            isManualBooking,
          };
        });
        setSlots(formattedSlots);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
      } finally {
        setIsFetchingSlots(false);
      }
    };
    fetchSlotsData();
  }, [rescheduleDate, selectedGroundId, venueId]);

  const getFormattedDate = (date: Date) => {
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, " / ");
  };

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatHour = useCallback(
    (timeStr: string) => {
      if (!timeStr) return "";
      const [h, m] = timeStr.split(":");
      const hourInt = parseInt(h, 10);
      const ampm = hourInt >= 12 && hourInt < 24 ? "PM" : "AM";
      const displayHour = hourInt % 12 || 12;
      if (pricing.slotDurationMinutes < 60) {
        return `${displayHour}:${m} ${ampm}`;
      }
      return `${displayHour} ${ampm}`;
    },
    [pricing.slotDurationMinutes],
  );

  useEffect(() => {
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
      if (booking.paid_amount) {
        setAdvanceAmount(booking.paid_amount.toString());
      }
    }
  }, [booking, formatHour]);

  useEffect(() => {
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
    const durationMultiplier = pricing.slotDurationMinutes ? pricing.slotDurationMinutes / 60 : 1;

    selectedHours.forEach(hour => {
      const hIdx = HOURS.indexOf(hour);
      const fivePMIdx = HOURS.findIndex(h => h.includes("5 PM") || h.includes("5:00 PM"));
      const boundaryIdx = fivePMIdx !== -1 ? fivePMIdx : HOURS.length / 2;

      if (hIdx < boundaryIdx) {
        total += (pricing.day || pricing.default) * durationMultiplier;
      } else {
        total += (pricing.night || pricing.default) * durationMultiplier;
      }
    });

    setTotalPrice(total.toString());
  }, [fromTime, toTime, pricing, HOURS]);

  const handleConfirmReschedule = async () => {
    if (fromTime === "Start Time" || toTime === "End Time") {
      Alert.alert("Error", "Please select a start and end time.");
      return;
    }
    if (!selectedGroundId) {
      Alert.alert("Error", "Please select a ground.");
      return;
    }
    setIsRescheduling(true);
    try {
      await SportsService.rescheduleBookingWithRange({
        bookingId,
        venueId,
        groundId: selectedGroundId,
        dateStr: getLocalISODate(rescheduleDate),
        fromTime,
        toTime,
        totalPrice: Number(totalPrice),
        addAmount: Number(advanceAmount),
        slotDurationMinutes: pricing.slotDurationMinutes,
      });
      Alert.alert("Success", "Booking rescheduled successfully!");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to reschedule booking");
    } finally {
      setIsRescheduling(false);
    }
  };

  const getMethodIcon = (method: "cash" | "gpay" | "phonepe" | "paytm") => {
    switch (method) {
      case "cash":
        return require("@/assets/icons/pay-50.png");
      case "gpay":
        return require("@/assets/icons/google-pay.png");
      case "phonepe":
        return require("@/assets/icons/icons8-phone-pe-48.png");
      case "paytm":
        return require("@/assets/icons/paytm.png");
    }
  };

  const getMethodTitle = (method: "cash" | "gpay" | "phonepe" | "paytm") => {
    switch (method) {
      case "cash":
        return "Cash";
      case "gpay":
        return "GPay";
      case "phonepe":
        return "PhonePay";
      case "paytm":
        return "Paytm";
    }
  };

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(10)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" weight="bold">
          Reschedule Booking
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      ) : (
        <View style={styles.content}>
          {/* Date Selector */}
          <View style={styles.inputBoxReadOnly}>
            <View style={styles.iconBoxBlue}>
              <Calendar size={ms(20)} color="#63A1FD" />
            </View>
            <TouchableOpacity
              onPress={() => setIsDatePickerOpen(true)}
              activeOpacity={0.7}
              style={styles.flex1}>
              <Text variant="body2" weight="bold" color="#000">
                Date
              </Text>
              <Text variant="body2" weight="semiBold" color="#000">
                {getFormattedDate(rescheduleDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Select Ground */}
          <View style={styles.section}>
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              Select Ground
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groundsContainer}>
              {grounds.map(g => {
                const isSelected = selectedGroundId === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setSelectedGroundId(g.id)}
                    style={[styles.groundPill, isSelected && styles.groundPillSelected]}>
                    <Text variant="body2" weight="semiBold" color={isSelected ? "#FFF" : "#000"}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Slot Grid */}
          <View style={[styles.section, { paddingHorizontal: 0 }]}>
            <Text
              variant="body1"
              weight="bold"
              style={[styles.sectionTitle, { marginLeft: hs(10) }]}>
              TIME SLOT
            </Text>
            <View style={{ marginLeft: hs(10) }}>
              <LegendIndicator />
            </View>

            {isFetchingSlots ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginTop: vs(20) }}
              />
            ) : slots.length === 0 ? (
              <Text
                variant="body2"
                color={COLORS.text.secondary}
                style={{ marginTop: vs(10), marginLeft: hs(10) }}>
                No slots generated for this date/ground yet.
              </Text>
            ) : (
              <View style={{ marginTop: vs(10), paddingHorizontal: hs(10) }}>
                <TimeSlotGrid
                  slots={slots as any}
                  selectedDate={rescheduleDate}
                  isNested={pricing.slotDurationMinutes === 30}
                  onSlotPress={() => {}}
                />
              </View>
            )}
          </View>

          {/* Select Time */}
          <View style={styles.section}>
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              Select Time
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                onPress={() => setShowHourPicker("from")}
                style={[styles.inputBoxReadOnly, styles.flex1]}>
                <View style={styles.iconBoxBlue}>
                  <Clock size={ms(20)} color="#63A1FD" />
                </View>
                <View>
                  <Text variant="body2" weight="bold" color="#000">
                    From
                  </Text>
                  <Text variant="body2" weight="semiBold" color="#000">
                    {fromTime === "Start Time" ? "--" : fromTime}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.gap} />
              <TouchableOpacity
                onPress={() => setShowHourPicker("to")}
                style={[styles.inputBoxReadOnly, styles.flex1]}>
                <View style={styles.iconBoxBlue}>
                  <Clock size={ms(20)} color="#63A1FD" />
                </View>
                <View>
                  <Text variant="body2" weight="bold" color="#000">
                    To
                  </Text>
                  <Text variant="body2" weight="semiBold" color="#000">
                    {toTime === "End Time" ? "--" : toTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Card */}
          <View style={styles.paymentCard}>
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              Payment
            </Text>

            <View style={styles.row}>
              <View style={[styles.paymentBox, styles.flex1]}>
                <View style={styles.iconBoxGreen}>
                  <Image source={require("@/assets/icons/pay-50.png")} style={styles.greenIcon} />
                </View>
                <View style={styles.flex1}>
                  <Text variant="body2" weight="bold" color="#000">
                    Total Amount
                  </Text>
                  <View style={styles.priceInputRow}>
                    <Text variant="body2" weight="semiBold" color="#000">
                      ₹
                    </Text>
                    <RNTextInput
                      style={styles.priceInput}
                      value={totalPrice}
                      onChangeText={setTotalPrice}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
              <View style={styles.gap} />
              <View style={[styles.paymentBox, styles.flex1]}>
                <View style={styles.iconBoxGreen}>
                  <Image source={require("@/assets/icons/pay-50.png")} style={styles.greenIcon} />
                </View>
                <View style={styles.flex1}>
                  <Text variant="body2" weight="bold" color="#000">
                    Advance
                  </Text>
                  <View style={styles.priceInputRow}>
                    <Text variant="body2" weight="semiBold" color="#000">
                      ₹
                    </Text>
                    <RNTextInput
                      style={styles.priceInput}
                      value={advanceAmount}
                      onChangeText={setAdvanceAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                      onFocus={() => setIsAddingPayment(true)}
                    />
                    {isAddingPayment && (
                      <TouchableOpacity
                        onPress={() => {
                          setIsAddingPayment(false);
                          setAdvanceAmount("");
                        }}>
                        <Text variant="body2" weight="bold" style={styles.cancelText}>
                          - Cancel
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {isAddingPayment && (
              <>
                <Text
                  variant="body1"
                  weight="bold"
                  style={[styles.sectionTitle, { marginTop: vs(16) }]}>
                  Method
                </Text>
                <View style={styles.methodContainer}>
                  {(["cash", "gpay", "phonepe", "paytm"] as const).map(method => {
                    const isSelected = paymentMethod === method;
                    return (
                      <TouchableOpacity
                        key={method}
                        onPress={() => setPaymentMethod(method)}
                        style={[styles.methodBtn, isSelected && styles.methodBtnSelected]}>
                        <Image
                          source={getMethodIcon(method)}
                          style={[
                            styles.methodIcon,
                            method === "cash" && isSelected && styles.methodIconCashSelected,
                          ]}
                        />
                        <Text
                          variant="body2"
                          weight="bold"
                          color={isSelected && method === "cash" ? "#FFF" : "#000"}>
                          {getMethodTitle(method)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={() => {
                    Alert.alert("Saved", "Payment details saved locally");
                    setIsAddingPayment(false);
                  }}>
                  <Text variant="body1" weight="semiBold" color="#FFF">
                    Save
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Confirm Button */}
      {!loading && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmRescheduleBtn}
            onPress={handleConfirmReschedule}
            disabled={isRescheduling}>
            {isRescheduling ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text variant="h3" family="bison" color="#FFF" align="center">
                CONFIRM RESCHEDULE
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

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
    marginBottom: vs(20),
  },
  backBtn: {
    marginRight: hs(10),
    padding: ms(5),
  },
  loader: {
    marginVertical: vs(20),
  },
  content: {
    flex: 1,
    paddingBottom: vs(100),
  },
  inputBoxReadOnly: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: hs(12),
  },
  iconBoxBlue: {
    backgroundColor: "#D9E8FF",
    width: ms(40),
    height: ms(40),
    borderRadius: ms(8),
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxGreen: {
    backgroundColor: "#DAFFEF",
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    alignItems: "center",
    justifyContent: "center",
  },
  greenIcon: {
    width: ms(20),
    height: ms(20),
    tintColor: "#00B562",
  },
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  gap: {
    width: hs(12),
  },
  section: {
    marginTop: vs(24),
  },
  sectionTitle: {
    marginBottom: vs(10),
    color: "#000",
  },
  groundsContainer: {
    flexDirection: "row",
    gap: hs(10),
  },
  groundPill: {
    paddingVertical: vs(10),
    paddingHorizontal: hs(24),
    borderRadius: ms(30),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    backgroundColor: "#FFF",
  },
  groundPillSelected: {
    backgroundColor: "#63A1FD",
    borderColor: "#63A1FD",
  },
  paymentCard: {
    marginTop: vs(24),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    padding: ms(12),
    backgroundColor: "#F4F7FC",
  },
  paymentBox: {
    borderWidth: 1,
    borderColor: "#63A1FD",
    borderRadius: ms(10),
    padding: ms(8),
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    backgroundColor: "#F4F7FC",
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    padding: 0,
    margin: 0,
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
    marginLeft: hs(2),
    minWidth: hs(40),
  },
  methodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(16),
  },
  methodBtn: {
    flex: 1,
    marginHorizontal: hs(4),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(4),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(8),
    backgroundColor: "#F4F7FC",
  },
  methodBtnSelected: {
    backgroundColor: "#63A1FD",
    borderColor: "#63A1FD",
  },
  methodIcon: {
    width: ms(36),
    height: ms(36),
    resizeMode: "contain",
    marginBottom: vs(4),
  },
  methodIconCashSelected: {
    tintColor: "",
  },
  saveBtn: {
    backgroundColor: "#63A1FD",
    borderRadius: ms(10),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(10),
  },
  bottomContainer: {
    position: "absolute",
    bottom: vs(20),
    left: hs(0),
    right: hs(0),
  },
  confirmRescheduleBtn: {
    backgroundColor: "#000",
    borderRadius: ms(10),
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(12),
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
  cancelText: {
    color: "#E55959",
    fontSize: fs(14),
    marginLeft: hs(10),
  },
});
