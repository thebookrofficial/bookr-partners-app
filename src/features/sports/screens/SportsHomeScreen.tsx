// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { LegendIndicator } from "../components/LegendIndicator";
import {
  TimeSlotGrid,
  // TimeSlotData
} from "../components/TimeSlotGrid";
import { BookingCard } from "../components/BookingCard";
import { Calendar as CalendarIcon, Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, SportsTabParamList } from "@/navigation/navigation.types";
import { OfflineBookingSheet } from "../components/OfflineBookingSheet";
import { useSportsHome } from "../hooks/useSportsHome";
import { Calendar } from "react-native-calendars";

// --- DUMMY DATA MATCHING FIGMA ---
// const DUMMY_SLOTS: TimeSlotData[] = [
//   { id: "1", time: "7 AM", status: "unavailable" },
//   { id: "2", time: "8 AM", status: "unavailable" },
//   { id: "3", time: "9 AM", status: "unavailable" },
//   { id: "4", time: "10 AM", status: "unavailable" },
//   { id: "5", time: "11 AM", status: "unavailable" },
//   { id: "6", time: "12 AM", status: "unavailable" }, // Note: usually 12 PM, keeping Figma text
//   { id: "7", time: "1 Pm", status: "available" },
//   { id: "8", time: "2 Pm", status: "available" },
//   { id: "9", time: "3 Pm", status: "available" },
//   { id: "10", time: "4 Pm", status: "available" },
//   { id: "11", time: "5 Pm", status: "available" },
//   { id: "12", time: "6 Pm", status: "available" },
//   { id: "13", time: "7 Pm", status: "online" },
//   { id: "14", time: "8 PM", status: "manual" },
//   { id: "15", time: "9 Pm", status: "online" },
//   { id: "16", time: "10 Pm", status: "online" },
//   { id: "17", time: "11 PM", status: "manual" },
//   { id: "18", time: "12 Am", status: "manual" },
// ];

export const SportsHomeScreen = () => {
  // const [activeGround, setActiveGround] = useState("Ground 1");
  // const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // 1. Extract serviceId from route params
  const route = useRoute<RouteProp<SportsTabParamList, "SportsHome">>();
  const { serviceId } = route.params;

  // 2. Fetch dynamic venue and grounds
  const {
    venue,
    grounds,
    activeGroundId,
    setActiveGroundId,
    selectedDate,
    setSelectedDate,
    slots,
    slotsLoading,
    bookings, // <-- Extract new states
    bookingsLoading, // <-- Extract new states
    loading,
  } = useSportsHome(serviceId);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // 3. Format Dynamic Date (e.g., "Today, 19 Apr 2026")
  const getFormattedDate = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const dateString = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return isToday ? `Today, ${dateString}` : dateString;
  };

  if (loading || !venue) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // 4. Map active ground name for PillTabs
  // const activeGroundName = grounds.find(g => g.id === activeGroundId)?.name || "";

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        {/* 1. Header */}
        <ServiceHeader
          title={venue.name}
          category={venue.vertical}
          imageUri={venue.cover_image_url || undefined}
        />

        {/* 2. Date Selector */}
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => {
            setIsDatePickerOpen(true);
          }}
          activeOpacity={0.7}>
          <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
            {getFormattedDate(selectedDate)}
          </Text>
          <CalendarIcon size={ms(16)} color="#00327B" />
        </TouchableOpacity>

        {/* 3. Ground Selector */}
        {grounds.length > 1 && (
          <View style={styles.groundTabs}>
            <PillTabs
              tabs={grounds.map(g => g.name)}
              activeTab={grounds.find(g => g.id === activeGroundId)?.name || ""}
              onTabChange={selectedName => {
                const selectedGround = grounds.find(g => g.name === selectedName);
                if (selectedGround) {
                  setActiveGroundId(selectedGround.id);
                }
              }}
              variant="primary"
            />
          </View>
        )}

        {/* 4. Time Slots Section */}
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          TIME SLOT
        </Text>
        <LegendIndicator />

        {slotsLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.loaderStyle} />
        ) : slots.length === 0 ? (
          <Text variant="body2" color={COLORS.text.secondary} style={styles.emptySlotsText}>
            No slots generated for this date/ground yet.
          </Text>
        ) : (
          <TimeSlotGrid
            slots={slots as any}
            selectedDate={selectedDate} // <-- Add this prop!
            onSlotPress={_slot => {
              // We will wire up the tap actions in the next step!
              // TODO: Open bottom sheet or navigate to slot details in Section 5
            }}
          />
        )}

        {/* 5. Bookings List */}
        <View style={styles.bookingsContainer}>
          {bookingsLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.loaderStyle} />
          ) : bookings.length === 0 ? (
            <Text variant="body2" color={COLORS.text.secondary} style={styles.emptySlotsText}>
              No bookings found for this date.
            </Text>
          ) : (
            bookings.map(booking => (
              <BookingCard
                key={booking.id}
                name={booking.name}
                phone={booking.phone}
                date={booking.date}
                time={booking.time}
                price={booking.price}
                status={booking.status}
                avatarUrl={booking.avatarUrl}
                isOfflineRecord={booking.isOfflineRecord}
                onPress={() => navigation.navigate("BookingDetails", { bookingId: booking.id })}
              />
            ))
          )}
        </View>

        {/* Bottom Spacer for the Absolute Tab Bar + FAB */}
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {/* 6. Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setIsBottomSheetOpen(true)}>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>

      <OfflineBookingSheet
        isVisible={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      />

      <Modal
        visible={isDatePickerOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}>
        {/* Clicking the dark overlay closes the modal */}
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerOpen(false)}>
          <View style={styles.calendarContainer}>
            <Calendar
              // Format current date to YYYY-MM-DD for the calendar
              current={selectedDate.toISOString().split("T")[0]}
              minDate={new Date().toISOString().split("T")[0]} // Prevents booking in the past
              onDayPress={(day: any) => {
                // Convert timestamp back to standard Date object
                setSelectedDate(new Date(day.timestamp));
                setIsDatePickerOpen(false);
              }}
              markedDates={{
                [selectedDate.toISOString().split("T")[0]]: {
                  selected: true,
                  selectedColor: COLORS.primary,
                },
              }}
              theme={{
                todayTextColor: COLORS.primary,
                arrowColor: COLORS.primary,
                textDayFontFamily: "Gilroy-SemiBold", // Matches your brand
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
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(6),
    marginBottom: vs(6),
  },
  groundTabs: {
    marginTop: -vs(10), // Adjusting PillTabs default margin to match Figma tightness
    marginBottom: vs(10),
  },
  emptySlotsText: {
    textAlign: "center",
    marginVertical: vs(20),
  },
  loaderStyle: {
    marginVertical: vs(20),
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginBottom: vs(6),
  },
  bookingsContainer: {
    marginTop: vs(20),
    width: "100%",
  },
  fab: {
    position: "absolute",
    right: hs(12),
    bottom: vs(95), // Sits right above the 73px tab bar
    width: ms(58),
    height: ms(58),
    borderRadius: ms(29),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
