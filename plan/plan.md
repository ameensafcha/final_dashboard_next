# Production Plan: Daily Command Center (V3 - Final Layout)

## 1. UI & Visual Design (Based on Screenshot)
The module will follow a dark-themed, clean layout exactly as the example provided.

| Section | Key Features |
|-------|---------|
| **Header** | Centered title "Daily Command Center", Date, and Score (x / 10) |
| **Tier 1: Move the Needle** | High-priority focus tasks (Columns: Task, Biz, Done, Notes) |
| **Tier 2: Quick Wins** | Smaller tasks (Columns: Task, Biz, Done, Notes) |
| **Blockers & Delegations** | Two-column grid: "What's Blocked?" and "Who Needs to Act?" |
| **End of Day Review** | Sections for "Carry Forward" and "Kill / Delegate" |
| **Tomorrow's Plan** | A focused list of items for the next day |

## 2. Folder Structure
```text
src/
├── app/
│   ├── api/
│   │   ├── daily-plans/
│   │   │   ├── route.ts              # POST: Create plan, GET: Today's plan
│   │   ├── daily-items/
│   │   │   ├── [id]/route.ts         # PUT: Toggle status, Update blocker notes
│   │   │   └── pending/route.ts      # GET: Pending tasks last 3 days
│   ├── tasks/
│   │   ├── daily/
│   │   │   ├── page.tsx              # Server Component: Initial SSR fetch
│   │   │   ├── daily-client.tsx      # Client Component: Manages view routing
│   │   │   └── components/
│   │   │       ├── add-plan-form.tsx # Builder for new plans
│   │   │       ├── view-plan.tsx     # Focused Dashboard (Tiers, Blockers)
│   │   │       ├── pending-tasks.tsx # Overdue tasks with carry-over logic
│   │   │       └── blocker-dialog.tsx # Pop-up for blocker reason/owner
```

## 2. Updated Data Model (Prisma)

```prisma
model DailyPlan {
  id             String         @id @default(uuid())
  employee_id    String
  plan_date      DateTime       @unique @default(now())
  score          Int            @default(0) // Out of 10
  
  items          DailyItem[]
  blockers       DailyBlocker[]
  tomorrow_notes String[]       // Tomorrow's plan items
  
  @@unique([plan_date, employee_id])
}

model DailyItem {
  id              String    @id @default(uuid())
  daily_plan_id   String
  title           String
  biz             String    // e.g., 'S', 'N'
  tier            Int       // 1 or 2
  status          String    @default("PENDING") // COMPLETED, BLOCKED
  notes           String?   // Contextual notes
  blocker_reason  String?   // "Why it was blocked"
  action_owner    String?   // "Who needs to act" (Delegation)
  carryover_count Int       @default(0)
  
  daily_plan      DailyPlan @relation(fields: [daily_plan_id], references: [id], onDelete: Cascade)
}
```

## 3. Implementation Flow

### Step 1: SSR Page (`/tasks/daily`)
- Fetches today's plan using `plan_date` and `auth.user.id`.
- If missing, provides an interface to build today's plan by showing the "3-Day History" of pending/blocked tasks.

### Step 2: Smart Interaction (View Mode)
- **Ticking a Task:** Sets `status` to `COMPLETED`.
- **Marking as Blocked:**
  - UI shows a "Blocker Form" for that item.
  - User fills: "Kyun block hua?" and "Who needs to act?".
  - Updates `blocker_reason` and `action_owner`.

### Step 3: End of Day Review
- User can decide to:
  - **Carry Forward:** Task will appear in the next day's builder.
  - **Kill/Delegate:** Task is removed from daily focus but preserved in history as "Killed".

### Step 4: The 3-Day Rule (Logic)
- When building a new plan:
  - Fetch items from last 3 days with `status != COMPLETED`.
  - Highlight items with `carryover_count >= 3` with a warning (3-Day Rule).
  - Show the `blocker_reason` and `action_owner` next to each overdue task.

## 4. API Structure
- `GET /api/daily-plans/today`
- `POST /api/daily-plans` (Transaction to create items and plan)
- `PUT /api/daily-items/[id]` (Update status, notes, blockers)
- `GET /api/daily-items/pending` (Context-rich history)

## 5. Archive & Delegation
- **Kill/Delegate** → Archive in `DailyItem` with status 'ARCHIVED'
- **Action Owner** → Can view delegated tasks via separate query

## 6. UI/UX Details
- **Aesthetic:** High-contrast layout (Dark background, light tables)
- **Responsive:** Desktop first but mobile-friendly tables
- **Score:** 1 point per task → (completed / total) * 10

## 7. Blocker & Delegation Flow Table

| Action | DailyItem Field | Description |
|--------|---------------|-------------|
| Mark Blocked | blocker_reason | Why blocked |
| Delegate | action_owner | Who needs to act |
| Archive | status = 'ARCHIVED' | Killed/delegated tasks |

## 8. Score Calculation

| Metric | Formula |
|--------|---------|
| Score | (completed_items / total_items) * 10 |
| Biz Type | 1 = Sales, N = Non-Sales |