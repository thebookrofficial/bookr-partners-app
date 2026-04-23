// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { Calendar, ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

// Mock Data
const MOCK_DATA = {
  totalBookings: 12,
  onlineBookings: 5,
  offlineBookings: 7,
  totalRevenue: "56000",
  onlineRevenue: "32000",
  offlineRevenue: "24000",
  weeklyRevenue: [
    { week: "Week 1", dates: "Apr 1- Apr 4", amount: "10400", percentage: 40 },
    { week: "Week 2", dates: "Apr 5- Apr 11", amount: "4000", percentage: 80 },
    { week: "Week 2", dates: "Apr 12 - Apr 18", amount: "8000", percentage: 75 },
    { week: "Week 2", dates: "Apr 19 - Apr 25", amount: "10400", percentage: 85 },
    { week: "Week 2", dates: "Apr 26 - Apr 30", amount: "10400", percentage: 70 },
  ],
};

export const StaycationDashboardScreen = () => {
  const [selection, setSelection] = useState("This Month");
  const [activeTab, setActiveTab] = useState("Farmhouse");

  const SELECTION_TABS = ["This Month", "Last Month", "Custom"];

  return (
    <ScreenContainer scrollable paddingHorizontal={hs(12)}>
      <ServiceHeader title="Vally view farmhouse" imageSource={USER_PROFILE} />

      {/* Selection Tabs */}
      <View style={styles.sectionHeaderRow}>
        <Text variant="body1" weight="bold" style={styles.selectionLabel}>
          Selection
        </Text>
        <View style={styles.selectionTabs}>
          {SELECTION_TABS.map(tab => {
            const isActive = selection === tab;
            const isCustom = tab === "Custom";
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelection(tab)}
                style={[styles.selectionTab, isActive && styles.activeSelectionTab]}>
                {isCustom && (
                  <Calendar size={ms(16)} color={isActive ? COLORS.text.inverse : "#8C8C8C"} />
                )}
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={isActive ? COLORS.text.inverse : "#8C8C8C"}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bookings Filter Tabs */}
      <View style={styles.bookingTabRow}>
        <Text variant="body1" weight="bold" style={styles.bookingsLabel}>
          Bookings
        </Text>
        <PillTabs
          tabs={["Farmhouse", "Delux Rooms", "Cottages"]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="dark"
          style={styles.pillTabs}
        />
      </View>

      {/* Booking Details Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          BOOKING DETAILS
        </Text>
        <View style={styles.bookingDetailsCard}>
          <View style={styles.totalBookingsBox}>
            <View style={styles.totalRow}>
              <Text variant="h1" weight="bold" style={styles.totalNumber}>
                {MOCK_DATA.totalBookings}
              </Text>
              <Text variant="body2" weight="semiBold" color="#00B562" style={styles.smallTotal}>
                {MOCK_DATA.totalBookings}
              </Text>
            </View>
            <Text variant="body1" color={COLORS.text.primary}>
              Total bookings
            </Text>
          </View>

          <View style={styles.onlineOfflineCol}>
            <View style={styles.badgeBox}>
              <Text variant="body2" color="#001C65">
                Online bookings
              </Text>
              <Text variant="body1" weight="bold" color="#001C65">
                {MOCK_DATA.onlineBookings}
              </Text>
            </View>
            <View style={styles.badgeBox}>
              <Text variant="body2" color="#63A1FD">
                Offline bookings
              </Text>
              <Text variant="body1" weight="bold" color="#63A1FD">
                {MOCK_DATA.offlineBookings}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Revenue Details Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          REVENUE DETAILS
        </Text>
        <View style={styles.revenueCard}>
          <View style={styles.chartWrapper}>
            <View style={styles.donutBase} />
            <View style={styles.donutOverlay}>
              <Text variant="body2" weight="bold" color="#00B562">
                +₹{MOCK_DATA.totalRevenue}
              </Text>
              <Text variant="body2" color={COLORS.text.primary}>
                Total
              </Text>
            </View>
          </View>

          <View style={styles.revenueCol}>
            <View style={styles.revenueItem}>
              <Text variant="body2" color={COLORS.text.primary}>
                Online Revenue
              </Text>
              <Text variant="h2" weight="bold" color="#001C65">
                ₹{MOCK_DATA.onlineRevenue}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text variant="body2" color={COLORS.text.primary}>
                Offline Revenue
              </Text>
              <Text variant="h2" weight="bold" color="#63A1FD">
                ₹{MOCK_DATA.offlineRevenue}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Revenue Graph Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          REVENUE GRAPH
        </Text>
        {MOCK_DATA.weeklyRevenue.map((item, index) => (
          <View key={index} style={styles.graphRow}>
            <View style={styles.weekLabelBox}>
              <Text variant="body2" weight="semiBold" color="#8C8C8C">
                {item.week}
              </Text>
              <Text variant="body2" style={styles.dateRangeText}>
                {item.dates}
              </Text>
            </View>
            <View style={styles.barWrapper}>
              <View style={[styles.bar, { width: `${item.percentage}%` }]}>
                <Text variant="body2" weight="semiBold" color="#00B562">
                  +₹{item.amount}
                </Text>
              </View>
            </View>
            <ChevronRight size={ms(16)} color={COLORS.text.primary} />
          </View>
        ))}
      </View>

      <View style={{ height: vs(120) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: vs(10),
  },
  selectionLabel: {
    fontSize: fs(20),
    width: hs(100),
  },
  selectionTabs: {
    flex: 1,
    flexDirection: "row",
    gap: hs(6),
  },
  selectionTab: {
    flex: 1,
    height: vs(40),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: hs(4),
  },
  activeSelectionTab: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  bookingTabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    marginBottom: vs(10),
    height: vs(40),
  },
  bookingsLabel: {
    fontSize: fs(16),
  },
  pillTabs: {
    flex: 1,
    marginVertical: 0,
  },
  sectionContainer: {
    marginTop: vs(20),
  },
  sectionTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    marginBottom: vs(10),
    textTransform: "uppercase",
  },
  bookingDetailsCard: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(6),
    flexDirection: "row",
    gap: hs(10),
  },
  totalBookingsBox: {
    flex: 1,
    paddingHorizontal: hs(20),
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: hs(6),
  },
  totalNumber: {
    fontSize: fs(36),
    lineHeight: fs(38),
  },
  smallTotal: {
    fontSize: fs(12),
    marginBottom: vs(6),
  },
  onlineOfflineCol: {
    flex: 1,
    gap: vs(6),
  },
  badgeBox: {
    backgroundColor: "rgba(203, 223, 254, 0.5)",
    paddingVertical: vs(8),
    paddingHorizontal: hs(10),
    borderRadius: ms(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: ms(6),
    gap: hs(20),
  },
  chartWrapper: {
    width: ms(100),
    height: ms(100),
    justifyContent: "center",
    alignItems: "center",
  },
  donutBase: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: 4,
    borderColor: "#63A1FD",
  },
  donutOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  revenueCol: {
    flex: 1,
    gap: vs(10),
  },
  revenueItem: {
    gap: vs(4),
  },
  graphRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(10),
    gap: hs(10),
  },
  weekLabelBox: {
    width: hs(70),
    alignItems: "center",
  },
  dateRangeText: {
    fontSize: fs(8),
    color: COLORS.text.primary,
  },
  barWrapper: {
    flex: 1,
    height: vs(34),
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  bar: {
    height: "100%",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: hs(10),
  },
});
