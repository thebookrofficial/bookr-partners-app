# Services

This directory contains modules for external service integrations, primarily API clients and data fetching logic.

## Rules

- Use a consistent HTTP client (e.g., `fetch` or `axios`).
- Services should return raw data or typed objects; they should not handle UI state or navigation.
- Error handling should be consistent across all services.
