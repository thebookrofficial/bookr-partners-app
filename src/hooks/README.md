# Hooks

This directory contains reusable, custom React hooks that encapsulate shared logic across multiple features or components.

## Rules

- Hooks here MUST be generic and not tied to a specific feature. Feature-specific hooks should live in `src/features/[feature-name]/hooks/`.
- All hooks must follow the `use[Name]` naming convention.
- Hooks should be pure logic and should not render UI.
