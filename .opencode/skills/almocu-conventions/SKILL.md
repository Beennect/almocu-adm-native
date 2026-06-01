---
name: almocu-conventions
description: Project-specific conventions for Almocu ADM. Covers naming patterns, folder structure, component patterns, and project-specific standards.
---
# Almocu Conventions
## When to Use
- following project conventions
- code review
- new components
## Architecture
- React Native (Expo) app with Expo Router
- services layer for API communication
- stores for state management (zustand)
- shared components pattern
## Naming
- files: kebab-case for utilities, PascalCase for components
- exports: named exports preferred
- stores: *Store.ts (e.g., AuthStore, ThemeStore)
- services: api-* for API services
## Structure
- app/ for Expo Router pages
- components/ for reusable UI
- services/ for API and business logic
- stores/ for state management
- assets/ for SVGs and icons
- themes/ for styling constants
