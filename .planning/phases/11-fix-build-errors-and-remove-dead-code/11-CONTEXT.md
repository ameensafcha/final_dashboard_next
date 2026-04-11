# Phase 11: Fix build errors and remove dead code - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix TypeScript build errors preventing successful `npm run build`. Remove any dead code (unused imports, orphaned files).

</domain>

<decisions>
## Implementation Decisions

### Error fix approach
- **D-01:** Fix imports referencing deleted files (`auth-rbac.ts`, `permissions.ts`)
  - If `auth-rbac.ts` was deleted per PROJECT.md, remove the import in `src/app/admin/layout.tsx`
  - If functions are needed, implement in `auth-helper.ts`

### requireRole export
- **D-02:** Either add `requireRole` to `auth-helper.ts` or update `src/app/api/settings/route.ts` to use existing function
  - Current: imports non-existent `requireRole` from `@/lib/auth-helper`

### Prisma schema
- **D-03:** Either add `person` field to Transaction model or remove from API routes
  - Files using: `src/app/api/receiving/route.ts`, `src/app/api/transactions/route.ts`
  - Prisma likely missing this field (needs schema check)

### API route handler typing
- **D-04:** Fix return type issues in `src/app/api/roles/route.ts`
  - Next.js route handler must return `Response`, not union types

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Build configuration
- `package.json` — Scripts for build, lint, typecheck

### Auth files
- `src/lib/auth-helper.ts` — Existing auth utilities
- `src/app/api/settings/route.ts` — Imports `requireRole` (missing)
- `src/app/admin/layout.tsx` — Imports `checkRoutePermission` from deleted file

### API routes with errors
- `src/app/api/roles/route.ts` — Return type issue
- `src/app/api/receiving/route.ts` — Invalid `person` field
- `src/app/api/transactions/route.ts` — Invalid `person` field

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/auth-helper.ts` — Contains `getCurrentUser`, `requireAuth`, `requireAdmin`, `requirePermission`
- Middleware layer in `src/middleware.ts`

### Established Patterns
- API routes use `NextResponse.json()` for responses
- Auth checks use imported helpers from `auth-helper.ts`

### Integration Points
- Multiple files import from `auth-rbac.ts` (deleted) - needs migration
- `src/app/api/settings/route.ts` uses `requireRole` - needs either export or migration

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard technical fixes needed.

</specifics>

<deferred>
## Deferred Ideas

None — technical fix phase.

</deferred>

---

*Phase: 11-fix-build-errors-and-remove-dead-code*
*Context gathered: 2025-04-11*