// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo, memo } from "react";
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// Aligning with our Supabase 'slot_status' enum
export type DbSlotStatus = "available" | "booked" | "blocked" | "maintenance";

export interface TimeSlotData {
  id: string;
  time: string;
  status: DbSlotStatus | string;
  raw_start_time?: string; // e.g. "14:00:00" from DB
  isManualBooking?: boolean;
  mapped_hour?: number;
}

interface TimeSlotGridProps {
  slots: TimeSlotData[];
  selectedDate: Date;
  onSlotPress?: (slot: TimeSlotData) => void;
}

const NUM_COLUMNS = 6;
const SLOT_GAP = hs(10);

// ----------------------------------------------------
// HELPER COMPONENT: Render a single Slot Pill
// ----------------------------------------------------
const SlotPill = memo(
  ({
    slot,
    isUnavailable,
    isAvailable,
    isBlocked,
    isOnline,
    isManual,
    onSlotPress,
    slotWidth,
  }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isUnavailable}
      onPress={() => onSlotPress?.(slot)}
      style={[
        styles.slot,
        { width: slotWidth },
        isAvailable && styles.slotAvailable,
        isBlocked && styles.slotBlocked,
        isOnline && styles.slotOnline,
        isManual && styles.slotManual,
        isUnavailable && styles.slotUnavailable,
      ]}>
      <Text
        variant="body2"
        weight="semiBold"
        color={isAvailable ? COLORS.text.primary : isUnavailable ? "#A0A0A0" : COLORS.text.inverse}
        align="center"
        style={styles.tabText}>
        {slot.time}
      </Text>
    </TouchableOpacity>
  ),
);

// Accordion removed as per new Figma layout

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChevronDown } from "lucide-react-native";

export const TimeSlotGrid = memo(
  ({ slots: rawSlots, selectedDate, onSlotPress }: TimeSlotGridProps) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

    // Load persisted state
    React.useEffect(() => {
      AsyncStorage.getItem("TimeSlotGrid_CollapsedState").then(data => {
        if (data) {
          try {
            setCollapsedGroups(JSON.parse(data));
          } catch (e) {}
        }
      });
    }, []);

    const toggleGroup = (title: string) => {
      setCollapsedGroups(prev => {
        const newState = { ...prev, [title]: !prev[title] };
        AsyncStorage.setItem("TimeSlotGrid_CollapsedState", JSON.stringify(newState)).catch(e =>
          console.error("Failed to save slot collapse state", e),
        );
        return newState;
      });
    };

    const slots = useMemo(() => {
      const slotsByHour: { [hour: number]: TimeSlotData[] } = {};

      rawSlots.forEach(slot => {
        if (!slot.raw_start_time) return;
        let h = parseInt(slot.raw_start_time.split(":")[0], 10);

        // If hour is between 0 and 5 (12 AM to 5 AM), treat it as the next day's early morning
        // by adding 24 so it sorts at the very end of the Evening Slots list.
        if (h < 6) {
          h += 24;
        }

        if (!slotsByHour[h]) {
          slotsByHour[h] = [];
        }
        slotsByHour[h].push(slot);
      });

      const result: TimeSlotData[] = [];
      const hours = Object.keys(slotsByHour)
        .map(Number)
        .sort((a, b) => a - b);

      hours.forEach(h => {
        const group = slotsByHour[h];
        let status: DbSlotStatus = "available";
        let isManualBooking = false;

        const hasBooked = group.some(s => s.status === "booked");
        const hasBlocked = group.some(s => s.status === "blocked");
        const hasMaintenance = group.some(s => s.status === "maintenance");

        if (hasBooked) {
          status = "booked";
          isManualBooking = group.some(s => s.status === "booked" && s.isManualBooking);
        } else if (hasBlocked) {
          status = "blocked";
        } else if (hasMaintenance) {
          status = "maintenance";
        }

        const displayHour = h % 12 === 0 ? 12 : h % 12;
        // Even if h is 24, 25 (12 AM, 1 AM next day), it's AM
        const ampm = h % 24 >= 12 && h % 24 < 24 ? "PM" : "AM";
        const timeStr = `${displayHour} ${ampm}`;

        const representative = group[0];

        // Format the raw_start_time back correctly (e.g. 25 -> 01)
        const originalH = h % 24;

        result.push({
          id: representative.id,
          time: timeStr,
          status,
          raw_start_time: `${originalH.toString().padStart(2, "0")}:00:00`,
          isManualBooking,
          // Store the mapped hour so we can filter correctly for Day vs Evening slots
          mapped_hour: h,
        });
      });

      return result;
    }, [rawSlots]);

    const onLayout = (event: LayoutChangeEvent) => {
      setContainerWidth(event.nativeEvent.layout.width);
    };

    const slotWidth = useMemo(() => {
      if (!containerWidth) return 0;
      // Account for the groupContainer paddingHorizontal: ms(6) * 2
      const availableWidth = containerWidth - ms(12);
      // Floor the width to prevent sub-pixel rounding errors that cause early wrapping
      return Math.floor((availableWidth - (NUM_COLUMNS - 1) * SLOT_GAP - 1) / NUM_COLUMNS);
    }, [containerWidth]);

    // Removed unused isToday, currentHour, and now variables as we use Date objects directly within the map

    const daySlots = slots.filter((s: any) => {
      const h = s.mapped_hour;
      return h < 18;
    });

    const eveningSlots = slots.filter((s: any) => {
      const h = s.mapped_hour;
      return h >= 18;
    });

    const renderGroup = (title: string, groupData: TimeSlotData[]) => {
      if (groupData.length === 0) return null;
      const isCollapsed = !!collapsedGroups[title];

      return (
        <View style={styles.groupContainer}>
          <TouchableOpacity
            style={styles.groupHeaderRow}
            activeOpacity={0.7}
            onPress={() => toggleGroup(title)}>
            <Text variant="body1" weight="bold" style={styles.groupTitle}>
              {title}
            </Text>
            <ChevronDown
              size={ms(20)}
              color="#000"
              style={{ transform: [{ rotate: isCollapsed ? "0deg" : "180deg" }] }}
            />
          </TouchableOpacity>
          {!isCollapsed && (
            <View style={styles.grid}>
              {groupData.map((slot: any) => {
                let isPast = false;
                if (slot.raw_start_time) {
                  const [hStr, mStr] = slot.raw_start_time.split(":");
                  const parsedHour = parseInt(hStr, 10);
                  const parsedMin = parseInt(mStr, 10);

                  const slotDate = new Date(selectedDate);
                  slotDate.setHours(parsedHour, parsedMin, 0, 0);
                  if (parsedHour < 6) {
                    slotDate.setDate(slotDate.getDate() + 1);
                  }

                  isPast = slotDate <= new Date();
                }

                const isUnavailable = isPast || slot.status === "maintenance";
                const isAvailable = !isUnavailable && slot.status === "available";
                const isBlocked = !isUnavailable && slot.status === "blocked";
                const isOnline =
                  !isUnavailable && slot.status === "booked" && !slot.isManualBooking;
                const isManual = !isUnavailable && slot.status === "booked" && slot.isManualBooking;

                return (
                  <SlotPill
                    key={slot.id}
                    slot={slot}
                    isUnavailable={isUnavailable}
                    isAvailable={isAvailable}
                    isBlocked={isBlocked}
                    isOnline={isOnline}
                    isManual={isManual}
                    onSlotPress={onSlotPress}
                    slotWidth={slotWidth}
                  />
                );
              })}
            </View>
          )}
        </View>
      );
    };

    return (
      <View style={styles.nestedContainer} onLayout={onLayout}>
        {renderGroup("Day Slots", daySlots)}
        {renderGroup("Evening Slots", eveningSlots)}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SLOT_GAP,
    width: "100%",
    marginBottom: 0,
  },
  tabText: { textTransform: "capitalize", fontSize: fs(16) },

  slot: {
    height: vs(32),
    borderRadius: ms(25),
    justifyContent: "center",
    alignItems: "center",
  },

  slotAvailable: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  slotOnline: { backgroundColor: COLORS.primary },
  slotManual: { backgroundColor: COLORS.danger },
  slotUnavailable: { backgroundColor: "#EBEBEB", borderWidth: 1, borderColor: "#EBEBEB" },
  slotBlocked: { backgroundColor: "#BEBEBE" },

  // Nested Accordion Styles
  nestedContainer: { width: "100%", marginBottom: 0 },
  groupContainer: { paddingHorizontal: ms(6), marginBottom: vs(8) },
  groupHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
    paddingHorizontal: hs(6),
  },
  groupTitle: { fontSize: fs(16), color: "#000" },
});
