# Task Manager Redesign Plan v2.0

## Table of Contents
1. [Current Architecture](#1-current-architecture)
2. [All Issues Identified](#2-all-issues-identified)
3. [Proposed Architecture](#3-proposed-architecture)
4. [Implementation Phases](#4-implementation-phases)
5. [Changes by File](#5-changes-by-file)
6. [Testing Checklist](#6-testing-checklist)
7. [Dependencies](#7-dependencies)
8. [Implementation Order](#8-implementation-order)

---

## 1. Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  /tasks          │  /tasks/my-tasks    │  /tasks/board    │  Sidebar  │
│  (All Tasks)     │  (My Tasks)         │  (Kanban)        │  Menu     │
└────────┬─────────┴────────┬──────────┴────────┬────────┴─────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  GET /api/tasks    - Role-based filtering only (search bug exists)     │
│  POST /api/tasks   - Any logged-in user can create                     │
│  PUT /api/tasks    - Creator/Assignee can update ALL fields (no limit) │
│  DELETE /api/tasks - Admin/Creator only ✅                              │
│  .../subtasks/*    - Permission checks OK ✅                           │
│  .../comments/*    - Permission checks OK ✅                           │
│  .../time-logs/*   - Permission checks OK ✅                           │
└────────┬────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL + Prisma)                    │
├─────────────────────────────────────────────────────────────────────────┤
│  tasks ─────┬──── subtasks ──── task_comments ──── task_time_logs     │
│             │                                                           │
│       employees (assignee, creator) ◄──────────────────────────────── │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. All Issues Identified

### 🔴 Critical Issues

| # | Issue | File | Line | Impact |
|---|-------|------|------|--------|
| 1 | PUT allows ALL fields for any user | `api/tasks/route.ts` | 215–230 | Assignee can change title, priority, assignee_id etc. |
| 2 | `tasks/page.tsx` has NO auth check | `app/tasks/page.tsx` | 8–15 | All tasks fetched without login check — admin page unprotected |
| 3 | Search filter OR merge security bug | `api/tasks/route.ts` | 77–82 | Non-admin sees other users' tasks if title/description matches |
| 4 | `tasks/route.ts` uses old auth pattern | `api/tasks/route.ts` | 5–25 | Inconsistent — own `getSupabaseServerClient()` instead of `getCurrentUser()` |

### 🟡 Medium Issues

| # | Issue | File | Impact |
|---|-------|------|--------|
| 5 | Assignee field editable for non-admin | `task-form.tsx` | Non-admin can freely change task assignee |
| 6 | `defaultAssigneeId` not sent in mutation | `task-form.tsx` line 88–95 | Auto-assign breaks if user doesn't touch dropdown |
| 7 | Non-admin fetches full employees list | `task-form.tsx` line 73–80 | Privacy — all employee names visible to any role |
| 8 | Edit/Delete shown to all users | `tasks-table.tsx` | UI not respecting permissions |
| 9 | Assignee column visible in My Tasks | `tasks-table.tsx` | Unnecessary/confusing in filtered view |
| 10 | `board/page.tsx` no user/role context | `board/page.tsx` | Form shows assignee dropdown to all users |

### ⚪ Minor Issues

| # | Issue | File | Impact |
|---|-------|------|--------|
| 11 | Dead imports | `app/tasks/page.tsx` | `TaskForm`, `Button`, `Plus` imported but never used |
| 12 | 2 Add Task buttons | `my-tasks/page.tsx` + table | Already partially fixed via `!filterAssigneeId` check in table |

---

## 3. Proposed Architecture (After Redesign)

### Permission Matrix — PUT `/api/tasks`

```
┌─────────────┬──────────────┬──────────────┬─────────────────────┐
│   Field     │    Admin     │   Creator    │     Assignee        │
├─────────────┼──────────────┼──────────────┼─────────────────────┤
│ title       │     ✅       │      ✅       │        ❌           │
│ description │     ✅       │      ✅       │        ❌           │
│ area        │     ✅       │      ✅       │        ❌           │
│ status      │     ✅       │      ✅       │        ✅ (only)    │
│ priority    │     ✅       │      ✅       │        ❌           │
│ assignee_id │     ✅       │      ✅       │        ❌           │
│ due_date    │     ✅       │      ✅       │        ✅           │
│ start_date  │     ✅       │      ✅       │        ✅           │
│ completed_at│     ✅       │      ✅       │        ✅           │
└─────────────┴──────────────┴──────────────┴─────────────────────┘
```

### Frontend Component Props (After)

```
TasksTable Props:
  initialData?:       Task[]      — SSR data
  filterAssigneeId?:  string      — hides assignee col + filters
  currentUserId?:     string      — for edit/delete permission
  currentUserRole?:   string      — "admin" | "employee" | etc.

TaskForm Props:
  open:               boolean
  onClose:            () => void
  task?:              Task | null  — editing mode
  defaultAssigneeId?: string      — auto-assign
  canChangeAssignee?: boolean     — admin only (default: false)
```

### Search Filter Logic (Fixed)

```
Non-admin:
  WHERE (created_by = me OR assignee = me)
  AND   (title LIKE search OR description LIKE search)   ← nested AND

Admin:
  WHERE (title LIKE search OR description LIKE search)
```

---

## 4. Implementation Phases

---

### Phase 0 — Auth Standardization in `tasks/route.ts`

**File:** `src/app/api/tasks/route.ts`

**Problem:** This route has its own `getSupabaseServerClient()` function defined locally. All other routes in the project were standardized to use `getCurrentUser()` from `auth-helper.ts`. This one was missed.

**Remove:**
```typescript
// DELETE this entire function (lines 5–25):
async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const { createServerClient } = await import("@supabase/ssr");
  return createServerClient( ... );
}
```

**Replace all 4 auth blocks (GET, POST, PUT, DELETE) with:**
```typescript
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

// In each handler:
const user = await getCurrentUser();
if (!user) return authResponse("Unauthorized");
```

**After this change:**
- `user.id` → replaces `user.id` (same)
- `user.isAdmin` → replaces `currentEmployee.role?.name === "admin"`
- Remove all `prisma.employees.findUnique(...)` calls that were only for role check

---

### Phase 1 — Backend Security Fixes

**File:** `src/app/api/tasks/route.ts`

#### Fix A — Field-level permissions in PUT

**Current problem (line 215–230):**
```typescript
// No field restrictions — assignee can change anything:
data: {
  ...(title && { title }),
  ...(priority && { priority }),
  ...(assignee_id !== undefined && { assignee_id: assignee_id || null }),
  // ...
}
```

**Fix:**
```typescript
const isAdminOrCreator = user.isAdmin || existingTask.created_by === user.id;

// Fields allowed for Admin + Creator
const fullUpdate = {
  ...(title !== undefined && { title }),
  ...(description !== undefined && { description }),
  ...(area !== undefined && { area }),
  ...(status !== undefined && { status }),
  ...(priority !== undefined && { priority }),
  ...(assignee_id !== undefined && { assignee_id: assignee_id || null }),
  ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
  ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
  ...(completed_at !== undefined && { completed_at: completed_at ? new Date(completed_at) : null }),
};

// Fields allowed for Assignee only
const restrictedUpdate = {
  ...(status !== undefined && { status }),
  ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
  ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
  ...(completed_at !== undefined && { completed_at: completed_at ? new Date(completed_at) : null }),
};

const updateData = isAdminOrCreator ? fullUpdate : restrictedUpdate;
```

#### Fix B — Search filter OR merge security bug

**Current bug (line 77–82):**
```typescript
// Role filter:
where.OR = [{ created_by: user.id }, { assignee_id: user.id }];

// Search merges into SAME OR → non-admin sees unowned tasks via title match:
where.OR = [...(where.OR || []), { title: contains }, { desc: contains }];
// Becomes: WHERE (created_by=me OR assignee=me OR title LIKE OR desc LIKE)  ← WRONG
```

**Fix:**
```typescript
if (!user.isAdmin) {
  const roleFilter = { OR: [{ created_by: user.id }, { assignee_id: user.id }] };
  if (search) {
    where.AND = [
      roleFilter,
      {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  } else {
    where.OR = roleFilter.OR;
  }
} else if (search) {
  where.OR = [
    { title: { contains: search, mode: "insensitive" } },
    { description: { contains: search, mode: "insensitive" } },
  ];
}
```

---

### Phase 2 — `tasks/page.tsx` Auth Guard + Cleanup

**File:** `src/app/tasks/page.tsx`

**Problems:**
- No auth check — server fetches all tasks from Prisma with zero verification
- Dead imports: `TaskForm`, `Button`, `Plus` imported but never used
- `currentUserId` and `currentUserRole` not passed to `TasksTable`

**Fix:**
```typescript
import { getCurrentUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/tasks-table";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/dashboard");

  const tasks = await prisma.tasks.findMany({
    include: { assignee: true, creator: true, subtasks: true },
    orderBy: { created_at: "desc" },
  });

  const serializedTasks = tasks.map((task) => ({
    // ... same serialization as before
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>All Tasks</h1>
          <p className="text-gray-600">View and manage all tasks</p>
        </div>
      </div>
      <TasksTable
        initialData={serializedTasks}
        currentUserId={user.id}
        currentUserRole={user.role ?? undefined}
      />
    </div>
  );
}
```

---

### Phase 3 — `tasks-table.tsx` UI Fixes

**File:** `src/components/tasks-table.tsx`

**Changes:**
1. Add `currentUserId` and `currentUserRole` to props interface
2. Hide Assignee column when `filterAssigneeId` is set
3. Conditional Edit/Delete based on who created the task

```typescript
interface TasksTableProps {
  initialData?: Task[];
  filterAssigneeId?: string;
  currentUserId?: string;     // NEW
  currentUserRole?: string;   // NEW
}

export function TasksTable({
  initialData = [],
  filterAssigneeId,
  currentUserId,
  currentUserRole,
}: TasksTableProps) {

  // In table header — hide assignee column for My Tasks:
  {!filterAssigneeId && (
    <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Assignee</th>
  )}

  // In table rows — hide assignee cell:
  {!filterAssigneeId && (
    <td className="p-4">
      {task.assignee ? (
        <div className="flex items-center gap-2">
          <Avatar name={task.assignee.name} size="sm" />
          <span className="text-sm text-gray-600">{task.assignee.name}</span>
        </div>
      ) : (
        <span className="text-sm text-gray-400">-</span>
      )}
    </td>
  )}

  // Conditional Edit/Delete per row:
  const isAdmin = currentUserRole === "admin";
  const canEdit   = isAdmin || task.creator?.id === currentUserId;
  const canDelete = isAdmin || task.creator?.id === currentUserId;

  {canEdit && (
    <button
      onClick={() => { setEditingTask(task); setShowForm(true); }}
      className="text-gray-600 hover:text-gray-800 text-sm"
    >
      <Edit className="w-4 h-4" />
    </button>
  )}
  {canDelete && (
    <button
      onClick={() => { if (confirm("Delete this task?")) deleteMutation.mutate(task.id); }}
      className="text-red-600 hover:text-red-800 text-sm"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )}
```

---

### Phase 4 — `task-form.tsx` Fixes

**File:** `src/components/task-form.tsx`

**Changes:**
1. Add `canChangeAssignee?: boolean` prop (default: `false`)
2. Skip employees query if `canChangeAssignee` is false (privacy fix)
3. Fix mutation to always include `defaultAssigneeId` as fallback
4. Show disabled input instead of dropdown when `!canChangeAssignee`

```typescript
interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultAssigneeId?: string;
  canChangeAssignee?: boolean;   // NEW — default false
}

export function TaskForm({
  open, onClose, task, defaultAssigneeId, canChangeAssignee = false
}: TaskFormProps) {

  // Skip employees fetch when user cannot change assignee:
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const json = await res.json();
      return json.data || [];
    },
    enabled: canChangeAssignee,   // NEW — don't fetch for non-admin
  });

  // Fix: in createMutation body — always fallback to defaultAssigneeId:
  assignee_id: data.assignee_id || defaultAssigneeId || null,   // FIXED

  // Fix: in updateMutation body — same fallback:
  assignee_id: data.assignee_id || defaultAssigneeId || null,   // FIXED

  // Conditional assignee field in form:
  <div>
    <label className="block text-sm font-medium mb-1">Assignee</label>
    {canChangeAssignee ? (
      <select
        value={formData.assignee_id}
        onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg text-sm"
      >
        <option value="">Unassigned</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>{emp.name}</option>
        ))}
      </select>
    ) : (
      <input
        value="You (auto-assigned)"
        disabled
        className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
      />
    )}
  </div>
```

---

### Phase 5 — Page Updates (Wire Everything Together)

**File:** `src/app/tasks/page.tsx` ← Covered in Phase 2

---

**File:** `src/app/tasks/my-tasks/page.tsx`

Pass `currentUserId`, `currentUserRole`, and `canChangeAssignee=false`:

```typescript
"use client";
import { useAuth } from "@/contexts/auth-context";
import { TasksTable } from "@/components/tasks-table";
import { TaskForm } from "@/components/task-form";

export default function MyTasksPage() {
  const [showForm, setShowForm] = useState(false);
  const { user, role } = useAuth();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>My Tasks</h1>
          <p className="text-gray-600">Tasks assigned to you</p>
        </div>
        <Button onClick={() => setShowForm(true)} style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}>
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      {user && (
        <TasksTable
          filterAssigneeId={user.id}
          currentUserId={user.id}
          currentUserRole={role ?? undefined}
        />
      )}

      <TaskForm
        open={showForm}
        onClose={() => setShowForm(false)}
        defaultAssigneeId={user?.id}
        canChangeAssignee={false}     // User cannot change assignee
      />
    </div>
  );
}
```

---

**File:** `src/app/tasks/board/page.tsx`

Pass `canChangeAssignee` based on role to the Add Task form:

```typescript
"use client";
import { useAuth } from "@/contexts/auth-context";

export default function KanbanPage() {
  const [showForm, setShowForm] = useState(false);
  const { role } = useAuth();
  const isAdmin = role === "admin";

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Kanban Board</h1>
          <p className="text-gray-600">Drag tasks between columns to update status</p>
        </div>
        <Button onClick={() => setShowForm(true)} style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}>
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <TaskBoard />
      </div>

      <TaskForm
        open={showForm}
        onClose={() => setShowForm(false)}
        canChangeAssignee={isAdmin}   // Only admin can pick assignee
      />
    </div>
  );
}
```

---

## 5. Changes by File

| # | File | What Changes | Phase |
|---|------|-------------|-------|
| 1 | `src/app/api/tasks/route.ts` | Remove `getSupabaseServerClient()`, use `getCurrentUser()` in all 4 handlers | 0 |
| 2 | `src/app/api/tasks/route.ts` | Field-level permissions in PUT (admin/creator vs assignee) | 1 |
| 3 | `src/app/api/tasks/route.ts` | Fix search filter OR merge bug | 1 |
| 4 | `src/app/tasks/page.tsx` | Add auth guard + redirect, remove dead imports, pass user/role to table | 2 |
| 5 | `src/components/tasks-table.tsx` | Add `currentUserId`/`currentUserRole` props, hide assignee col, conditional edit/delete | 3 |
| 6 | `src/components/task-form.tsx` | Add `canChangeAssignee` prop, fix `defaultAssigneeId` in mutation, skip employees fetch | 4 |
| 7 | `src/app/tasks/my-tasks/page.tsx` | Pass `currentUserId`/`currentUserRole`/`canChangeAssignee=false` | 5 |
| 8 | `src/app/tasks/board/page.tsx` | Pass `canChangeAssignee={isAdmin}` to form | 5 |
| 9 | `prisma/schema.prisma` | No changes needed | — |

---

## 6. Testing Checklist

### Backend
- [ ] Admin PUT: can update title, description, priority, assignee_id, area
- [ ] Creator PUT: can update all fields of own task
- [ ] Assignee-only PUT: can ONLY update status, due_date, start_date, completed_at
- [ ] Assignee-only PUT: CANNOT update title, description, priority, assignee_id, area → returns 403
- [ ] Non-admin search: only returns tasks where created_by=me OR assignee=me (not title-only match)
- [ ] Admin search: returns all tasks matching title/description
- [ ] DELETE: admin can delete any task
- [ ] DELETE: creator can delete own task
- [ ] DELETE: non-creator non-admin gets 403

### Auth / Access Control
- [ ] `/tasks` redirects to `/login` if not logged in
- [ ] `/tasks` redirects to `/dashboard` if logged in but not admin
- [ ] API returns 401 on all endpoints if not logged in

### All Tasks Page (`/tasks`) — Admin only
- [ ] Admin can see all tasks
- [ ] Edit button visible on all rows
- [ ] Delete button visible on all rows
- [ ] Assignee column visible

### My Tasks Page (`/tasks/my-tasks`) — All users
- [ ] Only tasks assigned to current user visible
- [ ] Assignee column HIDDEN
- [ ] Edit button ONLY on tasks I created
- [ ] Delete button ONLY on tasks I created
- [ ] Add Task form: assignee field shows "You (auto-assigned)" and is disabled
- [ ] Add Task form: employees list NOT fetched (check network tab)
- [ ] New task auto-assigned to current user

### Kanban Board (`/tasks/board`)
- [ ] Admin: Add Task form shows enabled assignee dropdown
- [ ] Non-admin: Add Task form shows disabled assignee field

---

## 7. Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Supabase Auth | ✅ Ready | Already integrated |
| Prisma | ✅ Ready | Already integrated |
| React Query | ✅ Ready | Already integrated |
| `getCurrentUser()` | ✅ Ready | Standardized in all routes except tasks (will fix in Phase 0) |
| `role` in auth-context | ✅ Ready | Returns `"admin"` / `"employee"` / `"guest"` |

---

## 8. Implementation Order

```
Phase 0  →  Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5
(Auth      (Backend     (tasks/     (Table       (Form        (Pages
 standard)  security)   page.tsx    component)   component)   wiring)
                        auth guard)
```

Each phase is independent enough to test before moving to the next.

---

*Document Version: 2.0*
*Last Updated: 2026-04-08*
