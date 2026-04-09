# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

**Double Powder Stock Models:**
- Issue: The schema contains `powder_stock` and `powder_stock_new` tables serving similar purposes. The `batches` API uses `powder_stock`, creating confusion about which is authoritative.
- Files: `prisma/schema.prisma` (lines 205-236), `src/app/api/batches/route.ts`
- Impact: Data inconsistency risk, maintenance burden, unclear which stock to query
- Fix approach: Consolidate to single powder_stock model, migrate data, update all references

**Transaction-Based Updates Without Rollback Monitoring:**
- Issue: Several API routes use `prisma.$transaction` for multi-step operations but lack detailed error logging within the transaction, making debugging difficult when partial operations succeed.
- Files: `src/app/api/batches/route.ts`, `src/app/api/packing-logs/route.ts`
- Impact: Hard to diagnose partial failures in stock updates
- Fix approach: Add detailed logging within transactions, implement rollback notification

**Hardcoded Team Members:**
- Issue: Production page hardcodes `TEAMS = ["Jeffrey", "Team Member 1", "Team Member 2"]` instead of using the employees table.
- Files: `src/app/production/page.tsx` (line 79)
- Impact: Not scalable, not reflecting actual employee roster
- Fix approach: Query employees API to populate team dropdown dynamically

## Known Bugs

**Missing Error Handling in Dashboard Page:**
- Issue: `src/app/dashboard/page.tsx` calls Prisma directly without try-catch. If database fails, unhandled exception propagates as 500.
- Files: `src/app/dashboard/page.tsx`
- Impact: Server crashes on DB errors render as opaque failures
- Fix approach: Wrap Prisma calls in try-catch, return fallback empty state

**Empty Return Values Without Distinction:**
- Issue: `src/lib/auth-helper.ts` returns `null` for three different cases (auth error, employee not found, inactive employee). No way to distinguish why auth failed.
- Files: `src/lib/auth-helper.ts` (lines 39, 48, 59)
- Impact: Cannot provide specific error messages to users (e.g., "account disabled" vs "invalid credentials")
- Fix approach: Return typed error enum or distinct error objects

## Security Considerations

**No Input Sanitization on Note/Description Fields:**
- Issue: API routes accept string inputs for notes, descriptions, and store them directly without sanitization. Frontend displays with `dangerouslySetInnerHTML` risk if any component uses HTML rendering.
- Files: `src/app/api/tasks/route.ts`, `src/app/api/raw-materials/route.ts`, various frontend pages
- Current mitigation: React escapes by default in JSX
- Recommendations: Consider adding XSS prevention layer, validate max length on text fields

**Role-Based Access with Minimal Enforcement:**
- Issue: Middleware checks auth only; actual role enforcement is scattered in individual API routes. Inconsistent implementation - some routes check `user.isAdmin`, others don't.
- Files: `src/middleware.ts`, various API routes
- Impact: Easy to miss authorization checks when adding new endpoints
- Fix approach: Create middleware or wrapper function that enforces role at route level

**Missing Rate Limiting:**
- Issue: No rate limiting on API endpoints. Auth endpoints and data mutations could be abused.
- Files: All API routes in `src/app/api/`
- Recommendations: Implement rate limiting, especially on login and data modification endpoints

## Performance Bottlenecks

**Polling Every 5 Seconds:**
- Issue: Production page refetches batches, flavors, raw materials, and finished products every 5 seconds with `refetchInterval: 5000`. This creates unnecessary load during idle periods.
- Files: `src/app/production/page.tsx` (lines 110-132)
- Impact: Unnecessary database queries, increased latency perception
- Improvement path: Implement stale-time, reduce polling to 30s, or use WebSocket/SSE for real-time updates

**N+1 Query Risk in Product Routes:**
- Issue: `src/app/api/products/route.ts` fetches all variants for each product, with multiple includes that may not use select() efficiently.
- Files: `src/app/api/products/route.ts` (lines 13-32)
- Impact: Performance degrades with many products/variants
- Improvement path: Add pagination, use specific select() instead of include for read-only operations

**No Database Query Caching:**
- Issue: Every page load executes fresh Prisma queries. No caching layer for frequently accessed data like flavors, sizes, or settings.
- Files: All server components and API routes
- Improvement path: Implement Redis caching or Next.js Data Cache for static reference data

## Fragile Areas

**Task Permission Logic:**
- Issue: Task update logic in `src/app/api/tasks/route.ts` has complex permission checking (lines 166-202) that could have edge cases. Assignees can only update status/dates, not title/description.
- Files: `src/app/api/tasks/route.ts` (lines 166-202)
- Why fragile: Multiple conditions with AND/OR logic, hard to test all combinations
- Safe modification: Add unit tests for permission combinations before changing logic
- Test coverage: No test suite found

**Batch Stock Calculations:**
- Issue: Batch creation/deletion manually calculates and updates raw_material and powder_stock. Race conditions possible if concurrent batch operations occur.
- Files: `src/app/api/batches/route.ts`
- Why fragile: Multiple writes in transaction that depend on calculated values (yield_percent, waste_loss)
- Safe modification: Ensure all stock calculations happen atomically within transaction
- Test coverage: No test suite found

**Status Transition Logic:**
- Issue: Batch "Sent in Factory" status triggers powder_stock and finished_products creation. Other status transitions may not have equivalent reverse operations.
- Files: `src/app/api/batches/route.ts` (lines 93-109, 192-208)
- Why fragile: Incomplete status reversals could leave orphan records
- Safe modification: Verify all status transitions have corresponding reverse operations

## Scaling Limits

**PostgreSQL Single Instance:**
- Current capacity: Schema supports typical small-medium workload
- Limit: No read replicas configured, single DB instance
- Scaling path: Add Prisma read replicas, implement connection pooling

**No Pagination on Most API Routes:**
- Current capacity: Returns all records (e.g., raw-materials, flavors, sizes)
- Limit: Will degrade with large datasets
- Scaling path: Add limit/offset or cursor-based pagination to all list endpoints

**Session Management via Supabase:**
- Current capacity: Relies on Supabase Auth tokens
- Limit: Dependent on Supabase service limits
- Scaling path: Monitor auth token refresh patterns, implement token rotation

## Dependencies at Risk

**Next.js 16.2.2:**
- Risk: Very recent version ( bleeding edge), may have undiscovered issues
- Impact: Stability risk if bugs found in production
- Migration plan: Monitor Next.js release notes, maintain test coverage to catch regressions

**Prisma 7.6.0:**
- Risk: Also recent version, schema migrations could have edge cases
- Impact: Database operations may have unexpected behavior
- Migration plan: Keep Prisma updated, test migrations in staging first

## Missing Critical Features

**No Test Suite:**
- Problem: No testing framework configured, no test files exist
- Blocks: Safe refactoring, regression detection, confidence in deployment
- Priority: High

**No API Documentation:**
- Problem: 25+ API routes with no OpenAPI/Swagger documentation
- Blocks: Third-party integrations, onboarding new developers
- Priority: Medium

**No Error Monitoring:**
- Problem: No Sentry, LogRocket, or similar error tracking
- Blocks: Proactive bug discovery in production
- Priority: Medium

## Test Coverage Gaps

**All API Routes:**
- What's not tested: No endpoint has unit or integration tests
- Files: All files in `src/app/api/`
- Risk: Silent failures, data corruption, security gaps go unnoticed
- Priority: High

**Batch Stock Logic:**
- What's not tested: Raw material deduction, powder stock updates, finished products creation
- Files: `src/app/api/batches/route.ts`
- Risk: Incorrect calculations could deplete stock unexpectedly
- Priority: High

**Authentication Flow:**
- What's not tested: getCurrentUser(), requireAuth(), middleware redirects
- Files: `src/lib/auth-helper.ts`, `src/middleware.ts`
- Risk: Auth bypasses, session handling bugs
- Priority: High

**Frontend State Management:**
- What's not tested: React Query mutations, Zustand store updates
- Files: Components using useQuery/useMutation
- Risk: Optimistic updates with stale data, notification failures
- Priority: Medium

---

*Concerns audit: 2026-04-09*