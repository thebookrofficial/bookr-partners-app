// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, DetailsSkeleton } from "@/components/ui";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  X,
  ChevronLeft,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useBookingDetails } from "../hooks/useBookingDetails";
import perf from "@react-native-firebase/perf";

const icGpay = require("@/assets/icons/google-pay.png");
const icPhonepe = require("@/assets/icons/icons8-phone-pe-48.png");
const icPaytm = require("@/assets/icons/paytm.png");
const icCash = require("@/assets/icons/pay-50.png");
const icWhatsapp = require("@/assets/icons/social.png");
const icCall = require("@/assets/icons/phone-call.png");

export const BookingDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "BookingDetails">>();
  const { bookingId } = route.params;

  const { booking, paymentLogs, loading, isSaving, logPayment, cancelBooking, refresh } =
    useBookingDetails(bookingId);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const getIconForMode = (mode: string, note?: string) => {
    const noteUpper = note?.toUpperCase() || "";
    if (noteUpper === "GPAY") return icGpay;
    if (noteUpper === "PHONEPE") return icPhonepe;
    if (noteUpper === "PAYTM") return icPaytm;
    if (noteUpper === "CASH" || mode === "cash") return icCash;
    if (mode === "upi") return icGpay;
    return icCash;
  };

  const getNameForMode = (mode: string, note?: string) => {
    const noteUpper = note?.toUpperCase() || "";
    if (["GPAY", "PHONEPE", "PAYTM", "CASH"].includes(noteUpper)) {
      return noteUpper === "GPAY"
        ? "GPay"
        : noteUpper === "PHONEPE"
        ? "PhonePe"
        : noteUpper === "PAYTM"
        ? "Paytm"
        : "Cash";
    }
    return mode === "upi" ? "Online" : mode.toUpperCase();
  };
  const [paymentInput, setPaymentInput] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">(
    "cash",
  );

  if (loading || !booking) {
    return (
      <View style={styles.root}>
        <DetailsSkeleton />
      </View>
    );
  }

  const profileData = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
  const guestName = booking.guest_name || profileData?.full_name || "Guest User";
  const guestPhone = booking.guest_phone || profileData?.phone || "N/A";

  const totalAmount = Number(booking.total_amount) || 0;
  const currentPaid = Number(booking.paid_amount) || 0;
  const totalDiscount = Number(booking.discount_amount) || 0;
  const totalFees = booking.platform_fee || 0;

  const sportsType = booking.venues?.sports_venues?.[0]?.sports_type || "";
  const isPickleball = sportsType.toLowerCase().includes("pickleball");

  const displayTotalAmount = totalAmount;
  const displayAmountPaid = currentPaid + totalDiscount - (isPickleball ? totalFees : 0);
  const remainingAmount = Math.max(0, displayTotalAmount - displayAmountPaid);

  const formatHour = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const hourInt = parseInt(h, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    const displayMins = m === "00" ? "" : `:${m}`;
    return `${displayHour}${displayMins} ${ampm}`;
  };

  const isOnline = booking.booking_source === "online" || !!booking.user_id;

  const handleSavePayment = async () => {
    const amountAdded = parseFloat(paymentInput) || 0;

    if (amountAdded <= 0) {
      Alert.alert("Notice", "Please enter an amount to save.");
      return;
    }

    if (amountAdded > remainingAmount) {
      Alert.alert("Invalid Amount", "Cannot add more than the remaining balance.");
      return;
    }

    const backendMethod = selectedMethod === "cash" ? "cash" : "upi";
    let noteText = "CASH";
    if (selectedMethod === "gpay") noteText = "GPAY";
    if (selectedMethod === "phonepe") noteText = "PHONEPE";
    if (selectedMethod === "paytm") noteText = "PAYTM";

    const trace = await perf().startTrace("booking_add_money");
    try {
      const success = await logPayment(amountAdded, backendMethod, noteText);
      if (success) {
        setPaymentInput("");
        setIsAddingPayment(false);
      }
    } finally {
      await trace.stop();
    }
  };

  const handleCall = () => {
    if (guestPhone === "N/A") {
      Alert.alert("Error", "No phone number available for this guest.");
      return;
    }

    const cleanNumber = guestPhone.replace(/[^\d+]/g, "");
    const url = `tel:${cleanNumber}`;

    Linking.openURL(url).catch(err => {
      console.error("Dialer error:", err);
      Alert.alert("Error", "Unable to open the phone dialer.");
    });
  };

  const handleShareWhatsApp = () => {
    if (guestPhone === "N/A") {
      Alert.alert("Error", "No phone number available to share WhatsApp message.");
      return;
    }

    let cleanNumber = guestPhone.replace(/\D/g, "");
    if (cleanNumber.length === 10) {
      cleanNumber = `91${cleanNumber}`;
    }

    const venueName = booking.venues?.name || "the venue";
    const bookingDate = new Date(booking.sports_slots.slot_date).toLocaleDateString("en-GB");
    const bookingTime = `${formatHour(booking.sports_slots.start_time)} to ${formatHour(
      booking.sports_slots.end_time,
    )}`;
    const spicyLine =
      "🔥 Don't let your slot get snatched! Lock in your favorite time instantly on the Bookr app.";

    const playStoreLink = "https://play.google.com/store/apps/details?id=com.bookr_mobile";
    const appStoreLink = "https://apps.apple.com/app/bookr/idYOUR_APP_ID";
    const appLink = Platform.OS === "ios" ? appStoreLink : playStoreLink;

    const message = encodeURIComponent(
      `Booking Confirmed! 🎉\n` +
        `Hi ${guestName},\n` +
        `Your booking at ${venueName} is reserved.\n\n` +
        `Date: ${bookingDate}\n` +
        `Time: ${bookingTime}\n\n` +
        `${spicyLine}\n\n` +
        `${appLink}\n\n` +
        `Thank you for playing with us!`,
    );

    const url = `whatsapp://send?phone=${cleanNumber}&text=${message}`;

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          const webUrl = `https://wa.me/${cleanNumber}?text=${message}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch(err => console.error("An error occurred", err));
  };

  return (
    <ScreenContainer
      scrollable
      backgroundColor={COLORS.background}
      paddingHorizontal={hs(12)}
      footer={
        <View style={styles.fixedBottomActions}>
          {/* 4. Bottom Action Buttons */}
          <View style={styles.actionRowBottom}>
            <TouchableOpacity
              style={styles.repeatBtn}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("RepeatBooking", {
                  bookingId: booking.id,
                  venueId: booking.venue_id,
                  groundId: booking.sports_slots?.ground_id || "",
                })
              }>
              <Text variant="body1" family="bison" style={styles.repeatBtnText}>
                REPEAT BOOKING
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rescheduleBtn}
              disabled={booking.booking_status === "cancelled"}
              onPress={() => {
                if (booking.booking_status !== "cancelled") {
                  navigation.navigate("RescheduleBooking", {
                    bookingId,
                    venueId: booking.venue_id,
                    groundId: booking.sports_slots?.ground_id || "",
                  });
                }
              }}>
              <Text
                variant="body1"
                family="bison"
                style={[
                  styles.rescheduleBtnText,
                  booking.booking_status === "cancelled" && { color: COLORS.text.muted },
                ]}>
                RESCHEDULE
              </Text>
            </TouchableOpacity>
          </View>

          {booking.booking_status !== "cancelled" &&
            (!isOnline || booking.venues?.allow_cancellation) && (
              <TouchableOpacity
                style={styles.cancelBtnBottom}
                onPress={() => setShowCancelModal(true)}>
                <Text variant="body1" family="bison" style={styles.cancelBtnBottomText}>
                  CANCEL YOUR BOOKING
                </Text>
                <Trash2 size={ms(24)} color="#fff" />
              </TouchableOpacity>
            )}
        </View>
      }>
      {/* 1. Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={ms(28)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtnGreen} onPress={handleShareWhatsApp}>
              <Image source={icWhatsapp} style={styles.headerIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnBlue} onPress={handleCall}>
              <Image source={icCall} style={styles.headerIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.avatarContainer}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate("GuestHistory", {
              bookingId,
              vertical: "sports",
              venueId: booking.venue_id,
            });
          }}>
          <Image
            source={
              profileData?.avatar_url
                ? { uri: profileData.avatar_url }
                : require("@/assets/images/avatar_man.png")
            }
            style={styles.avatarImage}
          />
        </TouchableOpacity>

        <Text variant="h2" weight="bold" style={styles.headerName}>
          {guestName}
        </Text>
      </View>

      {/* 2. Date & Time Slots */}
      <View style={styles.dateTimeRow}>
        <View style={styles.dateCard}>
          <View style={styles.iconBoxBlue}>
            <Calendar size={ms(24)} color="#63a1fd" />
          </View>
          <View style={styles.dateCardTextCol}>
            <Text variant="body2" weight="bold" style={styles.labelTitle}>
              Date
            </Text>
            <Text variant="body2" weight="semiBold" style={styles.labelValue}>
              {new Date(booking.sports_slots.slot_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        <View style={styles.dateCard}>
          <View style={styles.iconBoxBlue}>
            <Clock size={ms(24)} color="#63a1fd" />
          </View>
          <View style={styles.dateCardTextCol}>
            <Text variant="body2" weight="bold" style={styles.labelTitle}>
              Time Slots
            </Text>
            <Text variant="body2" weight="semiBold" style={styles.labelValue}>
              {formatHour(booking.sports_slots.start_time)} -{" "}
              {formatHour(booking.sports_slots.end_time)}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Payment Container */}
      <View style={styles.paymentCard}>
        <View style={styles.amountsRow}>
          <View style={styles.amountBoxLight}>
            <Text variant="body2" weight="bold" style={styles.amountLabel}>
              Pending Amount
            </Text>
            <Text variant="h3" weight="bold" style={styles.amountValueRed}>
              ₹{remainingAmount}
            </Text>
          </View>
          <View style={styles.amountBoxBordered}>
            <Text variant="body2" weight="bold" style={styles.amountLabel}>
              Received Amount
            </Text>
            <Text variant="h3" weight="bold" style={styles.amountValueGreen}>
              ₹{displayAmountPaid}
            </Text>
          </View>
        </View>

        {remainingAmount <= 0 ? (
          <View style={[styles.addMoneyBtn, { backgroundColor: "#9F9F9F" }]}>
            <Text variant="body1" weight="bold" style={styles.addMoneyBtnText}>
              Payment Completed
            </Text>
          </View>
        ) : (
          <>
            {!isAddingPayment ? (
              <TouchableOpacity style={styles.addMoneyBtn} onPress={() => setIsAddingPayment(true)}>
                <Text variant="body1" weight="bold" align="center" style={styles.addMoneyBtnText}>
                  Add Money +
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text variant="body2" weight="bold" style={styles.inputLabel}>
                  Amount
                </Text>
                <View style={styles.amountInputContainer}>
                  <Text variant="h3" weight="bold" style={styles.currencySymbol}>
                    ₹
                  </Text>
                  <TextInput
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={paymentInput}
                    onChangeText={text => {
                      const numericValue = text.replace(/[^0-9]/g, "");
                      setPaymentInput(numericValue);
                    }}
                  />
                  <TouchableOpacity onPress={() => setIsAddingPayment(false)}>
                    <Text
                      variant="body2"
                      weight="bold"
                      style={{ color: "#E55959", fontSize: fs(14) }}>
                      - Cancel
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text variant="body2" weight="bold" style={styles.inputLabel}>
                  Method
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

                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  onPress={handleSavePayment}
                  disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text variant="body1" weight="bold" style={styles.addMoneyBtnText}>
                      Save Payment
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* Payment History Accordion */}
      {paymentLogs.length > 0 && (
        <View style={styles.paymentAccordionContainer}>
          <TouchableOpacity
            style={[
              styles.paymentAccordionHeader,
              { marginBottom: showPaymentHistory ? vs(10) : 0 },
            ]}
            activeOpacity={0.7}
            onPress={() => setShowPaymentHistory(!showPaymentHistory)}>
            <View style={styles.paymentAccordionTitleRow}>
              <Image
                source={require("@/assets/icons/pay-50.png")}
                style={styles.paymentAccordionTitleIcon}
              />
              <Text variant="body1" weight="semiBold" style={styles.paymentAccordionTitleText}>
                Payment History
              </Text>
            </View>
            {showPaymentHistory ? (
              <ChevronUp size={ms(24)} color={COLORS.text.primary} />
            ) : (
              <ChevronDown size={ms(24)} color={COLORS.text.primary} />
            )}
          </TouchableOpacity>

          {showPaymentHistory &&
            paymentLogs.map(log => {
              const icon = getIconForMode(log.payment_mode, log.note);
              const name = getNameForMode(log.payment_mode, log.note);
              return (
                <TouchableOpacity
                  key={log.id}
                  style={[styles.ledgerRow, styles.paymentAccordionRow]}
                  onPress={() => navigation.navigate("PaymentHistory", { bookingId: booking.id })}
                  activeOpacity={0.7}>
                  <View style={styles.paymentLogLeft}>
                    <Image source={icon} style={styles.paymentLogIcon} />
                    <Text variant="body2" weight="semiBold" style={styles.paymentLogName}>
                      {name}
                    </Text>
                  </View>
                  <View style={styles.paymentAccordionDateCol}>
                    <Text variant="body2" weight="semiBold" style={styles.paymentLogName}>
                      {new Date(log.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.ledgerRight}>
                    <Text variant="body1" weight="bold" color="#00B562">
                      ₹{log.amount}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </View>
      )}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCancelModal(false)} />
          <View style={styles.cancelModalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="body1" weight="bold" style={styles.modalTitle}>
                BOOKING CANCELLATION
              </Text>
              <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                <X size={ms(20)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            <Text variant="body1" weight="bold" style={styles.modalMessage}>
              Are you sure you want to cancel this booking?
            </Text>

            <Text variant="body2" color={COLORS.text.muted} style={styles.modalSubtext}>
              Once cancelled, this booking cannot be restored, and refund will be processed as per
              our cancellation policy.
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalBackBtn}
                onPress={() => setShowCancelModal(false)}>
                <Text variant="h3" family="nichrome" style={styles.modalBackText}>
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={async () => {
                  setShowCancelModal(false);
                  const trace = await perf().startTrace("cancel_booking");
                  try {
                    const success = await cancelBooking();
                    if (success) {
                      navigation.goBack();
                    }
                  } finally {
                    await trace.stop();
                  }
                }}>
                <Text variant="h3" family="nichrome" color="#FFF" style={styles.modalConfirmText}>
                  Yes, cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  fixedBottomActions: {
    paddingVertical: vs(20),
    paddingHorizontal: hs(10),
    backgroundColor: COLORS.background,
  },
  confirmCancelBtn: {
    backgroundColor: COLORS.danger,
    padding: ms(15),
    borderRadius: ms(30),
    alignItems: "center",
  },
  flex1: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(12),
    marginTop: vs(12),
    marginBottom: vs(16),
    alignItems: "center",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginBottom: vs(8),
  },
  backBtn: {
    padding: ms(4),
  },
  headerActions: {
    flexDirection: "row",
    gap: hs(8),
  },
  iconBtnGreen: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnBlue: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    width: ms(40),
    height: ms(40),
    resizeMode: "contain",
  },
  avatarContainer: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: vs(8),
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerName: {
    fontSize: fs(20),
    color: "#000",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(16),
  },
  dateCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(10),
    alignItems: "center",
    gap: hs(8),
  },
  iconBoxBlue: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#dbeafe", // lighter blue for the icon background
    justifyContent: "center",
    alignItems: "center",
  },
  dateCardTextCol: {
    flex: 1,
  },
  labelTitle: {
    fontSize: fs(12),
    color: "#000",
    marginBottom: vs(2),
  },
  labelValue: {
    fontSize: fs(14),
    color: "#000",
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(10),
    padding: ms(16),
    backgroundColor: "#F4F7FC",
    marginBottom: vs(16),
  },
  amountsRow: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(16),
  },
  amountBoxLight: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    borderColor: "#63A1FD",
    borderWidth: 1,
    borderRadius: ms(8),
    paddingVertical: vs(12),
    paddingHorizontal: hs(8),
    alignItems: "center",
    justifyContent: "center",
  },
  amountBoxBordered: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#63a1fd",
    borderRadius: ms(8),
    paddingVertical: vs(12),
    paddingHorizontal: hs(8),
    alignItems: "center",
    justifyContent: "center",
  },
  amountLabel: {
    fontSize: fs(14),
    color: "#444",
    marginBottom: vs(4),
  },
  amountValueRed: {
    fontSize: fs(20),
    color: "#E55959",
  },
  amountValueGreen: {
    fontSize: fs(20),
    color: "#00B562",
  },
  inputLabel: {
    fontSize: fs(14),
    color: "#000",
    marginBottom: vs(8),
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(8),
    paddingHorizontal: hs(12),
    marginBottom: vs(16),
    height: vs(46),
  },
  currencySymbol: {
    fontSize: fs(18),
    color: "#000",
    marginRight: hs(8),
  },
  amountInput: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(24),
    color: COLORS.text.primary,
    flex: 1,
  },
  methodsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: vs(16),
  },
  methodBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(8),
    paddingVertical: vs(10),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: hs(4),
    backgroundColor: "#fff",
  },
  methodBoxSelectedBlue: {
    backgroundColor: "#63a1fd",
    borderColor: "#63a1fd",
  },
  methodText: {
    fontSize: fs(12),
    marginTop: vs(6),
    color: "#000",
  },
  methodTextSelected: {
    color: "#fff",
  },
  methodIcon: {
    width: ms(44),
    height: ms(44),
    resizeMode: "contain",
  },
  methodIconSelected: {
    tintColor: "",
  },
  addMoneyBtn: {
    backgroundColor: "#63a1fd",
    borderRadius: ms(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  addMoneyBtnText: {
    fontSize: fs(16),
    color: "#fff",
  },
  actionRowBottom: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(12),
  },
  repeatBtn: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  repeatBtnText: {
    fontSize: fs(18),
    color: "#000",
  },
  rescheduleBtn: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "#63a1fd",
    borderRadius: ms(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  rescheduleBtnText: {
    fontSize: fs(18),
    color: "#63a1fd",
  },
  cancelBtnBottom: {
    flexDirection: "row",
    backgroundColor: "#E55959",
    borderRadius: ms(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
    gap: hs(8),
  },
  cancelBtnBottomText: {
    fontSize: fs(18),
    color: "#fff",
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(44),
    marginBottom: vs(12),
  },
  actionCardText: {
    flex: 1,
    marginLeft: hs(8),
  },
  ledgerContainer: {
    marginTop: vs(4),
    marginBottom: vs(14),
    padding: hs(10),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  ledgerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  ledgerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  ledgerDate: {
    fontSize: fs(12),
  },
  ledgerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
  },
  ledgerMode: {
    fontSize: fs(10),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelModalContainer: {
    width: "90%",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#63A1FD",
    padding: ms(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(10),
  },
  modalTitle: {
    fontSize: fs(16),
    textTransform: "uppercase",
  },
  modalMessage: {
    fontSize: fs(16),
    marginBottom: vs(6),
    lineHeight: vs(20),
  },
  modalSubtext: {
    fontSize: fs(12),
    marginBottom: vs(16),
    lineHeight: vs(16),
  },
  modalActionRow: {
    flexDirection: "row",
    gap: hs(10),
  },
  modalBackBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: "#E55959",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackText: {
    fontSize: fs(20),
    textTransform: "lowercase",
  },
  modalConfirmText: {
    fontSize: fs(20),
  },
  actionCardDangerText: {
    color: "#E55959",
    marginLeft: hs(8),
  },
  paymentHistoryTitle: {
    marginBottom: vs(8),
  },
  paymentLogCard: {
    backgroundColor: "#f4f7fc",
    borderRadius: ms(8),
    padding: ms(8),
    marginBottom: vs(8),
  },
  paymentLogLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  paymentLogIcon: {
    width: ms(32),
    height: ms(32),
    resizeMode: "contain",
  },
  paymentLogName: {
    color: "#000",
  },
  paymentAccordionContainer: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(10),
    padding: ms(10),
    marginBottom: vs(16),
  },
  paymentAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentAccordionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  paymentAccordionTitleIcon: {
    width: ms(24),
    height: ms(24),
  },
  paymentAccordionTitleText: {
    color: "#000",
  },
  paymentAccordionRow: {
    paddingVertical: vs(4),
    marginBottom: vs(8),
  },
  paymentAccordionDateCol: {
    flex: 1,
    alignItems: "center",
  },
});
