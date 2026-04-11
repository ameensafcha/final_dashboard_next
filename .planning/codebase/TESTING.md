# TESTING - Test Structure

## Test Framework

**Vitest** (v4.1.4) - Unit testing for React/Next.js
**Playwright** (v1.59.1) - E2E testing

Config: `vitest.config.ts`, `playwright.config.ts`

## Test Commands

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
```

## Test Structure

Tests located alongside source files:
```
src/
├── app/api/tasks/__tests__/
│   ├── route.test.ts
│   └── notification-integration.test.ts
```

## Current State

- Test framework configured (Vitest + Playwright)
- Limited test coverage - only example tests in `src/app/api/tasks/__tests__/`
- No component tests yet

## Recommended Tests

1. **Unit tests**: Utility functions in `src/lib/` (auth-helper, permissions)
2. **API tests**: Permission guards, role-based access
3. **Component tests**: app-sidebar permission filtering, auth-context
4. **E2E tests**: Login flow, role-based navigation

---

*Testing documented: 2026-04-11*