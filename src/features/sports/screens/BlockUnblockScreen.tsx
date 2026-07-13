// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Calendar as CalendarIcon, Plus, ChevronRight } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SportsTabParamList } from "@/navigation/navigation.types";
import { useServiceStore } from "@/store/serviceStore";
import DateTimePicker from "@react-native-community/datetimepicker";

// Sub-components & Hooks
import { ClosedDatesAlert } from "../components/block-unblock/ClosedDatesAlert";
import { TimePickerModal } from "../components/TimePickerModal";
import { useBlockUnblock, BlockedEntry } from "../hooks/useBlockUnblock";
import { SportsService } from "../services/sports.service";
import { generateTimeSlots, parseTimeTo24Hour } from "../utils/time.utils";

const formatDisplayDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDisplayTime = (time24: string) => {
  const [h] = time24.split(":");
  const hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  const displayHour = hourInt % 12 || 12;
  return `${displayHour} ${ampm}`;
};

export const BlockUnblockScreen = () => {
  const route = useRoute<RouteProp<SportsTabParamList, "BlockUnblock">>();
  const { venueId, groundId } = route.params || { venueId: "", groundId: "" };

  const [grounds, setGrounds] = useState<{ id: string; name: string }[]>([]);
  const [selectedGroundId, setSelectedGroundId] = useState<string>(groundId || "");

  const { activeBlocks, pastBlocks, loading, blockSlots, unblockSlots } = useBlockUnblock(
    venueId,
    selectedGroundId,
  );

  const selectedGroundName = grounds.find(g => g.id === selectedGroundId)?.name || "";

  useEffect(() => {
    const fetchGrounds = async () => {
      try {
        const data = await SportsService.getGrounds(venueId);
        if (data && data.length > 0) {
          setGrounds(data);
          if (!selectedGroundId) {
            setSelectedGroundId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching grounds:", err);
      }
    };
    fetchGrounds();
  }, [venueId, selectedGroundId]);

  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [slotType, setSlotType] = useState<"Custom" | "All">("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const data = await SportsService.getVenuePricing(venueId);
        if (data && data.slot_duration_minutes) {
          setSlotDurationMinutes(data.slot_duration_minutes);
        }
      } catch (err) {
        console.error("Failed to fetch venue config:", err);
      }
    };
    fetchPricing();
  }, [venueId]);

  const HOURS = React.useMemo(
    () => generateTimeSlots(6, 24, slotDurationMinutes),
    [slotDurationMinutes],
  );

  // --- NATIVE DATE PICKER STATES ---
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<"from" | "to" | null>(null);

  // Time States
  const [fromTime, setFromTime] = useState("6 AM");
  const [toTime, setToTime] = useState("4 PM");
  const [showHourPicker, setShowHourPicker] = useState<"from" | "to" | null>(null);

  const { activeVenueName } = useServiceStore();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const activePicker = showDatePicker;
    setShowDatePicker(null); // Hide picker (Android behavior)

    if (selectedDate && event.type !== "dismissed") {
      if (activePicker === "from") {
        setFromDate(selectedDate);
        // Automatically push 'toDate' forward if it's earlier than the new 'fromDate'
        if (selectedDate > toDate) {
          setToDate(selectedDate);
        }
      } else if (activePicker === "to") {
        setToDate(selectedDate);
      }
    }
  };

  const handleBlockSubmit = async () => {
    setIsSubmitting(true);
    try {
      const selectedDates: string[] = [];

      // Generate all dates between fromDate and toDate
      let curr = new Date(fromDate);
      curr.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const year = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, "0");
        const day = String(curr.getDate()).padStart(2, "0");
        selectedDates.push(`${year}-${month}-${day}`);
        curr.setDate(curr.getDate() + 1); // Move to next day
      }

      const dbFromTime = slotType === "Custom" ? parseTimeTo24Hour(fromTime) : null;
      const dbToTime = slotType === "Custom" ? parseTimeTo24Hour(toTime) : null;

      // Capture the true/false success result from our hook
      const success = await blockSlots(selectedDates, dbFromTime, dbToTime, slotType === "All");

      // Only reset the UI if it actually succeeded
      if (success) {
        setIsSelectingRange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnblock = (block: BlockedEntry) => {
    unblockSlots(block.slotIds);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ServiceHeader title={activeVenueName} subtitle="Block / Unblock" />

        {/* Ground Selector */}
        {grounds.length > 0 && (
          <View style={styles.groundScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groundScroll}>
              {grounds.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.groundPill, selectedGroundId === g.id && styles.groundPillActive]}
                  onPress={() => setSelectedGroundId(g.id)}>
                  <Text
                    variant="body2"
                    weight="semiBold"
                    color={selectedGroundId === g.id ? COLORS.text.inverse : COLORS.text.primary}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 1. CLOSED DATES (Active Blocks) */}
        <View style={styles.section}>
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            CLOSED DATES
          </Text>

          {activeBlocks.length === 0 ? (
            <ClosedDatesAlert hasUpcoming={false} dateRange="" timeRange="" onClear={() => {}} />
          ) : (
            activeBlocks.map(block => (
              <View key={block.id} style={styles.alertSpacing}>
                <ClosedDatesAlert
                  hasUpcoming={true}
                  dateRange={
                    block.startDate === block.endDate
                      ? formatDisplayDate(block.startDate)
                      : `${formatDisplayDate(block.startDate)} - ${formatDisplayDate(
                          block.endDate,
                        )}`
                  }
                  timeRange={
                    block.isAllDay
                      ? "All Day"
                      : `${formatDisplayTime(block.startTime)} - ${formatDisplayTime(
                          block.endTime,
                        )}`
                  }
                  onClear={() => handleUnblock(block)}
                />
              </View>
            ))
          )}
        </View>

        {/* 2. SET CLOSE DATE */}
        <View style={styles.section}>
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            SET CLOSE DATE
          </Text>

          <View style={styles.fieldGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Ground
            </Text>
            <View style={styles.inputBox}>
              <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                {selectedGroundName}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Select Upcoming Close Days
            </Text>

            {isSelectingRange ? (
              <View style={styles.splitRow}>
                <TouchableOpacity
                  style={[styles.inputBoxAction, styles.flex1]}
                  onPress={() => setShowDatePicker("from")}>
                  <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                    {fromDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputBoxAction, styles.flex1]}
                  onPress={() => setShowDatePicker("to")}>
                  <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
                    {toDate.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.inputBox}
                onPress={() => {
                  setIsSelectingRange(true);
                  setShowDatePicker("from");
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

          {/* TIME SELECTOR */}
          {slotType === "Custom" && (
            <View style={styles.timeSelectorContainer}>
              <View style={styles.flex1}>
                <Text variant="body2" weight="medium" style={styles.label}>
                  From
                </Text>
                <TouchableOpacity
                  style={styles.inputBoxAction}
                  onPress={() => setShowHourPicker("from")}>
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
                <TouchableOpacity
                  style={styles.inputBoxAction}
                  onPress={() => setShowHourPicker("to")}>
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
            disabled={isSubmitting || !isSelectingRange}
            onPress={handleBlockSubmit}>
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.text.inverse} />
            ) : (
              <Text variant="h3" family="nichrome" color={COLORS.text.inverse}>
                SET AS CLOSED
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. PAST CLOSED DATES */}
        <View style={styles.section}>
          <Text variant="body1" weight="bold" style={styles.sectionTitle}>
            PAST CLOSED DATES
          </Text>

          {pastBlocks.length === 0 ? (
            <Text variant="body2" color={COLORS.text.muted}>
              No past records.
            </Text>
          ) : (
            pastBlocks.map(block => (
              <View key={block.id} style={styles.pastDateRow}>
                <CalendarIcon size={ms(20)} color={COLORS.text.primary} />
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={COLORS.text.muted}
                  style={styles.flex1}>
                  {block.startDate === block.endDate
                    ? formatDisplayDate(block.startDate)
                    : `${formatDisplayDate(block.startDate)} - ${formatDisplayDate(block.endDate)}`}
                </Text>
                <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
                  {block.isAllDay
                    ? "All Day"
                    : `${formatDisplayTime(block.startTime)} - ${formatDisplayTime(block.endTime)}`}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* --- NATIVE DATE PICKER --- */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === "from" ? fromDate : toDate}
          mode="date"
          display="default"
          minimumDate={showDatePicker === "to" ? fromDate : new Date()}
          onChange={handleDateChange}
        />
      )}

      <TimePickerModal
        visible={!!showHourPicker}
        onClose={() => setShowHourPicker(null)}
        title={`Select ${showHourPicker === "from" ? "Start" : "End"} Time`}
        hours={HOURS}
        selectedTime={showHourPicker === "from" ? fromTime : toTime}
        onSelectTime={hour => {
          if (showHourPicker === "from") {
            setFromTime(hour);
            setToTime("End Time");
          } else {
            setToTime(hour);
          }
        }}
        isHourDisabled={(hour, index) => {
          if (showHourPicker === "to") {
            const fromIndex = HOURS.indexOf(fromTime);
            return index <= fromIndex;
          }
          return false;
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  alertSpacing: {
    marginBottom: vs(10),
  },
  groundScrollWrapper: {
    marginBottom: vs(20),
  },
  groundScroll: {
    alignItems: "center",
    paddingRight: hs(20),
  },
  groundPill: {
    paddingHorizontal: hs(16),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    backgroundColor: COLORS.surface.primary,
    marginRight: hs(10),
    borderWidth: 1,
    borderColor: COLORS.border.navBar,
  },
  groundPillActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  scrollContent: { paddingTop: vs(10), paddingBottom: vs(40) },
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
