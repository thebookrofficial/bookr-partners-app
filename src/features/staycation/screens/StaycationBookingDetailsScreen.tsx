// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, Avatar, TextInput } from "@/components/ui";
import {
  ArrowLeft,
  Phone,
  Clock,
  User,
  ClipboardList,
  Plus,
  Share2,
  Trash2,
  ChevronDown,
  Minus,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useStaycationBookingDetails } from "../hooks/useStaycationBookingDetails";
import { supabase } from "@/lib/supabase";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const InfoBlock = ({ label, value, icon: Icon, isSelection, valueColor }: any) => (
  <View style={styles.infoBlock}>
    <View style={styles.labelRow}>
      <Icon size={ms(18)} color={COLORS.text?.primary || "black"} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <View style={styles.valueBox}>
      <Text style={[styles.valueText, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      {isSelection && <ChevronDown size={ms(18)} color="black" />}
    </View>
  </View>
);

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${date.getFullYear()}`;
};

export const StaycationBookingDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { booking: initialBooking, isFromHistory } = route.params || {};

  const { isLoading, isUpdating, bookingDetails, updatePayment, cancelBooking } =
    useStaycationBookingDetails(initialBooking?.dbId || initialBooking?.id);

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");

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
    const success = await updatePayment(cashAmount, onlineAmount);
    if (success) {
      setIsAddingPayment(false);
      setCashAmount("");
      setOnlineAmount("");
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

  // 1. Calculate split units exactly like the previous screen
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

  // 2. The CORRECT way to check if a booking is online
  const isOnline = !!bookingDetails?.user_id;
  const isCancelled = bookingDetails?.booking_status === "cancelled";
  const bookingType = isOnline ? "Online" : "Manual";

  // 3. Assemble the data, prioritizing the "unrolled" data passed from the card
  const bookingData = {
    name:
      bookingDetails?.guest_name ||
      bookingDetails?.profiles?.full_name ||
      initialBooking?.name ||
      "Guest",
    phone:
      bookingDetails?.guest_phone ||
      bookingDetails?.profiles?.phone ||
      initialBooking?.phone ||
      "N/A",
    avatarUrl: bookingDetails?.profiles?.avatar_url || initialBooking?.avatarUrl,
    checkIn: formatDate(bookingDetails?.check_in_date || initialBooking?.checkIn),
    checkOut: formatDate(bookingDetails?.check_out_date || initialBooking?.checkOut),

    // Use initialBooking.guestCount to preserve the remainder math we did on the previous screen!
    guestCount:
      initialBooking?.guestCount || Math.floor((bookingDetails?.guest_count || 0) / units),

    // Preserve the serial room name (e.g., DEL-101) passed from the card
    roomName: initialBooking?.roomName || "Room Assigned",

    bookingType: isCancelled ? "Cancelled" : bookingType,
    realBookingType: bookingDetails?.booking_type, // "full_property" or "per_room"
    totalPayment: totalPayment.toFixed(2), // Keep it clean
    remainingAmount: remainingAmount.toFixed(2),
    amountPaid: amountPaid.toFixed(2),
  };

  // Direct WhatsApp Share Handler
  const handleWhatsAppShare = async () => {
    let venueName = "our venue";

    // 1. Dynamically fetch the venue name
    if (bookingDetails?.id) {
      try {
        const { data } = await supabase
          .from("staycation_bookings")
          .select("venues(name)")
          .eq("id", bookingDetails.id)
          .single();
        const vName = (data?.venues as any)?.name;
        if (vName) venueName = vName;
      } catch (e) {
        console.warn("Could not fetch venue name for Sharing");
      }
    }

    // 2. Build the message
    const shareMessage = `Booking Confirmed! 🎉
Hi ${bookingData.name},
Your slot at ${venueName} is locked in via Bookr.
Date: ${bookingData.checkIn} to ${bookingData.checkOut}
Payment Summary:
Total: ₹${bookingData.totalPayment}
Paid: ₹${bookingData.amountPaid}
Due at Venue: ₹${bookingData.remainingAmount}
Thank you for booking with Bookr!`;

    // 3. Try to open WhatsApp directly if we have a valid phone number
    if (bookingData.phone && bookingData.phone !== "N/A") {
      // Remove all non-numeric characters
      let cleanPhone = bookingData.phone.replace(/\D/g, "");

      // If it's a standard 10 digit Indian number, append the 91 country code
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      }

      const encodedMessage = encodeURIComponent(shareMessage);
      const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;

      try {
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          return; // Stop here if WhatsApp successfully opened
        }
      } catch (err) {
        console.warn("Could not check/open WhatsApp URL", err);
      }
    }

    // 4. Fallback to standard share if WhatsApp isn't installed or number is invalid
    try {
      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      Alert.alert("Error", "Could not open the share menu.");
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable paddingHorizontal={hs(12)}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={ms(24)} color="black" />
          </TouchableOpacity>
          <View style={styles.profileRow}>
            <Avatar
              source={bookingData.avatarUrl ? { uri: bookingData.avatarUrl } : USER_PROFILE}
              size={50}
            />
            <Text style={styles.profileName}>{bookingData.name}</Text>
          </View>
        </View>

        {/* Mobile No Section */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color={COLORS.text?.primary || "black"} />
            <Text style={styles.labelText}>Mobile No</Text>
          </View>
          <View style={styles.phoneBox}>
            <Text style={styles.valueText}>{bookingData.phone}</Text>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Check In / Out Section */}
        <View style={styles.row}>
          <InfoBlock label="Check In" value={bookingData.checkIn} icon={Clock} />
          <View style={{ width: hs(20) }} />
          <InfoBlock label="Check Out" value={bookingData.checkOut} icon={Clock} />
        </View>

        {/* Booking Type / Guest Section */}
        <View style={styles.row}>
          <InfoBlock
            label="Booking Type"
            value={bookingData.bookingType}
            icon={ClipboardList}
            valueColor={isCancelled ? COLORS.text.muted : "#63a1fd"}
          />
          <View style={{ width: hs(20) }} />
          <InfoBlock label="No Of Guest" value={bookingData.guestCount} icon={User} />
        </View>

        {/* Payment Card */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Total Payment</Text>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentValue}>₹ {bookingData.totalPayment}</Text>
            </View>
          </View>

          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Remaining Amount</Text>
            <View style={styles.paymentBox}>
              <Text style={[styles.paymentValue, styles.remainingAmountText]}>
                ₹{bookingData.remainingAmount}
              </Text>
            </View>
          </View>

          <View style={styles.paymentItem}>
            <Text style={styles.paymentLabel}>Amount Paid</Text>
            <View style={[styles.paymentBox, styles.amountPaidBox]}>
              <Text style={[styles.paymentValue, styles.amountPaidText]}>
                ₹ {bookingData.amountPaid}
              </Text>

              {(remainingAmount > 0 || bookingData.realBookingType === "full_property") &&
                !isCancelled && (
                  <TouchableOpacity
                    style={styles.addBtnRow}
                    onPress={() => setIsAddingPayment(!isAddingPayment)}>
                    <Text style={styles.addText}>{isAddingPayment ? "Cancel" : "Add"}</Text>
                    {isAddingPayment ? (
                      <Minus size={ms(20)} color="#e55959" />
                    ) : (
                      <Plus size={ms(20)} color="#00b562" />
                    )}
                  </TouchableOpacity>
                )}
            </View>
          </View>

          {isAddingPayment && (
            <View>
              <View style={styles.splitBox}>
                <View style={styles.splitInput}>
                  <Text style={styles.paymentLabel}>Cash</Text>
                  <TextInput
                    placeholder="₹ 0"
                    keyboardType="numeric"
                    value={cashAmount}
                    onChangeText={setCashAmount}
                  />
                </View>
                <View style={styles.splitInput}>
                  <Text style={styles.paymentLabel}>Online</Text>
                  <TextInput
                    placeholder="₹ 0"
                    keyboardType="numeric"
                    value={onlineAmount}
                    onChangeText={setOnlineAmount}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={styles.savePaymentBtn}
                onPress={handleSavePayment}
                disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.savePaymentText}>Save Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* WhatsApp Share Button */}
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={handleWhatsAppShare}
          activeOpacity={0.8}>
          <View style={styles.whatsappContent}>
            <Share2 size={ms(20)} color="white" />
            <Text style={styles.whatsappText}>Share confirmation</Text>
          </View>
          <Share2 size={ms(18)} color="white" />
        </TouchableOpacity>

        {/* Removed the !isOnline check so vendors can cancel ANY active booking */}
        {!isFromHistory && !isCancelled && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={isUpdating}>
            <View style={styles.cancelContent}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="black" />
              ) : (
                <Text style={styles.cancelText}>Cancel Booking</Text>
              )}
            </View>
            <Trash2 size={ms(20)} color="black" />
          </TouchableOpacity>
        )}

        <View style={{ height: vs(40) }} />
      </ScreenContainer>
    </View>
  );
};

// ... keep existing styles below ...
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: { flexDirection: "row", alignItems: "center", marginTop: vs(10), marginBottom: vs(20) },
  backBtn: { marginRight: hs(12) },
  profileRow: { flexDirection: "row", alignItems: "center", gap: hs(10) },
  profileName: { fontFamily: "Gilroy-Bold", fontSize: fs(22), color: "black" },
  section: { marginBottom: vs(20) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(4) },
  labelText: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: "black" },
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f7fc",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
  },
  valueBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f7fc",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    width: "100%",
  },
  valueText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "black" },
  callBtn: {
    backgroundColor: "black",
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(6),
  },
  callBtnText: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: "white" },
  row: { flexDirection: "row", marginBottom: vs(20) },
  infoBlock: { flex: 1 },
  paymentCard: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(10),
    padding: hs(6),
    gap: vs(10),
    marginBottom: vs(20),
  },
  paymentItem: { width: "100%" },
  paymentLabel: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: "black",
    marginBottom: vs(4),
  },
  paymentBox: {
    backgroundColor: "#f4f7fc",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
  },
  amountPaidBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentValue: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "black" },
  splitBox: { flexDirection: "row", gap: hs(10), marginTop: vs(10) },
  splitInput: { flex: 1 },
  addBtnRow: { flexDirection: "row", alignItems: "center", gap: hs(4) },
  addText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#00b562" },
  amountPaidText: { color: "#00b562" },
  remainingAmountText: { color: "#e55959" },
  savePaymentBtn: {
    backgroundColor: "#63a1fd",
    paddingVertical: vs(12),
    borderRadius: ms(8),
    alignItems: "center",
    marginTop: vs(12),
  },
  savePaymentText: { fontFamily: "Gilroy-Bold", fontSize: fs(16), color: "white" },
  whatsappBtn: {
    backgroundColor: "#25d366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hs(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
  },
  whatsappContent: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  whatsappText: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: "white" },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hs(10),
    borderRadius: ms(10),
  },
  cancelContent: { flexDirection: "row", alignItems: "center" },
  cancelText: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: "black" },
});
