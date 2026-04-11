---
phase: 11-fix-build-errors-and-remove-dead-code
plan: "01"
subsystem: build-fixes
tags: [build, typescript, fix]
dependency_graph: {}
tech_stack: [TypeScript, Next.js]
key_files:
  created: []
  modified:
    - src/app/admin/layout.tsx
    - src/lib/auth-helper.ts
decisions: []
metrics:
  duration: ""
  completed_date: 2025-04-11
---

# Phase 11 Plan 01: Fix Build Errors Summary

**Objective:** Fix TypeScript build errors preventing successful `npm run build`.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix admin layout import from deleted auth-rbac | 7d675c8 | src/app/admin/layout.tsx |
| 2 | Add requireRole to auth-helper.ts | 7d675c8 | src/lib/auth-helper.ts |
| 3 | Verify TypeScript compilation | 7d675c8 | (verification) |

## Changes Made

### Task 1: Fix admin/layout.tsx
- **Before:** Imported non-existent `checkRoutePermission` from `@/lib/auth-rbac` (file was deleted)
- **After:** Replaced with `getCurrentUser` from `@/lib/auth-helper`, checks both authentication and admin role

```typescript
// Fixed: AdminRoute now checks auth + isAdmin
const user = await getCurrentUser();
if (!user) redirect("/login");
if (!user.isAdmin) redirect("/unauthorized");
```

### Task 2: Add requireRole function
- Added `requireRole(roleName: string)` function to auth-helper.ts
- Used by settings route to enforce role-based access
- Returns `AuthUser` on success, `NextResponse` with 401/403 on failure

## Deviation Notes

**None** - Plan executed exactly as written.

## Out of Scope (Deferred)

Pre-existing build errors in other files:
- `src/app/api/roles/route.ts` - Type incompatibility in POST return types
- `src/app/api/receiving/route.ts` - Invalid 'person' property on transactions
- `src/app/api/transactions/route.ts` - Invalid 'person' property on transactions

These errors are NOT in the scope of this plan (which targets admin/layout.tsx, settings/route.ts, auth-helper.ts).

## Verification

- [x] Target files compile without TypeScript errors (verified via `npx tsc --noEmit`)
- [x] Admin layout uses only auth-helper.ts exports
- [x] auth-helper.ts exports requireRole function
- [x] Changes committed

## Self-Check: PASSED