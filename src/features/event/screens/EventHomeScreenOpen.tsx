// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { PillTabs } from "@/components/ui";
import { hs, vs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { EventHeader } from "../components/EventHeader";
import { EventSummaryStats } from "../components/EventSummaryStats";
import { EventBookingList } from "../components/EventBookingList";
import { EventCharts } from "../components/EventCharts";
import { useEventHomeOpen } from "../hooks/useEventHomeOpen";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface EventHomeScreenOpenProps {
  eventId: string;
}

export const EventHomeScreenOpen = ({ eventId }: EventHomeScreenOpenProps) => {
  const {
    loading,
    refreshing,
    eventData,
    bookings,
    totalBookings,
    summaryCategories,
    chartCategories,
    chartData,
    activeTab,
    setActiveTab,
    refresh,
  } = useEventHomeOpen(eventId);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Generate dynamic tabs based on summary categories with counts
  const tabNames = [
    { label: "All", count: totalBookings.value },
    ...summaryCategories.map(c => ({ label: c.label, count: c.value })),
  ];

  // Filter bookings based on activeTab (simple string match for now)
  const filteredBookings =
    activeTab === "All" ? bookings : bookings.filter(b => b.passType.includes(activeTab));

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={refreshing}
        onRefresh={refresh}>
        {/* 1. Header */}
        <EventHeader
          title={eventData?.title || "Neon Shadow World Tour 2026"}
          subtitle="Bookings"
          imageSource={USER_PROFILE}
        />

        {/* 2. Summary Stats */}
        <EventSummaryStats totalBookings={totalBookings} categories={summaryCategories} />

        {/* 3. Filter Tabs */}
        <View style={styles.tabWrapper}>
          <PillTabs
            tabs={tabNames}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="dark"
          />
        </View>

        {/* 4. Booking List */}
        <EventBookingList bookings={filteredBookings} />

        {/* 5. Charts */}
        {/* Pass categories exactly as expected by EventCharts */}
        <EventCharts categories={chartCategories} chartData={chartData} />

        <View style={{ height: vs(120) }} />
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  tabWrapper: {
    marginBottom: vs(10),
    paddingHorizontal: hs(6),
  },
});
