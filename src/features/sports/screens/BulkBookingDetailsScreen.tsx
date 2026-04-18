// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
// ADDED 'Minus' to the imports here
import {
  Phone,
  Calendar,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  Plus,
  Minus,
  Landmark,
  User as UserIcon,
} from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";

interface InfoBoxProps {
  label: string;
  value: string;
  color?: string;
  icon?: any;
  showDropdown?: boolean;
}

const InfoBox = ({
  label,
  value,
  color = COLORS.text.primary,
  icon: Icon,
  showDropdown = false,
}: InfoBoxProps) => (
  <View style={styles.fieldGroup}>
    {Icon && (
      <View style={styles.labelRow}>
        <Icon size={ms(18)} color={COLORS.primary} />
        <Text variant="body2" weight="bold" style={styles.label}>
          {label}
        </Text>
      </View>
    )}
    {!Icon && (
      <Text variant="body2" weight="bold" style={styles.labelOnly}>
        {label}
      </Text>
    )}

    <TouchableOpacity style={styles.inputBox} activeOpacity={showDropdown ? 0.7 : 1}>
      <Text variant="body2" weight="semiBold" color={color} style={styles.flex1}>
        {value}
      </Text>
      {showDropdown && <ChevronDown size={ms(18)} color={COLORS.text.primary} />}
    </TouchableOpacity>
  </View>
);

export const BulkBookingDetailsScreen = () => {
  const route = useRoute<RouteProp<MainStackParamList, "BulkBookingDetails">>();
  const { type, bookingId } = route.params;

  const [bookingType, setBookingType] = useState<"multi" | "single">(type);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const isNewBooking = bookingId === "new";

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <ServiceHeader
          title="Elite Strikers Club"
          subtitle="Bulk Booking"
          rightComponent={
            <Text variant="body2" weight="bold" style={styles.categoryBadge}>
              Football
            </Text>
          }
        />

        {/* Bulk Booking Type Toggle Bar */}
        <View style={styles.tabContainer}>
          <Text variant="body1" weight="bold" style={styles.tabTitle}>
            Bulk Booking
          </Text>
          <TouchableOpacity
            style={[
              styles.tabPill,
              bookingType === "multi" ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => setBookingType("multi")}
            activeOpacity={0.7}>
            <Text
              variant="caption"
              weight="semiBold"
              color={bookingType === "multi" ? COLORS.text.inverse : COLORS.text.muted}>
              Multiple days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabPill,
              bookingType === "single" ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => setBookingType("single")}
            activeOpacity={0.7}>
            <Text
              variant="caption"
              weight="semiBold"
              color={bookingType === "single" ? COLORS.text.inverse : COLORS.text.muted}>
              Single days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        {!isNewBooking && (
          <View style={styles.profileRow}>
            <Image source={{ uri: "https://placeholder.com/50" }} style={styles.avatar} />
            <View style={styles.flex1}>
              <Text variant="h3" weight="bold">
                Chirag Patil
              </Text>
            </View>
          </View>
        )}

        <Text variant="body1" weight="bold" style={styles.bookingTypeTitle}>
          {bookingType === "multi" ? "MULTIPLE DAYS BULK BOOKING" : "SINGLE DAY BOOKING"}
        </Text>

        {/* Mobile Input */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color={COLORS.primary} fill={COLORS.primary} />
            <Text variant="body2" weight="medium" style={styles.label}>
              Mobile No
            </Text>
          </View>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.flex1}>
              {isNewBooking ? "Enter Mobile Number" : "+91 78349 89934"}
            </Text>
            {!isNewBooking && (
              <TouchableOpacity style={styles.callBtn}>
                <Text variant="caption" weight="bold" color="#FFF">
                  Call
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <UserIcon size={ms(18)} color={COLORS.primary} />
            <Text variant="body2" weight="medium" style={styles.label}>
              Name
            </Text>
          </View>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" style={styles.flex1}>
              {isNewBooking ? "Enter Name" : "Yash Patil"}
            </Text>
          </View>
        </View>

        {/* Date Section */}
        {bookingType === "multi" ? (
          <View style={styles.rowGap}>
            <View style={styles.labelRow}>
              <Calendar size={ms(18)} color={COLORS.primary} />
              <Text variant="body2" weight="bold" style={styles.label}>
                Select Dates
              </Text>
            </View>
            <View style={styles.splitRow}>
              <View style={styles.flex1}>
                <InfoBox label="From" value={isNewBooking ? "Select" : "06 May 2026"} />
              </View>
              <View style={styles.flex1}>
                <InfoBox label="To" value={isNewBooking ? "Select" : "12 May 2026"} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.rowGap}>
            <View style={styles.labelRow}>
              <Calendar size={ms(18)} color={COLORS.primary} />
              <Text variant="body2" weight="bold" style={styles.label}>
                Select Date
              </Text>
            </View>
            <InfoBox label="" value={isNewBooking ? "Select Date" : "19/04/2026"} showDropdown />
          </View>
        )}

        {/* Time Slots */}
        <View style={styles.rowGap}>
          <View style={styles.labelRow}>
            <Clock size={ms(18)} color={COLORS.primary} />
            <Text variant="body2" weight="bold" style={styles.label}>
              Select Time Slots
            </Text>
          </View>
          <View style={styles.splitRow}>
            <View style={styles.flex1}>
              <InfoBox label="From" value={isNewBooking ? "Start" : "7 Am"} showDropdown />
            </View>
            <View style={styles.flex1}>
              <InfoBox
                label="To"
                value={isNewBooking ? "End" : bookingType === "multi" ? "8 Am" : "12 Pm"}
                showDropdown
              />
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <InfoBox label="Total Payment" value={isNewBooking ? "₹ 0" : "₹ 7000"} />
        <InfoBox
          label="Remaining Amount"
          value={isNewBooking ? "₹ 0" : "₹ 6500"}
          color={COLORS.danger}
        />

        {/* Amount Paid with Dynamic Add/Cancel Button */}
        <View style={styles.fieldGroup}>
          <Text variant="body2" weight="bold" style={styles.labelOnly}>
            Amount Paid
          </Text>
          <View style={styles.inputBox}>
            <Text variant="body2" weight="semiBold" color="#00B562" style={styles.flex1}>
              {isNewBooking ? "₹ 0" : "₹ 500"}
            </Text>

            {/* --- UPDATED: Dynamic Add/Cancel Button --- */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setIsAddingPayment(!isAddingPayment)}
              activeOpacity={0.7}>
              <Text
                variant="body2"
                weight="bold"
                color={isAddingPayment ? COLORS.danger : "#00B562"}>
                {isAddingPayment ? "Cancel" : "Add"}
              </Text>
              {isAddingPayment ? (
                <Minus size={ms(18)} color={COLORS.danger} />
              ) : (
                <Plus size={ms(18)} color="#00B562" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Payment Dropdown Box */}
        {isAddingPayment && (
          <View style={styles.paymentBox}>
            <View style={styles.paymentFieldGroup}>
              <Text variant="body2" weight="medium" style={styles.labelOnly}>
                Cash
              </Text>
              <View style={styles.inputBox}>
                <Text variant="body2" weight="semiBold" style={styles.flex1}>
                  ₹800
                </Text>
              </View>
            </View>

            <View style={styles.paymentFieldGroup}>
              <Text variant="body2" weight="medium" style={styles.labelOnly}>
                Online
              </Text>
              <View style={styles.inputBox}>
                <Text variant="body2" weight="semiBold" style={styles.flex1}>
                  ₹ 100
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.savePaymentBtn}
              activeOpacity={0.8}
              onPress={() => setIsAddingPayment(false)}>
              <Text family="nichrome" variant="h3" color="#FFF">
                SAVE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Button */}
        {!isAddingPayment && (
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
            <Text family="nichrome" variant="h3" color="#FFF">
              CONFIRM BULK BOOKING
            </Text>
          </TouchableOpacity>
        )}

        {/* Collapsible Payment History */}
        {!isNewBooking && (
          <>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => setIsPaymentHistoryOpen(!isPaymentHistoryOpen)}
              activeOpacity={0.7}>
              <Landmark size={ms(20)} color={COLORS.text.primary} />
              <Text variant="body2" weight="bold" color={COLORS.danger} style={styles.flex1}>
                Current Booking Payment History
              </Text>
              {isPaymentHistoryOpen ? (
                <ChevronDown size={ms(20)} />
              ) : (
                <ChevronRight size={ms(20)} />
              )}
            </TouchableOpacity>

            {isPaymentHistoryOpen && (
              <View style={styles.historyContent}>
                {[
                  { date: "10 May 2026", time: "8:05 Am", amount: "+₹2000" },
                  { date: "8 May 2026", time: "8:02 Am", amount: "+₹1000" },
                  { date: "5 May 2026", time: "7:43 Pm", amount: "+₹500" },
                ].map((item, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <View style={styles.flex1}>
                      <Text variant="body2" weight="semiBold">
                        {item.date}
                      </Text>
                      <Text variant="caption" color={COLORS.text.muted}>
                        {item.time}
                      </Text>
                    </View>
                    <Text variant="body2" weight="bold" color="#00B562">
                      {item.amount}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.historyHeader} activeOpacity={0.7}>
              <FileText size={ms(20)} color={COLORS.text.primary} />
              <Text variant="body2" weight="bold" style={styles.flex1}>
                Previous History
              </Text>
              <ChevronRight size={ms(20)} />
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: vs(40) }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  flex1: { flex: 1 },
  categoryBadge: { textTransform: "capitalize" },

  tabContainer: { flexDirection: "row", alignItems: "center", marginBottom: vs(15), gap: hs(10) },
  tabTitle: { width: hs(120), fontSize: fs(16) },
  tabPill: {
    flex: 1,
    height: vs(40),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ms(10),
  },
  tabActive: { backgroundColor: "#282828" },
  tabInactive: { backgroundColor: COLORS.surface.primary },

  profileRow: { flexDirection: "row", alignItems: "center", gap: hs(12), marginBottom: vs(15) },
  avatar: { width: ms(50), height: ms(50), borderRadius: ms(25), backgroundColor: COLORS.primary },
  bookingTypeTitle: {
    fontSize: fs(16),
    marginTop: vs(4),
    marginBottom: vs(15),
    textTransform: "uppercase",
  },
  fieldGroup: { marginBottom: vs(15) },
  labelRow: { flexDirection: "row", alignItems: "center", gap: hs(6), marginBottom: vs(6) },
  labelOnly: { marginBottom: vs(6), fontSize: fs(14) },
  label: { fontSize: fs(14) },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(12),
    paddingVertical: vs(10),
    borderRadius: ms(10),
  },
  callBtn: {
    backgroundColor: "#000",
    paddingHorizontal: hs(12),
    paddingVertical: vs(4),
    borderRadius: ms(6),
  },
  splitRow: { flexDirection: "row", gap: hs(10) },
  rowGap: { marginBottom: vs(15) },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    paddingVertical: vs(4),
    paddingHorizontal: hs(6),
  }, // Added slight padding for touch target

  paymentBox: {
    padding: hs(10),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    marginBottom: vs(15),
    gap: vs(15),
  },
  paymentFieldGroup: { gap: vs(6) },
  savePaymentBtn: {
    backgroundColor: "#000",
    height: vs(44),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    padding: ms(10),
    marginTop: vs(10),
  },
  historyContent: {
    padding: ms(10),
    backgroundColor: COLORS.surface.primary,
    borderBottomLeftRadius: ms(10),
    borderBottomRightRadius: ms(10),
    gap: vs(10),
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: vs(8),
    borderBottomWidth: 0.5,
    borderBottomColor: "#DDD",
  },
  saveBtn: {
    backgroundColor: "#000",
    height: vs(44),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(20),
    marginBottom: vs(10),
  },
});
