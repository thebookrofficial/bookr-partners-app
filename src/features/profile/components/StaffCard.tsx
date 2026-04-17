// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Trash2, Ban } from "lucide-react-native";
import { hs, vs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface StaffCardProps {
  name: string;
  role: string;
  type: "Manager" | "Employee";
}

export const StaffCard = ({ name, role, type }: StaffCardProps) => (
  <View style={styles.container}>
    {/* Column 1: Avatar (50x50) */}
    <Avatar size={50} fallbackInitials={name.charAt(0)} />

    {/* Column 2: Info (Flex Grow) */}
    <View style={styles.info}>
      <Text variant="h3" weight="bold">
        {name}
      </Text>
      <Text variant="body2" weight="semiBold" color={COLORS.text.primary} style={styles.roleText}>
        {role}
      </Text>
    </View>

    {/* Column 3: Type (Centered vertically) */}
    <View style={styles.typeContainer}>
      <Text variant="body1" weight="semiBold" color={COLORS.text.primary}>
        {type}
      </Text>
    </View>

    {/* Column 4: Actions (Stacked vertically) */}
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.iconBtn}>
        <Trash2 size={ms(20)} color={COLORS.danger} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn}>
        <Ban size={ms(20)} color={COLORS.warning} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(6),
    paddingVertical: vs(10),
    borderRadius: ms(10),
    height: vs(70),
    marginBottom: vs(10),
    gap: hs(10), // Matches Figma gap: 10px
  },
  info: {
    flex: 1, // This allows the name/role to take up the middle space
    flexDirection: "column",
    alignItems: "flex-start",
    gap: vs(2), // Slight gap between name and role
  },
  roleText: {
    marginTop: vs(2),
  },
  typeContainer: {
    height: vs(50),
    justifyContent: "center",
    alignItems: "center",
    // We don't strictly enforce width: 68px to allow for translation,
    // but the flex layout will mimic it perfectly.
  },
  actionsContainer: {
    height: vs(50),
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    width: hs(24), // Matches Figma width: 24px
    gap: vs(2), // Matches Figma gap: 2px
  },
  iconBtn: {
    width: hs(24),
    height: vs(24),
    justifyContent: "center",
    alignItems: "center",
  },
});
