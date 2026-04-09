# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Next.js App Router with REST API and Prisma ORM

This is an inventory management system built on Next.js 16 App Router, using PostgreSQL as the primary database and Supabase for authentication. The architecture follows a layered pattern where API routes serve as the bridge between client components and the database.

**Key Characteristics:**
- Server Components by default (Server-Side Rendering for pages)
- Client Components only when interactivity is needed (`'use client'` directives)
- RESTful API routes using Next.js Route Handlers in `src/app/api/*/route.ts`
- Prisma ORM for database operations with PostgreSQL
- Supabase for authentication and session management
- Zustand for client-side UI state
- TanStack React Query available for server state (declared but not actively used)

## Layers

### 1. Presentation Layer (Pages & Components)
- **Location:** `src/app/*/page.tsx`, `src/components/*.tsx`
- Contains: React Server Components (pages) and Client Components
- Depends on: API Layer (via fetch/Server Actions)
- Used by: Next.js routing system

**Pages (Server Components):**
- `src/app/dashboard/page.tsx` - Dashboard with tasks KPIs
- `src/app/tasks/page.tsx`, `src/app/tasks/board/page.tsx` - Task management
- `src/app/production/page.tsx` - Production tracking
- `src/app/stocks/page.tsx` - Stock management
- `src/app/finance/page.tsx`, `src/app/finance/transactions/page.tsx` - Finance
- `src/app/admin/page.tsx`, `src/app/admin/employees/page.tsx` - Admin
- `src/app/login/page.tsx` - Authentication

**Components (Client Components):**
- `src/components/task-board.tsx` - Kanban board
- `src/components/task-detail.tsx` - Task detail view
- `src/components/task-form.tsx` - Task creation/editing
- `src/components/app-sidebar.tsx` - Navigation sidebar

### 2. API Layer (Route Handlers)
- **Location:** `src/app/api/*/route.ts`, `src/app/api/[resource]/[id]/*/route.ts`
- Contains: Next.js Route Handlers (GET, POST, PUT, DELETE)
- Depends on: Database Layer
- Used by: Presentation Layer (fetch calls)

**Examples:**
- `src/app/api/tasks/route.ts` - Tasks CRUD with filtering and search
- `src/app/api/products/route.ts` - Products CRUD
- `src/app/api/transactions/route.ts` - Financial transactions
- `src/app/api/batches/route.ts` - Production batches

### 3. Authentication Layer
- **Location:** `src/lib/auth-helper.ts`, `src/middleware.ts`
- Contains: Auth utilities, route protection, Supabase integration
- Depends on: Supabase service
- Used by: API Layer, Middleware

**Files:**
- `src/lib/auth-helper.ts` - Core auth utilities: `getCurrentUser()`, `requireAuth()`, `requireAdmin()`, `authResponse()`
- `src/middleware.ts` - Route protection via middleware
- `src/contexts/auth-context.tsx` - Auth context provider

### 4. Database Layer
- **Location:** `src/lib/prisma.ts`, `prisma/schema.prisma`
- Contains: Prisma client, database schema
- Depends on: PostgreSQL database
- Used by: API Layer

**Schema includes:**
- `employees`, `roles` - User management
- `products`, `product_variants`, `product_flavors` - Product catalog
- `raw_materials`, `receiving_materials` - Raw materials inventory
- `batches`, `finished_products`, `packing_logs` - Production tracking
- `transactions` - Financial records
- `tasks`, `subtasks`, `task_comments`, `task_time_logs` - Task management
- `variant_inventory`, `product_stock` - Stock tracking

### 5. State Management Layer
- **Location:** `src/lib/stores/ui.ts`
- Contains: Zustand stores for UI state
- Depends on: None
- Used by: Client Components

**Stores:**
- `useUIStore` - Sidebar state, modal state, theme, notifications

## Data Flow

**API Request Flow:**

1. Client Component calls API via `fetch('/api/resources')`
2. API Route Handler (`src/app/api/resources/route.ts`) receives request
3. Auth check via `getCurrentUser()` in `src/lib/auth-helper.ts`
4. Prisma query executed via `prisma.model.method()` in `src/lib/prisma.ts`
5. Database returns data (PostgreSQL)
6. API transforms response and returns JSON
7. Client receives and displays data

**Page Render Flow:**

1. Next.js routes to page component (`src/app/path/page.tsx`)
2. Page is Server Component - fetches data via Prisma directly
3. Calls `getCurrentUser()` for auth check
4. Prisma queries database
5. Passes data to Client Component (hydration)
6. Client Component renders UI

## Key Abstractions

### Auth Abstraction
- **Purpose:** Unified authentication and authorization
- **Examples:** `src/lib/auth-helper.ts`
- **Pattern:** Supabase auth + Prisma employee lookup

```typescript
// Pattern: Check auth, get user
const user = await getCurrentUser();
if (!user) return authResponse("Unauthorized");
```

### Database Abstraction
- **Purpose:** Single Prisma client instance
- **Examples:** `src/lib/prisma.ts`
- **Pattern:** Global singleton with connection pooling

### Notification Abstraction
- **Purpose:** Toast notifications for user feedback
- **Examples:** `src/lib/stores/ui.ts`
- **Pattern:** Zustand store with notification queue

### Supabase Client Abstraction
- **Purpose:** Unified Supabase client creation
- **Examples:** `src/lib/supabase.ts`
- **Pattern:** Browser/Server/Admin client factory

## Entry Points

### Root Entry
- **Location:** `src/app/layout.tsx`
- **Responsibilities:** Root layout, sidebar, providers, toast container
- **Triggers:** Any page request

### Auth Entry
- **Location:** `src/middleware.ts`
- **Responsibilities:** Protected route enforcement, session refresh
- **Triggers:** Every HTTP request

### API Entry
- **Location:** `src/app/api/*/route.ts`
- **Responsibilities:** REST API endpoints
- **Triggers:** fetch() calls from components

### Auth Login Entry
- **Location:** `src/app/login/page.tsx`
- **Responsibilities:** User authentication
- **Triggers:** Browser navigation to /login

## Error Handling

**Strategy:** Try-catch with appropriate HTTP status codes

**Patterns:**
- 400: Bad request (validation errors)
- 401: Unauthorized (auth check failures)
- 403: Forbidden (permission denied)
- 404: Not found
- 500: Server errors

```typescript
// API route pattern
export async function GET() {
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

**Authentication:** Supabase Auth with Prisma employee sync via `src/lib/auth-helper.ts`

**Authorization:** Role-based (admin vs employee) with middleware protection and API-level checks. Admin-only routes: `/admin/*`

**Logging:** Console logging for errors in API routes only

**Validation:** Basic field validation in API routes (presence checks), no schema validation library

**State:** 
- Server state: Prisma queries in Server Components
- Client state: Zustand `useUIStore` for UI state (sidebar, modals, theme, notifications)

---

*Architecture analysis: 2026-04-09*