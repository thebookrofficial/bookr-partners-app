// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
  Keyboard,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Trash2, ChevronUp, ChevronDown, Phone } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useStaycationBookingDetails } from "../hooks/useStaycationBookingDetails";
import WalletSvg from "@/assets/icons/ic-streamline-plump-wallet.svg";
import MoneySvg from "@/assets/icons/ic-tdesign-money.svg";
import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";
import DownloadSvg from "@/assets/icons/ic-material-symbols-download-rounded.svg";
import ClockSvg from "@/assets/icons/ic-tabler-clock.svg";
import PersonSvg from "@/assets/icons/ic-round-person.svg";
import { Users2 } from "lucide-react-native";

const icWhatsapp = require("@/assets/icons/social.png");
const icGpay = require("@/assets/icons/google-pay.png");
const icPhonepe = require("@/assets/icons/icons8-phone-pe-48.png");
const icPaytm = require("@/assets/icons/paytm.png");
const icCash = require("@/assets/icons/pay-50.png");

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const StaycationBookingDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { booking: initialBooking, isFromHistory } = route.params || {};

  const { isLoading, isUpdating, bookingDetails, paymentLogs, updatePayment, cancelBooking } =
    useStaycationBookingDetails(initialBooking?.dbId || initialBooking?.id);

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(true);
  const [paymentInput, setPaymentInput] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "gpay" | "phonepe" | "paytm">(
    "cash",
  );

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

  const handleCall = () => {
    const phone = bookingDetails?.profiles?.phone || initialBooking?.phone;
    if (!phone || phone === "N/A") {
      Alert.alert("No Phone Number", "This user hasn't provided a phone number.");
      return;
    }
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
  };

  const handleSavePayment = async () => {
    const amount = parseFloat(paymentInput) || 0;
    if (amount <= 0) {
      Alert.alert("Notice", "Please enter an amount to save.");
      return;
    }

    const success = await updatePayment(paymentInput, selectedMethod);
    if (success) {
      setIsAddingPayment(false);
      setPaymentInput("");
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const success = await cancelBooking();
          if (success) {
            navigation.goBack();
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#63a1fd" />
      </View>
    );
  }

  const units = bookingDetails?.unit_count || 1;

  const totalPayment = bookingDetails?.total_amount
    ? parseFloat(bookingDetails.total_amount) / units
    : parseFloat(initialBooking?.amount) || 0;

  const discountAmount = bookingDetails?.discount_amount
    ? parseFloat(bookingDetails.discount_amount) / units
    : parseFloat(initialBooking?.discountAmount) || 0;

  const amountPaid = bookingDetails?.paid_amount
    ? parseFloat(bookingDetails.paid_amount) / units + discountAmount
    : (parseFloat(initialBooking?.paidAmount) || 0) + discountAmount;

  const remainingAmount = Math.max(0, totalPayment - amountPaid);

  const getGroupType = (requests: string) => {
    if (!requests) return null;
    // Split by either | or ,
    const parts = requests.split(/[|,]/);
    const groupPart = parts.find(
      p =>
        p.trim().toLowerCase().startsWith("group type:") ||
        p.trim().toLowerCase().startsWith("group:"),
    );
    if (groupPart) {
      return groupPart.split(":")[1]?.trim();
    }
    return null;
  };

  const groupType = getGroupType(bookingDetails?.special_requests);
  const isOnline = bookingDetails?.booking_source === "online" || !!bookingDetails?.user_id;
  const isCancelled = bookingDetails?.booking_status === "cancelled";

  const profileData = bookingDetails?.profiles;
  const guestName =
    bookingDetails?.guest_name || profileData?.full_name || initialBooking?.name || "Guest";
  const guestPhone =
    bookingDetails?.guest_phone || profileData?.phone || initialBooking?.phone || "N/A";

  const bookingData = {
    name: guestName,
    phone: guestPhone,
    avatarUrl: profileData?.avatar_url || initialBooking?.avatarUrl,
    checkIn: formatDate(bookingDetails?.check_in_date || initialBooking?.checkIn),
    checkOut: formatDate(bookingDetails?.check_out_date || initialBooking?.checkOut),
    guestCount:
      initialBooking?.guestCount || Math.floor((bookingDetails?.guest_count || 0) / units),
    totalPayment: totalPayment.toFixed(0),
    remainingAmount: remainingAmount.toFixed(0),
    amountPaid: amountPaid.toFixed(0),
    groupType: groupType,
  };

  const handleWhatsAppShare = async () => {
    const spicyLine =
      "🔥 Don't let your slot get snatched! Lock in your favorite time instantly on the Bookr app.";
    const appLink =
      Platform.OS === "ios"
        ? "https://apps.apple.com/app/bookr/idYOUR_APP_ID"
        : "https://play.google.com/store/apps/details?id=com.bookr_mobile";

    const shareMessage = `Booking Confirmed! 🎉\nHi ${bookingData.name},\nYour staycation at ${
      bookingDetails?.venues?.name || "the venue"
    } is locked in via Bookr.\n\nCheck In: ${bookingData.checkIn}\nCheck Out: ${
      bookingData.checkOut
    }\n\nPayment Summary:\nTotal: ₹${bookingData.totalPayment}\nPaid: ₹${
      bookingData.amountPaid
    }\nDue: ₹${bookingData.remainingAmount}\n\n${spicyLine}\n${appLink}\n\nThank you!`;

    const cleanPhone = bookingData.phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(
      shareMessage,
    )}`;

    Linking.canOpenURL(whatsappUrl)
      .then(supported =>
        Linking.openURL(
          supported
            ? whatsappUrl
            : `https://wa.me/${formattedPhone}?text=${encodeURIComponent(shareMessage)}`,
        ),
      )
      .catch(() => Share.share({ message: shareMessage }));
  };

  const getNameForMethod = (method: string) => {
    if (method === "gpay") return "GPay";
    if (method === "phonepe") return "PhonePe";
    if (method === "paytm") return "Paytm";
    return "Cash";
  };

  const getIconForLog = (mode: string) => {
    if (mode === "gpay") return icGpay;
    if (mode === "phonepe") return icPhonepe;
    if (mode === "paytm") return icPaytm;
    if (mode === "upi") return icGpay; // fallback
    return icCash;
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        footer={
          !isKeyboardVisible && !isFromHistory && !isCancelled ? (
            <View style={styles.fixedBottomActions}>
              <TouchableOpacity
                style={styles.cancelBtnBottom}
                onPress={handleCancel}
                disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text variant="body1" family="bison" style={styles.cancelBtnBottomText}>
                      CANCEL YOUR BOOKING
                    </Text>
                    <Trash2 size={ms(22)} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : undefined
        }>
        {/* Header */}
        <View style={styles.screenHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={ms(26)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" style={styles.screenTitle}>
            Booking Details
          </Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {bookingData.avatarUrl ? (
            <Image source={{ uri: bookingData.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <PersonSvg width={ms(32)} height={ms(32)} color="#63a1fd" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text variant="h3" weight="bold" style={styles.profileName}>
              {bookingData.name}
            </Text>
            <Text variant="body2" style={styles.profilePhone}>
              {bookingData.phone}
            </Text>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>
                {isCancelled ? "Cancelled" : isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity onPress={handleWhatsAppShare}>
              <Image source={icWhatsapp} style={styles.socialIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnBlue} onPress={handleCall}>
              <Phone size={ms(20)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.sectionHeaderRow}>
          <CalendarSvg width={ms(20)} height={ms(20)} color="#000" />
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            BOOKING DETAILS
          </Text>
        </View>

        <View style={styles.dateTimeRow}>
          {/* Check In */}
          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <CalendarSvg width={ms(20)} height={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                Check In
              </Text>
              <Text variant="body2" style={styles.labelValue}>
                {bookingData.checkIn}
              </Text>
            </View>
          </View>
          {/* Check Out */}
          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <CalendarSvg width={ms(20)} height={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                Check Out
              </Text>
              <Text variant="body2" style={styles.labelValue}>
                {bookingData.checkOut}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          {/* No of Guest */}
          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <Users2 size={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                No Of Guest
              </Text>
              <Text variant="body2" style={styles.labelValue}>
                {bookingData.guestCount}
              </Text>
            </View>
          </View>
          {/* Group Type */}
          <View style={styles.dateCard}>
            <View style={styles.iconBoxLightBlue}>
              <Users2 size={ms(20)} color="#63a1fd" />
            </View>
            <View style={styles.dateCardTextCol}>
              <Text variant="body2" weight="bold" style={styles.labelTitle}>
                Group Type
              </Text>
              <Text variant="body2" style={styles.labelValue}>
                {bookingData.groupType || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.sectionHeaderRow}>
          <WalletSvg width={ms(20)} height={ms(20)} color="#000" />
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            PAYMENT DETAILS
          </Text>
        </View>

        <View style={styles.paymentCard}>
          {/* Total Amount Row */}
          <View style={styles.totalAmountRow}>
            <View style={styles.totalIconBox}>
              <WalletSvg width={ms(22)} height={ms(22)} color="#63a1fd" />
            </View>
            <View>
              <Text variant="body1" weight="bold" style={styles.totalLabel}>
                Total Amount
              </Text>
              <Text variant="h2" weight="bold" style={styles.totalValue}>
                ₹{bookingData.totalPayment}
              </Text>
            </View>
          </View>

          {/* Pending + Received */}
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
                  ₹{bookingData.remainingAmount}
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
                  ₹{bookingData.amountPaid}
                </Text>
              </View>
            </View>
          </View>

          {/* Add Money */}
          {!isCancelled && (
            <>
              {remainingAmount <= 0 ? (
                <View style={[styles.addMoneyBtn, styles.addMoneyBtnCompleted]}>
                  <Text variant="body1" weight="bold" style={styles.addMoneyBtnText}>
                    Payment Completed
                  </Text>
                </View>
              ) : !isAddingPayment ? (
                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  onPress={() => setIsAddingPayment(true)}>
                  <Text variant="body1" weight="bold" style={styles.addMoneyBtnText}>
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
                      onFocus={() => setIsKeyboardVisible(true)}
                      onChangeText={text => setPaymentInput(text.replace(/[^0-9]/g, ""))}
                    />
                    <TouchableOpacity onPress={() => setIsAddingPayment(false)}>
                      <Text variant="body2" weight="bold" style={styles.cancelInputText}>
                        - Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text variant="body2" weight="bold" style={styles.inputLabel}>
                    Method
                  </Text>
                  <View style={styles.methodsRow}>
                    {(["cash", "gpay", "phonepe", "paytm"] as const).map(method => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.methodBox,
                          selectedMethod === method && styles.methodBoxSelected,
                        ]}
                        onPress={() => setSelectedMethod(method)}>
                        <Image
                          source={
                            method === "gpay"
                              ? icGpay
                              : method === "phonepe"
                              ? icPhonepe
                              : method === "paytm"
                              ? icPaytm
                              : icCash
                          }
                          style={styles.methodIcon}
                        />
                        <Text
                          variant="body1"
                          weight="bold"
                          style={[
                            styles.methodText,
                            selectedMethod === method && styles.methodTextSelected,
                          ]}>
                          {getNameForMethod(method)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.addMoneyBtn}
                    onPress={handleSavePayment}
                    disabled={isUpdating}>
                    {isUpdating ? (
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

        {/* Payment History */}
        {paymentLogs.length > 0 && (
          <View style={styles.paymentHistoryContainer}>
            <TouchableOpacity
              style={styles.paymentHistoryBtn}
              activeOpacity={0.7}
              onPress={() => setShowPaymentHistory(!showPaymentHistory)}>
              <View style={styles.paymentHistoryLeft}>
                <MoneySvg width={ms(24)} height={ms(24)} color="#000" />
                <Text variant="body1" weight="bold" style={styles.paymentHistoryText}>
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
                  const icon = getIconForLog(log.payment_mode);
                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.logCard,
                        index === paymentLogs.length - 1 && { marginBottom: 0 },
                      ]}>
                      <Image source={icon} style={styles.logIcon} />
                      <Text variant="body1" weight="bold" style={styles.logName}>
                        {getNameForMethod(log.payment_mode)}
                      </Text>
                      <Text variant="body1" weight="bold" style={styles.logDate}>
                        {new Date(log.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </Text>
                      <Text variant="h3" weight="bold" style={styles.logAmount}>
                        ₹{log.amount}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(16),
  },
  backBtn: { padding: ms(4), marginLeft: -ms(4) },
  screenTitle: { fontSize: fs(20), color: "#000", marginLeft: hs(10) },

  // Profile Card
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
  profileInfo: { flex: 1, justifyContent: "center" },
  profileName: { fontSize: fs(22), color: "#000", marginBottom: vs(2) },
  profilePhone: { fontSize: fs(16), color: "#000", marginBottom: vs(4) },
  onlineBadge: {
    backgroundColor: "#E6F0FF",
    paddingHorizontal: hs(8),
    paddingVertical: vs(2),
    borderRadius: ms(12),
    alignSelf: "flex-start",
  },
  onlineBadgeText: { color: "#4A80F0", fontSize: fs(16), fontFamily: "Gilroy-SemiBold" },
  profileActions: { flexDirection: "row", gap: hs(8) },
  socialIcon: { width: ms(40), height: ms(40), resizeMode: "contain" },
  iconBtnBlue: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },

  // Section Header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    marginBottom: vs(10),
  },
  sectionTitle: { fontSize: fs(16), color: "#000" },

  // Date/Info Cards
  dateTimeRow: { flexDirection: "row", gap: hs(12), marginBottom: vs(12) },
  dateCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#EEF3FC",
    borderRadius: ms(12),
    padding: ms(10),
    alignItems: "center",
    gap: hs(8),
  },
  iconBoxLightBlue: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#CBDFFE",
    justifyContent: "center",
    alignItems: "center",
  },
  dateCardTextCol: { flex: 1 },
  labelTitle: { fontSize: fs(16), color: "#000", marginBottom: vs(2), fontFamily: "Gilroy-Bold" },
  labelValue: { fontSize: fs(16), color: "#333", fontFamily: "Gilroy-Medium" },

  // Payment Card
  paymentCard: {
    borderRadius: ms(16),
    padding: ms(16),
    backgroundColor: "#F7F9FC",
    marginBottom: vs(16),
  },
  totalAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(12),
    marginBottom: vs(16),
    backgroundColor: "#EEF3FC",
    borderRadius: ms(12),
    padding: ms(12),
  },
  totalIconBox: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    backgroundColor: "#CBDFFE",
    justifyContent: "center",
    alignItems: "center",
  },
  totalLabel: { fontSize: fs(16), color: "#000", marginBottom: vs(2), fontFamily: "Gilroy-Bold" },
  totalValue: { fontSize: fs(24), color: "#4A80F0", fontFamily: "Gilroy-Medium" },

  amountsRow: { flexDirection: "row", gap: hs(12), marginBottom: vs(16) },
  amountBoxLightRed: {
    flex: 1,
    backgroundColor: "#EEF3FC",
    borderRadius: ms(12),
    paddingVertical: vs(12),
    paddingHorizontal: hs(8),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: hs(8),
  },
  amountIconRed: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#FFE5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  amountBoxLightGreen: {
    flex: 1,
    backgroundColor: "#EEF3FC",
    borderRadius: ms(12),
    paddingVertical: vs(12),
    paddingHorizontal: hs(8),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: hs(8),
  },
  amountIconGreen: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#D6FFE9",
    justifyContent: "center",
    alignItems: "center",
  },
  amountTextCol: { flex: 1 },
  amountLabel: {
    fontSize: fs(12),
    color: "#000",
    marginBottom: vs(2),
    fontFamily: "Gilroy-Medium",
  },
  amountValueRed: { fontSize: fs(20), color: "#E55959", fontFamily: "Gilroy-Medium" },
  amountValueGreen: { fontSize: fs(20), color: "#00B562", fontFamily: "Gilroy-Medium" },

  // Add Money
  addMoneyBtn: {
    backgroundColor: "#63a1fd",
    borderRadius: ms(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  addMoneyBtnText: { fontSize: fs(16), color: "#fff" },
  addMoneyBtnCompleted: { backgroundColor: "#9F9F9F" },

  inputLabel: { fontSize: fs(14), color: "#000", marginBottom: vs(8) },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(8),
    paddingHorizontal: hs(12),
    marginBottom: vs(16),
    minHeight: vs(50),
    paddingVertical: vs(4),
  },
  currencySymbol: { fontSize: fs(18), color: "#000", marginRight: hs(8) },
  amountInput: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(22),
    color: COLORS.text.primary,
    flex: 1,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  cancelInputText: { color: "#E55959", fontSize: fs(14) },
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
  methodBoxSelected: { backgroundColor: "#63a1fd", borderColor: "#63a1fd" },
  methodText: { fontSize: fs(14), marginTop: vs(2), color: "#000" },
  methodTextSelected: { color: "#fff" },
  methodIcon: { width: ms(36), height: ms(36), resizeMode: "contain" },

  // Payment History
  paymentHistoryContainer: {
    marginBottom: vs(16),
    borderRadius: ms(12),
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#cbdffe",
    padding: ms(16),
  },
  paymentHistoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentHistoryLeft: { flexDirection: "row", alignItems: "center", gap: hs(8) },
  paymentHistoryText: { fontSize: fs(16), color: "#000", fontFamily: "Gilroy-Bold" },
  paymentLogsWrapper: { marginTop: vs(24), marginBottom: vs(8) },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: vs(20),
  },
  logIcon: { width: ms(36), height: ms(36), resizeMode: "contain", marginRight: hs(12) },
  logName: { flex: 1, fontSize: fs(14), color: "#000", fontFamily: "Gilroy-Bold" },
  logDate: {
    flex: 1.2,
    fontSize: fs(14),
    color: "#000",
    fontFamily: "Gilroy-Bold",
    textAlign: "center",
  },
  logAmount: {
    flex: 1,
    fontSize: fs(18),
    color: "#00B562",
    fontFamily: "Gilroy-Bold",
    textAlign: "right",
  },

  // Bottom Cancel
  fixedBottomActions: {
    paddingVertical: vs(12),
    paddingHorizontal: hs(10),
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderColor: "#EBEBEB",
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
  cancelBtnBottomText: { fontSize: fs(20), color: "#fff" },
});
