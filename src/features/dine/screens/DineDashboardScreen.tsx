// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { Calendar as CalendarIcon } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { DineTabParamList } from "@/navigation/navigation.types";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { RevenueBar } from "../components/RevenueBar";
import { WeekExpandableRow } from "../components/WeekExpandableRow";
import { useDineDashboard, DashboardTab } from "../hooks/useDineDashboard";
import { DineFilterBottomSheet } from "../components/DineFilterBottomSheet";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const DineDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<DineTabParamList, "DineDashboard">>();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "DineServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { loading, activeTab, setActiveTab, revenueData, venue, setCustomRange, refresh } =
    useDineDashboard(serviceId);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleTabPress = (tab: DashboardTab) => {
    if (tab === "Custom") {
      setIsFilterSheetOpen(true);
    }
    setActiveTab(tab);
  };

  const TABS: DashboardTab[] = ["Today", "Last week", "This Month", "This Year", "Custom"];

  // Early return only for absolute initial load
  if (loading && !revenueData) {
    return (
      <View style={[styles.root, styles.loadingFull]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}>
        {/* 1. Header */}
        <ServiceHeader
          title={venue?.name || "Hotel tikka lab"}
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />

        {/* 2. Period Tabs */}
        <View style={styles.tabContainer}>
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            const isCustom = tab === "Custom";
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => handleTabPress(tab)}
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

        {revenueData ? (
          <>
            {/* 3. Period Display */}
            <Text variant="body1" weight="bold" style={styles.periodLabel}>
              {revenueData.periodLabel || "Select Period"}
            </Text>

            {/* 4. Total Payout Summary */}
            <View style={styles.summaryCard}>
              <Text variant="h1" weight="bold" style={styles.totalAmount}>
                {revenueData.totalPayout || "+₹0"}
              </Text>
              <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
                {revenueData.payoutLabel || "Total Payout"}
              </Text>
            </View>

            {/* 5. Revenue Graph Section */}
            <View style={styles.graphSection}>
              <Text variant="body1" weight="bold" style={styles.graphTitle}>
                {revenueData.graphTitle ? revenueData.graphTitle.toUpperCase() : "REVENUE"}
              </Text>

              <View style={styles.graphContainer}>
                {activeTab === "This Month"
                  ? (revenueData.weeks || []).map((week: any) => (
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
                  : (revenueData.graphData || []).map((item: any, index: number) => (
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
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="body2" color={COLORS.text.muted}>
              No revenue data available for this period.
            </Text>
          </View>
        )}
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      <DineFilterBottomSheet
        visible={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        currentFilter={activeTab === "Custom" ? "custom" : "all"}
        onApply={(_f, range) => {
          if (range) {
            setCustomRange(range);
            setActiveTab("Custom");
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loadingFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    paddingVertical: vs(50),
    alignItems: "center",
  },
  tabContainer: {
    flexDirection: "row",
    gap: hs(6),
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
    fontSize: ms(11),
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
