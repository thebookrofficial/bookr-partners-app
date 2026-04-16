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
        <Text variant="body2" weight="medium" color="#666666" style={styles.label}>
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
          placeholderTextColor="#A0A0A0"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPasswordVisible}
          {...rest}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Text variant="caption" weight="semiBold" color="#666666">
              {isPasswordVisible ? "SHOW" : "HIDE"}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>

      {error && (
        <Text variant="caption" color="#FF3B30" style={styles.errorText}>
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
    borderColor: "#E5E5E5",
    borderRadius: ms(12),
    backgroundColor: "#FFFFFF",
    paddingHorizontal: hs(16),
  },
  focusedContainer: {
    borderColor: "#000000",
  },
  errorContainer: {
    borderColor: "#FF3B30",
  },
  input: {
    flex: 1,
    fontSize: fs(16),
    color: "#1A1A1A",
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
