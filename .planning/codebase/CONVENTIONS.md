# CONVENTIONS - Code Style

## TypeScript

- **Strict mode enabled** - always define types
- **No `any`** - use `unknown` or proper types
- **Explicit return types** for API routes

```typescript
// Correct
export async function GET(): Promise<NextResponse> {
  const products = await prisma.products.findMany();
  return NextResponse.json(products);
}

// Avoid
export async function GET() {
  const products = await prisma.products.findMany();
  return NextResponse.json(products);
}
```

## Imports

Path aliases via `@/*` → `./src/*`

Order: external libraries → internal lib → components → types

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";
```

## API Routes

- `export const dynamic = 'force-dynamic'` for dynamic routes
- Use URL search params for DELETE requests
- Wrap in try-catch, return proper status codes

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    // ... logic
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

## Components

- Functional components with explicit props
- `'use client'` only when needed (hooks, event handlers)
- Server components by default
- Use `cn()` utility for className merging

## Permissions

- Centralized in `src/lib/permissions.ts`
- Use `requirePermissionApi()` for permission guards
- Use `requireAdminApi()` for admin-only endpoints

## Naming

| Type | Convention | Example |
|------|------------|---------|
| Files (utils) | kebab-case | `auth-helper.ts`, `permissions.ts` |
| Files (components) | PascalCase | `AppSidebar.tsx` |
| Variables | camelCase | `const userId` |
| Functions | camelCase + verb | `getCurrentUser`, `hasPermission` |
| Types | PascalCase | `interface Employee` |

---

*Conventions documented: 2026-04-11*