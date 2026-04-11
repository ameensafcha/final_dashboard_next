# Features Research - ERP RBAC System

**Researched:** 2025-04-11

## Table Stakes (Must Have)

- User login with email/password via Supabase Auth
- Session persistence across browser refresh
- Role-based routing (different pages for different roles)
- Admin can create/edit/delete roles
- Admin can assign permissions to roles
- Sidebar shows items only for user's permissions

## Differentiators (Competitive Edge)

- Permission matrix UI for easy role-permission management
- Real-time permission changes without re-login
- Permission inheritance (optional)

## Anti-Features

- Hardcoded permissions - all must be DB-driven
- Role-only approach without granular permissions

---
*Features research complete*