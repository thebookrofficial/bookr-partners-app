// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { Text } from "./Text";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

export interface PillTabsProps {
  tabs: (string | { label: string; count?: string | number })[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  variant?: "default" | "primary" | "dark";
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
  const isDark = variant === "dark";

  return (
    // Applied the external style array to the main wrapper
    <View style={[styles.wrapper, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {tabs.map((tabItem, index) => {
          const tabLabel = typeof tabItem === "string" ? tabItem : tabItem.label;
          const tabCount = typeof tabItem === "string" ? undefined : tabItem.count;
          const isActive = tabLabel === activeTab;

          // Determine styles based on variant
          let activeStyle, inactiveStyle, baseStyle;

          if (isDark) {
            activeStyle = styles.darkActive;
            inactiveStyle = styles.darkInactive;
            baseStyle = styles.darkPill;
          } else if (isPrimary) {
            activeStyle = styles.primaryActive;
            inactiveStyle = styles.primaryInactive;
            baseStyle = styles.primaryPill;
          } else {
            activeStyle = styles.defaultActive;
            inactiveStyle = styles.defaultInactive;
            baseStyle = styles.defaultPill;
          }

          // Determine exact text color
          let textColor;
          if (isActive) {
            if (isDark) textColor = COLORS.text.inverse;
            else if (isPrimary) textColor = COLORS.text.inverse;
            else textColor = COLORS.text.primary;
          } else {
            if (isDark) textColor = COLORS.text.muted;
            else if (isPrimary) textColor = COLORS.text.primary;
            else textColor = COLORS.text.muted;
          }

          return (
            <TouchableOpacity
              key={`${tabLabel}-${index}`}
              activeOpacity={0.7}
              onPress={() => onTabChange(tabLabel)}
              style={[baseStyle, isActive ? activeStyle : inactiveStyle]}>
              <View style={styles.tabContent}>
                <Text
                  variant="body2"
                  weight="semiBold"
                  color={textColor}
                  style={[styles.tabText, isPrimary && { fontSize: fs(16) }]}>
                  {tabLabel}
                </Text>
                {tabCount !== undefined && (
                  <Text
                    variant="caption"
                    weight="semiBold"
                    color={textColor}
                    style={styles.tabCountText}>
                    ({tabCount})
                  </Text>
                )}
              </View>
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
  tabContent: { alignItems: "center", justifyContent: "center" },
  tabText: { textTransform: "capitalize", textAlign: "center" },
  tabCountText: { textAlign: "center" },

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
    paddingHorizontal: hs(30),
    height: vs(40),
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

  // --- DARK VARIANT (DineHomeScreen Bookings/Payments) ---
  darkPill: {
    paddingHorizontal: hs(18),
    height: vs(40),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
    minWidth: hs(100),
  },
  darkActive: {
    backgroundColor: "#282828",
  },
  darkInactive: {
    backgroundColor: "#F4F7FC",
  },
});
