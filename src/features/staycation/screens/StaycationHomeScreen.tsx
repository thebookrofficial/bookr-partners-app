// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { Plus } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useStaycationHome } from "../hooks/useStaycationHome";
import { Calendar } from "react-native-calendars";
import { StaycationBooking } from "../types/staycation.types";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

// Current Date for logic: 2026-04-26
const CURRENT_DATE = "2026-04-26";

type ListEntry = { type: "header"; title: string } | { type: "booking"; data: StaycationBooking };

// Helper to format date for card display (e.g., "2026-04-26" -> "26 Apr")
const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${day} ${month}`;
};

export const StaycationHomeScreen = () => {
  const { isLoading, markedDates, groupedBookings, refetch, venue } = useStaycationHome();

  // Flatten categorized bookings for the list
  const flatListData = useMemo(() => {
    const data: ListEntry[] = [];
    groupedBookings.forEach((section: { title: string; data: StaycationBooking[] }) => {
      data.push({ type: "header", title: section.title });
      section.data.forEach(b => data.push({ type: "booking", data: b }));
    });
    return data;
  }, [groupedBookings]);

  const renderItem = ({ item }: { item: ListEntry }) => {
    if (item.type === "header") {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
        </View>
      );
    }
    return (
      <StaycationBookingCard
        {...item.data}
        checkIn={formatDisplayDate(item.data.checkIn)}
        checkOut={formatDisplayDate(item.data.checkOut)}
      />
    );
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <StaycationHeader
          title={venue?.name || "Staycation Venue"}
          subtitle="Bookings"
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />

        {/* Status Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.availableDot} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.manuelDot]} />
            <Text style={styles.legendText}>manuel</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.onlineDot]} />
            <Text style={styles.legendText}>Online</Text>
          </View>
        </View>

        {/* Inline Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={CURRENT_DATE}
            markingType={"period"}
            markedDates={markedDates}
            renderArrow={direction => (
              <Text style={styles.calendarArrow}>{direction === "left" ? "<" : ">"}</Text>
            )}
            enableSwipeMonths={true}
            disableAllTouchEventsForDisabledDays={true}
            onDayPress={() => {}} // Disabled for read-only behavior
            theme={
              {
                backgroundColor: COLORS.background,
                calendarBackground: COLORS.background,
                textSectionTitleColor: "#b3b3b3",
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.text.inverse,
                todayTextColor: COLORS.text.primary,
                dayTextColor: COLORS.text.primary,
                textDisabledColor: "transparent",
                monthTextColor: COLORS.text.primary,
                textDayFontFamily: "Gilroy-Bold",
                textMonthFontFamily: "Gilroy-Bold",
                textDayHeaderFontFamily: "Gilroy-Bold",
                textDayFontSize: fs(11),
                textMonthFontSize: fs(14),
                textDayHeaderFontSize: fs(14),
                "stylesheet.calendar.header": {
                  dayHeader: {
                    marginTop: 2,
                    marginBottom: 7,
                    width: 32,
                    textAlign: "center",
                    fontSize: fs(14),
                    fontFamily: "Gilroy-Bold",
                    color: "#b3b3b3",
                  },
                  dayTextAtIndex5: { color: COLORS.primary },
                  dayTextAtIndex6: { color: COLORS.primary },
                  header: {
                    flexDirection: "row",
                    justifyContent: "center",
                    paddingLeft: 10,
                    paddingRight: 10,
                    marginTop: 10,
                    alignItems: "center",
                    gap: hs(40),
                  },
                },
              } as any
            }
          />
        </View>

        <View style={styles.bookingsHeader}>
          <Text style={styles.bookingsTitle}>Recent Bookings</Text>
        </View>
      </View>
    ),
    [venue, markedDates],
  );

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable={false}
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}>
        {isLoading && flatListData.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={flatListData}
            keyExtractor={(item, index) =>
              item.type === "header" ? item.title + index : item.data.id
            }
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListFooterComponent={<View style={{ height: vs(120) }} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No upcoming bookings found.</Text>
              </View>
            }
          />
        )}
      </ScreenContainer>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Plus size={ms(30)} color={COLORS.text.inverse} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingTop: vs(10),
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(12),
    marginTop: vs(10),
    marginBottom: vs(10),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  dot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  availableDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  manuelDot: {
    backgroundColor: COLORS.danger,
  },
  onlineDot: {
    backgroundColor: COLORS.primary,
  },
  legendText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "lowercase",
  },
  calendarContainer: {
    backgroundColor: COLORS.background,
    marginBottom: vs(20),
  },
  calendarArrow: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
  },
  bookingsHeader: {
    marginBottom: vs(10),
  },
  bookingsTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(20),
    color: COLORS.text.primary,
  },
  sectionHeader: {
    marginTop: vs(10),
    marginBottom: vs(5),
  },
  sectionTitle: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: COLORS.text.muted,
  },
  listContent: {
    paddingBottom: vs(20),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(100),
  },
  emptyContainer: {
    padding: ms(32),
    alignItems: "center",
    marginTop: vs(20),
  },
  emptyText: {
    color: COLORS.text.muted,
    fontFamily: "Gilroy-Medium",
  },
  fab: {
    position: "absolute",
    right: hs(18),
    bottom: vs(100),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
});
