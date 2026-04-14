# Project: claude2 - Inventory & Task Command Center

## Project Overview
claude2 is a high-fidelity, comprehensive management system built for inventory tracking and mission-critical task orchestration. It combines a sophisticated manufacturing/inventory backend with a specialized "Daily Command Center" for high-impact task management.

### Key Modules
- **Inventory & Manufacturing:** Tracks the full lifecycle of raw materials, flavor mixing (batches), product variants (sizes/skus), and real-time stock levels.
- **Task Management System:** A full-featured task tracker supporting assignments, subtasks, attachments, time logs, and real-time notifications.
- **Daily Command Center:** A specialized module for daily planning, featuring "Priority Alpha" (high impact) and "Priority Beta" (tactical) tasks, automated scoring, carryover logic for unfinished missions, and blocker resolution.
- **Finance & People:** Tracks transactions and manages employee roles (RBAC) and profiles.

### Technical Stack
- **Framework:** Next.js 16 (App Router) with React 19.
- **Database:** PostgreSQL (Supabase) with Prisma ORM.
- **Authentication:** Supabase Auth with SSR support and Middleware protection.
- **UI/UX:** Tailwind CSS 4, Shadcn UI, and Lucide icons.
- **State Management:** TanStack Query (React Query) for server state, Zustand for local client state.
- **Testing:** Vitest for unit/integration tests, Playwright for E2E.

---

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Sync database schema (Prisma -> Supabase)
npx prisma db push

# Seed initial data
npm run db:seed
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Testing & Quality
```bash
# Run unit tests
npm run test

# Run linting
npm run lint
```

---

## Development Conventions

### 1. UI Design System (The Luminous Dashboard)
**Strict Adherence to `DESIGN.md` is mandatory.**
- **Precedence:** `DESIGN.md` (Light theme, Organic Atelier) takes absolute precedence over any UI descriptions in `plan/plan.md` (which may refer to older dark-themed designs).
- **Aesthetic:** "Organic Atelier" - warm, sun-drenched, high-end editorial feel.
- **Color Palette:** Base surface is `#fbfaf1`. Use warm tones and glassmorphism.
- **The "No-Line" Rule:** Prohibition of 1px solid borders for sectioning. Use background color shifts (tonal layering) or vertical space instead.
- **Typography:** Manrope for Display/Headlines (geometric, modern); Inter for Titles/Body (high legibility).
- **Rounding:** High corner radius for all containers (`2rem` to `3rem`).

### 2. Architecture Patterns
- **Routes:** Next.js App Router (`src/app`). Group logical modules (e.g., `/inventory`, `/tasks`, `/admin`).
- **Auth Guard:** Middleware handles session validation and redirects. Use `src/lib/auth.ts` for server-side user retrieval.
- **Data Fetching:** Use React Query for client-side fetching to benefit from caching and loading states.
- **API Design:** RESTful endpoints located in `src/app/api`. Ensure consistent error handling and Zod validation.
- **Database:** Always update `prisma/schema.prisma` first and use `npx prisma db push` to sync.

### 3. Task Logic (Daily Command Center)
- **Tiers:** Tier 1 (Alpha) for mission-critical objectives; Tier 2 (Beta) for velocity gains.
- **Status:** Support for `PENDING`, `COMPLETED`, `BLOCKED`, and `ARCHIVED`.
- **Carryover:** Unfinished tasks are automatically identified and offered for "Re-Deployment" on the next day's plan.
- **Blockers:** Marking a task as `BLOCKED` requires a reason and action owner. Resolving a blocker or marking a blocked task as `DONE` must clear blocker metadata.
