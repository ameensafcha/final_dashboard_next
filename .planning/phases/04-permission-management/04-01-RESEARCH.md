# Phase 4: Permission Management - Research

**Phase:** 04-permission-management
**Goal:** Admin can view all available permissions stored in database

## Domain Analysis

### Current State
- Permissions stored in `role_permissions` table via Prisma
- Hardcoded `AVAILABLE_PERMISSIONS` array in roles page
- POST endpoint exists at `/api/roles/permissions` to toggle permissions
- No GET endpoint to list all available permissions

### Requirements
- **PERM-01:** Admin can view all available permissions
- **PERM-04:** Permissions are stored in database (role_permissions table)

## Implementation Approach

### Option 1: Add GET endpoint to roles/permissions
Add a GET endpoint to fetch all unique permissions from role_permissions table.

**Pros:**
- Simple, minimal changes
- Reuses existing POST endpoint structure
- DB-driven as required

**Cons:**
- Returns all role-permission combos, needs deduplication

### Option 2: Create separate permissions table
Create a dedicated `permissions` table for master permission list.

**Pros:**
- Clean separation of concerns
- Easier to manage permissions

**Cons:**
- Schema change (Prisma)
- More complex

## Recommendation

Option 1: Add GET endpoint to existing `/api/roles/permissions` route. Minor modification to handle GET requests.

## Tasks
1. Add GET method to `/api/roles/permissions/route.ts`
2. Return deduplicated list of permissions
3. Update UI to fetch from API instead of hardcoded array

## Files to Modify
- `src/app/api/roles/permissions/route.ts` — Add GET handler
- `src/app/admin/roles/page.tsx` — Use API instead of hardcoded

---

*Research: 04-permission-management*
*Date: 2025-04-11*