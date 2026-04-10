# Architecture

**Analysis Date:** 2026-04-10

## Pattern Overview

**Overall:** Next.js App Router with Server Components and Client Components

**Key Characteristics:**
- Server-first architecture using Next.js 16 with React 19
- Role-Based Access Control (RBAC) at multiple levels: middleware, API routes, server components
- Hybrid authentication using Supabase for auth and Prisma for user metadata
- Client-side state: Zustand + React Context
- Server-side database: Prisma ORM via PostgreSQL
- Real-time updates: Supabase Realtime subscriptions

## Layers

**Authentication & Authorization:**
- Location: `src/lib/auth-helper.ts`, `src/lib/auth-rbac.ts`, `src/lib/permissions.ts`
- Exports: `getCurrentUser()`, `requireRole()`, `requirePermission()`, `requireAdmin()`

**Data Access:**
- Location: `src/app/api/` (route handlers)
- Pattern: RESTful API endpoints with authorization checks

**Presentation:**
- Location: `src/app/` (pages), `src/components/` (reusable components)

**Middleware:**
- Location: `src/middleware.ts`
- Purpose: Session validation, route protection

**Real-time:**
- Location: `src/hooks/use-realtime-subscription.ts`, `src/hooks/use-realtime-connection-status.ts`
- Purpose: Live database updates without page refresh

## Key Abstractions

**AuthUser:** `{ id, email, role, isAdmin }` - returned by `getCurrentUser()`

**Role Hierarchy:** `['viewer', 'employee', 'admin']` - index-based permission check

**RealtimeSubscription:** Supabase channel management for live updates

**Prisma Client:** Singleton instance in `src/lib/prisma.ts`

---

*Architecture analysis: 2026-04-10*