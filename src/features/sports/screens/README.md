# Sports Feature Screens

This directory contains the primary screens for the Sports service category.

## Screens

- **`SportsHomeScreen.tsx`**: The main landing page for a sports service.

  - Displays current date and allows switching between grounds/courts.
  - Features a visual time slot grid and a list of bookings for the selected day.
  - Includes a floating action button (FAB) for quick offline bookings.

- **`BookingDetailsScreen.tsx`**: Detailed view of a single booking.

  - Displays customer information and quick communication actions (Call/WhatsApp).
  - Allows managing payments, including adding new payments with a split (Cash/Online).
  - Provides navigation to the guest's previous booking history.

- **`GuestHistoryScreen.tsx`**: A comprehensive profile view for a customer.
  - Displays profile info and aggregate booking statistics.
  - Lists past, upcoming, and cancelled bookings grouped by month.
