# Codebase Concerns

**Analysis Date:** 2026-04-11

## Tech Debt

### API Routes Lack Permission Enforcement
- **Issue:** Most API routes (`src/app/api/`) only check for authentication via `getCurrentUser()` but do NOT enforce specific permissions. The permission helpers exist but are unused.
- **Files:** `src/app/api/tasks/route.ts`, `src/app/api/receiving/route.ts`, `src/app/api/roles/route.ts`, `src/app/api/batches/route.ts`, and 20+ other API routes
- **Impact:** Any authenticated user can perform any operation within their role's data scope. Cannot enforce granular permissions like "can only edit own tasks" or "can only view transactions."
- **Fix approach:** Import and use `requirePermissionApi()` helper from `src/lib/auth-helper.ts` on each endpoint that needs specific permission checking.

### Hardcoded Sidebar Navigation
- **Issue:** `src/components/app-sidebar.tsx` renders all menu items to all logged-in users without checking permissions. Admin Panel link shown to all users, not just admins.
- **Files:** `src/components/app-sidebar.tsx` (lines 237-246)
- **Impact:** Users can see navigation items for features they cannot access. Creates confusing UX and potential security concern.
- **Fix approach:** Import `permissions` from useAuth and conditionally render menu sections based on permission array.

### Unused Permission Helper Functions
- **Issue:** `requirePermissionApi()` and `requireAdminApi()` exist in `src/lib/auth-helper.ts` but are never imported or called in any API route.
- **Files:** `src/lib/auth-helper.ts` (lines 77-95)
- **Impact:** Dead code that appears to provide authorization but doesn't.
- **Fix approach:** Either remove unused functions or implement them in API routes.

### Duplicate Prisma Schema Files
- **Issue:** Two Prisma schema files exist in the project.
- **Files:** `prisma/schema.prisma`, `src/prisma/schema.prisma`
- **Impact:** Confusion about which schema is active. Could lead to client generation from wrong schema.
- **Fix approach:** Remove `src/prisma/schema.prisma` if it's a duplicate or consolidate into one location.

### Large Monolithic API Routes
- **Issue:** Several API route files have grown too large, mixing concerns (GET, POST, PUT, DELETE handlers with complex business logic).
- **Files:** 
  - `src/app/api/receiving/route.ts` (285 lines)
  - `src/app/api/tasks/route.ts` (282 lines)
  - `src/app/api/batches/route.ts` (281 lines)
  - `src/app/api/variants/route.ts` (237 lines)
- **Impact:** Hard to maintain, test, and reason about. Business logic mixed with route handlers.
- **Fix approach:** Extract business logic into service functions in `src/lib/services/` directory.

### Silent Error Swallowing
- **Issue:** Many catch blocks silently swallow errors without logging or returning useful error information to clients.
- **Files:** `src/app/api/employees/route.ts`, `src/app/api/settings/route.ts`, `src/app/api/batches/route.ts`, `src/lib/auth-helper.ts`
- **Impact:** Hard to debug production issues. Errors disappear silently.
- **Fix approach:** Add proper error logging (console.error) and return error details to clients for non-sensitive errors.

### Inconsistent Admin Detection
- **Issue:** Admin detection is hardcoded in multiple places with different logic:
  - `src/lib/auth-helper.ts`: Checks `role.name === 'admin'` OR `email === process.env.SUPER_ADMIN_EMAIL`
  - `src/contexts/auth-context.tsx`: Simple `role === "admin"` string comparison
- **Impact:** Potential inconsistency in admin detection. SUPER_ADMIN_EMAIL logic may not work consistently.
- **Fix approach:** Centralize admin detection logic in one place and export as a reusable function.

## Known Bugs

### No Validation on Role Deletion
- **Issue:** `src/app/api/roles/route.ts` DELETE endpoint doesn't check if employees are assigned to the role before deletion. Prisma schema has `onDelete: SetNull` so employees lose their role silently.
- **Files:** `src/app/api/roles/route.ts` (line 71)
- **Trigger:** Delete a role that has assigned employees via admin UI
- **Workaround:** None - employees lose role association silently

### Empty Catch in Auth Helper
- **Issue:** `src/lib/auth-helper.ts` line 21 has an empty catch block that silently ignores cookie setting failures.
- **Files:** `src/lib/auth-helper.ts` (line 21)
- **Trigger:** Cookie setting fails (rare, edge cases)
- **Workaround:** N/A - silent failure

### Auth Context Missing isAdmin Sync
- **Issue:** `src/contexts/auth-context.tsx` computes `isAdmin` as `role === "admin"` but doesn't sync with the more complex logic in `auth-helper.ts` that checks SUPER_ADMIN_EMAIL.
- **Files:** `src/contexts/auth-context.tsx` (line 102)
- **Impact:** Users with SUPER_ADMIN_EMAIL may not be recognized as admin in frontend components
- **Workaround:** Ensure all admin users have role 'admin' in database

## Security Considerations

### API Authorization Gaps
- **Risk:** No permission-level enforcement on API routes. Only authentication is checked.
- **Files:** All files in `src/app/api/`
- **Current mitigation:** Middleware redirects unauthenticated users; employees table has is_active flag
- **Recommendations:** Implement `requirePermissionApi()` on all mutation endpoints (POST, PUT, DELETE)

### Environment Variable Validation
- **Risk:** `process.env` values used with `!` assertion (non-null assertion) could cause runtime crashes if env vars missing.
- **Files:** `src/middleware.ts`, `src/lib/auth-helper.ts`, `src/contexts/auth-context.tsx`
- **Current mitigation:** None - will throw at runtime if env vars missing
- **Recommendations:** Add startup validation or use optional chaining with defaults

## Performance Bottlenecks

### N+1 Query in getCurrentUser
- **Problem:** `getCurrentUser()` in `src/lib/auth-helper.ts` fetches employee with role and includes all active permissions in one query. While efficient for single call, it's cached with React's `cache()` - so any permission changes require app restart to take effect.
- **Files:** `src/lib/auth-helper.ts` (lines 31-65)
- **Cause:** React cache() prevents fresh permission data without server restart
- **Improvement path:** Implement cache invalidation or use shorter TTL

### Unbounded Query Results
- **Problem:** Several GET endpoints return all records without pagination.
- **Files:** `src/app/api/receiving/route.ts` (line 12), `src/app/api/flavors/route.ts`, `src/app/api/sizes/route.ts`
- **Impact:** Performance degrades as data grows
- **Improvement path:** Add pagination with limit/offset or cursor-based pagination

## Fragile Areas

### Receiving Route Complex Transaction Logic
- **Files:** `src/app/api/receiving/route.ts` (lines 32-97, 113-228)
- **Why fragile:** Complex transaction logic handles price recalculation, material quantity updates, and transaction creation in one atomic block. Very hard to modify without introducing bugs.
- **Safe modification:** Add thorough comments and extract price calculation into a separate function.
- **Test coverage:** None visible

### Tasks Route Notification Logic
- **Files:** `src/app/api/tasks/route.ts` (lines 116-154, 202-241)
- **Why fragile:** Notification creation embedded in task create/update transactions. Logic for when to create notifications (on assign, on status change) is complex.
- **Safe modification:** Extract notification creation into a service function.
- **Test coverage:** Partial - test files exist in `src/app/api/tasks/__tests__/` but framework not configured

### Batch Price Calculation in Receiving
- **Files:** `src/app/api/receiving/route.ts` (lines 39-47, 152-161, 171-183)
- **Why fragile:** Weighted average price calculation logic is duplicated three times (POST, PUT material changed, PUT same material). Easy to introduce inconsistency.
- **Safe modification:** Extract into `calculateWeightedPrice()` utility function.
- **Test coverage:** None

## Dependencies at Risk

### Supabase SSR Package
- **Risk:** Using `@supabase/ssr` for server-side auth. This package is relatively new and has had breaking changes.
- **Impact:** Middleware and auth-helper would need updates
- **Migration plan:** Monitor Supabase changelog, test upgrades in staging first

### React Cache for Auth
- **Risk:** Using React's `cache()` for user data. This is meant for data that rarely changes, but user permissions may change.
- **Impact:** Users may not see updated permissions until app reload/restart
- **Migration plan:** Consider using a proper caching solution with TTL or removing cache() if permissions change frequently

## Missing Critical Features

### Pagination
- **Problem:** No API endpoints implement pagination
- **Blocks:** Cannot efficiently display large datasets in UI tables

### Rate Limiting
- **Problem:** No rate limiting on API routes
- **Blocks:** Protection against abuse

### Request Validation Middleware
- **Problem:** Each route implements its own validation
- **Blocks:** Consistency across API; harder to maintain

## Test Coverage Gaps

### No Test Framework Configured
- **What's not tested:** All business logic in API routes
- **Files:** All files in `src/app/api/`
- **Risk:** Silent regressions in complex transaction logic (receiving, batches)
- **Priority:** High

### No Integration Tests
- **What's not tested:** End-to-end flows like "create receiving -> verify stock update -> verify transaction created"
- **Files:** Integration between `receiving/route.ts`, `raw-materials/route.ts`, `transactions/route.ts`
- **Risk:** Data consistency issues could go unnoticed
- **Priority:** High

---

*Concerns audit: 2026-04-11*