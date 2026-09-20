// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { PillTabs, Text, EventHomeSkeleton } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { EventHeader } from "../components/EventHeader";
import { EventBookingList } from "../components/EventBookingList";
import { useEventHomeOpen } from "../hooks/useEventHomeOpen";
import { useNavigation } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { X, ChevronLeft, ChevronRight, Search } from "lucide-react-native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface EventHomeScreenOpenProps {
  eventId: string;
}

export const EventHomeScreenOpen = ({ eventId }: EventHomeScreenOpenProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {
    loading,
    refreshing,
    eventData,
    bookings,
    totalBookings,
    summaryCategories,
    activeTab,
    setActiveTab,
    sessionDateOptions,
    sessionTimeOptions,
    refresh,
  } = useEventHomeOpen(eventId);

  // --- Date & Pagination State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionDate, setSelectedSessionDate] = useState("All");
  const [selectedSessionTime, setSelectedSessionTime] = useState("All Times");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleBookingPress = (booking: any) => {
    // "as any" completely silences the strict TypeScript compiler!
    navigation.navigate("EventEntryDetails", {
      entryId: booking.id,
      bookingId: booking.id,
    } as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <EventHomeSkeleton />
      </View>
    );
  }

  // Create a default "All" tab that includes the count, to match Figma
  const defaultAllTab = `All (${totalBookings.value})`;

  // Extract purely strings so PillTabs doesn't crash on objects
  const tabNames = [defaultAllTab, ...summaryCategories.map(c => c.label)];

  // If the hook initializes with "All", override it to the formatted version
  const currentActiveTab = activeTab === "All" ? defaultAllTab : activeTab;

  // Safely filter based on the active tab string FIRST
  let filteredBookings = currentActiveTab.startsWith("All")
    ? bookings
    : bookings.filter(b => b.passType.toLowerCase().includes(currentActiveTab.toLowerCase()));

  // Filter SECOND by search query
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    filteredBookings = filteredBookings.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        (b.phone && b.phone.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q) ||
        b.passType.toLowerCase().includes(q),
    );
  }

  // Filter THIRD by session date/time if applicable
  if (selectedSessionDate !== "All") {
    filteredBookings = filteredBookings.filter(b => b.shortFilterDate === selectedSessionDate);
  }

  if (selectedSessionTime !== "All Times") {
    filteredBookings = filteredBookings.filter(b => b.filterTime === selectedSessionTime);
  }

  // Slice for Pagination
  const totalFiltered = filteredBookings.length;
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={refreshing}
        onRefresh={refresh}>
        {/* 1. Header */}
        <EventHeader
          title={eventData?.title || "Event Dashboard"}
          subtitle="Bookings"
          imageSource={
            eventData?.cover_image_url ? { uri: eventData.cover_image_url } : USER_PROFILE
          }
        />

        {/* 2. Controls (Date Filter & Tabs) */}
        <View style={styles.controlsContainer}>
          <View style={styles.dateFilterRow}>
            <View style={styles.searchBarContainer}>
              <Search size={ms(18)} color={COLORS.text.muted} />
              <RNTextInput
                style={styles.searchInput}
                placeholder="Search Name or Mobile..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.text.muted}
                autoCapitalize="none"
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={ms(16)} color={COLORS.text.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {sessionDateOptions.length > 1 && (
            <View style={styles.tabWrapper}>
              <PillTabs
                tabs={["All", ...sessionDateOptions]}
                activeTab={selectedSessionDate}
                onTabChange={tab => {
                  setSelectedSessionDate(tab);
                  setCurrentPage(1);
                }}
                variant="dark"
              />
            </View>
          )}

          {sessionTimeOptions.length > 1 && (
            <View style={styles.tabWrapper}>
              <PillTabs
                tabs={["All Times", ...sessionTimeOptions]}
                activeTab={selectedSessionTime}
                onTabChange={tab => {
                  setSelectedSessionTime(tab);
                  setCurrentPage(1);
                }}
                variant="dark"
              />
            </View>
          )}

          {summaryCategories.length > 1 && (
            <View style={styles.tabWrapper}>
              <PillTabs
                tabs={tabNames}
                activeTab={currentActiveTab}
                onTabChange={handleTabChange}
                variant="dark"
              />
            </View>
          )}
        </View>

        {/* 3. Booking List */}
        <EventBookingList bookings={paginatedBookings} onBookingPress={handleBookingPress} />

        {/* 4. Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageBtn, currentPage === 1 && styles.disabledBtn]}
              disabled={currentPage === 1}
              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}>
              <ChevronLeft
                size={ms(20)}
                color={currentPage === 1 ? COLORS.text.muted : COLORS.primary}
              />
            </TouchableOpacity>

            <Text style={styles.pageText} weight="semiBold">
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              style={[styles.pageBtn, currentPage === totalPages && styles.disabledBtn]}
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              <ChevronRight
                size={ms(20)}
                color={currentPage === totalPages ? COLORS.text.muted : COLORS.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {/* Date Picker Modal */}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
  },
  controlsContainer: {
    marginTop: vs(10),
    marginBottom: vs(2),
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: hs(6),
    gap: hs(12),
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC",
    paddingHorizontal: hs(12),
    height: vs(40),
    borderRadius: ms(8),
  },
  searchInput: {
    flex: 1,
    marginLeft: hs(8),
    fontSize: fs(14),
    fontFamily: "Gilroy-Medium",
    color: COLORS.text.primary,
    paddingVertical: 0, // important for android
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterIconBtn: {
    width: vs(40),
    height: vs(40),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(8),
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  activeFilterBadge: {
    position: "absolute",
    top: vs(8),
    right: hs(8),
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: COLORS.danger,
  },
  tabWrapper: {
    marginTop: vs(4),
    paddingHorizontal: hs(6),
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: hs(20),
    marginTop: vs(15),
    marginBottom: vs(10),
  },
  pageBtn: {
    padding: ms(8),
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(8),
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  disabledBtn: {
    opacity: 0.5,
  },
  pageText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
});
