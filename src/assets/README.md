# Assets

This directory contains static files, images, and custom typography.

## Fonts (`fonts/`)

Contains the `.otf` and `.ttf` files required for the Bookr brand identity.

- **MD Nichrome**: Used for headers and primary cards (e.g., `MDNichromeTest-Bold.otf`).
- **Gilroy**: Used for body text, labels, and buttons (e.g., `Gilroy-ExtraBold.otf`, `Gilroy-Light.otf`).

### Linking Rule

If a new font is added to this directory, you MUST run:
`npx react-native-asset`
This injects the font files into the native `android/app/src/main/assets/fonts/` and iOS bundles. The app must be recompiled (`pnpm android`) after linking.
