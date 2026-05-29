// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { Phone, Calendar, User } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";
import { useStaycationHistory } from "../hooks/useStaycationHistory";
import { DateFilterOption } from "../hooks/useStaycationHistory";
import { FilterBottomSheet } from "../../sports/components/FilterBottomSheet";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

// ==========================================
// 1. NEW HISTORY CARD
// ==========================================
const HistoryCard = ({ name, phone, dateRange, guests, price, status, onPress }: any) => {
  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case "online":
        return "#63A1FD";
      case "offline":
        return "#E55959";
      case "cancelled":
        return "#E55959";
      default:
        return COLORS.text.muted;
    }
  };

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
            <Text style={styles.cardPrice}>₹{price}</Text>
            <Text style={[styles.cardStatus, { color: getStatusColor(status) }]}>{status}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={ms(14)} color={COLORS.text.primary} />
            <Text style={styles.cardDetailText}>{dateRange}</Text>
          </View>
          <View style={styles.detailItem}>
            <User size={ms(14)} color={COLORS.text.primary} />
            <Text style={styles.cardDetailText}>{guests} Guest</Text>
          </View>
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
      <Text style={styles.monthSettlementAmount}>
        ₹{Number(totalSettlement).toLocaleString("en-IN")}
      </Text>
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
    return getGroupedBookings("All Rooms");
  }, [getGroupedBookings]);

  return (
    <ScreenContainer scrollable={false} backgroundColor={COLORS.background}>
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
            <View style={{ paddingHorizontal: hs(12) }}>
              <StaycationHeader
                title={venue?.name || "Vally view farmhouse"}
                subtitle="History"
                imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
              />
              {/* 
              <View style={styles.tabRow}>
                <Text variant="body1" weight="bold" style={styles.bookingsLabel}>
                  Bookings
                </Text>
                <View style={styles.staticPill}>
                  <Text variant="body2" weight="semiBold" color={COLORS.text.inverse}>
                    {displayLabel}
                  </Text>
                </View>
              </View> */}

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
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: hs(12) }}>
            <HistoryCard
              name={item.name}
              phone={item.phone}
              dateRange={`${formatDisplayDate(item.checkIn)} - ${formatDisplayDate(item.checkOut)}`}
              guests={item.guestCount}
              price={item.paidAmount}
              status={item.status}
              onPress={() =>
                navigation.navigate("StaycationInvoice", {
                  bookingId: item.id,
                })
              }
            />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={{ paddingHorizontal: hs(12) }}>
            <MonthSectionHeader
              month={section.date}
              totalSettlement={(section as any).settlement}
            />
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No past bookings found.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={<View style={{ height: vs(120) }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
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
  // monthText: {
  //   fontSize: fs(14),
  //   color: "#000",
  // },

  /* --- MONTH HEADER --- */
  monthHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingVertical: vs(10),
    paddingHorizontal: hs(12),
    borderRadius: ms(8),
    marginTop: vs(10),
    marginBottom: vs(12),
  },
  monthText: { fontFamily: "Gilroy-Medium", fontSize: fs(14), color: COLORS.text.primary },
  monthSettlementContainer: { flexDirection: "row", alignItems: "center", gap: hs(4) },
  monthSettlementLabel: { fontFamily: "Gilroy-Medium", fontSize: fs(12), color: COLORS.text.muted },
  monthSettlementAmount: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(14),
    color: COLORS.text.primary,
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
  detailsRow: { flexDirection: "row", alignItems: "center", gap: hs(12) },
  detailItem: { flexDirection: "row", alignItems: "center", gap: hs(6) },
  cardDetailText: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: COLORS.text.primary },

  listContent: {
    paddingBottom: vs(20),
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.5)",
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
