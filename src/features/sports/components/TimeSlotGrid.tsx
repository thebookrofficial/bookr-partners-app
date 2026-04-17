// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

export type SlotStatus = "available" | "online" | "manual" | "unavailable";

export interface TimeSlotData {
  id: string;
  time: string;
  status: SlotStatus;
}

interface TimeSlotGridProps {
  slots: TimeSlotData[];
  onSlotPress?: (slot: TimeSlotData) => void;
}

export const TimeSlotGrid = ({ slots, onSlotPress }: TimeSlotGridProps) => {
  return (
    <View style={styles.grid}>
      {slots.map(slot => {
        const isAvailable = slot.status === "available";
        const isOnline = slot.status === "online";
        const isManual = slot.status === "manual";
        const isUnavailable = slot.status === "unavailable";

        return (
          <TouchableOpacity
            key={slot.id}
            activeOpacity={0.7}
            disabled={isUnavailable}
            onPress={() => onSlotPress?.(slot)}
            style={[
              styles.slot,
              isAvailable && styles.slotAvailable,
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
    backgroundColor: COLORS.danger, // #E55959
  },
  slotUnavailable: {
    backgroundColor: "#E5E5E5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
});
