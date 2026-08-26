// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
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
  Keyboard,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, DetailsSkeleton } from "@/components/ui";
import { useKeyboardStore } from "@/store/keyboardStore";
import {
  Clock,
  Trash2,
  X,
  ChevronLeft,
  Phone,
  ChevronUp,
  ChevronDown,
  MapPin,
  Tag,
} from "lucide-react-native";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
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

import ClockSvg from "@/assets/icons/ic-tabler-clock.svg";
import DownloadSvg from "@/assets/icons/ic-material-symbols-download-rounded.svg";
import MoneySvg from "@/assets/icons/ic-tdesign-money.svg";
import PersonSvg from "@/assets/icons/ic-round-person.svg";
import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";

export const BookingDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "BookingDetails">>();
  const setIsNumericFocused = useKeyboardStore(state => state.setIsNumericFocused);
  const { bookingId, idChain } = route.params;

  const {
    booking,
    paymentLogs,
    loading,
    isSaving,
    logPayment,
    cancelBooking,
    refresh,
    removePaymentLog,
  } = useBookingDetails(bookingId, idChain);

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const subs = [
      Keyboard.addListener("keyboardWillShow", () => setIsKeyboardVisible(true)),
      Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true)),
      Keyboard.addListener("keyboardWillHide", () => setIsKeyboardVisible(false)),
      Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false)),
    ];
    return () => {
      subs.forEach(s => s.remove());
    };
  }, []);

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentInput, setPaymentInput] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">(
    "cash",
  );

  const [showPaymentHistory, setShowPaymentHistory] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedLogToDelete, setSelectedLogToDelete] = useState<any>(null);

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
    const modeUpper = mode?.toUpperCase() || "";
    const noteUpper = note?.toUpperCase() || "";

    if (["GPAY", "PHONEPE", "PAYTM", "CASH"].includes(modeUpper)) {
      return modeUpper === "GPAY"
        ? "GPay"
        : modeUpper === "PHONEPE"
        ? "PhonePe"
        : modeUpper === "PAYTM"
        ? "Paytm"
        : "Cash";
    }

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

  const sportsType =
    booking.sports_slots?.sports_grounds?.sports_type ||
    booking.venues?.sports_venues?.[0]?.sports_type ||
    "";
  const isPickleball = sportsType.toLowerCase().includes("pickleball");

  let groundName = booking.sports_slots?.sports_grounds?.name || "";
  const catName = sportsType.toLowerCase();
  const groundLower = groundName.toLowerCase();
  if (catName && groundLower.startsWith(catName)) {
    groundName = groundName.slice(catName.length).trim();
  }

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

  const getSourceDisplay = () => {
    const source = booking.booking_source?.toLowerCase();
    if (source === "offline") {
      return { text: "Offline", bg: "#FDE8E8", color: "#E55959" };
    }
    if (source === "online" || !!booking.user_id) {
      return { text: "Online", bg: "#E8F0FE", color: "#4A80F0" };
    }
    return {
      text: booking.booking_source
        ? booking.booking_source.charAt(0).toUpperCase() + booking.booking_source.slice(1)
        : "Unknown",
      bg: "#F3F4F6",
      color: "#6B7280",
    };
  };
  const statusStyle = getSourceDisplay();

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

    const backendMethod = selectedMethod;
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
    <GestureHandlerRootView style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        footer={
          !isKeyboardVisible ? (
            <View style={styles.fixedBottomActions}>
              {!isOnline && (
                <View style={styles.actionRowBottom}>
                  <TouchableOpacity
                    style={styles.repeatBtn}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate("RepeatBooking", {
                        bookingId: booking.id,
                        venueId: booking.venue_id,
                        groundId: booking.sports_slots?.ground_id || "",
                        idChain: booking.idChain,
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
                          idChain: booking.idChain,
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
              )}

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
          ) : null
        }>
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={ms(28)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" style={styles.screenTitle}>
            Booking Details
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileCard}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate("GuestHistory", {
              bookingId,
              vertical: "sports",
              venueId: booking.venue_id,
            });
          }}>
          {profileData?.avatar_url ? (
            <Image source={{ uri: profileData.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <PersonSvg width={ms(32)} height={ms(32)} color="#63a1fd" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text variant="h3" weight="bold" style={styles.profileName}>
              {guestName}
            </Text>
            <Text variant="body2" style={styles.profilePhone}>
              {guestPhone}
            </Text>
            <View style={[styles.onlineBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.onlineBadgeText, { color: statusStyle.color }]}>
                {statusStyle.text}
              </Text>
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity onPress={handleShareWhatsApp}>
              <Image source={icWhatsapp} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnBlue} onPress={handleCall}>
              <Phone size={ms(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <Tag size={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                Category
              </Text>
              <Text variant="body2" style={styles.labelValue}>
                {sportsType ? sportsType.charAt(0).toUpperCase() + sportsType.slice(1) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <MapPin size={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                Ground
              </Text>
              <Text variant="body2" style={styles.labelValue} numberOfLines={1}>
                {groundName || "-"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <CalendarSvg width={ms(20)} height={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                Date
              </Text>
              <Text variant="body2" style={styles.labelValue}>
                {new Date(booking.sports_slots.slot_date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <Clock size={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body1" weight="bold" style={styles.labelTitle}>
                Time Slots
              </Text>
              <Text variant="body1" style={styles.labelValue}>
                {formatHour(booking.sports_slots.start_time)} to{" "}
                {formatHour(booking.sports_slots.end_time)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <View style={styles.amountsRow}>
            <View style={styles.amountBoxLightRed}>
              <View style={styles.amountIconRed}>
                <ClockSvg width={ms(20)} height={ms(20)} color="#E55959" />
              </View>
              <View style={styles.amountTextCol}>
                <Text variant="body1" weight="bold" style={styles.amountLabel}>
                  Pending Amount
                </Text>
                <Text variant="body1" weight="semiBold" style={styles.amountValueRed}>
                  ₹{remainingAmount}
                </Text>
              </View>
            </View>

            <View style={styles.amountBoxLightGreen}>
              <View style={styles.amountIconGreen}>
                <DownloadSvg width={ms(20)} height={ms(20)} color="#00B562" />
              </View>
              <View style={styles.amountTextCol}>
                <Text variant="body1" weight="bold" style={styles.amountLabel}>
                  Received Amount
                </Text>
                <Text variant="body1" weight="semiBold" style={styles.amountValueGreen}>
                  ₹{displayAmountPaid}
                </Text>
              </View>
            </View>
          </View>

          {remainingAmount <= 0 ? (
            <View style={[styles.addMoneyBtn, styles.addMoneyBtnCompleted]}>
              <Text variant="body1" weight="bold" style={styles.addMoneyBtnText}>
                Payment Completed
              </Text>
            </View>
          ) : (
            <>
              {!isAddingPayment ? (
                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  onPress={() => setIsAddingPayment(true)}>
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
                      onFocus={() => setIsNumericFocused(true)}
                      onBlur={() => setIsNumericFocused(false)}
                      onChangeText={text => {
                        const numericValue = text.replace(/[^0-9]/g, "");
                        setPaymentInput(numericValue);
                      }}
                    />
                    <TouchableOpacity onPress={() => setIsAddingPayment(false)}>
                      <Text variant="body2" weight="bold" style={styles.cancelText}>
                        - Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text variant="body2" weight="bold" style={styles.inputLabel}>
                    Method
                  </Text>
                  <View style={styles.methodsRow}>
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
                        variant="body1"
                        weight="bold"
                        style={[
                          styles.methodText,
                          selectedMethod === "cash" && styles.methodTextSelected,
                        ]}>
                        Cash
                      </Text>
                    </TouchableOpacity>
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
                        variant="body1"
                        weight="bold"
                        style={[
                          styles.methodText,
                          selectedMethod === "gpay" && styles.methodTextSelected,
                        ]}>
                        GPay
                      </Text>
                    </TouchableOpacity>
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
                        variant="body1"
                        weight="bold"
                        style={[
                          styles.methodText,
                          selectedMethod === "phonepe" && styles.methodTextSelected,
                        ]}>
                        PhonePe
                      </Text>
                    </TouchableOpacity>
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
                        variant="body1"
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

        {paymentLogs.length > 0 && (
          <View style={styles.paymentHistoryContainer}>
            <TouchableOpacity
              style={styles.paymentHistoryBtn}
              activeOpacity={0.7}
              onPress={() => setShowPaymentHistory(!showPaymentHistory)}>
              <View style={styles.paymentHistoryLeft}>
                <MoneySvg width={ms(24)} height={ms(24)} color="#000" />
                <Text variant="body1" weight="semiBold" style={styles.paymentHistoryText}>
                  Payment History
                </Text>
              </View>
              {showPaymentHistory ? (
                <ChevronUp size={ms(24)} color={COLORS.text.primary} />
              ) : (
                <ChevronDown size={ms(24)} color={COLORS.text.primary} />
              )}
            </TouchableOpacity>
            {showPaymentHistory && (
              <View style={styles.paymentLogsWrapper}>
                {paymentLogs.map((log, index) => {
                  const icon = getIconForMode(log.payment_mode, log.note);
                  const name = getNameForMode(log.payment_mode, log.note);

                  const renderRightActions = () => (
                    <View style={styles.swipeActionsContainer}>
                      <TouchableOpacity
                        style={styles.swipeActionDelete}
                        onPress={() => {
                          setSelectedLogToDelete(log);
                          setDeleteModalVisible(true);
                        }}>
                        <Trash2 size={ms(18)} color="#E55959" />
                      </TouchableOpacity>
                    </View>
                  );

                  return (
                    <Swipeable
                      key={log.id}
                      renderRightActions={renderRightActions}
                      overshootRight={false}
                      containerStyle={[
                        index !== paymentLogs.length - 1 && { marginBottom: vs(8) },
                      ]}>
                      <TouchableOpacity
                        style={[styles.logCard, styles.logCardNoMargin]}
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate("PaymentHistory", { bookingId: booking.id })
                        }>
                        <View style={styles.logLeftCol}>
                          <Image source={icon} style={styles.logIcon} />
                          <Text variant="body2" weight="semiBold" style={styles.logName}>
                            {name}
                          </Text>
                        </View>
                        <Text variant="body2" weight="semiBold" style={styles.logDate}>
                          {new Date(log.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                        <Text variant="body1" weight="semiBold" style={styles.logAmount}>
                          ₹{log.amount}
                        </Text>
                      </TouchableOpacity>
                    </Swipeable>
                  );
                })}
              </View>
            )}
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

      <Modal visible={deleteModalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setDeleteModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.bottomSheetContainer}>
            <View style={styles.deleteModalRow}>
              <View style={styles.deleteModalLeft}>
                <Text variant="body1" weight="bold" style={styles.deleteModalTitle}>
                  Delete
                </Text>
                <Text variant="h2" weight="bold" style={styles.deleteModalAmount}>
                  ₹{selectedLogToDelete?.amount}
                </Text>
                <Text variant="body2" style={styles.deleteModalWarning}>
                  Are you sure you want to cancel{"\n"}this Payment?
                </Text>
              </View>
              <View style={styles.deleteModalRight}>
                <TouchableOpacity
                  style={styles.deleteConfirmBtn}
                  onPress={async () => {
                    if (selectedLogToDelete) {
                      const success = await removePaymentLog(selectedLogToDelete.id);
                      if (success) {
                        setDeleteModalVisible(false);
                        setSelectedLogToDelete(null);
                      }
                    }
                  }}
                  disabled={isSaving}>
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Trash2 size={ms(20)} color="#fff" style={{ marginRight: hs(8) }} />
                      <Text variant="body1" weight="bold" style={styles.deleteConfirmBtnText}>
                        CANCEL
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  swipeActionsContainer: {
    width: ms(60),
    justifyContent: "center",
    alignItems: "center",
  },
  swipeActionDelete: {
    backgroundColor: "#FFEBEB",
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: ms(24),
    borderTopRightRadius: ms(24),
    padding: ms(24),
    paddingBottom: Platform.OS === "ios" ? ms(40) : ms(24),
  },
  deleteModalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deleteModalLeft: {
    flex: 1,
  },
  deleteModalTitle: {
    fontSize: fs(18),
    color: "#E55959",
    marginBottom: vs(4),
  },
  deleteModalAmount: {
    fontSize: fs(32),
    color: "#000",
    marginBottom: vs(8),
  },
  deleteModalWarning: {
    fontSize: fs(14),
    color: "#666",
    lineHeight: vs(20),
  },
  deleteModalRight: {
    justifyContent: "flex-end",
  },
  deleteConfirmBtn: {
    backgroundColor: "#E55959",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: hs(20),
    paddingVertical: vs(14),
    borderRadius: ms(16),
  },
  deleteConfirmBtnText: {
    color: "#fff",
    fontSize: fs(16),
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  fixedBottomActions: {
    paddingVertical: vs(12),
    paddingHorizontal: hs(10),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderColor: "#EBEBEB",
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
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(16),
  },
  screenTitle: {
    fontSize: fs(20),
    color: "#000",
    marginLeft: hs(12),
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
    borderRadius: ms(16),
    padding: ms(12),
    marginBottom: vs(16),
  },
  avatarImage: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    marginRight: hs(12),
  },
  avatarPlaceholder: {
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    marginRight: hs(12),
    backgroundColor: "#E6F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: fs(18),
    color: "#000",
    marginBottom: vs(2),
  },
  profilePhone: {
    fontSize: fs(16),
    color: "#000",
    marginBottom: vs(4),
  },
  onlineBadge: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: hs(8),
    paddingVertical: vs(2),
    borderRadius: ms(12),
    alignSelf: "flex-start",
  },
  onlineBadgeText: {
    color: "#4A80F0",
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
  },
  profileActions: {
    flexDirection: "row",
    gap: hs(8),
  },
  socialIcon: {
    width: ms(40),
    height: ms(40),
    resizeMode: "contain",
  },
  iconBtnBlue: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },

  backBtn: {
    padding: ms(4),
    marginLeft: -ms(8),
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
  iconBoxLightBlue: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: "#E6F0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  dateCardTextCol: {
    flex: 1,
  },
  labelTitle: {
    fontSize: fs(16),
    color: "#000",
    marginBottom: vs(2),
  },
  labelValue: {
    fontSize: fs(16),
    color: "#000",
  },
  paymentCard: {
    borderRadius: ms(16),
    padding: ms(16),
    backgroundColor: "#F7F9FC",
    marginBottom: vs(16),
  },
  amountsRow: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(16),
  },
  amountBoxLightRed: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    borderRadius: ms(12),
    paddingVertical: vs(10),
    paddingHorizontal: hs(8),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: hs(8),
  },
  amountIconRed: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  amountBoxLightGreen: {
    flex: 1,
    backgroundColor: "#F4F7FC",
    borderRadius: ms(12),
    paddingVertical: vs(12),
    paddingHorizontal: hs(8),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: hs(8),
  },
  amountIconGreen: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: "#D6FFE9",
    justifyContent: "center",
    alignItems: "center",
  },
  amountTextCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: fs(12),
    color: "#000",
    marginBottom: vs(2),
    fontFamily: "Gilroy-Medium",
  },
  amountValueRed: {
    fontSize: fs(20),
    color: "#E55959",
    fontFamily: "Gilroy-Medium",
  },
  amountValueGreen: {
    fontSize: fs(20),
    color: "#00B562",
    fontFamily: "Gilroy-Medium",
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
    height: vs(50),
  },
  currencySymbol: {
    fontSize: fs(18),
    color: "#000",
    marginRight: hs(8),
  },
  amountInput: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(22),
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
    fontSize: fs(14),
    marginTop: vs(2),
    color: "#000",
  },
  methodTextSelected: {
    color: "#fff",
  },
  methodIcon: {
    width: ms(48),
    height: ms(48),
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
  addMoneyBtnCompleted: {
    backgroundColor: "#9F9F9F",
  },
  cancelText: {
    color: "#E55959",
    fontSize: fs(14),
  },
  actionRowBottom: {
    flexDirection: "row",
    gap: hs(12),
    marginBottom: vs(12),
  },
  repeatBtn: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: ms(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  repeatBtnText: {
    fontSize: fs(20),
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
    fontSize: fs(20),
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
    fontSize: fs(20),
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
    width: ms(48),
    height: ms(48),
    resizeMode: "contain",
  },
  paymentLogName: {
    color: "#000",
  },
  paymentHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    marginBottom: 0,
  },
  paymentHistoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  paymentHistoryContainer: {
    marginBottom: vs(16),
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(12),
    backgroundColor: "#fff",
    padding: ms(16),
  },
  paymentHistoryText: {
    fontSize: fs(16),
    color: "#000",
  },
  paymentLogsWrapper: {
    marginTop: vs(10),
    marginBottom: vs(-16),
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: vs(8),
    marginBottom: vs(8),
  },
  logLeftCol: {
    flexDirection: "row",
    alignItems: "center",
    width: "35%",
    gap: hs(12),
  },
  logIcon: {
    width: ms(48),
    height: ms(48),
    resizeMode: "contain",
  },
  logName: {
    fontSize: fs(16),
    color: "#000",
  },
  logDate: {
    fontSize: fs(16),
    color: "#000",
    textAlign: "center",
    flex: 1,
  },
  logAmount: {
    fontSize: fs(16),
    color: "#00B562",
    width: "25%",
    textAlign: "right",
  },
  logCardNoMargin: {
    marginBottom: 0,
  },
  deletePaymentModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    padding: ms(20),
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  deletePaymentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deletePaymentModalTextCol: {
    flex: 1,
    paddingRight: hs(16),
  },
  deletePaymentModalQuestion: {
    fontSize: fs(16),
    marginTop: vs(4),
  },
  deletePaymentConfirmBtn: {
    backgroundColor: "#E55959",
    paddingHorizontal: hs(24),
    paddingVertical: vs(12),
    borderRadius: ms(8),
    minWidth: hs(80),
    alignItems: "center",
  },
  deletePaymentConfirmBtnText: {
    color: "#fff",
    fontSize: fs(16),
  },
});
