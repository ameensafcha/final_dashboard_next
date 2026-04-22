<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## prisma db push bilkul nhi krna sirf migrate use krna hai 

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

# Testing (Vitest)
npm run test             # Run all tests
npm run test -- src/lib/utils.test.ts  # Run single test file
npm run test:watch       # Run tests in watch mode
npx vitest run           # Direct vitest invocation

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma studio        # Open Prisma Studio
npm run db:seed          # Seed database
```

## Code Style Guidelines

### Imports
- Use path aliases: `@/*` maps to `./src/*`
- Order: external libraries → internal lib → components → types
- Use explicit type imports: `import { type NextResponse } from "next/server"`

```typescript
// Correct
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Avoid
import { NextResponse } from "next/server";
```

### Formatting
- 2 spaces for indentation, single quotes for strings, trailing commas
- Use Prettier (integrated with ESLint)

### TypeScript
- Always define types - enable strict mode
- Use explicit return types for API routes
- Avoid `any` - use `unknown` or proper types

```typescript
// Correct
export async function GET(): Promise<NextResponse> {
  const products = await prisma.products.findMany();
  return NextResponse.json(products);
}
```

### Naming Conventions
- **Files**: kebab-case (`auth-helper.ts`), PascalCase for components
- **Variables/Functions**: camelCase with verb prefix (`getCurrentUser`)
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase (`type Product`, `interface ProductProps`)

### Error Handling
- API routes must wrap in try-catch
- Return appropriate HTTP status codes:
  - `200` success, `400` bad request, `401` unauthorized, `500` server error

```typescript
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
```

### API Routes
- Use `export const dynamic = 'force-dynamic'` for dynamic routes
- Use URL search params for DELETE requests
- Validate request body before processing

### Component Patterns
- Functional components with explicit props
- **Modular**: Complex features in directories (`src/components/resource/resource-table/`)
- **Logic Extraction**: Custom hooks (`use-resource.ts`) for data fetching/state
- Use `cn()` from `@/lib/utils` for className merging
- Server components by default, add `'use client'` only when needed
- Prefer React Query over useEffect for data fetching

### State Management
- **Server**: TanStack React Query
- **Client**: Zustand stores in `@/lib/stores`
- **UI**: Local state or modular hooks

### Database (Prisma)
- Use transactions for multi-step operations
- Include related records with `include`

### Tailwind CSS
- Use Tailwind v4 syntax, `cn()` for conditional classes
- Mobile-first approach
- **No-Line Rule**: Avoid 1px borders; use tonal shifts or space
- **STRICT RULE**: Always use CSS variables from `global.css`. Never hardcode colors, fonts, or spacing.
- All UI must follow DESIGN.md

### UI Components (shadcn/ui)
- Use shadcn/ui components from `@/components/ui/`
- **For dropdowns/selects**: Use `DropdownMenu` instead of native `<select>` or `Select`

### Typography
- Use typography classes from `global.css`: `.text-section`, `.text-body-light`, `.text-code-label`, etc.

### Security
- Never expose secrets in API responses
- Always validate user authentication
- Sanitize user inputs

## File Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/             # API routes
│   └── (routes)/        # Page routes
├── components/          # React components
│   └── [feature]/
│       └── [sub-feature]/
├── hooks/               # Global custom hooks
├── lib/                 # Utilities, stores, clients
└── types/               # TypeScript types
```

## Key Conventions

1. API routes: `src/app/api/*/route.ts`
2. Modular UI: Separate rendering from logic
3. DESIGN.md is the foundation for UI work
4. Prioritize inline editing and real-time feedback

## Available Skills

- `supabase-postgres-best-practices` - Postgres optimization
- `nextjs-best-practices` - Next.js App Router patterns
- `database-design` - Schema and indexing
- `ui-ux-pro-max` - UI/UX design patterns