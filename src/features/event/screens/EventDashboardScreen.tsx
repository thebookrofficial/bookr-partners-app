// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { EventHeader } from "../components/EventHeader";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const TABS = ["Overall", "Day 1", "Day 2", "Day 3"];

// Mock Data
const DASHBOARD_DATA = {
  Overall: {
    entries: { total: 337, regular: 225, premium: 92, vip: 20 },
    revenue: { total: "+₹254,163", regular: "+₹112,275", premium: "+₹91,908", vip: "+₹49,980" },
  },
  "Day 1": {
    entries: { total: 104, regular: 70, premium: 28, vip: 6 },
    revenue: { total: "+₹77,896", regular: "+₹34,930", premium: "+₹27,972", vip: "+₹14,994" },
  },
  "Day 2": {
    entries: { total: 120, regular: 80, premium: 30, vip: 10 },
    revenue: { total: "+₹85,000", regular: "+₹40,000", premium: "+₹30,000", vip: "+₹15,000" },
  },
  "Day 3": {
    entries: { total: 113, regular: 75, premium: 34, vip: 4 },
    revenue: { total: "+₹91,267", regular: "+₹37,345", premium: "+₹33,936", vip: "+₹19,986" },
  },
};

export const EventDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState("Overall");
  const data = DASHBOARD_DATA[activeTab as keyof typeof DASHBOARD_DATA];

  const renderSectionHeader = (title: string) => (
    <Text weight="bold" style={styles.sectionHeader}>
      {title}
    </Text>
  );

  const renderDetailCard = (
    title: string,
    total: string | number,
    totalLabel: string,
    breakdown: { label: string; value: string | number; color?: string }[],
  ) => {
    const isRevenue = title.includes("Revenue");

    return (
      <View style={styles.cardContainer}>
        {renderSectionHeader(title)}
        <View style={styles.detailsRow}>
          <View style={styles.totalBox}>
            <Text weight="semiBold" style={[styles.totalValue, isRevenue && styles.revenueText]}>
              {total}
            </Text>
            <Text weight="semiBold" style={styles.totalLabel}>
              {totalLabel}
            </Text>
          </View>
          <View style={styles.breakdownList}>
            {breakdown.map((item, index) => (
              <View key={index} style={styles.breakdownItem}>
                <Text weight="semiBold" style={styles.breakdownLabel}>
                  {item.label}
                </Text>
                <Text
                  weight="semiBold"
                  style={[styles.breakdownValue, item.color ? { color: item.color } : null]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderOverallGraphs = () => (
    <>
      <View style={styles.graphContainer}>
        {renderSectionHeader("Booking graph")}
        <View style={styles.barGraphWrapper}>
          <View style={styles.yAxis}>
            {["140", "120", "100", "80", "60", "40", "20", "0"].map(val => (
              <Text key={val} style={styles.yAxisText}>
                {val}
              </Text>
            ))}
          </View>
          <View style={styles.barsArea}>
            <View style={styles.barGroup}>
              <Text style={styles.barTopLabel}>104</Text>
              <View style={[styles.bar, styles.barRed, { height: vs(147) }]} />
              <Text style={styles.xAxisDate}>20 Apr</Text>
              <Text style={styles.xAxisDay}>Mon</Text>
            </View>
            <View style={styles.barGroup}>
              <View style={[styles.bar, styles.barBlue, { height: vs(189) }]} />
              <Text style={styles.xAxisDate}>21 Apr</Text>
              <Text style={styles.xAxisDay}>Tue</Text>
            </View>
            <View style={styles.barGroup}>
              <View style={[styles.bar, styles.barBlue, { height: vs(140) }]} />
              <Text style={styles.xAxisDate}>22 Apr</Text>
              <Text style={styles.xAxisDay}>Wed</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.graphContainer}>
        {renderSectionHeader("pass Categories graph")}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotBlue]} />
            <Text weight="bold" style={styles.legendText}>
              Regular
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotYellow]} />
            <Text weight="bold" style={styles.legendText}>
              Premium
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.dotRed]} />
            <Text weight="bold" style={styles.legendText}>
              VIP
            </Text>
          </View>
        </View>
        <View style={styles.barGraphWrapper}>
          <View style={styles.yAxis}>
            {["105", "90", "75", "60", "40", "30", "15", "0"].map(val => (
              <Text key={val} style={styles.yAxisText}>
                {val}
              </Text>
            ))}
          </View>
          <View style={styles.barsArea}>
            <View style={styles.linePlaceholderArea}>
              <View style={[styles.lineDot, styles.dotBlue, { left: hs(50), top: vs(120) }]} />
              <View style={[styles.lineDot, styles.dotBlue, { left: hs(130), top: vs(80) }]} />
              <View style={[styles.lineDot, styles.dotBlue, { left: hs(210), top: vs(140) }]} />
              <Text style={styles.lineValueLabel}>+38</Text>
            </View>
            <View style={styles.xAxisRow}>
              <View style={styles.barGroup}>
                <Text style={styles.xAxisDate}>20 Apr</Text>
                <Text style={styles.xAxisDay}>Mon</Text>
              </View>
              <View style={styles.barGroup}>
                <Text style={styles.xAxisDate}>21 Apr</Text>
                <Text style={styles.xAxisDay}>Tue</Text>
              </View>
              <View style={styles.barGroup}>
                <Text style={styles.xAxisDate}>22 Apr</Text>
                <Text style={styles.xAxisDay}>Wed</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  const renderDayGraphs = () => (
    <View style={styles.graphContainer}>
      {renderSectionHeader("Revenue graph")}
      <View style={styles.horizontalGraphArea}>
        {[
          { label: "Overall Today", value: data.revenue.total, width: hs(294) },
          { label: "Regular Pass", value: data.revenue.regular, width: hs(154) },
          { label: "Premium Pass", value: data.revenue.premium, width: hs(135) },
          { label: "VIP", value: data.revenue.vip, width: hs(89) },
        ].map((item, index) => (
          <View key={index} style={styles.hBarRow}>
            <View style={styles.hBarLabelBox}>
              <Text weight="semiBold" style={styles.hBarLabel}>
                {item.label}
              </Text>
            </View>
            <View style={[styles.hBar, { width: item.width }]}>
              <Text weight="semiBold" style={styles.hBarValue}>
                {item.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <EventHeader
        title="Neon Shadow World Tour 2026"
        subtitle="Dashboard"
        imageSource={USER_PROFILE}
      />

      <PillTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="dark"
        style={styles.tabs}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderDetailCard("Entries Details", data.entries.total, "Total Entries", [
          { label: "Regular Pass", value: data.entries.regular },
          { label: "Premium Pass", value: data.entries.premium },
          { label: "VIP", value: data.entries.vip },
        ])}

        {renderDetailCard("Revenue Details", data.revenue.total, "Total Revenue", [
          { label: "Regular Pass", value: data.revenue.regular, color: "#00B562" },
          { label: "Premium Pass", value: data.revenue.premium, color: "#00B562" },
          { label: "VIP", value: data.revenue.vip, color: "#00B562" },
        ])}

        {activeTab === "Overall" ? renderOverallGraphs() : renderDayGraphs()}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabs: {
    marginVertical: vs(15),
  },
  scrollContent: {
    paddingBottom: vs(100),
  },
  sectionHeader: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "uppercase",
    marginBottom: vs(10),
  },
  cardContainer: {
    marginBottom: vs(20),
    paddingHorizontal: hs(6),
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(25),
  },
  totalBox: {
    flex: 1,
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    height: vs(77),
    justifyContent: "center",
    paddingHorizontal: hs(8),
    gap: vs(4),
  },
  totalValue: {
    fontSize: fs(32),
    lineHeight: fs(30),
  },
  revenueText: {
    color: "#00B562",
  },
  totalLabel: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  breakdownList: {
    width: hs(256),
    gap: vs(10),
  },
  breakdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  breakdownValue: {
    fontSize: fs(20),
    color: COLORS.text.primary,
  },
  graphContainer: {
    marginTop: vs(10),
    paddingHorizontal: hs(6),
    marginBottom: vs(20),
  },
  barGraphWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: vs(10),
  },
  yAxis: {
    width: hs(40),
    borderRightWidth: 1,
    borderRightColor: "#CBDFFE",
    paddingRight: hs(10),
    gap: vs(10),
    alignItems: "center",
  },
  yAxisText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
    fontFamily: "Gilroy-Medium",
  },
  barsArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingRight: hs(20),
  },
  barGroup: {
    alignItems: "center",
    width: hs(50),
  },
  barTopLabel: {
    fontSize: fs(12),
    color: COLORS.danger,
    fontFamily: "Gilroy-SemiBold",
    marginBottom: vs(4),
  },
  bar: {
    width: hs(50),
    borderRadius: ms(3),
  },
  barRed: {
    backgroundColor: COLORS.danger,
  },
  barBlue: {
    backgroundColor: COLORS.primary,
  },
  xAxisDate: {
    fontSize: fs(10),
    color: COLORS.text.primary,
    fontFamily: "Gilroy-Medium",
    marginTop: vs(6),
  },
  xAxisDay: {
    fontSize: fs(12),
    color: COLORS.text.muted,
    fontFamily: "Gilroy-Medium",
  },
  legendRow: {
    flexDirection: "row",
    gap: hs(15),
    marginBottom: vs(10),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  legendDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  dotBlue: {
    backgroundColor: COLORS.primary,
  },
  dotYellow: {
    backgroundColor: "#FFB800",
  },
  dotRed: {
    backgroundColor: COLORS.danger,
  },
  legendText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  linePlaceholderArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: vs(40),
  },
  lineDot: {
    position: "absolute",
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  lineValueLabel: {
    position: "absolute",
    left: hs(120),
    top: vs(60),
    fontSize: fs(12),
    color: "#F59E0B",
    fontFamily: "Gilroy-Medium",
  },
  xAxisRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  horizontalGraphArea: {
    gap: vs(10),
    marginTop: vs(10),
  },
  hBarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hBarLabelBox: {
    width: hs(100),
    paddingHorizontal: hs(10),
  },
  hBarLabel: {
    fontSize: fs(12),
    color: COLORS.text.primary,
  },
  hBar: {
    height: vs(33),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: hs(10),
  },
  hBarValue: {
    fontSize: fs(10),
    color: "#00B562",
  },
});
