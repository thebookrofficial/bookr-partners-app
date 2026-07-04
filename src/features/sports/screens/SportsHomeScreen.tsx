// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { LegendIndicator } from "../components/LegendIndicator";
import { TimeSlotGrid } from "../components/TimeSlotGrid";
import { BookingCard } from "../components/BookingCard";
import { Calendar as CalendarIcon, Plus } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import {
  RouteProp,
  useNavigation,
  useRoute,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { OfflineBookingSheet } from "../components/OfflineBookingSheet";
import { useSportsHome } from "../hooks/useSportsHome";
import { useServiceStore } from "@/store/serviceStore";
import { Calendar } from "react-native-calendars";

export const SportsHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<any, any>>();

  const { selectedCategories, setServiceCategory, activeServiceId, setActiveServiceId } =
    useServiceStore();

  // 1. Get Service ID (Priority: Route -> Store)
  const serviceId = route.params?.serviceId || activeServiceId;

  // 2. Get Category (Priority: Route -> Store)
  const routeCategory = route.params?.category;
  const storedCategory = selectedCategories[serviceId];
  const selectedCategory = routeCategory || storedCategory || "Football";

  // Sync activeServiceId with store
  useEffect(() => {
    if (serviceId && serviceId !== activeServiceId) {
      setActiveServiceId(serviceId);
    }
  }, [serviceId, activeServiceId, setActiveServiceId]);

  // Sync route param with store if we arrived via a deep link or specific tab click
  useEffect(() => {
    if (routeCategory && routeCategory !== storedCategory) {
      setServiceCategory(serviceId, routeCategory);
    }
  }, [routeCategory, serviceId, storedCategory, setServiceCategory]);

  const {
    venue,
    grounds,
    activeGroundId,
    setActiveGroundId,
    selectedDate,
    setSelectedDate,
    slots,
    slotsLoading,
    bookings,
    bookingsLoading,
    loading,
    availableCategories,
    refresh,
  } = useSportsHome(serviceId, selectedCategory);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const shouldReOpenSheet = React.useRef(false);

  const { activeVenueName, setActiveVenueName } = useServiceStore();
  const isFocused = useIsFocused();

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    if (isFocused && shouldReOpenSheet.current) {
      // Delay opening to ensure navigation transition is complete and any previous modal is fully dismissed
      const timer = setTimeout(() => {
        setIsBottomSheetOpen(true);
        shouldReOpenSheet.current = false;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  useEffect(() => {
    if (venue?.name) {
      setActiveVenueName(venue.name);
    }
  }, [venue?.name, setActiveVenueName]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Auto-select the first available category if the current one isn't valid for this vendor
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(selectedCategory)) {
      setServiceCategory(serviceId, availableCategories[0]);
    }
  }, [availableCategories, selectedCategory, serviceId, setServiceCategory]);

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

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={refreshing}
        onRefresh={onRefresh}>
        {/* Dropdown action removed, now it functions as a static label */}
        <ServiceHeader
          title={venue?.name || activeVenueName}
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : undefined}
        />

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : !venue ? (
          <View style={styles.centerContainer}>
            <Text
              variant="body1"
              weight="semiBold"
              color={COLORS.text.muted}
              style={styles.emptyVenueText}>
              No {selectedCategory} facility has been set up for this club yet.
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.dateRow}
              onPress={() => setIsDatePickerOpen(true)}
              activeOpacity={0.7}>
              <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
                {getFormattedDate(selectedDate)}
              </Text>
              <CalendarIcon size={ms(18)} color="#00327B" />
            </TouchableOpacity>

            {grounds.length > 0 && (
              <View style={styles.groundTabs}>
                <PillTabs
                  tabs={grounds.map(g => g.name)}
                  activeTab={grounds.find(g => g.id === activeGroundId)?.name || ""}
                  onTabChange={selectedName => {
                    const selectedGround = grounds.find(g => g.name === selectedName);
                    if (selectedGround) setActiveGroundId(selectedGround.id);
                  }}
                  variant="primary"
                />
              </View>
            )}

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
                selectedDate={selectedDate}
                isNested={
                  selectedCategory === "Pickleball" &&
                  slots.some((s: any) => s.duration_minutes === 30)
                }
                onSlotPress={_slot => {}}
              />
            )}

            <Text
              variant="body1"
              weight="bold"
              style={[styles.sectionTitle, { marginTop: vs(24) }]}>
              BOOKINGS
            </Text>

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
                    isDisabled={booking.isDisabled}
                    isPaymentPending={booking.isPaymentPending}
                    onPress={() => navigation.navigate("BookingDetails", { bookingId: booking.id })}
                  />
                ))
              )}
            </View>
          </>
        )}
        <View style={{ height: vs(120) }} />
      </ScreenContainer>

      {!loading && venue && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => setIsBottomSheetOpen(true)}>
          <Plus size={ms(30)} color={COLORS.text.inverse} />
        </TouchableOpacity>
      )}

      {venue && (
        <OfflineBookingSheet
          isVisible={isBottomSheetOpen}
          onClose={() => setIsBottomSheetOpen(false)}
          venueId={venue.id}
          _groundId={activeGroundId}
          selectedDate={selectedDate}
          _sportsType={selectedCategory}
          onCheckHistory={() => {
            shouldReOpenSheet.current = true;
            setIsBottomSheetOpen(false);
          }}
          onSuccess={() => {
            setIsBottomSheetOpen(false);
            refresh();
          }}
        />
      )}

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
              minDate={getLocalISODate(new Date())}
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
    paddingHorizontal: hs(20),
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: hs(12),
    marginBottom: vs(10),
    borderRadius: ms(12),
    backgroundColor: "rgba(99, 161, 253, 0.08)",
  },
  groundTabs: { marginTop: -vs(10), marginBottom: vs(10) },
  emptySlotsText: { textAlign: "center", marginVertical: vs(20) },
  loaderStyle: { marginVertical: vs(20) },
  sectionTitle: { textTransform: "uppercase", marginBottom: vs(6) },
  bookingsContainer: { marginTop: vs(8), width: "100%" },
  fab: {
    position: "absolute",
    right: hs(16),
    bottom: vs(110),
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
    width: "95%",
    maxWidth: ms(420),
    backgroundColor: COLORS.background,
    borderRadius: ms(16),
    padding: ms(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyVenueText: {
    textAlign: "center",
  },
});
