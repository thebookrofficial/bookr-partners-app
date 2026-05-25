# Layouts

This directory contains structural wrapper components that handle screen-level behaviors.

## Key Components

- **`ScreenContainer.tsx`**: The mandatory wrapper for all full-screen UI.
  - Automatically handles device notches and status bars using `useSafeAreaInsets` from `react-native-safe-area-context` applied as `paddingTop`.
  - Injects `KeyboardAvoidingView` natively.
  - Supports automatic scrolling via the `scrollable` prop.
  - Applies standard horizontal baseline padding using `hs()`.
