// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainStackParamList } from "@/navigation/navigation.types";
import { COLORS } from "@/constants/theme";
import { useAuthLogic } from "@/features/auth/hooks/useAuthLogic";
import { LEGAL_TEXT } from "@/constants/legal";
import { SUPPORT_TEXT } from "@/constants/support";

export const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { logout } = useAuthLogic();

  // HIGHLY COMPLIANT DELETION LOGIC
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently remove your vendor profile and all associated data within 30 days.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request Deletion",
          style: "destructive",
          onPress: async () => {
            const subject = encodeURIComponent("Account Deletion Request - Bookr Partner");
            const body = encodeURIComponent(
              "Hello Support Team,\n\nI would like to request the deletion of my Bookr Partner account and all associated data. Please process my request.\n\nThank you.",
            );
            const url = `mailto:support@thebookr.in?subject=${subject}&body=${body}`;

            try {
              const supported = await Linking.canOpenURL(url);
              if (supported) {
                await Linking.openURL(url);
              } else {
                // Fallback if no email client is installed
                Alert.alert(
                  "Action Required",
                  "Please email support@thebookr.in directly from your registered email address to process your deletion.",
                );
              }
            } catch (error) {
              console.error("Error opening email client", error);
            }
          },
        },
      ],
    );
  };

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

      {/* 3. Help and Support Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          HELP AND SUPPORT
        </Text>
        <View style={styles.listContainer}>
          <SettingsActionRow
            icon={<Ticket size={ms(20)} color={COLORS.primary} />}
            label="Privacy Policy"
            onPress={() =>
              navigation.navigate("LegalView", {
                title: LEGAL_TEXT.privacy.title,
                content: LEGAL_TEXT.privacy.content,
              })
            }
          />
          <SettingsActionRow
            icon={<FileText size={ms(20)} color={COLORS.primary} />}
            label="Terms and condition"
            onPress={() =>
              navigation.navigate("LegalView", {
                title: LEGAL_TEXT.terms.title,
                content: LEGAL_TEXT.terms.content,
              })
            }
          />
          <SettingsActionRow
            icon={<HelpCircle size={ms(20)} color={COLORS.primary} />}
            label="Support and Help"
            onPress={() =>
              navigation.navigate("LegalView", {
                title: SUPPORT_TEXT.help.title,
                content: SUPPORT_TEXT.help.content,
              })
            }
          />
          <SettingsActionRow
            icon={<AlertTriangle size={ms(20)} color={COLORS.primary} />}
            label="Report a Grievance"
            onPress={() =>
              navigation.navigate("LegalView", {
                title: SUPPORT_TEXT.grievance.title,
                content: SUPPORT_TEXT.grievance.content,
              })
            }
          />
        </View>
      </View>

      {/* 4. Account Settings Section */}
      <View style={styles.sectionContainer}>
        <Text variant="body1" weight="bold" style={styles.sectionTitle}>
          ACCOUNT SETTINGS
        </Text>
        <View style={styles.listContainer}>
          <SettingsActionRow
            icon={<LogOut size={ms(20)} color={COLORS.primary} />}
            label="Log out"
            onPress={logout}
          />
          <SettingsActionRow
            icon={<Trash2 size={ms(20)} color={COLORS.danger} />}
            label="Delete account"
            danger
            onPress={handleDeleteAccount}
          />
        </View>
      </View>

      {/* 5. Footer */}
      <View style={styles.footer}>
        <Text variant="caption" weight="bold" color={COLORS.text.muted}>
          Version 1.1.7
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
