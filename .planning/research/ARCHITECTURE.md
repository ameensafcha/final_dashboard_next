# Architecture Research - ERP Auth System

**Researched:** 2025-04-11

## Current Architecture

```
┌─────────────────────────────────────┐
│         Supabase Auth               │
│    (Email/Password Login)           │
└──────────────┬──────────────────────┘
               │ user.id
               ▼
┌─────────────────────────────────────┐
│      Next.js Middleware             │
│   (Auth check, redirect)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│    getCurrentUser (auth-helper)     │
│    - Fetch Supabase user            │
│    - Get employee from DB           │
│    - Return user + role             │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌──────────────┐    ┌──────────────┐
│ API Routes   │    │   Sidebar    │
│ Permission   │    │ Dynamic      │
│ Check        │    │ Menu Items   │
└──────────────┘    └──────────────┘
```

## Desired Architecture

Keep Supabase Auth as-is. Redesign:
1. **Remove** hardcoded role checks in auth-helper.ts
2. **Simplify** auth-rbac.ts - use only for permission helpers
3. **Enhance** permissions.ts - DB-driven permission fetching
4. **Update** sidebar - dynamic menu based on permissions from DB

## Build Order

1. Clean up existing auth files (remove hardcoded logic)
2. Enhance permission system to fetch from DB
3. Create admin panel pages for role/permission management
4. Update sidebar to use dynamic permissions

---
*Architecture research complete*