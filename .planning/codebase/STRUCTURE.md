# Codebase Structure

**Analysis Date:** 2026-04-10

## Directory Layout

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # Auth endpoints
│   │   ├── notifications/        # Notification endpoints (v1.1)
│   │   ├── tasks/                # Task CRUD
│   │   └── [resource]/          # Other domain entities
│   ├── login/                    # Login page
│   ├── dashboard/                # Main dashboard
│   ├── admin/                    # Admin panel
│   └── tasks/                    # Task pages (board, my-tasks)
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   └── notification-center.tsx  # Notification UI (v1.1)
├── contexts/                    # React Context
│   └── auth-context.tsx          # Auth state
├── hooks/                        # Custom hooks
│   ├── use-mobile.ts
│   ├── use-realtime-subscription.ts    # Real-time (v1.1)
│   └── use-realtime-connection-status.ts # Connection status (v1.1)
├── lib/                          # Utilities
│   ├── auth-helper.ts            # Auth utilities
│   ├── auth-rbac.ts              # RBAC logic
│   ├── permissions.ts            # Permission definitions
│   ├── prisma.ts                 # Prisma client
│   ├── supabase.ts               # Supabase client
│   ├── utils.ts                  # Utilities (cn())
│   └── stores/                   # Zustand stores
│       ├── ui.ts
│       ├── notifications.ts      # v1.1
│       └── index.ts
└── middleware.ts                 # Route protection
```

## Key Files

- `src/lib/auth-helper.ts` - Core auth functions
- `src/lib/prisma.ts` - Database client
- `src/hooks/use-realtime-subscription.ts` - Real-time hook
- `src/middleware.ts` - Session validation

---

*Structure analysis: 2026-04-10*