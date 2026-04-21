# Base UI Components

This directory contains the core, reusable UI primitives used throughout the application.

## Components

- **`Avatar.tsx`**: A standardized avatar component.

  - Supports `image`, `initials`, and various `size` presets.
  - Handles image loading errors gracefully with a fallback UI.

- **`Button.tsx`**: Custom button with multiple variants.

  - Variants: `primary`, `secondary`, `outline`, `ghost`, `danger`.
  - Supports loading states and icons.

- **`PillTabs.tsx`**: A horizontal tab selector.

  - Used for category filtering and simple view switching.

  - Features smooth animated transitions and responsive styling.

- **`Text.tsx`**: Centralized typography component.

  - Ensures consistent font family (Gilroy/Nichrome) and sizing.
  - Variants: `h1`, `h2`, `h3`, `body1`, `body2`, `caption`.

- **`TextInput.tsx`**: Standardized form input.
  - Supports variants like `filled` and `outline`.
  - Integrated support for labels, icons, and error states.
