# Store

This directory contains the global state management configuration (e.g., Redux, Zustand, or Context API).

## Key Files

- **`index.ts`**: The entry point for the global store configuration.

## Rules

- Keep the global state as flat as possible.
- Prefer feature-specific state within the `src/features/` directory for local state needs.
- Global state should only store data that truly needs to be shared across disparate parts of the application (e.g., user authentication status).
