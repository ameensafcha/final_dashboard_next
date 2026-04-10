# Roadmap: Real-time Task Management Dashboard

**Project**: Real-time Task Management Dashboard  
**Core Value**: Users get notified instantly when work happens, never miss a task assignment or important comment

## Current Milestone

### v2.0 Codebase Improvements

**Goal:** Fix codebase concerns, improve code quality, and address technical debt

### Phase 1: fix all concern in ocdebase

**Goal:** Fix all concerns in the codebase including tech debt, performance issues, security vulnerabilities, and fragile areas
**Requirements**: CONCERN-TECH-DEBT, CONCERN-PERFORMANCE, CONCERN-SECURITY, CONCERN-FRAGILE
**Depends on:** Phase 0
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Fix tech debt (any types, duplicate definitions, error logging)
- [x] 01-02-PLAN.md — Fix performance issues (polling, re-renders, N+1 queries)
- [x] 01-03-PLAN.md — Fix security and fragile areas (middleware roles, auth sync)

### Phase 2: Fix edge runtime crypto module error

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 1
**Plans:** 1/1 plans complete

Plans:
- [x] 02-01-PLAN.md — Fix Edge Runtime crypto error by using Node.js runtime for middleware

### Phase 3: Fix notification real-time delay

**Goal:** Enable real-time notifications by enabling Supabase Realtime on the notifications table
**Requirements**: TBD
**Depends on:** Phase 2
**Plans:** 1/1 plans complete

Plans:
- [x] 03-01-PLAN.md — Enable real-time notifications via REPLICA IDENTITY

### Phase 4: Fix dashboard and realtime issues

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 3
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 4 to break down)

---

## Phases

### Phase 5: Dashboard Rebuild with Proper Auth

**Goal:** Rebuild dashboard components with correct auth checks and proper data fetching
**Requirements**: DASH-AUTH, DASH-PROPER-FILTERING, DASH-PERFORMANCE
**Depends on:** Phase 4
**Plans:** 3/3 plans complete

Plans:
- [x] 05-01-PLAN.md — Database-level role-based task filtering
- [x] 05-02-PLAN.md — Guard realtime subscriptions with auth context loading
- [x] 05-03-PLAN.md — Comprehensive testing and verification of auth filtering
