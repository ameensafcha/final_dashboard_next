# CLAUDE.md - Project Guide

> ⚠️ **IMPORTANT**: This is the inventory management project. Read this before making any changes.

---

## Quick Reference

| Need | Go To |
|------|-------|
| Project Status | Section 1 |
| Auth Flow | Section 2 |
| Database & API | Section 3 |
| State Management | Section 4 |
| UI/UX Design | Section 5 |
| Code Rules | Section 6 |
| Testing | Section 7 |

---

## 1. Project Status

### Current Phase
| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Auth System + Admin Panel |
| Phase 2 | ✅ Complete | Tasks API (GET, POST, PUT, DELETE + subtasks, comments, time-logs) |
| Phase 3 | ✅ Complete | Task Pages (Kanban Board, List View, My Tasks) + Components |
| Phase 4 | ⏳ Not Started | Task Components (remaining) |
| Phase 5 | ⏳ Not Started | Real-time |
| Phase 6 | ⏳ Not Started | Integration |

### Completed Features
- Login page (`/login`)
- Dashboard (`/dashboard`)
- Admin Panel (`/admin/employees`)
- Employee management (Add/Edit/Activate/Deactivate)
- Employee creation via Supabase trigger (auto-creates with guest role)
- Auth via React Context (`useAuth` hook)

---

## 2. Auth Flow (Project Specific)

### How Auth Works
```
1. User logs in at /login
2. Supabase Auth verifies credentials
3. AuthContext fetches employee data + role from DB
4. Role determines menu access:
   - Admin → sees Admin Panel + all tasks
   - Employee → sees only assigned tasks
   - Guest → limited access
```

### Auth Implementation (DO NOT USE ZUSTAND FOR AUTH)
```typescript
// Use this hook (NOT Zustand)
import { useAuth } from "@/contexts/auth-context";

function MyComponent() {
  const { user, employee, role, isLoading, login, logout } = useAuth();
  // role = "admin" | "employee" | "guest" | null
}
```

### Employee Creation Flow
- Supabase Trigger creates employee record with "guest" role when new user registers
- Admin updates role via `/admin/employees` page
- API only updates employee (name, email, is_active) - doesn't create new record

### Roles
- `admin` - Full access (manage employees, all tasks)
- `employee` - Task access (create tasks, assigned tasks)
- `guest` - Limited access (created by trigger, needs role assignment)

---

## 3. Database & API

### Database Tables (from Prisma Schema)
```
employees → roles (FK)
tasks → employees (created_by, assignee_id)
subtasks → tasks (FK, cascade delete)
task_comments → tasks, employees (FK, cascade delete)
task_time_logs → tasks, employees (FK, cascade delete)
```

### API Response Standard
```typescript
// Success
return NextResponse.json({ data: result });

// Error
return NextResponse.json({ error: "message" }, { status: 400 });
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Server Error |

### Auth in API Routes
```typescript
// Get current user from cookies
const cookieStore = await cookies();
const supabase = createServerClient(..., { cookies: { getAll: () => cookieStore.getAll() } });
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Available API Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees (Admin only) |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees` | Update employee |
| DELETE | `/api/employees` | Deactivate employee |
| GET | `/api/tasks` | List tasks (filtered) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks` | Update task |
| DELETE | `/api/tasks` | Delete task |
| GET/POST | `/api/tasks/[id]/subtasks` | Subtask CRUD |
| GET/POST/DELETE | `/api/tasks/[id]/comments` | Comment CRUD |
| GET/POST/DELETE | `/api/tasks/[id]/time-logs` | Time log CRUD |

---

## 4. State Management

### Server State (API Data) - Use React Query
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetch
const { data, isLoading, error } = useQuery({
  queryKey: ["tasks"],
  queryFn: () => fetch("/api/tasks").then(r => r.json()),
});

// Mutate
const mutation = useMutation({
  mutationFn: (data) => fetch("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
});
```

### UI State - Use Zustand
```typescript
// Only for UI state (modals, sidebar, notifications)
import { useUIStore } from "@/lib/stores";

const { addNotification } = useUIStore();
addNotification({ type: "success", message: "Done!" });
```

### When to Use What
| Use Case | Use Tool |
|----------|----------|
| API data fetching | TanStack Query (`useQuery`) |
| API mutations | TanStack Query (`useMutation`) |
| Optimistic updates | TanStack Query (`onMutate`) |
| UI state (modals, toasts) | Zustand (`useUIStore`) |
| Form state | React `useState` |
| Auth state | React Context (`useAuth`) - NOT Zustand |

---

## 5. UI/UX Design

### Design System
- **Primary**: #E8C547 (Amber/Gold)
- **Secondary**: #1A1A1A (Dark)
- **Background**: #F5F4EE (Light cream)
- **Success**: #16A34A
- **Error**: #DC2626
- **Warning**: #F59E0B
- **Info**: #3B82F6

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

### UI Guidelines
- Use Lucide icons (no emojis)
- `cursor-pointer` on clickable elements
- Smooth hover transitions (150-300ms)
- Proper text contrast

### Toast Notifications
```typescript
import { useUIStore } from "@/lib/stores";

const { addNotification } = useUIStore();
addNotification({ type: "success", message: "Saved!" });
```

---

## 6. Code Rules

### Folder Structure
```
src/
├── app/
│   ├── api/[resource]/route.ts   # API routes
│   └── [route]/page.tsx           # Pages
├── components/[feature]/*.tsx     # Components
├── contexts/auth-context.tsx      # Auth (React Context)
├── lib/
│   ├── prisma.ts                  # Database
│   ├── supabase.ts                # Auth client
│   └── stores/ui.ts               # UI state (Zustand)
```

### Tech Stack (DO NOT CHANGE)
| Layer | Technology |
|-------|-------------|
| Framework | Next.js 16 (App Router) |
| State - Server | TanStack Query |
| State - Client | Zustand (UI only) |
| State - Auth | React Context |
| Database | PostgreSQL + Prisma 7 |
| Auth | Supabase Auth |

### Code Style
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- Styling: Tailwind only
- Types: Always define (no `any`)

### Security
- Passwords: Supabase Auth only (never store in DB)
- Role checks: Frontend + Backend both
- Env variables: All sensitive data in `.env`

---

## 7. Testing

### After Each Phase Completion
When a phase is complete, generate test cases for all features built in that phase.

### Test Case Format
```markdown
## Testing - [Feature Name]

### Test Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result:
- [What should happen]

### Actual Result:
_______________________

### Pass: [ ] | Fail: [ ]
```

### Phase 1 Test Cases (Already Complete)

#### Login Page
**Test Steps:**
1. Open http://localhost:3000/login
2. Enter email: "admin@mail.com"
3. Enter password: "123456"
4. Click "Login" button

**Expected Result:**
- Redirect to /dashboard
- Sidebar shows "Admin Panel" link

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Admin Panel Access
**Test Steps:**
1. Login as admin
2. Click "Admin Panel" in sidebar
3. Navigate to /admin/employees

**Expected Result:**
- Page loads without redirect
- Employee table visible

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Add Employee
**Test Steps:**
1. Go to /admin/employees
2. Click "Add Employee" button
3. Fill: Name "Test Employee", Email "test@test.com", Password "password123"
4. Select role
5. Click "Create"

**Expected Result:**
- Employee created successfully
- Toast shows "Employee created"
- New employee appears in table

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Activate/Deactivate Employee
**Test Steps:**
1. Go to /admin/employees
2. Click "Deactivate" on an active employee
3. Confirm in dialog

**Expected Result:**
- Employee status changes to "Inactive"
- Button changes to "Activate"

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

---

### Phase 2 Testing (Tasks API)

#### Create Task via API
**Test Steps:**
1. Send POST to /api/tasks with title, priority, description
2. Include valid auth cookie

**Expected Result:**
- Task created with status "not_started"
- Returns created task with assignee/creator details

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Get Tasks with Filters
**Test Steps:**
1. GET /api/tasks?status=in_progress&priority=high

**Expected Result:**
- Returns only tasks matching filters
- Non-admin sees only their tasks

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Update Task Status
**Test Steps:**
1. PUT /api/tasks with id and new status

**Expected Result:**
- Task status updated
- Returns updated task

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Add Subtask
**Test Steps:**
1. POST /api/tasks/[taskId]/subtasks with title

**Expected Result:**
- Subtask created for task
- Only creator/assignee/admin can add

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Add Comment
**Test Steps:**
1. POST /api/tasks/[taskId]/comments with content

**Expected Result:**
- Comment added to task

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Log Time
**Test Steps:**
1. POST /api/tasks/[taskId]/time-logs with hours and notes

**Expected Result:**
- Time logged for task

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

---

### Phase 3 Testing (Task Pages - Kanban & List)

#### Kanban Board Page
**Test Steps:**
1. Navigate to /tasks/board
2. Login as any user

**Expected Result:**
- Page loads with 4 columns: Not Started, In Progress, Review, Completed
- Tasks displayed as cards in respective columns

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Drag Task to Change Status
**Test Steps:**
1. Go to /tasks/board
2. Drag a task card from "Not Started" to "In Progress"

**Expected Result:**
- Task moves to new column
- Status updates automatically in database

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Add New Task (Modal)
**Test Steps:**
1. Click "Add Task" button on Kanban page
2. Fill: Title "Test Task", Priority "High", Assignee (select)
3. Click "Create"

**Expected Result:**
- Task created and appears in "Not Started" column
- Toast shows "Task created"

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### View Task Detail (Slide-over)
**Test Steps:**
1. Click on any task card in Kanban or List view

**Expected Result:**
- Slide-over panel opens from right
- Shows Overview tab with task details
- Tabs for Subtasks, Comments, Time Logs

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Add Subtask in Detail Panel
**Test Steps:**
1. Open task detail slide-over
2. Go to Subtasks tab
3. Type subtask title and press Enter

**Expected Result:**
- Subtask added to list
- Progress bar updates

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Toggle Subtask Complete
**Test Steps:**
1. In task detail > Subtasks tab
2. Click checkbox next to subtask

**Expected Result:**
- Subtask marked as complete/incomplete
- Progress percentage updates

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Add Comment
**Test Steps:**
1. Open task detail > Comments tab
2. Type comment and press Enter

**Expected Result:**
- Comment added with employee name and date
- Comment count updates in tab

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Log Time
**Test Steps:**
1. Open task detail > Time tab
2. Enter hours (e.g., 2)
3. Enter notes (optional)
4. Click add button

**Expected Result:**
- Time logged and displayed in list
- Total hours shown in tab label

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Task List Page (Table View)
**Test Steps:**
1. Navigate to /tasks

**Expected Result:**
- Table view with all tasks
- Search, status filter, priority filter working
- Action buttons: View, Edit, Delete

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### My Tasks Page
**Test Steps:**
1. Navigate to /tasks/my-tasks
2. Login as employee (non-admin)

**Expected Result:**
- Shows only tasks assigned to current user
- Filter applied automatically

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Edit Task
**Test Steps:**
1. Click Edit button on task row in table
2. Modify title/priority/assignee
3. Click "Update"

**Expected Result:**
- Task updated in database
- Toast shows "Task updated"

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

#### Delete Task
**Test Steps:**
1. Click Delete button on task row
2. Confirm in dialog

**Expected Result:**
- Task deleted from database
- Toast shows "Task deleted"

**Actual Result:** _______________________

**Pass:** [ ] | **Fail:** [ ]

---

## Important Notes

1. **DO NOT use Zustand for Auth** - Use React Context (`useAuth` hook)
2. **DO NOT create new tables without user confirmation**
3. **Always use TanStack Query for API data**
4. **Always add test cases after phase completion**
5. **Follow HTTP status codes standard**
6. **Use Toast notifications for user feedback**