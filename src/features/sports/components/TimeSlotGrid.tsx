// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, LayoutChangeEvent } from "react-native";
import { Text } from "@/components/ui";
import { ChevronRight, ChevronDown } from "lucide-react-native";
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
  isNested?: boolean; // Determines if it renders as a flat grid or categorized accordions
}

const NUM_COLUMNS = 6;
const SLOT_GAP = hs(10);

// ----------------------------------------------------
// HELPER COMPONENT: Render a single Slot Pill
// ----------------------------------------------------
const SlotPill = ({
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
);

// ----------------------------------------------------
// HELPER COMPONENT: Accordion Section
// ----------------------------------------------------
const SlotAccordion = ({ title, data, selectedDate, onSlotPress, slotWidth }: any) => {
  const [isOpen, setIsOpen] = useState(false);

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
        style={styles.accordionHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}>
        <Text style={styles.accordionTitle}>{title}</Text>
        {isOpen ? (
          <ChevronDown size={ms(20)} color="#000" />
        ) : (
          <ChevronRight size={ms(20)} color="#000" />
        )}
      </TouchableOpacity>

      {isOpen && (
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
};

export const TimeSlotGrid = ({
  slots,
  selectedDate,
  onSlotPress,
  isNested = false,
}: TimeSlotGridProps) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const slotWidth = useMemo(() => {
    if (!containerWidth) return 0;
    return (containerWidth - (NUM_COLUMNS - 1) * SLOT_GAP) / NUM_COLUMNS;
  }, [containerWidth]);

  const now = new Date();
  const isToday =
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear();

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // If Nested (Pickleball/Cricket), Group the Data!
  if (isNested) {
    const morningSlots = slots.filter(s => {
      const h = parseInt(s.raw_start_time?.split(":")[0] || "0", 10);
      return h < 12;
    });
    const afternoonSlots = slots.filter(s => {
      const h = parseInt(s.raw_start_time?.split(":")[0] || "0", 10);
      return h >= 12 && h < 17;
    });
    const eveningSlots = slots.filter(s => {
      const h = parseInt(s.raw_start_time?.split(":")[0] || "0", 10);
      return h >= 17;
    });

    return (
      <View style={styles.nestedContainer} onLayout={onLayout}>
        <SlotAccordion
          title="Morning Slots"
          data={morningSlots}
          selectedDate={selectedDate}
          onSlotPress={onSlotPress}
          slotWidth={slotWidth}
        />
        <SlotAccordion
          title="Afternoon Slots"
          data={afternoonSlots}
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
  }

  // Fallback to traditional flat grid for Football
  return (
    <View style={styles.grid} onLayout={onLayout}>
      {slots.map(slot => {
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
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SLOT_GAP,
    width: "100%",
    marginBottom: vs(15),
  },
  tabText: { textTransform: "capitalize", fontSize: fs(14) },

  slot: {
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
  slotOnline: { backgroundColor: COLORS.primary },
  slotManual: { backgroundColor: COLORS.danger },
  slotUnavailable: { backgroundColor: "#E5E5E5", borderWidth: 1, borderColor: "#E5E5E5" },
  slotBlocked: { backgroundColor: "#BEBEBE" },

  // Nested Accordion Styles
  nestedContainer: { width: "100%" },
  accordionContainer: { marginBottom: vs(6) },
  accordionHeader: { flexDirection: "row", alignItems: "center", gap: hs(4), marginBottom: vs(10) },
  accordionTitle: { fontFamily: "Gilroy-SemiBold", fontSize: fs(14), color: "#000" },
});
