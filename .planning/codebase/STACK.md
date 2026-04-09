# Technology Stack

**Analysis Date:** 2026-04-09

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
- @tailwindcss/postcss 4.2.2 - PostCSS plugin for Tailwind
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
- jsdom 29.0.2 - DOM implementation for Node.js testing
- ESLint 9 - Code linting
- eslint-config-next 16.2.2 - Next.js ESLint config
- TypeScript types for React, React DOM, Node.js

**Other Utilities:**
- dotenv 17.4.0 - Environment variable loading
- tw-animate-css 1.4.0 - Tailwind animation utilities

## Build & Development Tools

**Build System:**
- Next.js with Turbopack (enabled in `next.config.ts`)
- PostCSS 4.2.2 - CSS preprocessing (configured in `postcss.config.mjs`)

**Code Quality:**
- ESLint with Next.js and TypeScript configurations
- Prettier (no explicit config, likely integrated with ESLint)

## Configuration

**Environment:**
- `.env` file present - Contains Supabase and database credentials
- Environment variables required:
  - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role (server-side only)
  - `DATABASE_URL` - PostgreSQL connection string
  - `DIRECT_URL` - Direct PostgreSQL connection (for Prisma)

**Build Configuration:**
- `tsconfig.json` - TypeScript configuration with path aliases (`@/*` → `./src/*`)
- `next.config.ts` - Next.js configuration with Turbopack enabled
- `prisma.config.ts` - Prisma schema location and direct URL configuration
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser with ES2017+ support
- PostgreSQL database (local or remote)
- Supabase account for authentication

**Production:**
- Node.js runtime (typical Next.js deployment targets: Vercel, AWS, etc.)
- PostgreSQL database
- Supabase Auth service
- Environment variables configured in deployment platform

## Additional Notes

**Adapter Pattern:**
- Prisma uses native PostgreSQL adapter (`@prisma/adapter-pg`) with direct pg Pool for better control
- Connection pooling managed through pg Pool with single PrismaClient instance

**Module Resolution:**
- Path alias `@/*` enables imports like `@/lib/auth-helper` instead of relative paths
- Bundler-based module resolution for Next.js 13+

---

*Stack analysis: 2026-04-09*
