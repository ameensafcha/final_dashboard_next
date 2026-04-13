# Production Plan: Daily Command Center

## 1. Background & Motivation
The goal is to build a "Daily Command Center" at `/tasks/daily`. The module must be production-ready, featuring a clean architecture that leverages both Server-Side Rendering (SSR) for fast initial loads and React Query for snappy client-side interactions. 

The flow requires:
1. Checking if a plan for the current day exists.
2. If **No**: Show a smart "Add Plan" form.
3. If **Yes**: Show the active "View Plan" dashboard.
4. Always show pending tasks from the last 3 days below the main interface, allowing them to be carried over.

## 2. Folder Structure & Architecture
To maintain a clean and scalable codebase, the module will be structured as follows:

```text
src/
├── app/
│   ├── api/
│   │   ├── daily-plans/
│   │   │   ├── route.ts              # POST: Create a new plan (with nested items, blockers, notes)
│   │   │   └── today/route.ts        # GET: Fetch today's plan
│   │   ├── daily-items/
│   │   │   ├── [id]/route.ts         # PUT: Toggle item status (Pending/Completed)
│   │   │   └── pending/route.ts      # GET: Fetch pending tasks from the last 3 days
│   ├── tasks/
│   │   ├── daily/
│   │   │   ├── page.tsx              # Server Component: Fetches initial data (SSR) and passes to client
│   │   │   ├── daily-client.tsx      # Client Component: Manages React Query & View routing
│   │   │   ├── components/
│   │   │   │   ├── add-plan-form.tsx # Form to build today's plan
│   │   │   │   ├── view-plan.tsx     # Interactive dashboard for the active plan
│   │   │   │   └── pending-tasks.tsx # List of overdue tasks with "Carry Over" action
```

## 3. Server-Side Flow & Implementation Steps

### Step 1: Backend APIs (Prisma & Next.js Routes)
- **`POST /api/daily-plans`**: 
  - Receives payload: `{ items: [], blockers: [], tomorrowNotes: [] }`.
  - Uses a **Prisma Transaction** (`prisma.$transaction`) to safely create the `DailyPlan` and all nested records (`DailyItem`, `DailyBlocker`, `TomorrowNotes`) simultaneously.
- **`GET /api/daily-items/pending`**: 
  - Queries `DailyItem` where `status == "Pending"` and the associated `DailyPlan.plan_date` is `>=` 3 days ago AND `<` today's start of day.
- **`PUT /api/daily-items/[id]`**: 
  - Updates the status of a specific task. If a task is being carried over, it increments the `carryover_count`.

### Step 2: The Server Component (`page.tsx`)
- Instead of raw `useEffect` fetching, `page.tsx` will be an `async` Server Component.
- It will query the database directly to check if a plan exists for `new Date()` (Today) and fetch the pending tasks.
- It passes this data as `initialData` to the `<DailyClient />` component, ensuring a zero-flicker, instant page load.

### Step 3: The Client Component (`daily-client.tsx`)
- Wraps the UI in React Query.
- Evaluates `initialData`:
  - Renders `<AddPlanForm />` if today's plan is missing.
  - Renders `<ViewPlan />` if it exists.
  - Always renders `<PendingTasks />` at the bottom.

### Step 4: The Smart Builder (`add-plan-form.tsx`)
- Allows users to add Tier 1 & Tier 2 tasks.
- **Carry-over functionality:** When a user clicks "+ Add to Today" on a task in the `<PendingTasks />` section below, that task's text is automatically injected into the form, and a flag is set to update its `carryover_count` upon submission.

### Step 5: The Focus Dashboard (`view-plan.tsx`)
- Displays today's tasks with interactive checkboxes.
- Uses React Query's `useMutation` with Optimistic Updates so clicking a checkbox feels instant (no waiting for the server response).
- Distinct visual sections for Blockers and Tomorrow's Notes (formatted as bullet points).

## 4. Edge Cases & Verification
- **Timezone Safety:** We will use `date-fns` or strict start-of-day/end-of-day logic to ensure "Today" accurately reflects the user's current day, preventing plans from resetting at the wrong time.
- **Idempotency:** Ensure the "Add Plan" API rejects creation if a plan for today already exists (returning a 409 Conflict).