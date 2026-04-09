# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript 5.x - Full-stack TypeScript across all source files

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js (Next.js runtime)
- Next.js 16.2.2 (App Router)

**Package Manager:**
- npm (package.json based)
- Lockfile: Not present in repository

## Frameworks

**Core:**
- Next.js 16.2.2 - React framework with App Router, Turbopack enabled
- React 19.2.4 - UI library for both client and server components

**State Management:**
- TanStack React Query 5.96.2 - Server state fetching/caching
- Zustand 5.0.12 - Client-side state management

**UI:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- shadcn/ui 4.1.2 - Component library built on Radix UI
- Base UI 1.3.0 - Headless UI primitives from MUI
- Lucide React 1.7.0 - Icon library

**Database:**
- Prisma 7.6.0 - ORM with PostgreSQL adapter
- @prisma/adapter-pg 7.6.0 - PostgreSQL-specific Prisma adapter

**Testing:**
- No test framework configured (as per project documentation)

## Key Dependencies

**Authentication:**
- @supabase/ssr 0.10.0 - Server-side Supabase utilities
- @supabase/supabase-js 2.101.1 - Supabase JavaScript client

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Drag and drop primitives
- @dnd-kit/sortable 10.0.0 - Sortable list components
- @dnd-kit/utilities 3.2.2 - Drag and drop utilities

**Utilities:**
- class-variance-authority 0.7.1 - Class variance utility
- clsx 2.1.1 - Conditional class names
- tailwind-merge 3.5.0 - Tailwind class merging
- tw-animate-css 1.4.0 - CSS animations
- dotenv 17.4.0 - Environment variable loading
- pg 8.20.0 - PostgreSQL client

## Configuration

**Environment:**
- `.env` file present (contains secrets - not read)
- `prisma.config.ts` uses `DIRECT_URL` environment variable for database
- `src/lib/prisma.ts` uses `DATABASE_URL` environment variable

**Build:**
- `next.config.ts` - Next.js configuration with Turbopack and allowed dev origins
- `tsconfig.json` - TypeScript configuration with path aliases (@/* maps to ./src/*)
- `eslint.config.mjs` - ESLint with Next.js rules
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin

**TypeScript:**
- Strict mode enabled
- Module resolution: bundler
- JSX: react-jsx

## Platform Requirements

**Development:**
- Node.js (version not specified)
- npm for package management

**Production:**
- Next.js deployment (hosting platform not specified in codebase)
- PostgreSQL database
- Supabase project for authentication

---

*Stack analysis: 2026-04-09*