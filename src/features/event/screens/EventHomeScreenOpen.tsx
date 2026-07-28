// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar as CalendarIcon, X } from "lucide-react-native";

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
    refresh,
  } = useEventHomeOpen(eventId);

  // --- Date Picker State ---
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
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

  // Filter SECOND by the selected date (if any)
  if (selectedDate) {
    const selectedDateStr = selectedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    filteredBookings = filteredBookings.filter(b => b.date === selectedDateStr);
  }

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
          imageSource={USER_PROFILE}
        />

        {/* 2. Controls (Date Filter & Tabs) */}
        <View style={styles.controlsContainer}>
          <View style={styles.dateFilterRow}>
            <Text weight="bold" style={styles.dateFilterLabel}>
              Filter By Date
            </Text>
            <TouchableOpacity
              style={styles.dateSelector}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}>
              <CalendarIcon size={ms(16)} color={COLORS.primary} />
              <Text weight="semiBold" style={styles.dateSelectorText}>
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "All Dates"}
              </Text>
              {selectedDate && (
                <TouchableOpacity
                  onPress={e => {
                    e.stopPropagation(); // Prevent opening picker when clearing
                    setSelectedDate(null);
                  }}
                  style={styles.clearBtn}>
                  <X size={ms(14)} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {summaryCategories.length > 1 && (
            <View style={styles.tabWrapper}>
              <PillTabs
                tabs={tabNames}
                activeTab={currentActiveTab}
                onTabChange={setActiveTab}
                variant="dark"
              />
            </View>
          )}
        </View>

        {/* 3. Booking List */}
        <EventBookingList bookings={filteredBookings} onBookingPress={handleBookingPress} />

        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
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
  },
  dateFilterLabel: {
    fontSize: fs(18),
    color: COLORS.text.primary,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F7FC", // Match PillTabs background feel
    paddingHorizontal: hs(12),
    paddingVertical: vs(6),
    borderRadius: ms(8),
    gap: hs(8),
  },
  dateSelectorText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  clearBtn: {
    marginLeft: hs(4),
    padding: ms(2),
  },
  tabWrapper: {
    marginTop: vs(12),
    paddingHorizontal: hs(6),
  },
});
