# Phase 4: Permission Management - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can view all available permissions stored in the role_permissions table. Each permission shows name, description, and module it belongs to. Permission assignment is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Permission Storage
- **D-01:** Permissions stored in role_permissions table (already in use)
- **D-02:** Hardcoded list in UI (AVAILABLE_PERMISSIONS) — should be fetched from DB instead

### Permission Display
- **D-03:** Show permissions grouped by module prefix (e.g., "edit:dashboard", "view:stocks")
- **D-04:** Each permission shows name, module, and active status

### the agent's Discretion
- Whether to create separate permissions API endpoint
- Exact display format (table, list, cards)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — PERM-01, PERM-04

### Existing APIs
- `src/app/api/roles/permissions/route.ts` — POST endpoint (toggle permission)
- `src/app/admin/roles/page.tsx` — UI with AVAILABLE_PERMISSIONS

[If no external specs: "No external specs — requirements fully captured in decisions above"]

</canonical_refs>

<specifics>
## Specific Ideas

- Permissions already displayed in roles page UI
- Need to migrate from hardcoded to database-driven

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<deferred>
## Deferred Ideas

- Permission assignment UI — Phase 5 (PERM-02, PERM-03)
- Permission CRUD — separate phase
- Dynamic permission loading from DB — Phase 5

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: 04-permission-management*
*Context gathered: 2025-04-11*