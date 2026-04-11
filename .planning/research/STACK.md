# Stack Research

**Domain:** ERP Authentication & RBAC
**Researched:** 2025-04-11
**Confidence:** HIGH

## Existing Stack

| Technology | Status | Notes |
|------------|--------|-------|
| Supabase Auth | Active | User authentication via email/password |
| PostgreSQL + Prisma | Active | ORM with roles, permissions tables already exist |
| Next.js Middleware | Active | Basic auth redirect, needs redesign |

## Current Schema Analysis

The database already has:
- `roles` table - stores role definitions (admin, employee, viewer)
- `role_permissions` junction table - links roles to permissions
- `employees` table - linked to Supabase auth users via id field

## Recommended Approach

Use Supabase Auth as the single source of truth. Permission checks should:
1. Get user from Supabase
2. Fetch employee's role from database
3. Fetch role's permissions from role_permissions table
4. Check permission before allowing access

## Key Findings

- Admin can be identified via role name (not hardcoded check)
- Permissions should be stored in DB, not hardcoded
- Sidebar should dynamically render based on user's actual permissions

---
*Stack research complete*