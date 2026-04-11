# TESTING - Test Structure

## Test Framework

**Vitest** (v4.1.4) - Unit testing for React/Next.js

Config: `vitest.config.ts`

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

- Test framework configured but limited test coverage
- Example tests exist in `src/app/api/tasks/__tests__/`
- No unit tests for components yet

## Recommendations

1. Add unit tests for utility functions (`auth-helper.ts`, `utils.ts`)
2. Add component tests for complex UI (`app-sidebar.tsx`)
3. Add API route tests for permission guards

---

*Testing documented: 2026-04-11*