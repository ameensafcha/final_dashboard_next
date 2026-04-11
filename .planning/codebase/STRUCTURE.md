# STRUCTURE - Directory Layout

## Root Structure

```
claude2/
├── src/                    # Source code
├── prisma/                 # Database schema + seed
│   ├── schema.prisma
│   └── seed.ts           # Permission seeding
├── public/                 # Static assets
├── .next/                  # Build output (generated)
├── package.json            # Dependencies
└── .env                   # Environment variables
```

## Source Structure (`src/`)

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Auth endpoints (sync, employee, logout, role)
│   │   ├── users/         # User endpoints (permissions)
│   │   ├── roles/         # Role management + permissions
│   │   ├── employees/     # Employee management
│   │   ├── tasks/         # Task management
│   │   ├── raw-materials/  # Inventory
│   │   ├── stocks/         # Stock management
│   │   ├── products/       # Product management
│   │   ├── production/     # Production
│   │   └── ...
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard
│   ├── admin/             # Admin panel
│   ├── inventory/         # Inventory module
│   │   ├── raw-materials/
│   │   ├── stocks/
│   │   └── receiving/
│   ├── products/          # Products module
│   ├── production/        # Production module
│   │   ├── batches/
│   │   └── finished-products/
│   ├── tasks/             # Tasks module
│   └── finance/           # Finance module
│
├── components/            # React components
│   ├── ui/               # shadcn UI components
│   ├── app-sidebar.tsx   # Main navigation (permission-based)
│   ├── auth-guard.tsx    # Route protection
│   └── ...
│
├── contexts/              # React contexts
│   └── auth-context.tsx  # Auth state + permissions
│
├── lib/                   # Utilities and clients
│   ├── prisma.ts         # Prisma client (singleton)
│   ├── supabase.ts       # Supabase client
│   ├── auth-helper.ts    # Auth utilities (getCurrentUser, guards)
│   ├── permissions.ts    # Permission config (PERMISSIONS, LABELS)
│   ├── utils.ts          # Utility functions (cn)
│   └── stores/           # Zustand stores
│
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── middleware.ts          # Next.js middleware (edge)
```

## Key File Locations

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Auth redirect at edge, logged-in user redirect |
| `src/lib/auth-helper.ts` | Server auth + permission helpers |
| `src/lib/permissions.ts` | Permission constants and labels |
| `src/contexts/auth-context.tsx` | Client auth state |
| `src/components/app-sidebar.tsx` | Navigation with permission filter |
| `src/app/api/auth/sync/route.ts` | Create employee on first login |
| `prisma/schema.prisma` | Database schema |

---

*Structure documented: 2026-04-11*