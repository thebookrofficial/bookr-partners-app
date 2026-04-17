// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui";
import { SettingsActionRow } from "../components/SettingsActionRow";
import {
  ArrowLeft,
  Ticket,
  FileText,
  HelpCircle,
  AlertTriangle,
  LogOut,
  Trash2,
} from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";

export const SettingsScreen = () => {
  const navigation = useNavigation();

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* 1. App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={ms(20)} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold">
          Settings
        </Text>
      </View>

      {/* 2. Help and Support Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          HELP AND SUPPORT
        </Text>
        <View style={styles.listContainer}>
          <SettingsActionRow
            icon={<Ticket size={ms(20)} color={COLORS.primary} />}
            label="Privacy Policy"
          />
          <SettingsActionRow
            icon={<FileText size={ms(20)} color={COLORS.primary} />}
            label="Terms and condition"
          />
          <SettingsActionRow
            icon={<HelpCircle size={ms(20)} color={COLORS.primary} />}
            label="Support and Help"
          />
          <SettingsActionRow
            icon={<AlertTriangle size={ms(20)} color={COLORS.primary} />}
            label="Report a Grievance"
          />
        </View>
      </View>

      {/* 3. Account Settings Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          ACCOUNT SETTINGS
        </Text>
        <View style={styles.listContainer}>
          <SettingsActionRow
            icon={<LogOut size={ms(20)} color={COLORS.primary} />}
            label="Log out"
          />
          <SettingsActionRow
            icon={<Trash2 size={ms(20)} color={COLORS.danger} />}
            label="Delete account"
            danger
          />
        </View>
      </View>

      {/* 4. Footer */}
      <View style={styles.footer}>
        <Text variant="caption" weight="bold" color={COLORS.text.muted}>
          Version 1.0.0 (Beta)
        </Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    height: vs(37),
    marginTop: vs(6),
    marginBottom: vs(30),
    gap: hs(10),
  },
  backBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  sectionContainer: {
    marginBottom: vs(30),
    width: "100%",
  },
  sectionTitle: {
    textTransform: "uppercase",
    marginBottom: vs(15),
  },
  listContainer: {
    gap: vs(10),
  },
  footer: {
    marginTop: vs(40),
    alignItems: "center",
    width: "100%",
  },
});
