// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ServiceHeader } from "@/features/sports/components/ServiceHeader";
import { Calendar, DateData } from "react-native-calendars";
import DatePicker from "react-native-date-picker";
import { Calendar as CalendarIcon, Plus, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, RouteProp } from "@react-navigation/native";
import { DineTabParamList } from "@/navigation/navigation.types";
import { useDineHome } from "../hooks/useDineHome";
import { useDineCloseDate, ClosedDateRecord } from "../hooks/useDineCloseDate";
import { ActivityIndicator, Alert } from "react-native";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

/**
 * DineCloseDateScreen - Manage closed dates for a dine venue.
 * Matches Figma frames 6:81040, 6:83772, 6:83832, 6:83901.
 */
export const DineCloseDateScreen = () => {
  const route = useRoute<RouteProp<DineTabParamList, "DineCloseDate">>();
  const { serviceId } = route.params;
  const { venue } = useDineHome(serviceId);

  // Hook for Database Interactions
  const {
    upcomingClosedDates,
    pastClosedDates,
    loading: dbLoading,
    setClosedDate,
    removeClosedDate,
  } = useDineCloseDate(serviceId);

  // Selection States
  const [selectionMode, setSelectionMode] = useState<"single" | "range">("single");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [slotType, setSlotType] = useState<"custom" | "all">("all");

  // Time Selection States
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<"from" | "to" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTimeDisplay = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      hour12: true,
    });
  };

  const formatTimeDB = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}:00`;
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSetAsClosed = async () => {
    if (selectionMode === "single" || (dateRange.start && dateRange.end)) {
      setIsSubmitting(true);
      const newRecord: Omit<ClosedDateRecord, "id"> = {
        startDate:
          selectionMode === "single" ? selectedDate.toISOString().split("T")[0] : dateRange.start!,
        endDate: selectionMode === "range" ? dateRange.end : undefined,
        startTime: slotType === "custom" ? formatTimeDB(fromTime) : undefined,
        endTime: slotType === "custom" ? formatTimeDB(toTime) : undefined,
        isFullDay: slotType === "all",
      };

      const success = await setClosedDate(newRecord);
      setIsSubmitting(false);

      if (success) {
        // Reset after set
        setDateRange({});
        setSelectionMode("single");
      }
    }
  };

  const handleRemoveClosedDate = async (id: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to remove this closed date?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeClosedDate(id);
        },
      },
    ]);
  };

  const onDayPress = useCallback(
    (day: DateData) => {
      if (selectionMode === "range") {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
          setDateRange({ start: day.dateString });
        } else {
          // Ensure end date is after start date
          if (new Date(day.dateString) >= new Date(dateRange.start)) {
            setDateRange(prev => ({ ...prev, end: day.dateString }));
          } else {
            setDateRange({ start: day.dateString });
          }
        }
      } else {
        setSelectedDate(new Date(day.timestamp));
      }
    },
    [selectionMode, dateRange],
  );

  const getMarkedDates = () => {
    const marked: any = {};
    if (selectionMode === "range") {
      if (dateRange.start) {
        marked[dateRange.start] = {
          startingDay: true,
          color: COLORS.primary,
          textColor: COLORS.text.inverse,
        };
      }
      if (dateRange.end) {
        marked[dateRange.end] = {
          endingDay: true,
          color: COLORS.primary,
          textColor: COLORS.text.inverse,
        };
        // Fill days between
        let start = new Date(dateRange.start!);
        let end = new Date(dateRange.end!);
        for (let d = new Date(start.getTime() + 86400000); d < end; d.setDate(d.getDate() + 1)) {
          marked[d.toISOString().split("T")[0]] = {
            color: COLORS.border.navBar,
            textColor: COLORS.text.primary,
          };
        }
      }
    } else {
      const dateString = selectedDate.toISOString().split("T")[0];
      marked[dateString] = {
        selected: true,
        color: COLORS.primary,
        textColor: COLORS.text.inverse,
      };
    }
    return marked;
  };

  const calculateDays = () => {
    if (!dateRange.start || !dateRange.end) return 0;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrapper}>
          <ServiceHeader
            title={venue?.name || "Hotel tikka lab"}
            subtitle="Close date"
            imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
          />
        </View>

        {/* CLOSED DATES SECTION */}
        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            CLOSED DATES
          </Text>
          {dbLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{ marginVertical: vs(10) }}
            />
          ) : upcomingClosedDates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.greenDot} />
              <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
                There are no upcoming close days
              </Text>
            </View>
          ) : (
            upcomingClosedDates.map(item => (
              <View key={item.id} style={styles.recordRow}>
                <View style={styles.recordTextContainer}>
                  <Text variant="body2" weight="semiBold" style={styles.recordText}>
                    {formatDateDisplay(item.startDate)}{" "}
                    {item.endDate ? `- ${formatDateDisplay(item.endDate)}` : ""}
                  </Text>
                  {!item.isFullDay && (
                    <Text variant="caption" weight="medium" color={COLORS.text.muted}>
                      {item.startTime} - {item.endTime}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveClosedDate(item.id)}>
                  <X size={ms(18)} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* SET CLOSE DATE SECTION */}
        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            SET CLOSE DATE
          </Text>

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Select Upcoming Close Days
            </Text>

            {selectionMode === "single" ? (
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}>
                <CalendarIcon size={ms(20)} color={COLORS.primary} />
                <Text variant="body2" weight="semiBold" style={styles.inputText}>
                  {selectedDate.toLocaleDateString("en-GB")}
                </Text>
                <TouchableOpacity onPress={() => setSelectionMode("range")}>
                  <Plus size={ms(24)} color={COLORS.text.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.rangeInputs}>
                  <View style={styles.rangeColumn}>
                    <Text variant="body2" weight="medium" style={styles.subLabel}>
                      From
                    </Text>
                    <View style={styles.rangeInput}>
                      <Text variant="body2" weight="semiBold">
                        {dateRange.start ? formatDateDisplay(dateRange.start) : "Select Date"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rangeColumn}>
                    <Text variant="body2" weight="medium" style={styles.subLabel}>
                      To
                    </Text>
                    <View style={styles.rangeInput}>
                      <Text variant="body2" weight="semiBold">
                        {dateRange.end ? formatDateDisplay(dateRange.end) : "Select Date"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rangeStatus}>
                  <CalendarIcon size={ms(20)} color={COLORS.primary} />
                  <Text variant="body2" weight="medium" style={styles.rangeStatusText}>
                    {dateRange.start && dateRange.end
                      ? `${calculateDays()} Days will be closed`
                      : "Select range on calendar"}
                  </Text>
                </View>
              </>
            )}
          </View>

          {selectionMode === "range" && (
            <Calendar
              onDayPress={onDayPress}
              markedDates={getMarkedDates()}
              current={dateRange.start || new Date().toISOString().split("T")[0]}
              enableSwipeMonths={true}
              hideArrows={false}
              renderArrow={direction => (
                <View
                  style={{
                    padding: ms(4),
                    borderRadius: ms(20),
                    backgroundColor: COLORS.surface.primary,
                  }}>
                  {direction === "left" ? (
                    <ChevronLeft size={ms(20)} color={COLORS.primary} />
                  ) : (
                    <ChevronRight size={ms(20)} color={COLORS.primary} />
                  )}
                </View>
              )}
              theme={{
                calendarBackground: "transparent",
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.text.inverse,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.text.primary,
                textDisabledColor: "#B3B3B3",
                monthTextColor: COLORS.text.primary,
                arrowColor: COLORS.primary,
                textMonthFontFamily: "Inter-SemiBold",
                textDayHeaderFontFamily: "Inter-Medium",
                textDayFontSize: fs(11),
                textMonthFontSize: fs(12),
                textDayHeaderFontSize: fs(11),
              }}
              markingType={"period"}
            />
          )}

          <View style={styles.formGroup}>
            <Text variant="body2" weight="medium" style={styles.label}>
              Select Closed Slots
            </Text>
            <View style={styles.slotToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, slotType === "custom" && styles.toggleBtnActive]}
                onPress={() => setSlotType("custom")}>
                <Text variant="body2" weight="semiBold">
                  Custom
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, slotType === "all" && styles.toggleBtnActive]}
                onPress={() => setSlotType("all")}>
                <Text variant="body2" weight="semiBold">
                  All
                </Text>
              </TouchableOpacity>
            </View>

            {slotType === "custom" && (
              <View style={[styles.rangeInputs, { marginTop: vs(10) }]}>
                <View style={styles.rangeColumn}>
                  <Text variant="body2" weight="medium" style={styles.subLabel}>
                    From
                  </Text>
                  <TouchableOpacity
                    style={styles.rangeInput}
                    onPress={() => setShowTimePicker("from")}>
                    <Text variant="body2" weight="semiBold">
                      {formatTimeDisplay(fromTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.rangeColumn}>
                  <Text variant="body2" weight="medium" style={styles.subLabel}>
                    To
                  </Text>
                  <TouchableOpacity
                    style={styles.rangeInput}
                    onPress={() => setShowTimePicker("to")}>
                    <Text variant="body2" weight="semiBold">
                      {formatTimeDisplay(toTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              ((selectionMode === "range" && (!dateRange.start || !dateRange.end)) ||
                isSubmitting) &&
                styles.disabledBtn,
            ]}
            disabled={
              (selectionMode === "range" && (!dateRange.start || !dateRange.end)) || isSubmitting
            }
            onPress={handleSetAsClosed}>
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.text.inverse} />
            ) : (
              <Text family="bison" weight="bold" style={styles.btnText}>
                SET AS CLOSED
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* PAST CLOSED DATES SECTION */}
        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            PAST CLOSED DATES
          </Text>
          {pastClosedDates.length === 0 ? (
            <Text variant="caption" color={COLORS.text.muted} style={{ paddingLeft: hs(4) }}>
              No past records
            </Text>
          ) : (
            pastClosedDates.map(item => (
              <View key={item.id} style={styles.pastRecordRow}>
                <CalendarIcon size={ms(20)} color={COLORS.text.muted} />
                <Text variant="body2" weight="semiBold" style={styles.pastRecordText}>
                  {formatDateDisplay(item.startDate)}{" "}
                  {item.endDate ? `- ${formatDateDisplay(item.endDate)}` : ""}
                </Text>
                <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
                  Closed
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Single Date Picker */}
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate}
          mode="date"
          onConfirm={date => {
            setShowDatePicker(false);
            setSelectedDate(date);
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
        />

        {/* Custom Hourly Time Picker */}
        <DatePicker
          modal
          open={!!showTimePicker}
          date={showTimePicker === "from" ? fromTime : toTime}
          mode="time"
          minuteInterval={30}
          onConfirm={date => {
            if (showTimePicker === "from") {
              setFromTime(date);
            } else {
              setToTime(date);
            }
            setShowTimePicker(null);
          }}
          onCancel={() => {
            setShowTimePicker(null);
          }}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: vs(20),
  },
  disabledBtn: {
    opacity: 0.5,
  },
  headerWrapper: {
    paddingTop: vs(10),
  },
  section: {
    marginTop: vs(20),
    gap: vs(10),
  },
  sectionTitle: {
    fontSize: fs(16),
    textTransform: "uppercase",
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  greenDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "#00B562",
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  recordTextContainer: {
    flex: 1,
  },
  recordText: {
    color: COLORS.text.primary,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: ms(6),
    padding: ms(4),
  },
  formGroup: {
    gap: vs(4),
  },
  label: {
    textTransform: "capitalize",
  },
  subLabel: {
    textTransform: "capitalize",
    fontSize: fs(12),
    marginBottom: vs(2),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  inputText: {
    flex: 1,
    color: COLORS.text.muted,
  },
  rangeInputs: {
    flexDirection: "row",
    gap: hs(10),
  },
  rangeColumn: {
    flex: 1,
  },
  rangeInput: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    justifyContent: "center",
  },
  rangeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(4),
    marginTop: vs(6),
  },
  rangeStatusText: {
    textTransform: "capitalize",
    color: COLORS.text.primary,
  },
  slotToggle: {
    flexDirection: "row",
    gap: hs(10),
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#E1E9F4",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryBtn: {
    backgroundColor: "#282828",
    borderRadius: ms(10),
    paddingVertical: vs(10),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(15),
  },
  btnText: {
    fontSize: fs(20),
    color: COLORS.text.inverse,
  },
  pastRecordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    gap: hs(10),
  },
  pastRecordText: {
    flex: 1,
    color: COLORS.text.muted,
  },
});
