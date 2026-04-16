// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from "react-native";
import { Text } from "./Text";
import { hs, vs, ms } from "@/utils/responsive.utils";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = ({
  title,
  variant = "primary",
  isLoading = false,
  leftIcon,
  rightIcon,
  style,
  disabled,
  ...rest
}: ButtonProps) => {
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  // Determine text color based on variant and disabled state
  let textColor = "#FFFFFF";
  if (isOutline || isGhost) textColor = "#000000";
  if (disabled) textColor = "#A0A0A0";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      {...rest}>
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon && leftIcon}
          <Text
            variant="body1"
            weight="semiBold"
            color={textColor}
            style={[
              leftIcon ? { marginLeft: hs(8) } : undefined,
              rightIcon ? { marginRight: hs(8) } : undefined,
            ]}>
            {title}
          </Text>
          {rightIcon && rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: vs(54), // Scaled vertical height
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: hs(24),
    borderRadius: ms(12), // Moderately scaled border radius
  },
  primary: {
    backgroundColor: "#000000", // Bookr primary dark
  },
  secondary: {
    backgroundColor: "#F5F5F5",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    backgroundColor: "#EAEAEA",
    borderColor: "#EAEAEA",
  },
});
