# Navigation

This directory defines the app routing architecture using React Navigation.

## Structure

- `index.tsx`: The root `AppNavigator` that switches between the Auth flow and the Main authenticated flow.
- `navigation.types.ts`: Strict TypeScript definitions for all routes.

## Route Types

- **`AuthStackParamList`**: Unauthenticated routes (`Login`, `Signup`).
- **`MainStackParamList`**: Authenticated dashboard routes (`VendorProfile`, `AddStaff`, `AddService`, `EditProfile`).

## Rules

- All screens must be registered in `navigation.types.ts` before being used.
- Navigation parameters should be kept flat and simple (e.g., passing IDs instead of entire objects).
