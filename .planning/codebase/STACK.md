# Technology Stack

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript 5.x - Full-stack type safety, strict mode enabled

**Secondary:**
- CSS (Tailwind v4) - Styling via PostCSS

## Runtime

**Environment:**
- Node.js 20.x (via @types/node)

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: Present (package-lock.json)

## Frameworks

**Core:**
- Next.js 16.2.2 - App Router, React 19 Server Components
- React 19.2.4 - UI framework with Server Components

**State Management:**
- TanStack React Query 5.96.2 - Server state management
- Zustand 5.0.12 - Client state management (stores in `src/lib/stores/`)

**Styling:**
- Tailwind CSS 4.2.2 - Utility-first CSS framework
- shadcn 4.1.2 - Component library (UI primitives)
- class-variance-authority 0.7.1 - Component variant management

**Database:**
- Prisma 7.6.0 - ORM with PostgreSQL adapter
- PostgreSQL - Primary database (via @prisma/adapter-pg and pg driver)

**Authentication:**
- Supabase 2.101.1 - Auth and session management (@supabase/supabase-js, @supabase/ssr)

## Key Dependencies

**UI Components:**
- @base-ui/react 1.3.0 - Headless UI primitives
- @dnd-kit/core 6.3.1 - Drag and drop (Kanban boards)
- @dnd-kit/sortable 10.0.0 - Sortable lists
- @dnd-kit/utilities 3.2.2 - DnD utilities
- lucide-react 1.7.0 - Icon library

**Utility:**
- clsx 2.1.1 - Conditional class names
- tailwind-merge 3.5.0 - Tailwind class merging
- tw-animate-css 1.4.0 - CSS animations

**Database:**
- @prisma/adapter-pg 7.6.0 - PostgreSQL adapter
- pg 8.20.0 - Node PostgreSQL driver
- @types/pg 8.20.0 - TypeScript types

## Configuration

**Environment:**
- `.env` file for local development
- Required variables via `process.env`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL`
  - `DIRECT_URL`

**Build/Config Files:**
- `tsconfig.json` - TypeScript with strict mode, path aliases (@/* → ./src/*)
- `next.config.ts` - Next.js with Turbopack support
- `postcss.config.mjs` - Tailwind CSS via @tailwindcss/postcss
- `eslint.config.mjs` - ESLint with Next.js core-web-vitals and TypeScript rules
- `prisma.config.ts` - Prisma configuration with PostgreSQL

## Platform Requirements

**Development:**
- Node.js compatible environment
- PostgreSQL database (local or hosted)
- Supabase project for authentication

**Production:**
- Deployment target: Vercel or similar Next.js-compatible host
- Requires PostgreSQL connection string
- Requires Supabase project with configured auth

---

*Stack analysis: 2026-04-09*