# Roadmap: ERP Authentication Refactoring

**Created:** 2025-04-11
**Granularity:** Fine (8-12 phases)
**Core Value:** Users can securely log in with Supabase Auth and access only the modules and features their assigned role permits — permissions are fully database-driven with admin-managed roles and permissions.

## Phases

- [x] **Phase 1: Supabase Auth Foundation** - User login, logout, session persistence
- [ ] **Phase 2: Auth Middleware & Protection** - Route protection, redirect for unauthenticated users
- [ ] **Phase 3: Role CRUD** - Admin can create, read, edit, delete roles
- [ ] **Phase 4: Permission Management** - Admin can view and manage available permissions in database
- [ ] **Phase 5: Permission Assignment UI** - Admin can assign/remove permissions to roles via checkbox UI
- [ ] **Phase 6: Dynamic Sidebar** - Sidebar shows only modules user has permission to access
- [ ] **Phase 7: Employee Role Assignment** - Admin can assign and change employee roles
- [ ] **Phase 8: Module Access Enforcement** - Users can only access modules their role permits
- [ ] **Phase 9: Permission Cache Invalidation** - Admin permission changes reflect immediately
- [ ] **Phase 10: 403 Forbidden Handler** - Proper forbidden page for unauthorized access attempts

---

## Phase Details

### Phase 1: Supabase Auth Foundation

**Goal:** Users can sign in with email/password, sessions persist, and users can log out

**Depends on:** Nothing (first phase)

**Requirements:** AUTH-01, AUTH-02, AUTH-03

**Success Criteria** (what must be TRUE):
1. User can sign in with email/password via Supabase Auth and see dashboard
2. User session persists across browser refresh
3. User can log out from any page and be redirected to login

**Plans:** 1 plan (01)

**Plan list:**
- [x] 01-01-PLAN.md — Verify login/logout/session flows

**UI hint:** yes

---

### Phase 2: Auth Middleware & Protection

**Goal:** Unauthenticated users are redirected to login, route protection in place

**Depends on:** Phase 1

**Requirements:** AUTH-04

**Success Criteria** (what must be TRUE):
1. Unauthenticated user trying to access any protected route is redirected to /login
2. After successful login, user is redirected to intended destination

**Plans:** TBD

---

### Phase 3: Role CRUD

**Goal:** Admin can view, create, edit, and delete roles from database

**Depends on:** Phase 2

**Requirements:** ROLE-01, ROLE-02, ROLE-03, ROLE-04

**Success Criteria** (what must be TRUE):
1. Admin can view list of all roles in database
2. Admin can create new role with name and description
3. Admin can edit existing role name and description
4. Admin can delete role (employees with that role get role_id set to null, not deleted)

**Plans:** 1 plan (01)

**Plan list:**
- [x] 03-01-PLAN.md — Full CRUD with API + UI

**UI hint:** yes

---

### Phase 4: Permission Management

**Goal:** Admin can view all available permissions stored in database

**Depends on:** Phase 3

**Requirements:** PERM-01, PERM-04

**Success Criteria** (what must be TRUE):
1. Admin can view list of all available permissions from role_permissions table
2. Each permission shows name, description, and module it belongs to

**Plans:** TBD

---

### Phase 5: Permission Assignment UI

**Goal:** Admin can assign and remove permissions to/from roles via checkbox UI

**Depends on:** Phase 4

**Requirements:** ROLE-05, PERM-02, PERM-03

**Success Criteria** (what must be TRUE):
1. Admin can view role and see all available permissions as checkboxes
2. Admin can check/uncheck permissions to assign/remove them from role
3. Permission changes are saved to database immediately

**Plans:** 1 plan (01)

**Plan list:**
- [ ] 05-01-PLAN.md — Database-driven permission assignment UI

**UI hint:** yes

---

### Phase 6: Dynamic Sidebar

**Goal:** Sidebar shows only menu items user has permission to access

**Depends on:** Phase 5

**Requirements:** MOD-02, DASH-01

**Success Criteria** (what must be TRUE):
1. All authenticated users can access dashboard
2. Sidebar renders only menu items user has permission to view
3. User with no module permissions sees only dashboard

**Plans:** 1 plan (01)

**Plan list:**
- [ ] 06-01-PLAN.md — Dynamic sidebar with permission filtering

**UI hint:** yes

---

### Phase 7: Employee Role Assignment

**Goal:** Admin can view employees and assign/change their roles

**Depends on:** Phase 3

**Requirements:** EMP-01, EMP-02, EMP-03

**Success Criteria** (what must be TRUE):
1. Admin can view list of all employees with their current roles
2. Admin can change employee's role via dropdown selection
3. Employee's permissions update immediately based on new role assignment

**Plans:** 1 plan (01)

**Plan list:**
- [ ] 07-01-PLAN.md — Role dropdown in employees table with permission cache invalidation

**UI hint:** yes

---

### Phase 8: Module Access Enforcement

**Goal:** Users can only access modules their role has permission for

**Depends on:** Phase 6

**Requirements:** MOD-01

**Success Criteria** (what must be TRUE):
1. User can access modules only if their role has required permission
2. Unauthorized access attempts are blocked at middleware level

**Plans:** 1 plan (01)

**Plan list:**
- [x] 08-01-PLAN.md — requirePermission() helper and protected API routes

---

### Phase 9: Permission Cache Invalidation

**Goal:** Admin permission changes reflect immediately without needing to log out

**Depends on:** Phase 5

**Requirements:** EMP-03 (reused)

**Success Criteria** (what must be TRUE):
1. When admin changes role permissions, those changes take effect on next route navigation
2. Admin does not need to log out and log back in to see permission changes

**Plans:** TBD

---

### Phase 10: 403 Forbidden Handler

**Goal:** Proper 403 Forbidden page when user accesses unauthorized route

**Depends on:** Phase 8

**Requirements:** MOD-03

**Success Criteria** (what must be TRUE):
1. User receives clear 403 Forbidden page when accessing unauthorized module
2. Page shows appropriate message explaining access denied
3. User can navigate back to permitted pages from 403 page

**Plans:** TBD

**UI hint:** yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Supabase Auth Foundation | 0/3 | Not started | - |
| 2. Auth Middleware & Protection | 0/2 | Not started | - |
| 3. Role CRUD | 0/4 | Not started | - |
| 4. Permission Management | 0/2 | Not started | - |
| 5. Permission Assignment UI | 0/3 | Not started | - |
| 6. Dynamic Sidebar | 0/1 | Not started | - |
| 7. Employee Role Assignment | 0/3 | Not started | - |
| 8. Module Access Enforcement | 0/2 | Not started | - |
| 9. Permission Cache Invalidation | 0/2 | Not started | - |
| 10. 403 Forbidden Handler | 0/3 | Not started | - |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 2 | Pending |
| ROLE-01 | Phase 3 | Pending |
| ROLE-02 | Phase 3 | Pending |
| ROLE-03 | Phase 3 | Pending |
| ROLE-04 | Phase 3 | Pending |
| ROLE-05 | Phase 5 | Pending |
| PERM-01 | Phase 4 | Pending |
| PERM-02 | Phase 5 | Pending |
| PERM-03 | Phase 5 | Pending |
| PERM-04 | Phase 4 | Pending |
| DASH-01 | Phase 6 | Pending |
| MOD-01 | Phase 8 | Pending |
| MOD-02 | Phase 6 | Pending |
| MOD-03 | Phase 10 | Pending |
| EMP-01 | Phase 7 | Pending |
| EMP-02 | Phase 7 | Pending |
| EMP-03 | Phase 7 + Phase 9 | Pending |

**Coverage:** 20/20 requirements mapped ✓

### Phase 11: Fix build errors and remove dead code

**Goal:** Fix TypeScript build errors preventing successful `npm run build`
**Requirements**: None (technical fix phase)
**Depends on:** Phase 10
**Plans:** 1 plan (01)

Plans:
- [x] 11-01-PLAN.md — Fix build errors in admin layout and settings API

---

*Roadmap created: 2025-04-11*