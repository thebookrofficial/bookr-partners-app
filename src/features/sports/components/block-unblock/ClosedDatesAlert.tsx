// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { X } from "lucide-react-native";
import { COLORS } from "@/constants/theme";
import { hs, vs, ms } from "@/utils/responsive.utils";

interface ClosedDatesAlertProps {
  hasUpcoming: boolean;
  dateRange: string;
  timeRange: string; // Now handles "All Day" or "6 Am - 4 Pm"
  onClear: () => void;
}

export const ClosedDatesAlert = ({
  hasUpcoming,
  dateRange,
  timeRange,
  onClear,
}: ClosedDatesAlertProps) => {
  if (!hasUpcoming) {
    return (
      <View style={styles.infoBox}>
        <View style={styles.greenDot} />
        <Text variant="body2" weight="semiBold" color={COLORS.text.muted}>
          There are no upcoming close days
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.upcomingAlertBox}>
      <View style={styles.upcomingAlertContent}>
        <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
          {dateRange}
        </Text>
        <Text variant="body2" weight="semiBold" color={COLORS.text.primary}>
          {timeRange}
        </Text>
      </View>
      <TouchableOpacity style={styles.upcomingAlertClose} onPress={onClear}>
        <X size={ms(16)} color="#E55959" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderRadius: ms(10),
    gap: hs(10),
  },
  greenDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: "#00B562",
  },
  upcomingAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(10),
    paddingVertical: vs(12),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  upcomingAlertContent: {
    flex: 1,
    gap: vs(4),
  },
  upcomingAlertClose: {
    padding: ms(4),
    borderWidth: 1,
    borderColor: "#E55959",
    borderRadius: ms(6),
    justifyContent: "center",
    alignItems: "center",
  },
});
