# CLAUDE.md - Project Guide

> ⚠️ **IMPORTANT**: Before any changes, read `/plans/task.md` for task system requirements.

---

## Quick Reference

| Need | Go To |
|------|-------|
| Database queries | Section 1 |
| State management | Section 2 |
| UI/UX design | Section 3 |
| Code rules | Section 4 |
| Colors | Section 5 |
| Testing | Section 11 |

---

## 1. Database & Supabase

### Supabase Skill
Use the supabase-postgres-best-practices skill for database operations:
```bash
npx skills add supabase-postgres-best-practices
```
Then reference it in prompts.

### Prisma Setup
- Use Prisma with pg adapter for queries
- Database connection: PrismaClient with pg adapter (see src/lib/prisma.ts)

### Example Queries
```typescript
import { prisma } from "@/lib/prisma";

// Regular query
const data = await prisma.raw_materials.findMany();

// With filters
const data = await prisma.tasks.findMany({
  where: { status: "in_progress" },
  include: { assignee: true }
});
```

### Raw SQL
```typescript
await prisma.$queryRaw`SELECT * FROM table_name`;
```

### Connection Pooling (already implemented)
```typescript
// src/lib/prisma.ts - use this pattern
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

### New Table Creation
⚠️ **ALWAYS ask user before creating new tables:**
- Table name?
- Columns & data types?
- Primary key?
- Constraints?

---

## 2. State Management

### When to Use What?

| Use Case | Use Tool |
|----------|----------|
| API data fetching | TanStack Query (`useQuery`) |
| API mutations | TanStack Query (`useMutation`) |
| Optimistic updates | TanStack Query (`onMutate`) |
| Background refetch | TanStack Query (automatic) |
| UI state (modals, sidebar) | Zustand |
| Form state | React `useState` |
| Global app state | Zustand |

### React Query Pattern
```typescript
// Fetch
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ["key"],
  queryFn: () => fetch("/api/data").then(r => r.json()),
  staleTime: 60000,
  enabled: true,
});

// Mutate
const mutation = useMutation({
  mutationFn: (data) => fetch("/api/data", { method: "POST", body: JSON.stringify(data) }),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ["key"] });
    const previousData = queryClient.getQueryData(["key"]);
    queryClient.setQueryData(["key"], (old) => [...old, newData]);
    return { previousData };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(["key"], context?.previousData);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["key"] });
  }
});
mutation.mutate({ ... });
```

### React Query - Caching Behavior
- **staleTime**: Kitne time tak data "fresh" rahega
- **gcTime**: Kitne time tak unused cache rahega
- **Refetch triggers**: Mount, Window focus, Network reconnect, Manual refetch()

### React Query - All States
```typescript
const { 
  isLoading,      // First time loading (no data)
  isFetching,     // Background fetching
  isError,        // Error occurred
  isSuccess,      // Data loaded successfully
  isPending,      // Mutation in progress
  error,          // Error object
  data,           // Response data
} = useQuery({...});
```

### React Query - Dependent Queries
```typescript
// Query B chalega tabhi jab Query A complete ho
const { data: user } = useQuery({
  queryKey: ["user", userId],
  enabled: !!userId,
});
```

### React Query - Select/Transform Data
```typescript
const { data } = useQuery({
  queryKey: ["tasks"],
  queryFn: fetchTasks,
  select: (data) => data.filter(task => task.status === "completed")
});
```

### Zustand Pattern
```typescript
// Create
const useStore = create((set) => ({ 
  count: 0, 
  setCount: (c) => set({ count: c }) 
}));
// Use
const { count } = useStore();
```

### Zustand with Persistence
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set) => ({ items: [] }),
    { name: "my-store" }
  )
);
```

### Zustand Best Practices
1. Keep UI state separate from server state
2. Use for modals, sidebars, theme, user preferences
3. Can use `persist` middleware for localStorage
4. Don't use Zustand for API data - use React Query

---

## 3. UI/UX Design

### Design System
- **Colors**: Primary #E8C547, Secondary #1A1A1A, BG #F5F4EE
- **Style**: Data-Dense Dashboard
- **Icons**: Lucide React (no emojis)

### UI/UX Tasks
1. Run: `python .opencode/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system`
2. Follow Pre-Delivery Checklist:
   - Use Lucide icons (no emojis)
   - `cursor-pointer` on clickable elements
   - Smooth hover transitions (150-300ms)
   - Proper text contrast

### Toast Notifications
```typescript
import { useUIStore } from "@/lib/stores";
const { addNotification } = useUIStore();
addNotification({ type: "success", message: "Done!" });
```

### Toast Types
| Type | Color | Use Case |
|------|-------|----------|
| success | Green (#16A34A) | Successful operations |
| error | Red (#DC2626) | Failed operations |
| warning | Amber (#F59E0B) | Warnings |
| info | Blue (#3B82F6) | Information |

### Toast Notes
- Use `ToastContainer` component for auto-display
- Or render notifications manually
- Add timeout logic for auto-remove (5 seconds)

---

## 4. Implementation Rules

### Tech Stack (MUST FOLLOW)
| Layer | Technology |
|-------|-------------|
| Framework | Next.js 16 (App Router) |
| State - Server | TanStack Query |
| State - Client | Zustand |
| Database | PostgreSQL + Prisma 7 |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Email | Supabase Edge Functions |

### Code Style
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Styling: Tailwind only (no inline)
- Types: Always define (no `any`)
- DRY: Don't repeat yourself

### Folder Structure
```
src/
├── app/
│   ├── api/[resource]/route.ts   # API
│   └── [route]/page.tsx          # Pages
├── components/[feature]/*.tsx    # Components
├── lib/
│   ├── prisma.ts                 # DB
│   ├── supabase.ts               # Auth
│   └── stores/                   # Zustand
```

### API Rules
```typescript
// Response format
return NextResponse.json({ data: result });
return NextResponse.json({ error: "message" }, { status: 400 });

// Auth check
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Server Error |

### Import Order
```typescript
// 1. React/Next
// 2. Third-party (TanStack, etc.)
// 3. Internal components
// 4. Internal lib (prisma, etc.)
// 5. UI components
```

### Error Handling
- API: `{ error: "user-friendly message" }`
- Frontend: Toast notifications + loading states
- HTTP Codes: 200, 400, 401, 403, 404, 500

### Security
- Passwords: Supabase Auth only (never store)
- Role checks: Frontend + Backend both
- Env variables: All sensitive data

---

## 5. Theme Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #E8C547 | Buttons, highlights |
| Secondary | #1A1A1A | Text |
| Background | #F5F4EE | Page BG |
| Success | #16A34A | Success |
| Error | #DC2626 | Errors |
| Warning | #F59E0B | Warnings |

### Status Colors
| Status | Color |
|--------|-------|
| Not Started | Gray (#9CA3AF) |
| In Progress | Blue (#3B82F6) |
| Review | Yellow (#F59E0B) |
| Completed | Green (#16A34A) |

### Priority Colors
| Priority | Color |
|----------|-------|
| Low | Gray (#6B7280) |
| Medium | Yellow (#E8C547) |
| High | Orange (#F97316) |
| Urgent | Red (#DC2626) |

---

## 6. Real-time Implementation

### Subscribe to DB Changes
```typescript
const channel = supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, 
    (payload) => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  )
  .subscribe();
```

### Realtime Tables
- `tasks` - Task changes
- `task_comments` - Comments
- `subtasks` - Subtask updates
- `task_time_logs` - Time tracking

---

## 7. Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Prisma (pooling) |
| `DIRECT_URL` | Migration |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (secret!) |

---

## 8. Implementation Order (Task System)

1. Setup → env, supabase client
2. Database → schema, migration
3. Auth → register, login, logout
4. Real-time → subscriptions
5. Employees → API + Page
6. Tasks → API + Pages
7. Kanban Board → drag-drop
8. Email → Edge Functions
9. Integration → sidebar, filters

---

## 9. Future Developer Guidelines

> ⚠️ **BEFORE making ANY changes:**
> 1. Read `/plans/task.md` for requirements
> 2. Read existing code in `/src/`
> 3. Follow these rules strictly
> 4. Don't change tech stack without approval
> 5. Don't remove existing functionality
> 6. Always test before deploy

---

## 10. Zustand Store Structure

### Store Files
```
src/lib/stores/
├── index.ts         # Barrel exports
├── ui.ts            # UI state (sidebar, modal, theme, notifications)
├── auth.ts          # Auth state (user, role, session)
└── tasks.ts         # Task state (filters, selected task)
```

### Store Responsibilities
| Store | State | Usage |
|-------|-------|-------|
| `ui.ts` | sidebar, modal, theme, notifications | UI components |
| `auth.ts` | user, role, isAuthenticated | Login/Register/Auth |
| `tasks.ts` | selectedTaskId, filters | Task page, filters |

### Auth Store Pattern
```typescript
interface AuthStore {
  user: User | null;
  role: "admin" | "worker" | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setRole: (role: "admin" | "worker") => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRole: (role) => set({ role }),
  logout: () => set({ user: null, role: null, isAuthenticated: false }),
}));
```

### Task Store Pattern
```typescript
interface TaskFilters {
  status?: string[];
  priority?: string[];
  assignee_id?: string;
  search?: string;
}

interface TaskStore {
  selectedTaskId: string | null;
  filters: TaskFilters;
  setSelectedTask: (id: string | null) => void;
  setFilters: (filters: Partial<TaskFilters>) => void;
  clearFilters: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  selectedTaskId: null,
  filters: {},
  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
}));
```

---

## 11. Testing Rules

> ⚠️ **IMPORTANT**: Jo AI feature banaye, WOH TEST STEPS BATAYE!

### AI Ki Responsibility
1. Har feature build karne ke BAAD, test steps likhna
2. Test steps user-friendly aur clear hone chahiye
3. Expected result + actual result compare karna

### Test Report Format (HAR FEATURE KE LIYE)
```markdown
## Testing Checklist - [Feature Name]

### Test Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result:
- [What should happen]

### Actual Result (User verify):
- [User fills this]

### Pass/Fail:
- [ ]
```

### Manual Testing Workflow
```
AI builds feature
    ↓
AI provides test steps
    ↓
User manually tests
    ↓
User reports pass/fail
    ↓
If fail → AI fixes issue
```

### Example Test Steps (Register Page)
```markdown
## Testing - Register Page

### Test Steps:
1. Open http://localhost:3000/register
2. Enter Name: "Test User"
3. Enter Email: "test@example.com"
4. Enter Password: "test123456"
5. Click "Register" button

### Expected Result:
- If first user → Redirect to /login with admin role
- If not first user → Show error "Only admin can add users"

### Actual Result (User verify here):
_______________________

### Pass: [ ] | Fail: [ ]
```

---

## 12. Implementation Testing Requirements

### Har Feature Ke Liye Test Checklist

| Feature | Core Tests |
|---------|------------|
| **Register** | First user = admin, validation, redirect |
| **Login** | Correct creds, wrong creds, role check |
| **Logout** | Clear session, redirect |
| **Create Task** | Form validation, DB insert, list update |
| **Update Task** | Status change, DB update, real-time |
| **Delete Task** | Remove from DB, list update |
| **Subtasks** | Add, toggle complete, progress bar |
| **Comments** | Add comment, real-time update |
| **Time Tracking** | Add time, total calculation |
| **Kanban Board** | Drag-drop, status update |
| **Real-time** | Multi-tab sync test |
| **Email** | Notification trigger, content |

### User Testing Protocol
1. AI har feature ke liye test steps dega
2. User manual test karega
3. User result report karega
4. Issues → AI fix karega
5. Success → Next feature

---

## 13. Code Review Checklist (Before Deliver)

- [ ] TypeScript types defined (no `any`)
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Toast notifications for actions
- [ ] Real-time subscriptions working
- [ ] Role-based access enforced
- [ ] Test steps provided for user