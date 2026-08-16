// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { EventBookingCard } from "./EventBookingCard";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "lucide-react-native";

const DEFAULT_AVATAR = require("../../../assets/icons/ic-user-profile.png");

interface BookingData {
  id: string;
  name: string;
  passType: string;
  time: string;
  date: string;
  avatarUrl?: string;
  isSpot?: boolean;
  phone?: string;
  price?: number;
}

interface EventBookingListProps {
  bookings: BookingData[];
  onBookingPress?: (booking: BookingData) => void;
  onPress?: (booking: BookingData) => void; // FIXED: Added standard onPress to satisfy TypeScript
}

export const EventBookingList = ({ bookings, onBookingPress, onPress }: EventBookingListProps) => {
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
                <TouchableOpacity style={styles.dateHeaderRight} activeOpacity={0.7} />
              </View>
              <View style={styles.cardsWrapper}>
                {groupedBookings[date].map(booking => (
                  <EventBookingCard
                    key={booking.id}
                    name={booking.name}
                    passType={booking.passType}
                    time={booking.time}
                    isSpot={booking.isSpot}
                    phone={booking.phone}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: ms(6),
  },
  sectionTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "uppercase",
    marginBottom: vs(10),
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
