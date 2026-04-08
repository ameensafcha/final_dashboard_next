# Next.js Best Practices Audit Report

**Project**: Inventory Management App  
**Rating**: 4/10  
**Date**: April 2026

---

## Executive Summary

Project Next.js App Router use kar raha hai, but bahut se best practices follow nahi ho rahe. Isse performance, SEO, aur user experience affected ho raha hai. Niche detailed issues aur solutions diye gaye hain.

---

## Issue #1: Excessive Client Components

### Problem
Pages aur components me `use client` zyada use ho raha hai jabki Next.js me Server Components default hote hain.

### Current Code
```tsx
// src/app/tasks/page.tsx:1
"use client";
// 🔴 Pure page client hai - koi server-side benefit nahi
```

### Impact
- Client bundle size bada
- Server-side rendering benefits waste
- SEO affected

### Solution
```
Decision: Page me interactivity (useState, useEffect) nahi hai?
- Yes → Server Component (default)
- No → Client Component ('use client')

Pattern: Server parent + Client child
```

### Code Changes Needed
```tsx
// src/app/tasks/page.tsx - Server Component
import { TasksTable } from "@/components/tasks-table"; // Client Component
import { getTasks } from "@/lib/actions"; // Server action

export default async function TasksPage() {
  const tasks = await getTasks(); // Server-side fetch
  
  return (
    <div className="p-6">
      <TasksTable initialData={tasks} /> {/* Client component with data */}
    </div>
  );
}
```

### Benefit
- Initial page load faster
- Better SEO
- Smaller client bundle

---

## Issue #2: Missing Loading States

### Problem
Koi bhi route me `loading.tsx` file nahi hai.

### Impact
- Users ko kuch dikhega nahi jab data load ho raha hai
- Poor UX

### Solution
Har route me `loading.tsx` add karna.

### Code Example
```tsx
// src/app/tasks/loading.tsx
export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}
```

### Required Files to Create
- `src/app/tasks/loading.tsx`
- `src/app/dashboard/loading.tsx`
- `src/app/receiving/loading.tsx`
- `src/app/production/loading.tsx`
- `src/app/stocks/loading.tsx`
- `src/app/finished-products/loading.tsx`
- `src/app/raw-materials/loading.tsx`
- `src/app/finance/loading.tsx`

### Benefit
- Instant visual feedback
- Better perceived performance

---

## Issue #3: Missing Error Boundaries

### Problem
Koi bhi route me `error.tsx` file nahi hai.

### Impact
- App completely crash ho sakta hai error ke baad
- No graceful degradation

### Solution
Har route me `error.tsx` add karna.

### Code Example
```tsx
// src/app/tasks/error.tsx
"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
      <p className="text-gray-600 mt-2">{error.message}</p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
```

### Required Files to Create
- `src/app/tasks/error.tsx`
- `src/app/dashboard/error.tsx`
- `src/app/receiving/error.tsx`
- `src/app/production/error.tsx`
- `src/app/stocks/error.tsx`
- `src/app/finished-products/error.tsx`
- `src/app/raw-materials/error.tsx`
- `src/app/finance/error.tsx`

### Benefit
- Graceful error handling
- Users can recover without full page reload

---

## Issue #4: Client-Side Data Fetching

### Problem
TanStack Query se sab data client-side fetch ho raha hai.

### Current Code
```tsx
// src/components/tasks-table.tsx:49
const { data: tasks = [] } = useQuery<Task[]>({
  queryKey: ["tasks", filterAssigneeId],
  queryFn: async () => {
    const res = await fetch(`/api/tasks?${params}`);
    return json.data || [];
  },
});
```

### Impact
- Har request me data fetch hota hai
- Server-side caching benefits nahi milte
- SEO ke liye content available nahi

### Solution
Server Component me data fetch karo, client ko pass karo.

```tsx
// src/components/tasks-table.tsx
"use client";

interface TasksTableProps {
  initialData: Task[]; // Server se data pass karo
}

export function TasksTable({ initialData }: TasksTableProps) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState(initialData); // Initial data use karo
  
  // Abhi bhi mutations client-side
  // Search/filter ke liye client-side filtering
}
```

```tsx
// src/app/tasks/page.tsx - Server Component
import { TasksTable } from "@/components/tasks-table";
import { prisma } from "@/lib/prisma";

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    include: { assignee: true },
  });
  
  return <TasksTable initialData={tasks} />;
}
```

### Benefit
- Server-side caching
- Better SEO
- Faster initial load

---

## Issue #5: Providers Wrapper Forces Client Boundary

### Problem
`Providers` component poori app ko client boundary me daal raha hai.

### Current Code
```tsx
// src/app/layout.tsx:34
<body>
  <Providers>
    <SidebarWrapper />
    <main>{children}</main>
    <ToastContainer />
  </Providers>
</body>
```

```tsx
// src/components/providers.tsx:15
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### Impact
- Poori app client-side render hogi
- Server Components benefits waste

### Solution
Providers ko separate karo:
- `QueryClientProvider` client-side (jaruri)
- `AuthProvider` ko server-side possible ho to

```tsx
// src/components/providers.tsx - Client Component
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => queryClient);
  
  return (
    <QueryClientProvider client={qc}>
      {children}
    </QueryProvider>
  );
}
```

```tsx
// src/contexts/auth-context.tsx - Split
// AuthProvider alag se, ya Server Actions use karo
```

### Benefit
- Layout ke bahar ke portions server me render hongi
- Better performance

---

## Issue #6: No Route Groups

### Problem
Flat folder structure, no organization.

### Current Structure
```
app/
├── tasks/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
├── receiving/
│   └── page.tsx
...
```

### Solution
Route groups use karo.

```
app/
├── (main)/           # URL me dikhega nahi
│   ├── tasks/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── receiving/
│       └── page.tsx
├── (finance)/        # Alag section
│   └── transactions/
│       └── page.tsx
└── (auth)/           # Login/Auth routes
    └── login/
        └── page.tsx
```

### Benefit
- Better code organization
- Shared layouts within groups

---

## Issue #7: Basic Metadata

### Problem
Sirf title aur description hai.

### Current Code
```tsx
// src/app/layout.tsx:18
export const metadata: Metadata = {
  title: "Inventory App",
  description: "Raw materials inventory management",
};
```

### Solution
Full metadata add karo.

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Inventory App",
    default: "Inventory App",
  },
  description: "Raw materials inventory management system",
  openGraph: {
    title: "Inventory App",
    description: "Raw materials inventory management",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Benefit
- Better SEO
- Social media previews

---

## Issue #8: Real-time Updates Missing (CRITICAL for multi-user)

### Problem
Server-side fetching se data ek baar load hota hai, baad me updates nahi dikhte. Multiple users ek saath use kar rahe hain to ek user ka changes dusre ko nahi dikhega.

### Why Server Fetch Alone Won't Work
```
User A updates task → Server fetch (User B ke liye) → Stale data show karega
```

### Current State
- Supabase client available hai (`src/lib/supabase.ts`)
- Lekin real-time subscribe nahi kar raha

### Solution: Hybrid Approach - Server Initial + Client Realtime Subscribe

**Step 1: Server Component se initial data fetch**
```tsx
// src/app/tasks/page.tsx - Server Component
import { TasksTable } from "@/components/tasks-table";
import { prisma } from "@/lib/prisma";

export default async function TasksPage() {
  // Server se initial data fetch - fast initial load
  const tasks = await prisma.task.findMany({
    include: { assignee: true, creator: true },
    orderBy: { created_at: "desc" },
  });
  
  // Tasks ko serialize karo (Dates to strings)
  const serializedTasks = tasks.map(task => ({
    ...task,
    created_at: task.created_at.toISOString(),
    due_date: task.due_date?.toISOString() || null,
    start_date: task.start_date?.toISOString() || null,
    completed_at: task.completed_at?.toISOString() || null,
  }));
  
  return <TasksTable initialData={serializedTasks} />;
}
```

**Step 2: Client Component me real-time subscribe**
```tsx
// src/components/tasks-table.tsx - Updated
"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  // ... other fields
}

interface TasksTableProps {
  initialData: Task[]; // Server se aaya data
}

export function TasksTable({ initialData }: TasksTableProps) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState(initialData); // Initial data use karo

  // Real-time subscription - sab clients ko instant updates milenge
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Change received!', payload);
          
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => 
              prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } as Task : t)
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mutations ke baad bhi update karo
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task deleted" });
    },
  });

  // ... rest of component
}
```

**Step 3: Supabase me enable Realtime**
SQL me ye run karna hoga:
```sql
-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Or individual table
ALTER TABLE tasks REPLICA IDENTITY FULL;
```

### Required Files to Update
- `src/app/tasks/page.tsx` - Server Component banado
- `src/components/tasks-table.tsx` - Real-time subscribe add karo
- Similarly for other pages: dashboard, stocks, production, etc.

### Benefit
- Fast initial page load (server data)
- Real-time updates sab users ko (Supabase channel)
- No manual refresh needed
- Multi-user collaboration support

---

## Summary Table

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 1 | Add loading.tsx | Low | High |
| 2 | Add error.tsx | Low | High |
| 3 | Real-time updates (Issue #8) | Medium | HIGH (Critical) |
| 4 | Fix Providers wrapper | Medium | High |
| 5 | Server-side data + realtime | High | High |
| 6 | Route groups | Medium | Medium |
| 7 | Metadata improvements | Low | Medium |

---

## Next Steps

1. **Immediately**: Add loading.tsx and error.tsx files
2. **High Priority**: Implement real-time with hybrid approach (Issue #8)
3. **Soon**: Fix Providers wrapper
4. **Later**: Apply same pattern to all other pages
5. **Optional**: Organize routes with groups

---

## Real-time Implementation Checklist

- [ ] Enable Supabase Realtime on database
- [ ] Update tasks/page.tsx to Server Component
- [ ] Update tasks-table.tsx with subscribe logic
- [ ] Repeat for other pages (dashboard, stocks, etc.)
- [ ] Test with multiple browser tabs

---

**Reference**: 
- Next.js Best Practices Skill - `.agents/skills/nextjs-best-practices/SKILL.md`
- Supabase Realtime: https://supabase.com/docs/guides/realtime