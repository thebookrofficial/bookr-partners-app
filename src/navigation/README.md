# Navigation

This directory defines the app routing architecture using React Navigation 7.

## Structure

- `index.tsx`: The root `AppNavigator` that switches between the Auth flow and the Main authenticated flow. It also defines the nested `SportsTabNavigator`.
- `navigation.types.ts`: Strict TypeScript definitions for all stacks, tabs, and screen props.

## Route Hierarchies

- **`AuthStackParamList`**: Unauthenticated routes (`Login`, `Signup`).
- **`MainStackParamList`**: Authenticated dashboard routes. Includes general profile management (`VendorProfile`, `EditProfile`, `AddStaff`, `Settings`) and service-specific detail screens (`BookingDetails`, `GuestHistory`).
- **`SportsTabParamList`**: A nested Bottom Tab Navigator used for sports service management. Routes include:
  - `SportsHome`: The main operational dashboard.
  - `SportsHistory`: Transaction and booking history with monthly grouping.
  - `SportsDashboard`: Analytics and performance insights.
  - `SportsEssentials`: Administrative tools (Bulk Booking, Block/Unblock).
  - `SportsProfile`: Service-level profile settings.

## Rules

- All screens must be registered in `navigation.types.ts` before being used.
- Navigation parameters should be kept flat and simple (e.g., passing `serviceId` or `bookingId` instead of entire objects).
- Component-level navigation should use the `useNavigation` hook with appropriate generic types from `navigation.types.ts`.
