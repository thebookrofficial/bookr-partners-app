# Types

This directory contains global TypeScript type definitions, interfaces, and enums.

## Key Files

- **`env.d.ts`**: Type definitions for environment variables (e.g., from `@env`).

## Rules

- Feature-specific types should live in `src/features/[feature-name]/types/`.
- Use this directory for types that are shared across multiple features or describe global entities (e.g., `User`, `BookingStatus`).
