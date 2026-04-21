// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { Calendar as CalendarIcon, Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, DineTabParamList } from "@/navigation/navigation.types";
import { Calendar } from "react-native-calendars";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { DineBookingCard } from "../components/DineBookingCard";
import { DineFilterBar } from "../components/DineFilterBar";
import { useDineHome } from "../hooks/useDineHome";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * DineHomeScreen - Modularized for pixel-perfect accuracy.
 * Matches Figma frame 6:75684.
 */
export const DineHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<DineTabParamList, "DineHome">>();
  const { serviceId } = route.params;

  const {
    loading,
    venue,
    selectedDate,
    setSelectedDate,
    bookings,
    activeTab,
    setActiveTab,
    filter,
    setFilter,
  } = useDineHome(serviceId);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const getFormattedDate = (date: Date) => {
    const today = new Date(2026, 3, 3);
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

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
        {/* 1. Header Section */}
        <ServiceHeader
          title={venue?.name || "Hotel tikka lab"}
          category="Restaurant"
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            {/* 2. Date Selection Row */}
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setIsDatePickerOpen(true)}
              activeOpacity={0.7}>
              <Text
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.dateText}>
                {getFormattedDate(selectedDate)}
              </Text>
              <CalendarIcon size={ms(18)} color="#00327B" />
            </TouchableOpacity>

            {/* 3. Main Category Tabs (Upcoming / Payments) */}
            <View style={styles.tabSection}>
              <Text variant="h3" weight="bold" style={styles.tabSectionTitle}>
                Bookings
              </Text>
              <PillTabs
                tabs={["Upcoming", "Payments"]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                variant="dark"
                style={styles.pillTabsWrapper}
              />
            </View>

            {/* 4. Filter and List Section */}
            <DineFilterBar title={activeTab} selectedFilter={filter} onFilterChange={setFilter} />

            <View style={styles.listContainer}>
              {bookings.length === 0 ? (
                <Text variant="body2" color={COLORS.text.secondary} style={styles.emptyText}>
                  No bookings found.
                </Text>
              ) : (
                bookings.map(booking => (
                  <DineBookingCard
                    key={booking.id}
                    {...booking}
                    onPress={() =>
                      navigation.navigate("BookingDetails", {
                        bookingId: booking.id,
                      })
                    }
                  />
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {}}>
        <Plus size={ms(30)} color={COLORS.text.inverse} />
      </TouchableOpacity>

      {/* Date Picker Modal */}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(150),
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(10),
    marginBottom: vs(4),
  },
  dateText: {
    fontSize: ms(14),
  },
  tabSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(24),
    width: "100%",
  },
  tabSectionTitle: {
    fontSize: ms(18),
    width: hs(200),
    color: COLORS.text.primary,
  },
  pillTabsWrapper: {
    flex: 1,
    marginVertical: 0,
  },
  listContainer: {
    width: "100%",
  },
  emptyText: {
    textAlign: "center",
    marginTop: vs(30),
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: COLORS.background,
    borderRadius: ms(12),
    padding: ms(10),
    elevation: 5,
  },
});
