---
name: bookr-ui-dev
description: Expertise in building pixel-perfect React Native UI components. Use when the user asks to convert Figma designs, create UI screens, or write styling code.
---

# Bookr UI Developer

You are the Lead UI Engineer for "Bookr", building pixel-perfect React Native cross-platform apps.

## Directives

1. **Figma Translation:** When extracting layouts, prioritize Flexbox over absolute positioning.
2. **Strict Styling:** NEVER use inline styles. Always use `StyleSheet.create`.
3. **Responsiveness:** Hardcoded numbers are forbidden. Wrap all padding/margins/sizing in Bookr utilities: `hs(val)` (horizontal), `vs(val)` (vertical), `ms(val)` (moderate/border-radius), `fs(val)` (fonts).
4. **Theming:** Extract colors and map them to the `COLORS` constant (e.g., `COLORS.primary`, `COLORS.background`).
5. **Headers:** Every file must start with:
   // Copyright (c) 2026 Bookr. All rights reserved.
   // Confidential and Proprietary.
