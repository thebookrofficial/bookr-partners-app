# Sports Feature Components

This directory contains UI components specific to the Sports service category.

## Components

- **`BookingCard.tsx`**: A flexible card used in the home screen and guest history screens.

  - Props: `name`, `phone` (optional), `subtitle` (optional), `date`, `time`, `price`, `status`, `avatarUrl`, `isOfflineRecord`, `hideCallButton`.
  - Handles various payment statuses and styles offline records with a distinct theme.

- **`LegendIndicator.tsx`**: Provides a visual key for the time slot grid statuses.

  - Statuses: Available, Manuel, Online, Unavailable.

- **`OfflineBookingSheet.tsx`**: A modal bottom sheet for creating offline bookings.

  - Features form inputs for date, mobile, name, time slots, and payments.

  - Includes a quick link to check a guest's previous history.

- **`ServiceHeader.tsx`**: The main header component for sports service screens.

  - Displays service title, category, and an image/avatar.
  - Integrated navigation with a back button.

- **`TimeSlotGrid.tsx`**: A grid layout for selecting or viewing hourly time slots.
  - Statuses: `available`, `online`, `manual`, `unavailable`.
  - Responsive layout using `hs` and `vs` scaling.
