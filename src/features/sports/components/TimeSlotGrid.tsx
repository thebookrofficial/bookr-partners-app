// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// Aligning with our Supabase 'slot_status' enum
export type DbSlotStatus = "available" | "booked" | "blocked" | "maintenance";

export interface TimeSlotData {
  id: string;
  time: string;
  status: DbSlotStatus | string;
  raw_start_time?: string; // e.g. "14:00:00" from DB
  isManualBooking?: boolean;
}

interface TimeSlotGridProps {
  slots: TimeSlotData[];
  selectedDate: Date; // Needed to calculate if slots have passed today
  onSlotPress?: (slot: TimeSlotData) => void;
}

export const TimeSlotGrid = ({ slots, selectedDate, onSlotPress }: TimeSlotGridProps) => {
  // Get current time to disable past slots if viewing 'Today'
  const now = new Date();
  const isToday =
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  return (
    <View style={styles.grid}>
      {slots.map(slot => {
        // 1. Check if the slot has already passed
        let isPast = false;
        if (isToday && slot.raw_start_time) {
          const [hours, minutes] = slot.raw_start_time.split(":").map(Number);
          if (hours < currentHour || (hours === currentHour && minutes < currentMinutes)) {
            isPast = true;
          }
        }

        // 2. Map Database status to UI styles
        // Past slots OR maintenance slots are completely unavailable
        const isUnavailable = isPast || slot.status === "maintenance";
        const isAvailable = !isUnavailable && slot.status === "available";
        const isBlocked = !isUnavailable && slot.status === "blocked";
        const isOnline = !isUnavailable && slot.status === "booked" && !slot.isManualBooking;
        const isManual = !isUnavailable && slot.status === "booked" && slot.isManualBooking;
        return (
          <TouchableOpacity
            key={slot.id}
            activeOpacity={0.7}
            disabled={isUnavailable}
            onPress={() => onSlotPress?.(slot)}
            style={[
              styles.slot,
              isAvailable && styles.slotAvailable,
              isBlocked && styles.slotBlocked,
              isOnline && styles.slotOnline,
              isManual && styles.slotManual,
              isUnavailable && styles.slotUnavailable,
            ]}>
            <Text
              variant="body2"
              weight="semiBold"
              color={
                isAvailable ? COLORS.text.primary : isUnavailable ? "#BEBEBE" : COLORS.text.inverse
              }
              style={styles.tabText}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: hs(10),
    width: "100%",
  },
  tabText: { textTransform: "capitalize" },
  slot: {
    width: hs(59),
    height: vs(25),
    borderRadius: ms(25),
    justifyContent: "center",
    alignItems: "center",
  },
  slotAvailable: {
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  slotOnline: {
    backgroundColor: COLORS.primary,
  },
  slotManual: {
    backgroundColor: "#E57C59", // Matched with Legend manual color
  },
  slotUnavailable: {
    backgroundColor: "#E5E5E5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  slotBlocked: {
    // Rename slotManual to slotBlocked for 'blocked' status
    backgroundColor: "#BEBEBE",
  },
});
