// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Settings, Bell } from "lucide-react-native";
import { BookingCard } from "../components/BookingCard";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useGuestHistory, HistoryBooking } from "../hooks/useGuestHistory";

export const GuestHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "GuestHistory">>();
  const { guestId: guestIdParam, bookingId } = route.params;

  // Use guestIdParam (phone) if available, otherwise fallback to bookingId
  const identifier = guestIdParam || bookingId;

  const { history, stats, guestName, guestPhone, loading } = useGuestHistory(identifier);

  // Formatting helpers
  const formatDisplayDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [h] = timeStr.split(":");
    const hourInt = parseInt(h, 10);
    return `${hourInt % 12 || 12} ${hourInt >= 12 ? "Pm" : "Am"}`;
  };

  const groupedHistory = history.reduce((acc: { [key: string]: HistoryBooking[] }, item) => {
    const date = new Date(item.slot_date);
    const monthYear = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(16)}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" style={styles.headerTitle}>
          Guest History
        </Text>
        <View style={styles.headerActions}>
          <Bell size={ms(24)} color={COLORS.text.primary} style={{ marginRight: hs(12) }} />
          <Settings size={ms(24)} color={COLORS.text.primary} />
        </View>
      </View>

      {/* 2. Profile Overview */}
      <View style={styles.profileSection}>
        {/* <Image
          source={require("@/assets/images/placeholder-user.png")} // Replace with actual avatar logic
          style={styles.largeAvatar}
        /> */}
        <View style={styles.profileInfo}>
          <Text variant="h2" weight="bold">
            {guestName}
          </Text>
          <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
            {guestPhone}
          </Text>
          <Text variant="body2" color={COLORS.text.muted}>
            {history.length} Total Bookings
          </Text>
        </View>
      </View>

      {/* 3. Stats Tabs */}
      <View style={styles.statsTabsContainer}>
        <TouchableOpacity style={[styles.statTab, styles.statTabActive]}>
          <Text variant="body1" weight="bold" color={COLORS.text.inverse}>
            {stats.past}
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.text.inverse}>
            Past Booking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statTab}>
          <Text variant="body1" weight="bold">
            {stats.upcoming}
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.text.muted}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statTab}>
          <Text variant="body1" weight="bold">
            {stats.cancelled}
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.danger}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Bookings List */}
      <View style={styles.listSection}>
        <Text variant="body2" weight="bold" style={styles.sectionLabel}>
          PAST BOOKINGS
        </Text>
        {Object.keys(groupedHistory).map(month => (
          <React.Fragment key={month}>
            <Text variant="body2" weight="bold" style={styles.monthHeader}>
              {month}
            </Text>
            {groupedHistory[month].map(item => (
              <BookingCard
                key={item.id}
                name={guestName}
                subtitle={guestPhone}
                date={formatDisplayDate(item.slot_date)}
                time={`${formatTime(item.start_time)} - ${formatTime(item.end_time)}`}
                price={`₹${item.total_amount}`}
                // CHANGE THIS: Use item.status instead of the ternary logic
                status={item.status}
                hideCallButton={true}
              />
            ))}
          </React.Fragment>
        ))}
      </View>
      <View style={{ height: vs(40) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginVertical: vs(16) },
  backBtn: { paddingRight: hs(12) },
  headerTitle: { flex: 1, fontSize: fs(22) },
  headerActions: { flexDirection: "row", alignItems: "center" },
  profileSection: { alignItems: "center", marginBottom: vs(30) },
  largeAvatar: { width: ms(120), height: ms(120), borderRadius: ms(60), marginBottom: vs(12) },
  profileInfo: { alignItems: "center", gap: vs(2) },
  statsTabsContainer: { flexDirection: "row", gap: hs(12), marginBottom: vs(24) },
  statTab: {
    flex: 1,
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(12),
    paddingVertical: vs(12),
    alignItems: "center",
    gap: vs(2),
  },
  statTabActive: { backgroundColor: COLORS.primary },
  listSection: { width: "100%" },
  sectionLabel: { color: COLORS.text.primary, marginBottom: vs(16), letterSpacing: 0.5 },
  monthHeader: { color: COLORS.text.primary, marginVertical: vs(10) },
});
