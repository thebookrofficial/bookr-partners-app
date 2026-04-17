# Profile Feature Module

This module manages the business owner's profile, including their personal information, banking details, services offered, and staff management.

## Core Screens

- **`VendorProfileScreen`**: The main profile dashboard showing the owner's avatar, a list of services (with category tabs), and a list of staff members.
- **`EditProfileScreen`**: Allows editing personal info (name, mobile, email) and displays read-only business/tax information (Bank details, GSTIN, PAN).
- **`AddStaffScreen`**: A form to add new staff members, including their contact details, access level, and role.

## Key Components

- **`ServiceCard`**: Displays a service's name, location, and image. It is interactive and navigates to the specific service's dashboard.
- **`StaffCard`**: Displays staff information (avatar, name, role, type) and provides quick actions like delete and ban.
- **`EditableAvatar`**: A specialized avatar component with a camera badge for triggering profile picture updates.
