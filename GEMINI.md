# Bookr Business App

This is a React Native project built with TypeScript, designed as a business-facing application for Bookr Partners. It utilizes a modern tech stack and follows a clean, feature-based architecture.

## Project Overview

- **Purpose:** A partner/vendor-facing mobile application for managing services, staff, and bookings.
- **Main Technologies:**
  - **Framework:** React Native (v0.81.0)
  - **Language:** TypeScript
  - **Navigation:** React Navigation (v7) with Native Stack
  - **UI Components:** Lucide Icons (lucide-react-native), React Native Skia, Rive
  - **Animation:** React Native Reanimated (v4), Worklets
  - **Styling:** Custom theme-based approach with responsive scaling utilities.
- **Architecture:** Feature-based structure (`src/features/`). Each feature folder encapsulates its own screens, components, hooks, and services.

## Building and Running

The project uses `pnpm` as the primary package manager.

- **Setup:**
  ```bash
  pnpm install
  ```
- **Metro Bundler:**
  ```bash
  npm start
  ```
- **Android:**
  ```bash
  npm run android
  ```
- **iOS:**
  ```bash
  # Install CocoaPods (Mac only)
  cd ios && bundle install && bundle exec pod install && cd ..
  # Run iOS
  npm run ios
  ```
- **Linting & Formatting:**
  ```bash
  npm run lint          # Run ESLint
  npm run format        # Run Prettier
  npm run tsc           # Type check
  ```
- **Testing:**
  ```bash
  npm test              # Run Jest tests
  ```

## Development Conventions

### 1. Code Style & Linting

- **ESLint:** Extends `@react-native` and `plugin:prettier/recommended`.
- **Prettier:** Formatting errors are treated as ESLint errors.
- **Semicolons:** Required (`always`).
- **Unused Variables:** Errors on unused vars/imports (except those starting with `_`).
- **Console Logs:** `no-console` is enforced (except `warn` and `error`).
- **React Imports:** React 17+ JSX transform is used (no need to import `React` for JSX).

### 2. File Organization

- **Path Aliases:** Use the `@/` prefix to import from the `src` directory (configured in `tsconfig.json` and `babel.config.js`).
  - Example: `import { Button } from "@/components/ui";`
- **UI Components:** Common reusable components are located in `src/components/ui/`.
- **Responsive Scaling:** Use `vs` (vertical scale), `hs` (horizontal scale), and `ms` (moderate scale) from `@/utils/responsive.utils` for layout dimensions.
- **Theme:** Use the centralized `COLORS` constant from `@/constants/theme`.
- **Strings:** Use localized/centralized strings from `@/constants/strings`.

### 3. Feature Structure

Each feature (e.g., `src/features/profile`) follows this pattern:

- `components/`: Feature-specific components.
- `screens/`: Screens associated with the feature.
- `hooks/`: Custom hooks for the feature.
- `services/`: API calls and business logic.
- `types/`: TypeScript definitions.
- `utils/`: Helper functions specific to the feature.

### 4. Component Standards

- Prefer functional components with hooks.
- Use the `Text` component from `@/components/ui` for all typography to ensure theme consistency.
- Maintain consistent spacing using the responsive utilities.
