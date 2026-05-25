// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import { View, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { Calendar } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHistory } from "../hooks/useStaycationHistory";
import { DateFilterOption } from "../hooks/useStaycationHistory";
import { FilterBottomSheet } from "../../sports/components/FilterBottomSheet";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const StaycationHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationHistory">>();

  // Extract serviceId with fallback from parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "StaycationServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("all");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>();

  const { isLoading, rooms, venue, getGroupedBookings } = useStaycationHistory(
    serviceId,
    dateFilter,
    customRange,
  );

  const displayLabel = useMemo(() => {
    return rooms.length > 0 ? "All Rooms" : "Farmhouse";
  }, [rooms]);

  const listData = useMemo(() => {
    return getGroupedBookings("All Rooms");
  }, [getGroupedBookings]);

  return (
    <ScreenContainer scrollable={false} paddingHorizontal={hs(12)}>
      <StaycationHeader
        title={venue?.name || "Vally view farmhouse"}
        subtitle="History"
        imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
      />

      <View style={styles.tabRow}>
        <Text variant="body1" weight="bold" style={styles.bookingsLabel}>
          Bookings
        </Text>
        <View style={styles.staticPill}>
          <Text variant="body2" weight="semiBold" color={COLORS.text.inverse}>
            {displayLabel}
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <Text variant="body2" weight="semiBold" style={styles.monthText}>
          {dateFilter === "all"
            ? "All Time"
            : dateFilter === "3_months"
            ? "Last 3 Months"
            : dateFilter === "6_months"
            ? "Last 6 Months"
            : dateFilter === "9_months"
            ? "Last 9 Months"
            : customRange
            ? `${customRange.start.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })} - ${customRange.end.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`
            : "Custom Range"}
        </Text>
        <TouchableOpacity onPress={() => setIsFilterOpen(true)}>
          <Calendar size={ms(16)} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#63A1FD" />
        </View>
      ) : (
        <SectionList
          sections={listData}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <StaycationBookingCard
              bookingId={item.id}
              {...item}
              onPress={() =>
                (navigation as any).navigate("StaycationBookingDetails", {
                  booking: item,
                  isFromHistory: true,
                })
              }
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.dateLeft}>
                <Text variant="body2" weight="bold" style={styles.sectionDate}>
                  {section.date}
                </Text>
                <Text variant="body2" weight="semiBold" style={styles.sectionCount}>
                  {section.data.length} Bookings
                </Text>
              </View>

              <View style={styles.settlementRight}>
                <Text style={styles.datePriceText}>₹{(section as any).settlement}</Text>
                <Text style={styles.dateSettlementLabel}>Total Payout</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No past bookings found.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Date Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilter={dateFilter as any}
        currentCustomRange={customRange}
        onApply={(filter: any, range) => {
          setDateFilter(filter);
          setCustomRange(range);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
    marginVertical: vs(10),
    height: vs(40),
  },
  bookingsLabel: {
    fontSize: fs(16),
    color: "#000",
  },
  staticPill: {
    paddingHorizontal: hs(16),
    paddingVertical: vs(6),
    backgroundColor: "#282828",
    borderRadius: ms(20),
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: vs(10),
    paddingHorizontal: hs(6),
  },
  monthText: {
    fontSize: fs(14),
    color: "#000",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(8),
    paddingHorizontal: hs(6),
    marginBottom: vs(4),
  },
  dateLeft: {
    flexDirection: "column",
  },
  sectionDate: {
    fontSize: fs(14),
    color: "#000",
  },
  sectionCount: {
    fontSize: fs(12),
    color: COLORS.text.muted,
    marginTop: vs(2),
  },
  settlementRight: {
    alignItems: "flex-end",
  },
  datePriceText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: "#00B562",
  },
  dateSettlementLabel: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(10),
    color: COLORS.text.muted,
    marginTop: vs(2),
  },
  listContent: {
    paddingBottom: vs(120),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: vs(40),
    alignItems: "center",
  },
  emptyText: {
    fontSize: fs(14),
    color: COLORS.text.muted,
  },
});
