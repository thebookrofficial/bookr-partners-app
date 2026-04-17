# Sports Service Module

This feature encapsulates all logic and UI related to the management of sports-related venues and services (e.g., Turfs, Courts, Grounds, and Sports Clubs).

## Intent

The `sports/` module is designed to handle the unique requirements of sports service providers, such as hourly slot management, court/field selection, and real-time availability tracking. It serves as a specialized extension of the broader venue management system.

## Core Screens

- **`SportsHomeScreen`**: The primary operational dashboard for a service. Displays date selection, ground/court switching, a visual `TimeSlotGrid`, and a list of upcoming/current bookings.
- **`BookingDetailsScreen`**: A deep-dive into a specific booking. Features include payment management (tracking total, paid, and remaining amounts), split-payment entry (Cash/Online), and quick actions (Call/WhatsApp).
- **`GuestHistoryScreen`**: Provides a comprehensive view of a customer's relationship with the venue, including total booking stats and a categorized list of past, upcoming, and cancelled sessions.

## Key Components

- **`BookingCard`**: A versatile card used across multiple screens to display booking summaries. Supports different statuses (Online, Offline, Advance) and specific styling for offline manual records.
- **`TimeSlotGrid`**: A responsive grid representing hourly availability. Slots are color-coded based on status: Available (Surface), Online (Primary), Manuel (Danger), and Unavailable (Disabled).
- **`OfflineBookingSheet`**: A bottom-sheet modal for quick manual entry of bookings, featuring interactive date/time selection and payment tracking.
- **`ServiceHeader`**: A unified header for all sports-related screens, providing consistent navigation and service-level context.

## Architectural Rules

1.  **Isolation:** Sports-specific business logic must NOT leak into the global `src/services/` or other features like `profile/`.
2.  **Navigation Alignment:** All screens must strictly adhere to the props and parameters defined in `SportsTabParamList` within `src/navigation/navigation.types.ts`.
3.  **UI Consistency:** Always use the `src/components/ui` primitives. Any sports-specific layout styling should be encapsulated within `src/features/sports/components/`.
4.  **Real-time focus:** The `Dashboard` and `Home` screens should prioritize high-frequency updates for booking availability using optimized hooks.
5.  **Responsive Layout:** All dimensions must use scaling utilities (`hs`, `vs`, `ms`, `fs`) to ensure consistency across different device sizes.
