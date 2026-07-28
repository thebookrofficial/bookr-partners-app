// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { PillTabs, EventHomeSkeleton } from "@/components/ui";
import { hs, vs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
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
              onTabChange={setActiveTab}
              variant="dark"
            />
          </View>
        )}

        {/* 3. Booking List */}
        <EventBookingList bookings={filteredBookings} onBookingPress={handleBookingPress} />

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
});
