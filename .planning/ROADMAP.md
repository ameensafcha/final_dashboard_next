# Roadmap: RBAC Rebuild (Database-Driven)

## Phase 1: Database & API Core (Foundations)
**Plans:** 3 plans
- [ ] 01-01-PLAN.md — Schema Refinement & Migration
- [ ] 01-02-PLAN.md — Seeding & Core RBAC Utility
- [ ] 01-03-PLAN.md — Foundation API Endpoints

- [ ] **1.1 Schema Update:** Refine `prisma/schema.prisma` with `Role`, `Permission`, and `RolePermission` models.
- [ ] **1.2 Migration:** Run Prisma migrations to update the database.
- [ ] **1.3 Seed Data:** Create a seed script to populate initial roles and permissions based on current hardcoded logic.
- [ ] **1.4 Permission Utility:** Implement a server-side `checkPermission` utility with Next.js 15 caching.
- [ ] **1.5 API Endpoints:** Create CRUD APIs for roles and permissions.

## Phase 2: Permission Management UI (The Matrix)
- [ ] **2.1 Role Management:** Build a simple UI to list, add, and edit roles.
- [ ] **2.2 Permission Matrix:** Implement the core UI for toggling permissions across roles.
- [ ] **2.3 Real-time Feedback:** Ensure permission changes trigger cache revalidation and update the UI.
- [ ] **2.4 User Role Assignment:** Update user/employee management UI to assign roles from the database.

## Phase 3: Integration & Flow Migration (Transition)
- [ ] **3.1 Global Auth Context:** Update `AuthContext` to fetch permissions from the new database-backed API.
- [ ] **3.2 Dual-Check Implementation:** Temporarily support both old and new permission checks in guards.
- [ ] **3.3 Middleware Update:** Transition route-based protection to use the new permission system.
- [ ] **3.4 E2E Testing:** Verify that all existing flows work with the new DB-driven permissions.

## Phase 4: Cleanup & Documentation (Finality)
- [ ] **4.1 Old Code Removal:** Delete `src/lib/permissions.ts` and remove legacy role/permission constants.
- [ ] **4.2 Refactor Guards:** Update all `PermissionGuard` and API checks to use only the new system.
- [ ] **4.3 Module Expansion Guide:** Write `RBAC_MODULE_GUIDE.md` explaining how to add new modules.
- [ ] **4.4 Final Validation:** Perform a complete audit to ensure no hardcoded permissions remain.
