# Profile Feature Components

This directory contains UI components specific to the Profile and Staff management features.

## Components

- **`ServiceCard.tsx`**: A horizontal card representing a business service.

  - Shows an image, service title, and location with a `MapPin` icon.
  - Styled with responsive typography and spacing.

- **`StaffCard.tsx`**: A horizontal card for staff management.

  - Displays `Avatar`, `name`, `role`, and `type`.
  - Includes vertical action buttons for `Trash2` (delete) and `Ban`.

- **`EditableAvatar.tsx`**: A wrapper around the base `Avatar` component.
  - Adds a floating `Camera` icon badge to indicate editability.
  - Uses `COLORS.primary` for the badge background.
