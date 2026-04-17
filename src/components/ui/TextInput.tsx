// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text } from "./Text";
import { hs, vs, ms, fs } from "@/utils/responsive.utils";
import { COLORS } from "@/constants/theme";

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  secureTextEntry,
  ...rest
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="body2" weight="medium" color={COLORS.text.secondary} style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          error ? styles.errorContainer : undefined,
        ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.text.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPasswordVisible}
          {...rest}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Text variant="caption" weight="semiBold" color={COLORS.text.secondary}>
              {isPasswordVisible ? "SHOW" : "HIDE"}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>

      {error && (
        <Text variant="caption" color={COLORS.danger} style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: vs(16),
  },
  label: {
    marginBottom: vs(8),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: vs(54),
    borderWidth: 1.5,
    borderColor: COLORS.border.pillActive,
    borderRadius: ms(12),
    backgroundColor: COLORS.background,
    paddingHorizontal: hs(16),
  },
  focusedContainer: {
    borderColor: COLORS.text.primary,
  },
  errorContainer: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: fs(16),
    color: COLORS.text.primary,
    paddingVertical: vs(12),
  },
  leftIcon: {
    marginRight: hs(12),
  },
  rightIcon: {
    marginLeft: hs(12),
  },
  errorText: {
    marginTop: vs(6),
  },
});
