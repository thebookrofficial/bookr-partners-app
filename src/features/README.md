# Features

This directory contains domain-specific, self-contained modules. Following the Bookr Enterprise architecture, the application is divided by feature rather than file type.

## Current Modules

### `profile/`

Encapsulates the Vendor Profile dashboard, staff management, and service listings.

### `sports/`

Dedicated module for sports-related service management (Turfs, Courts, Grounds). Handles hourly slot booking, bulk scheduling, venue availability management, and real-time operational tracking.

- **`components/`**: Domain-specific UI blocks like `TimeSlotGrid`, `BookingCard`, and `OfflineBookingSheet`.
- **`screens/`**: High-level assembly for the multi-tab operational dashboard, including History, Dashboard (Analytics), and Essentials (Admin tools).
- **`hooks/`**: Specialized Supabase-integrated hooks for real-time slot and booking management.

## Rules

- Feature modules should not depend on other feature modules.
- Shared logic must be hoisted to `src/components` or `src/utils`.
