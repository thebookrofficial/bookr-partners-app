import React from "react";
import { View, Image, StyleSheet, ImageSourcePropType } from "react-native";
import { Text } from "./Text";
import { ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { STRINGS } from "@/constants/strings";

export interface AvatarProps {
  source?: ImageSourcePropType | { uri: string };
  fallbackInitials?: string;
  size?: number;
}

export const Avatar = ({
  source,
  fallbackInitials = STRINGS.common.avatarFallback,
  size = 64,
}: AvatarProps) => {
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
            color={COLORS.text.secondary}
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
    backgroundColor: COLORS.surface.secondary,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface.fallback,
    justifyContent: "center",
    alignItems: "center",
  },
});
