// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { ChevronRight } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface EventActionRowProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

export const EventActionRow = ({ icon, label, onPress }: EventActionRowProps) => {
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.labelContainer}>
        <Text weight="bold" style={styles.label}>
          {label}
        </Text>
      </View>
      <View style={styles.chevronContainer}>
        <ChevronRight size={ms(16)} color={COLORS.text.primary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    borderRadius: ms(10),
    padding: ms(6),
    gap: hs(6),
    width: "100%",
    height: vs(36), // Approximate based on padding and text
  },
  iconContainer: {
    width: ms(20),
    height: ms(20),
    justifyContent: "center",
    alignItems: "center",
  },
  labelContainer: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  chevronContainer: {
    paddingHorizontal: hs(6),
    paddingVertical: vs(4),
  },
});
