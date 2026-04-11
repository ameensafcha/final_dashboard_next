# Requirements: ERP Authentication System

**Defined:** 2025-04-11
**Core Value:** Users can securely log in with Supabase Auth and access only the modules and features their assigned role permits — permissions are fully database-driven.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign in with email/password via Supabase Auth
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: Unauthenticated users are redirected to login page

### Role Management

- [ ] **ROLE-01**: Admin can view all roles
- [ ] **ROLE-02**: Admin can create new role
- [ ] **ROLE-03**: Admin can edit existing role
- [ ] **ROLE-04**: Admin can delete role (employees set to null, not deleted)
- [ ] **ROLE-05**: Admin can assign permissions to role

### Permission Management

- [ ] **PERM-01**: Admin can view all available permissions
- [ ] **PERM-02**: Admin can assign permissions to role via checkbox UI
- [ ] **PERM-03**: Admin can remove permissions from role
- [ ] **PERM-04**: Permissions are stored in database (role_permissions table)

### Dashboard Access

- [ ] **DASH-01**: All authenticated users can access dashboard

### Module Access Control

- [ ] **MOD-01**: User can access modules only if their role has required permission
- [ ] **MOD-02**: Sidebar shows only menu items user has permission to access
- [ ] **MOD-03**: User receives 403 Forbidden when accessing unauthorized page

### Employee Management

- [ ] **EMP-01**: Admin can view all employees
- [ ] **EMP-02**: Admin can assign/change employee role
- [ ] **EMP-03**: Employee's permissions update based on role assignment

## v2 Requirements

- **AUTH-05**: Email verification before first login
- **AUTH-06**: Password reset via email link
- **PERM-05**: Permission groups for easier management
- **PERM-06**: Permission inheritance (optional)

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth (Google, GitHub) | Email/password sufficient for v1 |
| Two-factor authentication | Extra security not required for v1 |
| Audit logging for permission changes | Can add in future |
| Hardcoded role checks | All must be DB-driven |

## Traceability

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

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2025-04-11*