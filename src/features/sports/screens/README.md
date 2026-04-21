# Sports Feature Screens

This directory contains the primary screens for the Sports service category.

## Screens

- **`SportsHomeScreen.tsx`**: The main landing page for a sports service.

  - Displays current date and allows switching between grounds/courts.
  - Features a visual time slot grid and a list of bookings for the selected day.
  - Includes a floating action button (FAB) for quick offline bookings.

- **`SportsHistoryScreen.tsx`**: Historical view of all transactions and bookings.

  - Grouped by month and date for easy tracking.
  - Automated status indicators for "Full", "Online", and "Offline" settlements.
  - Integrates with total settlement amounts per month.

- **`SportsDashboardScreen.tsx`**: Analytics hub for venue performance.

  - Provides high-level insights into booking trends and revenue (work-in-progress).

  - Integrated with real-time Supabase data fetching.

- **`SportsEssentialsScreen.tsx`**: The administrative central hub.

  - Provides access to Bulk Booking, Block/Unblock, and Venue Update flows.
  - Dynamically resolves venue and ground IDs based on selected sport category.

- **`BookingDetailsScreen.tsx`**: Detailed view of a single booking.

  - Displays customer information and quick communication actions (Call/WhatsApp).
  - Allows managing payments, including adding new payments with a split (Cash/Online).
  - Provides navigation to the guest's previous booking history.

- **`BulkBookingScreen.tsx` & `BulkBookingDetailsScreen.tsx`**: End-to-end bulk scheduling flow.

  - Allows vendors to select multiple dates and time slots for recurring bookings.
  - Integrated payment management for the entire booking batch.

- **`BlockUnblockScreen.tsx`**: Availability management tool.

  - Allows vendors to block specific days or time ranges for maintenance or events.
  - Features a custom calendar and time-slot selection interface.

- **`GuestHistoryScreen.tsx`**: A comprehensive profile view for a customer.
  - Displays profile info and aggregate booking statistics.
  - Lists past, upcoming, and cancelled bookings grouped by month.
