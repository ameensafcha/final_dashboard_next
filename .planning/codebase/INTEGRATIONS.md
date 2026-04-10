# External Integrations

**Analysis Date:** 2026-04-10

## APIs & External Services

**Authentication & User Management:**
- Supabase Auth - User authentication
  - SDK: `@supabase/supabase-js`, `@supabase/ssr`
  - Integration: `src/lib/supabase.ts`, `src/lib/auth-helper.ts`, `src/middleware.ts`

**Real-time:**
- Supabase Realtime - Database change notifications
  - Tables: notifications, tasks, task_comments
  - Implementation: `src/hooks/use-realtime-subscription.ts`

## Data Storage

**PostgreSQL:**
- Connection: `process.env.DATABASE_URL`
- ORM: Prisma with `@prisma/adapter-pg`
- Schema: `prisma/schema.prisma`
- Tables: employees, roles, tasks, batches, raw_materials, products, variants, flavors, notifications, etc.

## Authentication & Identity

**RBAC (Role-Based Access Control):**
- Custom implementation via Prisma
- Roles: viewer < employee < admin
- Enforcement: `src/lib/auth-rbac.ts`, `src/lib/permissions.ts`, `src/lib/auth-helper.ts`
- Middleware: `src/middleware.ts` (basic auth check)

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-side)
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection for Prisma

---

*Integration audit: 2026-04-10*