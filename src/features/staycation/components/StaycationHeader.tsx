// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, ImageSourcePropType } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { hs, vs, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface StaycationHeaderProps {
  title: string;
  imageSource?: ImageSourcePropType;
}

export const StaycationHeader = ({ title, imageSource }: StaycationHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Avatar source={imageSource} size={50} />
        <View style={styles.textWrapper}>
          <Text family="nichrome" weight="bold" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: vs(50),
    marginBottom: vs(10),
    marginTop: vs(10),
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
  },
  title: {
    fontSize: fs(22),
    lineHeight: fs(22),
    color: COLORS.text.primary,
  },
});
