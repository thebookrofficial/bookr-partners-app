# Sports Service Module

This feature encapsulates all logic and UI related to the management of sports-related venues and services (e.g., Turfs, Courts, Grounds, and Sports Clubs).

## Intent

The `sports/` module is designed to handle the unique requirements of sports service providers, such as hourly slot management, court/field selection, and real-time availability tracking. It serves as a specialized extension of the broader venue management system.

## Key Subdirectories

- **`screens/`**: Contains the primary tab-based screens defined in `SportsTabParamList` (`Home`, `History`, `Dashboard`, `Essentials`, `Profile`).
- **`components/`**: Houses sports-specific UI elements such as `SlotPicker`, `CourtSelector`, and `AvailabilityGrid`.
- **`services/`**: Contains business logic for checking court availability and managing hourly bookings.
- **`types/`**: Defines interfaces for sports venues, court configurations, and slot availability.

## Architectural Rules

1.  **Isolation:** Sports-specific business logic must NOT leak into the global `src/services/` or other features like `profile/`.
2.  **Navigation Alignment:** All screens must strictly adhere to the props and parameters defined in `SportsTabParamList` within `src/navigation/navigation.types.ts`.
3.  **UI Consistency:** Always use the `src/components/ui` primitives. Any sports-specific layout styling should be encapsulated within `src/features/sports/components/`.
4.  **Real-time focus:** The `Dashboard` and `Home` screens should prioritize high-frequency updates for booking availability using optimized hooks.
