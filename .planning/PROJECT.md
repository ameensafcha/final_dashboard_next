# ERP System - Authentication Refactoring

## What This Is

An ERP system for manufacturing business with authentication system built on Supabase Auth. The system manages inventory, products, production, tasks, finance, and provides role-based access control with permissions stored in PostgreSQL database.

## Core Value

Users can securely log in with Supabase Auth and access only the modules and features their assigned role permits — permissions are fully database-driven with admin-managed roles and permissions.

## Requirements

### Validated

- Supabase Auth integration — user login via email/password
- Employees table linked to Supabase user IDs
- Basic role-based access with admin, employee, viewer roles

### Active

- [ ] Redesign auth system with Supabase Auth as primary auth mechanism
- [ ] Delete current auth middleware and RBAC files (auth-rbac.ts, permissions.ts)
- [ ] Create database-driven role and permission system
- [ ] Admin panel for managing roles (create, edit, delete) and assigning permissions
- [ ] Dynamic sidebar that shows/hides items based on user's permissions from database
- [ ] All modules with permission-based access: Dashboard, Inventory, Products, Production, Tasks, Finance, Admin Panel

### Out of Scope

- OAuth providers (Google, GitHub) — email/password sufficient for v1
- Two-factor authentication
- Audit logging for permissions changes

## Context

Current system has:
- Supabase Auth for authentication (partially implemented)
- Roles stored in `roles` table with `role_permissions` junction table
- `employees` table with role_id foreign key
- Middleware.ts checks auth state and redirects
- auth-helper.ts, auth-rbac.ts, permissions.ts for auth logic
- app-sidebar.tsx shows sidebar items based on role (hardcoded isAdmin check)

User wants: Clean, database-driven permission system where admin can manage all roles/permissions from UI.

## Constraints

- **Tech Stack**: Next.js 16, Supabase Auth, Prisma ORM, PostgreSQL
- **Auth**: Use Supabase Auth as the single source of truth
- **Schema**: Don't change existing schema structure - just use existing tables

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth primary | User requirement - auth via Supabase | — Pending |
| DB-driven permissions | No hardcoded permissions - admin manages from UI | — Pending |
| Delete current auth files | User request to redesign auth from scratch | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2025-04-11 after initialization*