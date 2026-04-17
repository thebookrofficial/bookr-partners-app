import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";

interface BlockCalendarProps {
  fromDate: string;
  toDate: string;
  onSelectDate: (day: number) => void;
}

export const BlockCalendar = ({ fromDate, toDate, onSelectDate }: BlockCalendarProps) => {
  const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const dates = [
    "",
    "",
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    1,
    2,
  ];

  const fromNum = parseInt(fromDate, 10);
  const toNum = parseInt(toDate, 10);

  return (
    <View style={styles.calendarWrapper}>
      <Text variant="caption" weight="medium" style={styles.calendarMonthText}>
        May
      </Text>
      <View style={styles.calendarDaysRow}>
        {days.map(d => (
          <Text
            key={d}
            variant="caption"
            color={d === "Sa" || d === "Su" ? "#009BFF" : COLORS.text.muted}
            style={styles.calDay}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {dates.map((date, i) => {
          const isCurrentMonth = typeof date === "number" && i >= 2 && i <= 32;
          const isFrom = isCurrentMonth && date === fromNum;
          const isTo = isCurrentMonth && date === toNum;
          const isMiddle = isCurrentMonth && date > fromNum && date < toNum;
          const isWeekend = i % 7 === 5 || i % 7 === 6;

          let cellStyle: any = styles.calCell;
          let color = isWeekend ? "#850002" : COLORS.text.primary;

          if (isFrom || isTo) {
            cellStyle = [styles.calCell, styles.calCellEndpoint];
            color = "#000";
          } else if (isMiddle) {
            cellStyle = [styles.calCell, styles.calCellMiddle];
            color = "#000";
          } else if (!isCurrentMonth) {
            color = "#1270B0";
          }

          return (
            <TouchableOpacity
              key={i}
              style={cellStyle}
              disabled={!isCurrentMonth}
              onPress={() => onSelectDate(date as number)}>
              <Text variant="caption" style={{ color, fontSize: fs(12) }}>
                {date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarWrapper: { alignItems: "center", marginBottom: vs(10) },
  calendarMonthText: { marginBottom: vs(10) },
  calendarDaysRow: {
    flexDirection: "row",
    width: hs(220),
    justifyContent: "space-between",
    marginBottom: vs(10),
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", width: hs(220), gap: vs(4) },
  calDay: { width: hs(24), textAlign: "center", fontSize: fs(11) },
  calCell: {
    width: hs(24),
    height: hs(24),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: ms(4),
    marginHorizontal: hs(3),
    marginBottom: vs(2),
  },
  calCellEndpoint: { backgroundColor: COLORS.primary },
  calCellMiddle: { backgroundColor: "#CBDFFE" },
});
