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
} from "react-native";
import { Text, PillTabs } from "@/components/ui";
import { StaycationHeader } from "./StaycationHeader";
import { StaycationBookingCard } from "./StaycationBookingCard";
import { StaycationOfflineBookingSheet } from "./StaycationOfflineBookingSheet";
import { Plus, Calendar as CalendarIcon } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { StaycationBooking } from "../types/staycation.types";
import { useStaycationResort } from "../hooks/useStaycationResort";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

interface StaycationResortContentProps {
  initialVenueId?: string;
}

type ListEntry = { type: "header"; title: string } | { type: "booking"; data: StaycationBooking };

export const StaycationResortContent = ({ initialVenueId }: StaycationResortContentProps) => {
  const {
    isLoading,
    groupedBookings,
    refetch,
    venues,
    activeVenue,
    setActiveVenueId,
    rooms,
    roomsFilled,
    cancelBooking,
  } = useStaycationResort(initialVenueId);

  const [activeRoomType, setActiveRoomType] = useState<string>("All");
  const [activeRoomStatus, setActiveRoomStatus] = useState<"Check Outs" | "Bookings">("Check Outs");
  const [isOfflineSheetVisible, setIsOfflineSheetVisible] = useState(false);

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

  const roomTypeOptions = useMemo(() => {
    const types = new Set<string>(["All"]);
    rooms.forEach(r => {
      const nameParts = r.room_name.split(" ");
      if (nameParts.length > 1) {
        types.add(nameParts[0]);
      } else {
        types.add(r.room_name);
      }
    });
    return Array.from(types);
  }, [rooms]);

  const flatListData = useMemo(() => {
    const data: ListEntry[] = [];

    groupedBookings.forEach(section => {
      let filteredBookings = section.data;

      // Apply room type filter
      if (activeRoomType !== "All") {
        filteredBookings = filteredBookings.filter(b => b.roomName?.includes(activeRoomType));
      }

      // Apply status filter
      const sectionsToShow =
        activeRoomStatus === "Check Outs"
          ? ["Check outs", "Upcoming Bookings"]
          : ["Today's Bookings", "Upcoming Bookings"];

      if (!sectionsToShow.includes(section.title)) return;

      if (filteredBookings.length > 0) {
        data.push({ type: "header", title: section.title });
        filteredBookings.forEach(b => {
          data.push({ type: "booking", data: b });
        });
      }
    });

    return data;
  }, [groupedBookings, activeRoomStatus, activeRoomType]);

  const renderItem = ({ item }: { item: ListEntry }) => {
    if (item.type === "header") {
      return (
        <View style={[styles.sectionHeader, { marginTop: vs(10) }]}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </View>
        </View>
      );
    }

    const isUpcomingSection =
      item.type === "booking" &&
      flatListData.some(
        (e, idx) =>
          e.type === "header" &&
          e.title === "Upcoming Bookings" &&
          flatListData.indexOf(item) > idx,
      );

    return (
      <StaycationBookingCard
        bookingId={item.data.id}
        isFarmhouse={false}
        isUpcoming={isUpcomingSection}
        onCancelPress={handleCancel}
        {...item.data}
      />
    );
  };

  const listHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <StaycationHeader
          title={activeVenue?.name || "Staycation Venue"}
          subtitle="Bookings"
          imageSource={
            activeVenue?.cover_image_url ? { uri: activeVenue.cover_image_url } : USER_PROFILE
          }
        />

        <View style={styles.bookingsTabsRow}>
          <Text weight="bold" style={styles.bookingsHeaderText}>
            Bookings
          </Text>
          <PillTabs
            variant="dark"
            tabs={venues.map(v => v.tabLabel || v.name)}
            activeTab={activeVenue?.tabLabel || ""}
            onTabChange={label => {
              const selected = venues.find(v => v.tabLabel === label);
              if (selected) setActiveVenueId(selected.id);
            }}
            style={styles.typeTabs}
          />
        </View>

        <View style={styles.roomsFiltersContainer}>
          <View style={styles.typesToggleContainer}>
            <Text weight="bold" style={styles.typesToggleLabel}>
              Types
            </Text>
            <View style={styles.typesSegmentedControl}>
              {roomTypeOptions.map(type => {
                const isActive = activeRoomType === type;
                const label = type === "All" ? "All" : `${type} Rooms`;
                const textLines = label.split(" ");
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

            <View style={styles.dateRight}>
              <Text weight="semiBold" style={styles.todayText}>
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                (Today)
              </Text>
              <CalendarIcon size={ms(16)} color={COLORS.text.primary} />
            </View>
          </View>

          <View style={styles.roomsFilledContainer}>
            <Text weight="semiBold" style={styles.roomsFilledLabel}>
              Rooms Filled
            </Text>
            <Text weight="semiBold" style={styles.roomsFilledValue}>
              {roomsFilled.occupied}/{roomsFilled.total}
            </Text>
          </View>
        </View>
      </View>
    ),
    [
      venues,
      activeVenue,
      activeRoomType,
      activeRoomStatus,
      roomTypeOptions,
      roomsFilled,
      setActiveVenueId,
    ],
  );

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingTop: vs(10),
  },
  bookingsTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(15),
    gap: hs(240),
    minHeight: vs(40),
  },
  bookingsHeaderText: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  typeTabs: {
    flex: 1,
    marginVertical: 0,
  },
  roomsFiltersContainer: {
    gap: vs(12),
    marginBottom: vs(10),
  },
  typesToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(4),
  },
  typesToggleLabel: {
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
    justifyContent: "center",
  },
  typeSegmentText: {
    fontSize: fs(12),
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
    paddingHorizontal: hs(14),
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
    paddingHorizontal: hs(4),
  },
  roomsFilledLabel: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  roomsFilledValue: {
    fontSize: fs(14),
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
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "capitalize",
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
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: hs(0),
    bottom: vs(65),
    width: ms(60),
    height: ms(60),
    borderRadius: ms(30),
    backgroundColor: "#63A1FD",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 5px 5px rgba(0, 0, 0, 0.16)",
  },
});
