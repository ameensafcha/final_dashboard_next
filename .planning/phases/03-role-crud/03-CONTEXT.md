# Phase 3: Role CRUD - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can view all roles, create new roles, edit existing roles, and delete roles. When a role is deleted, employees with that role have their role_id set to null (not deleted). Permissions assignment is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### API Pattern
- **D-01:** RESTful API with standard endpoints:
  - GET /api/roles → list all roles (existing)
  - POST /api/roles → create role (existing)
  - PUT /api/roles/[id] → edit role (to implement)
  - DELETE /api/roles/[id] → delete role (to implement)

### UI Pattern
- **D-02:** Use shadcn/ui Table with Dialog for create/edit forms
- **D-03:** Inline editing via Dialog (not redirect page)
- **D-04:** Form validation: name required, unique, max 50 chars

### Delete Handling
- **D-05:** Soft delete: set role_id to null for employees, then delete role
- **D-06:** Confirmation dialog before delete
- **D-07:** Show employee count affected before delete

### the agent's Discretion
- Exact loading states and error messages
- Whether to use optimistic updates
- Form field styling details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — ROLE-01, ROLE-02, ROLE-03, ROLE-04

### Existing APIs
- `src/app/api/roles/route.ts` — GET and POST endpoints (Phase 1-2)

### Code Patterns
- `src/app/api/roles/route.ts` — Use as template for new endpoints

[If no external specs: "No external specs — requirements fully captured in decisions above"]

</canonical_refs>

<specifics>
## Specific Ideas

- Use existing dialog component pattern from employee forms
- Follow GET/POST pattern from existing roles route

[If none: "No specific requirements — open to standard approaches"]

</specifics>

<deferred>
## Deferred Ideas

- Permission assignment to roles — Phase 5 (ROLE-05)
- Bulk role operations — future phase
- Role duplication — future phase

[If none: "None — discussion stayed within phase scope"]

</deferred>

---

*Phase: 03-role-crud*
*Context gathered: 2025-04-11*