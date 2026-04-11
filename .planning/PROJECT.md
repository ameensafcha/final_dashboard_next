# Project: ERP System

## What This Is

ERP system for manufacturing business with authentication built on Supabase Auth. Manages inventory, products, production, tasks, finance with role-based access control.

## Core Value

Users can securely log in with Supabase Auth and access only the modules and features their assigned role permits — permissions are fully database-driven with admin-managed roles and permissions.

## Requirements

### Active

- [ ] Restructure folder hierarchy: inventory/, products/, production/, finance/
- [ ] Fix routing to match new folder structure
- [ ] Update sidebar navigation with new routes
- [ ] Fix broken links across all pages

### Out of Scope

- Database schema changes
- Adding new features

## Context

- Existing codebase with Next.js App Router
- Supabase Auth already integrated
- PostgreSQL with Prisma ORM
- 20+ models for inventory, production, tasks, finance

## Constraints

- **Tech Stack**: Next.js 16, Supabase Auth, Prisma ORM, PostgreSQL
- **Auth**: Use Supabase Auth as single source of truth
- **Schema**: Don't change existing schema structure

---

*Last updated: 2026-04-11 after folder restructuring*