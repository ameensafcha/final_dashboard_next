# Codebase Concerns

**Analysis Date:** 2026-04-10

## Tech Debt

- **`any` types in dynamic queries:** `src/app/api/tasks/route.ts` uses `const where: any = {}`
- **Duplicate route/role definitions:** In `src/middleware.ts`, `src/lib/auth-rbac.ts`, `src/lib/auth-helper.ts`
- **Silent error handling:** Catch blocks swallow errors in auth functions
- **Hardcoded "Jeffrey":** `src/app/production/page.tsx` line 106
- **Missing numeric validation:** `parseFloat()` without NaN/negative checks

## Performance

- **5-second polling:** Too aggressive on multiple pages
- **60-second time updates:** Forces unnecessary re-renders in TasksTable
- **Real-time listener cleanup:** May not unsubscribe properly on re-renders
- **N+1 queries:** Every API route does full employee lookup with role join

## Security

- **Middleware doesn't check roles:** Only server components enforce RBAC
- **Unvalidated query params:** Search/filter params passed directly to Prisma
- **Hardcoded role hierarchy:** In multiple files without DB validation
- **No rate limiting:** On `/api/auth/` endpoints

## Fragile Areas

- **Batch ID race condition:** `src/app/api/batches/route.ts` - findFirst then create
- **Auth state sync:** React context can diverge from DB role
- **Untyped props:** `(emp: any)` in server components

## Test Coverage Gaps

- Only 2 test files exist
- No auth/RBAC tests
- No real-time hook tests
- No E2E tests configured

---

*Concerns audit: 2026-04-10*