# Dine Service Module

This feature encapsulates all logic and UI related to the management of dine-related venues and services (e.g., Restaurants, Cafes, Bars, and Food Courts).

## Intent

The `dine/` module is designed to handle the unique requirements of dine service providers, such as table management, reservation tracking, and menu handling. It serves as a specialized extension of the broader venue management system.

## Core Screens

- **`DineHomeScreen`**: The primary operational dashboard.
- **`DineHistoryScreen`**: Comprehensive transaction and booking history.
- **`DineDashboardScreen`**: Analytics and insights for the dine venue.
- **`DineEssentialsScreen`**: Administrative hub for advanced actions.
- **`DineBookingDetailsScreen`**: Deep-dive into specific bookings/reservations.

## Key Components

- **`DineBookingCard`**: Versatile card for booking summaries.

## Architectural Rules

1.  **Isolation:** Dine-specific business logic must NOT leak into the global `src/services/` or other features like `profile/`.
2.  **Navigation Alignment:** All screens must strictly adhere to the props and parameters defined in `DineTabParamList` within `src/navigation/navigation.types.ts`.
3.  **UI Consistency:** Always use the `src/components/ui` primitives. Any dine-specific layout styling should be encapsulated within `src/features/dine/components/`.
4.  **Responsive Layout:** All dimensions must use scaling utilities (`hs`, `vs`, `ms`, `fs`) to ensure consistency across different device sizes.
