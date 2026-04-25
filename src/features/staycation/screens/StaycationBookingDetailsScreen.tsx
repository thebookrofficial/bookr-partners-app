// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, Avatar, TextInput } from "@/components/ui";
import {
  ArrowLeft,
  Phone,
  Clock,
  User,
  ClipboardList,
  Plus,
  ChevronRight,
  Share2,
  FileText,
  Trash2,
  ChevronDown,
  Minus,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute } from "@react-navigation/native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const InfoBlock = ({ label, value, icon: Icon, isSelection, valueColor }: any) => (
  <View style={styles.infoBlock}>
    <View style={styles.labelRow}>
      <Icon size={ms(18)} color={COLORS.text.primary} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <View style={styles.valueBox}>
      <Text style={[styles.valueText, valueColor ? { color: valueColor } : {}]}>{value}</Text>
      {isSelection && <ChevronDown size={ms(18)} color="black" />}
    </View>
  </View>
);

export const StaycationBookingDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { booking, isFromHistory } = route.params || {};

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [cashAmount, setCashAmount] = useState("");
  const [onlineAmount, setOnlineAmount] = useState("");

  const bookingData = {
    name: booking?.name || "Chirag Patil",
    phone: booking?.phone || "+91 78349 89934",
    checkIn: booking?.checkIn || "03/04/2026",
    checkOut: booking?.checkOut || "04/04/2026",
    guestCount: booking?.guestCount || 10,
    bookingType: booking?.status || "Online",
    totalPayment: booking?.amount || "5000",
    remainingAmount: "0",
    amountPaid: booking?.amount || "5000",
  };

  const handleCall = () => {
    const url = `tel:${bookingData.phone}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open dialer."));
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
            <Avatar source={USER_PROFILE} size={50} />
            <Text style={styles.profileName}>{bookingData.name}</Text>
          </View>
        </View>

        {/* Mobile No Section */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color={COLORS.text.primary} />
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

        {/* Guest / Booking Type Section */}
        <View style={styles.row}>
          <InfoBlock label="No Of Guest" value={bookingData.guestCount} icon={User} isSelection />
          <View style={{ width: hs(20) }} />
          <InfoBlock
            label="Booking Type"
            value={bookingData.bookingType}
            icon={ClipboardList}
            valueColor="#63a1fd"
          />
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
            </View>
          </View>
          {isAddingPayment && (
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
          )}
        </View>

        {/* Conditional Payment History Button (Figma) */}
        {isFromHistory && (
          <TouchableOpacity style={styles.historyBtn}>
            <View style={styles.historyContent}>
              <Clock size={ms(20)} color="#e55959" />
              <Text style={[styles.historyText, styles.currentHistoryText]}>
                Current Booking Payment History
              </Text>
            </View>
            <ChevronRight size={ms(18)} color="black" />
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <TouchableOpacity style={styles.whatsappBtn}>
          <View style={styles.whatsappContent}>
            <Share2 size={ms(20)} color="white" />
            <Text style={styles.whatsappText}>Share confirmation</Text>
          </View>
          <Share2 size={ms(18)} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyBtn}>
          <View style={styles.historyContent}>
            <FileText size={ms(20)} color="black" />
            <Text style={styles.historyText}>Previous History</Text>
          </View>
          <ChevronRight size={ms(18)} color="black" />
        </TouchableOpacity>

        {!isFromHistory && (
          <TouchableOpacity style={styles.cancelBtn}>
            <View style={styles.cancelContent}>
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </View>
            <Trash2 size={ms(20)} color="black" />
          </TouchableOpacity>
        )}

        <View style={{ height: vs(40) }} />
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(20),
  },
  backBtn: {
    marginRight: hs(12),
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  profileName: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(22),
    color: "black",
  },
  section: {
    marginBottom: vs(20),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(4),
  },
  labelText: {
    fontFamily: "Gilroy-Medium",
    fontSize: fs(14),
    color: "black",
  },
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
  valueText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: "black",
  },
  callBtn: {
    backgroundColor: "black",
    paddingHorizontal: hs(14),
    paddingVertical: vs(6),
    borderRadius: ms(6),
  },
  callBtnText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: "white",
  },
  row: {
    flexDirection: "row",
    marginBottom: vs(20),
  },
  infoBlock: {
    flex: 1,
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    borderRadius: ms(10),
    padding: hs(6),
    gap: vs(10),
    marginBottom: vs(20),
  },
  paymentItem: {
    width: "100%",
  },
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
  amountPaidBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentValue: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: "black",
  },
  splitBox: {
    flexDirection: "row",
    gap: hs(10),
    marginTop: vs(10),
  },
  splitInput: {
    flex: 1,
  },
  addBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
  },
  addText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: "#00b562",
  },
  amountPaidText: {
    color: "#00b562",
  },
  remainingAmountText: {
    color: "#e55959",
  },
  currentHistoryText: {
    color: "#e55959",
  },
  whatsappBtn: {
    backgroundColor: "#25d366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hs(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
  },
  whatsappContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  whatsappText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: "white",
  },
  historyBtn: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hs(10),
    borderRadius: ms(10),
    marginBottom: vs(10),
  },
  historyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  historyText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: "black",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#cbdffe",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: hs(10),
    borderRadius: ms(10),
  },
  cancelContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: "black",
  },
});
