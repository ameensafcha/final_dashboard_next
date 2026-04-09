# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Next.js App Router with Server Components and API routes

**Key Characteristics:**
- Server-first architecture: Pages render on server by default, client components only where needed
- API routes handle all data mutations: RESTful endpoints in `src/app/api/*`
- Prisma ORM for database access with PostgreSQL
- Supabase for authentication (JWT-based with cookies)
- Layered state: TanStack React Query for server state, Zustand for UI state

## Layers

### 1. Presentation Layer (Pages & Components)
- **Location:** `src/app/` (pages), `src/components/`
- **Contains:** React components, pages, layouts
- **Depends on:** None (self-contained UI)
- **Used by:** Next.js routing layer

### 2. API Layer (Route Handlers)
- **Location:** `src/app/api/*/route.ts`
- **Contains:** HTTP request handlers (GET, POST, PUT, DELETE)
- **Depends on:** `src/lib/prisma`, `src/lib/auth-helper`
- **Used by:** Client components via React Query or fetch

### 3. Data Access Layer
- **Location:** `src/lib/prisma.ts`
- **Contains:** PrismaClient singleton with PostgreSQL adapter
- **Depends on:** Database connection
- **Used by:** API routes

### 4. Authentication Layer
- **Location:** `src/lib/auth-helper.ts`, `src/contexts/auth-context.tsx`, `src/middleware.ts`
- **Contains:** Auth utilities, Supabase client, auth middleware
- **Depends on:** Supabase credentials
- **Used by:** API routes, pages, components

### 5. State Management Layer
- **Location:** `src/lib/stores/`, `src/contexts/`
- **Contains:** Zustand stores, React contexts
- **Depends on:** React
- **Used by:** Client components

## Data Flow

**Read Path (Data Fetching):**
1. Client component calls React Query or fetch to API route
2. API route calls `getCurrentUser()` to validate auth
3. API route queries Prisma for data
4. API route returns JSON response
5. Client receives data and renders

**Write Path (Data Mutation):**
1. Client component submits form/data to API route
2. API route validates input, checks auth via `getCurrentUser()`
3. API route mutates data via Prisma
4. API route returns success/error response
5. Client invalidates React Query cache and shows toast

**Auth Flow:**
1. User enters credentials on `/login`
2. `AuthContext.login()` calls Supabase `signInWithPassword`
3. Supabase returns session with JWT
4. Middleware creates cookies from JWT
5. API routes read cookies to get user via `getCurrentUser()`

## Key Abstractions

### Prisma Client Singleton
- **Purpose:** Single database connection instance
- **Examples:** `src/lib/prisma.ts`
- **Pattern:** Global singleton with hot-reload compatibility

### Auth Helper Functions
- **Purpose:** Centralized auth validation for API routes
- **Examples:** `getCurrentUser()`, `requireAuth()`, `requireAdmin()`, `authResponse()`
- **Pattern:** Returns user object or null; API routes use `authResponse()` for 401

### Zustand UI Store
- **Purpose:** Client-side UI state (sidebar, modals, theme, notifications)
- **Examples:** `src/lib/stores/ui.ts`
- **Pattern:** Create store with `create<StoreType>()`

### React Query Provider
- **Purpose:** Server state caching and synchronization
- **Examples:** Configured in `src/components/providers.tsx`
- **Pattern:** Wrap app in `QueryClientProvider`

### Auth Context
- **Purpose:** Client auth state (user, session, employee, role)
- **Examples:** `src/contexts/auth-context.tsx`
- **Pattern:** React context with provider component

## Entry Points

### Root Layout
- **Location:** `src/app/layout.tsx`
- **Triggers:** Every page request
- **Responsibilities:** HTML shell, font loading, providers, sidebar, toast container

### Middleware
- **Location:** `src/middleware.ts`
- **Triggers:** Every request (except static files)
- **Responsibilities:** Auth cookie handling, redirect unauthenticated users to `/login`

### API Routes
- **Location:** `src/app/api/*/route.ts`
- **Triggers:** HTTP requests to `/api/*`
- **Responsibilities:** Auth validation, input validation, data operations, responses

### Login Page
- **Location:** `src/app/login/page.tsx`
- **Triggers:** User navigation or redirect from middleware
- **Responsibilities:** Display login form, call AuthContext.login()

### Dashboard
- **Location:** `src/app/dashboard/page.tsx`
- **Triggers:** User navigation after login
- **Responsibilities:** Display KPIs, task list, navigation to other modules

## Error Handling

**Strategy:** Try-catch in API routes, return JSON errors with status codes

**Patterns:**
- 400: Bad request (validation errors)
- 401: Unauthorized (no valid session)
- 404: Not found (resource doesn't exist)
- 500: Server error (catch-all)

```typescript
// API route pattern
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");
    // ... logic
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

## Cross-Cutting Concerns

**Logging:** Console.log for debug, no structured logging
**Validation:** Manual input validation in API routes, no schema validation library
**Authentication:** Supabase JWT with cookie-based session, middleware + auth-helper pattern
**Authorization:** Role-based via `isAdmin` flag from employee.role

---

*Architecture analysis: 2026-04-09*