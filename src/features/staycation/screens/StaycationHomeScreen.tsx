// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { StaycationBookingCard } from "../components/StaycationBookingCard";
import { StaycationOfflineBookingSheet } from "../components/StaycationOfflineBookingSheet";
import { Plus, Calendar as CalendarIcon } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useStaycationHome } from "../hooks/useStaycationHome";
import { Calendar } from "react-native-calendars";
import { StaycationBooking } from "../types/staycation.types";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StaycationTabParamList } from "@/navigation/navigation.types";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

type ListEntry = { type: "header"; title: string } | { type: "booking"; data: StaycationBooking };

export const StaycationHomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<StaycationTabParamList, "StaycationHome">>();

  // State for sub-categories and filters
  const [activeCategory, setActiveCategory] = useState<"Farmhouse" | "Rooms">("Farmhouse");

  // For Rooms: "All", "Deluxe Rooms", "Private Rooms"
  const [activeRoomType, setActiveRoomType] = useState<"All" | "Deluxe Rooms" | "Private Rooms">(
    "All",
  );

  // For Rooms: "Check outs", "Bookings" pill tabs
  const [activeRoomStatus, setActiveRoomStatus] = useState<"Check outs" | "bookings">("Check outs");

  const [isOfflineSheetVisible, setIsOfflineSheetVisible] = useState(false);

  let serviceId = route.params?.serviceId;
  if (!serviceId) {
    const parentState = navigation.getParent()?.getState();
    const tabRoute = parentState?.routes.find((r: any) => r.name === "StaycationServiceTabs");
    const tabParams = tabRoute?.params as any;
    serviceId = tabParams?.serviceId || tabParams?.params?.serviceId || "";
  }

  const { isLoading, markedDates, groupedBookings, refetch, venue } = useStaycationHome(
    serviceId,
    activeCategory,
  );

  // Automatically adjust layout based on backend property_type
  useEffect(() => {
    // Only update if venue data has finished loading
    if (venue && venue.property_type) {
      // The database ENUM values are: villa, farmhouse, resort, hotel, homestay
      // We explicitly check for 'farmhouse'. Everything else uses the 'Rooms' layout.
      if (venue.property_type.toLowerCase() === "farmhouse") {
        setActiveCategory("Farmhouse");
      } else {
        setActiveCategory("Rooms");
      }
    }
  }, [venue]);

  // Flatten categorized bookings for the list
  const flatListData = useMemo(() => {
    const data: ListEntry[] = [];
    groupedBookings.forEach((section: { title: string; data: StaycationBooking[] }) => {
      let headerTitle = section.title;
      if (activeCategory === "Rooms") {
        if (section.title === "Today's Check-ins") {
          return;
        }
      }

      data.push({ type: "header", title: headerTitle });

      section.data.forEach(b => {
        const enrichedData =
          activeCategory === "Rooms" ? { ...b, roomName: `Room ${data.length % 5 || 1}` } : b;
        data.push({ type: "booking", data: enrichedData });
      });
    });
    return data;
  }, [groupedBookings, activeCategory]);

  const renderItem = ({ item }: { item: ListEntry }) => {
    if (item.type === "header") {
      return (
        <View style={[styles.sectionHeader, activeCategory === "Rooms" && { marginTop: vs(0) }]}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </View>
        </View>
      );
    }
    return (
      <StaycationBookingCard
        bookingId={item.data.id}
        isFarmhouse={activeCategory === "Farmhouse"}
        {...item.data}
      />
    );
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <StaycationHeader
          title={venue?.name || "Staycation Venue"}
          subtitle="Bookings"
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
        />

        {activeCategory === "Farmhouse" ? (
          <>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={styles.availableDot} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.manuelDot]} />
                <Text style={styles.legendText}>Manuel</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.onlineDot]} />
                <Text style={styles.legendText}>Online</Text>
              </View>
            </View>

            <View style={styles.calendarContainer}>
              <Calendar
                current={new Date().toISOString().split("T")[0]}
                markingType={"custom"}
                markedDates={markedDates}
                renderArrow={direction => (
                  <Text style={styles.calendarArrow}>{direction === "left" ? "<" : ">"}</Text>
                )}
                enableSwipeMonths={true}
                disableAllTouchEventsForDisabledDays={true}
                onDayPress={() => {}} // Disabled for read-only behavior
                theme={
                  {
                    backgroundColor: COLORS.background,
                    calendarBackground: COLORS.background,
                    textSectionTitleColor: "#b3b3b3",
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: COLORS.text.inverse,
                    todayTextColor: "black",
                    dayTextColor: "black",
                    textDisabledColor: "transparent",
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
                  } as any
                }
              />
            </View>

            <View style={styles.bookingsHeader}>
              <Text style={styles.bookingsTitle}>Booking For April</Text>
            </View>
          </>
        ) : (
          <View style={styles.roomsFiltersContainer}>
            {/* Types Toggle */}
            <View style={styles.typesToggleContainer}>
              <Text style={styles.typesToggleLabel}>Types</Text>
              <View style={styles.typesSegmentedControl}>
                {(["All", "Deluxe Rooms", "Private Rooms"] as const).map(type => {
                  const isActive = activeRoomType === type;
                  const textLines = type === "All" ? ["All"] : type.split(" ");
                  return (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.8}
                      onPress={() => setActiveRoomType(type)}
                      style={[
                        styles.typeSegment,
                        isActive ? styles.typeSegmentActive : styles.typeSegmentInactive,
                      ]}>
                      <View style={styles.typeTextWrapper}>
                        {textLines.map((line, idx) => (
                          <Text
                            key={idx}
                            weight="semiBold"
                            style={[
                              styles.typeSegmentText,
                              isActive
                                ? styles.typeSegmentTextActive
                                : styles.typeSegmentTextInactive,
                            ]}>
                            {line}
                          </Text>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Check outs / Bookings and Date */}
            <View style={styles.statusDateRow}>
              <View style={styles.statusPills}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveRoomStatus("Check outs")}
                  style={[
                    styles.statusPill,
                    activeRoomStatus === "Check outs"
                      ? styles.statusPillActive
                      : styles.statusPillInactive,
                  ]}>
                  <Text
                    weight="semiBold"
                    style={[
                      styles.statusPillText,
                      activeRoomStatus === "Check outs"
                        ? styles.statusPillTextActive
                        : styles.statusPillTextInactive,
                    ]}>
                    Check outs
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setActiveRoomStatus("bookings")}
                  style={[
                    styles.statusPill,
                    activeRoomStatus === "bookings"
                      ? styles.statusPillActive
                      : styles.statusPillInactive,
                  ]}>
                  <Text
                    weight="semiBold"
                    style={[
                      styles.statusPillText,
                      activeRoomStatus === "bookings"
                        ? styles.statusPillTextActive
                        : styles.statusPillTextInactive,
                    ]}>
                    bookings
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateRight}>
                <Text weight="semiBold" style={styles.todayText}>
                  23 Apr 2026 (Today)
                </Text>
                <CalendarIcon size={ms(16)} color={COLORS.text.primary} />
              </View>
            </View>

            {/* Rooms Filled */}
            <View style={styles.roomsFilledContainer}>
              <Text weight="semiBold" style={styles.roomsFilledLabel}>
                Rooms Filled
              </Text>
              <Text weight="semiBold" style={styles.roomsFilledValue}>
                3/5
              </Text>
            </View>
          </View>
        )}
      </View>
    ),
    [venue, markedDates, activeCategory, activeRoomType, activeRoomStatus],
  );

  return (
    <View style={styles.root}>
      <ScreenContainer
        scrollable={false}
        backgroundColor={COLORS.background}
        paddingHorizontal={hs(12)}>
        {isLoading && flatListData.length === 0 ? (
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
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No upcoming bookings found.</Text>
              </View>
            }
          />
        )}
      </ScreenContainer>

      {/* Basic Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
          setIsOfflineSheetVisible(true);
        }}>
        <Plus size={ms(30)} color={COLORS.text.inverse} strokeWidth={2} />
      </TouchableOpacity>

      {/* Offline Booking Sheet */}
      <StaycationOfflineBookingSheet
        visible={isOfflineSheetVisible}
        onClose={() => setIsOfflineSheetVisible(false)}
        onSuccess={refetch}
        activeCategory={activeCategory}
        venueId={serviceId || venue?.id || ""}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingTop: vs(10),
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
    borderColor: COLORS.border.navBar,
  },
  manuelDot: {
    backgroundColor: COLORS.danger,
  },
  onlineDot: {
    backgroundColor: COLORS.primary,
  },
  legendText: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  calendarContainer: {
    backgroundColor: COLORS.background,
    marginBottom: vs(20),
  },
  calendarArrow: {
    fontSize: fs(16),
    fontFamily: "Gilroy-Bold",
    color: COLORS.text.primary,
  },
  bookingsHeader: {
    marginBottom: vs(10),
  },
  bookingsTitle: {
    fontFamily: "Gilroy-Bold",
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
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  roomsFiltersContainer: {
    gap: vs(12),
    marginBottom: vs(10),
  },
  typesToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typesToggleLabel: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  typesSegmentedControl: {
    flexDirection: "row",
    gap: hs(6),
  },
  typeSegment: {
    borderRadius: ms(10),
    paddingHorizontal: hs(14),
    paddingVertical: vs(8),
    justifyContent: "center",
    alignItems: "center",
    minWidth: hs(50),
  },
  typeSegmentActive: {
    backgroundColor: "#282828",
  },
  typeSegmentInactive: {
    backgroundColor: "#F4F7FC",
  },
  typeTextWrapper: {
    alignItems: "center",
  },
  typeSegmentText: {
    fontSize: fs(12),
    lineHeight: fs(12 * 1.2),
  },
  typeSegmentTextActive: {
    color: "white",
  },
  typeSegmentTextInactive: {
    color: "#8C8C8C",
  },
  statusDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: vs(8),
  },
  statusPills: {
    flexDirection: "row",
    gap: hs(6),
  },
  statusPill: {
    paddingHorizontal: hs(10),
    paddingVertical: vs(8),
    borderRadius: ms(6),
  },
  statusPillActive: {
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "#63A1FD",
  },
  statusPillInactive: {
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusPillText: {
    fontSize: fs(14),
    textTransform: "capitalize",
  },
  statusPillTextActive: {
    color: "#63A1FD",
  },
  statusPillTextInactive: {
    color: COLORS.text.primary,
  },
  dateRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  todayText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  roomsFilledContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: vs(4),
  },
  roomsFilledLabel: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  roomsFilledValue: {
    fontSize: fs(14),
    color: COLORS.text.primary,
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
  },
  fab: {
    position: "absolute",
    right: hs(18),
    bottom: vs(100),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
});
