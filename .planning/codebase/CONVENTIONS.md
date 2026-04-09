# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- Utilities: kebab-case (`auth-helper.ts`, `use-mobile.ts`)
- Components/Types: PascalCase (`TaskCard.tsx`, `Button.tsx`)
- API Routes: kebab-case (`products/route.ts`)
- Stores: kebab-case with descriptive names (`ui.ts`, `index.ts`)

**Functions:**
- camelCase throughout
- Verb prefixes for actions: `getCurrentUser()`, `requireAuth()`, `createPrismaClient()`
- Helper prefixes: `cn()` for className merging, `authResponse()` for auth responses

**Variables:**
- camelCase: `user`, `tasks`, `existingTask`
- Private/public not used (TypeScript)
- Type annotations for function parameters and return types

**Types:**
- PascalCase interfaces: `AuthUser`, `UIStore`, `TaskCardProps`
- Inline types for component props
- Descriptive names ending with context: `TaskDetailTask`, `SerializedTask`, `KPIData`

## Code Style

**Formatting:**
- 2 spaces for indentation (default)
- Single quotes for strings
- Trailing commas enabled
- Prettier integrated with ESLint

**Linting:**
- ESLint 9 with `eslint-config-next` (core-web-vitals + typescript)
- Custom rule: `"react-hooks/set-state-in-effect": "off"`
- Ignored: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

## Import Organization

**Order (as seen in codebase):**
1. External libraries: `next/server`, `@tanstack/react-query`, `react`
2. Internal libs: `@/lib/prisma`, `@/lib/utils`, `@/lib/stores`
3. Components: `@/components/ui/*`, `@/components/*`
4. Types: Inline or from `@/types`

**Path Aliases:**
- `@/*` maps to `./src/*`
- Used consistently across all imports

## Error Handling

**API Routes:**
- Try-catch wrapping all route handlers
- `console.error()` with descriptive messages before returning 500
- Specific error messages: "Failed to fetch", "Failed to create", "Failed to update", "Failed to delete"
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)

**Auth Pattern:**
- `getCurrentUser()` returns null on auth failure
- `authResponse("Unauthorized")` helper for 401 responses
- `requireAuth()` throws Error("Unauthorized")
- `requireAdmin()` throws Error("Forbidden: Admin only")

**Validation:**
- Early returns for required field checks
- Status 400 with descriptive error messages for validation failures
- URL search params used for DELETE request IDs

## Logging

**Framework:** `console` (no external logging library)

**Patterns:**
- `console.error()` for error logging in API routes and auth helpers
- No info/debug logging in current codebase
- Error messages include operation context: `"Error fetching tasks:"`, `"Auth check error:"`

## Comments

**When to Comment:**
- Role-based filtering logic: `// Role-based filtering + search`
- Permission checks: `// Permission check: only admin or task creator can delete`
- Field-level permissions: `// Field-level permissions`
- Auto-set logic: `// Auto-set completed_at when status changes to completed`

**JSDoc/TSDoc:**
- Not used in current codebase
- Interface/type definitions serve as documentation

## Function Design

**Size:**
- Keep route handlers focused (~50-100 lines typical)
- Complex logic broken into helper functions like `createSupabaseServerClient()`

**Parameters:**
- Typed via TypeScript interfaces
- Destructuring for request body/params
- Default values for optional parameters: `priority || "medium"`

**Return Values:**
- Explicit return types for API routes: `Promise<NextResponse>`
- NextResponse.json() for all responses
- Try-catch ensures consistent return structure

## Module Design

**Exports:**
- Named exports for utilities: `export function cn()`
- Default exports for API routes: `export default nextConfig`
- Barrel files for stores: `src/lib/stores/index.ts` re-exports

**Barrel Files:**
- Used in stores (`index.ts` re-exports from `ui.ts`)
- Components organized in directories, imported individually

## Component Patterns

**Server Components:**
- Default (no `'use client'` directive)
- Used for data fetching pages

**Client Components:**
- `'use client'` at top for interactive components
- Components using hooks: `useState`, `useEffect`, `useSortable`
- Event handlers and callbacks

**Props:**
- Interface-based prop typing
- Optional props with defaults: `isDragging?: boolean`
- Destructuring in function signature

## Database (Prisma)

**Client:**
- Single instance via global pattern (`globalForPrisma`)
- Adapter-based: `@prisma/adapter-pg` with `pg` Pool
- Connection via `DATABASE_URL` env var

**Patterns:**
- `include` for related records
- `select` for specific fields
- `where` clauses for filtering
- `orderBy` for sorting
- Transaction needed for multi-step operations

## State Management

**Server State:**
- TanStack React Query (not yet fully utilized - can be added)

**Client State:**
- Zustand stores: `useUIStore` in `@/lib/stores`
- Pattern: `create<StoreInterface>((set) => ({ ... }))`
- Immutable updates via spread operator

## Tailwind CSS

**Version:** Tailwind v4 (no config file)

**Patterns:**
- `cn()` utility from `@/lib/utils` for conditional classes
- CSS variables via Tailwind v4
- Semantic class names: `bg-white`, `text-gray-900` (not arbitrary colors in components)
- Responsive classes: `lg:grid-cols-2`, `hidden lg:block`

---

*Convention analysis: 2026-04-09*
