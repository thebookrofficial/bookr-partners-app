// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { Text } from "@/components/ui";
import { StaycationHeader } from "./StaycationHeader";
import { StaycationBookingCard } from "./StaycationBookingCard";
import { StaycationOfflineBookingSheet } from "./StaycationOfflineBookingSheet";
import { Plus, Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react-native";
import { useServiceStore } from "@/store";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";
import { useStaycationResort } from "../hooks/useStaycationResort";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface StaycationResortContentProps {
  initialVenueId?: string;
}

type ListEntry =
  | { type: "header"; title: string; occupiedCount?: number; totalCount?: number }
  | { type: "booking"; data: StaycationBooking; sectionTitle: string };

export const StaycationResortContent = ({ initialVenueId }: StaycationResortContentProps) => {
  const { activeVenueName } = useServiceStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeRoomType, setActiveRoomType] = useState("All");
  const [activeRoomStatus, setActiveRoomStatus] = useState<"Check Outs" | "Bookings">("Check Outs");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const effectiveDate = useMemo(() => {
    if (activeRoomStatus === "Check Outs") {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    return selectedDate;
  }, [activeRoomStatus, selectedDate]);

  // CRITICAL FIX: Passed activeRoomType to the hook so occupancy updates dynamically!
  const {
    isLoading,
    closedDates,
    groupedBookings,
    refetch,
    venues,
    activeVenue,
    rooms,
    cancelBooking,
  } = useStaycationResort(initialVenueId, effectiveDate, activeRoomType);

  const isDateClosed = useMemo(() => {
    const dStr = selectedDate.toISOString().split("T")[0];
    return closedDates.has(dStr);
  }, [selectedDate, closedDates]);

  const [isOfflineSheetVisible, setIsOfflineSheetVisible] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel this booking?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => cancelBooking(id),
      },
    ]);
  };

  const uniqueRoomTypes = useMemo(() => {
    const types = new Set<string>();
    rooms?.forEach(r => types.add(r.room_name));
    return ["All", ...Array.from(types)];
  }, [rooms]);

  const flatListData = useMemo(() => {
    const data: ListEntry[] = [];

    groupedBookings.forEach((section: any) => {
      let filteredBookings = section.data;

      if (activeRoomType !== "All") {
        filteredBookings = filteredBookings.filter((b: any) =>
          b.roomName?.includes(activeRoomType),
        );
      }

      const isTargetSection =
        section.title.includes("Today") || section.title.includes("Bookings for");
      const isCheckOutSection = section.title.toLowerCase().includes("check out");
      const isUpcomingSection = section.title.includes("Upcoming");

      let shouldShow = false;
      if (activeRoomStatus === "Check Outs") {
        // Today tab: Show Check-ins and Check-outs
        shouldShow = isCheckOutSection || isTargetSection;
      } else {
        // Upcoming tab: Only show Upcoming sections
        shouldShow = isUpcomingSection;
      }

      if (shouldShow && filteredBookings.length > 0) {
        data.push({
          type: "header",
          title: section.title,
          occupiedCount: section.occupiedCount,
          totalCount: section.totalCount,
        });

        // Only add bookings if section is not collapsed
        if (!collapsedSections.has(section.title)) {
          filteredBookings.forEach((b: any) => {
            data.push({ type: "booking", data: b, sectionTitle: section.title });
          });
        }
      }
    });

    return data;
  }, [groupedBookings, activeRoomStatus, activeRoomType, collapsedSections]);

  const renderItem = ({ item }: { item: ListEntry }) => {
    if (item.type === "header") {
      let displayTitle = item.title;
      const isCheckOut = item.title.toLowerCase().includes("check out");
      const isCheckIn = item.title.includes("Today") || item.title.includes("Bookings for");
      const isUpcoming = item.title.includes("Upcoming:");

      if (isCheckOut) {
        displayTitle = "Check-Out";
      } else if (isCheckIn) {
        displayTitle = "Check-In";
      } else if (isUpcoming) {
        // Strip the "Upcoming: " prefix for cleaner display if desired,
        // or just keep it. The prompt says "wrap the bookings under the date".
        displayTitle = item.title.replace("Upcoming: ", "");
      }

      const isCollapsed = collapsedSections.has(item.title);

      return (
        <TouchableOpacity
          activeOpacity={isUpcoming ? 0.7 : 1}
          onPress={() => isUpcoming && toggleSection(item.title)}
          style={[styles.sectionHeader, { marginTop: vs(10) }]}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>{displayTitle}</Text>

            {isUpcoming && (
              <View style={styles.headerRight}>
                <View style={styles.occupancyBadge}>
                  <Text weight="semiBold" style={styles.occupancyText}>
                    {item.occupiedCount}/{item.totalCount}
                  </Text>
                </View>
                {isCollapsed ? (
                  <ChevronDown size={ms(20)} color={COLORS.text.primary} />
                ) : (
                  <ChevronUp size={ms(20)} color={COLORS.text.primary} />
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    const selectedDateStr = selectedDate.toISOString().split("T")[0];
    const isCheckOutSection = item.sectionTitle.toLowerCase().includes("check out");
    const isUpcoming = item.data.checkIn !== selectedDateStr || isCheckOutSection;

    return (
      <StaycationBookingCard
        // CRITICAL FIX: Pass the real dbId if available, fallback to id
        bookingId={item.data.dbId || item.data.id}
        isFarmhouse={false}
        isUpcoming={isUpcoming}
        onCancelPress={() => handleCancel(item.data.dbId || item.data.id)}
        {...item.data}
        checkIn={isCheckOutSection ? item.data.checkOut : item.data.checkIn}
        roomName={item.data.roomName}
      />
    );
  };

  const listHeader = useMemo(() => {
    const isToday = new Date().toDateString() === selectedDate.toDateString();
    const dateLabel = isToday ? "(Today)" : "";

    return (
      <View style={styles.headerContainer}>
        <StaycationHeader
          title={activeVenue?.name || activeVenueName}
          subtitle="Bookings"
          imageSource={
            activeVenue?.cover_image_url ? { uri: activeVenue.cover_image_url } : USER_PROFILE
          }
        />

        <View style={styles.roomTypesRow}>
          <Text style={styles.typesLabel}>Types</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.roomTypesScroll}>
            {uniqueRoomTypes.map((type, index) => {
              const isActive = activeRoomType === type;
              const lines = type === "All" ? ["All"] : type.split(" ");
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.typePill,
                    isActive ? styles.typePillActive : styles.typePillInactive,
                  ]}
                  onPress={() => setActiveRoomType(type)}>
                  <View style={styles.typePillContent}>
                    {lines.map((line, i) => (
                      <Text
                        key={i}
                        weight="semiBold"
                        style={[
                          styles.typePillText,
                          isActive ? styles.typePillTextActive : styles.typePillTextInactive,
                        ]}>
                        {line}
                      </Text>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.roomsFiltersContainer}>
          <View style={styles.statusDateRow}>
            <View style={styles.statusPills}>
              {(["Check Outs", "Bookings"] as const).map(status => {
                const isActive = activeRoomStatus === status;
                const label = status === "Check Outs" ? "Today" : "Upcoming";
                return (
                  <TouchableOpacity
                    key={status}
                    activeOpacity={0.8}
                    onPress={() => setActiveRoomStatus(status)}
                    style={[
                      styles.statusPill,
                      isActive ? styles.statusPillActive : styles.statusPillInactive,
                    ]}>
                    <Text
                      weight="semiBold"
                      style={[
                        styles.statusPillText,
                        isActive ? styles.statusPillTextActive : styles.statusPillTextInactive,
                      ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.dateRight}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}>
              <Text weight="semiBold" style={styles.todayText}>
                {selectedDate.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                {dateLabel}
              </Text>
              <CalendarIcon size={ms(16)} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {isDateClosed && (
          <View style={styles.closedDateContainer}>
            <Text weight="bold" style={styles.closedDateText}>
              This date is closed
            </Text>
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
    );
  }, [
    activeVenue,
    activeVenueName,
    activeRoomStatus,
    selectedDate,
    showDatePicker,
    isDateClosed,
    uniqueRoomTypes,
    activeRoomType,
  ]);

  return (
    <View style={styles.root}>
      {isLoading && venues.length === 0 ? (
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
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No bookings found.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setIsOfflineSheetVisible(true)}>
        <Plus size={ms(30)} color={COLORS.text.inverse} strokeWidth={2} />
      </TouchableOpacity>

      <StaycationOfflineBookingSheet
        visible={isOfflineSheetVisible}
        onClose={() => setIsOfflineSheetVisible(false)}
        onSuccess={refetch}
        activeCategory="Rooms"
        venueId={activeVenue?.venueId || ""}
      />
    </View>
  );
};

// ... keep your existing styles below ...
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { paddingTop: vs(10) },
  roomsFiltersContainer: { gap: vs(12), marginBottom: vs(10) },
  roomTypesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(12),
    marginBottom: vs(16),
  },
  typesLabel: {
    fontFamily: "Gilroy-Bold",
    fontSize: fs(16),
    color: COLORS.text.primary,
    marginRight: hs(10),
  },
  roomTypesScroll: {
    gap: hs(10),
  },
  typePill: {
    backgroundColor: "#F4F7FC",
    paddingHorizontal: hs(14),
    paddingVertical: vs(10),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    minWidth: hs(50),
  },
  typePillActive: {
    backgroundColor: "#282828",
  },
  typePillInactive: {
    backgroundColor: "#F4F7FC",
  },
  typePillContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  typePillText: {
    fontSize: fs(12),
    textAlign: "center",
    lineHeight: vs(13),
  },
  typePillTextActive: {
    color: COLORS.text.inverse,
  },
  typePillTextInactive: {
    color: "#8c8c8c",
  },
  statusDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: vs(8),
  },
  statusPills: { flexDirection: "row", gap: hs(6) },
  statusPill: { paddingHorizontal: hs(14), paddingVertical: vs(8), borderRadius: ms(6) },
  statusPillActive: { backgroundColor: "#F4F7FC", borderWidth: 1, borderColor: "#63A1FD" },
  statusPillInactive: { backgroundColor: "#F4F7FC", borderWidth: 1, borderColor: "transparent" },
  statusPillText: { fontSize: fs(14), textTransform: "capitalize" },
  statusPillTextActive: { color: "#63A1FD" },
  statusPillTextInactive: { color: COLORS.text.primary },
  dateRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    backgroundColor: "#F4F7FC",
    padding: ms(8),
    borderRadius: ms(8),
  },
  todayText: { fontSize: fs(14), color: COLORS.text.primary },
  closedDateContainer: {
    backgroundColor: "#FEF2F2",
    paddingVertical: vs(10),
    paddingHorizontal: hs(12),
    borderRadius: ms(8),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginTop: vs(4),
  },
  closedDateText: {
    fontSize: fs(14),
    color: COLORS.danger,
    textAlign: "center",
  },
  sectionHeader: { marginTop: vs(10), marginBottom: vs(5) },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: vs(8),
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  occupancyBadge: {
    backgroundColor: "#F4F7FC",
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  occupancyText: {
    fontSize: fs(12),
    color: COLORS.text.primary,
  },
  sectionTitle: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  listContent: { paddingBottom: vs(20) },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: vs(100) },
  emptyContainer: { padding: ms(32), alignItems: "center", marginTop: vs(20) },
  emptyText: { color: COLORS.text.muted, fontFamily: "Gilroy-Medium", textAlign: "center" },
  fab: {
    position: "absolute",
    right: hs(16),
    bottom: vs(110),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    zIndex: 10,
  },
});
