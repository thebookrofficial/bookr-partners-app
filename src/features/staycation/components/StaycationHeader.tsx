// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { hs, vs, fs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface StaycationHeaderProps {
  title: string;
  subtitle?: string;
  imageSource?: ImageSourcePropType;
  onBack?: () => void;
}

export const StaycationHeader = ({ title, subtitle, imageSource }: StaycationHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Avatar source={imageSource} size={ms(50)} />
        <View style={styles.textWrapper}>
          <Text family="nichrome" weight="bold" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text weight="bold" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {/* Back button removed as it's not in the main feature home screen design */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: vs(50),
    marginBottom: vs(15),
    paddingHorizontal: hs(6),
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  textWrapper: {
    flex: 1,
    justifyContent: "center",
    gap: vs(4),
  },
  title: {
    fontSize: fs(22),
    color: COLORS.text.primary,
    lineHeight: fs(22 * 0.93),
  },
  subtitle: {
    fontSize: fs(16),
    color: COLORS.text.primary,
    lineHeight: fs(16),
  },
});
