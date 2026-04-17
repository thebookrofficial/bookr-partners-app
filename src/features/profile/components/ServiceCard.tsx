// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { Text } from "@/components/ui";
import { MapPin } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface ServiceCardProps {
  title: string;
  location: string;
  image: ImageSourcePropType;
}

export const ServiceCard = ({ title, location, image }: ServiceCardProps) => (
  <View style={styles.container}>
    <Image source={image} style={styles.image} />
    <View style={styles.info}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.locationRow}>
        <MapPin size={fs(14)} color={COLORS.primary} strokeWidth={2.5} />
        <Text
          variant="caption"
          weight="bold"
          color={COLORS.text.primary}
          numberOfLines={1}
          style={styles.locationText}>
          {location}
        </Text>
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(16),
  },
  image: {
    width: hs(100),
    height: hs(100),
    borderRadius: ms(20),
    backgroundColor: COLORS.surface.imagePlaceholder,
  },
  info: {
    flex: 1,
    marginLeft: hs(16),
  },
  title: {
    fontSize: fs(22),
    fontWeight: "700",
    lineHeight: fs(24),
    color: COLORS.text.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(6),
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(8),
    paddingVertical: vs(4),
    borderRadius: ms(10),
    alignSelf: "flex-start",
  },
  locationText: {
    marginLeft: hs(4),
  },
});
