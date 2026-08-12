// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { Trash2 } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface StaffCardProps {
  name: string;
  permissions?: {
    sports?: string[];
    staycation?: string[];
    events?: string[];
  };
  isInvite?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  onBlock?: () => void;
}

export const StaffCard = ({ name, permissions, isInvite, onPress, onDelete }: StaffCardProps) => {
  const hasSports = permissions?.sports && permissions.sports.length > 0;
  const hasStaycation = permissions?.staycation && permissions.staycation.length > 0;
  const hasEvents = permissions?.events && permissions.events.length > 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Column 1: Avatar (50x50) */}
      <Avatar size={50} fallbackInitials={name.charAt(0)} />

      {/* Column 2: Info (Flex Grow) */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text variant="h3" weight="bold">
            {name}
          </Text>
          <View style={[styles.statusBadge, isInvite ? styles.statusPending : styles.statusActive]}>
            <Text
              variant="caption"
              weight="bold"
              color={isInvite ? COLORS.warning : COLORS.success}
              style={styles.statusText}>
              {isInvite ? "Pending" : "Active"}
            </Text>
          </View>
        </View>
        <View style={styles.badgesContainer}>
          {hasSports && (
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" color={COLORS.primary}>
                Sports
              </Text>
            </View>
          )}
          {hasStaycation && (
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" color={COLORS.success}>
                Staycation
              </Text>
            </View>
          )}
          {hasEvents && (
            <View style={styles.badge}>
              <Text variant="caption" weight="bold" color={COLORS.text.secondary}>
                Events
              </Text>
            </View>
          )}
          {!hasSports && !hasStaycation && !hasEvents && (
            <Text variant="caption" color={COLORS.text.muted}>
              No Access
            </Text>
          )}
        </View>
      </View>

      {/* Column 4: Actions (Stacked vertically) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.iconBtn} onPress={onDelete}>
          <Trash2 size={ms(20)} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

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
    gap: vs(6), // Slight gap between name and badges
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(8),
  },
  statusBadge: {
    paddingHorizontal: hs(6),
    paddingVertical: vs(2),
    borderRadius: ms(4),
  },
  statusPending: {
    backgroundColor: COLORS.warning + "20", // light warning background
  },
  statusActive: {
    backgroundColor: COLORS.success + "20", // light success background
  },
  statusText: {
    fontSize: fs(10),
  },
  badgesContainer: {
    flexDirection: "row",
    gap: hs(6),
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: COLORS.surface.pillActive,
    paddingHorizontal: hs(8),
    paddingVertical: vs(2),
    borderRadius: ms(4),
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
