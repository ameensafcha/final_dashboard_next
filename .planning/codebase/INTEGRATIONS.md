# External Integrations

**Analysis Date:** 2026-04-11

## APIs & External Services

**Authentication & Identity:**
- Supabase Auth - User authentication
  - Implementation: `@supabase/ssr` for server components/middleware, `@supabase/supabase-js` for client
  - Auth flow: Email/password via Supabase Auth, session via cookies
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Data Storage

**PostgreSQL Database:**
- PostgreSQL with Prisma ORM
  - Connection: `DATABASE_URL` environment variable
  - Adapter: `@prisma/adapter-pg` with `pg` driver
  - Client: `@prisma/client` - Single instance via `@/lib/prisma` (singletoned in dev)
  - Schema: `prisma/schema.prisma`

**Key Tables:**
- `employees` - Linked to Supabase auth users (id field matches auth user id)
- `roles` - Role definitions (admin, employee, viewer)
- `role_permissions` - Role-to-permission mappings
- `transactions`, `batches`, `tasks` - Business data models

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - User records: Stored in Supabase, linked via `employees` table
  - Password: Handled by Supabase Auth (not stored locally)
  - Session: Managed via cookies (httponly, secure)

**Permission Model:**
- Database-driven permissions via `role_permissions` table
- Roles stored in `roles` table
- Employees linked to roles via `role_id` foreign key

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Bugsnag, etc.)

**Logs:**
- Console logging via Node.js

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured (self-hosted Next.js)

**CI Pipeline:**
- None detected (local development focus)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (secret, admin-only)
- `DATABASE_URL` - PostgreSQL connection string

**Optional env vars:**
- `SUPER_ADMIN_EMAIL` - Email for super admin bypass

**Secrets location:**
- `.env` file (NOT committed to version control)

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook endpoints for external services)

**Outgoing:**
- None detected

---

*Integration audit: 2026-04-11*