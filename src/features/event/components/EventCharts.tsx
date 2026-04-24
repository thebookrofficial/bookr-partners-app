// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

const DAYS = [
  { date: "14 Apr", day: "Mon", bookings: 100 },
  { date: "15 Apr", day: "Tue", bookings: 120 },
  { date: "16 Apr", day: "Wed", bookings: 85 },
  { date: "17 Apr", day: "Thu", bookings: 40 },
  { date: "18 Apr", day: "Fri", bookings: 0 },
  { date: "19 Apr", day: "Sat", bookings: 0 },
];

const Y_AXIS = ["140", "120", "100", "80", "60", "40", "20", "0"];

export interface EventChartCategory {
  label: string;
  color: string;
}

export interface EventChartsProps {
  categories: EventChartCategory[];
}

export const EventCharts = ({ categories }: EventChartsProps) => {
  return (
    <View style={styles.container}>
      {/* 1. Booking Graph - Bar Chart */}
      <View style={styles.section}>
        <Text weight="bold" style={styles.sectionTitle}>
          BOOKING GRAPH
        </Text>
        <View style={styles.graphWrapper}>
          <View style={styles.yAxis}>
            {Y_AXIS.map(val => (
              <Text key={val} style={styles.axisText}>
                {val}
              </Text>
            ))}
          </View>
          <View style={styles.chartArea}>
            <View style={styles.barsRow}>
              {DAYS.map((item, index) => (
                <View key={index} style={styles.barCol}>
                  <View style={styles.barContainer}>
                    {item.bookings > 0 && (
                      <View
                        style={[
                          styles.bar,
                          { height: vs(item.bookings * 1.1) }, // Scaled height
                        ]}
                      />
                    )}
                    {item.bookings === 0 && <View style={styles.emptyBar} />}
                  </View>
                  <View style={styles.labelWrapper}>
                    <Text style={styles.dateLabel}>{item.date}</Text>
                    <Text style={styles.dayLabel}>{item.day}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 2. Pass Categories Graph */}
      <View style={styles.section}>
        <Text weight="bold" style={styles.sectionTitle}>
          PASS CATEGORIES GRAPH
        </Text>
        <View style={styles.legendRow}>
          {categories.map((cat, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <Text variant="caption" weight="bold">
                {cat.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.graphWrapper}>
          <View style={styles.yAxis}>
            {Y_AXIS.map(val => (
              <Text key={val} style={styles.axisText}>
                {val}
              </Text>
            ))}
          </View>
          <View style={styles.chartArea}>
            <View style={styles.linePlaceholder}>
              <Text style={styles.trendValue}>+68</Text>
              <View style={styles.simpleLine} />
            </View>
            <View style={styles.barsRow}>
              {DAYS.map((item, index) => (
                <View key={index} style={styles.barCol}>
                  <View style={styles.labelWrapper}>
                    <Text style={styles.dateLabel}>{item.date}</Text>
                    <Text style={styles.dayLabel}>{item.day}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: hs(6),
    marginBottom: vs(40),
    gap: vs(30),
  },
  section: {
    gap: vs(10),
  },
  sectionTitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    textTransform: "uppercase",
  },
  graphWrapper: {
    flexDirection: "row",
    gap: hs(10),
    width: "100%",
    height: vs(220),
  },
  yAxis: {
    width: hs(40),
    borderRightWidth: 1,
    borderRightColor: COLORS.border.navBar,
    justifyContent: "space-between",
    paddingBottom: vs(40),
  },
  axisText: {
    fontSize: fs(12),
    color: COLORS.text.primary,
    textAlign: "right",
    paddingRight: hs(6),
  },
  chartArea: {
    flex: 1,
    justifyContent: "flex-end",
  },
  barsRow: {
    flexDirection: "row",
    gap: hs(15),
    alignItems: "flex-end",
    paddingHorizontal: hs(10),
  },
  barCol: {
    flex: 1,
    alignItems: "center",
  },
  barContainer: {
    height: vs(150),
    justifyContent: "flex-end",
    width: "100%",
  },
  bar: {
    backgroundColor: COLORS.primary,
    width: "100%",
    borderRadius: ms(3),
  },
  emptyBar: {
    backgroundColor: COLORS.text.muted,
    height: 1,
    width: "100%",
  },
  labelWrapper: {
    height: vs(40),
    alignItems: "center",
    justifyContent: "center",
  },
  dateLabel: {
    fontSize: fs(10),
    color: COLORS.text.primary,
  },
  dayLabel: {
    fontSize: fs(10),
    color: COLORS.text.muted,
  },
  legendRow: {
    flexDirection: "row",
    gap: hs(12),
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    gap: hs(4),
    alignItems: "center",
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  linePlaceholder: {
    height: vs(150),
    width: "100%",
    overflow: "hidden",
  },
  trendValue: {
    position: "absolute",
    left: hs(80),
    top: vs(40),
    color: "#3B82F6",
    fontSize: fs(12),
    fontWeight: "bold",
  },
  simpleLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: vs(80),
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
});
