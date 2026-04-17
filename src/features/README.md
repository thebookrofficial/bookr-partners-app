# Features

This directory contains domain-specific, self-contained modules. Following the Bookr Enterprise architecture, the application is divided by feature rather than file type.

## Current Modules

### `profile/`

Encapsulates the Vendor Profile dashboard, staff management, and service listings.

### `sports/`

Dedicated module for sports-related service management (Turfs, Courts, Grounds), including hourly slot booking and real-time availability.

- **`components/`**: Feature-private UI blocks (`ServiceCard.tsx`, `StaffCard.tsx`). These are not exported globally because they contain specific layout rules (like the exact 4-column flex row for Staff) that only apply to the profile domain.
- **`screens/`**: Heavy UI assembly (`VendorProfileScreen.tsx`). Contains the complex layout logic, local state (e.g., active tabs), and Figma-matched padding/margins.

## Rules

- Feature modules should not depend on other feature modules.
- Shared logic must be hoisted to `src/components` or `src/utils`.
