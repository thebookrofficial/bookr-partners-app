// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { ChevronRight, ChevronDown } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { RevenueBar } from "./RevenueBar";

interface WeekExpandableRowProps {
  label: string;
  dateRange: string;
  amount: string;
  percentage: number;
  isActive?: boolean;
  details: Array<{
    label: string;
    amount: string;
    percentage: number;
  }>;
}

export const WeekExpandableRow = ({
  label,
  dateRange,
  amount,
  percentage,
  isActive = false,
  details,
}: WeekExpandableRowProps) => {
  const [isExpanded, setIsExpanded] = useState(isActive);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainRow}
        activeOpacity={0.7}
        onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.labelSection}>
          <Text variant="body2" weight="semiBold" color={COLORS.text.muted} style={styles.weekText}>
            {label}
          </Text>
          <Text
            variant="body2"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.dateText}>
            {dateRange}
          </Text>
        </View>

        <View style={styles.barWrapper}>
          <View
            style={[
              styles.bar,
              { width: `${Math.max(percentage, 10)}%` },
              isExpanded && styles.expandedBar,
            ]}>
            <Text
              variant="body2"
              weight="semiBold"
              style={[styles.amountText, isExpanded ? styles.expandedAmount : styles.normalAmount]}>
              {amount}
            </Text>
          </View>
        </View>

        <View style={styles.iconWrapper}>
          {isExpanded ? (
            <ChevronDown size={ms(16)} color={COLORS.text.primary} />
          ) : (
            <ChevronRight size={ms(16)} color={COLORS.text.primary} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && details.length > 0 && (
        <View style={styles.detailsContainer}>
          {details.map((day, index) => (
            <RevenueBar
              key={index}
              label={day.label}
              amount={day.amount}
              percentage={day.percentage}
              isActive={false} // Daily items in monthly view don't use full blue highlight
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: vs(15),
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: vs(40),
  },
  labelSection: {
    width: hs(75),
    marginRight: hs(10),
    justifyContent: "center",
  },
  weekText: {
    fontSize: ms(12),
  },
  dateText: {
    fontSize: ms(10),
  },
  barWrapper: {
    flex: 1,
    height: vs(34),
    justifyContent: "center",
  },
  bar: {
    height: "100%",
    backgroundColor: "#F4F7FC",
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: hs(10),
  },
  expandedBar: {
    backgroundColor: COLORS.primary,
  },
  amountText: {
    fontSize: ms(12),
  },
  normalAmount: {
    color: "#00B562",
  },
  expandedAmount: {
    color: COLORS.text.inverse,
  },
  iconWrapper: {
    width: hs(30),
    alignItems: "flex-end",
    justifyContent: "center",
  },
  detailsContainer: {
    marginTop: vs(10),
    paddingLeft: hs(10), // Indent daily details
  },
});
