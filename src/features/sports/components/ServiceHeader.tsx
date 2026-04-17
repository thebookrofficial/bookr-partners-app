// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { ChevronDown, ArrowLeft } from "lucide-react-native";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";

interface ServiceHeaderProps {
  title: string;
  subtitle?: string; // <-- Added subtitle prop
  category: string;
  imageUri?: string;
  onCategoryPress?: () => void; // <-- Added interaction prop
}

export const ServiceHeader = ({
  title,
  subtitle,
  category,
  imageUri,
  onCategoryPress,
}: ServiceHeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Image source={{ uri: imageUri || "https://placeholder.com/100" }} style={styles.image} />

        {/* Updated text wrapper to handle subtitle */}
        <View style={styles.textWrapper}>
          <Text family="nichrome" style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="body1" weight="bold" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.dropdown} onPress={onCategoryPress} activeOpacity={0.7}>
        <Text variant="body2" weight="semiBold" style={styles.categoryText}>
          {category}
        </Text>
        <ChevronDown size={ms(16)} color={COLORS.text.primary} />
      </TouchableOpacity>
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
  },
  backBtn: {
    marginRight: hs(10),
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: hs(10),
  },
  image: {
    width: ms(50),
    height: ms(50),
    borderRadius: ms(20),
    backgroundColor: COLORS.danger,
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
    marginTop: vs(2),
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  categoryText: {
    textTransform: "capitalize",
  },
});
