// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FormSkeleton } from "@/components/ui";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "../components/ServiceHeader";
import { Calendar as CalendarIcon, Plus, ChevronRight } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SportsTabParamList } from "@/navigation/navigation.types";
import { useServiceStore } from "@/store/serviceStore";
import { CustomDatePickerModal } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import perf from "@react-native-firebase/perf";

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
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hourInt = parseInt(h, 10);
  const ampm = hourInt >= 12 ? "PM" : "AM";
  const displayHour = hourInt % 12 || 12;
  const minutes = m && m !== "00" ? `:${m}` : "";
  return `${displayHour}${minutes} ${ampm}`;
};

export const BlockUnblockScreen = () => {
  const route = useRoute<RouteProp<SportsTabParamList, "BlockUnblock">>();
  const { venueId, groundId } = route.params || { venueId: "", groundId: "" };

  const { activeVenueName, selectedCategories } = useServiceStore();

  const [grounds, setGrounds] = useState<{ id: string; name: string; sports_type?: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGroundId, setSelectedGroundId] = useState<string>(groundId || "");

  const { activeBlocks, pastBlocks, loading, blockSlots, unblockSlots, refresh } = useBlockUnblock(
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

          const cats = Array.from(
            new Set(data.map(g => g.sports_type).filter(Boolean)),
          ) as string[];

          let initialCat = selectedCategories[venueId] || "";
          if (!initialCat || !cats.includes(initialCat)) {
            initialCat = cats.length > 0 ? cats[0] : "";
          }
          setSelectedCategory(initialCat);

          const filtered = data.filter((g: any) => {
            let type = g.sports_type;
            if (!type && g.parent_ground_id) {
              type = data.find((p: any) => p.id === g.parent_ground_id)?.sports_type;
            }
            return type === initialCat;
          });

          if (groundId && filtered.some(g => g.id === groundId)) {
            setSelectedGroundId(groundId);
          } else if (filtered.length > 0) {
            setSelectedGroundId(filtered[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching grounds:", err);
      }
    };
    fetchGrounds();
  }, [venueId, groundId, selectedCategories]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const filtered = grounds.filter((g: any) => {
      let type = g.sports_type;
      if (!type && g.parent_ground_id) {
        type = grounds.find((p: any) => p.id === g.parent_ground_id)?.sports_type;
      }
      return type === cat;
    });
    if (filtered.length > 0) {
      setSelectedGroundId(filtered[0].id);
    }
  };

  const filteredGrounds = grounds.filter((g: any) => {
    let type = g.sports_type;
    if (!type && g.parent_ground_id) {
      type = grounds.find((p: any) => p.id === g.parent_ground_id)?.sports_type;
    }
    return type === selectedCategory;
  });
  const categories = Array.from(
    new Set(grounds.map(g => g.sports_type).filter(Boolean)),
  ) as string[];

  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [slotType, setSlotType] = useState<"Custom" | "All">("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(60);

  useEffect(() => {
    const detectSlotDuration = async () => {
      if (!selectedGroundId) return;
      try {
        const { data: slotData } = await supabase
          .from("sports_slots")
          .select("start_time, end_time")
          .eq("ground_id", selectedGroundId)
          .limit(1)
          .maybeSingle();

        if (slotData && slotData.start_time && slotData.end_time) {
          const [sh, sm] = slotData.start_time.split(":").map(Number);
          const [eh, em] = slotData.end_time.split(":").map(Number);
          let diff = eh * 60 + em - (sh * 60 + sm);
          if (diff < 0) diff += 24 * 60;
          if (diff > 0) {
            setSlotDurationMinutes(diff);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to detect slot duration from slot:", err);
      }

      // Fallback: use venue config filtered by the active sport type
      try {
        const dbSportType = selectedCategory.toLowerCase().replace(" ", "_");
        const { data, error } = await supabase
          .from("sports_venues")
          .select("price_per_slot, weekend_price_per_slot, slot_duration_minutes")
          .eq("venue_id", venueId)
          .eq("sports_type", dbSportType)
          .single();

        if (error) throw error;

        if (data && data.slot_duration_minutes) {
          setSlotDurationMinutes(data.slot_duration_minutes);
        }
      } catch (err) {
        console.error("Failed to fetch venue config:", err);
      }
    };
    detectSlotDuration();
  }, [selectedGroundId, venueId, selectedCategory]);

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

  const handleDateChange = (selectedDate: Date) => {
    const activePicker = showDatePicker;
    setShowDatePicker(null); // Hide picker

    if (selectedDate) {
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
    const trace = await perf().startTrace("block_time_slot");
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
        refresh();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to close slot");
    } finally {
      await trace.stop();
      setIsSubmitting(false);
    }
  };

  const handleUnblock = (block: BlockedEntry) => {
    Alert.alert("Unblock Slot", `Are you sure you want to unblock this?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        style: "destructive",
        onPress: async () => {
          const trace = await perf().startTrace("unblock_time_slot");
          try {
            await unblockSlots(block.slotIds);
            refresh();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to unblock");
          } finally {
            await trace.stop();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <FormSkeleton />
      </View>
    );
  }

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ServiceHeader title={activeVenueName} subtitle="Block / Unblock" />

        {/* Category Selector */}
        {categories.length > 1 && (
          <View style={[styles.groundScrollWrapper, { marginBottom: vs(8) }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groundScroll}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.groundPill, selectedCategory === cat && styles.groundPillActive]}
                  onPress={() => handleCategoryChange(cat)}>
                  <Text
                    variant="body2"
                    weight="semiBold"
                    color={selectedCategory === cat ? COLORS.text.inverse : COLORS.text.primary}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Ground Selector */}
        {filteredGrounds.length > 0 && (
          <View style={styles.groundScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groundScroll}>
              {filteredGrounds.map(g => (
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

      {/* --- CUSTOM DATE PICKER --- */}
      <CustomDatePickerModal
        isVisible={!!showDatePicker}
        onClose={() => setShowDatePicker(null)}
        selectedDate={showDatePicker === "from" ? fromDate : toDate}
        minDate={showDatePicker === "to" ? fromDate : new Date()}
        onSelectDate={handleDateChange}
      />

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
