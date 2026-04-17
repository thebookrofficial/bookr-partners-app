import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

export interface PillTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const PillTabs = ({ tabs, activeTab, onTabChange }: PillTabsProps) => {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {tabs.map(tab => {
          const isActive = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.7}
              onPress={() => onTabChange(tab)}
              style={[styles.pill, isActive ? styles.activePill : styles.inactivePill]}>
              <Text
                variant="body2"
                weight="semiBold"
                color={isActive ? COLORS.text.primary : COLORS.text.muted}>
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
  wrapper: { marginVertical: vs(16) },
  scrollContainer: { gap: hs(10) },
  pill: {
    paddingHorizontal: hs(20),
    paddingVertical: vs(8),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  activePill: {
    backgroundColor: COLORS.surface.pillActive,
    borderWidth: 1,
    borderColor: COLORS.border.pillActive,
  },
  inactivePill: {
    backgroundColor: COLORS.surface.pillInactive,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
