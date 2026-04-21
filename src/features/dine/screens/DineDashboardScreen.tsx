// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { Calendar as CalendarIcon } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { DineTabParamList } from "@/navigation/navigation.types";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { RevenueBar } from "../components/RevenueBar";
import { WeekExpandableRow } from "../components/WeekExpandableRow";
import { useDineDashboard, DashboardTab } from "../hooks/useDineDashboard";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const DineDashboardScreen = () => {
  const route = useRoute<RouteProp<DineTabParamList, "DineDashboard">>();
  const { serviceId } = route.params;

  const { loading, activeTab, setActiveTab, revenueData } = useDineDashboard(serviceId);

  const TABS: DashboardTab[] = ["Today", "Last week", "This Month", "Custom"];

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        {/* 1. Header */}
        <ServiceHeader title="Hotel tikka lab" category="Restaurant" imageSource={USER_PROFILE} />

        {/* 2. Period Tabs */}
        <View style={styles.tabContainer}>
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            const isCustom = tab === "Custom";
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive && styles.activeTab, isCustom && styles.customTab]}>
                {isCustom && (
                  <CalendarIcon size={ms(16)} color={isActive ? "#FFFFFF" : "#8C8C8C"} />
                )}
                <Text
                  variant="body2"
                  weight="semiBold"
                  style={[styles.tabText, isActive && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* 3. Period Display */}
            <Text variant="body1" weight="bold" style={styles.periodLabel}>
              {revenueData.periodLabel}
            </Text>

            {/* 4. Total Payout Summary */}
            <View style={styles.summaryCard}>
              <Text variant="h1" weight="bold" style={styles.totalAmount}>
                {revenueData.totalPayout}
              </Text>
              <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
                {revenueData.payoutLabel}
              </Text>
            </View>

            {/* 5. Revenue Graph Section */}
            <View style={styles.graphSection}>
              <Text variant="body1" weight="bold" style={styles.graphTitle}>
                {revenueData.graphTitle.toUpperCase()}
              </Text>

              <View style={styles.graphContainer}>
                {activeTab === "This Month"
                  ? revenueData.weeks.map((week: any) => (
                      <WeekExpandableRow
                        key={week.id}
                        label={week.label}
                        dateRange={week.dateRange}
                        amount={week.amount}
                        percentage={week.percentage}
                        isActive={week.active}
                        details={week.details}
                      />
                    ))
                  : revenueData.graphData.map((item: any, index: number) => (
                      <RevenueBar
                        key={index}
                        label={item.label}
                        subLabel={item.subLabel}
                        amount={item.amount}
                        percentage={item.percentage}
                        isActive={item.active}
                      />
                    ))}
              </View>
            </View>
          </>
        )}
        <View style={{ height: vs(100) }} />
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  tabContainer: {
    flexDirection: "row",
    gap: hs(10),
    marginVertical: vs(20),
    width: "100%",
    justifyContent: "space-between",
  },
  tab: {
    flex: 1,
    height: vs(40),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: hs(4),
  },
  activeTab: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  customTab: {
    paddingHorizontal: hs(8),
  },
  tabText: {
    fontSize: ms(12),
    color: "#8C8C8C",
    textAlign: "center",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    height: vs(300),
    justifyContent: "center",
    alignItems: "center",
  },
  periodLabel: {
    fontSize: ms(16),
    textAlign: "center",
    marginBottom: vs(15),
  },
  summaryCard: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: vs(20),
  },
  totalAmount: {
    fontSize: ms(32),
    color: "#00B562",
    lineHeight: ms(38),
  },
  graphSection: {
    width: "100%",
  },
  graphTitle: {
    fontSize: ms(16),
    marginBottom: vs(15),
  },
  graphContainer: {
    width: "100%",
  },
});
