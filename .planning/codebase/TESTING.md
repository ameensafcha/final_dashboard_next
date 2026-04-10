# Testing Patterns

**Analysis Date:** 2026-04-10

## Test Framework

**Runner:** Vitest 4.1.4
- `npm run test` - Run all tests
- `npm run test:watch` - Watch mode

**E2E:** Playwright 1.59.1 (installed but not configured)

## Test Files

- Unit: `src/app/api/tasks/__tests__/route.test.ts`
- Integration: `src/app/api/tasks/__tests__/notification-integration.test.ts`

## Patterns

```typescript
describe('Feature', () => {
  it('should handle case', () => {
    // test
  });
});
```

**Mocking:** Vitest `vi.mock()`, `vi.spyOn()`
- Mock Prisma: `vi.mock('@/lib/prisma')`

## Coverage

- Not enforced
- No coverage reporting configured

## Gaps

- No auth/RBAC tests
- No real-time hook tests
- No E2E tests configured

---

*Testing analysis: 2026-04-10*