---
phase: 01-foundation
plan: 02
subsystem: Auth/RBAC
tags: [prisma, rbac, nextjs-15, cache]
dependency_graph:
  requires: ["01-foundation-01"]
  provides: ["RBAC-Utility", "Initial-Seeding"]
  affects: ["Middleware", "Server-Components"]
tech-stack:
  - nextjs-15: unstable_cache
  - react: cache()
  - prisma: seed, rolePermission
key-files:
  - prisma/seed.ts
  - src/lib/rbac.ts
  - src/lib/rbac.test.ts
decisions:
  - use-combined-query: Fetch user role and permissions in a single database query within rbac.ts to reduce latency.
  - hierarchical-caching: Combined React's per-request cache() with Next.js cross-request unstable_cache() for optimal performance.
  - admin-bypass: Implemented hardcoded bypass for 'admin' role in checkPermission to ensure full system access.
metrics:
  duration: 45m
  completed_date: "2026-04-11"
---

# Phase 1 Plan 2: Seeding & Core RBAC Utility Summary

## Objective
Populate the Permission table with initial data and implement the core server-side permission checking utility with advanced caching.

## Key Changes
- **Updated `prisma/seed.ts`**:
    - Now synchronizes with `src/lib/permissions.ts`.
    - Automatically splits permission keys (e.g., `dashboard:view`) into resource/action pairs for the database.
    - Populates `Permission`, `Role`, and `RolePermission` tables.
- **Implemented `src/lib/rbac.ts`**:
    - `checkPermission(permission, userId)` utility.
    - Memoized fetching using React `cache()`.
    - Cross-request caching using Next.js `unstable_cache`.
    - Added support for `revalidateTag('permissions')`.
- **Added `src/lib/rbac.test.ts`**:
    - Comprehensive unit tests covering admin bypass, successful permission checks, and denial of unauthorized access.

## Success Criteria Verification
- [x] Permissions table populated with 21 entries.
- [x] 3 Roles (admin, employee, viewer) created and assigned correct permissions.
- [x] `checkPermission` correctly identifies permissions for different roles.
- [x] Admin bypass functional (returns `true` for all checks).

## Deviations from Plan
- **Implementation Tweak**: Combined role and permission fetching into a single query in `rbac.ts` instead of two separate functions to minimize DB roundtrips. This was an optimization during implementation.

## Known Stubs
- None.

## Threat Flags
| Flag | File | Description |
|------|------|-------------|
| threat_flag: Spoofing | src/lib/rbac.ts | `checkPermission` relies on `userId` being correct. Callers must ensure this ID comes from a verified session. |

## Self-Check: PASSED
- [x] `prisma/seed.ts` exists and runs successfully.
- [x] `src/lib/rbac.ts` and `src/lib/rbac.test.ts` exist.
- [x] `npm test src/lib/rbac.test.ts` passes with 3/3 tests.
- [x] Commits made for each task.
