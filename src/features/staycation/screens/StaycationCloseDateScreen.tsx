// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text, Skeleton } from "@/components/ui";
import { StaycationHeader } from "../components/StaycationHeader";
import { Calendar, DateData } from "react-native-calendars";
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useStaycationHome } from "../hooks/useStaycationHome";
import { useStaycationCloseDate, ClosedDateRecord } from "../hooks/useStaycationCloseDate";
import { useServiceStore } from "@/store";

const USER_PROFILE = require("../../../assets/icons/ic-user-profile.png");

export const StaycationCloseDateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { serviceId } = route.params || {};
  const { activeVenue: venue } = useStaycationHome(serviceId);
  const { activeVenueName } = useServiceStore();

  const {
    upcomingClosedDates,
    pastClosedDates,
    loading: dbLoading,
    setClosedDate,
    removeClosedDate,
  } = useStaycationCloseDate(serviceId);

  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleSetAsClosed = async () => {
    if (dateRange.start) {
      setIsSubmitting(true);
      const newRecord: Omit<ClosedDateRecord, "id"> = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        isFullDay: true,
      };

      const success = await setClosedDate(newRecord);
      setIsSubmitting(false);

      if (success) {
        setDateRange({});
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
      const isDayClosed = (dateStr: string) => {
        return [...upcomingClosedDates, ...pastClosedDates].some(record => {
          if (record.endDate) {
            return dateStr >= record.startDate && dateStr <= record.endDate;
          }
          return dateStr === record.startDate;
        });
      };

      if (isDayClosed(day.dateString)) {
        return;
      }

      if (!dateRange.start || (dateRange.start && dateRange.end)) {
        setDateRange({ start: day.dateString });
      } else {
        if (day.dateString >= dateRange.start) {
          let start = new Date(dateRange.start);
          let end = new Date(day.dateString);
          let hasDisabledDateInRange = false;

          for (let d = new Date(start.getTime() + 86400000); d <= end; d.setDate(d.getDate() + 1)) {
            const dStr = d.toISOString().split("T")[0];
            if (isDayClosed(dStr)) {
              hasDisabledDateInRange = true;
              break;
            }
          }

          if (hasDisabledDateInRange) {
            Alert.alert("Invalid Range", "Your selection includes dates that are already closed.");
            setDateRange({ start: day.dateString });
          } else {
            setDateRange(prev => ({ ...prev, end: day.dateString }));
          }
        } else {
          setDateRange({ start: day.dateString });
        }
      }
    },
    [dateRange, upcomingClosedDates, pastClosedDates],
  );

  const getMarkedDates = () => {
    const marked: any = {};

    // Add existing closed dates to marked dates
    const allClosedDates = [...upcomingClosedDates, ...pastClosedDates];
    allClosedDates.forEach(record => {
      if (record.endDate) {
        let start = new Date(record.startDate);
        let end = new Date(record.endDate);
        for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
          marked[d.toISOString().split("T")[0]] = {
            disabled: true,
            disableTouchEvent: true,
            color: COLORS.border.navBar,
            textColor: COLORS.text.muted,
          };
        }
      } else {
        marked[record.startDate] = {
          disabled: true,
          disableTouchEvent: true,
          color: COLORS.border.navBar,
          textColor: COLORS.text.muted,
        };
      }
    });

    if (dateRange.start) {
      marked[dateRange.start] = {
        ...marked[dateRange.start],
        startingDay: true,
        color: COLORS.primary,
        textColor: COLORS.text.inverse,
      };
    }
    if (dateRange.end) {
      marked[dateRange.end] = {
        ...marked[dateRange.end],
        endingDay: true,
        color: COLORS.primary,
        textColor: COLORS.text.inverse,
      };
      let start = new Date(dateRange.start!);
      let end = new Date(dateRange.end!);
      for (let d = new Date(start.getTime() + 86400000); d < end; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split("T")[0];
        marked[dStr] = {
          ...marked[dStr],
          color: COLORS.border.navBar,
          textColor: COLORS.text.primary,
        };
      }
    }
    return marked;
  };

  const calculateDays = () => {
    if (!dateRange.start || !dateRange.end) return 1;
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <ScreenContainer backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <StaycationHeader
          title={venue?.name || activeVenueName}
          subtitle="Close date"
          imageSource={venue?.cover_image_url ? { uri: venue.cover_image_url } : USER_PROFILE}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            CLOSED DATES
          </Text>
          {dbLoading ? (
            <View style={{ marginVertical: vs(10) }}>
              <Skeleton
                width="100%"
                height={vs(30)}
                borderRadius={ms(8)}
                style={{ marginBottom: vs(10) }}
              />
              <Skeleton width="100%" height={vs(30)} borderRadius={ms(8)} />
            </View>
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
                <Text variant="body2" weight="semiBold" style={styles.recordText}>
                  {formatDateDisplay(item.startDate)}
                  {item.endDate ? ` - ${formatDateDisplay(item.endDate)}` : ""}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveClosedDate(item.id)}>
                  <X size={ms(18)} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text variant="body2" weight="bold" style={styles.sectionTitle}>
            SET CLOSE DATE
          </Text>
          <Text variant="body2" weight="medium" style={styles.label}>
            Select Upcoming Close Days
          </Text>

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
              {dateRange.start
                ? `${calculateDays()} Day${calculateDays() > 1 ? "s" : ""} will be closed`
                : "Select date on calendar"}
            </Text>
          </View>

          <Calendar
            onDayPress={onDayPress}
            markedDates={getMarkedDates()}
            current={dateRange.start || new Date().toISOString().split("T")[0]}
            enableSwipeMonths={true}
            renderArrow={direction => (
              <View style={styles.calendarArrowContainer}>
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
              textMonthFontFamily: "Gilroy-Bold",
              textDayHeaderFontFamily: "Gilroy-Medium",
              textDayFontSize: fs(11),
              textMonthFontSize: fs(14),
              textDayHeaderFontSize: fs(11),
            }}
            markingType={"period"}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, (!dateRange.start || isSubmitting) && styles.disabledBtn]}
            disabled={!dateRange.start || isSubmitting}
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
                  {formatDateDisplay(item.startDate)}
                  {item.endDate ? ` - ${formatDateDisplay(item.endDate)}` : ""}
                </Text>
                <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
                  Closed
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: vs(20),
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
    justifyContent: "space-between",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
  },
  recordText: {
    flex: 1,
    color: COLORS.text.primary,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: ms(6),
    padding: ms(4),
  },
  label: {
    marginTop: vs(5),
  },
  subLabel: {
    fontSize: fs(12),
    marginBottom: vs(2),
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
    minHeight: vs(45),
    justifyContent: "center",
  },
  rangeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
    marginTop: vs(5),
  },
  rangeStatusText: {
    color: COLORS.text.primary,
  },
  calendarArrowContainer: {
    padding: ms(4),
    borderRadius: ms(20),
    backgroundColor: COLORS.surface.primary,
  },
  primaryBtn: {
    backgroundColor: "#000000",
    borderRadius: ms(10),
    paddingVertical: vs(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(10),
  },
  disabledBtn: {
    opacity: 0.5,
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
