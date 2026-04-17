// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { Text } from "./Text";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

export interface PillTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: "default" | "primary";
  style?: StyleProp<ViewStyle>; // Added to allow external style overrides
}

export const PillTabs = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "default",
  style,
}: PillTabsProps) => {
  const isPrimary = variant === "primary";

  return (
    // Applied the external style array to the main wrapper
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {tabs.map(tab => {
          const isActive = tab === activeTab;

          // Determine styles based on variant
          const activeStyle = isPrimary ? styles.primaryActive : styles.defaultActive;
          const inactiveStyle = isPrimary ? styles.primaryInactive : styles.defaultInactive;
          const baseStyle = isPrimary ? styles.primaryPill : styles.defaultPill;

          // Determine exact text color
          let textColor;
          if (isActive) {
            textColor = isPrimary ? COLORS.text.inverse : COLORS.text.primary;
          } else {
            textColor = isPrimary ? COLORS.text.primary : COLORS.text.muted;
          }

          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              onPress={() => onTabChange(tab)}
              style={[baseStyle, isActive ? activeStyle : inactiveStyle]}>
              <Text variant="body2" weight="semiBold" color={textColor} style={styles.tabText}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginVertical: vs(10) },
  scrollContainer: { gap: hs(10) },
  tabText: { textTransform: "capitalize" },

  // --- DEFAULT VARIANT (VendorProfileScreen) ---
  defaultPill: {
    paddingHorizontal: hs(20),
    paddingVertical: vs(8),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  defaultActive: {
    backgroundColor: COLORS.surface.pillActive,
    borderWidth: 1,
    borderColor: COLORS.border.pillActive,
  },
  defaultInactive: {
    backgroundColor: COLORS.surface.pillInactive,
    borderWidth: 1,
    borderColor: "transparent",
  },

  // --- PRIMARY VARIANT (SportsHomeScreen Ground Selector) ---
  primaryPill: {
    paddingHorizontal: hs(18),
    height: vs(33),
    borderRadius: ms(25),
    justifyContent: "center",
    alignItems: "center",
  },
  primaryActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryInactive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#CBDFFE",
  },
});
