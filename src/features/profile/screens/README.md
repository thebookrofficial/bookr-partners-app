# Profile Feature Screens

This directory contains screens for managing the vendor's profile and staff.

## Screens

- **`VendorProfileScreen.tsx`**: The primary profile view.

  - Lists services with category filtering via `PillTabs`.
  - Displays staff list with an "Add Staff" action.
  - Links to `Settings`, `EditProfile`, and `AddStaff`.

- **`EditProfileScreen.tsx`**: Personal and business information management.

  - Editable: First Name, Last Name, Mobile, Email.
  - Read-Only: Bank Name, IFSC, Account No, GSTIN, Pan Card.
  - Includes a custom GSTIN label with a "Don't have" checkbox indicator.

- **`AddStaffScreen.tsx`**: Staff onboarding form.
  - Collects contact info and utilizes `SelectionGroup` for Access Level (Full/Booking) and Role (Manager/Employee).
