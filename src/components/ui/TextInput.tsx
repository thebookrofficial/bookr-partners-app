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
import { useKeyboardStore } from "@/store/keyboardStore";

export interface TextInputProps extends RNTextInputProps {
  label?: React.ReactNode | string; // Updated to allow custom layouts like checkboxes
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "outlined" | "filled"; // Added variant support
}

export const TextInput = ({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  secureTextEntry,
  variant = "outlined",
  editable = true,
  ...rest
}: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(secureTextEntry);
  const setIsNumericFocused = useKeyboardStore(state => state.setIsNumericFocused);

  const isFilled = variant === "filled";
  const isNumericType =
    rest.keyboardType === "numeric" ||
    rest.keyboardType === "number-pad" ||
    rest.keyboardType === "decimal-pad" ||
    rest.keyboardType === "phone-pad";

  return (
    <View style={styles.container}>
      {label &&
        (typeof label === "string" ? (
          <Text
            variant="body2"
            weight="bold"
            color={editable === false ? COLORS.text.muted : COLORS.text.primary}
            style={styles.label}>
            {label}
          </Text>
        ) : (
          <View style={styles.label}>{label}</View>
        ))}

      <View
        style={[
          styles.inputBase,
          isFilled ? styles.filledContainer : styles.outlinedContainer,
          isFocused && !isFilled && styles.focusedContainer,
          error ? styles.errorContainer : undefined,
        ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <RNTextInput
          style={[styles.input, isFilled && styles.filledInput, style]}
          placeholderTextColor={COLORS.text.muted}
          onFocus={e => {
            setIsFocused(true);
            if (isNumericType) setIsNumericFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            if (isNumericType) setIsNumericFocused(false);
            rest.onBlur?.(e);
          }}
          secureTextEntry={isPasswordVisible}
          editable={editable}
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
    width: "100%",
  },
  label: {
    marginBottom: vs(4),
  },
  inputBase: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  outlinedContainer: {
    minHeight: vs(54),
    borderWidth: 1.5,
    borderColor: COLORS.border.pillActive,
    borderRadius: ms(12),
    backgroundColor: COLORS.background,
    paddingHorizontal: hs(16),
  },
  filledContainer: {
    height: vs(38), // Exact Figma height
    borderWidth: 0,
    borderRadius: ms(10),
    backgroundColor: COLORS.surface.primary,
    paddingHorizontal: hs(10),
  },
  focusedContainer: {
    borderColor: COLORS.text.primary,
  },
  errorContainer: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    fontSize: fs(18),
    fontFamily: "Gilroy-SemiBold", // Matches Figma text style
    color: COLORS.text.primary,
    paddingVertical: vs(12),
  },
  filledInput: {
    fontSize: fs(16), // Smaller text for the filled variant
    paddingVertical: 0, // Let the container handle height
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
