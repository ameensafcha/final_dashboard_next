# Coding Conventions

**Analysis Date:** 2026-04-11

## Naming Patterns

**Files:**
- API routes: kebab-case with folders (`tasks/route.ts`, `tasks/[id]/comments/route.ts`)
- Components: PascalCase (`TaskCard.tsx`, `NotificationCenter.tsx`)
- Utilities: kebab-case (`auth-helper.ts`, `utils.ts`)
- Stores: kebab-case (`ui.ts`, `notifications.ts`)

**Functions:**
- camelCase with verb prefixes
- Auth-related: `getCurrentUser`, `requirePermissionApi`, `requireAdminApi`, `verifyApiAuth`, `authResponse`
- Task filters: `getTaskFilterByRole`

**Variables:**
- camelCase
- Type-specific prefixes where helpful: `testTaskId`, `testUserId`

**Types/Interfaces:**
- PascalCase
- Inline in components or in separate types
- Example: `interface Task`, `interface TaskCardProps`

## Code Style

**Formatting:**
- ESLint + Prettier via `eslint.config.mjs`
- Uses Next.js TypeScript and React configurations (`eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`)
- React hooks rule disabled: `"react-hooks/set-state-in-effect": "off"`
- Ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

**Linting:**
- Framework: ESLint v9
- Config: `eslint.config.mjs`
- Extends Next.js recommended rules

**Indentation:** 2 spaces

## Import Organization

**Order:**
1. External libraries (Next.js, React, Prisma, Supabase, etc.)
2. Internal lib utilities (`@/lib/prisma`, `@/lib/auth-helper`)
3. Components (`@/components/...`)
4. UI components (`@/components/ui/...`)
5. Types (if separate)

**Path Aliases:**
- `@/*` maps to `./src/*`

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";
```

## Error Handling

**API Routes Pattern:**
- Use try-catch blocks
- Log errors with `console.error`
- Return structured JSON errors with appropriate HTTP status codes

```typescript
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }
    // ... logic
    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
```

**Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not found
- `500`: Server error

## Logging

**Framework:** console.log / console.error

**Patterns:**
- Use descriptive prefixes: `"Error fetching tasks:"`, `"Error creating task:"`
- Log full error object for debugging

## Comments

**When to Comment:**
- Document API routes and their logic
- Comment complex queries and filters
- Use JSDoc for exported functions

**Example from auth-helper.ts:**
```typescript
/**
 * 2. Get Current User with Permissions
 */
export const getCurrentUser = cache(async () => { ... });
```

## Function Design

**Size:** Keep focused, single responsibility

**Parameters:**
- Use destructuring for request body
- Validate required fields explicitly

**Return Values:**
- Use explicit return types for API routes

```typescript
export async function GET(request: Request): Promise<NextResponse> {
```

## Module Design

**Exports:**
- Named exports for utilities and helpers
- Default not commonly used

**Barrel Files:**
- `src/lib/stores/index.ts` exports all stores

## Database Patterns (Prisma)

**Transactions:** Use `prisma.$transaction` for atomic operations

```typescript
const task = await prisma.$transaction(async (tx) => {
  // Create task
  const newTask = await tx.tasks.create({ ... });
  // Create notification
  if (assignee_id) {
    await tx.notifications.create({ ... });
  }
  return newTask;
});
```

**Include Relations:**
- Use `include` for related data
- Use `select` for specific fields

```typescript
const tasks = await prisma.tasks.findMany({
  where,
  select: {
    id: true,
    title: true,
    assignee: { select: { id: true, name: true } },
  },
});
```

## Component Patterns

**Client Components:**
- Add `"use client"` directive when hooks are needed

**Props:**
- Explicit interface definitions
- Optional props with defaults

```typescript
interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) { ... }
```

**Styling:**
- Use Tailwind CSS via `cn()` utility for conditional classes
- `twMerge(clsx(...))` pattern in `src/lib/utils.ts`

## State Management

**Server State:** TanStack React Query (referenced in project, patterns not yet visible)

**Client State:** Zustand stores in `src/lib/stores/`

```typescript
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  // ...
}));
```

## Authentication (Supabase)

**Middleware:** `src/middleware.ts` handles session validation

**Helpers:** `auth-helper.ts` provides:
- `getCurrentUser()` - Cached user with role/permissions
- `requirePermissionApi(permission)` - Permission guard
- `requireAdminApi()` - Admin-only guard
- `verifyApiAuth()` - Basic auth check
- `authResponse(error, status)` - Helper for auth errors

## Security Patterns

**Cookie Handling:** Supabase SSR cookie handling in both middleware and auth-helper

**Validation:**
- Validate enum values (status, priority)
- Sanitize search strings
- Check user existence before operations

---

*Convention analysis: 2026-04-11*