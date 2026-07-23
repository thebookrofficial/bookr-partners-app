// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, ListSkeleton } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react-native";
import PersonSvg from "@/assets/icons/ic-round-person.svg";
import CalendarSvg from "@/assets/icons/ic-solar-calendar-outline.svg";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useAuthStore, useServiceStore } from "@/store";
import { useStaycationHistory } from "../hooks/useStaycationHistory";
import { DateFilterOption } from "../hooks/useStaycationHistory";
import { FilterBottomSheet } from "../../sports/components/FilterBottomSheet";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

// ==========================================
// 1. NEW HISTORY CARD
// ==========================================
const HistoryCard = ({ name, phone, dateRange, guests, price, status, onPress }: any) => {
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
          <Text style={styles.cardPrice}>₹{price}</Text>
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
            <CalendarSvg width={ms(18)} height={ms(18)} color="#63A1FD" />
          </View>
          <Text style={styles.cardDateRange}>{dateRange}</Text>
        </View>
        <Text style={styles.cardGuestCount}>{guests} Guest</Text>
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// 2. HEADERS
// ==========================================
const MonthSectionHeader = ({ month }: { month: string }) => (
  <View style={styles.monthHeaderRow}>
    <View style={styles.monthHeaderLeft}>
      <Text style={styles.monthText}>{month}</Text>
      <ChevronDown size={ms(20)} color="#000" />
    </View>
  </View>
);

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
};

export const StaycationHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationHistory">>();
  const { activeVenueName } = useServiceStore();
  const { clientProfile } = useAuthStore();
  const isOwner = clientProfile?.client_role === "owner" || !clientProfile;

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
  const [searchQuery, setSearchQuery] = useState("");

  const {
    isLoading,
    // rooms,
    venue,
    getGroupedBookings,
    refetch,
  } = useStaycationHistory(serviceId, dateFilter, customRange);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // const displayLabel = useMemo(() => {
  //   return rooms.length > 0 ? "All Rooms" : "Farmhouse";
  // }, [rooms]);

  const listData = useMemo(() => {
    const data = getGroupedBookings("All Rooms");
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const filtered = data
      .map(section => {
        return {
          ...section,
          data: section.data.filter(
            item => item.name.toLowerCase().includes(query) || item.phone.includes(query),
          ),
        };
      })
      .filter(section => section.data.length > 0);

    return filtered;
  }, [getGroupedBookings, searchQuery]);

  return (
    <ScreenContainer
      scrollable={false}
      backgroundColor={COLORS.background}
      paddingHorizontal={hs(10)}>
      <SectionList
        sections={listData}
        stickySectionHeadersEnabled={false}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <>
            <StaycationHeader
              title={venue?.name || activeVenueName}
              subtitle="Bookings"
              imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
            />

            <View style={styles.searchBarContainer}>
              <Search size={ms(20)} color="#000" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#8C8C8C"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity onPress={() => setIsFilterOpen(true)}>
                <SlidersHorizontal size={ms(20)} color="#000" />
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <HistoryCard
            name={item.name}
            phone={item.phone}
            dateRange={`${formatDisplayDate(item.checkIn)} - ${formatDisplayDate(item.checkOut)}`}
            guests={item.guestCount}
            price={item.paidAmount}
            status={item.status}
            onPress={() => {
              if (isOwner) {
                navigation.navigate("StaycationInvoice", {
                  bookingId: item.id,
                });
              }
            }}
          />
        )}
        renderSectionHeader={({ section }) => <MonthSectionHeader month={section.date} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingTop: vs(20) }}>
              <ListSkeleton count={4} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No past bookings found.</Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: vs(120) }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
  listContent: { paddingBottom: vs(100) },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FB",
    borderRadius: ms(8),
    paddingHorizontal: hs(12),
    paddingVertical: vs(10),
    marginBottom: vs(16),
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

  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(16),
    marginBottom: vs(12),
  },
  monthHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
    marginRight: hs(4),
  },
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
    backgroundColor: "#E4F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: hs(12),
  },
  cardDateRange: {
    fontSize: fs(18),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
  },
  cardGuestCount: {
    fontSize: fs(18),
    fontFamily: "Gilroy-SemiBold",
    color: "#000",
  },
  emptyContainer: {
    padding: ms(32),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Medium",
    color: COLORS.text.muted,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
