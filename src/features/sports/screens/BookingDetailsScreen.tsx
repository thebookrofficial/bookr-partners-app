// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
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
  MessageCircle,
  CheckCircle2,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useBookingDetails } from "../hooks/useBookingDetails";

export const BookingDetailsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "BookingDetails">>();
  const { bookingId } = route.params;

  const { booking, paymentLogs, loading, isSaving, logPayment } = useBookingDetails(bookingId);

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [onlineInput, setOnlineInput] = useState("");

  if (loading || !booking) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Dynamic Calculations
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

    // Log Cash (if any)
    if (cashAdded > 0) {
      const cashSuccess = await logPayment(cashAdded, "cash");
      if (!cashSuccess) success = false;
    }

    // Log Online (if any)
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

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* 1. Header Section */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Image
          source={{
            uri:
              booking.profiles?.avatar_url ||
              `https://ui-avatars.com/api/?name=${
                booking.profiles?.full_name || booking.guest_name || "Guest"
              }&background=random`,
          }}
          style={styles.avatar}
        />

        <Text variant="h3" weight="bold" style={styles.headerName}>
          {booking.profiles?.full_name || booking.guest_name || "Guest User"}
        </Text>

        <Text variant="body2" weight="semiBold" style={styles.categoryText}>
          {booking.venues?.name}
        </Text>
      </View>

      {/* 2. Mobile Number Section */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Phone size={ms(16)} color={COLORS.primary} fill={COLORS.primary} />
          <Text variant="body2" weight="medium">
            Mobile No
          </Text>
        </View>
        <View style={styles.inputBoxRow}>
          <Text variant="body2" weight="semiBold" style={styles.inputText}>
            {booking.profiles?.phone || booking.guest_phone || "N/A"}
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.whatsappBtn} activeOpacity={0.7}>
              <MessageCircle size={ms(14)} color={COLORS.text.inverse} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
              <Text variant="body2" weight="bold" color={COLORS.text.inverse}>
                Call
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Date & Time Row */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, styles.flex1]}>
          <View style={styles.labelRow}>
            <Calendar size={ms(16)} color={COLORS.primary} />
            <Text variant="body2" weight="medium">
              Date
            </Text>
          </View>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.inputText}>
              {new Date(booking.sports_slots.slot_date).toLocaleDateString("en-GB")}
            </Text>
          </View>
        </View>

        <View style={[styles.fieldGroup, styles.flex1]}>
          <View style={styles.labelRow}>
            <Clock size={ms(16)} color={COLORS.primary} />
            <Text variant="body2" weight="medium">
              Time
            </Text>
          </View>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.inputText}>
              {`${formatHour(booking.sports_slots.start_time)} - ${formatHour(
                booking.sports_slots.end_time,
              )}`}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Total Payment */}
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

      {/* 5. Remaining Amount */}
      <View style={styles.fieldGroup}>
        <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
          Remaining Amount
        </Text>
        <View style={styles.inputBox}>
          <Text
            variant="body2"
            weight="semiBold"
            color={remainingAmount > 0 ? COLORS.danger : "#00B562"}>
            ₹ {remainingAmount}
          </Text>
        </View>
      </View>

      {/* 6. Amount Paid (with interactive toggle button) */}
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
              style={styles.addButton}
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

      {/* 7. Cash / Online Split Box */}
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

      {/* 8. Immutable Ledger Display (Visual Confirmation) */}
      {paymentLogs.length > 0 && (
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
                  ({log.payment_mode.toUpperCase()})
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 9. Save Button (Only visible when adding payment) */}
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

      {/* 10. Previous History Row */}
      <TouchableOpacity
        style={styles.historyRow}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate("GuestHistory", {
            guestId: booking.profiles?.phone || booking.guest_phone || "unknown",
          })
        }>
        <FileText size={ms(20)} color={COLORS.text.primary} />
        <Text variant="body2" weight="semiBold" style={styles.historyText}>
          Previous History
        </Text>
        <ChevronRight size={ms(20)} color={COLORS.text.primary} />
      </TouchableOpacity>

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
  inputBox: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: hs(10),
    justifyContent: "center",
    minHeight: vs(40),
  },
  inputBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(8),
    paddingHorizontal: hs(10),
    minHeight: vs(46),
  },
  inputText: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  whatsappBtn: {
    backgroundColor: "#25D366", // WhatsApp Green
    paddingHorizontal: hs(16),
    paddingVertical: vs(7),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  callButton: {
    backgroundColor: "#000000",
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.25)",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    padding: hs(4),
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
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    height: vs(40),
    marginBottom: vs(10),
  },
  historyText: {
    flex: 1,
    marginLeft: hs(6),
  },
  ledgerContainer: {
    marginTop: vs(4),
    marginBottom: vs(14),
    padding: hs(10),
    backgroundColor: COLORS.surface.primary,
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
  // Add this for the saving state of the button
  saveButtonDisabled: {
    opacity: 0.7,
  },
});
