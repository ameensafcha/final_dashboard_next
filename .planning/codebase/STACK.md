# STACK - Technology Stack

## Languages & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | 5.x | Type-safe JavaScript |
| Next.js | 16.2.2 | React framework with App Router |
| React | 19.2.4 | UI library |
| Node.js | Latest (via Next.js) | Server runtime |

## Core Dependencies

### Framework & UI
- `next` (16.2.2) - App Router framework
- `@tanstack/react-query` (5.96.2) - Server state management
- `zustand` (5.0.12) - Client state management
- `tailwindcss` (4.2.2) - CSS styling
- `shadcn` (4.1.2) - UI component library
- `lucide-react` (1.7.0) - Icons

### Database & ORM
- `@prisma/client` (7.6.0) - Prisma ORM client
- `prisma` (7.6.0) - Prisma CLI
- `@prisma/adapter-pg` (7.6.0) - PostgreSQL adapter
- `pg` (8.20.0) - PostgreSQL driver

### Authentication
- `@supabase/ssr` (0.10.0) - Supabase SSR utilities
- `@supabase/supabase-js` (2.101.1) - Supabase client

### Other
- `@dnd-kit/core` (10.0.0) - Drag & drop
- `class-variance-authority` (0.7.1) - Class variance utility
- `clsx` (2.1.1) - Conditional class names
- `tailwind-merge` (3.5.0) - Tailwind class merging

## Dev Dependencies

- `typescript` (5.x) - TypeScript compiler
- `eslint` (9) + `eslint-config-next` (16.2.2) - Linting
- `vitest` (4.1.4) - Testing framework
- `@playwright/test` (1.59.1) - E2E testing

## Configuration Files

- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint configuration
- `tailwind.config` / PostCSS config - Styling
- `vitest.config.ts` - Test configuration
- `prisma/schema.prisma` - Database schema

## Build Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run",
  "db:seed": "npx tsx prisma/seed.ts"
}
```

---

*Stack documented: 2026-04-11*