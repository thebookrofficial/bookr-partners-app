// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { Calendar, ChevronRight, ChevronDown } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { CustomRangeSheet } from "../components/CustomRangeSheet";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHome } from "../hooks/useStaycationHome";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    { id: "w1", week: "Week 1", dates: "Apr 1- Apr 4", amount: "10400", percentage: 40 },
    {
      id: "w2",
      week: "Week 2",
      dates: "Apr 5- Apr 11",
      amount: "56000",
      percentage: 90,
      isPrimary: true,
      dailyBreakdown: [
        { date: "12 Apr", amount: "10400", percentage: 95 },
        { date: "13 Apr", amount: "5600", percentage: 50 },
        { date: "14 Apr", amount: "6400", percentage: 60 },
        { date: "15 Apr", amount: "4000", percentage: 35 },
        { date: "16 Apr", amount: "8000", percentage: 75 },
        { date: "17 Apr", amount: "10400", percentage: 95 },
        { date: "18 Apr", amount: "11200", percentage: 100 },
      ],
    },
    { id: "w3", week: "Week 2", dates: "Apr 12 - Apr 18", amount: "8000", percentage: 75 },
    { id: "w4", week: "Week 2", dates: "Apr 19 - Apr 25", amount: "10400", percentage: 85 },
    { id: "w5", week: "Week 2", dates: "Apr 26 - Apr 30", amount: "10400", percentage: 70 },
  ],
};

const DonutChart = ({ size = ms(100), strokeWidth = 6 }) => {
  // Paths for segments (simplified as static for now, representing Online vs Offline)
  // Total is 56000. Online 32000 (~57%), Offline 24000 (~43%)
  const onlineAngle = (32000 / 56000) * 360;

  const createArc = (startAngle: number, sweepAngle: number) => {
    const path = Skia.Path.Make();
    path.addArc(
      Skia.XYWHRect(strokeWidth / 2, strokeWidth / 2, size - strokeWidth, size - strokeWidth),
      startAngle - 90,
      sweepAngle,
    );
    return path;
  };

  const onlinePath = createArc(0, onlineAngle);
  const offlinePath = createArc(onlineAngle, 360 - onlineAngle);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={styles.flex1}>
        <Path
          path={onlinePath}
          color="#001C65"
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />
        <Path
          path={offlinePath}
          color="#63A1FD"
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
        />
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.donutOverlay]}>
        <Text variant="body2" weight="bold" color="#00B562" style={styles.revenueAmountText}>
          +₹{MOCK_DATA.totalRevenue}
        </Text>
        <Text variant="body2" color={COLORS.text.primary} style={styles.totalText}>
          Total
        </Text>
      </View>
    </View>
  );
};

export const StaycationDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationDashboard">>();

  // Extract serviceId with fallback from parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "StaycationServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { venue } = useStaycationHome(serviceId);
  const [selection, setSelection] = useState("This Month");
  const [activeTab, setActiveTab] = useState("Farmhouse");
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [isCustomSheetVisible, setIsCustomSheetVisible] = useState(false);
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date(),
  });

  const SELECTION_TABS = ["This Month", "Last Month", "Custom"];

  const toggleWeek = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWeek(expandedWeek === id ? null : id);
  };

  const handleSelectionPress = (tab: string) => {
    if (tab === "Custom") {
      setIsCustomSheetVisible(true);
    } else {
      setSelection(tab);
    }
  };

  const handleApplyCustomRange = (start: Date, end: Date) => {
    setCustomRange({ start, end });
    setSelection("Custom");
  };

  return (
    <ScreenContainer scrollable paddingHorizontal={hs(12)}>
      <StaycationHeader
        title={venue?.name || "Vally view farmhouse"}
        subtitle="Dashboard"
        imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
      />

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
                onPress={() => handleSelectionPress(tab)}
                activeOpacity={0.8}
                style={[styles.selectionTab, isActive && styles.activeSelectionTab]}>
                {isCustom && (
                  <Calendar size={ms(20)} color={isActive ? COLORS.text.inverse : "#8C8C8C"} />
                )}
                <Text
                  variant="body2"
                  weight="semiBold"
                  style={[styles.selectionTabText, isActive && styles.activeSelectionTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <CustomRangeSheet
        visible={isCustomSheetVisible}
        onClose={() => setIsCustomSheetVisible(false)}
        onApply={handleApplyCustomRange}
        initialRange={customRange}
      />

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
            <Text variant="body1" color={COLORS.text.primary} style={styles.totalLabel}>
              Total bookings
            </Text>
          </View>

          <View style={styles.onlineOfflineCol}>
            <View style={styles.badgeBox}>
              <Text variant="body2" color="#001C65" style={styles.badgeText}>
                Online bookings
              </Text>
              <Text variant="body1" weight="bold" color="#001C65">
                {MOCK_DATA.onlineBookings}
              </Text>
            </View>
            <View style={styles.badgeBox}>
              <Text variant="body2" color="#63A1FD" style={styles.badgeText}>
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
          <DonutChart />

          <View style={styles.revenueCol}>
            <View style={styles.revenueItem}>
              <Text variant="body2" color={COLORS.text.primary} style={styles.revenueLabel}>
                Online Revenue
              </Text>
              <Text variant="h2" weight="bold" color="#001C65">
                ₹{MOCK_DATA.onlineRevenue}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text variant="body2" color={COLORS.text.primary} style={styles.revenueLabel}>
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
        <View style={styles.graphList}>
          {MOCK_DATA.weeklyRevenue.map(item => {
            const isExpanded = expandedWeek === item.id;
            return (
              <View key={item.id}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => item.dailyBreakdown && toggleWeek(item.id)}
                  style={styles.graphRow}>
                  <View style={styles.weekLabelBox}>
                    <Text variant="body2" weight="semiBold" color="#8C8C8C" style={styles.weekText}>
                      {item.week}
                    </Text>
                    <Text variant="body2" style={styles.dateRangeText}>
                      {item.dates}
                    </Text>
                  </View>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        { width: hs(item.percentage * 2) },
                        item.isPrimary && styles.primaryBar,
                      ]}>
                      <Text
                        variant="body2"
                        weight="semiBold"
                        color={item.isPrimary ? "#FFFFFF" : "#00B562"}
                        style={styles.barAmount}>
                        +₹{item.amount}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.arrowIcon}>
                    {item.dailyBreakdown ? (
                      isExpanded ? (
                        <ChevronDown size={ms(18)} color={COLORS.text.primary} />
                      ) : (
                        <ChevronRight size={ms(18)} color={COLORS.text.primary} />
                      )
                    ) : (
                      <ChevronRight size={ms(18)} color={COLORS.text.primary} />
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && item.dailyBreakdown && (
                  <View style={styles.dailyList}>
                    {item.dailyBreakdown.map((day, dIdx) => (
                      <View key={dIdx} style={styles.dailyRow}>
                        <View style={styles.dayLabelBox}>
                          <Text
                            variant="body2"
                            weight="semiBold"
                            color={COLORS.text.primary}
                            style={styles.dayText}>
                            {day.date}
                          </Text>
                        </View>
                        <View style={styles.barWrapper}>
                          <View style={[styles.bar, { width: hs(day.percentage * 2) }]}>
                            <Text
                              variant="body2"
                              weight="semiBold"
                              color="#63A1FD"
                              style={styles.barAmount}>
                              +₹{day.amount}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.arrowIcon} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ height: vs(120) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: vs(12),
    height: vs(40),
    gap: hs(10),
  },
  selectionLabel: {
    fontSize: fs(20),
    width: hs(120),
    color: COLORS.text.primary,
  },
  selectionTabs: {
    flex: 1,
    flexDirection: "row",
    gap: hs(10),
    height: "100%",
  },
  selectionTab: {
    flex: 1,
    height: "100%",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  activeSelectionTab: {
    backgroundColor: "#282828",
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  selectionTabText: {
    fontSize: fs(12),
    color: "#8C8C8C",
    textAlign: "center",
  },
  activeSelectionTabText: {
    color: COLORS.text.inverse,
  },
  bookingTabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    marginBottom: vs(16),
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
    marginTop: vs(24),
  },
  sectionTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    marginBottom: vs(12),
    textTransform: "uppercase",
  },
  bookingDetailsCard: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    padding: ms(6),
    flexDirection: "row",
    minHeight: vs(70),
  },
  totalBookingsBox: {
    flex: 1,
    paddingLeft: hs(20),
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: hs(4),
  },
  totalNumber: {
    fontSize: fs(36),
    lineHeight: fs(36),
    color: COLORS.text.primary,
  },
  smallTotal: {
    fontSize: fs(12),
    marginBottom: vs(4),
  },
  totalLabel: {
    fontSize: fs(16),
    marginTop: vs(2),
  },
  onlineOfflineCol: {
    flex: 1.2,
    gap: vs(6),
    justifyContent: "center",
  },
  badgeBox: {
    backgroundColor: "rgba(203, 223, 254, 0.5)",
    paddingVertical: vs(8),
    paddingHorizontal: hs(12),
    borderRadius: ms(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeText: {
    fontSize: fs(14),
  },
  revenueCard: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: ms(12),
    borderRadius: ms(10),
    gap: hs(24),
  },
  donutOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  revenueCol: {
    flex: 1,
    gap: vs(12),
  },
  revenueItem: {
    gap: vs(2),
  },
  revenueLabel: {
    fontSize: fs(14),
  },
  graphList: {
    gap: vs(12),
  },
  graphRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    height: vs(46),
  },
  weekLabelBox: {
    width: hs(70),
    alignItems: "center",
  },
  weekText: {
    fontSize: fs(10),
  },
  dateRangeText: {
    fontSize: fs(8),
    color: COLORS.text.primary,
  },
  barWrapper: {
    flex: 1,
    height: vs(34),
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
  primaryBar: {
    backgroundColor: "#63A1FD",
  },
  barAmount: {
    fontSize: fs(10),
  },
  arrowIcon: {
    width: ms(20),
    alignItems: "center",
  },
  dailyList: {
    marginTop: vs(6),
    paddingLeft: hs(20),
    gap: vs(6),
  },
  dailyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    height: vs(34),
  },
  dayLabelBox: {
    width: hs(50),
    alignItems: "center",
  },
  dayText: {
    fontSize: fs(12),
  },
  flex1: {
    flex: 1,
  },
  revenueAmountText: {
    fontSize: fs(14),
  },
  totalText: {
    fontSize: fs(10),
  },
});
