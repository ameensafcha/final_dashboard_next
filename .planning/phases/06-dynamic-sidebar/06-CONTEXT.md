# Phase 6: Dynamic Sidebar - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Sidebar shows only menu items user has permission to access. All authenticated users can access dashboard. Users see only menu items their role's permissions permit.

</domain>

<decisions>
## Implementation Decisions

### Data Source
- **D-01:** Database-driven permissions (continues Phase 5 pattern)
- **D-02:** Fetch user's role permissions from /api/roles/permissions on app load
- **D-03:** Permissions stored in role_permissions table (PERM-01)

### Menu Filtering
- **D-04:** Compare menu item required permissions against user's permissions
- **D-05:** Show menu item only if user has matching permission
- **D-06:** Default to dashboard-only if no module permissions

### Implementation
- **D-07:** Use TanStack Query for permission fetching (consistent with Phase 5)
- **D-08:** Cache permissions client-side, invalidate on role change

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — MOD-02, DASH-01
- `.planning/phases/05-permission-assignment-ui/05-CONTEXT.md` — Phase 5 decisions

### Existing Code
- `src/components/ui/sidebar.tsx` — Existing sidebar component
- `src/components/app-sidebar.tsx` — App layout sidebar
- `src/app/api/roles/permissions/route.ts` — Permission API

</canonical_refs>

 懒
## Existing Code Insights

### Reusable Assets
- Existing sidebar components in ui/ and components/
- Permission fetching already works from Phase 5
- TanStack Query set up in roles page

### Established Patterns
- TanStack Query for data fetching (consistent across phases)
- Database-driven permissions (Phase 5)

### Integration Points
- /api/roles/permissions returns user's permissions
- Sidebar renders menu items based on permissions

</code_context>

<specifics>
## Specific Ideas

- Continue database-driven pattern from Phase 5
- Reuse existing sidebar with permission filtering

</specifics>

<deferred>
## Deferred Ideas

- None — approach decided

</deferred>

---

*Phase: 06-dynamic-sidebar*
*Context gathered: 2025-04-11*