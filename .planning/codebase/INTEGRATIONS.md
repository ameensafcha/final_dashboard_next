# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Authentication & Identity:**
- Supabase Auth - User authentication
  - Browser client: `@supabase/ssr` (createBrowserClient)
  - Server client: `@supabase/ssr` (createServerClient) for API routes
  - Admin client: `@supabase/supabase-js` (createClient) with service role key for privileged operations
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Implementation: Custom auth helpers in `src/lib/auth-helper.ts` and `src/lib/supabase.ts`

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `DATABASE_URL` (primary), `DIRECT_URL` (Prisma config)
  - Client: Prisma with `@prisma/adapter-pg` adapter
  - Location: `src/lib/prisma.ts`

**File Storage:**
- Not applicable - No external file storage detected

**Caching:**
- Not applicable - No external caching service

## Authentication & Identity

**Auth Provider:**
- Supabase (custom implementation)
  - Approach: Supabase Auth for authentication, synced with local `employees` table in PostgreSQL
  - User sync endpoint: `src/app/api/auth/sync/route.ts`
  - Login page: `src/app/login/page.tsx`
  - Auth middleware: `src/middleware.ts`
  - Session management via cookies (SSR), Supabase SSR package handles cookie operations

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service integrated

**Logs:**
- Console logging only (console.error in auth-helper.ts)

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase

**CI Pipeline:**
- Not detected in codebase

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin operations)
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Prisma direct database URL (for migrations)

**Secrets location:**
- `.env` file (not read - contains secrets)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

---

*Integration audit: 2026-04-09*