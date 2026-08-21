// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Avatar, AvatarProps } from "@/components/ui/Avatar";
import { Camera } from "lucide-react-native";
import { ms } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

interface EditableAvatarProps extends AvatarProps {
  onEditPress?: () => void;
  loading?: boolean;
}

export const EditableAvatar = ({ onEditPress, loading, ...avatarProps }: EditableAvatarProps) => {
  return (
    <View style={styles.container}>
      <Avatar {...avatarProps} />
      {onEditPress && (
        <TouchableOpacity
          style={styles.badge}
          activeOpacity={0.8}
          onPress={onEditPress}
          disabled={loading} // Disable button while uploading
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.text.inverse} />
          ) : (
            <Camera size={ms(16)} color={COLORS.text.inverse} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
  },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.background,
  },
});
