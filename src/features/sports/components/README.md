# Sports Feature Components

This directory contains UI components specific to the Sports service category.

## Components

- **`BookingCard.tsx`**: A flexible card used in the home screen and guest history screens.

  - Props: `name`, `phone` (optional), `subtitle` (optional), `date`, `time`, `price`, `status`, `avatarUrl`, `isOfflineRecord`, `hideCallButton`.
  - Handles various payment statuses and styles offline records with a distinct theme.

- **`LegendIndicator.tsx`**: Provides a visual key for the time slot grid statuses.
  - Statuses: Available, Manuel, Online, Blocked.

- **`OfflineBookingSheet.tsx`**: A modal bottom sheet for creating offline bookings.
  - Features form inputs for date, mobile, name, time slots, and payments.
  - Includes a quick link to check a guest's previous history.

- **`ViewBulkBooking.tsx`**: A management component for bulk booking batches.
  - Lists all bookings in a batch with status and payment tracking.

  - Allows adding settlement payments to bulk-created records.

- **`ServiceHeader.tsx`**: The main header component for sports service screens.

  - Displays service title, category, and an image/avatar.
  - Includes a sport-category switcher to toggle between different facilities (e.g., Football to Pickleball).
- **`TimeSlotGrid.tsx`**: A grid layout for selecting or viewing hourly time slots.

  - Statuses: `available`, `online`, `manual`, `blocked`.
  - Responsive layout using `hs` and `vs` scaling.

- **`block-unblock/`**: Specialized components for the blocking interface.
  - **`BlockCalendar.tsx`**: Custom date-selection calendar with integrated blocking status.
  - **`ClosedDatesAlert.tsx`**: Inline warning when selecting dates that are already blocked or closed.
