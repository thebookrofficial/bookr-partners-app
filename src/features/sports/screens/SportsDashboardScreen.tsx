// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// Navigation & DB Imports
import { RouteProp, useRoute } from "@react-navigation/native";
import { SportsTabParamList } from "@/navigation/navigation.types";
import { supabase } from "@/lib/supabase";

import { useServiceStore } from "@/store/serviceStore";
import { useSportsDashboard } from "../hooks/useSportsDashboard";

const FilterTab = ({ label, isActive, onPress, icon }: any) => (
  <TouchableOpacity
    style={[styles.filterTab, isActive ? styles.filterTabActive : styles.filterTabInactive]}
    onPress={onPress}
    activeOpacity={0.7}>
    {icon}
    <Text
      variant="caption"
      weight="semiBold"
      color={isActive ? COLORS.text.inverse : COLORS.text.muted}
      style={styles.filterTabText}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const SportsDashboardScreen = () => {
  const route = useRoute<RouteProp<SportsTabParamList, any>>();

  const { selectedCategories, setServiceCategory, activeServiceId } = useServiceStore();

  // 1. Get Service ID (Priority: Route -> Store)
  const serviceId = route.params?.serviceId || activeServiceId;

  // 2. Get Category (Priority: Route -> Store)
  const routeCategory = route.params?.category;
  const storedCategory = selectedCategories[serviceId];
  const selectedCategory = routeCategory || storedCategory || "Football";

  const [timeFilter, setTimeFilter] = useState("Today");
  const [groundFilter, setGroundFilter] = useState("Overall");

  // Sync route param with store if we arrived via a deep link or specific tab click
  useEffect(() => {
    if (routeCategory && routeCategory !== storedCategory) {
      setServiceCategory(serviceId, routeCategory);
    }
  }, [routeCategory, serviceId, storedCategory, setServiceCategory]);

  // Dynamic Venue Resolution State
  const [currentVenueId, setCurrentVenueId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const {
    metrics,
    grounds,
    loading: dataLoading,
  } = useSportsDashboard(currentVenueId, timeFilter, groundFilter);

  const { activeVenueName } = useServiceStore();

  useEffect(() => {
    const resolveVenue = async () => {
      setLoading(true);
      try {
        const CATEGORY_DB_MAP: Record<string, string> = {
          Football: "football",
          "Box Cricket": "box_cricket",
          Pickleball: "pickleball",
        };
        const dbSportType = CATEGORY_DB_MAP[selectedCategory] || selectedCategory;

        const { data: initialVenue } = await supabase
          .from("venues")
          .select("id, owner_id, sports_venues(sports_type)")
          .eq("id", serviceId)
          .single();
        if (!initialVenue) return;

        // Check if the initial venue itself matches the sport type
        const initialSportType = initialVenue.sports_venues?.[0]?.sports_type;
        let finalVenueId = "";

        if (initialSportType === dbSportType) {
          finalVenueId = initialVenue.id;
        } else {
          const { data: matchedVenue } = await supabase
            .from("venues")
            .select("id, sports_venues!inner(sports_type)")
            .eq("owner_id", initialVenue.owner_id)
            .eq("sports_venues.sports_type", dbSportType)
            .limit(1)
            .maybeSingle();

          if (matchedVenue) finalVenueId = matchedVenue.id;
        }

        setCurrentVenueId(finalVenueId);
      } catch (err) {
        console.error("Dashboard resolution error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (serviceId) resolveVenue();
  }, [serviceId, selectedCategory]);

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 1. Header */}
        <ServiceHeader title={activeVenueName} subtitle="Dashboard" />

        {/* 2. Conditional Rendering for Dashboard Content */}
        {loading || dataLoading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : !currentVenueId ? (
          <Text style={styles.emptyStateText}>
            No {selectedCategory} facility setup for this club.
          </Text>
        ) : (
          <>
            {/* Selection Filters */}
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
              {metrics.dateRangeLabel}
            </Text>

            <View style={styles.filterSection}>
              <Text variant="body1" weight="bold" style={styles.filterLabel}>
                Ground
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.groundFilterScroll}>
                <FilterTab
                  label="Overall"
                  isActive={groundFilter === "Overall"}
                  onPress={() => setGroundFilter("Overall")}
                />
                {grounds.map(ground => (
                  <FilterTab
                    key={ground.id}
                    label={ground.name}
                    isActive={groundFilter === ground.name}
                    onPress={() => setGroundFilter(ground.name)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Booking Details Summary */}
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              BOOKING DETAILS
            </Text>
            <View style={styles.summaryCard}>
              <View style={styles.totalBlock}>
                <Text variant="body1" weight="medium">
                  Total bookings
                </Text>
                <Text variant="body1" weight="medium" style={styles.totalNumber}>
                  {metrics.totalBookings}
                </Text>
              </View>
              <View style={styles.splitBlock}>
                <View style={styles.splitRow}>
                  <Text variant="body2" weight="medium" color={COLORS.text.primary}>
                    Online bookings
                  </Text>
                  <Text variant="body1" weight="medium" color={COLORS.primary}>
                    {metrics.onlineBookings}
                  </Text>
                </View>
                <View style={styles.splitRow}>
                  <Text variant="body2" weight="medium" color={COLORS.text.primary}>
                    Offline bookings
                  </Text>
                  <Text variant="body1" weight="medium" color={COLORS.danger}>
                    {metrics.offlineBookings}
                  </Text>
                </View>
              </View>
            </View>

            {/* Revenue Details Summary */}
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              GROSS PROFIT DETAILS
            </Text>
            <View style={styles.onlineRevenueCard}>
              <View style={styles.revenueDonutWrapper}>
                <View style={[styles.donutRing, styles.donutRingBase]} />
                <View style={[styles.donutRing, styles.donutRingOver, styles.donutRingOnline]} />
                <View style={styles.donutInner}>
                  <Text variant="body2" weight="semiBold" color="#00B562">
                    +₹{(metrics.onlineRevenue + metrics.offlineRevenue).toLocaleString("en-IN")}
                  </Text>
                  <Text variant="caption" weight="semiBold">
                    Total
                  </Text>
                </View>
              </View>

              <View style={styles.revenueSplitBlock}>
                <View style={styles.revenueRow}>
                  <Text variant="body2" weight="bold" color={COLORS.text.primary}>
                    Online Collections
                  </Text>
                  <Text variant="body1" weight="bold" color={COLORS.primary}>
                    ₹{metrics.onlineRevenue.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.revenueRow}>
                  <Text variant="body2" weight="bold" color={COLORS.text.primary}>
                    Offline Collections
                  </Text>
                  <Text variant="body1" weight="bold" color={COLORS.danger}>
                    ₹{metrics.offlineRevenue.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Booking Graph */}
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              BOOKING GRAPH
            </Text>
            <View style={styles.graphContainer}>
              <View style={styles.yAxis}>
                {Array.from({ length: 9 }, (_, i) =>
                  Math.round((metrics.maxBookingValue / 8) * (8 - i)),
                ).map((val, idx) => (
                  <Text key={idx} variant="body2" weight="medium" style={styles.yAxisText}>
                    {val}
                  </Text>
                ))}
              </View>
              <View style={styles.chartArea}>
                {metrics.bookingGraphData.map((item, index) => {
                  const heightPct = (item.value / (metrics.maxBookingValue || 1)) * 100;
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

            {/* Revenue Graph */}
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              REVENUE GRAPH
            </Text>
            <View style={styles.revenueGraphContainer}>
              {metrics.revenueGraphData.map((item, index) => (
                <View key={index} style={styles.revenueGraphRow}>
                  <Text variant="body2" weight="semiBold" style={styles.revenueDateLabel}>
                    {item.date}
                  </Text>
                  <View style={styles.revenueBarContainer}>
                    <View style={[styles.revenueBarTrack, { width: item.fillPct as any }]}>
                      <Text
                        variant="caption"
                        weight="semiBold"
                        color={item.isBlue ? COLORS.primary : "#00B562"}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: vs(120) }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  filterSection: { flexDirection: "row", alignItems: "center", marginBottom: vs(16) },
  filterLabel: { width: hs(120), fontSize: fs(20) },
  filterTabsRow: { flex: 1, flexDirection: "row", gap: hs(10) },
  groundFilterScroll: { gap: hs(10), paddingRight: hs(20) },
  filterTab: {
    minWidth: hs(60),
    height: vs(40),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  filterTabText: { textAlign: "center" },
  filterTabActive: { backgroundColor: "#282828", borderWidth: 1, borderColor: "#CBDFFE" },
  filterTabInactive: {
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: "transparent",
  },
  dateRangeText: { textAlign: "center", marginVertical: vs(12) },
  sectionTitle: { textTransform: "uppercase", marginTop: vs(10), marginBottom: vs(12) },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: hs(12),
    marginBottom: vs(20),
  },
  onlineRevenueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: hs(12),
    marginBottom: vs(20),
  },
  revenueSummaryCard: { backgroundColor: "transparent", justifyContent: "center" },
  totalBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: hs(6),
  },
  totalNumber: { fontSize: fs(18) },
  splitBlock: { flex: 1, gap: vs(6) },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(203, 223, 254, 0.5)",
    paddingHorizontal: hs(10),
    paddingVertical: vs(6),
    borderRadius: ms(10),
  },
  revenueDonutWrapper: {
    width: ms(100),
    height: ms(100),
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(20),
    marginLeft: hs(10),
  },
  donutRing: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: ms(4),
  },
  donutRingBase: { borderColor: COLORS.danger },
  donutRingOver: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: ms(4),
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
  },
  donutRingOnline: { borderColor: COLORS.primary, transform: [{ rotate: "45deg" }] },
  donutInner: {
    width: ms(92),
    height: ms(92),
    borderRadius: ms(46),
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  revenueSplitBlock: { justifyContent: "center", gap: vs(12) },
  revenueRow: { gap: vs(2) },
  graphContainer: { flexDirection: "row", height: vs(250), marginBottom: vs(30) },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: hs(10),
    borderRightWidth: 1,
    borderRightColor: COLORS.border.navBar,
    height: vs(200),
  },
  yAxisText: { textAlign: "right", fontSize: fs(12) },
  chartArea: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: hs(14),
  },
  barColumn: { alignItems: "center", width: hs(28) },
  barTrack: { width: "100%", height: vs(200), justifyContent: "flex-end" },
  barFill: { width: "100%", backgroundColor: COLORS.primary, borderRadius: ms(4) },
  xLabelDate: { marginTop: vs(8), fontSize: fs(10) },
  xLabelDay: { fontSize: fs(10) },
  revenueGraphContainer: { gap: vs(12), marginBottom: vs(20) },
  revenueGraphRow: { flexDirection: "row", alignItems: "center" },
  revenueDateLabel: { width: hs(50), fontSize: fs(12) },
  revenueBarContainer: { flex: 1 },
  revenueBarTrack: {
    height: vs(30),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: hs(10),
    minWidth: hs(40),
  },

  loader: { marginTop: vs(60) },
  emptyStateText: { textAlign: "center", marginTop: vs(60), color: COLORS.text.muted },
});
