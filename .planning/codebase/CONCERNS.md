# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

**Weak Type Safety in Dynamic Query Building:**
- Issue: `const where: any = {}` in API route for dynamic filtering bypasses TypeScript type checking
- Files: `src/app/api/tasks/route.ts` (line 19)
- Impact: Runtime errors in filter logic are not caught during compilation. Query construction is error-prone and difficult to maintain.
- Fix approach: Replace `any` with proper TypeScript types or use a query builder library (e.g., Prisma's type-safe where conditions)

**Duplicate Route/Role Definitions:**
- Issue: Route protection and role mappings defined in multiple locations without single source of truth
- Files: `src/middleware.ts`, `src/lib/auth-rbac.ts`, `src/lib/auth-helper.ts`
- Impact: When routes change, developers must update three separate locations. Easy to miss updates and cause security gaps.
- Fix approach: Extract all route/role mappings to a centralized config file (e.g., `src/config/routes.ts` or `src/config/permissions.ts`) and import in all three files

**Silent Error Handling in Critical Auth Functions:**
- Issue: Catch blocks that swallow errors without logging details
- Files: `src/lib/auth-rbac.ts` (lines 82-84, 119), `src/lib/auth-helper.ts` (line 72)
- Impact: Silent failures in role lookups or user validation make debugging difficult. Permission checks could fail silently without operator awareness.
- Fix approach: Log error details before returning null: `catch (error) { logger.error('Role lookup failed', error); return null; }`

**Hardcoded Default User in Forms:**
- Issue: Production page defaults logged_by to hardcoded "Jeffrey"
- Files: `src/app/production/page.tsx` (line 106)
- Impact: All batch entries show same user even if logged in as different employee. Audit trail broken for production tracking.
- Fix approach: Replace with `getCurrentUser().name` or fetch current session at component load time

**Missing Input Validation for Numeric Fields:**
- Issue: parseFloat() used without validation for negative values, NaN, or Infinity
- Files: `src/app/api/batches/route.ts` (line 33-34), `src/app/api/receiving/route.ts` (line 42-43)
- Impact: Invalid data (negative stock, NaN values) can be stored. Calculations using parseFloat results may produce incorrect inventory.
- Fix approach: Add validation: `if (isNaN(value) || value < 0) throw new Error('Invalid value')`

## Performance Bottlenecks

**Aggressive Polling with Short Intervals:**
- Issue: Multiple queries configured with 5-second refetch intervals
- Files: `src/app/finance/transactions/page.tsx`, `src/app/finished-products/page.tsx`, `src/app/packing-logs/page.tsx`, `src/app/packing-receives/page.tsx`, `src/app/products/entry/page.tsx`
- Cause: Constant 5s polling creates excessive database load and network traffic. Browser will be continuously fetching.
- Improvement path: 
  - Use Supabase real-time subscriptions (already integrated in `src/components/tasks-table.tsx`)
  - Increase polling interval to 30-60s for non-critical data
  - Add background tab detection to pause polling when user leaves page

**Manual Time Updates Every 60 Seconds:**
- Issue: setInterval polling time state every minute in TasksTable
- Files: `src/components/tasks-table.tsx` (line 74)
- Cause: Forces re-render of entire table component every 60s just to update time display
- Improvement path: Move time rendering to individual cell components with their own intervals, or use CSS animations for relative timestamps

**Unused Real-time Listeners Not Cleaned Up:**
- Issue: Supabase channels subscribed to but cleanup only happens on unmount, no automatic unsubscribe
- Files: `src/components/tasks-table.tsx` (line 92-99), `src/components/stocks-table.tsx`
- Cause: Multiple subscriptions accumulate if component re-renders, creating memory leaks and duplicate listeners
- Improvement path: Add explicit `.unsubscribe()` before resubscribing, or use `useEffect` dependency array properly

**N+1 Query Pattern in User Lookups:**
- Issue: Role lookups in auth-rbac require database query for each role check, no caching
- Files: `src/lib/auth-rbac.ts` (lines 65-85), every API route does `getCurrentUser()` which queries DB
- Cause: 20+ API routes each do full employee lookup with role join. Production page with 5+ data fetches = 5+ DB calls just for auth checks.
- Improvement path: Cache role in JWT token or session store with short TTL, only query on cache miss

## Security Considerations

**Insufficient RBAC Enforcement at Middleware:**
- Risk: Middleware explicitly does NOT check roles, comments say "server components will enforce"
- Files: `src/middleware.ts` (lines 82-92)
- Current mitigation: Individual API routes and server components check `getCurrentUser()` and `requireRole()`
- Recommendations: 
  - Implement full role check in middleware using `checkRoutePermission()` from auth-rbac
  - Return 403 for unauthorized access instead of allowing through
  - Add audit logging for permission denials

**Unvalidated Query Parameters in Search:**
- Risk: Search and filter parameters from URL directly passed to Prisma `contains` without sanitization
- Files: `src/app/api/tasks/route.ts` (lines 13-17, 29-30)
- Current mitigation: Prisma parameterized queries prevent SQL injection, but logic injection possible
- Recommendations:
  - Add whitelist validation for filter values (status must be one of: not_started, in_progress, review, completed)
  - Validate search parameter length (max 100 chars)
  - Log searches containing suspicious patterns

**Role Hierarchy Hard-coded in Multiple Places:**
- Risk: Role hierarchy ['viewer', 'employee', 'admin'] defined in code without validation
- Files: `src/lib/auth-helper.ts` (line 25), `src/lib/auth-rbac.ts` (line 172), `src/app/api/auth/role/route.ts`
- Current mitigation: Same hierarchy used consistently across files
- Recommendations:
  - Store role hierarchy in database (`role_hierarchy` table)
  - Add validation that new roles conform to hierarchy
  - Audit role changes

**No Rate Limiting on Auth Endpoints:**
- Risk: `/api/auth/` endpoints have no rate limiting or attempt throttling
- Files: `src/app/api/auth/` routes
- Current mitigation: Supabase handles auth, but employee creation and sync have no limits
- Recommendations:
  - Implement rate limiting (max 10 login attempts per IP per minute)
  - Add account lockout after 5 failed attempts
  - Log failed auth attempts

**Database Connection Pooling Not Visible:**
- Risk: Prisma client created without explicit pool size configuration
- Files: `src/lib/prisma.ts` (single instance export)
- Current mitigation: Prisma singleton pattern prevents multiple instances
- Recommendations:
  - Explicitly configure `connection_limit` in Prisma schema
  - Monitor connection pool usage in production
  - Add connection timeout handling

## Fragile Areas

**Batch ID Generation Race Condition:**
- Files: `src/app/api/batches/route.ts` (lines 50-59)
- Why fragile: Sequence counter determined by findFirst, then checked before create. Two requests on same date can generate same batch_id.
- Safe modification: Use database-level constraints:
  - Add unique constraint on (batch_id, date)
  - Or use trigger-based sequence generation
  - Or implement pessimistic locking with select for update
- Test coverage: No unit tests for concurrent batch creation

**Auth State Synchronization:**
- Files: `src/contexts/auth-context.tsx`, `src/lib/auth-helper.ts`
- Why fragile: Employee state in React context and getCurrentUser() calls can diverge if role changed in DB
- Safe modification: 
  - Query DB on every critical operation instead of relying on cached context
  - Or invalidate context whenever role permissions used
  - Add 5-minute cache invalidation for role lookups
- Test coverage: No tests for concurrent role updates

**Component-Level Fetch Chains:**
- Files: `src/app/production/page.tsx` (lines 116-157), `src/app/products/entry/page.tsx`
- Why fragile: Multiple `useQuery` calls with separate queries, if one fails others may retry independently causing cascade effects
- Safe modification: 
  - Combine related queries into single endpoint
  - Use `@tanstack/react-query` parallel query feature
  - Add error boundaries
- Test coverage: No tests for failed data fetches

**Untyped Server Component Props:**
- Files: Multiple pages pass arbitrary props to components
- Why fragile: Props like `(emp: any)` in production/page.tsx line 147 skip type checking
- Safe modification: Create strict interfaces for all data shapes
- Test coverage: No type checking for server/client prop passing

## Test Coverage Gaps

**Zero Unit Tests in Project:**
- What's not tested: No test files found despite 155 TypeScript files
- Files: `src/**/*.ts(x)` - all files lack .test or .spec variants
- Risk: 
  - Auth logic untested (RBAC, role hierarchy, permission checks)
  - Batch sequence generation untested (race conditions possible)
  - Data validation untested (numeric conversions, required fields)
  - Component logic untested (mutations, error states)
- Priority: **High** - Auth failures or data corruption in production could occur silently

**No Integration Tests:**
- What's not tested: Multi-step workflows (create batch → update stock → log transaction)
- Risk: Coordinated operations in `prisma.$transaction()` blocks not validated end-to-end
- Priority: **High** - Transaction rollback logic never tested

**No E2E Tests:**
- Framework: Not used
- Risk: Login flow, role-based redirects, permission denials not tested with real UI
- Priority: **Medium** - Regression possible on auth flow changes

## Scaling Limits

**Database Transaction Complexity:**
- Current: `prisma.$transaction()` blocks can span multiple operations (create batch, update stock, create logs, create transaction)
- Limit: Postgres has default transaction timeout of 10 minutes. Complex transactions with many operations risk timeout.
- Scaling path: 
  - Break into smaller, independent transactions
  - Implement retry logic with exponential backoff
  - Monitor transaction duration in production

**Memory Leak Risk with Real-time Subscriptions:**
- Current: Supabase channels subscribed but unsubscribe not called when dependencies change
- Limit: Long-lived pages (production, products) could accumulate 20+ active listeners
- Scaling path:
  - Add proper cleanup in useEffect dependencies
  - Implement max listener limit with warning
  - Use managed subscription service

**Polling Load with Large Tables:**
- Current: 5-second polling on tables with potentially 1000s of rows
- Limit: Each refetch fetches entire table, no pagination or filtering at query level
- Scaling path:
  - Add server-side pagination
  - Implement cursor-based pagination
  - Filter at API level to only modified rows since last fetch

## Dependency Risks

**React 19.2.4 - Recent Major Version:**
- Risk: Minimal production usage history for 19.x. Breaking changes in minor updates possible.
- Impact: Hooks behavior changes, suspense handling, experimental features may become breaking.
- Migration plan: Lock to 19.2.4 in package.json, test thoroughly before minor version upgrades

**Prisma 7.6.0 - Multiple Critical Breaking Changes Expected:**
- Risk: Prisma 8.x scheduled for Q2 2026 with breaking schema changes
- Impact: Client code requires updates, migration scripts must run
- Migration plan: Plan for Prisma migration 6-12 months after 8.0 release

**Zustand 5.0.12 - New Version, API Changes:**
- Risk: Migration from 4.x had breaking changes. Few production users.
- Impact: Store API might change, selectors behavior differs
- Migration plan: Vendor lock version until 5.x stable for 6+ months

## Missing Critical Features

**No Audit Logging:**
- Problem: No record of who changed what and when for inventory/batch operations
- Blocks: Compliance audits, resolving discrepancies, security investigation
- Recommended: Add audit_logs table, log all mutations with user_id, timestamp, old_value, new_value

**No Soft Delete Support:**
- Problem: Deleted batches/products lost immediately, no recovery possible
- Blocks: Undo functionality, audit trail completeness, accidental deletion recovery
- Recommended: Add is_deleted and deleted_at to batch, product, transaction tables

**No Change Notifications Between Sessions:**
- Problem: If two users both view production page, changes from one don't appear in other's browser
- Blocks: Real-time multi-user collaboration
- Recommended: Expand Supabase subscriptions to all data tables, not just tasks

**No Permission Caching/Optimization:**
- Problem: Every API call triggers full user + role lookup from DB
- Blocks: Scaling to 100+ concurrent users
- Recommended: Cache role in JWT or Redis with 5-minute TTL

---

*Concerns audit: 2026-04-09*
