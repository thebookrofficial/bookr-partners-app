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
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, SportsTabParamList } from "@/navigation/navigation.types";
import { supabase } from "@/lib/supabase";

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
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<SportsTabParamList, any>>();

  // Extract initial serviceId
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
    serviceId =
      (tabRoute?.params as any)?.serviceId || (tabRoute?.params as any)?.params?.serviceId || "";
  }

  const [timeFilter, setTimeFilter] = useState("Today");
  const [groundFilter, setGroundFilter] = useState("Overall");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Football");

  // Dynamic Venue Resolution State
  const [currentVenueId, setCurrentVenueId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveVenue = async () => {
      setLoading(true);
      try {
        const CATEGORY_DB_MAP: Record<string, string> = {
          Football: "football",
          "Box Cricket": "cricket",
          Pickleball: "pickleball",
        };
        const dbSportType = CATEGORY_DB_MAP[selectedCategory] || selectedCategory;

        const { data: initialVenue } = await supabase
          .from("venues")
          .select("owner_id")
          .eq("id", serviceId)
          .single();
        if (!initialVenue) return;

        const { data: matchedVenue } = await supabase
          .from("venues")
          .select("id, sports_venues!inner(sports_type)")
          .eq("owner_id", initialVenue.owner_id)
          .eq("sports_venues.sports_type", dbSportType)
          .limit(1)
          .maybeSingle();

        setCurrentVenueId(matchedVenue ? matchedVenue.id : "");
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
        <ServiceHeader
          title="Elite Strikers Club"
          subtitle="Dashboard"
          category={selectedCategory}
          onCategoryPress={() => setIsCategoryOpen(!isCategoryOpen)}
        />

        {/* 2. Conditional Rendering for Dashboard Content */}
        {loading ? (
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

            {/* Revenue Details Summary */}
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

            {/* Booking Graph */}
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

            {/* Revenue Graph */}
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
          </>
        )}
        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* --- FIXED OVERLAY DROPDOWN --- */}
      {isCategoryOpen && (
        <View style={styles.dropdownOverlay}>
          {/* Invisible Backdrop (Closes the menu when tapping outside) */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsCategoryOpen(false)}
          />
          {/* The Menu Itself */}
          <View style={styles.dropdownMenu}>
            {["Football", "Box Cricket", "Pickleball"].map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedCategory(cat);
                  setIsCategoryOpen(false);
                }}>
                <Text variant="body2" weight="semiBold">
                  {cat}
                </Text>
                <View style={styles.radioOuter}>
                  {selectedCategory === cat && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  filterSection: { flexDirection: "row", alignItems: "center", marginBottom: vs(16) },
  filterLabel: { width: hs(120), fontSize: fs(20) },
  filterTabsRow: { flex: 1, flexDirection: "row", gap: hs(10) },
  filterTab: {
    flex: 1,
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
    marginRight: hs(30),
  },
  donutRing: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: ms(4),
  },
  donutRingBase: { borderColor: COLORS.primary },
  donutRingOver: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    borderWidth: ms(4),
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
  },
  donutRingDark: { borderColor: "#001C65", transform: [{ rotate: "45deg" }] },
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
  revenueBarTrack: {
    height: vs(30),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: hs(10),
  },

  loader: { marginTop: vs(60) },
  emptyStateText: { textAlign: "center", marginTop: vs(60), color: COLORS.text.muted },

  /* --- FIXED OVERLAY DROPDOWN STYLES --- */
  dropdownOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dropdownMenu: {
    position: "absolute",
    top: vs(55),
    right: hs(12),
    backgroundColor: COLORS.background,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    width: hs(180),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: hs(6),
    gap: vs(6),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(8),
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: COLORS.text.primary,
  },
});
