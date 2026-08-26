// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
} from "react-native";
import { HistorySkeleton } from "@/components/ui";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react-native";
import PersonSvg from "@/assets/icons/ic-round-person.svg";
import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useServiceStore } from "@/store/serviceStore";
import { useSportsHistory } from "../hooks/useSportsHistory";
import { FilterBottomSheet, DateFilterOption } from "../components/FilterBottomSheet";
import { useDebounce } from "@/hooks/useDebounce";

// Navigation Imports
import { RouteProp, useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, SportsTabParamList } from "@/navigation/navigation.types";
import { useAuthStore } from "@/store";

// ==========================================
// 1. NEW HISTORY CARD
// ==========================================
const HistoryCard = ({
  name,
  phone,
  date,
  time,
  price,
  status,
  onPress,
  category,
  ground,
}: any) => {
  const isOnline = status?.toLowerCase() === "online";

  return (
    <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.avatarSquircle}>
            <PersonSvg width={ms(20)} height={ms(20)} color="#63A1FD" />
          </View>
          <View style={styles.namePhoneCol}>
            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.cardPhone}>{phone}</Text>
          </View>
        </View>

        <View style={styles.priceStatusCol}>
          <Text style={styles.cardPrice}>{price}</Text>
          <View style={isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline}>
            <Text style={isOnline ? styles.statusTextOnline : styles.statusTextOffline}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardFooterRow}>
        <View style={styles.cardFooterLeft}>
          <View style={styles.calendarSquircle}>
            <CalendarSvg width={ms(20)} height={ms(20)} color="#63A1FD" />
          </View>
          <Text style={styles.cardDateRange}>{date}</Text>
        </View>
        <Text style={styles.cardGuestCount}>{time}</Text>
      </View>

      {(category || ground) && (
        <View style={styles.categoryGroundContainer}>
          <Text style={styles.categoryGroundText}>
            {category ? category.charAt(0).toUpperCase() + category.slice(1) : ""}{" "}
            {category && ground ? "•" : ""} {ground}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ==========================================
// 2. HEADERS
// ==========================================
const DateSectionHeader = ({
  date,

  isExpanded,
  onToggle,
}: {
  date: string;

  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <View style={styles.dateHeaderRow}>
    <TouchableOpacity style={styles.dateLeft} activeOpacity={0.7} onPress={onToggle}>
      <Text style={styles.dateText}>{date}</Text>
      <ChevronDown
        size={ms(20)}
        color="#000"
        style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
      />
    </TouchableOpacity>
  </View>
);

// ==========================================
// 3. MAIN SCREEN
// ==========================================
export const SportsHistoryScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<SportsTabParamList, any>>();
  const { clientProfile } = useAuthStore();
  const isOwner = clientProfile?.client_role === "owner" || !clientProfile;

  const { selectedCategories, setServiceCategory, activeServiceId, setTabBarVisible } =
    useServiceStore();

  // 1. Get Service ID (Priority: Route -> Store)
  const serviceId = route.params?.serviceId || activeServiceId;

  // 2. Get Category (Priority: Route -> Store)
  const routeCategory = route.params?.category;
  const storedCategory = selectedCategories[serviceId];
  const selectedCategory = routeCategory || storedCategory || "Football";

  // Sync route param with store if we arrived via a deep link or specific tab click
  React.useEffect(() => {
    if (routeCategory && routeCategory !== storedCategory) {
      setServiceCategory(serviceId, routeCategory);
    }
  }, [routeCategory, serviceId, storedCategory, setServiceCategory]);

  const [searchQuery, setSearchQuery] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("all");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>();

  // NEW: State to track which dates are collapsed (Accordion logic)
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleDateAccordion = (dateStr: string) => {
    setCollapsedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Pass dynamic IDs and filters to the updated hook
  const { currentVenueId, historyGroups, loading, refetch } = useSportsHistory(
    serviceId,
    selectedCategory,
    debouncedSearchQuery,
    dateFilter,
    customRange,
  );

  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (isFocused) {
      setTabBarVisible(true);
    }
  }, [isFocused, setTabBarVisible]);

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
          <ServiceHeader title="History" subtitle="" />
        </View>

        {/* Sticky Search */}
        <View style={styles.stickySearchWrapper}>
          <View style={styles.searchBarContainer}>
            <Search size={ms(20)} color="#000" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8C8C8C"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setIsFilterOpen(true)} style={styles.filterButton}>
              <SlidersHorizontal size={ms(20)} color="#000" />
              {dateFilter !== "all" && (
                <View style={styles.filterBadgeContainer}>
                  <Text style={styles.filterBadgeText}>1</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          {loading ? (
            <HistorySkeleton />
          ) : !currentVenueId ? (
            <Text style={styles.emptyStateText}>No facilities setup for this club.</Text>
          ) : historyGroups.length === 0 ? (
            <Text style={styles.emptyStateText}>No history found.</Text>
          ) : (
            historyGroups.map((monthGroup, mIndex) => (
              <View key={`month-${mIndex}`} style={styles.monthGroupContainer}>
                {monthGroup.days.map((dayGroup, dIndex) => {
                  const isCollapsed = !!collapsedDates[dayGroup.date];
                  return (
                    <View key={`day-${dIndex}`}>
                      <DateSectionHeader
                        date={dayGroup.date}
                        isExpanded={!isCollapsed}
                        onToggle={() => toggleDateAccordion(dayGroup.date)}
                      />

                      {!isCollapsed &&
                        dayGroup.bookings.map(booking => (
                          <HistoryCard
                            key={booking.id}
                            name={booking.name}
                            phone={booking.phone}
                            date={dayGroup.date}
                            time={booking.timeRanges}
                            price={`₹${booking.price}`}
                            status={booking.status}
                            category={booking.category}
                            ground={booking.ground}
                            onPress={() => {
                              if (isOwner) {
                                navigation.navigate("SportsInvoice", { bookingId: booking.id });
                              }
                            }}
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
  categoryGroundContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(4),
    paddingLeft: hs(44),
  },
  categoryGroundText: {
    fontSize: fs(14),
    fontFamily: "Gilroy-Medium",
    color: "#666",
  },
  filterButton: {
    position: "relative",
  },
  filterBadgeContainer: {
    position: "absolute",
    top: -ms(6),
    right: -ms(6),
    backgroundColor: COLORS.primary,
    width: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: fs(10),
    color: "#FFF",
    fontFamily: "Gilroy-Bold",
    lineHeight: fs(10),
  },
  headerZIndex: { zIndex: 10, paddingHorizontal: hs(12) },

  stickySearchWrapper: {
    backgroundColor: COLORS.background,
    paddingHorizontal: hs(12),
    paddingTop: vs(12),
    paddingBottom: vs(4),
    zIndex: 9,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
    borderRadius: ms(8),
    paddingHorizontal: hs(12),
    paddingVertical: vs(10),
  },
  searchIcon: {
    marginRight: hs(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fs(14),
    fontFamily: "Gilroy-Medium",
    color: "#000",
    paddingVertical: 0,
    includeFontPadding: false,
  },

  listSection: { width: "100%", paddingHorizontal: hs(12) },
  monthGroupContainer: { marginBottom: vs(15) },

  /* --- HEADERS --- */
  monthHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(10),
    marginBottom: vs(5),
  },
  monthText: { fontFamily: "Gilroy-Bold", fontSize: fs(16), color: "#000" },

  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
    marginTop: vs(8),
  },
  dateLeft: { flexDirection: "row", alignItems: "center" },
  dateText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(16), color: "#000", marginRight: hs(4) },
  monthSettlementContainer: {
    alignItems: "flex-end",
  },
  monthSettlementAmount: {
    fontSize: fs(14),
    fontFamily: "Gilroy-Bold",
    color: "#00B562",
  },
  monthSettlementLabel: {
    fontSize: fs(10),
    fontFamily: "Gilroy-Medium",
    color: "#8C8C8C",
  },

  /* --- HISTORY CARD --- */
  cardContainer: {
    backgroundColor: "#F4F7FB",
    borderRadius: ms(12),
    padding: ms(10),
    marginBottom: vs(16),
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarSquircle: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(8),
    backgroundColor: "#E4F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
  },
  namePhoneCol: {
    justifyContent: "center",
  },
  cardName: {
    fontSize: fs(20),
    fontFamily: "Gilroy-Bold",
    color: "#000",
    marginBottom: vs(2),
  },
  cardPhone: {
    fontSize: fs(18),
    fontFamily: "Gilroy-Medium",
    color: "#000",
  },
  priceStatusCol: {
    alignItems: "flex-end",
  },
  cardPrice: {
    fontSize: fs(20),
    fontFamily: "Gilroy-Bold",
    color: "#00B562",
    marginBottom: vs(4),
  },
  statusBadgeOnline: {
    backgroundColor: "#E4F0FF",
    paddingHorizontal: hs(12),
    paddingVertical: vs(4),
    borderRadius: ms(16),
  },
  statusBadgeOffline: {
    backgroundColor: "#FFEBEB",
    paddingHorizontal: hs(12),
    paddingVertical: vs(4),
    borderRadius: ms(16),
  },
  statusTextOnline: {
    color: "#63A1FD",
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
  },
  statusTextOffline: {
    color: "#E55959",
    fontSize: fs(14),
    fontFamily: "Gilroy-SemiBold",
  },

  cardDivider: {
    height: 1,
    backgroundColor: "#D4E5F9",
    marginVertical: vs(8),
  },

  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  calendarSquircle: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    // backgroundColor: "#E4F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
  },
  cardDateRange: {
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
  },
  cardGuestCount: {
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
  },
  loader: { marginTop: vs(40) },
  emptyStateText: {
    textAlign: "center",
    marginTop: vs(40),
    color: COLORS.text.muted,
    fontFamily: "Gilroy-Medium",
  },
});
