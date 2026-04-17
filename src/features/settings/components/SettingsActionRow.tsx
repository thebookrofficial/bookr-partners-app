// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "@/components/ui";
import { ChevronRight } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface SettingsActionRowProps {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onPress?: () => void;
}

export const SettingsActionRow = ({
  icon,
  label,
  danger = false,
  onPress,
}: SettingsActionRowProps) => {
  // If danger is true, use red, otherwise standard black text
  const textColor = danger ? `${COLORS.danger}` : `${COLORS.text.primary}`;

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text variant="body2" weight="bold" color={textColor} style={styles.label}>
        {label}
      </Text>
      <ChevronRight size={ms(16)} color={textColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    height: vs(36),
    borderRadius: ms(10),
    paddingHorizontal: hs(6),
    gap: hs(6),
    width: "100%",
  },
  iconContainer: {
    width: hs(24),
    height: vs(24),
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    flex: 1, // Pushes the chevron to the far right
  },
});
