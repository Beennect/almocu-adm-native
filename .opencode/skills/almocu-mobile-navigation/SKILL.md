---
name: almocu-mobile-navigation
description: Navigation patterns specific to Almocu ADM. Covers Expo Router structure, auth screens, and main app navigation.
---
# Almocu Mobile Navigation
## When to Use
- navigation changes
- screen structure
- route design
## Architecture
- Expo Router with file-based routing
- app/ for all routes
- app/(auth)/ for authenticated screens
- app/login/ and app/register/ for public auth
- _layout.tsx for layout configuration
+middleware.ts for auth guards
