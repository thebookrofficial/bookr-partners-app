// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { Text } from "./Text";
import { ms, fs } from "@/utils/responsive.utils";

export interface AvatarProps {
  source?: ImageSourcePropType | { uri: string };
  fallbackInitials?: string;
  size?: number;
}

export const Avatar = ({ source, fallbackInitials = "?", size = 64 }: AvatarProps) => {
  const scaledSize = ms(size);
  const borderRadius = scaledSize / 2;

  return (
    <View style={[styles.container, { width: scaledSize, height: scaledSize, borderRadius }]}>
      {source ? (
        <Image
          source={source}
          style={{ width: scaledSize, height: scaledSize, borderRadius }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallback, { borderRadius }]}>
          <Text
            variant="body1"
            weight="semiBold"
            color="#666666"
            style={{ fontSize: fs(size * 0.4) }}>
            {fallbackInitials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
  },
});
