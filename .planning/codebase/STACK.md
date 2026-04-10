# Technology Stack

**Analysis Date:** 2026-04-10

## Languages

**Primary:**
- TypeScript 5 - All source code in `src/` directory
- JavaScript (JSX/TSX) - React components throughout

**Secondary:**
- SQL - PostgreSQL database queries via Prisma

## Runtime

**Environment:**
- Node.js (version not pinned via .nvmrc)

**Package Manager:**
- npm (with `package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.2.2 - Full-stack React framework, App Router
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**Database & ORM:**
- Prisma 7.6.0 - ORM for PostgreSQL
- @prisma/client 7.6.0 - Prisma client library
- @prisma/adapter-pg 7.6.0 - PostgreSQL adapter for Prisma
- pg 8.20.0 - PostgreSQL driver

**Authentication:**
- @supabase/supabase-js 2.101.1 - Supabase client (auth + realtime)
- @supabase/ssr 0.10.0 - Supabase SSR helpers

**State Management:**
- Zustand 5.0.12 - Lightweight client-side state management
- @tanstack/react-query 5.96.2 - Server state management and caching

**UI Components & Styling:**
- shadcn 4.1.2 - Headless UI component library
- @base-ui/react 1.3.0 - Unstyled components
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- class-variance-authority 0.7.1 - Type-safe CSS class merging
- tailwind-merge 3.5.0 - Merges conflicting Tailwind classes
- clsx 2.1.1 - Utility for classname concatenation
- lucide-react 1.7.0 - Icon library

**Drag & Drop:**
- @dnd-kit/core 6.3.1 - Headless drag-and-drop library
- @dnd-kit/sortable 10.0.0 - Sortable preset for dnd-kit
- @dnd-kit/utilities 3.2.2 - Utility functions for dnd-kit

**Development:**
- Vitest 4.1.4 - Test runner
- @playwright/test 1.59.1 - E2E testing
- ESLint 9 - Code linting
- eslint-config-next 16.2.2 - Next.js ESLint config

## Configuration

**Environment:**
- `.env` - Contains Supabase and database credentials
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`

**Build Config:**
- `tsconfig.json` - TypeScript with path aliases (`@/*` → `./src/*`)
- `next.config.ts` - Next.js configuration with Turbopack enabled

---

*Stack analysis: 2026-04-10*