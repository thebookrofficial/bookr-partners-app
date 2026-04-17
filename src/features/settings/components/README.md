# Settings Feature Components

This directory contains reusable UI components for the Settings module.

## Components

- **`SettingsActionRow.tsx`**: A touchable row for settings lists.
  - Props: `icon`, `label`, `danger` (boolean), `onPress`.
  - Features a consistent height (`vs(36)`), rounded corners, and a `ChevronRight` indicator.
  - Automatically adjusts text and icon color if marked as `danger`.
