// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { EventHeader } from "../components/EventHeader";
import { useEventDashboard, DayData } from "../hooks/useEventDashboard";
import { useNavigation, useRoute } from "@react-navigation/native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const EventDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "EventServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { loading, refreshing, eventTitle, dashboardData, error, refresh } =
    useEventDashboard(serviceId);

  const [activeTab, setActiveTab] = useState("Overall");

  // Dynamically set tabs based on available dashboard data
  const TABS = dashboardData ? Object.keys(dashboardData) : ["Overall"];

  // Ensure active tab resets if it somehow becomes invalid
  useEffect(() => {
    if (dashboardData && !dashboardData[activeTab]) {
      setActiveTab("Overall");
    }
  }, [dashboardData, activeTab]);

  const data: DayData | null = dashboardData ? dashboardData[activeTab] : null;

  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !dashboardData || !data) {
    return (
      <View style={styles.root}>
        <ScreenContainer
          scrollable
          backgroundColor={COLORS.background}
          paddingHorizontal={hs(12)}
          refreshing={refreshing}
          onRefresh={refresh}>
          <EventHeader title="Dashboard" subtitle="No Event Found" imageSource={USER_PROFILE} />
          <View style={styles.emptyContainer}>
            <Text variant="body1" color={COLORS.text.muted}>
              {error ? `Error: ${error}` : "No active events found for this venue."}
            </Text>
            <Text variant="caption" color={COLORS.text.muted} style={styles.debugText}>
              Searching Venue ID: {serviceId || "Missing"}
            </Text>
            <TouchableOpacity onPress={() => refresh()} style={styles.retryBtn}>
              <Text weight="bold">TAP TO RETRY</Text>
            </TouchableOpacity>
          </View>
        </ScreenContainer>
      </View>
    );
  }

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

  const renderOverallGraphs = () => {
    // Calculate max entries across all days to scale bars
    const daysDataList = Object.values(dashboardData).filter(d => d.date !== "Overall");
    const maxEntries = Math.max(...daysDataList.map(d => d.totalEntries), 140);

    return (
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
              {daysDataList.map((dayItem, index) => {
                const barHeight =
                  dayItem.totalEntries > 0
                    ? vs(Math.max((dayItem.totalEntries / maxEntries) * 150, 4))
                    : 0;

                return (
                  <View key={index} style={styles.barGroup}>
                    <Text style={styles.barTopLabel}>{dayItem.totalEntries}</Text>
                    <View style={[styles.bar, styles.barBlue, { height: barHeight }]} />
                    <Text style={styles.xAxisDate}>{dayItem.date}</Text>
                    <Text style={styles.xAxisDay}>{dayItem.dayName}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.graphContainer}>
          {renderSectionHeader("pass Categories graph")}
          <View style={styles.legendRow}>
            {dashboardData.Overall.categories.map((cat, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text weight="bold" style={styles.legendText}>
                  {cat.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.barGraphWrapper}>
            <View style={styles.yAxis}>
              {["105", "90", "75", "60", "45", "30", "15", "0"].map(val => (
                <Text key={val} style={styles.yAxisText}>
                  {val}
                </Text>
              ))}
            </View>
            <View style={styles.barsArea}>
              <View style={styles.dotOverlayContainer}>
                {daysDataList.map((dayItem, index) => (
                  <View key={index} style={styles.overlayCol}>
                    {dayItem.categories.map((cat, catIdx) => {
                      // Pseudo-scale height based on max entries (max chart height is vs(150))
                      const dotBottom =
                        dayItem.totalEntries > 0
                          ? vs(Math.max((cat.entries / 140) * 150, 10))
                          : vs(10);

                      return (
                        <View
                          key={catIdx}
                          style={[
                            styles.lineDot,
                            { backgroundColor: cat.color, bottom: dotBottom },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
              <View style={styles.xAxisRow}>
                {daysDataList.map((dayItem, index) => (
                  <View key={index} style={styles.barGroup}>
                    <Text style={styles.xAxisDate}>{dayItem.date}</Text>
                    <Text style={styles.xAxisDay}>{dayItem.dayName}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderDayGraphs = () => {
    // Generate horizontal bars dynamically based on today's revenue breakdown
    const hBars = [
      { label: "Overall Today", value: `+₹${data.totalRevenue}`, width: hs(294) },
      ...data.categories.map(c => ({
        label: c.label,
        value: `+₹${c.revenue}`,
        width: hs(Math.max((c.revenue / data.totalRevenue) * 294, 50)), // Scale based on total
      })),
    ];

    return (
      <View style={styles.graphContainer}>
        {renderSectionHeader("Revenue graph")}
        <View style={styles.horizontalGraphArea}>
          {hBars.map((item, index) => (
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
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={refreshing}
        onRefresh={refresh}>
        <EventHeader
          title={eventTitle || "Neon Shadow World Tour 2026"}
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {renderDetailCard(
            "Entries Details",
            data.totalEntries,
            "Total Entries",
            data.categories.map(c => ({ label: c.label, value: c.entries })),
          )}

          {renderDetailCard(
            "Revenue Details",
            `+₹${data.totalRevenue}`,
            "Total Revenue",
            data.categories.map(c => ({
              label: c.label,
              value: `+₹${c.revenue}`,
              color: "#00B562",
            })),
          )}

          {activeTab === "Overall" ? renderOverallGraphs() : renderDayGraphs()}
        </ScrollView>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(100),
    gap: vs(10),
  },
  debugText: {
    fontSize: fs(10),
    opacity: 0.5,
  },
  retryBtn: {
    marginTop: vs(20),
    padding: ms(10),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(8),
  },
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
  dotOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingRight: hs(20),
    bottom: vs(40), // Offset for x-axis labels
  },
  overlayCol: {
    width: hs(50),
    alignItems: "center",
    height: "100%",
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
