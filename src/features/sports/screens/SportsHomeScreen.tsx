// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, PillTabs, CustomDatePickerModal, Skeleton, ListSkeleton } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { LegendIndicator } from "../components/LegendIndicator";
import { TimeSlotGrid } from "../components/TimeSlotGrid";
import { BookingCard } from "../components/BookingCard";
import { Calendar as CalendarIcon, Plus, ChevronDown, ChevronUp, X } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RouteProp, useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { OfflineBookingSheet } from "../components/OfflineBookingSheet";
import { useSportsHome } from "../hooks/useSportsHome";
import { useServiceStore } from "@/store/serviceStore";
import perf from "@react-native-firebase/perf";

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
    addOptimisticBooking,
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
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTimeSlotExpanded, setIsTimeSlotExpanded] = useState(true);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingGroundId, setPendingGroundId] = useState<string | null>(null);
  const [pendingOptimisticBooking, setPendingOptimisticBooking] = useState<any>(null);
  const shouldReOpenSheet = React.useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("SportsHome_TimeSlotExpanded").then(data => {
      if (data !== null) {
        setIsTimeSlotExpanded(data === "true");
      }
    });
  }, []);

  const toggleTimeSlot = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextState = !isTimeSlotExpanded;
    setIsTimeSlotExpanded(nextState);
    AsyncStorage.setItem("SportsHome_TimeSlotExpanded", nextState.toString()).catch(e =>
      console.error("Failed to save time slot expanded state", e),
    );
  };

  const { activeVenueName, setActiveVenueName } = useServiceStore();
  const isFocused = useIsFocused();

  // --- PERFORMANCE TRACKING ---
  const mountTime = React.useRef(Date.now());
  useEffect(() => {
    if (!loading && !slotsLoading && !bookingsLoading) {
      const loadTime = ((Date.now() - mountTime.current) / 1000).toFixed(2);
      console.warn(`[PERFORMANCE] SportsHomeScreen fully loaded in ${loadTime} seconds`);

      if ((globalThis as any).otpSubmitTime) {
        const totalLoginTime = ((Date.now() - (globalThis as any).otpSubmitTime) / 1000).toFixed(2);
        console.warn(
          `[PERFORMANCE] Loaded from OTP Submit to SportsHomeScreen in ${totalLoginTime} seconds`,
        );
        delete (globalThis as any).otpSubmitTime;
      }
    }
  }, [loading, slotsLoading, bookingsLoading]);
  // ----------------------------

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
  }, [venue, activeVenueName, setActiveVenueName, isFocused, refresh]);

  // If a pending ground ID was set after a category change, select it once grounds load
  useEffect(() => {
    if (pendingGroundId && grounds.length > 0) {
      const found = grounds.find(g => g.id === pendingGroundId);
      if (found) {
        setActiveGroundId(pendingGroundId);
        setPendingGroundId(null);
      }
    }
  }, [grounds, pendingGroundId, setActiveGroundId]);

  // Inject the optimistic booking once the right ground is loaded and active
  useEffect(() => {
    if (
      pendingOptimisticBooking &&
      activeGroundId === pendingOptimisticBooking.ground_id &&
      !bookingsLoading
    ) {
      addOptimisticBooking(pendingOptimisticBooking);
      setPendingOptimisticBooking(null);
    }
  }, [pendingOptimisticBooking, activeGroundId, bookingsLoading, addOptimisticBooking]);

  useEffect(() => {
    if (route.params?.openBookingSheet && venue) {
      // Delay opening to ensure navigation transition is complete and any previous modal is fully dismissed
      const timer = setTimeout(() => {
        setIsBottomSheetOpen(true);
        shouldReOpenSheet.current = false;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isFocused, route.params?.openBookingSheet, venue]);

  useEffect(() => {
    if (venue?.name) {
      setActiveVenueName(venue.name);
    }
  }, [venue?.name, setActiveVenueName]);

  const onRefresh = async () => {
    setRefreshing(true);
    const trace = await perf().startTrace("home_data_refresh");
    try {
      await refresh();
    } finally {
      await trace.stop();
      setRefreshing(false);
    }
  };

  // Auto-select the first available category if the current one isn't valid for this vendor
  useEffect(() => {
    if (availableCategories.length > 0) {
      const isValid = availableCategories.some(
        c => c.toLowerCase() === selectedCategory.toLowerCase(),
      );
      if (!isValid) {
        setServiceCategory(serviceId, availableCategories[0]);
        if (route.params?.category) {
          navigation.setParams({ category: undefined } as any);
        }
      }
    }
  }, [
    availableCategories,
    selectedCategory,
    serviceId,
    setServiceCategory,
    route.params?.category,
    navigation,
  ]);

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

  const enrichedSlots = React.useMemo(() => {
    return slots.map((slot: any) => {
      if (slot.status === "booked") {
        const foundBooking = bookings.find((b: any) => {
          if (!b.startTimeRaw || !b.endTimeRaw) return false;
          return slot.raw_start_time >= b.startTimeRaw && slot.raw_start_time < b.endTimeRaw;
        });

        if (foundBooking) {
          const isOnline =
            foundBooking.isOnline === true ||
            (!foundBooking.isOfflineRecord && foundBooking.sports_booking_type !== "offline");

          return { ...slot, isManualBooking: !isOnline };
        }
      }
      return slot;
    });
  }, [slots, bookings]);

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        hideTabBarOnScroll>
        <Pressable
          style={styles.flex1}
          onPress={() => {
            if (isDropdownOpen) setIsDropdownOpen(false);
            if (isCategoryDropdownOpen) setIsCategoryDropdownOpen(false);
          }}
          accessible={false}>
          <View style={styles.headerZIndex}>
            <ServiceHeader
              title={venue?.name || activeVenueName}
              subtitle="Home"
              category={selectedCategory}
              imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : undefined}
              showBackBtn={false}
              onCategoryPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            />
            {isCategoryDropdownOpen && (
              <View style={styles.categoryDropdownPopover}>
                <View style={styles.popoverHeader}>
                  <Text variant="body1" weight="bold" style={styles.popoverTitle}>
                    Sports
                  </Text>
                  <TouchableOpacity onPress={() => setIsCategoryDropdownOpen(false)}>
                    <X size={ms(20)} color="#000" />
                  </TouchableOpacity>
                </View>
                <View style={styles.popoverDivider} />
                {availableCategories.map((cat: string) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.popoverItem,
                      selectedCategory === cat && styles.popoverItemActive,
                    ]}
                    onPress={() => {
                      setServiceCategory(serviceId, cat);
                      setIsCategoryDropdownOpen(false);
                    }}>
                    <Text variant="body1" weight="medium" style={styles.popoverItemText}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!loading && !venue ? (
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
              <View style={[styles.dateRow, styles.dateRowZIndex]}>
                <TouchableOpacity
                  style={styles.dateSelectorLeft}
                  onPress={() => setIsDatePickerOpen(true)}
                  activeOpacity={0.7}>
                  <CalendarIcon size={ms(24)} color={COLORS.text.primary} strokeWidth={2} />
                  <Text
                    variant="body1"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={{ fontSize: fs(18) }}>
                    {getFormattedDate(selectedDate)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dropdownToggleWrapper}>
                  <TouchableOpacity
                    style={styles.dropdownToggle}
                    activeOpacity={0.7}
                    onPress={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <Text
                      variant="body1"
                      weight="semiBold"
                      color={COLORS.text.inverse}
                      style={{ fontSize: fs(16) }}>
                      {selectedView === "Today Bookings" ? "Today" : "Upcoming"}
                    </Text>
                    {isDropdownOpen ? (
                      <ChevronUp size={ms(20)} color={COLORS.text.inverse} strokeWidth={2.5} />
                    ) : (
                      <ChevronDown size={ms(20)} color={COLORS.text.inverse} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>

                  {isDropdownOpen && (
                    <View style={styles.dropdownPopover}>
                      <View style={styles.popoverHeader}>
                        <Text variant="body1" weight="bold" style={styles.popoverTitle}>
                          Type
                        </Text>
                        <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                          <X size={ms(20)} color="#000" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.popoverDivider} />
                      <TouchableOpacity
                        style={[
                          styles.popoverItem,
                          selectedView === "Today Bookings" && styles.popoverItemActive,
                        ]}
                        onPress={() => {
                          setSelectedDate(new Date());
                          setSelectedView("Today Bookings");
                          setIsDropdownOpen(false);
                        }}>
                        <Text variant="body1" weight="medium" style={styles.popoverItemText}>
                          Today
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.popoverItem,
                          (selectedView === "Upcoming Bookings" || selectedView === "Bookings") &&
                            styles.popoverItemActive,
                        ]}
                        onPress={() => {
                          setSelectedView("Upcoming Bookings");
                          setIsDropdownOpen(false);
                        }}>
                        <Text variant="body1" weight="medium" style={styles.popoverItemText}>
                          Upcoming
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>

              {grounds.length > 1 && (
                <View style={styles.groundTabs}>
                  <PillTabs
                    tabs={grounds.map((g: any) => g.name)}
                    activeTab={grounds.find((g: any) => g.id === activeGroundId)?.name || ""}
                    onTabChange={selectedName => {
                      const selectedGround = grounds.find((g: any) => g.name === selectedName);
                      if (selectedGround) setActiveGroundId(selectedGround.id);
                    }}
                    variant="primary"
                  />
                </View>
              )}

              {(selectedView === "Today Bookings" || selectedView === "Bookings") && (
                <View style={styles.timeSlotWrapper}>
                  <TouchableOpacity
                    style={styles.timeSlotHeader}
                    activeOpacity={0.7}
                    onPress={toggleTimeSlot}>
                    <Text variant="body1" weight="bold" style={styles.sectionTitle}>
                      TIME SLOT
                    </Text>
                    {isTimeSlotExpanded ? (
                      <ChevronUp size={ms(20)} color="#000" />
                    ) : (
                      <ChevronDown size={ms(20)} color="#000" />
                    )}
                  </TouchableOpacity>

                  {isTimeSlotExpanded && (
                    <View style={styles.timeSlotContentContainer}>
                      <LegendIndicator />

                      {slotsLoading && slots.length === 0 ? (
                        <View style={styles.skeletonContainer}>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <Skeleton key={i} width="23%" height={vs(40)} borderRadius={ms(8)} />
                          ))}
                        </View>
                      ) : slots.length === 0 ? (
                        <Text
                          variant="body2"
                          color={COLORS.text.secondary}
                          style={styles.emptySlotsText}>
                          No slots generated for this date/ground yet.
                        </Text>
                      ) : (
                        <TimeSlotGrid
                          slots={enrichedSlots as any}
                          selectedDate={selectedDate}
                          onSlotPress={slot => {
                            if (slot.status === "booked" || slot.status === "blocked") {
                              if (!slot.raw_start_time) return;
                              const foundBooking = bookings.find((b: any) => {
                                if (!b.startTimeRaw || !b.endTimeRaw) return false;
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
                    </View>
                  )}
                </View>
              )}

              {/* Bookings Title Removed per Figma */}

              <View style={styles.bookingsContainer}>
                {bookingsLoading && bookings.length === 0 ? (
                  <View style={{ marginTop: vs(16) }}>
                    <ListSkeleton count={3} />
                  </View>
                ) : bookings.length === 0 ? (
                  <Text variant="body2" color={COLORS.text.secondary} style={styles.emptySlotsText}>
                    No bookings found for this date.
                  </Text>
                ) : (
                  <>
                    {(selectedView === "Upcoming Bookings" || selectedView === "Bookings") && (
                      <Text variant="body1" weight="bold" style={styles.dateGroupHeader}>
                        {getFormattedDate(selectedDate)}
                      </Text>
                    )}
                    {bookings.map((booking: any) => (
                      <BookingCard
                        key={booking.id}
                        name={booking.name}
                        phone={booking.phone}
                        subtitle={booking.subtitle}
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
                          navigation.navigate("BookingDetails", {
                            bookingId: booking.id,
                            idChain: booking.idChain,
                          })
                        }
                      />
                    ))}
                  </>
                )}
              </View>
            </>
          )}
          <View style={{ height: vs(120) }} />
        </Pressable>
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
          onSuccess={async optimisticData => {
            if (optimisticData) {
              // Intercept the booking's category/ground to switch views if needed
              const isDiffCat =
                optimisticData.sports_type &&
                optimisticData.sports_type.toLowerCase() !== selectedCategory.toLowerCase();

              if (isDiffCat) {
                const exactMatch =
                  availableCategories.find(
                    c => c.toLowerCase() === optimisticData.sports_type.toLowerCase(),
                  ) || optimisticData.sports_type;
                setServiceCategory(serviceId, exactMatch);
                if (route.params?.category) {
                  navigation.setParams({ category: undefined } as any);
                }
                setPendingGroundId(optimisticData.ground_id);
                setPendingOptimisticBooking(optimisticData);
              } else if (optimisticData.ground_id && optimisticData.ground_id !== activeGroundId) {
                setActiveGroundId(optimisticData.ground_id);
                setPendingOptimisticBooking(optimisticData);
              } else {
                addOptimisticBooking(optimisticData);
              }
            }
            // Supabase real-time will handle the actual refresh in the background
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
          const today = new Date();
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
          setSelectedView(isToday ? "Today Bookings" : "Bookings");
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  flex1: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: vs(150),
    paddingHorizontal: hs(20),
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: vs(8),
    marginBottom: vs(15),
  },
  dateSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  dropdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    backgroundColor: "#424242",
    paddingHorizontal: hs(14),
    paddingVertical: vs(10),
    borderRadius: ms(14),
  },
  dropdownPopover: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: vs(8),
    backgroundColor: "#FFFFFF",
    borderRadius: ms(12),
    padding: ms(12),
    minWidth: ms(140),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  popoverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  popoverTitle: {
    fontSize: fs(16),
    color: "#000",
  },
  popoverDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    width: "100%",
    marginBottom: vs(8),
  },
  popoverItem: {
    paddingVertical: vs(10),
    paddingHorizontal: hs(12),
    borderRadius: ms(8),
    marginBottom: vs(4),
  },
  popoverItemActive: {
    backgroundColor: "#F0F0F0",
  },
  popoverItemText: {
    fontSize: fs(15),
    color: "#333",
  },
  groundTabs: {
    marginBottom: vs(15),
  },
  dateGroupHeader: {
    marginTop: vs(5),
    marginBottom: vs(10),
    fontSize: fs(14),
  },
  emptySlotsText: { textAlign: "center", marginVertical: vs(20) },
  loaderStyle: { marginVertical: vs(20) },
  timeSlotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { textTransform: "uppercase", fontSize: fs(18) },
  timeSlotContentContainer: {
    overflow: "hidden",
    marginTop: vs(6),
  },
  timeSlotWrapper: {
    backgroundColor: "#F4F7FC",
    borderRadius: ms(12),
    padding: ms(12),
    marginBottom: vs(12),
  },
  dateRowZIndex: {
    zIndex: 100,
  },
  headerZIndex: {
    position: "relative",
    zIndex: 101,
  },
  categoryDropdownPopover: {
    position: "absolute",
    top: vs(60),
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: ms(12),
    padding: ms(12),
    minWidth: ms(160),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  dropdownToggleWrapper: {
    position: "relative",
    zIndex: 100,
  },
  skeletonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: vs(8),
    marginTop: vs(16),
  },
  bookingsContainer: { marginTop: vs(8), width: "100%" },
  fab: {
    position: "absolute",
    right: hs(10),
    bottom: vs(140),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
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
