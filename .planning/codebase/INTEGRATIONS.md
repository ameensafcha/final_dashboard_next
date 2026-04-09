# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Authentication & User Management:**
- Supabase Auth - User authentication service
  - SDK/Client: `@supabase/supabase-js`, `@supabase/ssr`
  - Auth methods: Email/password, session-based
  - Integration points: `src/lib/supabase.ts`, `src/lib/auth-helper.ts`, `src/middleware.ts`

## Data Storage

**Databases:**
- PostgreSQL
  - Connection: `process.env.DATABASE_URL`
  - Client: Prisma ORM with `@prisma/adapter-pg`
  - Schema: `prisma/schema.prisma`
  - Tables: employees, roles, tasks, batches, raw_materials, products, variants, flavors, inventory, packing, transactions, and more

**File Storage:**
- Local filesystem only (no cloud storage integration detected)

**Caching:**
- React Query (`@tanstack/react-query`) - Client-side server state caching
- Zustand - Client-side state persistence
- No Redis or external caching layer detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Firebase alternative)
  - Implementation: Server-side and client-side verification
  - Session management: Cookies (handled by @supabase/ssr)
  - User lookup: Cross-references Supabase auth with Prisma employees table for RBAC

**RBAC (Role-Based Access Control):**
- Custom implementation via Prisma models
  - Roles table: `employees.role_id` → `roles.id`
  - Role hierarchy: viewer < employee < admin
  - Permission enforcement in: `src/lib/auth-rbac.ts`, `src/lib/permissions.ts`
  - Middleware protection: `src/middleware.ts` (basic auth check)
  - API route protection: `src/lib/auth-helper.ts` (requireRole, requirePermission)

## Monitoring & Observability

**Error Tracking:**
- None detected (console.log for debugging only)

**Logs:**
- console.log throughout API routes for development debugging
- No centralized logging service (Sentry, DataDog, etc.)

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured, but Next.js supports:
  - Vercel (recommended)
  - AWS, GCP, Azure, or self-hosted Node.js servers

**CI Pipeline:**
- None detected (no GitHub Actions, GitLab CI, etc.)

**Build Process:**
- Next.js `next build` command
- Turbopack bundler enabled

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project endpoint (public, exposed to client)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (server-side only, secret)
- `DATABASE_URL` - PostgreSQL connection string with pooling
- `DIRECT_URL` - Direct PostgreSQL connection for Prisma migrations

**Secrets location:**
- `.env` file (local development)
- Environment variables configured in deployment platform

## API Routes & Data Flow

**Internal API Routes:**
All routes in `src/app/api/` follow Next.js conventions:

**Authentication:**
- `GET /api/auth/employee` - Get current user employee data
- `POST /api/auth/logout` - Logout endpoint
- `GET /api/auth/role` - Get current user role/permissions
- `POST /api/auth/sync` - Sync Supabase user with Prisma employees table

**Business Domain:**
- `GET/POST /api/batches` - Batch management (powder processing)
- `GET/POST /api/products` - Product catalog
- `GET/POST /api/flavors` - Flavor management
- `GET/POST /api/employees` - Employee management (requires auth)
- `GET/POST /api/raw-materials` - Raw material inventory
- `GET/POST /api/stocks` - Stock tracking
- `GET/POST /api/tasks` - Task/todo management
  - `POST/GET /api/tasks/[id]/comments` - Task comments
  - `POST/GET /api/tasks/[id]/subtasks` - Task subtasks
  - `POST/GET /api/tasks/[id]/time-logs` - Time tracking

**Settings & Configuration:**
- `GET/POST /api/settings` - App settings
- `GET/POST /api/roles` - Role management
- `POST /api/init-stocks` - Initialize stock system

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (no external service notifications)

## Client-Side Integration Patterns

**State Management:**
- React Query handles server state synchronization
- Zustand stores in `src/lib/stores/` for UI state
- Cookies for authentication session (via @supabase/ssr)

**Authentication Flow:**
1. Middleware checks Supabase session on every request
2. `getCurrentUser()` validates Supabase auth + Prisma employee record
3. Role/permission checks in API routes return 401/403 as needed
4. Server components can `requireAuth()` or `requireAdmin()`
5. Client components use React Query with auth error handling

## Data Relationships

**Key Integrations:**
- Supabase Auth ↔ Prisma `employees` table (by user ID)
- Roles ↔ Permissions system (custom implementation)
- React Query ↔ API routes (polling/caching)
- PostgreSQL ↔ Prisma client (transactions for batch operations)

**Transaction Safety:**
- Batch operations use Prisma `$transaction()` for ACID guarantees
- Raw material stock deductions are atomic with batch creation
- Powder stock updates synchronized with batch status changes

---

*Integration audit: 2026-04-09*
