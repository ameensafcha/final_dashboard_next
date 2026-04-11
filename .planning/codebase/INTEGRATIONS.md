# INTEGRATIONS - External Services

## Database

**PostgreSQL** - Primary database via Prisma ORM

- Connection: Configured via `DATABASE_URL` environment variable
- ORM: Prisma 7.6.0 with PostgreSQL adapter
- Location: `prisma/schema.prisma`

## Authentication

**Supabase Auth** - User authentication

- Provider: `@supabase/supabase-js` v2.101.1
- SSR Support: `@supabase/ssr` v0.10.0
- Auth Flow: Email/password with session management
- Environment Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## External APIs

No external REST APIs currently integrated. All data operations go through:
- Internal API routes (`src/app/api/*`)
- Prisma ORM to PostgreSQL

## Environment Configuration

Required `.env` variables:
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPER_ADMIN_EMAIL=... (optional)
```

---

*Integrations documented: 2026-04-11*