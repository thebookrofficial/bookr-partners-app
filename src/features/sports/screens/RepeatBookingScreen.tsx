// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
  TextInput as RNTextInput,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { FormSkeleton, Text } from "@/components/ui";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { ArrowLeft, Clock } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { Calendar as CalendarPicker } from "react-native-calendars";
import { TimePickerModal } from "../components/TimePickerModal";
import { SportsService } from "../services/sports.service";
import { useBookingDetails } from "../hooks/useBookingDetails";
import { generateTimeSlots, parseTimeTo24Hour } from "../utils/time.utils";
import { calculateSlotPrice } from "../utils/pricing.utils";
import perf from "@react-native-firebase/perf";
import { useKeyboardStore } from "@/store/keyboardStore";

import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";
import MoneySvg from "@/assets/icons/ic-tdesign-money.svg";
import WalletSvg from "@/assets/icons/ic-streamline-plump-wallet.svg";

export const RepeatBookingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "RepeatBooking">>();
  const { bookingId, venueId, groundId, idChain } = route.params;

  const { booking, loading } = useBookingDetails(bookingId, idChain);
  const setIsNumericFocused = useKeyboardStore(state => state.setIsNumericFocused);

  const [repeatDate, setRepeatDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [fromTime, setFromTime] = useState("Start Time");
  const [toTime, setToTime] = useState("End Time");
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);
  const [totalPrice, setTotalPrice] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">("cash");

  const [isRepeating, setIsRepeating] = useState(false);
  const [pricing, setPricing] = useState({ day: 0, night: 0, default: 0, slotDurationMinutes: 60 });

  const [grounds, setGrounds] = useState<any[]>([]);
  const [selectedGroundId, setSelectedGroundId] = useState<string>(groundId);
  const [bookedHours, setBookedHours] = useState<string[]>([]);
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
  }, [venueId]);

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

  useEffect(() => {
    const fetchSlotsData = async () => {
      if (!selectedGroundId || !venueId) return;
      setIsFetchingSlots(true);
      try {
        const dateStr = getLocalISODate(repeatDate);
        const data = await SportsService.getSlots(venueId, selectedGroundId, dateStr);

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
          .filter((slot: any) => {
            if (slot.status !== "available") {
              if (booking?.slotIdChain?.includes(slot.id)) {
                return false; // Treat as available for this specific booking
              }
              return true;
            }
            return false;
          })
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
  }, [repeatDate, selectedGroundId, venueId, pricing.slotDurationMinutes, booking?.slotIdChain]);

  const possibleBookableSlots = useMemo(() => {
    if (fromTime === "Start Time" || !fromTime) return [];
    const fromIndex = HOURS.indexOf(fromTime);
    if (fromIndex === -1) return [];

    const list: string[] = [];
    for (let i = fromIndex + 1; i < HOURS.length; i++) {
      const prevHour = HOURS[i - 1];
      if (bookedHours.includes(prevHour)) {
        break; // A booked slot starts here, so we cannot go any further!
      }
      list.push(HOURS[i]);
    }
    return list;
  }, [fromTime, HOURS, bookedHours]);

  const formatHour = React.useCallback(
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
      if (booking.sports_slots.start_time) {
        setFromTime(formatHour(booking.sports_slots.start_time));
      }
      if (booking.sports_slots.end_time) {
        setToTime(formatHour(booking.sports_slots.end_time));
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

    const ground = grounds.find(g => g.id === selectedGroundId);

    selectedHours.forEach(hour => {
      const hIdx = HOURS.indexOf(hour);
      const fivePMIdx = HOURS.findIndex(h => h.includes("5 PM") || h.includes("5:00 PM"));
      const boundaryIdx = fivePMIdx !== -1 ? fivePMIdx : HOURS.length / 2;

      if (ground && ground.custom_pricing) {
        total += calculateSlotPrice(ground, hour, boundaryIdx, hIdx) * durationMultiplier;
      } else {
        if (hIdx < boundaryIdx) {
          total += (pricing.day || pricing.default) * durationMultiplier;
        } else {
          total += (pricing.night || pricing.default) * durationMultiplier;
        }
      }
    });

    setTotalPrice(total.toString());
  }, [fromTime, toTime, pricing, HOURS, grounds, selectedGroundId]);

  const handleConfirmRepeat = async () => {
    if (fromTime === "Start Time" || toTime === "End Time") {
      Alert.alert("Error", "Please select a start and end time.");
      return;
    }
    if (!selectedGroundId) {
      Alert.alert("Error", "Please select a ground.");
      return;
    }
    if (!booking) {
      Alert.alert("Error", "Missing original booking details.");
      return;
    }

    // 1. Instantly navigate back for an optimistic feel
    navigation.navigate("SportsServiceTabs" as any, {
      screen: "SportsHome",
      params: { targetDate: repeatDate.toISOString() },
    });

    // 2. Perform the actual mutation in the background
    (async () => {
      const trace = await perf().startTrace("repeat_booking");
      try {
        const timeMatchFrom = fromTime.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?/i);
        const timeMatchTo = toTime.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?/i);

        let startH = parseInt(timeMatchFrom?.[1] || "0", 10);
        let endH = parseInt(timeMatchTo?.[1] || "0", 10);

        if (timeMatchFrom?.[3]?.toUpperCase() === "PM" && startH !== 12) startH += 12;
        if (timeMatchFrom?.[3]?.toUpperCase() === "AM" && startH === 12) startH = 0;
        if (timeMatchTo?.[3]?.toUpperCase() === "PM" && endH !== 12) endH += 12;
        if (timeMatchTo?.[3]?.toUpperCase() === "AM" && endH === 12) endH = 0;

        const startTime24 = `${startH.toString().padStart(2, "0")}:${(
          timeMatchFrom?.[2] || "00"
        ).padStart(2, "0")}:00`;
        const endTime24 = `${endH.toString().padStart(2, "0")}:${(
          timeMatchTo?.[2] || "00"
        ).padStart(2, "0")}:00`;

        await SportsService.createOfflineBooking({
          venueId,
          groundId: selectedGroundId,
          dateStr: getLocalISODate(repeatDate),
          startTime24,
          endTime24,
          numericTotal: Number(totalPrice),
          advancePaid: Number(advanceAmount),
          paymentMethod: Number(advanceAmount) > 0 ? paymentMethod : undefined,
          guestName: booking.guest_name || "Guest",
          guestPhone: booking.guest_phone || "",
          bookingSource: booking.booking_source || "vendor_app",
          sportsBookingType: booking.sports_booking_type || "standard",
          slotDurationMinutes: pricing.slotDurationMinutes,
        });
      } catch (err: any) {
        Alert.alert("Slot Unavailable", err.message || "Failed to repeat booking");
      } finally {
        await trace.stop();
        setIsRepeating(false);
      }
    })();
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

  const now = new Date();
  const isToday =
    repeatDate.getDate() === now.getDate() &&
    repeatDate.getMonth() === now.getMonth() &&
    repeatDate.getFullYear() === now.getFullYear();
  const currentHour = now.getHours();

  const sportsType =
    booking?.sports_slots?.sports_grounds?.sports_type ||
    booking?.venues?.sports_venues?.[0]?.sports_type ||
    "";

  let groundName = booking?.sports_slots?.sports_grounds?.name || "";
  const catName = sportsType.toLowerCase();
  const groundLower = groundName.toLowerCase();
  if (catName && groundLower.startsWith(catName)) {
    groundName = groundName.slice(catName.length).trim();
  }

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(10)}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h2" weight="bold">
          Repeat Booking
        </Text>
      </View>

      {loading ? (
        <FormSkeleton />
      ) : (
        <View style={styles.content}>
          {/* Category & Ground Info */}
          <View
            style={[styles.inputBoxReadOnly, { flexDirection: "row", paddingVertical: vs(12) }]}>
            <View style={styles.flex1}>
              <Text variant="body2" weight="bold" color="#000" style={{ fontSize: 14 }}>
                Category
              </Text>
              <Text variant="body1" weight="semiBold" color="#000" style={{ fontSize: 16 }}>
                {sportsType ? sportsType.charAt(0).toUpperCase() + sportsType.slice(1) : "-"}
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="bold" color="#000" style={{ fontSize: 14 }}>
                Ground
              </Text>
              <Text
                variant="body1"
                weight="semiBold"
                color="#000"
                style={{ fontSize: 16 }}
                numberOfLines={1}>
                {groundName || "-"}
              </Text>
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.inputBoxReadOnly}>
            <View style={styles.iconBoxBlue}>
              <CalendarSvg width={ms(20)} height={ms(20)} color="#63A1FD" />
            </View>
            <TouchableOpacity
              onPress={() => setIsDatePickerOpen(true)}
              activeOpacity={0.7}
              style={styles.flex1}>
              <Text variant="body1" weight="bold" color="#000" style={{ fontSize: 16 }}>
                Date
              </Text>
              <Text variant="body1" weight="semiBold" color="#000" style={{ fontSize: 16 }}>
                {getFormattedDate(repeatDate)}
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
                  <Text variant="body1" weight="bold" color="#000" style={{ fontSize: 16 }}>
                    From
                  </Text>
                  <Text variant="body1" weight="semiBold" color="#000" style={{ fontSize: 16 }}>
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
                  <Text variant="body1" weight="bold" color="#000" style={{ fontSize: 16 }}>
                    To
                  </Text>
                  <Text variant="body1" weight="semiBold" color="#000" style={{ fontSize: 16 }}>
                    {toTime === "End Time" ? "--" : toTime}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {fromTime !== "Start Time" && possibleBookableSlots.length > 0 && (
              <View style={{ marginTop: vs(12) }}>
                <Text
                  variant="body2"
                  weight="bold"
                  color={COLORS.text.secondary}
                  style={{ marginBottom: vs(8) }}>
                  Bookable End Times
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: hs(8) }}>
                  {possibleBookableSlots.map(time => {
                    const isSelected = toTime === time;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setToTime(time)}
                        style={[styles.slotPill, isSelected && styles.slotPillSelected]}>
                        <Text
                          variant="body2"
                          weight="semiBold"
                          color={isSelected ? "#FFF" : "#000"}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Payment Card */}
          <View style={styles.paymentCard}>
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              Payment
            </Text>

            <View style={styles.row}>
              <View style={[styles.paymentBox, styles.flex1]}>
                <View style={styles.iconBoxBlue}>
                  <WalletSvg width={ms(20)} height={ms(20)} color="#63A1FD" />
                </View>
                <View style={styles.paymentTextContainer}>
                  <Text variant="body1" weight="bold" color="#000">
                    Total Amount
                  </Text>
                  <View style={styles.priceInputRow}>
                    <Text
                      variant="body1"
                      weight="semiBold"
                      color="#000"
                      style={{ fontSize: fs(20) }}>
                      ₹
                    </Text>
                    <RNTextInput
                      style={styles.priceInput}
                      value={totalPrice}
                      onChangeText={setTotalPrice}
                      keyboardType="numeric"
                      onFocus={() => setIsNumericFocused(true)}
                      onBlur={() => setIsNumericFocused(false)}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.gap} />
              <View style={[styles.paymentBox, styles.flex1]}>
                <View style={styles.iconBoxGreen}>
                  <MoneySvg width={ms(20)} height={ms(20)} color="#00B562" />
                </View>
                <View style={styles.paymentTextContainer}>
                  <Text variant="body1" weight="bold" color="#000">
                    Advance
                  </Text>
                  <View style={styles.priceInputRow}>
                    <Text
                      variant="body1"
                      weight="semiBold"
                      color="#000"
                      style={{ fontSize: fs(20) }}>
                      ₹
                    </Text>
                    <RNTextInput
                      style={styles.priceInput}
                      value={advanceAmount}
                      onChangeText={setAdvanceAmount}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                      onFocus={() => {
                        setIsAddingPayment(true);
                        setIsNumericFocused(true);
                      }}
                      onBlur={() => setIsNumericFocused(false)}
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
            style={styles.confirmBtn}
            onPress={handleConfirmRepeat}
            disabled={isRepeating}>
            {isRepeating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text variant="h3" family="bison" color="#FFF" align="center">
                CONFIRM REPEAT BOOKING
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
              current={getLocalISODate(repeatDate)}
              minDate={getLocalISODate(new Date())}
              onDayPress={(day: any) => {
                setRepeatDate(new Date(day.timestamp));
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
        ground={grounds.find(g => g.id === selectedGroundId)}
        allGrounds={grounds}
        selectedTime={showHourPicker === "from" ? fromTime : toTime}
        onSelectTime={hour => {
          if (showHourPicker === "from") {
            setFromTime(hour);
            const idx = HOURS.indexOf(hour);
            if (idx !== -1 && idx + 1 < HOURS.length) {
              setToTime(HOURS[idx + 1]);
            } else {
              setToTime("End Time");
            }
          } else {
            setToTime(hour);
          }
        }}
        isHourDisabled={(hour, _index) => {
          const hour24 =
            hour === "12 AM" ? 24 : parseInt(parseTimeTo24Hour(hour).split(":")[0], 10);
          const isPast = isToday && hour24 <= currentHour;

          if (showHourPicker === "from") {
            const isBooked = bookedHours.includes(hour);
            return isBooked || isPast;
          } else {
            const fromIndex = HOURS.indexOf(fromTime);
            const toIndex = HOURS.indexOf(hour);
            if (fromIndex === -1 || toIndex === -1) return true;
            if (toIndex <= fromIndex) return true;

            const intermediateHours = HOURS.slice(fromIndex, toIndex + 1);
            const hasBookingInBetween = intermediateHours.some(h => bookedHours.includes(h));
            return hasBookingInBetween || (isPast && !bookedHours.includes(hour));
          }
        }}
        isFetching={isFetchingSlots}
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
    backgroundColor: "#CBDFFE",
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
    backgroundColor: "transpaernt",
  },
  groundPillSelected: {
    backgroundColor: "#63A1FD",
    borderColor: "#63A1FD",
  },
  paymentCard: {
    marginTop: vs(24),
    borderRadius: ms(10),
    paddingTop: vs(10),
    paddingBottom: vs(16),
    paddingHorizontal: hs(10),
    backgroundColor: "#F7F9FD",
  },
  paymentBox: {
    borderRadius: ms(20),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    backgroundColor: "#F4F7FC",
  },
  paymentTextContainer: {
    flex: 1,
    justifyContent: "center",
    gap: vs(6),
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceInput: {
    padding: 0,
    margin: 0,
    fontSize: fs(20),
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
    tintColor: "transpaernt",
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
  confirmBtn: {
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
  noPaddingHorizontal: {
    paddingHorizontal: 0,
  },
  cancelText: {
    color: "#E55959",
    fontSize: fs(14),
    marginLeft: hs(10),
  },
  slotPill: {
    paddingVertical: vs(6),
    paddingHorizontal: hs(12),
    borderRadius: ms(15),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    backgroundColor: "#FFF",
  },
  slotPillSelected: {
    backgroundColor: "#63A1FD",
    borderColor: "#63A1FD",
  },
});
