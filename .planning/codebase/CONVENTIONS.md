# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- Page components: `page.tsx` (e.g., `src/app/admin/page.tsx`, `src/app/login/page.tsx`)
- Layout files: `layout.tsx` (e.g., `src/app/admin/layout.tsx`)
- API routes: `route.ts` (e.g., `src/app/api/auth/role/route.ts`)
- Components: PascalCase with `.tsx` extension (e.g., `TaskForm.tsx`, `AuthGuard.tsx`)
- Utility files: camelCase with `.ts` extension (e.g., `auth-helper.ts`, `auth-rbac.ts`)
- Error/Loading pages: `error.tsx`, `loading.tsx` (Next.js patterns)
- Kebab-case for multi-word filenames in directories (e.g., `auth-guard.tsx`, `app-sidebar.tsx`)

**Functions:**
- camelCase for all functions, async or not (e.g., `getCurrentUser()`, `requireAdmin()`, `fetchEmployee()`)
- Prefixed with action verbs: `get`, `fetch`, `require`, `check`, `is`, `has`, `set`
- React component functions: PascalCase (e.g., `function LoginForm()`, `function TaskForm()`)
- Handler functions: `handle` prefix (e.g., `handleSubmit()`, `handleChange()`)

**Variables:**
- camelCase for all variables (e.g., `employeeRef`, `isLoading`, `authError`, `queryClient`)
- State variables: descriptive names (e.g., `isLoading`, `authError`, `employee`, `role`)
- Boolean prefixes: `is`, `has`, `can`, `should` (e.g., `isLoading`, `canChangeAssignee`, `isPublicRoute`)
- Event handlers: `on` prefix (e.g., `onClose()`, `onSuccess()`, `onError()`)

**Types:**
- PascalCase for interfaces and types (e.g., `AuthUser`, `Employee`, `TaskFormProps`)
- Union types for specific strings: `type Permission = 'view:dashboard' | 'edit:dashboard'` (kebab-case values with colon separator)
- Suffix `Props` for component props types (e.g., `TaskFormProps`, `TasksTableProps`)
- Suffix `Type` or explicit naming for context types (e.g., `AuthContextType`)

**Constants:**
- UPPER_SNAKE_CASE for truly constant values (e.g., `ROLE_HIERARCHY`, `PROTECTED_ROUTES`, `PUBLIC_ROUTES`)
- camelCase for constant objects/arrays that may change (e.g., `DEFAULT_ROUTE_PERMISSIONS`, `RolePermissions`)

**Database/Prisma:**
- snake_case for database column names in Prisma schema
- snake_case fields in TypeScript when they represent database columns (e.g., `role_id`, `is_active`, `created_at`)
- Prisma model names: PascalCase singular (e.g., `employees`, `roles`)
- Query operations: descriptive (e.g., `prisma.employees.findUnique()`, `prisma.batches.findMany()`)

## Code Style

**Formatting:**
- No dedicated prettier config (default Next.js/TypeScript conventions)
- ESLint configured with Next.js and TypeScript rules
- Indentation: 2 spaces (implicit from code)
- Max line length: Not enforced but typically wraps around 100-120 characters
- Semicolons: Used at end of statements

**Linting:**
- Tool: ESLint 9 with `eslint-config-next` and `eslint-config-next/typescript`
- Config file: `eslint.config.mjs`
- Key rules disabled: `react-hooks/set-state-in-effect: off` (allows setState inside useEffect for specific cases)
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Import Organization

**Order:**
1. React and Next.js imports (e.g., `import { useState } from "react"`)
2. Next.js specific imports (e.g., `import { useRouter } from "next/navigation"`)
3. Third-party library imports (e.g., `import { useQuery } from "@tanstack/react-query"`)
4. Internal absolute imports using `@/` alias (e.g., `import { useAuth } from "@/contexts/auth-context"`)
5. UI/Component imports (e.g., `import { Button } from "@/components/ui/button"`)
6. Utility imports (e.g., `import { cn } from "@/lib/utils"`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- All internal imports use absolute path with `@/` prefix, never relative imports
- Examples: `@/lib/auth-helper`, `@/contexts/auth-context`, `@/components/ui/button`

## Error Handling

**Patterns:**
- Try-catch blocks in async functions, especially in API routes and context providers
- Error messages passed to users are user-friendly strings
- Detailed errors logged to console with `console.error()` for debugging
- API routes return NextResponse with appropriate HTTP status codes (400, 401, 403, 404, 500)
- Client-side mutations use `.onError()` handler to display errors via notification system
- Auth-related errors: Custom `AuthError` interface with `type` and `message` fields in `src/lib/auth-helper.ts`

**Example pattern:**
```typescript
// In API routes
try {
  const user = await getCurrentUser();
  if (!user) return authResponse("Unauthorized");
  // ... logic ...
  return NextResponse.json(result);
} catch (error) {
  console.error('[Context] Error message:', error);
  return NextResponse.json({ error: 'User-friendly message' }, { status: 500 });
}

// In React components with mutations
const mutation = useMutation({
  mutationFn: async (data) => { /* ... */ },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["..."] });
    addNotification({ type: "success", message: "Action succeeded" });
  },
  onError: (err: Error) => {
    addNotification({ type: "error", message: err.message });
  },
});
```

## Logging

**Framework:** Console object (no dedicated logging library)

**Patterns:**
- `console.log()` for informational messages, especially in auth context with `[Auth]` prefix
- `console.error()` for errors with descriptive prefixes (e.g., `console.error('[Auth] Login error:')`)
- Prefix style: `[ComponentOrFeature] Message` (e.g., `[Auth]`, `[API/employees/GET]`)
- Used primarily in: Auth context (`src/contexts/auth-context.tsx`), API routes, middleware
- Example: `console.log("[Auth] Fetching employee for userId:", userId);`

## Comments

**When to Comment:**
- JSDoc/TSDoc for public functions, especially API route handlers and exported utilities
- Comment blocks before significant functions explaining purpose
- Inline comments for complex logic or non-obvious code
- Avoid obvious comments (e.g., "// Set loading to true")

**JSDoc/TSDoc:**
- Used in API route files (e.g., `src/app/api/auth/role/route.ts`)
- Multi-line block comments describing endpoint, method, auth requirements, and request/response format
- Example:
```typescript
/**
 * GET /api/auth/role
 * Returns all employees with their role information.
 * Requires admin authorization.
 */
```

**Comments in code:**
- Used to explain complex permission checks, database validation, role hierarchy logic
- Example: `// Validate required fields`, `// Handle redirect from requireAdmin`, `// Use database override if exists`

## Function Design

**Size:**
- Prefer smaller, focused functions (typically 20-50 lines max for utility functions)
- Larger functions acceptable in React components for state management, but extracted into custom hooks when reused
- API route handlers: 30-80 lines typical

**Parameters:**
- Use destructuring for objects (e.g., `{ email, password }` from request body)
- Limit parameters to 3-4; use object param for more
- TypeScript types always specified

**Return Values:**
- Consistent return types: API routes return `NextResponse`
- Utility functions return appropriate types (e.g., `Promise<AuthUser | null>`)
- Mutations return `Promise<Result>` with error handling delegated to `.onError()`
- Example: `async function getCurrentUser(): Promise<AuthUser | null>`

## Module Design

**Exports:**
- Named exports for utility functions and types (e.g., `export function getCurrentUser()`, `export type AuthUser`)
- Default exports for Page components and Layout components (Next.js pattern)
- Barrel exports in index files (e.g., `src/lib/stores/index.ts` exports all stores)

**Barrel Files:**
- Used in `src/lib/stores/` to re-export all store functions
- Used in `src/lib/` for utility exports (not fully populated)
- Pattern: `export * from './auth-helper'` or direct function exports

**Module Structure:**
- API routes self-contained with all logic
- Library utilities in `src/lib/` separated by concern (auth, stores, utils, supabase, prisma)
- Components grouped by feature in `src/components/`
- Contexts in `src/contexts/` for global state
- No separate services layer; logic lives in API routes, contexts, or lib utilities

---

*Convention analysis: 2026-04-09*
