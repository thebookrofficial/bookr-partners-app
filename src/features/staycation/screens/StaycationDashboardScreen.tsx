// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
} from "react-native";
import { DashboardSkeleton, Text } from "@/components/ui";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { StaycationHeader } from "../components/StaycationHeader";

import { Calendar, X, ChevronDown } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { CustomDatePickerModal as DatePicker } from "@/components/ui/CustomDatePickerModal";
import Svg, { Path } from "react-native-svg";

// Navigation & DB Imports
import { RouteProp, useRoute } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";

import { useServiceStore } from "@/store/serviceStore";
import { useStaycationDashboard } from "../hooks/useStaycationDashboard";

const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
  const angleInRadians = (Math.PI * (180 - angleInDegrees)) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy - r * Math.sin(angleInRadians),
  };
};

const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  return ["M", start.x, start.y, "A", r, r, 0, 0, 1, end.x, end.y].join(" ");
};

export const StaycationDashboardScreen = () => {
  const route = useRoute<RouteProp<StaycationTabParamList, any>>();

  const { selectedCategories, setServiceCategory, activeServiceId } = useServiceStore();

  // 1. Get Service ID (Priority: Route -> Store)
  const serviceId = route.params?.serviceId || activeServiceId;

  // 2. Get Category (Priority: Route -> Store)
  const routeCategory = route.params?.category;
  const storedCategory = selectedCategories[serviceId];

  const [timeFilter, setTimeFilter] = useState("Last week");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Custom Date Range State
  const [customRange, setCustomRange] = useState({ start: new Date(), end: new Date() });
  const [isCustomModalVisible, setIsCustomModalVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStart, setTempStart] = useState(new Date());
  const [tempEnd, setTempEnd] = useState(new Date());

  const handleApplyCustomRange = () => {
    setCustomRange({ start: tempStart, end: tempEnd });
    setTimeFilter("Custom");
    setIsCustomModalVisible(false);
  };

  // Sync route param with store if we arrived via a deep link or specific tab click
  useEffect(() => {
    if (routeCategory && routeCategory !== storedCategory) {
      setServiceCategory(serviceId, routeCategory);
    }
  }, [routeCategory, serviceId, storedCategory, setServiceCategory]);

  const { activeVenueName, activeStaycationVenueId } = useServiceStore();
  const resolvedVenueId = activeStaycationVenueId || serviceId;

  const {
    isLoading: isDashboardLoading,
    stats: metrics,
    refetch,
  } = useStaycationDashboard(resolvedVenueId, timeFilter, "All Rooms", customRange);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // 6. Revenue Gauge Math
  const gaugeSize = ms(140);
  const strokeWidth = ms(24);
  const gaugeRadius = (gaugeSize - strokeWidth) / 2;
  const capAngle = (strokeWidth / 2 / gaugeRadius) * (180 / Math.PI);
  const gapAngle = (ms(6) / gaugeRadius) * (180 / Math.PI);
  const availableAngle = Math.max(0, 180 - 4 * capAngle - gapAngle);

  const totalRev = metrics.onlineRevenue + metrics.offlineRevenue;
  const onlinePct = totalRev === 0 ? 0.5 : metrics.onlineRevenue / totalRev;

  const blueAngle = availableAngle * onlinePct;
  const redAngle = availableAngle * (1 - onlinePct);

  const blueStart = capAngle;
  const blueEnd = blueStart + blueAngle;

  const redStart = blueEnd + 2 * capAngle + gapAngle;
  const redEnd = redStart + redAngle;

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* 1. Header */}
        <StaycationHeader title={activeVenueName} subtitle="Dashboard" />

        {/* 2. Conditional Rendering for Dashboard Content */}
        {isDashboardLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Selection Row */}
            <View style={styles.selectionRow}>
              <Text variant="h2" weight="bold" color="#000">
                Selection
              </Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                activeOpacity={0.7}
                onPress={() => setIsDropdownOpen(true)}>
                <Text variant="body1" weight="medium" color="#FFF">
                  {timeFilter}
                </Text>
                <ChevronDown size={ms(18)} color="#FFF" style={{ marginLeft: hs(8) }} />
              </TouchableOpacity>
            </View>

            {/* Dropdown Modal */}
            <Modal visible={isDropdownOpen} transparent animationType="fade">
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setIsDropdownOpen(false)}>
                <View style={styles.dropdownContent}>
                  {["Yesterday", "Last week", "Last Month", "Custom"].map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setIsDropdownOpen(false);
                        if (opt === "Custom") {
                          setTempStart(customRange.start);
                          setTempEnd(customRange.end);
                          setIsCustomModalVisible(true);
                        } else {
                          setTimeFilter(opt);
                        }
                      }}>
                      <Text
                        variant="body1"
                        weight="semiBold"
                        color={timeFilter === opt ? COLORS.primary : "#000"}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>

            <Text variant="h2" weight="medium" style={styles.dateRangeText}>
              {metrics.dateRangeLabel}
            </Text>

            {/* Booking Details Summary */}
            <Text variant="h2" weight="bold" style={styles.sectionTitle}>
              Bookings
            </Text>
            <View style={styles.bookingsContainer}>
              <View style={styles.bookingsLeftCard}>
                <Text variant="h1" weight="bold" color="#000" style={{ fontSize: fs(36) }}>
                  {metrics.totalBookings}
                </Text>
                <Text variant="caption" weight="medium" color={COLORS.text.secondary}>
                  Total bookings
                </Text>
              </View>
              <View style={styles.bookingsRightColumn}>
                <View style={styles.bookingMiniCard}>
                  <Text variant="h3" weight="bold" color={COLORS.primary}>
                    {metrics.onlineBookings}
                  </Text>
                  <Text variant="caption" weight="medium" color={COLORS.text.secondary}>
                    Online
                  </Text>
                </View>
                <View style={styles.bookingMiniCard}>
                  <Text variant="h3" weight="bold" color={COLORS.danger}>
                    {metrics.offlineBookings}
                  </Text>
                  <Text variant="caption" weight="medium" color={COLORS.text.secondary}>
                    Offline
                  </Text>
                </View>
              </View>
            </View>

            {/* Revenue Details Summary */}
            <Text variant="h2" weight="bold" style={styles.sectionTitle}>
              Revenue
            </Text>
            <View style={styles.bookingsContainer}>
              <View style={styles.revenueDonutCard}>
                <View style={styles.revenueDonutContainer}>
                  <Svg width={gaugeSize} height={gaugeSize / 2 + ms(5)}>
                    <Path
                      d={describeArc(gaugeSize / 2, gaugeSize / 2, gaugeRadius, blueStart, blueEnd)}
                      stroke={COLORS.primary}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <Path
                      d={describeArc(gaugeSize / 2, gaugeSize / 2, gaugeRadius, redStart, redEnd)}
                      stroke={COLORS.danger}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                  <View style={styles.revenueDonutTextContainer}>
                    <Text variant="body1" weight="bold" color="#000">
                      +₹{totalRev.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.revenueRightColumn}>
                <View style={styles.revenueMiniCard}>
                  <Text variant="caption" weight="medium" color={COLORS.text.secondary}>
                    Online{" "}
                    <Text variant="caption" weight="semiBold" color={COLORS.text.secondary}>
                      Revenue
                    </Text>
                  </Text>
                  <Text variant="h3" weight="bold" color={COLORS.primary}>
                    ₹{metrics.onlineRevenue.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.revenueMiniCard}>
                  <Text variant="caption" weight="medium" color={COLORS.text.secondary}>
                    Offline{" "}
                    <Text variant="caption" weight="semiBold" color={COLORS.text.secondary}>
                      Revenue
                    </Text>
                  </Text>
                  <Text variant="h3" weight="bold" color={COLORS.danger}>
                    ₹{metrics.offlineRevenue.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Booking Graph */}
            <Text variant="h2" weight="bold" style={styles.sectionTitle}>
              Booking graph
            </Text>
            <View style={styles.graphContainer}>
              <View style={styles.yAxis}>
                {Array.from(
                  new Set(
                    Array.from({ length: 9 }, (_, i) =>
                      Math.round((Math.max(metrics.maxBookingValue, 5) / 8) * (8 - i)),
                    ),
                  ),
                ).map((val, idx) => (
                  <Text key={idx} variant="caption" weight="medium" style={styles.yAxisText}>
                    {val}
                  </Text>
                ))}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartArea}>
                {metrics.bookingGraphData.map((item: any, index: number) => {
                  const effectiveMax = Math.max(metrics.maxBookingValue, 5);
                  const heightPct = (item.value / effectiveMax) * 100;
                  const isMax = item.value === metrics.maxBookingValue && item.value > 0;
                  return (
                    <View key={index} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${item.value === 0 ? 0 : Math.max(heightPct, 4)}%` },
                            !isMax && styles.barFillLight,
                          ]}
                        />
                      </View>
                      <Text variant="caption" weight="bold" color="#000" style={styles.xLabelDate}>
                        {item.date.split(" ")[0]}
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
              </ScrollView>
            </View>

            {/* Revenue Graph */}
            <Text variant="h2" weight="bold" style={styles.sectionTitle}>
              Revenue graph
            </Text>
            <View style={styles.revenueGraphContainer}>
              {metrics.revenueGraphData.length > 0 ? (
                metrics.revenueGraphData.map((item: any, index: number) => {
                  const isMax = item.fillPct === "100%";
                  return (
                    <View key={index} style={styles.revenueGraphRow}>
                      <Text
                        variant="caption"
                        weight="bold"
                        color="#000"
                        style={styles.revenueDateLabel}>
                        {item.date}
                      </Text>
                      <View style={styles.revenueBarContainer}>
                        <View
                          style={[
                            styles.revenueBarTrack,
                            { width: item.fillPct as any },
                            isMax && styles.revenueBarTrackMax,
                          ]}>
                          <Text
                            variant="caption"
                            weight="bold"
                            color={isMax ? COLORS.primary : "#000"}>
                            {item.value}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyStateText}>No revenue data available for this range.</Text>
              )}
            </View>
          </>
        )}
        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* Custom Date Selection Modal */}
      <Modal
        visible={isCustomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustomModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold">
                Custom Range
              </Text>
              <TouchableOpacity onPress={() => setIsCustomModalVisible(false)}>
                <X size={ms(24)} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text variant="body2" weight="medium" style={styles.inputLabel}>
                From
              </Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                <Text>{tempStart.toLocaleDateString("en-GB")}</Text>
                <Calendar size={ms(18)} color={COLORS.primary} />
              </TouchableOpacity>

              <Text variant="body2" weight="medium" style={styles.inputLabel}>
                To
              </Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                <Text>{tempEnd.toLocaleDateString("en-GB")}</Text>
                <Calendar size={ms(18)} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.applyButton} onPress={handleApplyCustomRange}>
                <Text variant="body1" weight="bold" color={COLORS.text.inverse}>
                  Apply Filter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <DatePicker
          isVisible={showStartPicker}
          onClose={() => setShowStartPicker(false)}
          minDate={new Date(2000, 0, 1)}
          selectedDate={tempStart}
          onSelectDate={date => {
            setShowStartPicker(false);
            setTempStart(date);
          }}
          useModal={false}
        />
        <DatePicker
          isVisible={showEndPicker}
          onClose={() => setShowEndPicker(false)}
          minDate={new Date(2000, 0, 1)}
          selectedDate={tempEnd}
          onSelectDate={date => {
            setShowEndPicker(false);
            setTempEnd(date);
          }}
          useModal={false}
        />
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },

  // Selection
  selectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(24),
  },
  dropdownButton: {
    flexDirection: "row",
    backgroundColor: "#222",
    paddingHorizontal: hs(16),
    paddingVertical: vs(8),
    borderRadius: ms(8),
    alignItems: "center",
  },
  dropdownContent: {
    backgroundColor: "#FFF",
    borderRadius: ms(12),
    padding: ms(8),
    width: hs(160),
    alignSelf: "flex-end",
    marginTop: vs(120),
    marginRight: hs(20),
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownOption: { paddingVertical: vs(12), paddingHorizontal: hs(12) },

  // Ground
  groundSection: { marginBottom: vs(24) },
  groundFilterScroll: { gap: hs(10), paddingRight: hs(20) },
  groundPill: {
    paddingHorizontal: hs(24),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    backgroundColor: "#F4F7FC",
  },
  groundPillActive: { backgroundColor: "#63A1FD" },

  dateRangeText: { textAlign: "center", marginBottom: vs(24), color: "#555" },
  sectionTitle: { marginBottom: vs(16), color: "#000" },

  // Bookings
  bookingsContainer: {
    flexDirection: "row",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(16),
    padding: ms(16),
    marginBottom: vs(24),
    gap: hs(12),
  },
  bookingsLeftCard: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: hs(8),
  },
  bookingsRightColumn: { flex: 1, flexDirection: "row", gap: hs(8) },
  bookingMiniCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: ms(12),
    paddingVertical: vs(16),
    alignItems: "center",
    justifyContent: "center",
  },

  // Revenue
  revenueDonutCard: { flex: 1, justifyContent: "center", alignItems: "center" },
  revenueRightColumn: { flex: 1, gap: vs(8) },
  revenueMiniCard: {
    backgroundColor: "#FFF",
    borderRadius: ms(12),
    paddingVertical: vs(12),
    paddingHorizontal: hs(12),
    justifyContent: "center",
  },

  revenueDonutContainer: {
    width: ms(140),
    height: ms(75),
    position: "relative",
    alignItems: "center",
  },
  revenueDonutTextContainer: {
    position: "absolute",
    bottom: vs(0),
    width: "100%",
    alignItems: "center",
  },

  // Booking Graph
  graphContainer: { flexDirection: "row", height: vs(280), marginBottom: vs(32) },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: hs(10),
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    height: vs(280),
    paddingBottom: vs(10),
  },
  yAxisText: { textAlign: "right", fontSize: fs(10), minWidth: hs(24), color: "#888" },
  chartArea: {
    paddingLeft: hs(14),
    paddingRight: hs(20),
    flexDirection: "row",
    gap: hs(16),
    alignItems: "flex-end",
    height: vs(280),
  },
  barColumn: { alignItems: "center", width: hs(36) },
  barTrack: { width: "100%", height: vs(280), justifyContent: "flex-end" },
  barFill: { width: "100%", backgroundColor: COLORS.primary, borderRadius: ms(10) },
  barFillLight: { backgroundColor: "#CBDFFE" },
  xLabelDate: { marginTop: vs(8), fontSize: fs(10) },
  xLabelDay: { fontSize: fs(10) },

  // Revenue Graph
  revenueGraphContainer: { gap: vs(16), marginBottom: vs(20) },
  revenueGraphRow: { flexDirection: "row", alignItems: "center" },
  revenueDateLabel: { width: hs(45), fontSize: fs(10) },
  revenueBarContainer: { flex: 1 },
  revenueBarTrack: {
    height: vs(36),
    backgroundColor: "#EEF4FF",
    borderRadius: ms(18),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: hs(16),
    minWidth: hs(60),
  },
  revenueBarTrackMax: {
    backgroundColor: "#E6F0FF",
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: hs(20),
  },
  modalContainer: {
    width: "100%",
    backgroundColor: COLORS.background,
    borderRadius: ms(20),
    padding: hs(20),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(20),
  },
  modalContent: { gap: vs(12) },
  inputLabel: { color: COLORS.text.muted },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    padding: hs(12),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: vs(14),
    borderRadius: ms(10),
    alignItems: "center",
    marginTop: vs(10),
  },

  loader: { marginTop: vs(60) },
  emptyStateText: { textAlign: "center", marginTop: vs(60), color: COLORS.text.muted },
});
