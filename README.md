# Bookr Business App

This is a React Native project built with TypeScript, designed as a business-facing application for Bookr Partners. It utilizes a modern tech stack and follows a clean, feature-based architecture.

## Project Overview

- **Purpose:** A partner/vendor-facing mobile application for managing services, staff, and bookings.
- **Main Technologies:**
  - **Framework:** React Native (v0.81.0)
  - **Language:** TypeScript
  - **Navigation:** React Navigation (v7) with Native Stack & Bottom Tabs
  - **UI Components:** Lucide Icons, React Native Skia, Rive
  - **Animation:** React Native Reanimated (v4)
  - **Styling:** Custom theme-based approach with responsive scaling utilities.

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm
- CocoaPods (for iOS)
- Android Studio / Xcode

### Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start Metro Bundler:**

   ```bash
   npm start
   ```

3. **Run on Android:**

   ```bash
   npm run android
   ```

4. **Run on iOS:**
   ```bash
   cd ios && bundle install && bundle exec pod install && cd ..
   npm run ios
   ```

## Project Structure

The project follows a feature-based architecture in `src/features/`.

- **`src/assets/`**: Fonts, images, and animations.
- **`src/components/ui/`**: Reusable base UI primitives.
- **`src/features/`**: Business logic and screens grouped by feature (e.g., `sports`, `profile`, `settings`).
- **`src/navigation/`**: Route definitions and navigators.
- **`src/utils/`**: Responsive scaling and global helpers.
- **`src/constants/`**: Theme colors and centralized strings.

## Development Guidelines

- **Responsive Scaling:** Use `hs`, `vs`, `ms`, and `fs` from `@/utils/responsive.utils` for all layout and typography dimensions.
- **Theming:** Access colors via `COLORS` from `@/constants/theme`.
- **Typing:** Ensure all screens and components are strictly typed using the definitions in `src/navigation/navigation.types.ts`.
- **Linting:** Run `npm run lint` before committing changes.

## License

Copyright (c) 2026 Bookr. All rights reserved. Confidential and Proprietary.
