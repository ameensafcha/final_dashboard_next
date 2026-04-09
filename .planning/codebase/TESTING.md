# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Status:** NOT CONFIGURED

**Current State:**
- No test runner installed (no `vitest`, `jest`, or `playwright` in dependencies)
- No test configuration files present
- No test files found in codebase (`*.test.ts`, `*.spec.ts`, `__tests__/`)

**Recommendation:**
- Install Vitest for React/Next.js testing: `npm install -D vitest @vitejs/plugin-react`
- Add test script to `package.json`: `"test": "vitest"`

**Config Location (if implemented):**
- `vitest.config.ts` (recommended for Next.js)

## Test File Organization

**Location:**
- Not yet established

**Naming:**
- Recommended pattern: `[module].test.ts`, `[module].spec.ts`
- Example: `utils.test.ts`, `auth-helper.test.ts`

**Structure (recommended):**
```
src/
├── lib/
│   ├── utils.ts
│   └── __tests__/           # Test directory
│       └── utils.test.ts
├── components/
│   └── __tests__/
│       └── task-card.test.tsx
└── app/api/
    └── __tests__/
        └── products.test.ts
```

## Test Structure

**Recommended Suite Organization:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
  
  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
  });
});
```

**Patterns to Implement:**
- Setup: `beforeEach()` for resetting state
- Teardown: Cleanup after each test
- Assertions: Vitest's built-in `expect()`

## Mocking

**Status:** NOT CONFIGURED

**Recommended Framework:** Vitest with `vi.fn()`

**Patterns (recommended):**
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock modules
vi.mock('@/lib/prisma', () => ({
  prisma: {
    products: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((data, init) => ({ data, status: init?.status })),
  },
}));
```

**What to Mock:**
- Prisma client for database tests
- External services (Supabase)
- Environment variables
- Time/date (for consistent date testing)

**What NOT to Mock:**
- Utility functions being tested (`cn()` should be tested directly)
- Simple pure functions

## Fixtures and Factories

**Location (recommended):**
- `src/__fixtures__/` for shared test data
- Or inline in test files for specific tests

**Recommended Pattern:**
```typescript
// src/__fixtures__/tasks.ts
export const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'not_started',
  priority: 'medium',
  due_date: null,
  start_date: null,
  created_at: new Date().toISOString(),
};

export const createMockTask = (overrides = {}) => ({
  ...mockTask,
  ...overrides,
});
```

## Coverage

**Requirements:** NOT ENFORCED

**Target (recommended):**
- Minimum 70% line coverage for business logic
- 100% coverage for utility functions

**View Coverage:**
```bash
npm run test -- --coverage
```

## Test Types

**Unit Tests:**
- Priority: High
- Focus: Utility functions (`cn()`, `auth-helper.ts`), Zustand stores

**Integration Tests:**
- Priority: Medium
- Focus: API routes, database operations

**E2E Tests:**
- Not recommended without separate setup
- Consider Playwright if E2E testing is needed

## Priority Test Files

**Immediate Needs:**
1. `src/lib/utils.ts` - Simple, high-value unit tests
2. `src/lib/stores/ui.ts` - Zustand store tests
3. `src/lib/auth-helper.ts` - Authentication logic

**API Routes (Integration):**
1. `src/app/api/products/route.ts`
2. `src/app/api/tasks/route.ts`

**Components:**
1. `src/components/task-card.tsx` - Component rendering
2. `src/components/ui/button.tsx` - Variant testing

---

*Testing analysis: 2026-04-09*
