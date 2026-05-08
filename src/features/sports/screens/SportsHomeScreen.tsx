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
import { RouteProp, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList, SportsTabParamList } from "@/navigation/navigation.types";
import { OfflineBookingSheet } from "../components/OfflineBookingSheet";
import { useSportsHome } from "../hooks/useSportsHome";
import { useServiceStore } from "@/store/serviceStore";
import { Calendar } from "react-native-calendars";

export const SportsHomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<SportsTabParamList, "SportsHome">>();
  const { serviceId } = route.params;

  const { selectedCategories, setServiceCategory } = useServiceStore();
  const selectedCategory = selectedCategories[serviceId] || "Football";

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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

  const { activeVenueName, setActiveVenueName } = useServiceStore();

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh]),
  );

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
        <ServiceHeader
          // title={venue?.name || "Loading..."}
          title={venue?.name || activeVenueName}
          category={selectedCategory}
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : undefined}
          // ONLY pass the press handler if there are multiple options
          onCategoryPress={
            availableCategories.length > 1 ? () => setIsCategoryOpen(!isCategoryOpen) : undefined
          }
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
              <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                {getFormattedDate(selectedDate)}
              </Text>
              <CalendarIcon size={ms(16)} color="#00327B" />
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

      {/* --- DYNAMIC OVERLAY DROPDOWN --- */}
      {isCategoryOpen && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsCategoryOpen(false)}
          />
          <View style={styles.dropdownMenu}>
            {availableCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                activeOpacity={0.7}
                onPress={() => {
                  setServiceCategory(serviceId, cat);
                  setIsCategoryOpen(false);
                }}>
                <Text variant="body2" weight="semiBold">
                  {cat}
                </Text>
                <View style={styles.radioOuter}>
                  {selectedCategory === cat && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
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
    paddingVertical: vs(6),
    marginBottom: vs(6),
  },
  groundTabs: { marginTop: -vs(10), marginBottom: vs(10) },
  emptySlotsText: { textAlign: "center", marginVertical: vs(20) },
  loaderStyle: { marginVertical: vs(20) },
  sectionTitle: { textTransform: "uppercase", marginBottom: vs(6) },
  bookingsContainer: { marginTop: vs(20), width: "100%" },
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
  dropdownOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, elevation: 1000 },
  dropdownMenu: {
    position: "absolute",
    top: vs(55),
    right: hs(12),
    backgroundColor: COLORS.background,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    width: hs(180),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: hs(6),
    gap: vs(6),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
    borderRadius: ms(8),
  },
  radioOuter: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: COLORS.text.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: COLORS.text.primary,
  },
  emptyVenueText: {
    textAlign: "center",
  },
});
