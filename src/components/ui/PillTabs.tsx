// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "./Text";
import { hs, vs, ms } from "@/utils/responsive.utils";

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
                weight={isActive ? "semiBold" : "semiBold"}
                color={isActive ? "#1A1A1A" : "#A0A0A0"}>
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
  wrapper: {
    marginVertical: vs(16),
  },
  scrollContainer: {
    gap: hs(10),
  },
  pill: {
    paddingHorizontal: hs(20),
    paddingVertical: vs(8),
    borderRadius: ms(10),
    justifyContent: "center",
    alignItems: "center",
  },
  activePill: {
    backgroundColor: "#F0F4F8", // Light blue-ish grey from design
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inactivePill: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "transparent",
  },
});
