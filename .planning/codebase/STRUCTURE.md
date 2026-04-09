# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
src/
├── app/                          # Next.js App Router - pages and API routes
│   ├── api/                      # API route handlers (RESTful endpoints)
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── employee/         # Current user endpoint
│   │   │   ├── logout/           # Session termination
│   │   │   ├── role/             # Role management
│   │   │   └── sync/             # Sync auth state
│   │   ├── tasks/                # Task CRUD operations
│   │   │   └── [id]/             # Task detail endpoints
│   │   ├── employees/            # Employee management
│   │   ├── batches/              # Batch operations
│   │   ├── stocks/               # Stock management
│   │   └── [resource]/           # Other domain entities (products, variants, etc.)
│   ├── login/                    # Login page (client component)
│   ├── dashboard/                # Main dashboard (server + client components)
│   ├── admin/                    # Admin panel (role-protected pages)
│   │   ├── employees/            # Employee management UI
│   │   └── settings/             # System settings
│   ├── tasks/                    # Task management pages
│   │   ├── board/                # Kanban-style task board
│   │   └── my-tasks/             # User's assigned tasks
│   ├── products/                 # Product management
│   │   ├── entry/                # Product entry form
│   │   ├── flavors/              # Flavor configuration
│   │   ├── sizes/                # Size configuration
│   │   └── variants/             # Product variants
│   ├── [domain]/                 # Other domain pages (production, finance, raw-materials, etc.)
│   └── middleware.ts             # Route protection and session validation
│
├── components/                   # Reusable React components
│   ├── ui/                       # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── auth-guard.tsx            # Auth-protected component wrapper
│   ├── app-sidebar.tsx           # Main navigation sidebar
│   ├── tasks-table.tsx           # Task list display
│   ├── task-board.tsx            # Kanban board implementation
│   ├── task-card.tsx             # Individual task card
│   ├── task-form.tsx             # Task creation/edit form
│   ├── employee-form.tsx         # Employee data form
│   ├── raw-materials-table.tsx   # Materials management table
│   ├── providers.tsx             # Global providers (AuthProvider, QueryClientProvider)
│   └── [other-components].tsx    # Domain-specific components
│
├── contexts/                     # React Context for state management
│   └── auth-context.tsx          # Authentication state and login/logout logic
│
├── hooks/                        # Custom React hooks
│   └── use-mobile.ts             # Mobile responsive detection
│
├── lib/                          # Utility functions and helpers
│   ├── auth-helper.ts            # Core auth functions (getCurrentUser, requireAuth, requireRole)
│   ├── auth-rbac.ts              # RBAC utilities (role checking, permission validation)
│   ├── permissions.ts            # Permission definitions and role mappings
│   ├── prisma.ts                 # Prisma client singleton
│   ├── supabase.ts               # Supabase client setup
│   ├── utils.ts                  # General utilities
│   └── stores/                   # Zustand state stores
│       ├── ui.ts                 # UI state (sidebar toggle)
│       └── index.ts              # Store exports
│
└── middleware.ts                 # Next.js middleware for route protection

```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router - all pages and API endpoints
- Contains: Page components (.tsx), API route handlers (route.ts), error boundaries, loading states
- Key pattern: One file per route; nested folders map to URL paths

**`src/app/api/`:**
- Purpose: RESTful API endpoints accessed by client components
- Contains: GET/POST/PUT/DELETE handlers, data validation, authorization checks
- Pattern: `route.ts` in each folder handles requests for that path
- All API endpoints require `getCurrentUser()` validation before returning data

**`src/app/admin/`:**
- Purpose: Admin-only management pages
- Contains: Role-protected pages requiring admin role
- Key files: `page.tsx` (index), `employees/page.tsx`, `settings/page.tsx`
- Access control: Middleware allows through, server components redirect if not admin

**`src/app/tasks/`:**
- Purpose: Task management UI
- Contains: Task listing, task board (Kanban), individual task pages
- Key files: `board/page.tsx` (Kanban), `my-tasks/page.tsx` (user's tasks), `[id]/page.tsx` (detail)
- Data source: `/api/tasks` endpoint with role-based filtering

**`src/components/`:**
- Purpose: Reusable UI components
- Contains: React components (client and server), component composition
- UI library: shadcn/ui for consistent design system
- Pattern: One component per file, export as default

**`src/components/ui/`:**
- Purpose: shadcn/ui library components
- Contains: Button, Card, Dialog, Sidebar, Toast, Table, etc.
- Note: Do NOT modify without permission - this is working system
- Used by: All pages and domain components

**`src/contexts/auth-context.tsx`:**
- Purpose: Global auth state management
- Contains: User session, employee data, role, auth functions (login, logout)
- Pattern: React Context + custom hook (`useAuth()`)
- Scope: Client-side only; syncs with Supabase on mount, fetches employee from API

**`src/lib/auth-helper.ts`:**
- Purpose: Core authentication utilities
- Key exports:
  - `getCurrentUser()`: Get authenticated user + role + admin flag
  - `requireAuth()`: Redirect to login if not authenticated
  - `requireAdmin()`: Redirect if not admin
  - `requireRole(role)`: Check role hierarchy
  - `requirePermission(permission)`: Check specific permission
- Pattern: Combines Supabase session + Prisma user lookup

**`src/lib/auth-rbac.ts`:**
- Purpose: Role-Based Access Control logic
- Key exports:
  - `isPublicRoute()`, `isProtectedRoute()`: Route classification
  - `getRoleByUserId()`, `getUserRoleFromRequest()`: Get user role
  - `checkRoutePermission()`: Validate route access
  - `hasRole()`, `hasPermission()`, `hasAllPermissions()`: Permission checks
- Pattern: Hybrid - code defaults + database overrides

**`src/lib/permissions.ts`:**
- Purpose: Permission and role definitions
- Exports:
  - `Permission`: Union type of all permissions
  - `RolePermissions`: Role-to-permissions mapping
  - Helper functions: `roleHasPermission()`, `getRolePermissions()`
- Roles: viewer, employee, admin (with permission inheritance)

**`src/lib/prisma.ts`:**
- Purpose: Singleton Prisma client instance
- Pattern: Simple export of `new PrismaClient()` with singleton wrapper
- Usage: Import and use directly in any server-side code

**`src/lib/stores/`:**
- Purpose: Zustand state stores for client-side state
- Files:
  - `ui.ts`: UI state (sidebar toggle)
  - `index.ts`: Re-export all stores

## Key File Locations

**Entry Points:**

- `src/app/login/page.tsx`: Login form (client component)
- `src/app/dashboard/page.tsx`: Main dashboard (server component)
- `src/app/admin/page.tsx`: Admin index (client component with role check)
- `src/app/layout.tsx` (Next.js root layout): Global layout, providers
- `src/middleware.ts`: HTTP middleware for session validation

**Configuration:**

- `src/lib/prisma.ts`: Database client setup
- `src/lib/supabase.ts`: Supabase client configuration
- `tsconfig.json`: TypeScript config with `@/*` path alias
- `next.config.ts`: Next.js configuration
- `package.json`: Dependencies and scripts

**Core Logic:**

- `src/lib/auth-helper.ts`: User authentication and role retrieval
- `src/lib/auth-rbac.ts`: Role-based access control
- `src/lib/permissions.ts`: Permission and role mappings
- `src/contexts/auth-context.tsx`: Client auth state management

**Testing:**

- No test files present in src/ (vitest configured but not yet used)
- Run tests with: `npm test` or `npm run test:watch`

## Naming Conventions

**Files:**

- **Page components:** `page.tsx` in route folders (Next.js convention)
- **Layout components:** `layout.tsx` in route folders
- **API routes:** `route.ts` in api/ folders
- **Component files:** kebab-case with .tsx extension (e.g., `task-board.tsx`, `auth-guard.tsx`)
- **Utility files:** kebab-case with .ts extension (e.g., `auth-helper.ts`, `use-mobile.ts`)
- **Store files:** kebab-case with .ts extension (e.g., `ui.ts`)

**Directories:**

- **Next.js routes:** kebab-case lowercase (e.g., `/dashboard`, `/admin/employees`, `/raw-materials`)
- **Dynamic routes:** Bracket notation (e.g., `[id]` for `/tasks/[id]`)
- **Feature folders:** kebab-case (e.g., `auth`, `tasks`, `products`)

**Code:**

- **Variables & functions:** camelCase (e.g., `getCurrentUser`, `userRole`, `isActive`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `ROLE_HIERARCHY`, `PUBLIC_ROUTES`)
- **React components:** PascalCase (e.g., `TaskBoard`, `AuthGuard`, `EmployeeForm`)
- **Types/Interfaces:** PascalCase (e.g., `AuthUser`, `Permission`, `EmployeeResponse`)
- **Database:** snake_case in Prisma schema; exposed as-is in queries (e.g., `is_active`, `created_by`)

## Where to Add New Code

**New Feature (with database):**
- Primary code: `src/app/api/[feature]/route.ts` (API endpoint)
- Pages: `src/app/[feature]/page.tsx` or `src/app/[feature]/index/page.tsx`
- Components: `src/components/[feature]-*.tsx` (e.g., `feature-form.tsx`, `feature-table.tsx`)
- Auth: Add permission to `src/lib/permissions.ts` if role-gated
- Hooks: `src/hooks/use-[feature].ts` if complex state needed

**New Component (reusable):**
- Implementation: `src/components/[name].tsx` (PascalCase component export)
- If simple: Keep in single file
- If complex: Create folder with `index.tsx` + subcomponents

**Utilities & Helpers:**
- Shared helpers: `src/lib/[purpose].ts` (e.g., `src/lib/date-utils.ts`)
- Custom hooks: `src/hooks/use-[name].ts` (must start with "use")
- Stores: `src/lib/stores/[name].ts` (Zustand)

**New Page with Protected Route:**
1. Create folder: `src/app/[route-name]/`
2. Add page: `src/app/[route-name]/page.tsx`
3. If server component: Call `getCurrentUser()` at top, redirect if not authenticated
4. If client component: Wrap in `<AuthGuard>` component
5. If role-specific: Check role in component or use `requireRole()` in API endpoint
6. Add route to `PROTECTED_ROUTES` in `src/lib/auth-rbac.ts` if middleware protection needed

**API Endpoint:**
1. Create folder: `src/app/api/[resource]/`
2. Add route: `src/app/api/[resource]/route.ts`
3. Start with: `const user = await getCurrentUser(); if (!user) return authResponse("Unauthorized");`
4. Check role if needed: `const roleCheck = await requireRole('admin'); if (roleCheck instanceof NextResponse) return roleCheck;`
5. Return data: `return NextResponse.json({ data })` or error response
6. Set `export const dynamic = 'force-dynamic'` if data changes frequently

## Special Directories

**`.next/`:**
- Purpose: Build output directory (Next.js)
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**`.env` & `.env.local`:**
- Purpose: Environment variables for database, Supabase credentials
- Generated: No (created manually)
- Committed: No (in .gitignore for security)
- Required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)

**`.planning/codebase/`:**
- Purpose: Architecture and codebase documentation (this file)
- Generated: No (human written, CI/CD generated)
- Committed: Yes (to track documentation changes)

**`prisma/`:**
- Purpose: Database schema and migrations
- Key files: `schema.prisma` (data model), `migrations/` (migration history)
- Generated: Migrations auto-generated
- Committed: Yes
