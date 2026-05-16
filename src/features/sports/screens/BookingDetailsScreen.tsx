// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Modal,
  Pressable,
  Share,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Clock,
  Plus,
  Minus,
  FileText,
  ChevronRight,
  CheckCircle2,
  Send,
  Trash2,
  X,
  ChevronDown,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useBookingDetails } from "../hooks/useBookingDetails";
import { Canvas, Skia, Skottie, Group } from "@shopify/react-native-skia";
import { useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";

const whatsappAnimation = require("@/assets/animations/ic-whatsapp.json");

export const BookingDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "BookingDetails">>();
  const { bookingId } = route.params;

  const { booking, paymentLogs, loading, isSaving, logPayment, cancelBooking, extendBooking } =
    useBookingDetails(bookingId);

  const [isAddingOn, setIsAddingOn] = useState(false);
  const [addOnTime, setAddOnTime] = useState("30 min");
  const [extraMoney, setExtraMoney] = useState("0");

  const lottie = useMemo(() => {
    try {
      return Skia.Skottie.Make(JSON.stringify(whatsappAnimation));
    } catch (e) {
      console.error("Failed to load WhatsApp animation:", e);
      return null;
    }
  }, []);

  const progress = useSharedValue(0);

  // Automatically set suggested extra money when time changes
  useEffect(() => {
    if (isAddingOn) {
      // Basic logic: if 30 min, suggest half of an hour's price, else full
      // You can adjust this to pull from your venue pricing state if available
      // const hourlyRate = 1000; // Fallback or booking.total_amount based on duration
      const suggested = addOnTime === "30 min" ? "500" : "1000";
      setExtraMoney(suggested);
    }
  }, [addOnTime, isAddingOn]);

  useEffect(() => {
    if (lottie) {
      const duration = lottie.duration();
      progress.value = 0;
      progress.value = withTiming(duration, { duration: duration * 1000 });

      const timer = setTimeout(() => {
        progress.value = 0;
        progress.value = withTiming(duration, { duration: duration * 1000 });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [lottie, progress]);

  const handleConfirmExtension = async () => {
    const mins = addOnTime === "30 min" ? 30 : 60;
    const cost = parseFloat(extraMoney) || 0;

    const success = await extendBooking(mins, cost);
    if (success) {
      setIsAddingOn(false);
    }
  };

  const frame = useDerivedValue(() => {
    if (!lottie) {
      return 0;
    }
    const fps = lottie.fps();
    return progress.value * fps;
  }, [lottie]);

  const scale = useMemo(() => {
    if (!lottie) return 1;
    const size = lottie.size();
    return ms(30) / (size.width || 48);
  }, [lottie]);

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [onlineInput, setOnlineInput] = useState("");

  if (loading || !booking) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const profileData = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
  const guestName = booking.guest_name || profileData?.full_name || "Guest User";
  const guestPhone = booking.guest_phone || profileData?.phone || "N/A";

  const totalAmount = Number(booking.total_amount) || 0;
  const currentPaid = Number(booking.paid_amount) || 0;
  const remainingAmount = Math.max(0, totalAmount - currentPaid);

  const formatHour = (timeStr: string) => {
    if (!timeStr) return "";
    const [h] = timeStr.split(":");
    const hourInt = parseInt(h, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  const handleSavePayment = async () => {
    const cashAdded = parseFloat(cashInput) || 0;
    const onlineAdded = parseFloat(onlineInput) || 0;
    const totalAdded = cashAdded + onlineAdded;

    if (totalAdded <= 0) {
      Alert.alert("Notice", "Please enter an amount to save.");
      return;
    }

    if (totalAdded > remainingAmount) {
      Alert.alert("Invalid Amount", "Cannot add more than the remaining balance.");
      return;
    }

    let success = true;

    if (cashAdded > 0) {
      const cashSuccess = await logPayment(cashAdded, "cash");
      if (!cashSuccess) success = false;
    }

    if (onlineAdded > 0 && success) {
      const onlineSuccess = await logPayment(onlineAdded, "online");
      if (!onlineSuccess) success = false;
    }

    if (success) {
      setIsAddingPayment(false);
      setCashInput("");
      setOnlineInput("");
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

  const handleShareWhatsApp = async () => {
    const venueName = booking.venues?.name || "the venue";
    const bookingDate = new Date(booking.sports_slots.slot_date).toLocaleDateString("en-GB");
    const bookingTime = `${formatHour(booking.sports_slots.start_time)} to ${formatHour(
      booking.sports_slots.end_time,
    )}`;

    const message =
      `Booking Confirmed! 🎉\n` +
      `Hi ${guestName},\n` +
      `Your booking at ${venueName} has been successfully reserved.\n\n` +
      `Date: ${bookingDate}\n` +
      `Time: ${bookingTime}\n\n` +
      `Payment Summary:\n` +
      `Total: ₹${totalAmount}\n` +
      `Paid: ₹${currentPaid}\n` +
      `Due at Venue: ₹${remainingAmount}\n\n` +
      `Thank you for booking.`;

    try {
      const result = await Share.share({
        message: message,
        title: "Booking Confirmation",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {
      Alert.alert("Error", "Unable to open share sheet.");
      console.error("Native Share Error:", error.message);
    }
  };

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Image
          source={{
            uri:
              profileData?.avatar_url ||
              `https://ui-avatars.com/api/?name=${guestName}&background=random`,
          }}
          style={styles.avatar}
        />

        <Text variant="h3" weight="bold" style={styles.headerName}>
          {guestName}
        </Text>

        <Text variant="body2" weight="semiBold" style={styles.categoryText}>
          {booking.venues?.name}
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Phone size={ms(16)} color={COLORS.primary} fill={COLORS.primary} />
          <Text variant="body2" weight="medium">
            Mobile No
          </Text>
        </View>
        <View style={styles.inputBoxRow}>
          <Text variant="body2" weight="semiBold" style={styles.inputText} onPress={handleCall}>
            {guestPhone}
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.callButton} activeOpacity={0.7} onPress={handleCall}>
              <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
                Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Calendar size={ms(16)} color={COLORS.primary} />
          <Text variant="body2" weight="bold">
            Date
          </Text>
        </View>
        <View style={styles.inputBox}>
          <Text variant="body2" weight="semiBold" style={styles.inputText}>
            {new Date(booking.sports_slots.slot_date).toLocaleDateString("en-GB")}
          </Text>
        </View>
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
            <View style={styles.inputBox}>
              <Text variant="body2" weight="semiBold" style={styles.inputText}>
                {formatHour(booking.sports_slots.start_time)}
              </Text>
            </View>
          </View>

          <View style={styles.flex1}>
            <Text variant="body2" weight="medium" style={styles.subLabel}>
              To
            </Text>
            <View style={styles.inputBoxRowWithInline}>
              <Text variant="body2" weight="semiBold" style={styles.inputText}>
                {formatHour(booking.sports_slots.end_time)}
              </Text>
              <TouchableOpacity
                style={styles.inlineAddBtn}
                onPress={() => setIsAddingOn(!isAddingOn)}>
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={isAddingOn ? COLORS.danger : COLORS.primary}>
                  {isAddingOn ? "Cancel" : "Add"}
                </Text>
                {isAddingOn ? (
                  <X size={ms(16)} color={COLORS.danger} />
                ) : (
                  <Plus size={ms(16)} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {isAddingOn && (
        <View style={styles.addOnContainer}>
          <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
            Add On
          </Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.subLabel}>
                Extra Time
              </Text>
              <TouchableOpacity
                style={styles.dropDownPlaceholder}
                onPress={() => setAddOnTime(addOnTime === "30 min" ? "60 min" : "30 min")}>
                <Text variant="body2" weight="semiBold">
                  {addOnTime}
                </Text>
                <ChevronDown size={ms(16)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.flex1}>
              <Text variant="body2" weight="medium" style={styles.subLabel}>
                Extra Money
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.extraMoneyInput}
                  keyboardType="numeric"
                  value={extraMoney}
                  onChangeText={setExtraMoney}
                />
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmExtension}>
            <Text
              variant="h3"
              family="nichrome"
              color={COLORS.text.inverse}
              style={styles.confirmText}>
              CONFIRM
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.fieldGroup}>
        <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
          Total Payment
        </Text>
        <View style={styles.inputBox}>
          <Text variant="body2" weight="semiBold" style={styles.inputText}>
            ₹ {totalAmount}
          </Text>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
          Remaining Amount
        </Text>
        <View style={styles.inputBox}>
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
            ₹ {currentPaid}
          </Text>

          {remainingAmount > 0 && (
            <TouchableOpacity
              style={styles.inlineAddBtn}
              activeOpacity={0.7}
              onPress={() => setIsAddingPayment(!isAddingPayment)}>
              <Text
                variant="body2"
                weight="semiBold"
                color={isAddingPayment ? COLORS.danger : "#00B562"}>
                {isAddingPayment ? "Cancel" : "Add"}
              </Text>
              {isAddingPayment ? (
                <Minus size={ms(16)} color={COLORS.danger} />
              ) : (
                <Plus size={ms(16)} color="#00B562" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isAddingPayment && (
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
              value={cashInput}
              onChangeText={setCashInput}
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
              value={onlineInput}
              onChangeText={setOnlineInput}
            />
          </View>
        </View>
      )}

      {showPaymentHistory && paymentLogs.length > 0 && (
        <View style={styles.ledgerContainer}>
          <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
            Payment History
          </Text>
          {paymentLogs.map(log => (
            <View key={log.id} style={styles.ledgerRow}>
              <View style={styles.ledgerLeft}>
                <CheckCircle2 size={ms(14)} color="#00B562" />
                <Text variant="body2" weight="medium" style={styles.ledgerDate}>
                  {new Date(log.created_at).toLocaleDateString("en-GB")}
                </Text>
              </View>
              <View style={styles.ledgerRight}>
                <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                  ₹{log.amount}
                </Text>
                <Text variant="caption" color={COLORS.text.muted} style={styles.ledgerMode}>
                  ({log.payment_mode === "upi" ? "ONLINE" : log.payment_mode.toUpperCase()})
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {isAddingPayment && (
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSavePayment}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.text.inverse} />
          ) : (
            <Text
              variant="h3"
              family="nichrome"
              color={COLORS.text.inverse}
              style={styles.saveText}>
              SAVE
            </Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.7}
        onPress={() => setShowPaymentHistory(!showPaymentHistory)}>
        <Clock size={ms(20)} color="#E55959" />
        <Text variant="body2" weight="semiBold" color="#E55959" style={styles.actionCardText}>
          Current Booking Payment History
        </Text>
        <ChevronRight size={ms(20)} color={COLORS.text.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("GuestHistory", {
            guestId: guestPhone === "N/A" ? undefined : guestPhone,
            bookingId: booking.id,
            vertical: "sports",
          })
        }>
        <FileText size={ms(20)} color={COLORS.text.primary} />
        <Text variant="body2" weight="semiBold" style={styles.actionCardText}>
          Previous History
        </Text>
        <ChevronRight size={ms(20)} color={COLORS.text.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shareWhatsappBtn}
        activeOpacity={0.8}
        onPress={handleShareWhatsApp}>
        <View style={styles.whatsappAnimWrapper}>
          <Canvas style={styles.whatsappCanvas}>
            {lottie && (
              <Group transform={[{ translateX: 0 }, { translateY: 0 }, { scale }]}>
                <Skottie animation={lottie} frame={frame} />
              </Group>
            )}
          </Canvas>
        </View>
        <Text variant="body1" weight="bold" color={COLORS.text.inverse} style={styles.shareText}>
          Share confirmation
        </Text>
        <Send size={ms(20)} color={COLORS.text.inverse} />
      </TouchableOpacity>

      {booking.booking_status !== "cancelled" && (
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.7}
          onPress={() => setShowCancelModal(true)}>
          <Text variant="body2" weight="bold" style={styles.actionCardText}>
            Cancel Your Booking
          </Text>
          <Trash2 size={ms(20)} color={COLORS.text.primary} />
        </TouchableOpacity>
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
                  no go back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={async () => {
                  setShowCancelModal(false);
                  const success = await cancelBooking();

                  if (success) {
                    navigation.goBack();
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

      <View style={{ height: vs(40) }} />
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
  flex1: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  backBtn: {
    marginRight: hs(10),
  },
  avatar: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.danger,
    marginRight: hs(10),
  },
  headerName: {
    flex: 1,
    fontSize: fs(22),
  },
  categoryText: {
    textTransform: "capitalize",
  },
  fieldGroup: {
    marginBottom: vs(14),
  },
  row: {
    flexDirection: "row",
    gap: hs(20),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  standaloneLabel: {
    marginBottom: vs(4),
  },
  subLabel: {
    fontSize: fs(14),
    marginBottom: vs(4),
  },
  inputBox: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: hs(10),
    justifyContent: "center",
    minHeight: vs(40),
  },
  inputBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(8),
    paddingHorizontal: hs(10),
    minHeight: vs(46),
  },
  inputBoxRowWithInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    minHeight: vs(40),
  },
  inputText: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
  },
  extraMoneyInput: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
    fontWeight: "600",
  },
  inlineAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    padding: hs(4),
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(44),
    marginBottom: vs(12),
  },
  actionCardText: {
    flex: 1,
    marginLeft: hs(8),
  },
  confirmBtn: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    height: vs(44),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(12),
  },
  confirmText: {
    fontSize: fs(20),
    textTransform: "uppercase",
  },
  whatsappAnimWrapper: {
    width: ms(30),
    height: ms(30),
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappCanvas: {
    width: ms(30),
    height: ms(30),
  },
  callButton: {
    backgroundColor: "#000000",
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  splitBox: {
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    padding: hs(10),
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
    textTransform: "uppercase",
  },
  shareWhatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25D366",
    borderRadius: ms(10),
    padding: ms(6),
    gap: hs(6),
    marginTop: vs(10),
  },
  shareText: {
    flex: 1,
    fontSize: fs(14),
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
  splitInputText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  addOnContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#63A1FD",
    borderRadius: ms(10),
    padding: ms(12),
    marginVertical: vs(10),
  },
  dropDownPlaceholder: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(10),
    marginTop: vs(4),
  },
});
