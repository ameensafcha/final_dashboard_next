# Codebase Structure

**Analysis Date:** 2026-04-11

## Directory Layout

```
claude2/
├── src/
│   ├── app/                 # Next.js App Router pages and API
│   ├── components/          # React components
│   ├── contexts/            # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities, stores, clients
│   └── prisma/              # Database schema
├── .planning/               # Planning artifacts
└── public/                  # Static assets
```

## Directory Purposes

**`src/app/`:**
- Purpose: Pages and API routes
- Contains: Route handlers, page components, layouts
- Key files: `layout.tsx`, `page.tsx`, API routes

**`src/components/`:**
- Purpose: UI components
- Contains: Application components (`app-sidebar.tsx`, `task-board.tsx`), UI primitives (`ui/`)
- Key files: All `.tsx` except pages

**`src/contexts/`:**
- Purpose: React context providers
- Contains: `auth-context.tsx` for authentication state

**`src/hooks/`:**
- Purpose: Custom React hooks
- Contains: `use-mobile.ts`, `use-realtime-subscription.ts`, `use-realtime-connection-status.ts`

**`src/lib/`:**
- Purpose: Core utilities and libraries
- Contains: `prisma.ts`, `supabase.ts`, `auth-helper.ts`, `utils.ts`, `stores/`

**`src/prisma/`:**
- Purpose: Database schema
- Contains: `schema.prisma` - all Prisma models

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout wrapping all pages
- `src/app/page.tsx`: Unauthenticated landing page (redirects to login)
- `src/middleware.ts`: Edge middleware for auth validation

**Configuration:**
- `src/prisma/schema.prisma`: Database schema with all models
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/lib/auth-helper.ts`: Server-side auth utilities
- `src/contexts/auth-context.tsx`: Client-side auth state
- `src/lib/prisma.ts`: Database client singleton
- `src/lib/supabase.ts`: Supabase client (likely browser/client version)

**Testing:** (No test framework currently configured)

## Page Routes

```
/                       → Landing (redirects)
/login                  → Login page
/dashboard              → Dashboard with KPIs
/tasks                  → Task list
/tasks/my-tasks        → User's assigned tasks
/tasks/board           → Kanban board
/raw-materials         → Raw materials inventory
/stocks                → Stock overview
/receiving             → Material receiving
/products/entry        → Product entry
/products/variants     → Product variants
/products/flavors     → Flavor definitions
/products/sizes       → Size definitions
/production            → Batch production
/finished-products    → Finished goods
/packing-logs         → Packing logs
/packing-receives     → Packing receives
/variant-inventory    → Variant stock levels
/finance               → Finance dashboard
/finance/transactions → Transaction list
/admin                 → Admin dashboard
/admin/employees      → Employee management
/admin/roles          → Role definitions
/admin/roles/permissions → Role-permission mapping
/admin/settings      → Application settings
```

## API Routes

```
/api/auth/role              → Get user's role
/api/auth/employee          → Get current employee data
/api/auth/sync             → Sync auth user to employee
/api/auth/logout           → Logout endpoint
/api/users/permissions     → Get user's permissions
/api/employees            → Employee CRUD
/api/roles                → Role management
/api/roles/permissions    → Role-permission mapping
/api/tasks                → Task CRUD
/api/tasks/[id]/subtasks  → Subtask operations
/api/tasks/[id]/comments  → Comment operations
/api/tasks/[id]/time-logs → Time log operations
/api/notifications        → Notification CRUD
/api/notifications/[id]/read → Mark as read
/api/notifications/mark-all-read → Mark all as read
/api/raw-materials        → Raw material CRUD
/api/receiving            → Receiving CRUD
/api/products             → Product CRUD
/api/variants            → Variant CRUD
/api/variants/bulk       → Bulk variant operations
/api/variants/available   → Available variants
/api/flavors             → Flavor CRUD
/api/sizes               → Size CRUD
/api/batches             → Batch CRUD
/api/transactions        → Transaction CRUD
/api/stocks              → Stock operations
/api/packing-logs        → Packing log CRUD
/api/packing-receives    → Packing receive CRUD
/api/finished-products   → Finished product CRUD
/api/variant-inventory   → Variant inventory CRUD
/api/powder-stock        → Powder stock operations
/api/raw-material-logs   → Raw material log CRUD
/api/init-stocks         → Stock initialization
/api/settings           → App settings
/api/health             → Health check
```

## Naming Conventions

**Files:**
- Components: PascalCase (`AppSidebar.tsx`, `TaskBoard.tsx`)
- Utils/helpers: kebab-case (`auth-helper.ts`, `utils.ts`)
- API routes: kebab-case with route.ts (`tasks/route.ts`, `[id]/route.ts`)

**Directories:**
- Lowercase plural (`components`, `lib`, `hooks`, `contexts`)
- Route groups use kebab-case (`products`, `admin`, `tasks`)

**Functions:**
- camelCase (`getCurrentUser`, `requirePermissionApi`)

**Types/Interfaces:**
- PascalCase (`AuthContextType`, `Employee`)

## Where to Add New Code

**New Feature:**
- Page: `src/app/[feature]/page.tsx` or `src/app/[feature]/[subfeature]/page.tsx`
- API: `src/app/api/[feature]/route.ts`
- Component: `src/components/[feature]-component.tsx`

**New Database Model:**
- Add to `src/prisma/schema.prisma`
- Run `npx prisma generate`

**New UI Component:**
- If shadcn primitive: `src/components/ui/[component].tsx`
- If application component: `src/components/[component-name].tsx`

**New Store:**
- Add to `src/lib/stores/[name].ts`
- Export from `src/lib/stores/index.ts`

**New Hook:**
- Add to `src/hooks/[hook-name].ts`

## Special Directories

**`src/components/ui/`:**
- Purpose: shadcn/ui base components
- Generated: Yes (from shadcn CLI)
- Committed: Yes

**`src/app/api/`:**
- Purpose: API route handlers
- Generated: No
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning artifacts
- Generated: Yes (by GSD orchestrator)
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-04-11*