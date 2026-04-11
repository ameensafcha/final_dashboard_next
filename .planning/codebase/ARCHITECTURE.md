# ARCHITECTURE - System Design

## Architectural Pattern

**Next.js App Router** with Server Components default.

### Layer Structure

```
┌─────────────────────────────────────────┐
│  Pages (src/app/*/page.tsx)             │
│  - Server components by default          │
│  - 'use client' only when needed        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Components (src/components/*)         │
│  - UI components (shadcn)              │
│  - Feature-specific components         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  API Routes (src/app/api/*/route.ts)    │
│  - GET/POST/PUT/DELETE handlers        │
│  - Permission guards via auth-helper   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Lib (src/lib/*)                        │
│  - prisma.ts - Database client         │
│  - auth-helper.ts - Auth utilities     │
│  - supabase.ts - Supabase client       │
│  - stores/ - Zustand state management  │
└─────────────────────────────────────────┘
```

## Data Flow

### Client → Server
1. User interaction triggers React Query mutation
2. API route receives request
3. `requirePermissionApi()` checks auth + permissions
4. Prisma queries database
5. Response returned to client

### Authentication Flow
1. Supabase Auth manages sessions (cookies)
2. `getCurrentUser()` server helper joins:
   - Supabase user → Employee record (by id)
   - Employee → Role → Permissions
3. Middleware handles route protection
4. Client-side `auth-context.tsx` provides useAuth hook

## Key Entry Points

| Entry Point | Purpose |
|-------------|---------|
| `src/app/page.tsx` | Root redirect to /login or /dashboard |
| `src/middleware.ts` | Edge auth check, redirects |
| `src/app/api/auth/sync/route.ts` | Sync Supabase user to DB |
| `src/contexts/auth-context.tsx` | Client auth state |

## Permission Model

- **Admin**: Role name = "admin" OR email matches `SUPER_ADMIN_EMAIL`
- **Permissions**: Stored in `role_permissions` table (DB-driven)
- **Sidebar**: Filters menu items based on permissions via `PERMISSION_MAP`

---

*Architecture documented: 2026-04-11*