@AGENTS.md

# Database Work with Supabase

Use the supabase-postgres-best-practices skill for database operations:
```
npx skills add supabase-postgres-best-practices
```

Then reference it in prompts.

## Prisma Setup
- Use Prisma with pg adapter for queries
- Database connection: PrismaClient with pg adapter (see src/lib/prisma.ts)

Example query:
```typescript
import { prisma } from "@/lib/prisma";
const data = await prisma.raw_materials.findMany();
```

For raw SQL:
```typescript
await prisma.$queryRaw`SELECT * FROM table_name`;
```

## Available Tables
- `raw_materials`
- `_prisma_migrations`

## IMPORTANT: Before Creating New Tables

**Before creating any new database table, ALWAYS ask the user:**
1. What columns do you want in the table?
2. What should be the data type of each column? (text, integer, float, date, boolean, etc.)
3. Which column should be the primary key? (usually id)
4. Any other constraints? (nullable, unique, default values)

**Example question to ask:**
```
Table create karne se pehle, mujhe ye info chahiye:
- Table ka naam kya hai?
- Konse columns chahiye? Har column ka data type kya hai?
- Primary key konsa column?
- Koi special constraints?
```

After user confirms, then create:
1. Database table in Supabase
2. Prisma model
3. API routes
4. Store (if needed)
5. UI components

---

# React Query & Zustand Usage Guide

## Setup

**Providers** (src/components/providers.tsx):
```typescript
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60 * 1000 }, // 1 minute cache
      },
    })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**layout.tsx me use karein:**
```typescript
<Providers>{children}</Providers>
```

---

## React Query - Complete Guide

### 1. Fetch Data (useQuery)
```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["raw-materials"],
  queryFn: fetchMaterials,
  enabled: true,        // Query chalega (default: true)
  staleTime: 60000,     // Cache duration in ms (default: 0)
  gcTime: 300000,      // Garbage collection time (default: 5 min)
  refetchOnMount: true,// Mount par refetch kare
  refetchOnWindowFocus: false, // Window focus par refetch nahi
  refetchInterval: false, // Auto refetch interval (false or ms)
  retry: 3,            // Failed request retry count
  retryDelay: 1000,    // Delay between retries
});
```

### 2. Caching Behavior
- **staleTime**: Kitne time tak data "fresh" rahega
- **gcTime**: Kitne time tak unused cache rahega
- **Refetch trigger**: 
  - Mount (refetchOnMount: true)
  - Window focus (refetchOnWindowFocus: true)
  - Network reconnect
  - Manual refetch()

### 3. Manual Refetch
```typescript
const { refetch } = useQuery({...});

// Button click par
<button onClick={() => refetch()}>Refresh</button>
```

### 4. Mutations (Create/Update/Delete)
```typescript
const queryClient = useQueryClient();

const createMutation = useMutation({
  mutationFn: async (newData) => {
    const res = await fetch("/api/raw-materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  },
  // Mutation hooks
  onMutate: async (newData) => {
    // 1. Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["raw-materials"] });
    // 2. Snapshot previous value
    const previousData = queryClient.getQueryData(["raw-materials"]);
    // 3. Optimistically update
    queryClient.setQueryData(["raw-materials"], (old) => [...old, newData]);
    return { previousData };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["raw-materials"], context?.previousData);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
  },
});

// Usage
createMutation.mutate({ name: "Material", quantity: 100 });
```

### 5. All States
```typescript
const { 
  isLoading,      // First time loading (no data)
  isFetching,     // Background fetching
  isError,        // Error occurred
  isSuccess,      // Data loaded successfully
  isPending,      // Mutation in progress (same as isLoading for mutations)
  error,          // Error object
  data,           // Response data
  failureCount,   // How many times failed
  failureReason,  // Last error
} = useQuery({...});
```

### 6. Dependent Queries
```typescript
// Query B chalega tabhi jab Query A complete ho
const { data: user } = useQuery({
  queryKey: ["user", userId],
  enabled: !!userId, // Sirf chalega agar userId exist kare
});
```

### 7. Select/Transform Data
```typescript
const { data } = useQuery({
  queryKey: ["raw-materials"],
  queryFn: fetchMaterials,
  select: (data) => data.filter(item => item.quantity > 0), // Filter data
});
```

---

## Zustand - Local UI State

### Create Store (src/lib/store.ts)
```typescript
import { create } from "zustand";

interface Material {
  id: number;
  name: string;
}

interface Store {
  materials: Material[];
  selectedMaterial: Material | null;
  setMaterials: (materials: Material[]) => void;
  setSelectedMaterial: (material: Material | null) => void;
  addMaterial: (material: Material) => void;
}

export const useStore = create<Store>((set) => ({
  materials: [],
  selectedMaterial: null,
  setMaterials: (materials) => set({ materials }),
  setSelectedMaterial: (material) => set({ selectedMaterial: material }),
  addMaterial: (material) => set((state) => ({ 
    materials: [...state.materials, material] 
  })),
}));
```

### Use in Component
```typescript
import { useStore } from "@/lib/store";

function MyComponent() {
  const { materials, addMaterial } = useStore();
  return <div>{materials.length}</div>;
}
```

### Zustand with Persistence (optional)
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set) => ({ items: [] }),
    { name: "my-store" } // LocalStorage key
  )
);
```

---

## When to Use What?

| Use Case | Use |
|----------|-----|
| API data fetching | React Query (`useQuery`) |
| API create/update/delete | React Query (`useMutation`) |
| Optimistic updates | React Query (`onMutate`) |
| Background refetch | React Query (automatic) |
| UI state (modals, sidebar) | Zustand |
| Form state | React useState |
| Global app state | Zustand |

---

## Best Practices

### React Query
1. Always use `queryClient.invalidateQueries()` after mutations
2. Use `staleTime` to reduce unnecessary refetches
3. Use `enabled` for dependent queries
4. Use `select` to transform data
5. Use `onMutate` for optimistic updates
6. Don't use Zustand for API data - use React Query

### Zustand
1. Keep UI state separate from server state
2. Use for modals, sidebars, theme, user preferences
3. Can use `persist` middleware for localStorage

## Toast Notifications (UI Store)

The app uses Zustand UI store for toast notifications:

### Setup
```typescript
// Already configured in src/lib/stores/ui.ts
import { useUIStore } from "@/lib/stores";
```

### Usage
```typescript
function MyComponent() {
  const { addNotification, removeNotification, notifications } = useUIStore();

  // Show success toast
  addNotification({ type: "success", message: "Operation successful!" });

  // Show error toast
  addNotification({ type: "error", message: "Something went wrong" });

  // Show warning toast
  addNotification({ type: "warning", message: "Please check this" });

  // Show info toast
  addNotification({ type: "info", message: "Some information" });

  // Remove notification manually
  removeNotification(toastId);

  // Render toast container (add in layout or page)
  const notifications = useUIStore((state) => state.notifications);
  // Render using Toast component or inline
}
```

### Toast Types
| Type | Color | Use Case |
|------|-------|----------|
| success | Green | Successful operations |
| error | Red | Failed operations |
| warning | Amber | Warnings |
| info | Blue | Information |

### Important Notes
- Toast auto-display karne ke liye `ToastContainer` component use karein
- Ya notifications ko manually render karein
- Notifications 5 second baad auto-remove ho sakte hain (add timeout logic if needed)

---

# Frontend UI/UX Work

Always use ui-ux-pro-max skill for UI/UX tasks. Before implementing any frontend component:

1. Run design system command to get recommendations:
```bash
python .opencode/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --design-system -p "Project Name"
```

2. Follow the design system output for colors, typography, effects

3. Follow Pre-Delivery Checklist:
   - No emojis as icons (use Lucide/Heroicons)
   - cursor-pointer on clickable elements
   - Smooth hover transitions (150-300ms)
   - Proper text contrast

## Current Design System for Inventory App

- **Colors**: Primary #7C3AED, Secondary #A78BFA, CTA #F97316, BG #FAF5FF, Text #4C1D95
- **Style**: Data-Dense Dashboard