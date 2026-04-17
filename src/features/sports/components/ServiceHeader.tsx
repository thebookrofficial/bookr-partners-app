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
  category: string;
  imageUri?: string;
}

export const ServiceHeader = ({ title, category, imageUri }: ServiceHeaderProps) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Image source={{ uri: imageUri || "https://placeholder.com/100" }} style={styles.image} />
        <Text family="nichrome" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <TouchableOpacity style={styles.dropdown}>
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
    height: vs(50),
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
    backgroundColor: COLORS.danger, // Red fallback from Figma
  },
  title: {
    fontSize: fs(22),
    lineHeight: fs(22),
    color: COLORS.text.primary,
    flex: 1,
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
