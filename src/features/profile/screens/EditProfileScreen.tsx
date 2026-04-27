// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/layouts/ScreenContainer";
import { Text } from "@/components/ui/Text";
import { TextInput } from "@/components/ui/TextInput";
import { EditableAvatar } from "../components/EditableAvatar";
import { SettingsActionRow } from "@/features/settings/components/SettingsActionRow";
import { ArrowLeft, HelpCircle } from "lucide-react-native";
import { vs, hs, ms } from "@/utils/responsive.utils";
import { useNavigation } from "@react-navigation/native";
import { COLORS } from "@/constants/theme";
import { useAuthStore } from "@/store";
import { useEditProfile } from "../hooks/useEditProfile";
// import { launchImageLibrary } from "react-native-image-picker";

// const GstinLabel = () => (
//   <View style={styles.gstinLabelContainer}>
//     <Text variant="body2" weight="medium" color={COLORS.text.muted}>
//       GSTIN No
//     </Text>
//     <TouchableOpacity style={styles.checkboxWrapper} activeOpacity={0.7}>
//       <Text variant="body2" weight="medium" color={COLORS.text.muted}>
//         Dont have
//       </Text>
//       <View style={styles.checkboxOutline} />
//     </TouchableOpacity>
//   </View>
// );

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  // Destructure 'profile' instead of 'user' for custom DB fields
  const { user, profile, clientProfile } = useAuthStore();
  const {
    updateProfile,
    isUpdating,
    // uploadAvatar,
    isUploading,
  } = useEditProfile();

  // Correctly map to the Profile interface (Blueprint Table 4.1)
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [mobile, setMobile] = useState(profile?.phone || "");

  // Sync state when profile loads from useVendorData hook
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone) setMobile(profile.phone);
  }, [profile]);

  // const handlePickImage = async () => {
  //   try {
  //     const result = await launchImageLibrary({
  //       mediaType: "photo",
  //       includeBase64: true,
  //       quality: 0.7,
  //       selectionLimit: 1, // Only one photo
  //     });

  //     if (result.didCancel) {
  //     } else if (result.errorCode) {
  //     } else if (result.assets && result.assets.length > 0) {
  //       await uploadAvatar(result.assets[0]);
  //     }
  //   } catch (error) {
  //     console.error("Gallery Error:", error);
  //   }
  // };

  /**
   * Coordinate the state variables with the hook parameters.
   */
  const handleDone = async () => {
    if (!profile || !clientProfile) return;

    // FIX: Match variables to parameters
    // updateProfile(newName, newPhone)
    await updateProfile(fullName, mobile);
  };

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
        <TouchableOpacity onPress={handleDone} disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text variant="body1" weight="bold" color={COLORS.primary}>
              Done
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Avatar Section (Blueprint Table 4.1 avatar_url) */}
      <View style={styles.avatarContainer}>
        <EditableAvatar
          size={100}
          source={profile?.avatar_url ? { uri: profile.avatar_url } : undefined}
          fallbackInitials={profile?.full_name?.charAt(0) || "P"}
          // onEditPress={handlePickImage} // Wired up!
          loading={isUploading}
        />
      </View>

      {/* 3. Editable Form Fields */}
      <View style={styles.formSection}>
        <TextInput variant="filled" label="Full Name" value={fullName} onChangeText={setFullName} />

        <TextInput
          variant="filled"
          label="Mobile No"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
        />
        <TextInput
          variant="filled"
          label="Gmail"
          value={user?.email || ""}
          editable={false} // Email is locked to auth account
          style={styles.disabledInput}
        />
      </View>

      {/* 4. Read-Only Financial Info (Blueprint Tables 4.2 & 4.3) */}
      {/* <View style={styles.formSection}>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label="Bank Name"
              defaultValue={clientProfile?.bank_account_name || "Not Set"}
              editable={false}
              style={styles.disabledInput}
            />
          </View>
          <View style={styles.halfWidth}>
            <TextInput
              variant="filled"
              label="IFSC Code"
              defaultValue={clientProfile?.bank_ifsc || "Not Set"}
              editable={false}
              style={styles.disabledInput}
            />
          </View>
        </View>

        <TextInput
          variant="filled"
          label="Account No"
          defaultValue={clientProfile?.bank_account_number || "•••• •••• ••••"}
          editable={false}
          style={styles.disabledInput}
        />

        <TextInput
          variant="filled"
          label={<GstinLabel />}
          defaultValue="Verification Pending" // GST isolated in vendor_kyc
          editable={false}
          style={styles.disabledInput}
        />

        <TextInput
          variant="filled"
          label="Pan Card"
          defaultValue="Verification Pending" // PAN isolated in vendor_kyc
          editable={false}
          style={styles.disabledInput}
        />
      </View> */}

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
