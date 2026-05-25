# Utilities

This directory contains pure functions, formatters, and global helpers.

## Responsive Scaling (`responsive.utils.ts`)

The core engine for matching React Native pixel outputs to the Figma designs.

**BASELINE ALIGNMENT: 440px**
The scaling functions are mathematically calibrated to a `440px` base width Figma artboard.

- `hs(size)`: Horizontal Scale (width, marginHorizontal, paddingHorizontal).
- `vs(size)`: Vertical Scale (height, marginVertical, paddingVertical).
- `ms(size)`: Moderate Scale (borderRadius, lucide-react-native icons).
- `fs(size)`: Font Scale (fontSize, lineHeight - rounds to nearest device pixel to prevent blurring).
