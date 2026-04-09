# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Next.js App Router with Server Components and Client Components

**Key Characteristics:**
- Server-first architecture using Next.js 16 with React 19
- Role-Based Access Control (RBAC) at multiple levels: middleware, API routes, and server components
- Hybrid authentication approach using Supabase for auth and Prisma for user metadata
- Separation of concerns: auth logic in dedicated lib files, UI in components, data access through API routes
- Client-side state management with Zustand and React Context (auth state)
- Server-side database queries with Prisma ORM via PostgreSQL
- Type-safe API routes with NextResponse handling

## Layers

**Authentication & Authorization Layer:**
- Purpose: Manage user identity and access control
- Location: `src/lib/auth-helper.ts`, `src/lib/auth-rbac.ts`, `src/lib/permissions.ts`
- Contains: Auth utilities, role checking, permission definitions, RBAC logic
- Depends on: Supabase client, Prisma, Next.js server utilities
- Used by: Middleware, API routes, server components, client context

**Data Access Layer:**
- Purpose: Manage all database interactions
- Location: `src/app/api/` (route handlers)
- Contains: RESTful API endpoints, data queries, mutations
- Depends on: Prisma ORM, auth-helper for authorization checks
- Used by: Client pages and components via fetch, server components via direct Prisma calls

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/app/` (page components), `src/components/` (reusable components)
- Contains: Server pages, client components, UI components (shadcn/ui)
- Depends on: API routes (client components), auth context, React Query
- Used by: Next.js router as entry points

**Middleware Layer:**
- Purpose: Handle HTTP-level routing and basic auth checks
- Location: `src/middleware.ts`
- Contains: Route protection, session validation, cookie management
- Depends on: Supabase SSR client
- Used by: Next.js request pipeline for all routes

**State Management Layer:**
- Purpose: Manage client-side state
- Location: `src/contexts/auth-context.tsx`, `src/lib/stores/` (Zustand)
- Contains: Auth state, UI state (sidebar toggle)
- Depends on: Supabase client, API routes, React hooks
- Used by: Client components via context hooks

## Data Flow

**Authentication Flow:**

1. User submits login form (`src/app/login/page.tsx` - client component)
2. Login function calls Supabase auth (`src/contexts/auth-context.tsx`)
3. Supabase validates credentials and returns session token
4. Session token stored in cookies by Supabase SDK
5. Client fetches employee data from `/api/auth/employee` to get role
6. Auth context updates with user role and employee data
7. Middleware validates session on subsequent requests
8. Protected routes check role before rendering

**Authorization Flow (API Route Example):**

1. Client component/page calls API endpoint
2. API route handler executes (e.g., `src/app/api/tasks/route.ts`)
3. `getCurrentUser()` validates session and fetches employee + role from database
4. Role hierarchy checked: viewer < employee < admin
5. If `requireRole()` or `requirePermission()` called, returns 401/403 if unauthorized
6. Query filtered by role (e.g., non-admins see only assigned/created tasks)
7. Response serialized and returned to client

**Server Component Flow:**

1. Server page component (e.g., `src/app/dashboard/page.tsx`) calls `getCurrentUser()`
2. User validation redirects to login if not authenticated
3. Direct Prisma queries execute on server (no API call overhead)
4. Data serialized for client component consumption
5. Server component renders with data, passes to client component
6. Client component handles interactivity and UI state

**State Management:**

- **Auth State:** Managed by React Context (`src/contexts/auth-context.tsx`). Synced from Supabase auth state on mount, fetches employee/role from database.
- **UI State:** Managed by Zustand store (`src/lib/stores/ui.ts`). Sidebar toggle, notifications.
- **Server State:** Managed through API endpoints, React Query for caching (TanStack Query v5).
- **Database State:** Single source of truth is PostgreSQL via Prisma. Employees table links to roles table.

## Key Abstractions

**AuthUser:**
- Purpose: Represents authenticated user with role information
- Examples: `src/lib/auth-helper.ts` (interface definition)
- Pattern: Returned by `getCurrentUser()`, used across API routes and server components
- Properties: `id`, `email`, `role`, `isAdmin`

**Role Hierarchy:**
- Purpose: Define access levels across the application
- Examples: `src/lib/permissions.ts`, `src/lib/auth-helper.ts` (ROLE_HIERARCHY constant)
- Pattern: `['viewer', 'employee', 'admin']` - lower index = fewer permissions
- Usage: Index-based comparison for permission checks

**Permission Mapping:**
- Purpose: Define what each role can do
- Examples: `src/lib/permissions.ts` (RolePermissions constant)
- Pattern: `Record<roleName, Permission[]>` - each role lists allowed actions
- Permissions: `view:dashboard`, `edit:admin`, `view:settings`, etc.

**Route Protection:**
- Purpose: Enforce role requirements at route level
- Examples: `src/lib/auth-rbac.ts` (DEFAULT_ROUTE_PERMISSIONS, checkRoutePermission)
- Pattern: Hybrid storage - code defaults can be overridden by database
- Protected routes: `/settings`, `/admin`, `/employees` require admin role

**SupabaseServerClient:**
- Purpose: Create secure Supabase client in server context
- Examples: `src/lib/auth-helper.ts` (createSupabaseServerClient)
- Pattern: Uses Next.js cookies() API to manage session tokens
- Encapsulates cookie management details

**Prisma Client:**
- Purpose: Type-safe database access
- Examples: `src/lib/prisma.ts` (singleton export)
- Pattern: Singleton instance shared across application
- Usage: Direct queries in server components, API routes, and auth helpers

## Entry Points

**Authentication Page:**
- Location: `src/app/login/page.tsx`
- Triggers: User visits `/login` when unauthenticated, or manually navigates
- Responsibilities: Render login form, call auth context login function, redirect to dashboard on success

**Dashboard Page:**
- Location: `src/app/dashboard/page.tsx`
- Triggers: Middleware routes authenticated users here by default
- Responsibilities: Fetch tasks, calculate KPIs, filter by role, pass data to client component

**Admin Pages:**
- Location: `src/app/admin/page.tsx`, `src/app/admin/employees/page.tsx`, etc.
- Triggers: Admin users navigate or middleware routes here
- Responsibilities: Render admin UI, enforce admin-only access via client-side role check

**API Auth Endpoint:**
- Location: `src/app/api/auth/employee/route.ts`
- Triggers: Auth context fetches on mount or after login
- Responsibilities: Return current user employee data with role

**Generic API Routes:**
- Location: `src/app/api/[resource]/route.ts` (tasks, employees, batches, etc.)
- Triggers: Client components and pages fetch data
- Responsibilities: Authorize request, filter data by role, execute queries, return JSON

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: On every HTTP request
- Responsibilities: Check session validity, redirect unauthenticated users to login, block protected routes without session

## Error Handling

**Strategy:** Multi-level error handling with fallbacks

**Patterns:**

- **Middleware:** If session check fails, redirect to login with `?error=unauthorized` query param
- **API Routes:** Return `NextResponse.json({ error: string }, { status: 401|403|404|500 })`
- **Server Components:** Call `redirect("/login")` from `require*` helpers if auth fails
- **Client Components:** Wrap in try-catch, set error state, display to user via toast or error message
- **Auth Context:** Catch promise rejections, set `authError` state, log to console
- **Prisma:** Wrapped in try-catch in auth-rbac.ts - falls back to code defaults if DB fails

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.log()` and `console.error()` with prefixes like `[Auth]`, `[API /route]`, `[Dashboard]`
- Used in: Auth context, API routes, server components
- Purpose: Debug auth flow, track errors, identify performance issues

**Validation:**
- Approach: Prisma schema enforces database constraints; auth helpers validate user state
- Used in: `getCurrentUser()` checks `is_active` flag; API routes verify user exists
- Pattern: Validate early in function, return error response if validation fails

**Authentication:**
- Approach: Multi-step - Supabase JWT in cookies, Prisma lookup for role and is_active status
- Used in: Middleware (basic), API routes (with role check), server components (with redirect)
- Pattern: `getCurrentUser()` combines both sources into single AuthUser object

**Authorization (RBAC):**
- Approach: Role hierarchy checked via index comparison; permissions mapped to roles
- Used in: API routes (requireRole, requirePermission), server components (requireAdmin)
- Pattern: Check against ROLE_HIERARCHY array or RolePermissions record

**Session Management:**
- Approach: Supabase SSR manages session via cookies; token automatically refreshed
- Used in: Middleware, auth context, API routes
- Pattern: Call `supabase.auth.getUser()` to get current session; returns null if expired
