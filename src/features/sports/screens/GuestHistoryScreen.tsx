// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft, Settings, Bell } from "lucide-react-native";
import { BookingCard } from "../components/BookingCard";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { useGuestHistory, HistoryBooking } from "../hooks/useGuestHistory";

export const GuestHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, "GuestHistory">>();

  // CRITICAL FIX 1: Extract vertical from route.params
  const { guestId: guestIdParam, bookingId, vertical, venueId } = route.params as any;

  const identifier = guestIdParam || bookingId;

  // CRITICAL Fix 2: Pass vertical into the hook
  const { history, stats, guestName, guestPhone, loading } = useGuestHistory(
    identifier,
    vertical,
    venueId,
  );

  const [activeTab, setActiveTab] = useState<"past" | "upcoming" | "cancelled">("past");

  const filteredHistory = history.filter(h => h.booking_status === activeTab);

  const navigateToHistoryItem = (item: HistoryBooking) => {
    if (item.vertical === "sports") {
      navigation.navigate("SportsInvoice", { bookingId: item.id });
    } else if (item.vertical === "staycation") {
      navigation.navigate("StaycationInvoice", { bookingId: item.id });
    } else if (item.vertical === "dining") {
      navigation.navigate("DineBookingDetails", { bookingId: item.id });
    } else if (item.vertical === "events") {
      navigation.navigate("EventEntryDetails", { entryId: item.id });
    }
  };

  const groupedHistory = filteredHistory.reduce(
    (acc: { [key: string]: HistoryBooking[] }, item) => {
      const date = new Date(item.raw_date);
      const monthYear = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
      if (!acc[monthYear]) acc[monthYear] = [];
      acc[monthYear].push(item);
      return acc;
    },
    {},
  );

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
        <TouchableOpacity
          style={[styles.statTab, activeTab === "past" && styles.statTabActive]}
          onPress={() => setActiveTab("past")}>
          <Text
            variant="body1"
            weight="bold"
            color={activeTab === "past" ? COLORS.text.inverse : COLORS.text.primary}>
            {stats.past}
          </Text>
          <Text
            variant="caption"
            weight="semiBold"
            color={activeTab === "past" ? COLORS.text.inverse : COLORS.text.muted}>
            Past Booking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statTab, activeTab === "upcoming" && styles.statTabActive]}
          onPress={() => setActiveTab("upcoming")}>
          <Text
            variant="body1"
            weight="bold"
            color={activeTab === "upcoming" ? COLORS.text.inverse : COLORS.text.primary}>
            {stats.upcoming}
          </Text>
          <Text
            variant="caption"
            weight="semiBold"
            color={activeTab === "upcoming" ? COLORS.text.inverse : COLORS.text.muted}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statTab, activeTab === "cancelled" && styles.statTabActive]}
          onPress={() => setActiveTab("cancelled")}>
          <Text
            variant="body1"
            weight="bold"
            color={activeTab === "cancelled" ? COLORS.text.inverse : COLORS.danger}>
            {stats.cancelled}
          </Text>
          <Text
            variant="caption"
            weight="semiBold"
            color={activeTab === "cancelled" ? COLORS.text.inverse : COLORS.danger}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Bookings List */}
      <View style={styles.listSection}>
        <Text variant="body2" weight="bold" style={styles.sectionLabel}>
          {activeTab.toUpperCase()} BOOKINGS
        </Text>
        {Object.keys(groupedHistory).length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="body1" color={COLORS.text.muted}>
              No {activeTab} bookings found for this guest.
            </Text>
          </View>
        ) : (
          Object.keys(groupedHistory).map(month => (
            <React.Fragment key={month}>
              <Text variant="body2" weight="bold" style={styles.monthHeader}>
                {month}
              </Text>
              {groupedHistory[month].map(item => (
                <BookingCard
                  key={item.id}
                  name={item.venue_name}
                  subtitle={
                    item.vertical === "staycation" ? "Staycation Booking" : "Sports Booking"
                  }
                  date={item.display_date}
                  time={item.display_time}
                  price={`₹${item.total_amount}`}
                  isDisabled={activeTab === "past"}
                  // Use 'as any' to bypass the strict prop type constraint
                  status={(item.booking_status === "cancelled" ? "Cancelled" : item.status) as any}
                  onPress={() => navigateToHistoryItem(item)}
                />
              ))}
            </React.Fragment>
          ))
        )}
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
  emptyState: {
    paddingVertical: vs(40),
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: { color: COLORS.text.primary, marginBottom: vs(16), letterSpacing: 0.5 },
  monthHeader: { color: COLORS.text.primary, marginVertical: vs(10) },
});
