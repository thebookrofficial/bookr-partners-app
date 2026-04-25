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
  onPress?: () => void;
}

export const EventBookingCard = ({
  name,
  passType,
  time,
  avatarSource,
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
            <Text weight="bold" style={styles.name}>
              {name}
            </Text>
            <Text weight="medium" style={styles.passInfo}>
              {passType}
            </Text>
          </View>
          <View style={styles.spacer} />
          <Text weight="semiBold" style={styles.time}>
            {time}
          </Text>
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
    height: vs(70), // Figma height
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
    alignItems: "center",
  },
  nameWrapper: {
    flex: 1,
    gap: vs(6),
    paddingBottom: vs(4),
  },
  name: {
    fontSize: fs(16),
    lineHeight: fs(14.88), // 93% of 16
    color: COLORS.text.primary,
  },
  passInfo: {
    fontSize: fs(14),
    color: COLORS.text.primary,
  },
  spacer: {
    width: hs(37),
  },
  time: {
    fontSize: fs(14),
    lineHeight: fs(14),
    color: COLORS.text.primary,
  },
});
