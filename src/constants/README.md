# Constants

This directory contains global, immutable constants used throughout the Bookr application.

## Key Files

- **`theme.ts`**: The single source of truth for the application's color palette, surface styles, and brand-compliant visual tokens.
  - Always use `COLORS.primary`, `COLORS.background`, etc., instead of hardcoding hex values.
- **`strings.ts`**: Centralized repository for all user-facing text. This facilitates future localization (i18n) and ensures consistent terminology across the app.
  - Organize strings by feature or common use case (e.g., `STRINGS.profile`, `STRINGS.settings`).

## Rules

- NEVER include logic or functions in these files.
- NEVER include sensitive information (API keys, secrets) here. Use `.env` files for that.
- Constants should be exported as `const` and ideally grouped into logical objects.
