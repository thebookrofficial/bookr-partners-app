// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { PillTabs } from "@/components/ui";
import { hs, vs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { EventHeader } from "../components/EventHeader";
import { EventSummaryStats } from "../components/EventSummaryStats";
import { EventBookingList } from "../components/EventBookingList";
import { EventCharts } from "../components/EventCharts";

const MOCK_BOOKINGS = [
  {
    id: "1",
    name: "Chirag Patil",
    passType: "VIP x 3",
    time: "8:32 Pm",
    date: "17 Apr 2026",
  },
  {
    id: "2",
    name: "Kartik Patil",
    passType: "Regular x 3",
    time: "8:30 Pm",
    date: "17 Apr 2026",
  },
  {
    id: "3",
    name: "Yash Patil",
    passType: "Premium x 1",
    time: "8:22 Pm",
    date: "17 Apr 2026",
  },
  {
    id: "4",
    name: "Yash Patil",
    passType: "Premium x 1",
    time: "8:22 Pm",
    date: "16 Apr 2026",
  },
  {
    id: "5",
    name: "Yash Patil",
    passType: "Premium x 1",
    time: "8:22 Pm",
    date: "16 Apr 2026",
  },
];

const SUMMARY_CATEGORIES = [
  { label: "Regular Pass", value: 198, trend: 30 },
  { label: "Premium Pass", value: 122, trend: 10 },
  { label: "VIP", value: 27, trend: 7 },
];

const CHART_CATEGORIES = [
  { label: "Regular", color: COLORS.primary },
  { label: "Premium", color: COLORS.warning },
  { label: "VIP", color: COLORS.danger },
];

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const EventHomeScreenOpen = () => {
  const [activeTab, setActiveTab] = useState("All (100)");

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        {/* 1. Header */}
        <EventHeader
          title="Neon Shadow World Tour 2026"
          subtitle="Bookings"
          imageSource={USER_PROFILE}
        />

        {/* 2. Summary Stats */}
        <EventSummaryStats
          totalBookings={{ value: 347, trend: 42 }}
          categories={SUMMARY_CATEGORIES}
        />

        {/* 3. Filter Tabs */}
        <View style={styles.tabWrapper}>
          <PillTabs
            tabs={["All (100)", "Regular", "Premium", "VIP"]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="dark"
          />
        </View>

        {/* 4. Booking List */}
        <EventBookingList bookings={MOCK_BOOKINGS} />

        {/* 5. Charts */}
        <EventCharts categories={CHART_CATEGORIES} />

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
  tabWrapper: {
    marginBottom: vs(10),
    paddingHorizontal: hs(6),
  },
});
