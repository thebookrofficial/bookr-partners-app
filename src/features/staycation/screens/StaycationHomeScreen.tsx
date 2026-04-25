// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { Calendar as CalendarIcon, Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { Calendar } from "react-native-calendars";

const MOCK_BOOKINGS = [
  {
    id: "1",
    name: "Chirag Patil",
    phone: "+91 89346 93456",
    checkIn: "16 Apr",
    checkOut: "17 Apr",
    guestCount: 3,
    amount: "500",
    status: "Advance" as const,
  },
  {
    id: "2",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    checkIn: "20 Apr",
    checkOut: "22 Apr",
    guestCount: 2,
    amount: "10000",
    status: "Full" as const,
  },
  {
    id: "3",
    name: "Om Powar",
    phone: "+91 89346 93456",
    checkIn: "23 Apr",
    checkOut: "24 Apr",
    guestCount: 3,
    amount: "800",
    status: "Offline" as const,
  },
  {
    id: "4",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    checkIn: "30 Apr",
    checkOut: "02 May",
    guestCount: 2,
    amount: "1000",
    status: "Advance" as const,
  },
];

export const StaycationHomeScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState("Private Rooms");
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 3, 16)); // Apr 16, 2026
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const categories = ["Private Rooms", "Delux Rooms", "Cottages"];

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        <StaycationHeader title="Hilltop Mountain Resort" />

        <View style={styles.sectionHeader}>
          <Text variant="body1" weight="bold" color={COLORS.text.primary}>
            Bookings
          </Text>
          <View style={styles.tabWrapper}>
            <PillTabs
              tabs={categories}
              activeTab={selectedCategory}
              onTabChange={setSelectedCategory}
              variant="primary"
            />
          </View>
        </View>

        <Text variant="body1" weight="bold" style={styles.categoryTitle}>
          {selectedCategory}
        </Text>

        <TouchableOpacity
          style={styles.dateSelector}
          activeOpacity={0.7}
          onPress={() => setIsDatePickerOpen(!isDatePickerOpen)}>
          <Text variant="body2" weight="semiBold" color="#00327B">
            {getFormattedDate(selectedDate)}
          </Text>
          <CalendarIcon size={ms(16)} color="#00327B" />
        </TouchableOpacity>

        {isDatePickerOpen && (
          <View style={styles.calendarWrapper}>
            <Calendar
              current={getLocalISODate(selectedDate)}
              onDayPress={day => {
                setSelectedDate(new Date(day.timestamp));
                setIsDatePickerOpen(false);
              }}
              markedDates={{
                [getLocalISODate(selectedDate)]: {
                  selected: true,
                  selectedColor: COLORS.primary,
                },
              }}
              theme={{
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
              }}
            />
          </View>
        )}

        <View style={styles.bookingsList}>
          {MOCK_BOOKINGS.map(booking => (
            <StaycationBookingCard
              key={booking.id}
              id={booking.id}
              name={booking.name}
              phone={booking.phone}
              checkIn={booking.checkIn}
              checkOut={booking.checkOut}
              guestCount={booking.guestCount}
              amount={booking.amount}
              status={booking.status}
            />
          ))}
        </View>
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Plus size={ms(24)} color={COLORS.text.inverse} strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    marginTop: vs(20),
  },
  tabWrapper: {
    marginTop: vs(12),
  },
  categoryTitle: {
    marginTop: vs(20),
    textTransform: "uppercase",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E6EFFF",
    paddingHorizontal: hs(12),
    paddingVertical: vs(6),
    borderRadius: ms(6),
    gap: hs(8),
    marginTop: vs(16),
  },
  calendarWrapper: {
    marginTop: vs(10),
    borderRadius: ms(10),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  bookingsList: {
    marginTop: vs(20),
  },
  fab: {
    position: "absolute",
    right: hs(20),
    bottom: vs(100),
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
