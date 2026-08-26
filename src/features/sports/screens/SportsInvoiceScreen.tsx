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
import {
  ArrowLeft,
  Phone,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  MapPin,
  Tag,
} from "lucide-react-native";
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
  const isOnline = booking.booking_source === "online";

  // Identify if it's a Pickleball service
  const sportsVenues = booking.venues?.sports_venues;
  const sportsType = Array.isArray(sportsVenues)
    ? sportsVenues[0]?.sports_type || ""
    : (sportsVenues as any)?.sports_type || "";
  const isPickleball = sportsType.toLowerCase().includes("pickleball");

  // Calculate fees based on user requirements
  const rawSubtotal = Number(booking.subtotal) || 0;
  const dbPlatformFee = Number(booking.platform_fee) || 0;
  const dbDiscount = Number(booking.discount_amount) || 0;

  // servicePrice: The full price of the service (total_amount in DB)
  // totalPaid: Formula provided by user: paid_amount + discount - platform_fee
  // Note: Platform fee subtraction is applied ONLY to Pickleball as requested.
  const servicePrice = Number(booking.total_amount) || 0;
  const totalPaid =
    (Number(booking.paid_amount) || 0) + dbDiscount - (isPickleball ? dbPlatformFee : 0);

  // In App Payments: Use DB subtotal strictly for online bookings
  const inAppPayments = isOnline ? rawSubtotal : totalPaid;

  const discountAmount = 0; // Hardcoded to 0 for display as platform subsidizes it

  // Platform Fee: Always 3.5% of the total service price.
  const platformFeeRate = 0.035;
  const platformFee = servicePrice * platformFeeRate;

  // Gateway Charges: 2% (Applied strictly to the inAppPayments)
  const gatewayFee = inAppPayments * 0.02;

  // Est Payout: Total Paid - platform fee - gateway charges
  const estPayout = totalPaid - platformFee - gatewayFee;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const displayMins = m === "00" ? "" : `:${m}`;
    return `${displayHour}${displayMins} ${ampm}`;
  };

  const getTimeRanges = () => {
    const slots = booking.all_slots || [];
    if (slots.length === 0) return "N/A";

    const sortedSlots = [...slots].sort((a: any, b: any) =>
      a.start_time.localeCompare(b.start_time),
    );

    let currentStart = sortedSlots[0].start_time;
    let currentEnd = sortedSlots[0].end_time;
    const blocks = [];

    for (let i = 1; i < sortedSlots.length; i++) {
      if (sortedSlots[i].start_time === currentEnd) {
        currentEnd = sortedSlots[i].end_time;
      } else {
        blocks.push(`${formatTime(currentStart)} - ${formatTime(currentEnd)}`);
        currentStart = sortedSlots[i].start_time;
        currentEnd = sortedSlots[i].end_time;
      }
    }
    blocks.push(`${formatTime(currentStart)} - ${formatTime(currentEnd)}`);
    return blocks.join("  |  ");
  };

  let groundName =
    booking.all_slots?.[0]?.sports_grounds?.name ||
    booking.sports_slots?.sports_grounds?.name ||
    "N/A";

  const catLower = sportsType.toLowerCase();
  const groundLower = groundName.toLowerCase();
  if (catLower && groundLower.startsWith(catLower)) {
    groundName = groundName.slice(catLower.length).trim();
  }

  const slotDate = booking.all_slots?.[0]?.slot_date || booking.sports_slots?.slot_date;

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
              {slotDate ? formatDate(slotDate) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Category & Ground Info */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, styles.flex1]}>
            <View style={styles.labelRow}>
              <Tag size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body2" weight="bold" style={styles.labelText}>
                Category
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text variant="body2" weight="semiBold">
                {sportsType ? sportsType.charAt(0).toUpperCase() + sportsType.slice(1) : "-"}
              </Text>
            </View>
          </View>

          <View style={[styles.fieldGroup, styles.flex1]}>
            <View style={styles.labelRow}>
              <MapPin size={ms(18)} color={COLORS.text.primary} />
              <Text variant="body2" weight="bold" style={styles.labelText}>
                Ground
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text variant="body2" weight="semiBold" numberOfLines={1}>
                {groundName}
              </Text>
            </View>
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
              {getTimeRanges()}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        {isOnline ? (
          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
                Total Paid
              </Text>
              <View style={styles.infoBox}>
                <Text variant="body2" weight="semiBold">
                  ₹ {totalPaid}
                </Text>
              </View>
            </View>
            <View style={[styles.fieldGroup, styles.flex1]}>
              <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
                In app payments
              </Text>
              <View style={styles.infoBox}>
                <Text variant="body2" weight="semiBold" color="#00B562">
                  ₹ {inAppPayments}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.fieldGroup}>
            <Text variant="body2" weight="bold" style={styles.standaloneLabel}>
              Amount Paid
            </Text>
            <View style={styles.infoBox}>
              <Text variant="body2" weight="semiBold" color="#00B562">
                ₹ {inAppPayments}
              </Text>
            </View>
          </View>
        )}

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
                Total Paid
              </Text>
              <Text variant="body2" weight="medium">
                ₹{totalPaid}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.payoutRow}>
              <Text variant="body2" weight="semiBold">
                In App Payout
              </Text>
              <Text variant="body2" weight="medium">
                ₹{inAppPayments}
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
                  Platform Fee
                </Text>
              </View>
              <Text variant="body2" weight="medium" color="#E55959">
                -₹{platformFee.toFixed(2)}
              </Text>
            </View>

            <View style={styles.payoutRow}>
              <View style={styles.dashedUnderline}>
                <Text variant="body2" weight="semiBold">
                  Handling Fees
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
  flex1: {
    flex: 1,
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
});
