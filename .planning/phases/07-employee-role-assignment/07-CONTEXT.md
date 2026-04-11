# Phase 7: Employee Role Assignment - Context

**Gathered:** 2025-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can view employees and assign/change their roles. Employee's permissions update immediately based on new role assignment (EMP-03 handled by existing /api/users/permissions endpoint).

</domain>

<decisions>
## Implementation Decisions

### Backend API
- **D-01:** Use existing `/api/auth/role` GET endpoint — Returns employees with role info
- **D-02:** Use existing `/api/auth/role` PATCH endpoint — Updates employee role
- **D-03:** No new API endpoints needed — backend already complete

### Permission Updates
- **D-04:** Use existing `/api/users/permissions` for real-time permission updates (EMP-03)
- **D-05:** Invalidate permission cache on role change — immediate effect without logout

### UI Implementation
- **D-06:** Add role dropdown to employees table in `/admin/employees/page.tsx`
- **D-07:** Use TanStack Query for data fetching (consistent with prior phases)
- **D-08:** Fetch roles list from `/api/roles` for dropdown options

### Design Pattern
- **D-09:** Reuse existing employees table structure — add role column as dropdown
- **D-10:** shadcn/ui Select component for role dropdown

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — EMP-01, EMP-02, EMP-03

### Existing API Code
- `src/app/api/auth/role/route.ts` — GET (list), PATCH (update) — already exists
- `src/app/api/users/permissions/route.ts` — Permission fetching

### Existing UI Code
- `src/app/admin/employees/page.tsx` — Employee table to modify
- `src/app/api/roles/route.ts` — GET roles list for dropdown

### Prior Contexts
- `.planning/phases/05-permission-assignment-ui/05-CONTEXT.md` — TanStack Query pattern
- `.planning/phases/06-dynamic-sidebar/06-CONTEXT.md` — Permission cache invalidation

</canonical_refs>

 懒
## Existing Code Insights

### Reusable Assets
- Employee table in `src/app/admin/employees/page.tsx`
- Roles fetched from `/api/roles` in roles page

### Established Patterns
- TanStack Query for data fetching
- shadcn/ui Button, Dialog, Select components

### Integration Points
- `/api/auth/role` already handles role CRUD
- Roles dropdown needs `/api/roles` GET

</code_context>

<specifics>
## Specific Ideas

- Add role assignment dropdown inline in employees table
- Invalidate permissions cache on role change (EMP-03)
- Reuse existing employees table structure

</specifics>

<deferred>
## Deferred Ideas

- None — backend complete, only UI work

</deferred>

---

*Phase: 07-employee-role-assignment*
*Context gathered: 2025-04-11*