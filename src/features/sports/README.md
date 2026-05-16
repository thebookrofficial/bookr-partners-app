# Sports Service Module

This feature encapsulates all logic and UI related to the management of sports-related venues and services (e.g., Turfs, Courts, Grounds, and Sports Clubs).

## Intent

The `sports/` module is designed to handle the unique requirements of sports service providers, such as hourly slot management, court/field selection, and real-time availability tracking. It serves as a specialized extension of the broader venue management system.

## Core Screens

- **`SportsHomeScreen`**: The primary operational dashboard. Displays date selection, ground switching, a visual `TimeSlotGrid`, and real-time booking lists.
- **`SportsHistoryScreen`**: Comprehensive transaction and booking history, grouped by month with automated settlement status tracking (Online/Offline).
- **`SportsDashboardScreen`**: Analytics and insights for the sports venue, providing a high-level overview of performance metrics.
- **`SportsEssentialsScreen`**: Administrative hub for advanced actions like Bulk Bookings, Slot Blocking, and Venue Updates.
- **`BookingDetailsScreen`**: Deep-dive into specific bookings with split-payment management (Cash/Online) and quick communication actions.
- **`BulkBookingScreen` & `BulkBookingDetailsScreen`**: Specialized flow for creating and managing multiple bookings across different dates and times.
- **`BlockUnblockScreen`**: Dedicated interface for managing venue availability by blocking or unblocking specific time slots/dates.
- **`GuestHistoryScreen`**: Customer-centric view providing aggregate statistics and a full history of past and upcoming sessions.

## Key Components

- **`BookingCard`**: Versatile card for booking summaries with status-based styling (Online, Offline).
- **`TimeSlotGrid`**: Interactive grid for hourly availability, color-coded by status (Available, Online, Manual, Blocked).
- **`OfflineBookingSheet`**: Bottom-sheet modal for rapid manual entry of single bookings with integrated payment logging.
- **`ViewBulkBooking`**: Comprehensive view for managing batches of bookings created via the Bulk Booking flow.
- **`ServiceHeader`**: Unified header providing navigation and service-level context with sport-category switching.
- **`BlockCalendar` & `ClosedDatesAlert`**: Specialized components for the Block/Unblock management flow.

## Architectural Rules

1.  **Isolation:** Sports-specific business logic must NOT leak into the global `src/services/` or other features like `profile/`.
2.  **Navigation Alignment:** All screens must strictly adhere to the props and parameters defined in `SportsTabParamList` within `src/navigation/navigation.types.ts`.
3.  **UI Consistency:** Always use the `src/components/ui` primitives. Any sports-specific layout styling should be encapsulated within `src/features/sports/components/`.
4.  **Real-time focus:** The `Dashboard` and `Home` screens should prioritize high-frequency updates for booking availability using optimized hooks.
5.  **Responsive Layout:** All dimensions must use scaling utilities (`hs`, `vs`, `ms`, `fs`) to ensure consistency across different device sizes.
