// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { ArrowLeft } from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MainStackParamList } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";

const APP_ICON = require("@/assets/icons/app-icon.png");

export const LegalViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainStackParamList, "LegalView">>();
  const { title, content } = route.params;

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // 1. Headers
      if (line.startsWith("# ")) {
        return (
          <Text key={index} variant="h2" weight="bold" style={styles.h1}>
            {line.replace("# ", "").trim()}
          </Text>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <Text key={index} variant="body1" weight="bold" style={styles.h3}>
            {line.replace("### ", "").trim()}
          </Text>
        );
      }

      // 2. Bold Text (inline or full line)
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <Text
            key={index}
            variant="body2"
            weight="bold"
            color={COLORS.text.secondary}
            style={styles.boldLine}>
            {line.replace(/\*\*/g, "").trim()}
          </Text>
        );
      }

      // 3. Bullet points (SAFE RENDER FOR ANDROID)
      if (line.trim().startsWith("* ")) {
        const parts = line.trim().replace("* ", "").split(":");
        if (parts.length > 1) {
          return (
            <View key={index} style={styles.bulletRow}>
              <Text variant="body2" style={styles.bulletSymbol}>
                •
              </Text>
              <View style={styles.bulletContent}>
                <Text variant="body2" weight="bold" style={styles.primaryText}>
                  {parts[0]}:
                </Text>
                <Text variant="body2" style={styles.primaryText}>
                  {" " + parts.slice(1).join(":")}
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View key={index} style={styles.bulletRow}>
            <Text variant="body2" style={styles.bulletSymbol}>
              •
            </Text>
            <Text variant="body2" style={styles.bulletText}>
              {line.trim().replace("* ", "")}
            </Text>
          </View>
        );
      }

      // 4. Regular Paragraphs
      if (line.trim() === "") {
        return <View key={index} style={styles.spacing} />;
      }

      // Handle inline bold within regular text (simple version)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = line.split(boldRegex);
      if (parts.length > 1) {
        return (
          <View key={index} style={styles.inlineBoldContainer}>
            {parts.map((part, i) => {
              if (i % 2 === 1) {
                return (
                  <Text key={i} variant="body2" weight="bold" style={styles.primaryText}>
                    {part}
                  </Text>
                );
              }
              return (
                <Text key={i} variant="body2" style={styles.primaryText}>
                  {part}
                </Text>
              );
            })}
          </View>
        );
      }

      return (
        <Text key={index} variant="body2" style={styles.paragraph}>
          {line.trim()}
        </Text>
      );
    });
  };

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(20)}>
      {/* 1. App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={ms(24)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold">
          {title}
        </Text>
      </View>

      {/* 2. Brand Logo Header */}
      <View style={styles.logoHeader}>
        <Image source={APP_ICON} style={styles.appIcon} resizeMode="contain" />
      </View>

      {/* 3. Content Area */}
      <View style={styles.contentContainer}>{renderContent(content)}</View>

      <View style={{ height: vs(60) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    height: vs(50),
    marginTop: vs(10),
    marginBottom: vs(20),
    gap: hs(12),
  },
  backBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: COLORS.surface.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logoHeader: {
    alignItems: "center",
    marginBottom: vs(30),
    marginTop: vs(10),
  },
  appIcon: {
    width: hs(120),
    height: hs(120),
    borderRadius: ms(24),
  },
  contentContainer: {
    width: "100%",
  },
  h1: {
    marginTop: vs(24),
    marginBottom: vs(12),
    color: COLORS.text.primary,
    lineHeight: vs(28),
  },
  h3: {
    marginTop: vs(20),
    marginBottom: vs(8),
    color: COLORS.text.primary,
  },
  boldLine: {
    marginBottom: vs(12),
  },
  paragraph: {
    marginBottom: vs(12),
    lineHeight: vs(20),
    color: COLORS.text.primary,
    textAlign: "left",
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: vs(8),
    paddingLeft: hs(8),
  },
  bulletSymbol: {
    width: hs(15),
    color: "#4A00E0",
    fontWeight: "bold",
  },
  bulletText: {
    flex: 1,
    lineHeight: vs(20),
    color: COLORS.text.primary,
  },
  spacing: {
    height: vs(8),
  },
  bulletContent: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  inlineBoldContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: vs(12),
  },
  primaryText: {
    color: COLORS.text.primary,
  },
});
