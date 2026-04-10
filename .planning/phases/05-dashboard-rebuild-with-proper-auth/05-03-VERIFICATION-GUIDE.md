# Phase 05 Plan 03: Comprehensive Testing & Verification Guide

**Development Server Status:** Running on http://localhost:3002

**Execution Date:** 2026-04-10

---

## Quick Setup

The development server is already running on **http://localhost:3002**

### Test User Credentials

You will need test accounts with different roles:

1. **Admin User** (for checking full task visibility)
   - Role: admin
   - Should see ALL tasks in the system

2. **Non-Admin User** (for checking assigned-only visibility)
   - Role: employee or viewer
   - Should see ONLY tasks assigned to them

3. **Another Non-Admin User** (for cross-user verification)
   - Role: employee or viewer
   - For testing data isolation

### How to Create Test Users (If Needed)

If test users don't exist, you can:
1. Visit the admin panel at `/admin/employees` (if you have admin access)
2. Create test employees with different roles
3. Or use Supabase auth panel to add test users

---

## Checkpoint 1: Admin Dashboard Shows All Tasks

### What Should Be Visible
- Admin sees complete task list across entire organization
- KPI cards show counts for ALL tasks (not filtered)
- SQL query in server logs shows `where: {}` (no filter)

### Verification Steps

1. **Open http://localhost:3002/dashboard** in a browser
2. **Log in with an ADMIN account**
3. **Observe the dashboard page:**
   - Check the **KPI cards** at the top:
     - **Total Tasks**: Count of all tasks in system
     - **Completed**: All completed tasks
     - **Pending**: All pending tasks
     - **Overdue**: All overdue incomplete tasks
   - Check the **Task Table**: Should display at least 10 tasks (or all if fewer)
   - Verify tasks are from DIFFERENT users (if multiple creators in system)

4. **Check Server Logs (if accessible):**
   - Look for log message: `[Dashboard] Fetched X tasks with where clause: {}`
   - Empty where clause `{}` confirms no filtering

5. **Verify via Browser DevTools:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for Prisma query logs showing admin user received unfiltered results

### Expected Behavior
✓ Admin sees all tasks from all users
✓ Task count matches total in database
✓ No WHERE clause applied in query

### Resume Signal
**Type "approved" if admin sees all tasks correctly, or describe issues encountered (e.g., "only seeing assigned tasks" or "KPI counts incorrect")**

---

## Checkpoint 2: Non-Admin Dashboard Shows Only Assigned Tasks

### What Should Be Visible
- Non-admin sees ONLY tasks where `assignee_id = <current-user-id>`
- KPI cards show filtered counts
- SQL query shows `where: { assignee_id: '<user-id>' }`

### Verification Steps

1. **Log out** from the admin account
2. **Log in with a NON-ADMIN account** (employee or viewer role)
3. **Navigate to http://localhost:3002/dashboard**
4. **Observe the task list:**
   - Count the tasks displayed
   - Click each task and verify in task detail that **Assignee field matches current user's name**
   - If you see ANY task assigned to a different user, that's a data leakage issue ❌

5. **Check KPI cards:**
   - **Total Tasks**: Should be fewer than admin's count
   - Compare to Checkpoint 1: Non-admin count < Admin count ✓

6. **Verify server logs/console:**
   - Should show where clause with this user's ID
   - Example: `where: { assignee_id: 'user-uuid-12345' }`

7. **Cross-check with admin account (if possible):**
   - Log back in as admin
   - Go to dashboard
   - Verify admin sees MORE tasks than this non-admin user
   - This confirms filtering is working

### Expected Behavior
✓ Non-admin sees 5-15 tasks (or their assigned tasks)
✓ All displayed tasks have this user as assignee
✓ KPI counts match filtered set only
✓ No unassigned tasks visible

### Resume Signal
**Type "approved" if non-admin correctly sees only assigned tasks, or describe issues (e.g., "seeing other users' tasks" or "missing assigned tasks")**

---

## Checkpoint 3: Realtime Notifications Respect Auth Boundaries

### What Should Be Visible
- User A gets notification only for their own tasks
- User B gets notification only for their own tasks
- No cross-user notification delivery
- Auth context fully loads before subscription initializes

### Verification Steps

1. **Open two browser windows/tabs:**
   - **Tab A**: Log in as User A (non-admin employee)
   - **Tab B**: Log in as User B (different non-admin employee)

2. **In both tabs, open browser DevTools (F12):**
   - Go to **Console tab**
   - Keep console visible during test

3. **Create a task in Tab A assigned to User B:**
   - Click "Add Task" button (if available)
   - Or use admin panel to create task: Title="Test Notification", Assignee="User B"
   - Submit the task

4. **Immediately check Tab B (User B's dashboard):**
   - **Notification Bell**: Should show red badge with "1"
   - Click bell icon to open notification dropdown
   - Verify notification text: "[User A Name] assigned Test Notification"
   - Check timestamp: Should be within last few seconds ✓

5. **Check Tab A (User A's dashboard):**
   - **Notification Bell**: Should NOT show a badge (User A didn't receive assignment)
   - This is correct behavior ✓

6. **Verify in console logs (both tabs):**
   - Look for log: `[NotificationCenter] Subscription enabled: true`
   - Verify NO logs show: `recipient_id=eq.undefined` (would indicate auth loading issue)
   - Should see: `recipient_id=eq.<user-uuid>` with their actual UUID

### Expected Behavior
✓ User B received notification immediately
✓ User A did NOT receive notification
✓ Console shows subscription filter with valid user ID (not undefined)
✓ No subscription re-initialization loops

### Resume Signal
**Type "approved" if notifications arrived only for intended user, or describe issues (e.g., "both users got notification" or "no notification appeared")**

---

## Checkpoint 4: Query Performance is Acceptable

### What Should Be Measured
- Dashboard loads in < 2 seconds total
- Prisma query completes in < 500ms
- No N+1 queries or slowness detected

### Verification Steps

1. **Log in as any user and navigate to /dashboard**
2. **Open browser DevTools (F12):**
   - Go to **Network tab**
   - Click **Clear** to reset network log
   - **Reload the page** (Ctrl+R)

3. **Analyze network request:**
   - Find the initial dashboard page request (status 200)
   - Check the **Time** column:
     - ✓ < 500ms = Excellent
     - ⚠ 500-1000ms = Acceptable (monitor)
     - ✗ > 1000ms = Needs investigation

4. **Check for slow requests:**
   - Look for any individual requests taking > 500ms
   - If found, investigate which endpoint (API call or page load)

5. **Measure with different user roles (if possible):**
   - **Admin user**: Query returns all tasks (larger result set)
     - Expected: 300-400ms
   - **Non-admin user**: Query filtered to assigned only (smaller result set)
     - Expected: 200-300ms (should be slightly faster due to filter reducing data)

6. **Alternative: Server Console Performance**
   - Check server logs (terminal where `npm run dev` is running)
   - Look for Prisma query timing logs
   - Should show query duration in milliseconds

### Expected Behavior
✓ Page load time < 2 seconds
✓ API response time < 500ms
✓ No slowness or timeout errors
✓ Admin and non-admin both perform adequately

### Resume Signal
**Type "approved" if queries execute in < 500ms, or describe performance issues (e.g., "took 2+ seconds" or "periodic slowness")**

---

## Checkpoint 5: No Data Leakage Between User Roles

### What Should Be Verified
- Non-admin user HTML response contains ONLY their assigned tasks
- No unassigned task data leaked to client
- Database-level filtering prevents client-side workarounds

### Verification Steps

1. **Log in as a NON-ADMIN employee**
2. **Navigate to /dashboard**
3. **Open browser DevTools (F12):**
   - Go to **Network tab**
   - Click to reload page (Ctrl+R)

4. **Find the dashboard HTML response:**
   - In Network tab, find the initial page request (usually shows "dashboard" or "/dashboard")
   - Click it to select
   - Go to **Response tab**
   - Copy the entire HTML response

5. **Search for task data in HTML:**
   - Paste the HTML into a text editor
   - Search (Ctrl+F) for known task titles
   - Verify:
     - ✓ Only tasks assigned to this user appear in HTML
     - ✗ No unassigned tasks are embedded in the page source

6. **Cross-verify with unassigned task:**
   - Ask admin to create/view a task assigned to a DIFFERENT user
   - Note the task title (e.g., "Test Task - Different User")
   - Go back to non-admin user's dashboard
   - Search HTML for that task title
   - ✓ Should NOT be found in the HTML
   - This proves filtering happened at SERVER level, not client-side

7. **Check API Response:**
   - In Network tab, find the API request that fetches tasks
   - Go to **Response tab**
   - Verify response JSON contains only this user's tasks:
     ```json
     {
       "data": [
         { "id": "task-1", "assignee_id": "current-user-id", ... },
         { "id": "task-2", "assignee_id": "current-user-id", ... }
       ]
     }
     ```
   - All tasks should have `assignee_id === current-user-id`

### Expected Behavior
✓ Non-admin user HTML contains only their tasks
✓ Unassigned tasks completely absent from response
✓ Database-level filtering confirmed
✓ No data leakage to client

### Resume Signal
**Type "approved" if only authorized tasks visible in HTML/API response, or describe data leakage issues (e.g., "saw tasks assigned to User B")**

---

## Summary of What Was Implemented

### Wave 1 (05-01): Database-Level Role-Based Filtering
- **File**: `src/lib/auth-helper.ts`
  - New function: `getTaskFilterByRole(user)` returns `{}` for admins, `{ assignee_id: user.id }` for non-admins
- **File**: `src/app/dashboard/page.tsx`
  - Prisma query now includes `where: taskFilter`
  - All tasks fetched from database are already filtered
  - No client-side filtering (secure)

### Wave 2 (05-02): Auth Context Loading Guards
- **File**: `src/hooks/use-realtime-subscription.ts`
  - JSDoc documenting guard pattern
- **File**: `src/components/notification-center.tsx`
  - Realtime subscriptions guarded with `enabled: !!(user?.id) && !isLoading && isConnected`
  - Prevents undefined user IDs in subscription filters
  - Subscriptions initialize only after auth context fully loads

---

## Troubleshooting

### Issue: Cannot log in
- Check Supabase credentials in `.env`
- Verify test users exist in Supabase Auth panel
- Check `employees` table in database for corresponding employee records

### Issue: Tasks not loading
- Check database connectivity (DATABASE_URL in .env)
- Verify `tasks` table has data
- Check server logs for errors: `npm run dev` terminal

### Issue: Notifications not appearing
- Verify Supabase Realtime is enabled on `notifications` table
- Check browser console for subscription errors
- Verify notification API endpoint `/api/notifications` is working

### Issue: Performance is slow (> 500ms)
- Check database indexes on `tasks.assignee_id`
- Verify no N+1 queries in Prisma (use query logging)
- Check server resources (CPU, memory, network)

---

## Server Location

**Development Server:** http://localhost:3002

**API Base:** http://localhost:3002/api

**Admin Panel:** http://localhost:3002/admin (if available)

---

**Ready to verify? Start with Checkpoint 1 at http://localhost:3002/dashboard**
