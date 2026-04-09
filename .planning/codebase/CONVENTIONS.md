# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- **Utilities/Lib**: kebab-case - `auth-helper.ts`, `utils.ts`, `prisma.ts`
- **Components/React**: PascalCase - `TaskCard.tsx`, `TaskForm.tsx`, `Button.tsx`
- **API Routes**: PascalCase - `route.ts` (Next.js App Router convention)
- **Store**: kebab-case - `ui.ts`, `index.ts`

**Functions:**
- camelCase with verb prefix - `getCurrentUser()`, `createTask()`, `addNotification()`
- Use descriptive, action-oriented names

**Variables:**
- camelCase - `currentUser`, `formData`, `isLoading`
- Boolean variables: prefix with `is`, `has`, `can` - `isAdmin`, `hasRole`, `canEdit`

**Types/Interfaces:**
- PascalCase - `interface Task`, `type TaskCardProps`, `AuthUser`
- Optional prefix `T` not used (e.g., `Product`, not `TProduct`)

**Constants:**
- UPPER_SNAKE_CASE for true constants (less common in codebase)
- Regular naming for configuration objects

## Code Style

**Formatting:**
- Tool: Prettier (integrated with ESLint)
- 2 spaces for indentation
- Single quotes for strings
- Trailing commas enabled
- Semicolons at end of statements

**Linting:**
- Tool: ESLint with Next.js config (`eslint-config-next`)
- Config file: `eslint.config.mjs`
- Custom rule: `react-hooks/set-state-in-effect` turned OFF
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**TypeScript:**
- Strict mode enabled in `tsconfig.json`
- Explicit return types required for API routes
- Avoid `any` - use `unknown` or proper types
- Use explicit type imports: `import { type NextResponse } from "next/server"`

```typescript
// Correct - explicit return type
export async function GET(): Promise<NextResponse> {
  const products = await prisma.products.findMany();
  return NextResponse.json(products);
}

// Avoid - implicit any return type
export async function GET() {
  const products = await prisma.products.findMany();
  return NextResponse.json(products);
}
```

## Import Organization

**Order (per AGENTS.md):**
1. External libraries - `import { useState } from "react"`
2. Internal lib - `import { prisma } from "@/lib/prisma"`
3. Components - `import { Button } from "@/components/ui/button"`
4. Types - `import { type Task } from "@/types"`

**Path Aliases:**
- `@/*` maps to `./src/*`
- Example: `@/lib/utils` resolves to `src/lib/utils.ts`

**Explicit Type Imports:**
```typescript
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";
```

## Error Handling

**API Routes:**
- Always wrap in try-catch
- Return appropriate HTTP status codes:
  - `200` for success
  - `400` for bad request (validation errors)
  - `401` for unauthorized
  - `403` for forbidden
  - `404` for not found
  - `500` for server errors

```typescript
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized"); // Returns 401
    }
    // ... logic
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}
```

**Error Response Helper:**
- Use `authResponse()` from `@/lib/auth-helper` for auth errors
- Custom error messages: `NextResponse.json({ error: "Message" }, { status: 400 })`

## Logging

**Framework:** console logging (no structured logger)

**Patterns:**
- API routes: `console.error("Error message:", error)` for errors
- Minimal logging otherwise
- No info/debug logging observed in codebase

## Comments

**When to Comment:**
- Complex business logic
- Non-obvious workarounds (with explanation)
- TODO items for future work

**JSDoc/TSDoc:**
- Minimal usage in codebase
- Not enforced by linting

## Function Design

**Size:** Keep functions focused and small

**Parameters:**
- Use interfaces for related parameters
- Optional parameters with defaults

```typescript
interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultAssigneeId?: string;
  canChangeAssignee?: boolean;
}
```

**Return Values:**
- Always explicit return types for API routes
- Use `Promise<T>` for async functions

## Component Patterns

**Functional Components:**
- Use functional components with explicit props
- Server components by default
- Add `'use client'` only when needed (hooks, browser APIs, event handlers)

**ClassName Merging:**
- Use `cn()` utility from `@/lib/utils`
```typescript
import { cn } from "@/lib/utils";

className={cn(
  "base-class",
  condition && "conditional-class",
  variant === "primary" && "bg-primary"
)}
```

**Data Fetching:**
- Use TanStack React Query for server state
- Avoid useEffect for data fetching

```typescript
const { data: employees = [] } = useQuery<Employee[]>({
  queryKey: ["employees"],
  queryFn: async () => {
    const res = await fetch("/api/employees");
    const json = await res.json();
    return json.data || [];
  },
});
```

## State Management

**Server State:** TanStack React Query
**Client State:** Zustand stores in `@/lib/stores`
**UI State:** Local state (keep minimal)

Example from `src/lib/stores/ui.ts`:
```typescript
import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp">) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  // ...
}));
```

## Database (Prisma)

**Client Pattern:** Single instance via `@/lib/prisma`
```typescript
// src/lib/prisma.ts
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Usage:**
- Always use transactions for multi-step operations
- Include related records with `include`
- Use proper relation names (singular for to-one, plural for to-many)

## Module Design

**Exports:**
- Named exports preferred
- Re-export from barrel files in `index.ts`

**Barrel Files:**
- Used in stores: `src/lib/stores/index.ts`
- Not heavily used in components

---

*Convention analysis: 2026-04-09*