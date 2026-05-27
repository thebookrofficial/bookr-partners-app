// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Phone, Calendar, Clock, FileText, ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useSportsInvoice } from "../hooks/useSportsInvoice";

export const SportsInvoiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "SportsInvoice">>();
  const { bookingId } = route.params;

  const { booking, loading } = useSportsInvoice(bookingId);

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

  // Logic for Online/Offline status
  const isOnline = booking.paid_amount >= booking.total_amount && booking.total_amount > 0;

  // Calculate fees based on 3.5% commission as requested
  const subtotal = Number(booking.subtotal) || 0;
  const totalAmount = Number(booking.total_amount) || 0;
  const platformFee = subtotal * 0.035;
  const discountAmount = Number(booking.discount_amount) || 0;
  const gatewayFee = totalAmount * 0.02;
  const estPayout = subtotal - discountAmount - platformFee - gatewayFee;

  const formatHour = (timeStr: string) => {
    if (!timeStr) return "";
    const [h] = timeStr.split(":");
    const hourInt = parseInt(h, 10);
    const ampm = hourInt >= 12 ? "PM" : "AM";
    const displayHour = hourInt % 12 || 12;
    return `${displayHour} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  profileData?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${guestName}&background=random`,
              }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.nameContainer}>
            <Text variant="h3" weight="bold" style={styles.guestName}>
              {guestName}
            </Text>
          </View>
          <Text variant="body2" weight="semiBold" color="#63A1FD" style={styles.statusText}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>

        {/* Mobile Number Section */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color={COLORS.text.primary} fill={COLORS.text.primary} />
            <Text variant="body2" weight="medium" style={styles.labelText}>
              Mobile No
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text variant="body2" weight="semiBold">
              {guestPhone}
            </Text>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Calendar size={ms(18)} color={COLORS.text.primary} />
            <Text variant="body2" weight="bold" style={styles.labelText}>
              Date
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text variant="body2" weight="semiBold">
              {formatDate(booking.sports_slots.slot_date)}
            </Text>
          </View>
        </View>

        {/* Time Slots Section */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Clock size={ms(18)} color={COLORS.text.primary} />
            <Text variant="body2" weight="bold" style={styles.labelText}>
              Time Slots
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text variant="body2" weight="semiBold">
              {`${formatHour(booking.sports_slots.start_time)} - ${formatHour(
                booking.sports_slots.end_time,
              )}`}
            </Text>
          </View>
        </View>

        {/* Amount Paid Section */}
        <View style={styles.fieldGroup}>
          <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
            Amount Paid
          </Text>
          <View style={styles.infoBox}>
            <Text variant="body2" weight="semiBold" color="#00B562">
              ₹ {booking.paid_amount}
            </Text>
          </View>
        </View>

        {/* Previous History Link */}
        <TouchableOpacity
          style={styles.historyLink}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate("GuestHistory" as any, {
              guestId: guestPhone === "N/A" ? undefined : guestPhone,
              bookingId: booking.id,
              vertical: "sports",
            })
          }>
          <View style={styles.historyLeft}>
            <FileText size={ms(20)} color={COLORS.text.primary} />
            <Text variant="body2" weight="semiBold" style={styles.historyText}>
              Previous History
            </Text>
          </View>
          <ChevronRight size={ms(20)} color={COLORS.text.primary} />
        </TouchableOpacity>

        {/* Total Payout Section */}
        {isOnline && (
          <View style={styles.payoutContainer}>
            <Text variant="body1" weight="bold" style={styles.payoutTitle}>
              TOTAL PAYOUT
            </Text>

            <View style={styles.payoutRow}>
              <Text variant="body2" weight="semiBold">
                Original Amount
              </Text>
              <Text variant="body2" weight="medium">
                ₹{subtotal}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <Text variant="body2" weight="semiBold">
                Discount
              </Text>
              <Text variant="body2" weight="medium" color="#E55959">
                -₹{discountAmount}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <View style={styles.dashedUnderline}>
                <Text variant="body2" weight="semiBold">
                  Platform (3.5%)
                </Text>
              </View>
              <Text variant="body2" weight="medium" color="#E55959">
                -₹{platformFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <View style={styles.dashedUnderline}>
                <Text variant="body2" weight="semiBold">
                  Gateway Charges (2%)
                </Text>
              </View>
              <Text variant="body2" weight="medium" color="#E55959">
                -₹{gatewayFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.payoutRow}>
              <Text variant="body2" weight="bold">
                EST. Payout Amount
              </Text>
              <Text variant="body2" weight="bold" color="#00B562">
                ₹{estPayout.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: vs(40) }} />
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: hs(12),
    paddingTop: vs(20),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(24),
  },
  backBtn: {
    marginRight: hs(12),
  },
  avatarContainer: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.danger,
    marginRight: hs(10),
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  nameContainer: {
    flex: 1,
  },
  guestName: {
    fontSize: fs(22),
  },
  statusText: {
    textTransform: "capitalize",
    fontSize: fs(14),
  },
  fieldGroup: {
    marginBottom: vs(16),
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginBottom: vs(6),
  },
  labelText: {
    fontSize: fs(14),
  },
  standaloneLabel: {
    marginBottom: vs(6),
    fontSize: fs(14),
  },
  infoBox: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    paddingHorizontal: hs(10),
    minHeight: vs(40),
    justifyContent: "center",
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(10),
    marginBottom: vs(16),
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  historyText: {
    fontSize: fs(14),
  },
  payoutContainer: {
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "#CBDFFE",
    borderRadius: ms(10),
    padding: ms(10),
    gap: vs(12),
  },
  payoutTitle: {
    fontSize: fs(16),
    textTransform: "uppercase",
    marginBottom: vs(4),
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dashedUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderStyle: "dashed",
    paddingBottom: vs(1),
  },
  divider: {
    height: 1,
    backgroundColor: "#CBDFFE",
    marginVertical: vs(4),
  },
});
