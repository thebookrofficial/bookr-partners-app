// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { TrendingUp } from "lucide-react-native";

interface StatItemProps {
  label: string;
  value: string | number;
  trend: string | number;
  isMain?: boolean;
}

const StatItem = ({ label, value, trend, isMain }: StatItemProps) => {
  if (isMain) {
    return (
      <View style={styles.mainCard}>
        <View style={styles.mainValueRow}>
          <Text weight="semiBold" style={styles.mainValue}>
            {value}
          </Text>
          <View style={styles.mainTrendWrapper}>
            <View style={styles.trendBadge}>
              <Text weight="semiBold" style={styles.trendText}>
                +{trend}
              </Text>
              <TrendingUp size={ms(14)} color="#00B562" />
            </View>
            <Text weight="semiBold" style={styles.todayText}>
              Today
            </Text>
          </View>
        </View>
        <Text weight="semiBold" style={styles.mainLabel}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.rowItem}>
      <Text weight="semiBold" style={styles.rowLabel}>
        {label}
      </Text>
      <Text weight="semiBold" style={styles.rowValue}>
        {value}
      </Text>
      <View style={styles.rowTrendWrapper}>
        <Text weight="semiBold" style={styles.rowTrendText}>
          +{trend}
        </Text>
        <TrendingUp size={ms(16)} color="#00B562" />
      </View>
    </View>
  );
};

export interface EventCategoryStat {
  label: string;
  value: string | number;
  trend: string | number;
}

export interface EventSummaryStatsProps {
  totalBookings: {
    value: string | number;
    trend: string | number;
  };
  categories: EventCategoryStat[];
}

export const EventSummaryStats = ({ totalBookings, categories }: EventSummaryStatsProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <StatItem
          label="Total Bookings"
          value={totalBookings.value}
          trend={totalBookings.trend}
          isMain
        />
      </View>
      <View style={styles.rightCol}>
        {categories.map((cat, index) => (
          <StatItem key={index} label={cat.label} value={cat.value} trend={cat.trend} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: ms(6),
    gap: hs(25), // Figma: 25px
    width: hs(416),
    height: vs(107),
    marginBottom: vs(15),
  },
  leftCol: {
    width: hs(123), // Figma: 123px
    height: vs(95),
  },
  mainCard: {
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    paddingHorizontal: hs(6),
    justifyContent: "center",
    gap: vs(4),
    height: "100%",
  },
  mainValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  mainValue: {
    fontSize: fs(32), // Figma: 32px
    lineHeight: fs(29.76), // 93% of 32
    color: COLORS.text.primary,
  },
  mainTrendWrapper: {
    justifyContent: "center",
    height: vs(23),
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    height: vs(14),
  },
  trendText: {
    fontSize: fs(12), // Figma: 12px
    color: "#00B562",
    marginRight: hs(2),
  },
  todayText: {
    fontSize: fs(10), // Figma: 10px
    color: COLORS.text.muted,
  },
  mainLabel: {
    fontSize: fs(16), // Figma: 16px
    color: COLORS.text.primary,
  },
  rightCol: {
    width: hs(256), // Figma: 256px
    height: vs(95),
    gap: vs(10),
    justifyContent: "center",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: vs(25),
  },
  rowLabel: {
    flex: 1,
    fontSize: fs(14), // Figma: 14px
    color: COLORS.text.primary,
  },
  rowValue: {
    fontSize: fs(20), // Figma: 20px
    color: COLORS.text.primary,
    marginRight: hs(6),
  },
  rowTrendWrapper: {
    width: hs(24),
    alignItems: "flex-end",
  },
  rowTrendText: {
    fontSize: fs(10), // Figma: 10px
    color: "#00B562",
  },
});
