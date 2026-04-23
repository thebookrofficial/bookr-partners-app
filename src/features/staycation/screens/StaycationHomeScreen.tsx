// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
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
    checkInDate: "16 Apr",
    checkOutDate: "17 Apr",
    guests: 3,
    price: "₹500",
    status: "Advance" as const,
  },
  {
    id: "2",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    checkInDate: "20 Apr",
    checkOutDate: "22 Apr",
    guests: 2,
    price: "₹10000",
    status: "Full" as const,
  },
  {
    id: "3",
    name: "Om Powar",
    phone: "+91 89346 93456",
    checkInDate: "23 Apr",
    checkOutDate: "24 Apr",
    guests: 3,
    price: "₹800",
    status: "Offline" as const,
  },
  {
    id: "4",
    name: "Yash Jadhav",
    phone: "+91 89346 93456",
    checkInDate: "30 Apr",
    checkOutDate: "02 May",
    guests: 2,
    price: "₹1000",
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
          style={styles.dateRow}
          onPress={() => setIsDatePickerOpen(true)}
          activeOpacity={0.7}>
          <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
            {getFormattedDate(selectedDate)}
          </Text>
          <CalendarIcon size={ms(16)} color="#00327B" />
        </TouchableOpacity>

        <View style={styles.bookingsList}>
          {MOCK_BOOKINGS.map(booking => (
            <StaycationBookingCard
              key={booking.id}
              id={booking.id}
              name={booking.name}
              phone={booking.phone}
              checkInDate={booking.checkInDate}
              checkOutDate={booking.checkOutDate}
              guests={booking.guests}
              price={booking.price}
              status={booking.status}
            />
          ))}
        </View>
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {}}>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>

      <Modal
        visible={isDatePickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerOpen(false)}>
          <View style={styles.calendarContainer}>
            <Calendar
              current={getLocalISODate(selectedDate)}
              onDayPress={(day: any) => {
                setSelectedDate(new Date(day.year, day.month - 1, day.day));
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
                textDayFontFamily: "Gilroy-SemiBold",
                textMonthFontFamily: "Gilroy-ExtraBold",
                textDayHeaderFontFamily: "Gilroy-SemiBold",
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: vs(10),
    marginBottom: vs(15),
  },
  tabWrapper: {
    flex: 1,
    marginLeft: hs(10),
  },
  categoryTitle: {
    marginBottom: vs(10),
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(6),
    marginBottom: vs(10),
  },
  bookingsList: {
    width: "100%",
  },
  fab: {
    position: "absolute",
    right: hs(12),
    bottom: vs(95),
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
