// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo, memo, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { Text } from "@/components/ui";
import { ChevronDown, ChevronUp } from "lucide-react-native";
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
        color={isAvailable ? COLORS.text.primary : isUnavailable ? "#BEBEBE" : COLORS.text.inverse}
        align="center"
        style={styles.tabText}>
        {slot.time}
      </Text>
    </TouchableOpacity>
  ),
);

// ----------------------------------------------------
// HELPER COMPONENT: Accordion Section
// ----------------------------------------------------
const SlotAccordion = memo(({ title, data, selectedDate, onSlotPress, slotWidth }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(`@TimeSlotGrid_isOpen_${title}`);
        if (stored !== null) {
          setIsOpen(stored === "true");
        }
      } catch (e) {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, [title]);

  const toggleOpen = useCallback(async () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    try {
      await AsyncStorage.setItem(`@TimeSlotGrid_isOpen_${title}`, newValue.toString());
    } catch (e) {
      // ignore
    }
  }, [isOpen, title]);

  const now = new Date();
  const isToday =
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  if (data.length === 0) return null;

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={[styles.accordionHeader, isOpen && { marginBottom: vs(12) }]}
        onPress={toggleOpen}
        activeOpacity={0.7}>
        <Text style={styles.accordionTitle}>{title}</Text>
        <View style={styles.accordionActionWrapper}>
          <Text style={styles.accordionActionText}>{isOpen ? "Hide" : "Show"}</Text>
          {isOpen ? (
            <ChevronUp size={ms(18)} color="#000" />
          ) : (
            <ChevronDown size={ms(18)} color="#000" />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && isLoaded && (
        <View style={styles.grid}>
          {data.map((slot: TimeSlotData) => {
            let isPast = false;
            if (isToday && slot.raw_start_time) {
              const [hours, minutes] = slot.raw_start_time.split(":").map(Number);
              if (hours < currentHour || (hours === currentHour && minutes < currentMinutes)) {
                isPast = true;
              }
            }

            const isUnavailable = isPast || slot.status === "maintenance";
            const isAvailable = !isUnavailable && slot.status === "available";
            const isBlocked = !isUnavailable && slot.status === "blocked";
            const isOnline = !isUnavailable && slot.status === "booked" && !slot.isManualBooking;
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
});

export const TimeSlotGrid = memo(
  ({ slots: rawSlots, selectedDate, onSlotPress }: TimeSlotGridProps) => {
    const [containerWidth, setContainerWidth] = useState(0);

    const slots = useMemo(() => {
      const slotsByHour: { [hour: number]: TimeSlotData[] } = {};

      rawSlots.forEach(slot => {
        if (!slot.raw_start_time) return;
        const h = parseInt(slot.raw_start_time.split(":")[0], 10);
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
        const ampm = h >= 12 && h < 24 ? "PM" : "AM";
        const timeStr = `${displayHour} ${ampm}`;

        const representative = group[0];

        result.push({
          id: representative.id,
          time: timeStr,
          status,
          raw_start_time: `${h.toString().padStart(2, "0")}:00:00`,
          isManualBooking,
        });
      });

      return result;
    }, [rawSlots]);

    const onLayout = (event: LayoutChangeEvent) => {
      setContainerWidth(event.nativeEvent.layout.width);
    };

    const slotWidth = useMemo(() => {
      if (!containerWidth) return 0;
      return (containerWidth - (NUM_COLUMNS - 1) * SLOT_GAP) / NUM_COLUMNS;
    }, [containerWidth]);

    // Group Data into Day and Evening Slots
    const { daySlots, eveningSlots } = useMemo(() => {
      return {
        daySlots: slots.filter(s => {
          const h = parseInt(s.raw_start_time?.split(":")[0] || "0", 10);
          return h < 18;
        }),
        eveningSlots: slots.filter(s => {
          const h = parseInt(s.raw_start_time?.split(":")[0] || "0", 10);
          return h >= 18;
        }),
      };
    }, [slots]);

    return (
      <View style={styles.nestedContainer} onLayout={onLayout}>
        <SlotAccordion
          title="Day Slots"
          data={daySlots}
          selectedDate={selectedDate}
          onSlotPress={onSlotPress}
          slotWidth={slotWidth}
        />
        <SlotAccordion
          title="Evening Slots"
          data={eveningSlots}
          selectedDate={selectedDate}
          onSlotPress={onSlotPress}
          slotWidth={slotWidth}
        />
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
    height: vs(30),
    borderRadius: ms(25),
    justifyContent: "center",
    alignItems: "center",
  },

  slotAvailable: {
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  slotOnline: { backgroundColor: COLORS.primary },
  slotManual: { backgroundColor: COLORS.danger },
  slotUnavailable: { backgroundColor: "#E5E5E5", borderWidth: 1, borderColor: "#E5E5E5" },
  slotBlocked: { backgroundColor: "#BEBEBE" },

  // Nested Accordion Styles
  nestedContainer: { width: "100%" },
  accordionContainer: {
    marginBottom: vs(12),
    backgroundColor: "#F4F7FC",
    borderRadius: ms(12),
    paddingHorizontal: hs(12),
    paddingVertical: vs(10),
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionTitle: { fontFamily: "Gilroy-Bold", fontSize: fs(16), color: "#000" },
  accordionActionWrapper: { flexDirection: "row", alignItems: "center", gap: hs(4) },
  accordionActionText: { fontSize: fs(14), color: "#000", fontFamily: "Gilroy-Medium" },
});
