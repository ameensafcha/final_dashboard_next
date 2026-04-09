# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Authentication & Identity:**
- **Supabase** - User authentication and session management
  - SDK: `@supabase/supabase-js` v2.101.1
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Implementation: Browser client (`src/lib/supabase.ts`), Server client (cookie-based), Admin client (service role)
  - Environment: `SUPABASE_SERVICE_ROLE_KEY` for privileged operations

## Data Storage

**Database:**
- **PostgreSQL** - Primary relational database
  - Connection: `DATABASE_URL` (Prisma with pg driver)
  - Client: Prisma 7.6.0 with `@prisma/adapter-pg`
  - ORM: Prisma schema at `prisma/schema.prisma` with 17 models

**File Storage:**
- None detected - application uses database for all persistence

**Caching:**
- None detected - relies on React Query for request deduplication

## Authentication & Identity

**Auth Provider:**
- **Supabase Auth** - Custom implementation
  - Users authenticated via Supabase (email/password)
  - Employee records linked to Supabase user IDs in `employees` table
  - Role-based access via `roles` table with admin/employee roles
  - Session handling: Supabase SSR cookies
  - Implementation: `src/lib/auth-helper.ts` with `getCurrentUser()`, `requireAuth()`, `requireAdmin()`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, LogRocket, etc.)

**Logs:**
- Console logging via `console.log/error` (not structured)

## CI/CD & Deployment

**Hosting:**
- Not explicitly defined in codebase
- Compatible with Vercel (Next.js native support)

**CI Pipeline:**
- None detected in codebase (no GitHub Actions, etc.)

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations (secret)
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database URL for Prisma (used in `prisma.config.ts`)

**Secrets location:**
- `.env` file (gitignored, contains sensitive credentials)

## Webhooks & Callbacks

**Incoming:**
- None detected - no webhook endpoints for external services

**Outgoing:**
- None detected - no outgoing webhooks configured

---

*Integration audit: 2026-04-09*