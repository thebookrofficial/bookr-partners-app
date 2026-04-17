// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// --- DUMMY DATA FOR GRAPHS ---
const BOOKING_DATA = [
  { date: "12 Apr", day: "Sun", value: 13 },
  { date: "13 Apr", day: "Mon", value: 7.5 },
  { date: "14 Apr", day: "Tue", value: 8 },
  { date: "15 Apr", day: "Wed", value: 5 },
  { date: "16 Apr", day: "Thu", value: 10 },
  { date: "17 Apr", day: "Fri", value: 13 },
  { date: "18 Apr", day: "Sat", value: 14 },
];
const MAX_BOOKING_Y = 16;

const REVENUE_DATA = [
  { date: "12 Apr", value: "+₹10400", fillPct: "70%", isBlue: false },
  { date: "13 Apr", value: "+₹5600", fillPct: "40%", isBlue: false },
  { date: "14 Apr", value: "+₹6400", fillPct: "45%", isBlue: false },
  { date: "15 Apr", value: "+₹4000", fillPct: "30%", isBlue: false },
  { date: "16 Apr", value: "+₹8000", fillPct: "55%", isBlue: false },
  { date: "17 Apr", value: "+₹10400", fillPct: "70%", isBlue: false },
  { date: "18 Apr", value: "+₹11200", fillPct: "80%", isBlue: true },
];

/**
 * Custom Tab Component for Filters (Selection & Ground)
 */
const FilterTab = ({
  label,
  isActive,
  onPress,
  icon,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) => (
  <TouchableOpacity
    style={[styles.filterTab, isActive ? styles.filterTabActive : styles.filterTabInactive]}
    onPress={onPress}
    activeOpacity={0.7}>
    {icon}
    <Text
      variant="caption"
      weight="semiBold"
      color={isActive ? COLORS.text.inverse : COLORS.text.muted}
      style={styles.filterTabText} // Align text properly if multiline
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const SportsDashboardScreen = () => {
  const [timeFilter, setTimeFilter] = useState("Today"); // Updated default to "Today" based on Figma
  const [groundFilter, setGroundFilter] = useState("Overall");

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Header with Edit Button */}
        <ServiceHeader
          title="Elite Strikers Club"
          subtitle="Dashboard"
          rightComponent={
            <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
              <Text variant="body1" weight="semiBold">
                Edit
              </Text>
            </TouchableOpacity>
          }
        />

        {/* 2. Selection Filters - PIXEL PERFECT UPDATE */}
        <View style={styles.filterSection}>
          <Text variant="h3" weight="bold" style={styles.filterLabel}>
            Selection
          </Text>
          <View style={styles.filterTabsRow}>
            <FilterTab
              label="Today"
              isActive={timeFilter === "Today"}
              onPress={() => setTimeFilter("Today")}
            />
            <FilterTab
              label={"Last\nweek"}
              isActive={timeFilter === "Last week"}
              onPress={() => setTimeFilter("Last week")}
            />
            <FilterTab
              label={"This\nMonth"}
              isActive={timeFilter === "This Month"}
              onPress={() => setTimeFilter("This Month")}
            />
            <FilterTab
              label="Custom"
              isActive={timeFilter === "Custom"}
              onPress={() => setTimeFilter("Custom")}
              // Custom uses a 20px icon in Figma
              icon={
                <Calendar
                  size={ms(16)}
                  color={timeFilter === "Custom" ? COLORS.text.inverse : COLORS.text.muted}
                />
              }
            />
          </View>
        </View>

        <Text variant="body1" weight="bold" style={styles.dateRangeText}>
          Apr12 - Apr 18
        </Text>

        <View style={styles.filterSection}>
          <Text variant="body1" weight="bold" style={styles.filterLabel}>
            Ground
          </Text>
          <View style={styles.filterTabsRow}>
            <FilterTab
              label="Overall"
              isActive={groundFilter === "Overall"}
              onPress={() => setGroundFilter("Overall")}
            />
            <FilterTab
              label="Ground 1"
              isActive={groundFilter === "Ground 1"}
              onPress={() => setGroundFilter("Ground 1")}
            />
            <FilterTab
              label="Ground 2"
              isActive={groundFilter === "Ground 2"}
              onPress={() => setGroundFilter("Ground 2")}
            />
          </View>
        </View>

        {/* 3. Booking Details Summary */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          BOOKING DETAILS
        </Text>
        <View style={styles.summaryCard}>
          <View style={styles.totalBlock}>
            <Text variant="body1" weight="medium">
              Total bookings
            </Text>
            <Text variant="body1" weight="medium" style={styles.totalNumber}>
              70
            </Text>
          </View>
          <View style={styles.splitBlock}>
            <View style={styles.splitRow}>
              <Text variant="body2" weight="medium" color="#001C65">
                Online bookings
              </Text>
              <Text variant="body1" weight="medium" color="#001C65">
                40
              </Text>
            </View>
            <View style={styles.splitRow}>
              <Text variant="body2" weight="medium" color={COLORS.primary}>
                Offline bookings
              </Text>
              <Text variant="body1" weight="medium" color={COLORS.primary}>
                30
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Revenue Details Summary (Custom Donut Chart) */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          REVENUE DETAILS
        </Text>
        <View style={[styles.summaryCard, styles.revenueSummaryCard]}>
          <View style={styles.revenueDonutWrapper}>
            <View style={[styles.donutRing, styles.donutRingBase]} />
            <View style={[styles.donutRingOver, styles.donutRingDark]} />

            <View style={styles.donutInner}>
              <Text variant="body2" weight="semiBold" color="#00B562">
                +₹9100
              </Text>
              <Text variant="caption" weight="semiBold">
                Total
              </Text>
            </View>
          </View>

          <View style={styles.revenueSplitBlock}>
            <View style={styles.revenueRow}>
              <Text variant="body2" weight="medium">
                Online Revenue
              </Text>
              <Text variant="h3" weight="bold" color="#001C65">
                ₹5600
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text variant="body2" weight="medium">
                Offline Revenue
              </Text>
              <Text variant="h3" weight="bold" color={COLORS.primary}>
                ₹3500
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Booking Graph */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          BOOKING GRAPH
        </Text>
        <View style={styles.graphContainer}>
          <View style={styles.yAxis}>
            {[16, 14, 12, 10, 8, 6, 4, 2, 0].map(val => (
              <Text key={val} variant="body2" weight="medium" style={styles.yAxisText}>
                {val}
              </Text>
            ))}
          </View>

          <View style={styles.chartArea}>
            {BOOKING_DATA.map((item, index) => {
              const heightPct = (item.value / MAX_BOOKING_Y) * 100;
              return (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${heightPct}%` }]} />
                  </View>
                  <Text variant="caption" weight="medium" style={styles.xLabelDate}>
                    {item.date}
                  </Text>
                  <Text
                    variant="caption"
                    weight="medium"
                    color={COLORS.text.muted}
                    style={styles.xLabelDay}>
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 6. Revenue Graph */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          REVENUE GRAPH
        </Text>
        <View style={styles.revenueGraphContainer}>
          {REVENUE_DATA.map((item, index) => (
            <View key={index} style={styles.revenueGraphRow}>
              <Text variant="body2" weight="semiBold" style={styles.revenueDateLabel}>
                {item.date}
              </Text>
              <View style={[styles.revenueBarTrack, { width: item.fillPct as any }]}>
                <Text
                  variant="caption"
                  weight="semiBold"
                  color={item.isBlue ? COLORS.primary : "#00B562"}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: vs(10),
  },
  editButton: {
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(16),
    paddingVertical: vs(4),
    borderRadius: ms(19),
  },

  // --- UPDATED SELECTION FILTERS ---
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(16),
  },
  filterLabel: {
    width: hs(120), // Exact 120px from Figma
    fontSize: fs(20), // 20px font size for 'Selection'
  },
  filterTabsRow: {
    flex: 1,
    flexDirection: "row",
    gap: hs(10), // 10px gap between tabs
  },
  filterTab: {
    flex: 1,
    height: vs(40), // Exact 40px height from Figma
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column", // Stack icon and text for "Custom" if needed
  },
  filterTabText: {
    textAlign: "center", // Required for "Last week" multiline break
  },
  filterTabActive: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#CBDFFE", // Exact light blue border for active tab
  },
  filterTabInactive: {
    backgroundColor: COLORS.surface.primary, // #F4F7FC
    borderWidth: 1, // Add transparent border to prevent UI shift
    borderColor: "transparent",
  },

  dateRangeText: {
    textAlign: "center",
    marginVertical: vs(12),
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginTop: vs(10),
    marginBottom: vs(12),
  },

  // --- Summary Cards ---
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: hs(12),
    marginBottom: vs(20),
  },
  revenueSummaryCard: {
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  totalBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: hs(6),
  },
  totalNumber: {
    fontSize: fs(18),
  },
  splitBlock: {
    flex: 1,
    gap: vs(6),
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(203, 223, 254, 0.5)",
    paddingHorizontal: hs(10),
    paddingVertical: vs(6),
    borderRadius: ms(10),
  },

  // --- REVENUE DETAILS DONUT CHART ---
  revenueDonutWrapper: {
    width: ms(100),
    height: ms(100),
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(30),
  },
  donutRing: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: ms(4),
  },
  donutRingBase: {
    borderColor: COLORS.primary,
  },
  donutRingOver: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: ms(4),
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
  },
  donutRingDark: {
    borderColor: "#001C65",
    transform: [{ rotate: "45deg" }],
  },
  donutInner: {
    width: ms(92),
    height: ms(92),
    borderRadius: ms(46),
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  revenueSplitBlock: {
    justifyContent: "center",
    gap: vs(12),
  },
  revenueRow: {
    gap: vs(2),
  },

  // --- Booking Graph ---
  graphContainer: {
    flexDirection: "row",
    height: vs(250),
    marginBottom: vs(30),
  },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: hs(10),
    borderRightWidth: 1,
    borderRightColor: COLORS.border.navBar,
    height: vs(200),
  },
  yAxisText: {
    textAlign: "right",
    fontSize: fs(12),
  },
  chartArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: hs(14),
  },
  barColumn: {
    alignItems: "center",
    width: hs(28),
  },
  barTrack: {
    width: "100%",
    height: vs(200),
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: ms(4),
  },
  xLabelDate: {
    marginTop: vs(8),
    fontSize: fs(10),
  },
  xLabelDay: {
    fontSize: fs(10),
  },

  // --- Revenue Graph ---
  revenueGraphContainer: {
    gap: vs(12),
    marginBottom: vs(20),
  },
  revenueGraphRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  revenueDateLabel: {
    width: hs(50),
    fontSize: fs(12),
  },
  revenueBarTrack: {
    height: vs(30),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: hs(10),
  },
});
