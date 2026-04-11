# Phase 5: Permission Assignment UI - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can assign and remove permissions to/from roles via checkbox UI. Permission changes saved to database immediately. Uses database-driven permissions (not hardcoded).

</domain>

<decisions>
## Implementation Decisions

### Permission Source
- **D-01:** Database-driven permission list (not hardcoded)
- **D-02:** Seed default permissions into role_permissions table on first run

### Permission List
- **D-03:** GET /api/roles/permissions returns all available permissions from DB
- **D-04:** Default permissions seeded: edit:dashboard, view:stocks, manage:employees, manage:batches, view:finance, delete:records

### UI Pattern
- **D-05:** Checkbox/toggle UI already exists in roles page
- **D-06:** Toggle permission calls POST /api/roles/permissions

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ROLE-05, PERM-02, PERM-03

### Existing Code
- `src/app/admin/roles/page.tsx` — UI with available permissions
- `src/app/api/roles/permissions/route.ts` — POST (toggle), GET (list permissions)

### Prior Contexts
- `.planning/phases/03-role-crud/03-CONTEXT.md` — Role CRUD patterns
- `.planning/phases/04-permission-management/04-CONTEXT.md` — Permission management noted hardcoded issue

</canonical_refs>

 <code_context>
## Existing Code Insights

### Reusable Assets
- AVAILABLE_PERMISSIONS array in roles/page.tsx — Will be replaced with DB fetch
- togglePermissionMutation in roles/page.tsx — Can be reused

### Established Patterns
- Use TanStack Query for data fetching
- Use shadcn/ui Dialog, Button components
- POST to toggle, GET to list

### Integration Points
- POST /api/roles/permissions — Already exists for toggle
- GET /api/roles/permissions — Returns assigned permissions only

</code_context>

<specifics>
## Specific Ideas

- Seed default permissions into role_permissions table
- Migrate AVAILABLE_PERMISSIONS to fetch from API

</specifics>

<deferred>
## Deferred Ideas

- None — implementation approach decided

</deferred>

---

*Phase: 05-permission-assignment-ui*
*Context gathered: 2025-04-11*