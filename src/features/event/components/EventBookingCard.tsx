// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface EventBookingCardProps {
  name: string;
  passType: string;
  time: string;
  avatarSource?: any;
  isSpot?: boolean;
  phone?: string;
  onPress?: () => void;
}

export const EventBookingCard = ({
  name,
  passType,
  time,
  avatarSource,
  isSpot,
  onPress,
}: EventBookingCardProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrapper}>
        <Avatar source={avatarSource} size={50} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameWrapper}>
            <View style={styles.nameRow}>
              <Text weight="bold" style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </View>

            <Text weight="medium" style={styles.passInfo}>
              {passType}
            </Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.rightColumn}>
            <Text weight="semiBold" style={styles.time}>
              {time}
            </Text>
            {isSpot && (
              <View style={styles.spotBadge}>
                <Text weight="semiBold" style={styles.spotText}>
                  Spot
                </Text>
              </View>
            )}
          </View>
        </View>
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
    paddingHorizontal: hs(6),
    paddingVertical: vs(10),
    gap: hs(10),
    width: "100%",
    minHeight: vs(70), // Changed from fixed height
  },
  avatarWrapper: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(45), // Figma: 45px for card avatar
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameWrapper: {
    flex: 1,
    gap: vs(4),
    paddingBottom: vs(4),
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  name: {
    fontSize: fs(16),
    lineHeight: fs(14.88),
    color: COLORS.text.primary,
    flexShrink: 1, // Ensure long names truncate before pushing the badge off-screen
  },
  spotBadge: {
    backgroundColor: "#EEF3FC",
    paddingHorizontal: hs(10),
    paddingVertical: vs(4),
    borderRadius: ms(6),
  },
  spotText: {
    fontSize: fs(14),
    color: "#4A80F0",
  },
  phoneInfo: {
    fontSize: fs(14),
    color: COLORS.text.muted,
  },
  passInfo: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  spacer: {
    width: hs(10),
    flex: 1,
  },
  rightColumn: {
    alignItems: "flex-end",
    gap: vs(4),
  },
  time: {
    fontSize: fs(14),
    lineHeight: fs(14),
    color: COLORS.text.primary,
  },
  priceInfo: {
    fontSize: fs(16),
    color: COLORS.text.primary,
  },
});
