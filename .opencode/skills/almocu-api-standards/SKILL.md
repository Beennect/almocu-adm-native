---
name: almocu-api-standards
description: API communication standards for Almocu ADM. Covers service patterns, error handling, and data fetching conventions.
---
# Almocu API Standards
## When to Use
- new API integrations
- service layer changes
- data fetching patterns
## Architecture
- services/api-service.ts as base HTTP client
- domain-specific services (api-menu, api-order, api-staff, api-stock, api-cart)
- standardized error handling
## Key Files
- services/api-service.ts
- services/api-menu-service.ts
- services/api-order-service.ts
- services/api-staff-service.ts
- services/api-stock-service.ts
- services/cart-service.ts
