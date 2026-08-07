// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import { Text } from "@/components/ui";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface EventHeaderProps {
  title: string;
  subtitle: string;
  imageSource?: ImageSourcePropType;
  logoSource?: ImageSourcePropType;
}

export const EventHeader = ({ title, subtitle, imageSource, logoSource }: EventHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, { backgroundColor: COLORS.surface.fallback }]} />
        )}
        {logoSource && (
          <View style={styles.logoOverlay}>
            <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <Text family="nichrome" weight="bold" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text weight="bold" style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: vs(6),
    marginBottom: vs(10), // Reduced from 15 to match Figma gap
  },
  backBtn: {
    marginRight: hs(10),
  },
  imageContainer: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(20), // Figma: 20px
    overflow: "hidden",
    backgroundColor: COLORS.surface.imagePlaceholder,
    marginRight: hs(10),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    gap: vs(6), // Figma gap
  },
  title: {
    fontSize: fs(22),
    lineHeight: fs(20.46), // 93% of 22
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: fs(16),
    lineHeight: fs(14.88), // 93% of 16
    color: COLORS.text.primary,
  },
});
