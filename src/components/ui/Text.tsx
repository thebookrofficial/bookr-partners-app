// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from "react-native";
import { fs } from "@/utils/responsive.utils";

export interface TextProps extends RNTextProps {
  variant?: "h1" | "h2" | "h3" | "body1" | "body2" | "caption";
  weight?: "regular" | "medium" | "semiBold" | "bold";
  color?: string;
  align?: TextStyle["textAlign"];
  children: React.ReactNode;
}

export const Text = ({
  variant = "body1",
  weight = "regular",
  color = "#1A1A1A", // Default dark text
  align = "left",
  style,
  children,
  ...rest
}: TextProps) => {
  // Combine all styles based on props
  const textStyles: TextStyle[] = [
    styles[variant],
    styles[weight],
    { color, textAlign: align },
    style as TextStyle,
  ];

  return (
    <RNText style={textStyles} allowFontScaling={false} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Variants - Using fs() for pixel-perfect font scaling
  h1: { fontSize: fs(32), lineHeight: fs(40) },
  h2: { fontSize: fs(24), lineHeight: fs(32) },
  h3: { fontSize: fs(20), lineHeight: fs(28) },
  body1: { fontSize: fs(16), lineHeight: fs(24) },
  body2: { fontSize: fs(14), lineHeight: fs(20) },
  caption: { fontSize: fs(12), lineHeight: fs(16) },

  // Font Weights (Map these to your custom fonts later if needed)
  regular: { fontWeight: "400" },
  medium: { fontWeight: "500" },
  semiBold: { fontWeight: "600" },
  bold: { fontWeight: "700" },
});
