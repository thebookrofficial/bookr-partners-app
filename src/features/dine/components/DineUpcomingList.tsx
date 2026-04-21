// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { vs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { DineBookingCard } from "./DineBookingCard";
import { DineFilterBar } from "./DineFilterBar";

interface DineUpcomingListProps {
  bookings: any[];
  filter: string;
  onFilterChange: (filter: string) => void;
  onBookingPress: (bookingId: string) => void;
}

export const DineUpcomingList = ({
  bookings,
  filter,
  onFilterChange,
  onBookingPress,
}: DineUpcomingListProps) => {
  return (
    <View style={styles.container}>
      <DineFilterBar title="Upcoming" selectedFilter={filter} onFilterChange={onFilterChange} />

      <View style={styles.listContainer}>
        {bookings.length === 0 ? (
          <Text variant="body2" color={COLORS.text.secondary} style={styles.emptyText}>
            No bookings found.
          </Text>
        ) : (
          bookings.map(booking => (
            <DineBookingCard
              key={booking.id}
              {...booking}
              onPress={() => onBookingPress(booking.id)}
            />
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  listContainer: {
    width: "100%",
  },
  emptyText: {
    textAlign: "center",
    marginTop: vs(30),
  },
});
