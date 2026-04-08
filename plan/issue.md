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

## Summary Table - COMPLETED

| Priority | Issue | Status | Notes |
|----------|-------|--------|-------|
| 1 | Add loading.tsx | ✅ Done | All routes implemented |
| 2 | Add error.tsx | ✅ Done | All routes implemented |
| 3 | Real-time updates (Issue #8) | ✅ Done | Tasks + Raw Materials + Stocks |
| 4 | Metadata improvements | ✅ Done | OpenGraph, Twitter cards added |
| 5 | Server Component conversion | ✅ Done | tasks, raw-materials, stocks |
| 6 | Hardcoded login credentials | ⚠️ Pending | Need to remove from login/page.tsx |

---

## Next Steps - REMAINING

1. **Remove hardcoded credentials** from login/page.tsx
2. **Apply real-time** to other pages (production, receiving, etc.) - optional
3. **Fix Providers wrapper** - optional performance improvement
4. **Organize route groups** - optional code organization

---

## Completed Implementation Checklist

- [x] Enable Supabase Realtime on database (user ran SQL)
- [x] Update tasks/page.tsx to Server Component
- [x] Update tasks-table.tsx with subscribe logic
- [x] Update raw-materials/page.tsx to Server Component
- [x] Update raw-materials-table.tsx with subscribe logic
- [x] Update stocks/page.tsx to Server Component
- [x] Create stocks-table.tsx with subscribe logic
- [x] Add loading.tsx to all routes
- [x] Add error.tsx to all routes
- [x] Update metadata in layout.tsx

---

## Pages with Real-time Enabled

| Page | Type | Real-time Tables |
|------|------|-----------------|
| `/tasks` | Server + Client | tasks |
| `/raw-materials` | Server + Client | raw_materials |
| `/stocks` | Server + Client | raw_materials, variant_inventory, powder_stock |

---

## Remaining Issues

1. **Hardcoded login credentials** - Remove default email/password in login/page.tsx ✅ FIXED
2. **Other pages** - Can apply same pattern if needed

---

## Issue #9: Database-Level Stock Calculation (CRITICAL)

### Problem
Stocks calculation currently happens on **frontend/API level**, not database level.

### Current Flow (Not Good)
```
Packing Receive Entry → packing_receive_items (table)
                           ↓
                    [NO AUTO UPDATE]
                           ↓
                    variant_inventory (STALE)
                           ↓
Stocks page → Shows wrong/old data
```

### Target Flow (Like Tasks - Working)
```
Packing Receive Entry → packing_receive_items (table)
                           ↓
                    [DATABASE TRIGGER]
                           ↓
                    variant_inventory (auto-updated)
                           ↓
Stocks page → Always accurate data
```

---

### Why This Matters

| Approach | DB Work | Frontend Work | Real-time |
|----------|---------|---------------|-----------|
| **Current** (API calculate) | ❌ | ✅ High | Complex |
| **Proposed** (Stock tables + Triggers) | ✅ | ✅ Low | Simple |

---

### Solution: Add Stock Tables with Triggers

Create **dedicated stock tables** that auto-update via database triggers:

#### New Tables to Create

```sql
-- 1. Raw Material Stock Table
CREATE TABLE raw_material_stock (
  id          String PRIMARY KEY,  -- links to raw_materials.id
  name        String,
  quantity    Float,
  unit        String,
  price_per_kg Float,
  updated_at  DateTime @default(now())
);

-- 2. Product Stock Table  
CREATE TABLE product_stock (
  variant_id  String PRIMARY KEY,
  quantity    Int,
  updated_at  DateTime @default(now())
);

-- 3. Powder Stock Table
CREATE TABLE powder_stock_new (
  id              Int PRIMARY KEY DEFAULT 1,
  received        Float,
  sent            Float,
  available       Float,
  updated_at      DateTime @default(now())
);
```

#### Triggers to Auto-Update

```sql
-- Trigger: raw_material_stock on receiving_materials
CREATE OR REPLACE FUNCTION update_raw_material_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE raw_material_stock 
    SET quantity = quantity + NEW.quantity, updated_at = NOW()
    WHERE id = NEW.raw_material_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE raw_material_stock 
    SET quantity = quantity - OLD.quantity, updated_at = NOW()
    WHERE id = OLD.raw_material_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE raw_material_stock 
    SET quantity = quantity - OLD.quantity + NEW.quantity, updated_at = NOW()
    WHERE id = NEW.raw_material_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER raw_material_stock_trigger
AFTER INSERT OR UPDATE OR DELETE ON receiving_materials
FOR EACH ROW EXECUTE FUNCTION update_raw_material_stock();

-- Trigger: product_stock on packing_receive_items
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_stock 
    SET quantity = quantity + NEW.quantity, updated_at = NOW()
    WHERE variant_id = NEW.variant_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_stock 
    SET quantity = quantity - OLD.quantity, updated_at = NOW()
    WHERE variant_id = OLD.variant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_stock_trigger
AFTER INSERT OR DELETE ON packing_receive_items
FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Trigger: powder_stock_new on finished_products + packing_logs
-- (Calculate: available = sum(finished_products) - sum(packing_logs))
```

---

### User Action Required (Supabase SQL)

```sql
-- Step 1: Create new stock tables
CREATE TABLE raw_material_stock (
  id          String PRIMARY KEY,
  name        String,
  quantity    Float DEFAULT 0,
  unit        String DEFAULT 'kg',
  price_per_kg Float,
  updated_at  DateTime DEFAULT NOW()
);

CREATE TABLE product_stock (
  variant_id  String PRIMARY KEY,
  quantity    Int DEFAULT 0,
  updated_at  DateTime DEFAULT NOW()
);

CREATE TABLE powder_stock_new (
  id              Int PRIMARY KEY DEFAULT 1,
  received        Float DEFAULT 0,
  sent            Float DEFAULT 0,
  available       Float DEFAULT 0,
  updated_at      DateTime DEFAULT NOW()
);

-- Step 2: Enable realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE raw_material_stock, product_stock, powder_stock_new;
ALTER TABLE raw_material_stock REPLICA IDENTITY FULL;
ALTER TABLE product_stock REPLICA IDENTITY FULL;
ALTER TABLE powder_stock_new REPLICA IDENTITY FULL;

-- Step 3: Create triggers (functions + triggers)
-- (Add functions from above)

-- Step 4: Initialize stock tables with current data
INSERT INTO raw_material_stock (id, name, quantity, unit, price_per_kg)
SELECT id, name, quantity, unit, price_per_kg FROM raw_materials;

INSERT INTO product_stock (variant_id, quantity)
SELECT variant_id, COALESCE(quantity, 0) FROM variant_inventory;

INSERT INTO powder_stock_new (received, sent, available)
SELECT 
  COALESCE(SUM(quantity), 0),
  COALESCE(SUM(total_kg), 0),
  COALESCE(SUM(quantity), 0) - COALESCE(SUM(total_kg), 0)
FROM finished_products, packing_logs;
```

---

### Frontend Changes Required

After triggers setup, stocks page will be simpler:

```tsx
// src/app/stocks/page.tsx - Simplified
export default async function StocksPage() {
  const [rawMaterials, products, powder] = await Promise.all([
    prisma.raw_material_stock.findMany(),      // Direct from stock table
    prisma.product_stock.findMany({ include: { variant: {...} } }),
    prisma.powder_stock_new.findFirst(),
  ]);
  
  // No calculation needed - data already calculated in DB!
  return <StocksTable initialData={...} />;
}
```

---

### Benefits

1. ✅ **Accurate** - Always correct stock numbers
2. ✅ **Fast** - No calculation on every request
3. ✅ **Simple real-time** - Just subscribe to stock tables
4. ✅ **Scalable** - Works for multi-user

---

### Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add new stock models |
| `src/app/stocks/page.tsx` | Simplify to read from stock tables |
| `src/components/stocks-table.tsx` | Subscribe to new stock tables |
| Supabase SQL | Create tables + triggers |

---

**Reference**: 
- Next.js Best Practices Skill - `.agents/skills/nextjs-best-practices/SKILL.md`
- Supabase Realtime: https://supabase.com/docs/guides/realtime