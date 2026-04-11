# STRUCTURE - Directory Layout

## Root Structure

```
claude2/
├── src/                    # Source code
├── prisma/                 # Database schema
├── public/                 # Static assets
├── .next/                  # Build output (generated)
├── node_modules/           # Dependencies (generated)
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── next.config.ts         # Next.js config
├── tailwind.config        # Tailwind CSS config
├── eslint.config.mjs      # ESLint config
└── vitest.config.ts       # Test config
```

## Source Structure (`src/`)

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # Route groups (if any)
│   ├── api/               # API routes
│   │   ├── auth/          # Auth endpoints (sync, employee, logout)
│   │   ├── users/         # User endpoints (permissions)
│   │   ├── roles/         # Role management
│   │   ├── employees/     # Employee management
│   │   ├── tasks/         # Task management
│   │   ├── raw-materials/ # Inventory
│   │   ├── stocks/        # Stock management
│   │   ├── products/      # Product management
│   │   ├── production/    # Production
│   │   └── ...
│   ├── login/             # Login page
│   ├── dashboard/         # Dashboard
│   ├── admin/             # Admin panel
│   ├── inventory/         # Inventory module
│   │   ├── raw-materials/
│   │   ├── stocks/
│   │   └── receiving/
│   ├── products/          # Products module
│   │   ├── entry/
│   │   ├── variants/
│   │   ├── flavors/
│   │   └── sizes/
│   ├── production/        # Production module
│   │   ├── batches/
│   │   └── finished-products/
│   ├── tasks/             # Tasks module
│   └── finance/           # Finance module
│       └── transactions/
│
├── components/            # React components
│   ├── ui/               # shadcn UI components
│   ├── app-sidebar.tsx   # Main navigation
│   ├── auth-guard.tsx    # Route protection
│   ├── permission-guard.tsx # Permission protection
│   └── ...               # Feature components
│
├── contexts/              # React contexts
│   └── auth-context.tsx  # Auth state + permissions
│
├── lib/                   # Utilities and clients
│   ├── prisma.ts         # Prisma client (singleton)
│   ├── supabase.ts       # Supabase client
│   ├── auth-helper.ts    # Auth utilities (getCurrentUser, guards)
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
| `src/middleware.ts` | Auth redirect at edge |
| `src/lib/auth-helper.ts` | Server auth + permission helpers |
| `src/contexts/auth-context.tsx` | Client auth state |
| `src/components/app-sidebar.tsx` | Navigation with permission filter |
| `src/app/api/auth/sync/route.ts` | Create employee on first login |
| `prisma/schema.prisma` | Database schema |

## Naming Conventions

- **Files**: kebab-case for utilities, PascalCase for components
- **Functions**: camelCase with verb prefix (`getCurrentUser`, `createProduct`)
- **Types**: PascalCase (`interface Employee`, `type User`)

---

*Structure documented: 2026-04-11*