# Roadmap: RBAC Rebuild (Database-Driven)

## Phase 1: Database & API Core (Foundations)
**Plans:** 3/3 plans executed
- [x] 01-01-PLAN.md — Schema Refinement & Migration
- [x] 01-02-PLAN.md — Seeding & Core RBAC Utility
- [x] 01-03-PLAN.md — Foundation API Endpoints

- [x] **1.1 Schema Update:** Refine `prisma/schema.prisma` with `Role`, `Permission`, and `RolePermission` models.
- [x] **1.2 Migration:** Run Prisma migrations to update the database.
- [x] **1.3 Seed Data:** Create a seed script to populate initial roles and permissions.
- [x] **1.4 Permission Utility:** Implement server-side `checkPermission` with caching.
- [x] **1.5 API Endpoints:** Create CRUD APIs for roles and permissions.

## Phase 2: Permission Management UI (The Matrix)
**Plans:** 3 plans
- [ ] 02-01-PLAN.md — Role Management (RSC + Vanilla CSS)
- [ ] 02-02-PLAN.md — Permission Matrix Grid
- [ ] 02-03-PLAN.md — User Assignment & Final Polish

- [ ] **2.1 Role Management:** Build a simple UI to list, add, and edit roles using RSC and Vanilla CSS.
- [ ] **2.2 Permission Matrix:** Implement the core Matrix UI for toggling permissions across roles grouped by resource.
- [ ] **2.3 Real-time Feedback:** Ensure permission changes trigger cache revalidation and update the UI immediately via optimistic updates.
- [ ] **2.4 User Role Assignment:** Update user/employee management UI to assign roles from the database using Vanilla CSS.

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
