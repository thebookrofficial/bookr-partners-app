// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, TextInput } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Search, ChevronDown, SlidersHorizontal, Phone, Clock } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useServiceStore } from "@/store/serviceStore";
import { useSportsHistory } from "../hooks/useSportsHistory";
import { FilterBottomSheet, DateFilterOption } from "../components/FilterBottomSheet";

// Navigation Imports
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, SportsTabParamList } from "@/navigation/navigation.types";

// ==========================================
// 1. NEW HISTORY CARD
// ==========================================
const HistoryCard = ({ name, phone, time, price, status, onPress }: any) => {
  const isOnline = status === "Online";
  const statusColor = isOnline ? COLORS.primary : COLORS.danger;

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.avatarCircle} />
      <View style={styles.cardInfoCol}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.namePhoneCol}>
            <Text style={styles.cardName}>{name}</Text>
            <View style={styles.phoneRow}>
              <Phone size={ms(14)} color={COLORS.text.primary} fill={COLORS.text.primary} />
              <Text style={styles.cardPhone}>{phone.replace("+91 ", "")}</Text>
            </View>
          </View>
          <View style={styles.priceStatusCol}>
            <Text style={styles.cardPrice}>{price}</Text>
            <Text style={[styles.cardStatus, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <Clock size={ms(14)} color={COLORS.text.primary} />
          <Text style={styles.cardTime}>{time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// 2. HEADERS
// ==========================================
const MonthSectionHeader = ({
  month,
  totalSettlement,
}: {
  month: string;
  totalSettlement: number;
}) => (
  <View style={styles.monthHeaderRow}>
    <Text style={styles.monthText}>{month}</Text>
    <View style={styles.monthSettlementContainer}>
      <Text style={styles.monthSettlementLabel}>Total:</Text>
      <Text style={styles.monthSettlementAmount}>₹{totalSettlement}</Text>
    </View>
  </View>
);

const DateSectionHeader = ({
  date,
  settlement,
  isExpanded,
  onToggle,
}: {
  date: string;
  settlement: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <View style={styles.dateHeaderRow}>
    <TouchableOpacity style={styles.dateLeft} activeOpacity={0.7} onPress={onToggle}>
      <Text variant="body2" weight="bold" style={styles.dateText}>
        {date}
      </Text>
      <ChevronDown
        size={ms(16)}
        color={COLORS.text.primary}
        style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
      />
    </TouchableOpacity>

    <View style={styles.settlementRight}>
      <Text style={styles.datePriceText}>₹{settlement}</Text>
      <Text style={styles.dateSettlementLabel}>Settlement</Text>
    </View>
  </View>
);

// ==========================================
// 3. MAIN SCREEN
// ==========================================
export const SportsHistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<SportsTabParamList, any>>();

  // Extract initial serviceId and category gracefully
  let serviceId = route.params?.serviceId;
  let routeCategory = route.params?.category;

  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
    const params = (tabRoute?.params as any) || {};
    serviceId = params.serviceId || params.params?.serviceId || "";
    routeCategory = routeCategory || params.category || params.params?.category;
  }

  const { selectedCategories, setServiceCategory } = useServiceStore();

  const lastRouteCategory = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (routeCategory && routeCategory !== lastRouteCategory.current) {
      lastRouteCategory.current = routeCategory;
      if (selectedCategories[serviceId] !== routeCategory) {
        setServiceCategory(serviceId, routeCategory);
      }
    }
  }, [routeCategory, serviceId, setServiceCategory, selectedCategories]);

  const selectedCategory = selectedCategories[serviceId] || routeCategory || "Football";

  const [searchQuery, setSearchQuery] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("yesterday");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>();

  // NEW: State to track which dates are collapsed (Accordion logic)
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleDateAccordion = (dateStr: string) => {
    setCollapsedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  // Pass dynamic IDs and filters to the updated hook
  const { currentVenueId, historyGroups, loading, refetch } = useSportsHistory(
    serviceId,
    selectedCategory,
    searchQuery,
    dateFilter,
    customRange,
  );
  const { activeVenueName } = useServiceStore();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={0}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }>
        {/* Header */}
        <View style={styles.headerZIndex}>
          <ServiceHeader title={activeVenueName} subtitle="History" />
        </View>

        {/* Sticky Search */}
        <View style={styles.stickySearchWrapper}>
          <TextInput
            variant="filled"
            placeholder="Search for mobile number , Date , Name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search size={ms(20)} color={COLORS.text.primary} />}
            rightIcon={
              <TouchableOpacity activeOpacity={0.7} onPress={() => setIsFilterOpen(true)}>
                <SlidersHorizontal size={ms(20)} color={COLORS.text.primary} />
              </TouchableOpacity>
            }
            style={styles.searchBarOverride}
          />
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : !currentVenueId ? (
            <Text style={styles.emptyStateText}>
              No {selectedCategory} facility setup for this club.
            </Text>
          ) : historyGroups.length === 0 ? (
            <Text style={styles.emptyStateText}>No history found.</Text>
          ) : (
            historyGroups.map((monthGroup, mIndex) => (
              <View key={`month-${mIndex}`} style={styles.monthGroupContainer}>
                <MonthSectionHeader
                  month={monthGroup.month}
                  totalSettlement={monthGroup.totalSettlement}
                />

                {monthGroup.days.map((dayGroup, dIndex) => {
                  const isCollapsed = !!collapsedDates[dayGroup.date];
                  return (
                    <View key={`day-${dIndex}`}>
                      <DateSectionHeader
                        date={dayGroup.date}
                        settlement={dayGroup.settlement}
                        isExpanded={!isCollapsed}
                        onToggle={() => toggleDateAccordion(dayGroup.date)}
                      />

                      {!isCollapsed &&
                        dayGroup.bookings.map(booking => (
                          <HistoryCard
                            key={booking.id}
                            name={booking.name}
                            phone={booking.phone}
                            time={booking.timeRanges}
                            price={`₹${booking.price}`}
                            status={booking.status}
                            onPress={() =>
                              navigation.navigate("SportsInvoice", { bookingId: booking.id })
                            }
                          />
                        ))}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* ========================================== */}
      {/* ABSOLUTE OVERLAYS (Rendered on top of everything) */}
      {/* ========================================== */}

      {/* 2. Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilter={dateFilter}
        currentCustomRange={customRange}
        onApply={(filter, range) => {
          setDateFilter(filter);
          setCustomRange(range);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerZIndex: { zIndex: 10, paddingHorizontal: hs(12) },

  stickySearchWrapper: {
    backgroundColor: COLORS.background,
    paddingHorizontal: hs(12),
    paddingTop: vs(6),
    paddingBottom: vs(2),
    zIndex: 9,
  },
  searchBarOverride: {
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    borderRadius: ms(10),
    shadowColor: "rgba(229, 229, 229, 0.7)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    height: vs(40),
  },

  listSection: { width: "100%", paddingHorizontal: hs(12) },
  monthGroupContainer: { marginBottom: vs(15) },

  /* --- HEADERS --- */
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingVertical: vs(10),
    paddingHorizontal: hs(12),
    borderRadius: ms(8),
    marginTop: vs(10),
    marginBottom: vs(5),
  },
  monthText: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: COLORS.text.primary },
  monthSettlementContainer: { flexDirection: "row", alignItems: "center", gap: hs(4) },
  monthSettlementLabel: { fontFamily: "Gilroy-Medium", fontSize: fs(12), color: COLORS.text.muted },
  monthSettlementAmount: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: COLORS.text.primary,
  },

  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
    marginTop: vs(12),
    paddingVertical: vs(4),
  },
  dateLeft: { flexDirection: "row", alignItems: "center", gap: hs(6), paddingRight: hs(10) },
  dateText: { fontFamily: "Gilroy-Bold", fontSize: fs(14), color: COLORS.text.primary },
  settlementRight: { alignItems: "center", justifyContent: "center" },
  datePriceText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#00B562" },
  dateSettlementLabel: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(10),
    color: COLORS.text.muted,
  },

  /* --- HISTORY CARD --- */
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(10),
    marginBottom: vs(10),
    width: "100%",
  },
  avatarCircle: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(25),
    backgroundColor: COLORS.danger,
    marginRight: hs(10),
  },
  cardInfoCol: { flex: 1, flexDirection: "column" },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.navBar,
    paddingBottom: vs(4),
    marginBottom: vs(6),
  },
  namePhoneCol: { flexDirection: "column" },
  cardName: { fontFamily: "Gilroy-Bold", fontSize: fs(16), color: COLORS.text.primary },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: hs(6), marginTop: vs(2) },
  cardPhone: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: COLORS.text.primary },
  priceStatusCol: { alignItems: "center" },
  cardPrice: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#00B562" },
  cardStatus: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(10),
    color: COLORS.text.muted,
    marginTop: vs(2),
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: hs(8) },
  cardTime: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: COLORS.text.primary },
  loader: { marginTop: vs(40) },
  emptyStateText: { textAlign: "center", marginTop: vs(40), color: COLORS.text.muted },
});
