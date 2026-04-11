# Technology Stack

**Analysis Date:** 2026-04-11

## Languages

**Primary:**
- TypeScript 5.x - All application code (src/, API routes, components)

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js (bundled with Next.js 16)

**Package Manager:**
- npm (implied by package.json)
- Lockfile: Not detected in project root

## Frameworks

**Core:**
- Next.js 16.2.2 - Full-stack framework with App Router

**Database ORM:**
- Prisma 7.6.0 - PostgreSQL ORM with connection pooling via `@prisma/adapter-pg`

**Auth:**
- Supabase Auth - `@supabase/ssr` 0.10.0, `@supabase/supabase-js` 2.101.1

**State Management:**
- Zustand 5.0.12 - Client state management
- TanStack React Query 5.96.2 - Server state / data fetching

**Testing:**
- Vitest 4.1.4 - Unit test runner
- jsdom 29.0.2 - DOM environment for tests

**E2E Testing:**
- Playwright 1.59.1 - End-to-end testing framework

**Build/Dev:**
- TypeScript 5.x - Type checking
- ESLint 9 - Linting
- Tailwind CSS 4.2.2 - Utility-first CSS

## Key Dependencies

**Critical:**
- next 16.2.2 - Framework runtime
- @prisma/client 7.6.0 - Database ORM
- pg 8.20.0 - PostgreSQL driver (used with Prisma adapter)

**UI Components:**
- lucide-react 1.7.0 - Icons
- class-variance-authority 0.7.1 - Component variant patterns
- clsx 2.1.1 - Utility for constructing className strings
- tailwind-merge 3.5.0 - Merge Tailwind classes
- @base-ui/react 1.3.0 - Base UI components
- shadcn 4.1.2 - UI component system (custom fork)
- tw-animate-css 1.4.0 - CSS animations for Tailwind

**Drag and Drop:**
- @dnd-kit/core 6.3.1 - Drag and drop primitives
- @dnd-kit/sortable 10.0.0 - Sortable list primitives
- @dnd-kit/utilities 3.2.2 - Drag and drop utilities

**Type Support:**
- @types/pg 8.20.0 - PostgreSQL types
- @types/node 20 - Node.js types
- @types/react 19 - React types

## Configuration

**Environment:**
- `.env` file for runtime configuration (NOT committed)
- Environment variables required:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin operations, secret)
  - `DATABASE_URL` - PostgreSQL connection string

**Build:**
- `next.config.ts` - Next.js configuration with Turbopack
- `tsconfig.json` - Path alias `@/*` maps to `./src/*`
- `vitest.config.ts` - Test runner configuration
- `eslint.config.mjs` - Linting configuration

**Database:**
- `prisma/schema.prisma` - Database schema with PostgreSQL

---

*Stack analysis: 2026-04-11*