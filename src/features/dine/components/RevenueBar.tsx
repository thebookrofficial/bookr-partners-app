// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface RevenueBarProps {
  label: string;
  subLabel?: string;
  amount?: string | null;
  percentage: number; // 0 to 100 for width
  isActive?: boolean;
}

export const RevenueBar = ({
  label,
  subLabel,
  amount,
  percentage,
  isActive = false,
}: RevenueBarProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelSection}>
        <Text
          variant="body2"
          weight="semiBold"
          color={COLORS.text.primary}
          style={styles.labelText}>
          {label}
        </Text>
        {subLabel && (
          <Text
            variant="body2"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.labelText}>
            {subLabel}
          </Text>
        )}
      </View>

      <View style={styles.barWrapper}>
        <View
          style={[
            styles.bar,
            { width: `${Math.max(percentage, 5)}%` }, // Min width for visibility
            isActive && styles.activeBar,
          ]}>
          {amount && (
            <Text
              variant="body2"
              weight="semiBold"
              style={[styles.amountText, isActive ? styles.activeAmount : styles.inactiveAmount]}>
              {amount}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(10),
    width: "100%",
  },
  labelSection: {
    width: hs(60),
    marginRight: hs(10),
    alignItems: "center",
  },
  labelText: {
    fontSize: ms(12),
    lineHeight: ms(14),
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
  activeBar: {
    backgroundColor: "#CBDFFE", // Highlighted color for "Today" or active week
  },
  amountText: {
    fontSize: ms(10),
  },
  activeAmount: {
    color: "#00B562",
  },
  inactiveAmount: {
    color: "rgba(0, 181, 98, 0.7)", // Subtler green for inactive
  },
});
