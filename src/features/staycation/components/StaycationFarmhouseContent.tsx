// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Text, PillTabs } from "@/components/ui";
import { StaycationHeader } from "./StaycationHeader";
import { StaycationBookingCard } from "./StaycationBookingCard";
import { StaycationOfflineBookingSheet } from "./StaycationOfflineBookingSheet";
import { Plus, X } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Calendar } from "react-native-calendars";
import { StaycationBooking } from "../types/staycation.types";
import { useStaycationFarmhouse } from "../hooks/useStaycationFarmhouse";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface StaycationFarmhouseContentProps {
  initialVenueId?: string;
}

type ListEntry = { type: "header"; title: string } | { type: "booking"; data: StaycationBooking };

export const StaycationFarmhouseContent = ({ initialVenueId }: StaycationFarmhouseContentProps) => {
  const {
    isLoading,
    markedDates,
    groupedBookings,
    refetch,
    venues,
    activeVenue,
    setActiveVenueId,
    cancelBooking,
    selectedDate,
    setSelectedDate,
  } = useStaycationFarmhouse(initialVenueId);

  const [isOfflineSheetVisible, setIsOfflineSheetVisible] = useState(false);

  const handleCancel = (id: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => cancelBooking(id),
      },
    ]);
  };

  const flatListData = useMemo(() => {
    const data: ListEntry[] = [];
    groupedBookings.forEach(section => {
      if (section.data.length > 0) {
        data.push({ type: "header", title: section.title });
        section.data.forEach(b => {
          data.push({ type: "booking", data: b });
        });
      }
    });
    return data;
  }, [groupedBookings]);

  const renderItem = ({ item }: { item: ListEntry }) => {
    if (item.type === "header") {
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </View>
        </View>
      );
    }

    const isUpcomingSection =
      item.type === "booking" &&
      flatListData.some(
        (e, idx) =>
          e.type === "header" &&
          e.title === "Upcoming Bookings" &&
          flatListData.indexOf(item) > idx,
      );

    return (
      <StaycationBookingCard
        bookingId={item.data.id}
        isFarmhouse={true}
        isUpcoming={isUpcomingSection}
        onCancelPress={handleCancel}
        {...item.data}
      />
    );
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <StaycationHeader
          title={activeVenue?.name || "Staycation Venue"}
          subtitle="Bookings"
          imageSource={
            activeVenue?.cover_image_url ? { uri: activeVenue.cover_image_url } : USER_PROFILE
          }
        />

        <View style={styles.bookingsTabsRow}>
          <Text weight="bold" style={styles.bookingsHeaderText}>
            Bookings
          </Text>
          <PillTabs
            variant="dark"
            tabs={venues.map(v => v.tabLabel || v.name)}
            activeTab={activeVenue?.tabLabel || ""}
            onTabChange={label => {
              const selected = venues.find(v => v.tabLabel === label);
              if (selected) setActiveVenueId(selected.id);
            }}
            style={styles.typeTabs}
          />
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.availableDot} />
            <Text weight="bold" style={styles.legendText}>
              Available
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.manuelDot]} />
            <Text weight="bold" style={styles.legendText}>
              Blocked
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, styles.onlineDot]} />
            <Text weight="bold" style={styles.legendText}>
              Booked
            </Text>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            current={new Date().toISOString().split("T")[0]}
            markingType={"custom"}
            // ADDED FIX: Strictly hide extra days from other months
            hideExtraDays={true}
            markedDates={{
              ...markedDates,
              [selectedDate || ""]: {
                ...(markedDates[selectedDate || ""] || {}),
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            onDayPress={day =>
              setSelectedDate(day.dateString === selectedDate ? null : day.dateString)
            }
            renderArrow={direction => (
              <Text style={styles.calendarArrow}>{direction === "left" ? "<" : ">"}</Text>
            )}
            theme={calendarTheme}
          />
        </View>

        <View style={styles.bookingsForMonthHeader}>
          <Text weight="bold" style={styles.bookingsForMonthTitle}>
            {selectedDate
              ? `Bookings for ${new Date(selectedDate).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                })}`
              : `Bookings For ${new Date().toLocaleString("en-US", { month: "long" })}`}
          </Text>
          {selectedDate && (
            <TouchableOpacity onPress={() => setSelectedDate(null)}>
              <X size={ms(20)} color={COLORS.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [venues, activeVenue, markedDates, setActiveVenueId, selectedDate, setSelectedDate],
  );

  return (
    <View style={styles.root}>
      {isLoading && venues.length === 0 ? (
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
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setIsOfflineSheetVisible(true)}>
        <Plus size={ms(30)} color={COLORS.text.inverse} strokeWidth={2} />
      </TouchableOpacity>

      <StaycationOfflineBookingSheet
        visible={isOfflineSheetVisible}
        onClose={() => setIsOfflineSheetVisible(false)}
        onSuccess={refetch}
        activeCategory="Farmhouse"
        venueId={activeVenue?.venueId || ""}
      />
    </View>
  );
};

const calendarTheme = {
  backgroundColor: COLORS.background,
  calendarBackground: COLORS.background,
  textSectionTitleColor: "#b3b3b3",
  selectedDayBackgroundColor: COLORS.primary,
  selectedDayTextColor: COLORS.text.inverse,
  todayTextColor: "black",
  dayTextColor: "black",
  textDisabledColor: "transparent", // ADDED FIX: Ensuring extra days are completely invisible
  monthTextColor: "black",
  textDayFontFamily: "Gilroy-Medium",
  textMonthFontFamily: "Gilroy-Bold",
  textDayHeaderFontFamily: "Gilroy-Bold",
  textDayFontSize: fs(13),
  textMonthFontSize: fs(16),
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
    dayTextAtIndex5: { color: "#009bff" },
    dayTextAtIndex6: { color: "#009bff" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingLeft: 20,
      paddingRight: 20,
      marginTop: 10,
      alignItems: "center",
    },
    monthText: {
      fontFamily: "Gilroy-Bold",
      fontSize: fs(16),
      color: "black",
    },
  },
  "stylesheet.day.basic": {
    base: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    todayText: {
      color: "black",
    },
  },
} as any;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingTop: vs(10),
  },
  bookingsTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(15),
    gap: hs(230),
    minHeight: vs(40),
  },
  bookingsHeaderText: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  typeTabs: {
    flex: 1,
    marginVertical: 0,
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
    borderColor: "#B3B3B3",
  },
  manuelDot: {
    backgroundColor: "#E55959",
  },
  onlineDot: {
    backgroundColor: "#63A1FD",
  },
  legendText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  calendarContainer: {
    backgroundColor: COLORS.background,
    marginBottom: vs(10),
  },
  calendarArrow: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
  },
  bookingsForMonthHeader: {
    marginBottom: vs(10),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingsForMonthTitle: {
    fontSize: fs(20),
    color: COLORS.text.primary,
  },
  sectionHeader: {
    marginTop: vs(10),
    marginBottom: vs(5),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: vs(8),
  },
  sectionTitle: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "capitalize",
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
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: hs(0),
    bottom: vs(65),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 5px 5px rgba(0, 0, 0, 0.16)",
  },
});
