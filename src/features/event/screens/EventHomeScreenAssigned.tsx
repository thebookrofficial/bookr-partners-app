// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { PillTabs, EventHomeSkeleton, Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { EventHeader } from "../components/EventHeader";
import { EventBookingList } from "../components/EventBookingList";
import { useEventHomeAssigned } from "../hooks/useEventHomeAssigned";
import { useNavigation } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface EventHomeScreenAssignedProps {
  eventId: string;
}

export const EventHomeScreenAssigned = ({ eventId }: EventHomeScreenAssignedProps) => {
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
    refresh,
  } = useEventHomeAssigned(eventId);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleBookingPress = (booking: any) => {
    navigation.navigate("EventEntryDetails", { entryId: booking.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <EventHomeSkeleton />
      </View>
    );
  }

  const tabNames = [
    { label: "All", count: totalBookings.value },
    ...summaryCategories.map(c => ({ label: c.label, count: c.value })),
  ];

  const filteredBookings =
    activeTab === "All" ? bookings : bookings.filter(b => b.passType.includes(activeTab));

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
          title={eventData?.title || "Neon Shadow World Tour 2026"}
          subtitle="Bookings"
          imageSource={USER_PROFILE}
        />

        {/* 2. Filter Tabs */}
        {summaryCategories.length > 1 && (
          <View style={styles.tabWrapper}>
            <PillTabs
              tabs={tabNames}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant="dark"
            />
          </View>
        )}

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
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1,
  },
  tabWrapper: {
    marginBottom: vs(10),
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
