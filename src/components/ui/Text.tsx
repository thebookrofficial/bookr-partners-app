// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from "react-native";
import { fs } from "@/utils/responsive.utils";

export interface TextProps extends RNTextProps {
  variant?: "h1" | "h2" | "h3" | "body1" | "body2" | "caption";
  weight?: "regular" | "medium" | "semiBold" | "bold";
  family?: "gilroy" | "nichrome";
  color?: string;
  align?: TextStyle["textAlign"];
  children: React.ReactNode;
}

export const Text = ({
  variant = "body1",
  weight = "regular",
  family = "gilroy",
  color = "#000000",
  align = "left",
  style,
  children,
  ...rest
}: TextProps) => {
  // Map the weight and family strictly to the PostScript/File name of the font
  const getFontFamily = () => {
    if (family === "nichrome") return "MDNichromeTest-Bold"; // Adjust this to match your exact file name
    switch (weight) {
      case "bold":
        return "Gilroy-ExtraBold";
      case "semiBold":
        return "Gilroy-ExtraBold";
      case "medium":
        return "Gilroy-Light";
      default:
        return "Gilroy-Light";
    }
  };

  const textStyles: TextStyle[] = [
    styles[variant],
    {
      fontFamily: getFontFamily(),
      color,
      textAlign: align,
    },
    style as TextStyle,
  ];

  return (
    <RNText style={textStyles} allowFontScaling={false} {...rest}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  // Using exact sizes from Figma CSS
  h1: { fontSize: fs(32), lineHeight: fs(40) },
  h2: { fontSize: fs(24), lineHeight: fs(32) },
  h3: { fontSize: fs(20), lineHeight: fs(25) }, // Profile Title
  body1: { fontSize: fs(16), lineHeight: fs(20) }, // David Minter, Edit
  body2: { fontSize: fs(14), lineHeight: fs(17) }, // Hello Owner
  caption: { fontSize: fs(12), lineHeight: fs(15) },
});
