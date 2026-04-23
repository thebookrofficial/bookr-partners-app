// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface DineFilterBarProps {
  title: string;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export const DineFilterBar = ({ title, selectedFilter, onFilterChange }: DineFilterBarProps) => {
  const filters = ["Today", "Tomorrow", "All"];

  return (
    <View style={styles.container}>
      <Text variant="h3" weight="extraBold" style={styles.title}>
        {title}
      </Text>
      <View style={styles.filterOptions}>
        {filters.map(filter => {
          const isActive = selectedFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              onPress={() => onFilterChange(filter)}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}>
              <Text
                variant="caption"
                weight="medium"
                style={isActive ? styles.filterTextActive : styles.filterTextInactive}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(15),
    width: "100%",
  },
  title: {
    fontSize: ms(20),
    color: COLORS.text.primary,
  },
  filterOptions: {
    flexDirection: "row",
    gap: hs(6),
  },
  filterButton: {
    paddingHorizontal: hs(12),
    paddingVertical: vs(6),
    borderRadius: ms(10),
    backgroundColor: "#F4F7FC",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterButtonActive: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary,
  },
  filterTextActive: {
    color: COLORS.primary,
    fontSize: ms(12),
  },
  filterTextInactive: {
    color: "#8C8C8C",
    fontSize: ms(12),
  },
});
