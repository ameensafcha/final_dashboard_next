<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md - Agent Coding Guidelines

This file provides guidelines for agents operating in this repository.

## Project Overview

- **Framework**: Next.js 16.2.2 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Supabase
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State**: Zustand for client state, TanStack React Query for server state

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start Next.js dev server

# Build
npm run build            # Production build
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
npm run lint --fix       # Auto-fix ESLint issues

# Type checking
npx tsc --noEmit         # Run TypeScript compiler check
```

**No test framework is currently configured.** If adding tests, use Vitest for React/Next.js.

### Running Single Test (when tests are added)

```bash
# With Vitest
npm run test -- <test-file>
npm run test -- --run src/lib/utils.test.ts

# With Jest
npm test -- --testPathPattern=utils
```

### Database

```bash
# Prisma commands
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio
```

## Code Style Guidelines

### Imports

- Use path aliases: `@/*` maps to `./src/*`
- Order imports: external libraries → internal lib → components → types
- Use explicit type imports: `import { type NextResponse } from "next/server"`

```typescript
// Correct
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

// Avoid
import { NextResponse } from "next/server";
```

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Use Prettier (integrated with ESLint)

### TypeScript

- Enable strict mode - always define types
- Use explicit return types for API routes
- Avoid `any` - use `unknown` or proper types

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

### Naming Conventions

- **Files**: kebab-case for utilities (`auth-helper.ts`), PascalCase for components and API routes
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase, use verb prefix (`getCurrentUser`, `createProduct`)
- **Types/Interfaces**: PascalCase with optional `T` prefix for types (`type Product`, `interface ProductProps`)

### Error Handling

- API routes must wrap in try-catch
- Return appropriate HTTP status codes:
  - `200` for success
  - `400` for bad request (validation errors)
  - `401` for unauthorized
  - `500` for server errors

```typescript
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized"); // Returns 401
    }
    // ... logic
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
```

### API Routes

- Always use `export const dynamic = 'force-dynamic'` for dynamic routes
- Use URL search params for DELETE requests
- Validate request body before processing
- Include related data with Prisma `include`

### Component Patterns

- Use functional components with explicit props
- Use `cn()` utility from `@/lib/utils` for className merging
- Server components by default, add `'use client'` only when needed
- Prefer React Query for data fetching, not useEffect

### State Management

- **Server state**: TanStack React Query
- **Client state**: Zustand stores in `@/lib/stores`
- **UI state**: Keep minimal, use local state

### Database (Prisma)

- Always use transactions for multi-step operations
- Include related records with `include`
- Use proper relation names (singular for to-one, plural for to-many)

### Tailwind CSS

- Use Tailwind v4 syntax (no config file needed, use CSS variables)
- Use `cn()` for conditional classes
- Follow mobile-first approach
- Use semantic class names (e.g., `bg-primary` not `bg-blue-500`)

### Security

- Never expose secrets in API responses
- Always validate user authentication
- Use parameterized queries (Prisma handles this)
- Sanitize user inputs

## Available Skills

The following skills are available in `.agents/skills/`:

- `supabase-postgres-best-practices` - Postgres optimization and best practices
- `nextjs-best-practices` - Next.js App Router patterns
- `database-design` - Database schema and indexing
- `ui-ux-pro-max` - UI/UX design patterns

## File Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   │   └── [resource]/route.ts
│   └── (routes)/        # Page routes
├── components/          # React components (shadcn)
├── hooks/               # Custom hooks
├── lib/                 # Utilities, stores, clients
│   ├── prisma.ts        # Prisma client
│   ├── supabase.ts      # Supabase client
│   ├── auth-helper.ts   # Auth utilities
│   └── stores/          # Zustand stores
└── types/               # TypeScript types
```

## Key Conventions

1. **API Routes**: Located in `src/app/api/*/route.ts`, handle GET/POST/PUT/DELETE
2. **Dynamic Routes**: Use folder names like `[id]/route.ts`
3. **Prisma Client**: Single instance via `@/lib/prisma`
4. **Auth Pattern**: Use `getCurrentUser()` helper, return `authResponse()` for unauthorized
