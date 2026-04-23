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
import { DineUpcomingList } from "../components/DineUpcomingList";
import { DinePaymentsList } from "../components/DinePaymentsList";
import { DineOfflineBookingSheet } from "../components/DineOfflineBookingSheet";
import { useDineHome } from "../hooks/useDineHome";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * DineHomeScreen - Modularized for pixel-perfect accuracy.
 * Matches Figma frame 6:77570.
 */
export const DineHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<DineTabParamList, "DineHome">>();

  // Safely resolve serviceId from params or parent navigator
  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = (navigation as any).getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "DineServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const {
    initialLoading,
    bookingsLoading,
    paymentsLoading,
    venue,
    selectedDate,
    setSelectedDate,
    bookings,
    payments,
    activeTab,
    setActiveTab,
    filter,
    setFilter,
    refreshBookings,
    refresh,
  } = useDineHome(serviceId);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

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

  const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleBookingPress = (bookingId: string) => {
    navigation.navigate("DineBookingDetails", {
      bookingId,
      isFromPayment: false,
    });
  };

  const handlePaymentPress = (paymentId: string) => {
    navigation.navigate("DineBookingDetails", {
      bookingId: paymentId,
      isFromPayment: true,
    });
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}>
        {/* 1. Header Section */}
        <ServiceHeader
          title={venue?.name || "Hotel tikka lab"}
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />

        {initialLoading ? (
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
              <CalendarIcon size={ms(16)} color="#00327B" />
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

            {/* 4. List Section (Conditional Rendering with local loaders) */}
            <View style={styles.listSection}>
              {activeTab === "Upcoming" ? (
                bookingsLoading ? (
                  <View style={styles.localLoaderContainer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  <DineUpcomingList
                    bookings={bookings}
                    filter={filter}
                    onFilterChange={setFilter}
                    onBookingPress={handleBookingPress}
                  />
                )
              ) : paymentsLoading ? (
                <View style={styles.localLoaderContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : (
                <DinePaymentsList payments={payments} onPaymentPress={handlePaymentPress} />
              )}
            </View>
          </>
        )}
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {/* Floating Action Button */}
      {activeTab === "Upcoming" && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => setIsBookingSheetOpen(true)}>
          <Plus size={ms(30)} color={COLORS.text.inverse} />
        </TouchableOpacity>
      )}

      {/* Offline Booking Sheet */}
      <DineOfflineBookingSheet
        isVisible={isBookingSheetOpen}
        onClose={() => setIsBookingSheetOpen(false)}
        venueId={serviceId}
        selectedDate={selectedDate}
        onSuccess={() => {
          setIsBookingSheetOpen(false);
          // Small delay to ensure DB consistency before manual refresh
          setTimeout(() => {
            refreshBookings();
          }, 500);
        }}
      />

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
  localLoaderContainer: {
    paddingVertical: vs(50),
    justifyContent: "center",
    alignItems: "center",
  },
  listSection: {
    minHeight: vs(300),
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
    fontSize: ms(16),
    width: hs(205),
    color: COLORS.text.primary,
  },
  pillTabsWrapper: {
    flex: 1,
    marginVertical: 0,
  },
  fab: {
    position: "absolute",
    right: hs(12),
    bottom: vs(95),
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
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
