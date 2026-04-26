// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, ImageSourcePropType, TouchableOpacity } from "react-native";
import { Text, Avatar } from "@/components/ui";
import { hs, vs, fs, ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

interface StaycationHeaderProps {
  title: string;
  subtitle?: string;
  imageSource?: ImageSourcePropType;
  onBack?: () => void;
}

export const StaycationHeader = ({
  title,
  subtitle,
  imageSource,
  onBack,
}: StaycationHeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack || (() => navigation.goBack())} style={styles.backButton}>
        <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Avatar source={imageSource} size={50} />
        <View style={styles.textWrapper}>
          <Text family="nichrome" weight="bold" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="body1" weight="bold" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    minHeight: vs(50),
    marginBottom: vs(10),
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  backButton: {
    marginRight: hs(10),
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
  subtitle: {
    fontSize: fs(16),
    lineHeight: fs(16),
    color: COLORS.text.primary,
    marginTop: vs(4),
  },
});
