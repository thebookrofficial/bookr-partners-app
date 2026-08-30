// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, InvoiceSkeleton } from "@/components/ui";
import { ArrowLeft, Phone, Calendar, Clock, User, Home } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useStaycationInvoice } from "../hooks/useStaycationInvoice";

export const StaycationInvoiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "StaycationInvoice">>();
  const { bookingId } = route.params;

  const { booking, loading } = useStaycationInvoice(bookingId);

  if (loading || !booking) {
    return (
      <View style={styles.root}>
        <InvoiceSkeleton />
      </View>
    );
  }

  const profileData = Array.isArray(booking.profiles) ? booking.profiles[0] : booking.profiles;
  const guestName = booking.guest_name || profileData?.full_name || "Guest User";
  const guestPhone = booking.guest_phone || profileData?.phone || "N/A";

  // Logic for Online/Offline status
  const isOnline = !!booking.user_id;

  const rawSubtotal = Number(booking.subtotal) || 0;

  // Total Paid: The final price of the service (total_amount in DB)
  const totalPaid = Number(booking.total_amount) || 0;

  // In App Payments: Use DB subtotal strictly for online bookings
  const inAppPayments = isOnline ? rawSubtotal : Number(booking.paid_amount) || 0;

  const discountAmount = 0; // Hardcoded to 0 for display as platform subsidizes it

  // Calculate fees based on 5% commission applied strictly to the total_amount (Total Paid)
  // const platformFee = totalPaid * 0.05;
  // const gatewayFee = inAppPayments * 0.02;

  const staycationVenue = Array.isArray(booking.venues?.staycation_venues)
    ? booking.venues.staycation_venues[0]
    : booking.venues?.staycation_venues;

  const commissionPercentage = Number(staycationVenue?.commission_percentage ?? 5) / 100;

  const gatewayPercentage = Number(staycationVenue?.gateway_percentage ?? 2) / 100;

  const platformFee = totalPaid * commissionPercentage;
  const gatewayFee = inAppPayments * gatewayPercentage;

  /**
   * Estimated vendor payout is calculated from the actual in-app payment
   * received by Bookr, after deducting the platform and gateway charges.
   */
  const estPayout = inAppPayments - platformFee - gatewayFee;

  const isResort = booking.venues?.staycation_venues?.[0]?.property_type === "resort";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(0)}>
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
          <Text variant="body1" weight="semiBold" color="#63A1FD" style={styles.statusText}>
            {isOnline ? "Online" : "Manual"}
          </Text>
        </View>

        {/* Mobile Number Section */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Phone size={ms(18)} color={COLORS.text.primary} fill={COLORS.text.primary} />
            <Text variant="body1" weight="medium" style={styles.labelText}>
              Mobile No
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text variant="body1" weight="semiBold">
              {guestPhone}
            </Text>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Calendar size={ms(18)} color={COLORS.text.primary} />
            <Text variant="body1" weight="bold" style={styles.labelText}>
              Stay Dates
            </Text>
          </View>
          <View style={styles.infoBox}>
            <Text variant="body1" weight="semiBold">
              {`${formatDate(booking.check_in_date)} - ${formatDate(booking.check_out_date)}`}
            </Text>
          </View>
        </View>

        {/* Unit/Guest Section */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.flex1]}>
            <View style={styles.labelRow}>
              <User size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body1" weight="bold" style={styles.labelText}>
                Guests
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text variant="body1" weight="semiBold">
                {booking.guest_count}
              </Text>
            </View>
          </View>
          <View style={{ width: hs(12) }} />
          <View style={[styles.fieldGroup, styles.flex1]}>
            <View style={styles.labelRow}>
              <Clock size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body1" weight="bold" style={styles.labelText}>
                Units
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text variant="body1" weight="semiBold">
                {booking.unit_count || 1}
              </Text>
            </View>
          </View>
        </View>

        {/* Room Details Section (Resort Only) */}
        {isResort && (
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Home size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body1" weight="bold" style={styles.labelText}>
                Room Name & Number
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text variant="body1" weight="semiBold">
                {`${booking.staycation_rooms?.room_name || "N/A"} - ${
                  booking.staycation_rooms?.room_number || "N/A"
                }`}
              </Text>
            </View>
          </View>
        )}

        {/* Payments Section */}
        {isOnline ? (
          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text variant="body1" weight="bold" style={styles.standaloneLabel}>
                Total Amount
              </Text>
              <View style={styles.infoBox}>
                <Text variant="body1" weight="semiBold">
                  ₹ {totalPaid}
                </Text>
              </View>
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text variant="body1" weight="bold" style={styles.standaloneLabel}>
                In App Payments
              </Text>
              <View style={styles.infoBox}>
                <Text variant="body1" weight="semiBold" color="#00B562">
                  ₹ {inAppPayments}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.fieldGroup}>
            <Text variant="body1" weight="bold" style={styles.standaloneLabel}>
              Amount Paid
            </Text>
            <View style={styles.infoBox}>
              <Text variant="body1" weight="semiBold" color="#00B562">
                ₹ {inAppPayments}
              </Text>
            </View>
          </View>
        )}

        {/* Total Payout Section */}
        {isOnline && (
          <View style={styles.payoutContainer}>
            <Text variant="body1" weight="bold" style={styles.payoutTitle}>
              TOTAL PAYOUT
            </Text>

            <View style={styles.payoutRow}>
              <Text variant="body1" weight="semiBold">
                Total Amount
              </Text>
              <Text variant="body1" weight="medium">
                ₹{totalPaid}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.payoutRow}>
              <Text variant="body1" weight="semiBold">
                In App Payment
              </Text>
              <Text variant="body1" weight="medium">
                ₹{inAppPayments}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <Text variant="body1" weight="semiBold">
                Discount
              </Text>
              <Text variant="body1" weight="medium" color="#E55959">
                -₹{discountAmount}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <View style={styles.dashedUnderline}>
                <Text variant="body1" weight="semiBold">
                  Platform Fee
                </Text>
              </View>
              <Text variant="body1" weight="medium" color="#E55959">
                -₹{platformFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <View style={styles.dashedUnderline}>
                <Text variant="body1" weight="semiBold">
                  Handling Charges
                </Text>
              </View>
              <Text variant="body1" weight="medium" color="#E55959">
                -₹{gatewayFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.payoutRow}>
              <Text variant="body1" weight="bold">
                EST. Payout Amount
              </Text>
              <Text variant="body1" weight="bold" color="#00B562">
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
  fieldRow: {
    flexDirection: "row",
    gap: hs(12),
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
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  flex1: {
    flex: 1,
  },
});
