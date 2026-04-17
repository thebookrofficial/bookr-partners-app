// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { EditableAvatar } from "../components/EditableAvatar";
import { SettingsActionRow } from "@/features/settings/components/SettingsActionRow";
import { ArrowLeft, HelpCircle } from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";

// Custom Label for GSTIN to include the "Dont have" checkbox
const GstinLabel = () => (
  <View style={styles.gstinLabelContainer}>
    <Text variant="body2" weight="medium" color={COLORS.text.muted}>
      GSTIN No
    </Text>
    <TouchableOpacity style={styles.checkboxWrapper} activeOpacity={0.7}>
      <Text variant="body2" weight="medium" color={COLORS.text.muted}>
        Dont have
      </Text>
      {/* Square placeholder to match lsicon:checkbox-outline */}
      <View style={styles.checkboxOutline} />
    </TouchableOpacity>
  </View>
);

export const EditProfileScreen = () => {
  const navigation = useNavigation();

  return (
    <ScreenContainer scrollable backgroundColor={COLORS.background} paddingHorizontal={hs(12)}>
      {/* 1. App Bar */}
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={ms(20)} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text variant="h3" weight="bold">
            Personal Info
          </Text>
        </View>
        <TouchableOpacity>
          <Text variant="body1" weight="bold" color={COLORS.primary}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Avatar Section */}
      <View style={styles.avatarContainer}>
        <EditableAvatar size={100} fallbackInitials="Y" />
      </View>

      {/* 3. Editable Form Fields */}
      <View style={styles.formSection}>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput variant="filled" label="First Name" defaultValue="Yash" />
          </View>
          <View style={styles.halfWidth}>
            <TextInput variant="filled" label="Last name" defaultValue="Patil" />
          </View>
        </View>

        <TextInput
          variant="filled"
          label="Mobile No"
          defaultValue="+91 98345 34534"
          keyboardType="phone-pad"
        />
        <TextInput
          variant="filled"
          label="Gmail"
          defaultValue="patilyash03@gmail.com"
          keyboardType="email-address"
        />
      </View>

      {/* 4. Read-Only / Disabled Fields (Bank & Tax Info) */}
      <View style={styles.formSection}>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label="Bank Name"
              defaultValue="HDFC Bank"
              editable={false}
              style={styles.disabledInput}
            />
          </View>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label="IFSC Code"
              defaultValue="HDFC012344"
              editable={false}
              style={styles.disabledInput}
            />
          </View>
        </View>

        <TextInput
          variant="filled"
          label="Account No"
          defaultValue="1234 1261 7891"
          editable={false}
          style={styles.disabledInput}
        />

        <TextInput
          variant="filled"
          label={<GstinLabel />} // Injects our custom ReactNode label
          defaultValue="27ABCDE1234F1Z5"
          editable={false}
          style={styles.disabledInput}
        />

        <TextInput
          variant="filled"
          label="Pan Card"
          defaultValue="ZXCVB4321L"
          editable={false}
          style={styles.disabledInput}
        />
      </View>

      {/* 5. Help & Support Section */}
      <View style={styles.helpSection}>
        <View style={styles.helpHeader}>
          <Text variant="body1" weight="bold" style={styles.helpTitle}>
            HELP
          </Text>
          <Text variant="caption" weight="semiBold" color={COLORS.text.muted}>
            *For any enquiry related changing info contact us
          </Text>
        </View>

        <SettingsActionRow
          icon={<HelpCircle size={ms(20)} color={COLORS.primary} />}
          label="Support and Help"
        />
      </View>

      <View style={{ height: vs(40) }} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: vs(37),
    marginTop: vs(6),
    marginBottom: vs(20),
  },
  appBarLeft: { flexDirection: "row", alignItems: "center", gap: hs(10) },
  backBtn: { justifyContent: "center", alignItems: "center" },
  avatarContainer: { alignItems: "center", marginBottom: vs(30) },
  formSection: { width: "100%" },
  row: { flexDirection: "row", gap: hs(20) },
  halfWidth: { flex: 1 },
  disabledInput: { color: COLORS.text.muted },
  helpSection: { marginTop: vs(10), width: "100%" },
  helpHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: vs(6),
    marginBottom: vs(10),
  },
  helpTitle: { textTransform: "uppercase" },

  // Custom GSTIN Label Styles
  gstinLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: vs(4),
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: hs(6),
  },
  checkboxOutline: {
    width: ms(16),
    height: ms(16),
    borderWidth: 1,
    borderColor: COLORS.text.muted,
    borderRadius: ms(2),
  },
});
