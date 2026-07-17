// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs, CustomDatePickerModal } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { LegendIndicator } from "../components/LegendIndicator";
import { TimeSlotGrid } from "../components/TimeSlotGrid";
import { BookingCard } from "../components/BookingCard";
import { Calendar as CalendarIcon, Plus, ChevronDown, ChevronUp } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RouteProp, useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { OfflineBookingSheet } from "../components/OfflineBookingSheet";
import { useSportsHome } from "../hooks/useSportsHome";
import { useServiceStore } from "@/store/serviceStore";

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
  }, [routeCategory, storedCategory, serviceId, setServiceCategory]);

  const [selectedView, setSelectedView] = useState<
    "Today Bookings" | "Upcoming Bookings" | "Bookings"
  >("Today Bookings");

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
  } = useSportsHome(serviceId, selectedCategory, selectedView);

  // Handle incoming targetDate for navigation redirects (e.g. from Reschedule/Repeat)
  useEffect(() => {
    if (route.params?.targetDate) {
      setSelectedDate(new Date(route.params.targetDate));
      navigation.setParams({ targetDate: undefined } as any);
    }
  }, [route.params?.targetDate, setSelectedDate, navigation]);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const shouldReOpenSheet = React.useRef(false);

  const { activeVenueName, setActiveVenueName } = useServiceStore();
  const isFocused = useIsFocused();

  const hasRefreshedOnFocus = React.useRef(false);

  useEffect(() => {
    if (isFocused) {
      if (!hasRefreshedOnFocus.current) {
        refresh();
        hasRefreshedOnFocus.current = true;
      }
    } else {
      hasRefreshedOnFocus.current = false;
    }
  }, [isFocused, refresh]);

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
          subtitle="Home"
          category={selectedCategory}
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : undefined}
        />

        {loading ||
        (slotsLoading && slots.length === 0) ||
        (bookingsLoading && bookings.length === 0) ? (
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
            {isDropdownOpen ? (
              <View style={styles.expandedDateRowContainer}>
                <View style={styles.expandedDateHeaderRow}>
                  <TouchableOpacity
                    style={styles.expandedDateTitle}
                    activeOpacity={0.7}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setIsDropdownOpen(false);
                    }}>
                    <Text
                      variant="body1"
                      weight="bold"
                      color={COLORS.text.primary}
                      style={{ fontSize: fs(20) }}>
                      Bookings
                    </Text>
                    <ChevronUp size={ms(20)} color={COLORS.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.expandedDateSelector}
                    activeOpacity={0.7}
                    onPress={() => setIsDatePickerOpen(true)}>
                    <Text
                      variant="body1"
                      weight="semiBold"
                      color={COLORS.text.primary}
                      style={{ fontSize: fs(16) }}>
                      {getFormattedDate(selectedDate)}
                    </Text>
                    <CalendarIcon size={ms(20)} color="#00327B" />
                  </TouchableOpacity>
                </View>
                <View style={styles.expandedDivider} />
                <TouchableOpacity
                  style={styles.expandedDropdownItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedDate(new Date());
                    setSelectedView("Upcoming Bookings");
                    setIsDropdownOpen(false);
                  }}>
                  <Text
                    variant="body1"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={{ fontSize: fs(16) }}>
                    Upcoming Bookings
                  </Text>
                  <Text style={styles.expandedPlusIcon}>+</Text>
                </TouchableOpacity>
                <View style={styles.expandedDivider} />
                <TouchableOpacity
                  style={styles.expandedDropdownItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setSelectedDate(new Date());
                    setSelectedView("Today Bookings");
                    setIsDropdownOpen(false);
                  }}>
                  <Text
                    variant="body1"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={{ fontSize: fs(16) }}>
                    Today Bookings
                  </Text>
                  <Text style={styles.expandedPlusIcon}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateRowLeft}
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsDropdownOpen(true);
                  }}>
                  <Text
                    variant="body1"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={{ fontSize: fs(18) }}>
                    {selectedView}
                  </Text>
                  <ChevronDown size={ms(20)} color={COLORS.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setIsDatePickerOpen(true)}
                  activeOpacity={0.7}>
                  <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
                    {getFormattedDate(selectedDate)}
                  </Text>
                  <CalendarIcon size={ms(20)} color="#00327B" />
                </TouchableOpacity>
              </View>
            )}

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

            {(selectedView === "Today Bookings" || selectedView === "Bookings") && (
              <>
                <Text variant="body1" weight="bold" style={styles.sectionTitle}>
                  TIME SLOT
                </Text>
                <LegendIndicator />

                {slotsLoading && slots.length > 0 ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                    style={styles.loaderStyle}
                  />
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
                    onSlotPress={slot => {
                      if (slot.status === "booked" || slot.status === "blocked") {
                        if (!slot.raw_start_time) return; // Prevent TS undefined error
                        const foundBooking = bookings.find(b => {
                          if (!b.startTimeRaw || !b.endTimeRaw) return false;
                          // Non-null assertion (!) is safe here since we just checked
                          return (
                            slot.raw_start_time! >= b.startTimeRaw &&
                            slot.raw_start_time! < b.endTimeRaw
                          );
                        });

                        if (foundBooking) {
                          setHighlightedBookingId(foundBooking.id);
                          setTimeout(() => setHighlightedBookingId(null), 3000);
                        }
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* Bookings Title Removed per Figma */}

            <View style={styles.bookingsContainer}>
              {bookingsLoading && bookings.length > 0 ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={styles.loaderStyle} />
              ) : bookings.length === 0 ? (
                <Text variant="body2" color={COLORS.text.secondary} style={styles.emptySlotsText}>
                  No bookings found for this date.
                </Text>
              ) : (
                <>
                  {(selectedView === "Upcoming Bookings" || selectedView === "Bookings") && (
                    <Text variant="body2" weight="bold" style={styles.dateGroupHeader}>
                      {getFormattedDate(selectedDate)}
                    </Text>
                  )}
                  {bookings.map(booking => (
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
                      isHighlighted={highlightedBookingId === booking.id}
                      onPress={() =>
                        navigation.navigate("BookingDetails", { bookingId: booking.id })
                      }
                    />
                  ))}
                </>
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

      <CustomDatePickerModal
        isVisible={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={date => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSelectedDate(date);
          setSelectedView("Bookings");
        }}
      />
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
    paddingVertical: vs(10),
    paddingHorizontal: hs(10),
    marginBottom: vs(10),
    borderRadius: ms(10),
    backgroundColor: "#F4F7FC",
  },
  dateRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  groundTabs: {
    marginBottom: vs(15),
  },
  expandedDateRowContainer: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(9),
    paddingHorizontal: hs(12),
    paddingVertical: vs(14),
    marginBottom: vs(15),
    width: "100%",
  },
  expandedDateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(10),
  },
  expandedDateTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  expandedDateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  expandedDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    width: "100%",
  },
  expandedDropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
  },
  expandedPlusIcon: {
    fontSize: fs(24),
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  dateGroupHeader: {
    marginTop: vs(5),
    marginBottom: vs(10),
    fontSize: fs(14),
  },
  emptySlotsText: { textAlign: "center", marginVertical: vs(20) },
  loaderStyle: { marginVertical: vs(20) },
  sectionTitle: { textTransform: "uppercase", marginBottom: vs(6) },
  bookingsContainer: { marginTop: vs(8), width: "100%" },
  fab: {
    position: "absolute",
    right: hs(16),
    bottom: vs(140),
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
  emptyVenueText: {
    textAlign: "center",
  },
});
