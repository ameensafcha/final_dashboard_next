# Architecture

**Analysis Date:** 2026-04-11

## Pattern Overview

**Overall:** Next.js App Router with Server-Side Auth + Client-Side State

**Key Characteristics:**
- Supabase Auth as single source of truth for user identity
- Database-driven roles and permissions via Prisma ORM
- Server Components for data fetching, Client Components for interactivity
- Middleware for route protection and auth redirects
- Zustand for client UI state, TanStack React Query for server state

## Layers

**Presentation Layer (Client):**
- Purpose: UI components, user interactions
- Location: `src/components/`, `src/app/**/page.tsx`
- Contains: React components, shadcn/ui primitives
- Depends on: Auth context, Zustand stores
- Used by: Browser

**Data Access Layer (Server):**
- Purpose: API routes, database operations, auth validation
- Location: `src/app/api/*/route.ts`, `src/lib/auth-helper.ts`
- Contains: Route handlers, Prisma queries, auth guards
- Depends on: Prisma client, Supabase client
- Used by: Client components via fetch

**Persistence Layer:**
- Purpose: Database schema and ORM
- Location: `src/prisma/schema.prisma`, `src/lib/prisma.ts`
- Contains: Prisma models, client singleton
- Depends on: PostgreSQL via adapter
- Used by: API routes

**Authentication Layer:**
- Purpose: Auth state management and protection
- Location: `src/contexts/auth-context.tsx`, `src/middleware.ts`, `src/lib/auth-helper.ts`
- Contains: Auth context provider, middleware guard, server helpers
- Depends on: Supabase Auth, employee table
- Used by: All protected routes

## Data Flow

**User Login Flow:**

1. User submits credentials on `/login` page
2. Client calls `supabase.auth.signInWithPassword()`
3. Supabase Auth returns session with user ID
4. Middleware extracts session, attaches to requests
5. Client fetches `/api/auth/employee` for employee profile
6. Client fetches `/api/users/permissions` for permissions
7. Sidebar renders based on permissions

**API Request Flow:**

1. Client makes fetch to `/api/...`
2. Middleware validates auth (if not auth endpoint)
3. API route calls `getCurrentUser()` from `auth-helper`
4. Auth helper fetches Supabase user, maps to employee
5. Returns employee with role and permissions
6. API route optionally calls `requirePermissionApi()` or `requireAdminApi()`
7. Prisma executes query
8. Response returned to client

**State Management:**
- Server state: TanStack React Query via `QueryClientProvider`
- Client state: Zustand stores (`useUIStore`, `useNotificationStore`)
- Auth state: React Context (`AuthProvider`)
- Permissions: Fetched on mount, stored in context

## Key Abstractions

**Auth Helper (`src/lib/auth-helper.ts`):**
- Purpose: Centralize server-side auth logic
- Exports: `getCurrentUser()`, `requirePermissionApi()`, `requireAdminApi()`, `verifyApiAuth()`, `getTaskFilterByRole()`
- Pattern: Cached async functions returning user object with permissions

**Auth Context (`src/contexts/auth-context.tsx`):**
- Purpose: Client-side auth state and actions
- Provides: `user`, `employee`, `role`, `isAdmin`, `permissions`, `login()`, `logout()`
- Pattern: React Context + Browser client for Supabase

**Middleware (`src/middleware.ts`):**
- Purpose: Route protection at edge
- Logic: Redirect to `/login` if no session, return 401 for unauthorized API calls
- Pattern: Next.js middleware with Supabase SSR client

**Prisma Client (`src/lib/prisma.ts`):**
- Purpose: Single database client instance
- Pattern: Global singleton with adapter for PostgreSQL

## Entry Points

**Root Layout (`src/app/layout.tsx`):**
- Location: `src/app/layout.tsx`
- Triggers: Every page load
- Responsibilities: Wraps app with Providers (QueryClient, Auth), Sidebar, Toast, GlobalAuthWrapper

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every HTTP request
- Responsibilities: Session validation, route redirection

**API Routes:**
- Location: `src/app/api/*/route.ts`
- Triggers: Client fetch calls
- Responsibilities: CRUD operations, auth validation, data transformation

**Sidebar:**
- Location: `src/components/app-sidebar.tsx`
- Triggers: User login state change
- Responsibilities: Navigation menu, collapsible sections, user info, logout

## Error Handling

**Strategy:** Try-catch with HTTP status codes

**Patterns:**
- API routes return `NextResponse.json({ error }, { status })` for errors
- Auth helpers return early with `authResponse()` helper
- Client catches errors and displays via Toast notifications
- Middleware returns 401 JSON for unauthorized API calls

## Cross-Cutting Concerns

**Logging:** Console logging in API routes only (e.g., `console.error('API_ERROR:', error)`)

**Validation:** Manual validation in API routes (checking `!id`, `!user`, etc.)

**Authentication:** 
- Middleware level: Redirect/401 for unauthenticated
- API level: `getCurrentUser()` + permission guards
- Component level: `GlobalAuthWrapper` client component for protected content

---

*Architecture analysis: 2026-04-11*