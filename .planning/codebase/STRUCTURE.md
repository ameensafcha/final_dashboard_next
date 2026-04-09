# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```
claude2/
├── prisma/
│   └── schema.prisma          # Database schema (PostgreSQL)
├── src/
│   ├── app/                 # Next.js App Router (pages + API)
│   │   ├── api/             # API routes (REST endpoints)
│   │   ├── (routes)/       # Route groups
│   │   ├── login/           # Login page
│   │   ├── dashboard/       # Dashboard
│   │   ├── tasks/           # Task management
│   │   ├── production/     # Production
│   │   ├── stocks/         # Stock management
│   │   ├── raw-materials/  # Raw materials
│   │   ├── finished-products/
│   │   ├── variant-inventory/
│   │   ├── packing-logs/
│   │   ├── packing-receives/
│   │   ├── finance/         # Finance/transactions
│   │   ├── admin/          # Admin panel
│   │   └── layout.tsx      # Root layout
│   ├── components/          # React components
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/           # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities, clients, stores
│   │   └── stores/        # Zustand stores
│   ├── middleware.ts      # Next.js middleware
│   └── types/             # TypeScript types (if any)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── .env*                  # Environment files (secrets)
```

## Directory Purposes

### `src/app/`
- **Purpose:** Next.js App Router - pages and API routes
- **Contains:** 
  - Page components (`page.tsx`)
  - API route handlers (`route.ts`)
  - Layouts (`layout.tsx`)
  - Loading states (`loading.tsx`)
  - Error states (`error.tsx`)

### `src/components/`
- **Purpose:** Reusable React components
- **Contains:**
  - `task-board.tsx` - Kanban board
  - `task-detail.tsx` - Task detail
  - `task-form.tsx` - Task form
  - `task-card.tsx` - Task card
  - `app-sidebar.tsx` - Sidebar navigation
  - `auth-guard.tsx` - Auth protection
  - `providers.tsx` - React providers
  - `toast.tsx`, `toast-container.tsx` - Notifications

### `src/components/ui/`
- **Purpose:** UI component library (shadcn/ui style)
- **Contains:** `button.tsx`, `input.tsx`, `dialog.tsx`, `sheet.tsx`, etc.

### `src/lib/`
- **Purpose:** Core utilities and integrations
- **Contains:**
  - `prisma.ts` - Prisma client
  - `supabase.ts` - Supabase client factory
  - `auth-helper.ts` - Authentication utilities
  - `utils.ts` - Utilities (`cn()`)
  - `stores/index.ts`, `stores/ui.ts` - Zustand stores

### `src/contexts/`
- **Purpose:** React contexts
- **Contains:** `auth-context.tsx`

### `src/hooks/`
- **Purpose:** Custom React hooks
- **Contains:** `use-mobile.ts`

### `prisma/`
- **Purpose:** Database schema and migrations
- **Contains:** `schema.prisma`

## Key File Locations

### Entry Points
- **`src/app/layout.tsx`:** Root layout, loads sidebar, providers, toast
- **`src/app/page.tsx`:** Root redirect (goes to login or dashboard)
- **`src/middleware.ts`:** Route protection on every request

### Authentication
- **`src/lib/auth-helper.ts`:** `getCurrentUser()`, `requireAuth()`, `requireAdmin()`
- **`src/middleware.ts`:** Protected route enforcement
- **`src/app/login/page.tsx`:** Login page

### Database
- **`src/lib/prisma.ts`:** Prisma client singleton
- **`prisma/schema.prisma`:** Database schema

### API Routes
- **`src/app/api/tasks/route.ts`:** Tasks CRUD
- **`src/app/api/products/route.ts`:** Products CRUD
- **`src/app/api/transactions/route.ts`:** Transactions
- **`src/app/api/batches/route.ts`:** Production batches
- **`src/app/api/employees/route.ts`:** Employee management

### Pages
- **`src/app/dashboard/page.tsx`:** Dashboard KPIs
- **`src/app/tasks/page.tsx`:** Task list
- **`src/app/tasks/board/page.tsx`:** Kanban view
- **`src/app/production/page.tsx`:** Production tracking
- **`src/app/stocks/page.tsx`:** Stock view
- **`src/app/finance/page.tsx`:** Finance overview

### State
- **`src/lib/stores/ui.ts`:** `useUIStore` (Zustand)

## Naming Conventions

**Files:**
- Pages: `kebab-case/page.tsx` → `dashboard/page.tsx`, `tasks/route.ts`
- Components: `kebab-case.tsx` → `task-board.tsx`, `app-sidebar.tsx`
- Utils: `kebab-case.ts` → `auth-helper.ts`, `supabase.ts`
- Stores: `kebab-case.ts` → `ui.ts`

**Directories:**
- `kebab-case` → `raw-materials`, `finished-products`
- Route groups: `(kebab-case)` → `(routes)`

**Database Models:**
- PascalCase → `employees`, `products`, `tasks`

**API Routes:**
- Plural nouns: `/api/tasks`, `/api/products`
- Nested: `/api/tasks/[id]/comments`

## Where to Add New Code

### New API Endpoint
```bash
# 1. Create route file
src/app/api/[resource]/route.ts

# 2. Pattern:
export async function GET() { }
export async function POST(request: Request) { }
export async function PUT(request: Request) { }
export async function DELETE(request: Request) { }
```

### New Page
```bash
# 1. Create folder + page.tsx
src/app/[path]/page.tsx

# 2. If needs layout: create layout.tsx
src/app/[path]/layout.tsx
```

### New Component
```bash
# 1. Add to components folder
src/components/my-component.tsx
```

### New Database Model
```bash
# 1. Add to prisma/schema.prisma
# 2. Run: npx prisma db push
# 3. Update src/lib/prisma.ts if needed
```

### New Store
```bash
# 1. Add to src/lib/stores/
src/lib/stores/my-store.ts

# 2. Export from index.ts
```

### New Utility
```bash
# 1. Add to src/lib/
src/lib/my-utility.ts
```

## Special Directories

### `src/app/api/`
- **Purpose:** REST API endpoints
- **Generated:** No
- **Committed:** Yes

### `src/components/ui/`
- **Purpose:** shadcn/ui style components
- **Generated:** No (manually written)
- **Committed:** Yes

### `prisma/`
- **Purpose:** Database schema
- **Generated:** No (version controlled)
- **Comitted:** Yes

### Dynamic Routes
- **Pattern:** `[id]/route.ts` → `src/app/api/tasks/[id]/route.ts`
- **Captured params:** Available in `request` parameter

---

*Structure analysis: 2026-04-09*