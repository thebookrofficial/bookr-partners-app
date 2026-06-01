// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { Calendar, ChevronRight, ChevronDown } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { CustomRangeSheet } from "../components/CustomRangeSheet";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHome } from "../hooks/useStaycationHome";
import { useStaycationDashboard } from "../hooks/useStaycationDashboard";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

const DonutChart = ({ size = ms(100), strokeWidth = 6, onlineRevenue, totalRevenue }: any) => {
  const onlineRevNum = parseFloat(onlineRevenue) || 0;
  const totalRevNum = parseFloat(totalRevenue) || 0;

  const onlineAngle = totalRevNum > 0 ? (onlineRevNum / totalRevNum) * 360 : 0;

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
        {totalRevNum > 0 ? (
          <>
            <Path
              path={onlinePath}
              color={COLORS.primary}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
            />
            <Path
              path={offlinePath}
              color={COLORS.danger}
              style="stroke"
              strokeWidth={strokeWidth}
              strokeCap="round"
            />
          </>
        ) : (
          <Path
            path={createArc(0, 360)}
            color="#F4F7FC"
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
          />
        )}
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.donutOverlay]}>
        <Text variant="body2" weight="bold" color="#00B562" style={styles.revenueAmountText}>
          +₹{totalRevNum.toLocaleString("en-IN")}
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

  const { activeVenue: venue } = useStaycationHome(serviceId);

  const [selection, setSelection] = useState("This Month");
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [isCustomSheetVisible, setIsCustomSheetVisible] = useState(false);

  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    if (selection === "This Month") {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    } else if (selection === "Last Month") {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    }
    return customRange;
  }, [selection, customRange]);

  const SELECTION_TABS = ["This Month", "Last Month", "Custom"];

  const { isLoading, stats } = useStaycationDashboard(
    serviceId || "",
    dateRange.start,
    dateRange.end,
    "All Rooms",
  );

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
    setIsCustomSheetVisible(false);
  };

  return (
    <ScreenContainer scrollable paddingHorizontal={hs(12)}>
      <StaycationHeader
        title={venue?.name || "Staycation Property"}
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

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* Booking Details Section */}
          <View style={styles.sectionContainer}>
            <Text variant="body1" weight="bold" style={styles.sectionTitle}>
              BOOKING DETAILS
            </Text>
            <View style={styles.bookingDetailsCard}>
              <View style={styles.totalBookingsBox}>
                <View style={styles.totalRow}>
                  <Text variant="h1" weight="bold" style={styles.totalNumber}>
                    {stats.totalBookings}
                  </Text>
                  <Text variant="body2" weight="semiBold" color="#00B562" style={styles.smallTotal}>
                    +₹{parseFloat(stats.totalRevenue).toLocaleString("en-IN")}
                  </Text>
                </View>
                <Text variant="body1" color={COLORS.text.primary} style={styles.totalLabel}>
                  Total bookings
                </Text>
              </View>

              <View style={styles.onlineOfflineCol}>
                <View style={styles.badgeBox}>
                  <Text variant="body2" color={COLORS.text.primary} style={styles.badgeText}>
                    Online bookings
                  </Text>
                  <Text variant="body1" weight="bold" color={COLORS.primary}>
                    {stats.onlineBookings}
                  </Text>
                </View>
                <View style={styles.badgeBox}>
                  <Text variant="body2" color={COLORS.text.primary} style={styles.badgeText}>
                    Offline bookings
                  </Text>
                  <Text variant="body1" weight="bold" color={COLORS.danger}>
                    {stats.offlineBookings}
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
              <DonutChart onlineRevenue={stats.onlineRevenue} totalRevenue={stats.totalRevenue} />

              <View style={styles.revenueCol}>
                <View style={styles.revenueItem}>
                  <Text variant="body2" color={COLORS.text.primary} style={styles.revenueLabel}>
                    Est. Payout
                  </Text>
                  <Text variant="h2" weight="bold" color={COLORS.primary}>
                    ₹{parseFloat(stats.onlineRevenue).toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.revenueItem}>
                  <Text variant="body2" color={COLORS.text.primary} style={styles.revenueLabel}>
                    Offline Revenue
                  </Text>
                  <Text variant="h2" weight="bold" color={COLORS.danger}>
                    ₹{parseFloat(stats.offlineRevenue).toLocaleString("en-IN")}
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
              {stats.weeklyRevenue.length > 0 ? (
                stats.weeklyRevenue.map(item => {
                  const isExpanded = expandedWeek === item.id;
                  return (
                    <View key={item.id}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => item.dailyBreakdown && toggleWeek(item.id)}
                        style={styles.graphRow}>
                        <View style={styles.weekLabelBox}>
                          <Text
                            variant="body2"
                            weight="semiBold"
                            color="#8C8C8C"
                            style={styles.weekText}>
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
                              { width: hs(Math.max(item.percentage * 2, 20)) }, // Min width for visibility
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
                                <View
                                  style={[
                                    styles.bar,
                                    { width: hs(Math.max(day.percentage * 2, 20)) },
                                  ]}>
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
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text variant="body2" color="#8C8C8C">
                    No revenue data for this period
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}

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
  loaderContainer: {
    height: vs(300),
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: vs(100),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
  },
});
