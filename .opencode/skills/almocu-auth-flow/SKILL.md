---
name: almocu-auth-flow
description: Authentication flow for Almocu ADM. Covers login, registration, token management, and middleware guards.
---
# Almocu Auth Flow
## When to Use
- auth-related features
- login/register screens
- permission checks
## Architecture
- LoginForm, SignUpForm in components/auth/
- app/login/, app/register/ for routes
- +middleware.ts for auth guards
- AuthStore for token/session state
## Key Files
- components/auth/LoginForm.tsx
- components/auth/SignUpForm.tsx
- app/login/index.tsx
- app/register/index.tsx
- app/+middleware.ts
- stores/AuthStore.ts
