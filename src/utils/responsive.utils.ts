// Copyright (c) 2026 Bookr. All rights reserved.
// Confidential and Proprietary.

import { Dimensions, PixelRatio } from "react-native";

const { width, height } = Dimensions.get("window");

/**
 * 🚨 BASELINE DIMENSIONS 🚨
 * These match the iPhone 14 Pro Figma design frame.
 */
const FIGMA_WIDTH = 440;
const FIGMA_HEIGHT = 956;

// Guard against landscape rotation anomalies
const shortDimension = width < height ? width : height;
const longDimension = width < height ? height : width;

// Determine if the phone is physically "short" (like an iPhone SE)
export const isShortDevice = longDimension < 700;

/**
 * horizontalScale (hs)
 * Use for: width, marginHorizontal, paddingHorizontal, left, right
 */
export const hs = (size: number): number => {
  return (shortDimension / FIGMA_WIDTH) * size;
};

/**
 * verticalScale (vs)
 * Use for: height, marginVertical, paddingVertical, top, bottom
 */
export const vs = (size: number): number => {
  return (longDimension / FIGMA_HEIGHT) * size;
};

/**
 * moderateScale (ms)
 * Use for: borderRadius, icons, containers.
 * Curbs extreme scaling on larger devices like iPads and Z-Folds.
 * @param factor How aggressively it should scale (default 0.5)
 */
export const ms = (size: number, factor: number = 0.5): number => {
  return size + (hs(size) - size) * factor;
};

/**
 * fontScale (fs)
 * Use for: fontSize, lineHeight.
 * Respects device pixel density to prevent blurry text on high-res screens.
 */
export const fs = (size: number): number => {
  const newSize = size * (shortDimension / FIGMA_WIDTH);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Convenience export for standardizing responsive gaps
 */
export const spacing = {
  xs: hs(4),
  s: hs(8),
  m: hs(16),
  l: hs(24),
  xl: hs(32),
  xxl: hs(48),
};
