// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

export const LegendIndicator = () => {
  return (
    <View style={styles.container}>
      <View style={styles.legendItem}>
        <View style={[styles.dot, styles.available]} />
        <Text variant="body2" weight="bold">
          Available
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, styles.manual]} />
        <Text variant="body2" weight="bold">
          Manuel
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, styles.online]} />
        <Text variant="body2" weight="bold">
          Online
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.dot, styles.unavailable]} />
        <Text variant="body2" weight="bold">
          Unavailable
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: hs(6),
    marginBottom: vs(10),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  dot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  available: {
    backgroundColor: COLORS.surface.primary,
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
  manual: { backgroundColor: "#E57C59" },
  online: { backgroundColor: COLORS.primary },
  unavailable: { backgroundColor: "#E5E5E5" },
});
