# UI Components

This directory contains pure, "dumb", highly reusable UI primitives used globally across the Bookr app.

## Structure

- `ui/`: Atomic elements (Buttons, Text, Inputs, Avatars, Tabs).
- `ui/index.ts`: The public API. Always import from `@/components/ui` to avoid fragile relative paths.

## Key Components

- **`Text.tsx`**: The core typography engine. Enforces the strict `family` prop (`gilroy` | `nichrome`) mapped directly to linked `.otf` asset filenames to bypass Android system font fallbacks. Uses `fs()` for pixel-perfect scaling.
- **`Avatar.tsx`**: Standardized user/vendor profile image component with automatic initials fallback.
- **`PillTabs.tsx`**: Horizontally scrolling filter tabs using the Bookr standard `#F4F7FC` active background.

## Rules

- Components here MUST NOT contain business logic or API calls.
- Components here MUST rely exclusively on `responsive.utils.ts` (`hs`, `vs`, `ms`, `fs`) for dimensions.
