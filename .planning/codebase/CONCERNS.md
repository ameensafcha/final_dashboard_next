# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

### Silent Error Handling
- **Issue:** API routes and auth helpers catch errors but do not provide useful error messages or logging
- **Files:** `src/lib/auth-helper.ts` (line 66 returns null silently), `src/middleware.ts` (line 37)
- **Impact:** Failures in authentication are invisible, making debugging difficult
- **Fix approach:** Add proper error logging and consider returning meaningful error types instead of swallowing exceptions

### Duplicate/Legacy Database Models
- **Issue:** Schema contains redundant models for powder and raw material tracking
- **Files:** `prisma/schema.prisma` - `raw_material_stock` (line 206), `powder_stock` (line 222)
- **Impact:** Confusing data model, potential data inconsistency between models
- **Fix approach:** Consolidate to single source of truth, migrate data, remove legacy models

### Type Safety Gaps
- **Issue:** API routes use loose typing in where clauses
- **Files:** `src/app/api/tasks/route.ts` (line 19: `const where: any = {}`)
- **Impact:** Runtime errors possible, no compile-time checking
- **Fix approach:** Define proper Prisma where input types

### Hardcoded UI Values
- **Issue:** Colors and strings scattered in components instead of centralized
- **Files:** `src/components/task-detail.tsx` (line 245: `bg-yellow-100`), `src/components/tasks-table.tsx` (line 243: `#E8C547`)
- **Impact:** Inconsistent styling, difficult to theme
- **Fix approach:** Move to CSS variables or theme configuration

## Known Bugs

### Auth Timeout Race Condition
- **Symptoms:** User session may persist after 10-second auth timeout even if session is invalid
- **Files:** `src/contexts/auth-context.tsx` (lines 116-119)
- **Trigger:** Slow network during initial auth check
- **Workaround:** None identified

### Real-time Subscription Gap
- **Symptoms:** Task list may not update immediately after changes
- **Files:** `src/components/tasks-table.tsx` (lines 93-118)
- **Trigger:** Multiple rapid updates cause race condition in fetch
- **Workaround:** Manual page refresh

### Missing API Route Return Types
- **Issue:** Several API routes lack explicit return type annotations
- **Files:** `src/app/api/transactions/route.ts`, `src/app/api/tasks/route.ts`
- **Impact:** Inconsistent typing, potential for incorrect responses
- **Workaround:** Add `Promise<NextResponse>` return types

## Security Considerations

### Environment Variable Validation
- **Risk:** App will crash at runtime if Supabase env vars are missing (uses `!` operator)
- **Files:** `src/lib/auth-helper.ts` (line 24-25), `src/middleware.ts` (line 12-13)
- **Current mitigation:** None - uses non-null assertions without checks
- **Recommendations:** Add startup validation or use default values

### Input Validation Gaps
- **Risk:** API endpoints lack comprehensive input validation
- **Files:** `src/app/api/transactions/route.ts` (POST only checks type and amount)
- **Current mitigation:** Basic required field checks
- **Recommendations:** Add Zod validation schemas for all API endpoints

### Client-Side Auth State
- **Risk:** Auth state relies heavily on client-side checks
- **Files:** `src/contexts/auth-context.tsx`
- **Current mitigation:** Server-side auth helper in API routes
- **Recommendations:** Ensure all sensitive operations use server-side verification

## Performance Bottlenecks

### Large Component Render
- **Problem:** `TaskDetail` component is 543 lines with multiple useEffect hooks and queries
- **Files:** `src/components/task-detail.tsx`
- **Cause:** Single component handles all task detail functionality
- **Improvement path:** Split into smaller composable components (SubtaskList, CommentList, TimeLogList)

### Multiple Parallel Queries
- **Problem:** Task detail fetches subtasks, comments, and time logs separately on tab switch
- **Files:** `src/components/task-detail.tsx` (lines 109-140)
- **Cause:** Each tab triggers separate fetch even when data may exist
- **Improvement path:** Batch fetch or use existing React Query cache more effectively

### Real-time Poll on Every Change
- **Problem:** Task table re-fetches entire list on any database change
- **Files:** `src/components/tasks-table.tsx` (lines 93-118)
- **Cause:** No filtering server-side, fetches all tasks then filters client-side
- **Improvement path:** Add proper database-level filtering

## Fragile Areas

### Auth Flow Complexity
- **Files:** `src/lib/auth-helper.ts`, `src/contexts/auth-context.tsx`, `src/middleware.ts`
- **Why fragile:** Three different auth mechanisms (server helper, client context, middleware) that must stay in sync
- **Safe modification:** Make incremental changes only, test auth flow thoroughly
- **Test coverage:** No automated tests for auth flow

### Complex Task Filter Logic
- **Files:** `src/app/api/tasks/route.ts` (lines 21-64)
- **Why fragile:** Role-based filtering with search and multiple optional filters creates complex conditional logic
- **Safe modification:** Extract filter building into separate function with unit tests
- **Test coverage:** No tests for filter combinations

### Kanban Board State
- **Files:** `src/components/task-board.tsx`
- **Why fragile:** Drag-and-drop state management is complex without proper testing
- **Safe modification:** Test drag operations thoroughly
- **Test coverage:** No tests for board interactions

## Scaling Limits

### Database Queries
- **Current capacity:** All task queries without pagination
- **Limit:** Will degrade with large task counts (>1000 tasks)
- **Scaling path:** Add offset/limit pagination to task queries

### Real-time Subscriptions
- **Current capacity:** Single channel for task changes
- **Limit:** One subscription per page, no channel cleanup guarantee
- **Scaling path:** Implement proper channel management with reconnection logic

### Auth Context Re-renders
- **Current capacity:** Auth state triggers re-renders across entire app
- **Limit:** Performance impact as app grows
- **Scaling path:** Split context or use targeted subscriptions

## Dependencies at Risk

### Prisma 7.x
- **Risk:** Using preview feature (Postgres adapter) which may change
- **Impact:** Schema migration issues if adapter API changes
- **Migration plan:** Monitor Prisma releases, test upgrades in staging

### Next.js 16.x
- **Risk:** Early adoption of Next.js 16 (latest)
- **Impact:** Fewer community resources, potential edge case bugs
- **Migration plan:** Keep updated with patch releases, monitor Next.js issues

## Missing Critical Features

### Error Boundaries
- **Problem:** No React error boundaries to gracefully handle component failures
- **Blocks:** Complete app crash on any component error

### Loading States
- **Problem:** Some operations have no loading indicators
- **Blocks:** User confusion during async operations

### Form Validation Feedback
- **Problem:** Forms show minimal validation error messages
- **Blocks:** Poor user experience on invalid input

## Test Coverage Gaps

### No Test Framework
- **What's not tested:** All functionality
- **Files:** `package.json` - no test runner configured
- **Risk:** Any refactoring could introduce bugs without detection
- **Priority:** High

### API Routes
- **What's not tested:** All CRUD operations
- **Files:** `src/app/api/*/route.ts`
- **Risk:** Data corruption, incorrect responses go unnoticed
- **Priority:** High

### Auth Flow
- **What's not tested:** Login, logout, session refresh
- **Files:** `src/contexts/auth-context.tsx`, `src/lib/auth-helper.ts`
- **Risk:** Security vulnerabilities from auth bugs
- **Priority:** High

### Component Interactions
- **What's not tested:** Task board drag-and-drop, form submissions, detail views
- **Files:** `src/components/task-board.tsx`, `src/components/task-form.tsx`, `src/components/task-detail.tsx`
- **Risk:** UI broken without detection
- **Priority:** Medium

---

*Concerns audit: 2026-04-09*