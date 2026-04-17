// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Calendar as CalendarIcon, Plus, ChevronRight } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

// Sub-components
import { ClosedDatesAlert } from "../components/block-unblock/ClosedDatesAlert";
import { BlockCalendar } from "../components/block-unblock/BlockCalendar";

export const BlockUnblockScreen = () => {
  const [hasUpcomingClosed, setHasUpcomingClosed] = useState(false);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [slotType, setSlotType] = useState<"Custom" | "All">("All");

  // Date States
  const [fromDate, setFromDate] = useState("06 May 2026");
  const [toDate, setToDate] = useState("12 May 2026");
  const [activeInput, setActiveInput] = useState<"from" | "to" | null>(null);

  // Time States (Frame 999)
  const [fromTime, _setFromTime] = useState("6 Am");
  const [toTime, _setToTime] = useState("4 Pm");

  const handleDateSelect = (day: number) => {
    const formattedDay = day < 10 ? `0${day}` : day;
    const newDateStr = `${formattedDay} May 2026`;

    if (activeInput === "from") {
      setFromDate(newDateStr);
      if (day > parseInt(toDate, 10)) setToDate(newDateStr);
      setActiveInput("to");
    } else {
      if (day < parseInt(fromDate, 10)) setFromDate(newDateStr);
      setToDate(newDateStr);
      setActiveInput(null);
    }
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ServiceHeader title="Elite Strikers Club" subtitle="Block / Unblock" />

        {/* 1. CLOSED DATES */}
        <View style={styles.section}>
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            CLOSED DATES
          </Text>
          <ClosedDatesAlert
            hasUpcoming={hasUpcomingClosed}
            dateRange={`${fromDate.split(" 20")[0]} - ${toDate}`}
            timeRange={slotType === "Custom" ? `${fromTime} - ${toTime}` : "All Day"}
            onClear={() => setHasUpcomingClosed(false)}
          />
        </View>

        {/* 2. SET CLOSE DATE */}
        <View style={styles.section}>
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            SET CLOSE DATE
          </Text>

          <View style={styles.fieldGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Select Upcoming Close Days
            </Text>

            {isSelectingRange ? (
              <View>
                <View style={styles.splitRow}>
                  <TouchableOpacity
                    style={[
                      styles.inputBoxAction,
                      activeInput === "from" && styles.inputBoxActive,
                      styles.flex1,
                    ]}
                    onPress={() => setActiveInput("from")}>
                    <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                      {fromDate}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.inputBoxAction,
                      activeInput === "to" && styles.inputBoxActive,
                      styles.flex1,
                    ]}
                    onPress={() => setActiveInput("to")}>
                    <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                      {toDate}
                    </Text>
                  </TouchableOpacity>
                </View>

                {activeInput && (
                  <View style={styles.calendarContainer}>
                    <BlockCalendar
                      fromDate={fromDate}
                      toDate={toDate}
                      onSelectDate={handleDateSelect}
                    />
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.inputBox}
                onPress={() => {
                  setIsSelectingRange(true);
                  setActiveInput("from");
                }}>
                <CalendarIcon size={ms(20)} color={COLORS.primary} />
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={COLORS.text.muted}
                  style={styles.flex1}>
                  Select Dates...
                </Text>
                <Plus size={ms(24)} color={COLORS.text.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Slot Type Selector */}
          <View style={styles.fieldGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Select Closed Slots
            </Text>
            <View style={styles.splitRow}>
              <TouchableOpacity
                style={[
                  styles.pill,
                  slotType === "Custom" ? styles.pillActive : styles.pillInactive,
                ]}
                onPress={() => setSlotType("Custom")}>
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={slotType === "Custom" ? COLORS.text.inverse : COLORS.text.primary}>
                  Custom
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pill, slotType === "All" ? styles.pillActive : styles.pillInactive]}
                onPress={() => setSlotType("All")}>
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={slotType === "All" ? COLORS.text.inverse : COLORS.text.primary}>
                  All
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- FIXED: TIME SELECTOR (FRAME 999) --- */}
          {slotType === "Custom" && (
            <View style={styles.timeSelectorContainer}>
              <View style={styles.flex1}>
                <Text variant="body2" weight="medium" style={styles.label}>
                  From
                </Text>
                <TouchableOpacity style={styles.inputBoxAction}>
                  <Text variant="body2" weight="semiBold" style={styles.flex1}>
                    {fromTime}
                  </Text>
                  <ChevronRight size={ms(16)} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.flex1}>
                <Text variant="body2" weight="medium" style={styles.label}>
                  To
                </Text>
                <TouchableOpacity style={styles.inputBoxAction}>
                  <Text variant="body2" weight="semiBold" style={styles.flex1}>
                    {toTime}
                  </Text>
                  <ChevronRight size={ms(16)} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setHasUpcomingClosed(true);
              setIsSelectingRange(false);
              setActiveInput(null);
            }}>
            <Text variant="h3" family="nichrome" color={COLORS.text.inverse}>
              SET AS CLOSED
            </Text>
          </TouchableOpacity>
        </View>

        {/* PAST CLOSED DATES */}
        <View style={styles.section}>
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            PAST CLOSED DATES
          </Text>
          <View style={styles.pastDateRow}>
            <CalendarIcon size={ms(20)} color={COLORS.text.primary} />
            <Text variant="body2" weight="semiBold" color={COLORS.text.muted} style={styles.flex1}>
              12 Mar 2026
            </Text>
            <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
              Closed
            </Text>
          </View>
          <View style={styles.pastDateRow}>
            <CalendarIcon size={ms(20)} color={COLORS.text.primary} />
            <Text variant="body2" weight="semiBold" color={COLORS.text.muted} style={styles.flex1}>
              30 Dec 2026 - 1 Jan 2026
            </Text>
            <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
              6 Am - 3 Pm
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingTop: vs(10) },
  section: { marginBottom: vs(24) },
  sectionTitle: { textTransform: "uppercase", marginBottom: vs(10) },
  fieldGroup: { marginBottom: vs(16), gap: vs(6) },
  label: { textTransform: "capitalize", marginBottom: vs(4) },
  flex1: { flex: 1 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderRadius: ms(10),
    gap: hs(10),
  },
  inputBoxAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: vs(40),
  },
  inputBoxActive: { borderColor: COLORS.primary, backgroundColor: "#FFFFFF" },
  splitRow: { flexDirection: "row", gap: hs(10) },
  timeSelectorContainer: { flexDirection: "row", gap: hs(10), marginBottom: vs(20) },
  pill: { flex: 1, paddingVertical: vs(12), borderRadius: ms(10), alignItems: "center" },
  pillActive: { backgroundColor: COLORS.primary },
  pillInactive: { backgroundColor: COLORS.surface.primary },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: vs(10),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    height: vs(44),
    marginTop: vs(10),
  },
  calendarContainer: { marginTop: vs(10), paddingVertical: vs(10) },
  pastDateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderRadius: ms(10),
    gap: hs(10),
    marginBottom: vs(10),
  },
});
