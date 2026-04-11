# Roadmap: ERP System

## Phase 1: Folder & Routing Restructure

**Goal:** Restructure folder hierarchy and fix routing to match new structure.

**Requirements:**
- [ ] FOLD-01: Move raw-materials, stocks, receiving to inventory/ folder
- [ ] FOLD-02: Move production to production/batches and production/finished-products
- [ ] FOLD-03: Update sidebar navigation with new routes
- [ ] FOLD-04: Fix broken links across all pages
- [ ] FOLD-05: Update API references if needed

**Success Criteria:**
1. All pages accessible at new routes
2. Sidebar navigation works correctly
3. No broken links in the application
4. Build passes without errors

**Status:** ✓ Complete

---

## Phase 2: Authentication Refactoring

**Goal:** Refactor Supabase Auth integration with database-driven roles and permissions.

**Requirements:**
- [x] AUTH-01: Dynamic sidebar based on user permissions
- [x] AUTH-02: Role-based route protection
- [x] AUTH-03: Permission guards for API endpoints

**Status:** ✓ Complete

**Plans:**
- [x] 02-01-PLAN.md — Role-based route protection and API permission guards
- [x] 02-02-PLAN.md — Dynamic sidebar based on user permissions