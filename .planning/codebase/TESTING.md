# Testing Patterns

**Analysis Date:** 2026-04-11

## Test Framework

**Runner:**
- Vitest v4.1.4
- Config: `vitest.config.ts`
- Environment: jsdom

**Assertion Library:**
- Vitest built-in expect

**Run Commands:**
```bash
npm run test              # Run all tests (vitest run)
npm run test:watch        # Watch mode (vitest)
```

## Test File Organization

**Location:**
- Co-located with code in `__tests__` subdirectories
- Example: `src/app/api/tasks/__tests__/route.test.ts`

**Naming:**
- Pattern: `*.test.ts` or `*.spec.ts`
- Tests placed in `__tests__` folders within the feature directory

**Structure:**
```
src/app/api/tasks/
├── route.ts
└── __tests__/
    ├── route.test.ts
    └── notification-integration.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('PUT /api/tasks - Notification Creation on Assignment', () => {
  let testTaskId: string;
  let testUserId: string;

  beforeEach(async () => {
    // Setup: create test data
  });

  afterEach(async () => {
    // Cleanup: delete test data
  });

  it('Test description', async () => {
    // Test logic
  });
});
```

**Patterns:**
- Setup: Create test users and tasks in `beforeEach`
- Teardown: Delete in reverse order (respecting FK constraints) in `afterEach`
- Assertion: Use `expect()` with matchers

## Mocking

**Framework:** Vitest (uses Jest-compatible mocks via `vi`)

**Current Practice:**
- Minimal mocking observed - tests use actual Prisma database
- `vi` imported but not heavily used in current tests

**What to Mock:**
- External API calls (Supabase)
- Third-party services

**What NOT to Mock:**
- Prisma database operations (tests use real DB)

## Fixtures and Factories

**Test Data:**
- Created inline in tests using Prisma
- Uses timestamps for unique IDs: `id: 'test-creator-' + Date.now()`

```typescript
const creator = await prisma.employees.create({
  data: {
    id: 'test-creator-' + Date.now(),
    name: 'Test Creator',
    email: `creator-${Date.now()}@test.com`,
  },
});
```

**Location:**
- Created inline within test files
- No dedicated fixture files currently

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# Not configured - vitest does not have coverage config
```

## Test Types

**Unit Tests:**
- Not extensively implemented
- Placeholder test file exists: `src/app/api/tasks/__tests__/route.test.ts` (tests not implemented)

**Integration Tests:**
- Current focus: Database-level integration tests
- Uses Prisma transactions to test notification creation logic
- Example: `src/app/api/tasks/__tests__/notification-integration.test.ts`

**E2E Tests:**
- Playwright configured (`@playwright/test` in devDependencies)
- Config: `playwright.config.ts`
- E2E tests not yet observed in codebase

## Common Patterns

**Async Testing:**
```typescript
it('should create notification when assignee_id changes', async () => {
  const updatedTask = await prisma.$transaction(async (tx) => {
    // async operations
    return task;
  });

  expect(notifications).toHaveLength(1);
});
```

**Error Testing:**
```typescript
it('should maintain atomicity: both operations succeed or both fail', async () => {
  let transactionFailed = false;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.tasks.update({ ... });
      throw new Error('Simulated error for rollback test');
    });
  } catch (error) {
    transactionFailed = true;
  }
  expect(transactionFailed).toBe(true);
});
```

**Transaction Testing:**
```typescript
// Test atomicity
await prisma.$transaction(async (tx) => {
  // Multiple operations that must succeed/fail together
});
```

## Test Database Considerations

**Database:** PostgreSQL via Prisma

**Cleanup Pattern:**
```typescript
afterEach(async () => {
  // Delete in reverse order due to foreign keys
  await prisma.notifications.deleteMany({ where: { task_id: testTaskId } });
  await prisma.tasks.delete({ where: { id: testTaskId } });
  await prisma.employees.deleteMany({
    where: { id: { in: [testUserId, assigneeId] } },
  });
});
```

**Unique IDs:** Use `Date.now()` for unique test identifiers

## Testing Gaps

**Not Implemented:**
- Mock-based unit tests
- Test coverage enforcement
- Snapshot testing
- Component rendering tests (React Testing Library not installed)

**Recommendations:**
- Install `@testing-library/react` for component tests
- Add coverage reporting to vitest config
- Implement mocking for Supabase client in API tests

---

*Testing analysis: 2026-04-11*