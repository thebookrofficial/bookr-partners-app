// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
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
const HistoryCard = ({ name, phone, time, price, status }: any) => {
  return (
    <View style={styles.cardContainer}>
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
            <Text style={styles.cardStatus}>{status}</Text>
          </View>
        </View>
        <View style={styles.timeRow}>
          <Clock size={ms(14)} color={COLORS.text.primary} />
          <Text style={styles.cardTime}>{time}</Text>
        </View>
      </View>
    </View>
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

const DateSectionHeader = ({ date, settlement }: { date: string; settlement: number }) => (
  <View style={styles.dateHeaderRow}>
    <TouchableOpacity style={styles.dateLeft} activeOpacity={0.7}>
      <Text variant="body2" weight="bold" style={styles.dateText}>
        {date}
      </Text>
      <ChevronDown size={ms(16)} color={COLORS.text.primary} />
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

  // Extract initial serviceId gracefully
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "SportsServiceTabs");
    serviceId =
      (tabRoute?.params as any)?.serviceId || (tabRoute?.params as any)?.params?.serviceId || "";
  }

  const { selectedCategories, setServiceCategory } = useServiceStore();
  const selectedCategory = selectedCategories[serviceId] || "Football";

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("all");
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>();

  // Pass dynamic IDs and filters to the updated hook
  const { currentVenueId, historyGroups, loading } = useSportsHistory(
    serviceId,
    selectedCategory,
    searchQuery,
    dateFilter,
    customRange,
  );

  return (
    <ScreenContainer backgroundColor={COLORS.background}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Header */}
        <View style={styles.headerZIndex}>
          <ServiceHeader
            title="Elite Strikers Club"
            subtitle="History"
            category={selectedCategory}
            onCategoryPress={() => setIsCategoryOpen(!isCategoryOpen)}
          />
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

                {monthGroup.days.map((dayGroup, dIndex) => (
                  <View key={`day-${dIndex}`}>
                    <DateSectionHeader date={dayGroup.date} settlement={dayGroup.settlement} />

                    {dayGroup.bookings.map(booking => (
                      <HistoryCard
                        key={booking.id}
                        name={booking.name}
                        phone={booking.phone}
                        time={booking.timeRanges}
                        price={`₹${booking.price}`}
                        status={booking.status}
                      />
                    ))}
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        <View style={{ height: vs(120) }} />
      </ScrollView>

      {/* ========================================== */}
      {/* ABSOLUTE OVERLAYS (Rendered on top of everything) */}
      {/* ========================================== */}

      {/* 1. FIXED Category Dropdown Overlay */}
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
                  setServiceCategory(serviceId, cat);
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

  /* --- OVERLAY DROPDOWN STYLES --- */
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
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
  },
  dateLeft: { flexDirection: "row", alignItems: "center", gap: hs(6) },
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
