// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React, { useState } from "react";
import { TextInput as RNTextInput, StyleSheet, TextInputProps } from "react-native";
import { COLORS } from "@/constants/theme";
import { vs, hs, ms, fs } from "@/utils/responsive.utils";

export const AuthTextInput = (props: TextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <RNTextInput
      style={[styles.input, isFocused && styles.inputFocused, props.style]}
      placeholderTextColor={COLORS.text.muted}
      onFocus={e => {
        setIsFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={e => {
        setIsFocused(false);
        props.onBlur?.(e);
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: vs(54),
    // Use your theme's grey (#F5F5F5) instead of the bluish-white
    backgroundColor: COLORS.surface.secondary,
    // Increase thickness slightly to make it visible
    borderWidth: 1.5,
    // Use the darker fallback grey (#EAEAEA) for a visible outline
    borderColor: COLORS.surface.fallback,
    borderRadius: ms(30),
    paddingHorizontal: hs(24),
    fontSize: fs(16),
    fontFamily: "Gilroy-SemiBold",
    color: COLORS.text.primary,
    width: "100%",
  },
  inputFocused: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.primary, // Pops with your brand blue/purple on focus
  },
});
