# Phase 8: Module Access Enforcement - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can only access modules their role has permission for. Unauthorized access attempts are blocked at middleware/API level (MOD-01).

</domain>

<decisions>
## Implementation Decisions

### Permission Helper
- **D-01:** Add `requirePermission(permission: string)` helper in auth-helper.ts
- **D-02:** Helper checks user's role has the required permission via role_permissions table

### API Route Protection
- **D-03:** Use requirePermission() in API route handlers that need specific permissions
- **D-04:** Return 403 Forbidden for unauthorized access attempts
- **D-05:** Consistent pattern across all protected API routes

### Middleware Enhancement (Optional)
- **D-06:** Middleware can check permissions but adds latency — API-level is recommended
- **D-07:** Keep auth check in middleware, permission check in API routes

### Implementation Pattern
- **D-08:** Use existing `/api/users/permissions` endpoint for permission fetching
- **D-09:** Similar to requireAdmin() pattern already in codebase

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MOD-01

### Existing Code
- `src/lib/auth-helper.ts` — requireAdmin() pattern to follow
- `src/app/api/users/permissions/route.ts` — Permission fetching (already exists)
- `src/middleware.ts` — Currently only checks auth, not permissions

### Prior Contexts
- `.planning/phases/05-permission-assignment-ui/05-CONTEXT.md` — Permissions stored in DB
- `.planning/phases/06-dynamic-sidebar/06-CONTEXT.md` — Sidebar uses permissions

</canonical_refs>

 懒
## Existing Code Insights

### Reusable Assets
- requireAdmin() in auth-helper.ts — Existing pattern to follow
- /api/users/permissions route — Returns user's permissions

### Established Patterns
- requireAdmin() checks role name === "admin"
- requirePermission() should check role_permissions table

### Integration Points
- API routes call requirePermission() before protected operations
- Return 403 for unauthorized access

</code_context>

<specifics>
## Specific Ideas

- Add requirePermission(permission) function similar to requireAdmin()
- Use in API routes for granular permission checks

</specifics>

<deferred>
## Deferred Ideas

- None — approach decided

</deferred>

---

*Phase: 08-module-access-enforcement*
*Context gathered: 2025-04-11*