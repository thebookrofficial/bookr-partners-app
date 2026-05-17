// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { ChevronUp, FileText, Calendar } from "lucide-react-native";
import { EventBookingCard } from "./EventBookingCard";
import { useNavigation } from "@react-navigation/native";

const DEFAULT_AVATAR = require("../../../assets/icons/ic-user-profile.png");

interface BookingData {
  id: string;
  name: string;
  passType: string;
  time: string;
  date: string;
  avatarUrl?: string;
}

interface EventBookingListProps {
  bookings: BookingData[];
  onBookingPress?: (booking: BookingData) => void;
  onPress?: (booking: BookingData) => void; // FIXED: Added standard onPress to satisfy TypeScript
}

export const EventBookingList = ({ bookings, onBookingPress, onPress }: EventBookingListProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigation = useNavigation<any>();

  // Group bookings by date
  const groupedBookings = bookings.reduce((acc, booking) => {
    if (!acc[booking.date]) {
      acc[booking.date] = [];
    }
    acc[booking.date].push(booking);
    return acc;
  }, {} as Record<string, BookingData[]>);

  // Sort dates descending (newest dates first)
  const dates = Object.keys(groupedBookings).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <View style={styles.container}>
      {/* ALL BOOKINGS TITLE */}
      <Text weight="bold" style={styles.sectionTitle}>
        ALL BOOKINGS
      </Text>

      {/* Booking List Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <FileText size={ms(24)} color={COLORS.primary} />
          <Text weight="bold" style={styles.headerTitle}>
            Booking List
          </Text>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => setIsCollapsed(!isCollapsed)}>
          <Text weight="semiBold" style={styles.headerActionText}>
            {isCollapsed ? "Show" : "Hide"}
          </Text>
          <View style={isCollapsed ? styles.rotatedIcon : null}>
            <ChevronUp size={ms(16)} color={COLORS.text.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {!isCollapsed && (
        <View style={styles.listContainer}>
          {dates.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text weight="medium" style={styles.emptyStateText}>
                No bookings found for this event.
              </Text>
            </View>
          ) : (
            dates.map(date => (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={styles.dateHeaderLeft}>
                    <Calendar size={ms(20)} color={COLORS.primary} />
                    <Text weight="bold" style={styles.dateText}>
                      {date}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.dateHeaderRight} activeOpacity={0.7}>
                    <Text weight="semiBold" style={styles.dateActionText}>
                      All
                    </Text>
                    <ChevronUp size={ms(16)} color={COLORS.text.primary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardsWrapper}>
                  {groupedBookings[date].map(booking => (
                    <EventBookingCard
                      key={booking.id}
                      name={booking.name}
                      passType={booking.passType}
                      time={booking.time}
                      avatarSource={booking.avatarUrl ? { uri: booking.avatarUrl } : DEFAULT_AVATAR}
                      onPress={() => {
                        // Bulletproof click handler: Tries both prop names, or falls back to direct navigation
                        if (onBookingPress) {
                          onBookingPress(booking);
                        } else if (onPress) {
                          onPress(booking);
                        } else {
                          navigation.navigate("EventEntryDetails", { entryId: booking.id });
                        }
                      }}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: ms(6),
    gap: vs(10),
  },
  sectionTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "uppercase",
    marginBottom: vs(10),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: vs(24),
    marginBottom: vs(10),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    flex: 1,
  },
  headerTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(2),
  },
  headerActionText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  rotatedIcon: {
    transform: [{ rotate: "180deg" }],
  },
  listContainer: {
    gap: vs(15),
  },
  emptyStateContainer: {
    paddingVertical: vs(30),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
  },
  emptyStateText: {
    fontSize: fs(14),
    color: COLORS.text.muted,
  },
  dateGroup: {
    gap: vs(10),
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: vs(40),
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  dateHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(2),
  },
  dateText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
    textTransform: "capitalize",
  },
  dateActionText: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  cardsWrapper: {
    gap: vs(10),
  },
});
