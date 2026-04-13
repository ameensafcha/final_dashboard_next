# Advanced Production Readiness Plan: Tasks Feature - COMPLETED

This plan outlines the complete architectural overhaul of the **Tasks** feature to ensure it is secure, performant, and follows a strict "Server-First" data flow.

## 1. Core Architectural Shift: Server-First Data Flow
We will move away from client-side filtering and calculations. The frontend will become a "dumb" view layer that displays data provided by the server.

### Data Flow Model:
1.  **Frontend**: Sends query params (`page`, `limit`, `search`, `status`, `priority`, `area`) to the API.
2.  **API Route**: Validates input using **Zod** and passes it to the **TaskService**.
3.  **TaskService**: Handles Prisma queries (filtering, sorting, pagination) and business logic (recurrence).
4.  **Database**: Returns exactly the subset of data requested.
5.  **Real-time**: Supabase listeners will trigger a **React Query Invalidation**, forcing a fresh server-side fetch instead of manual state manipulation.

---

## 2. Updated Implementation Roadmap

### Phase 1: Service Layer & Schema Validation (COMPLETED)
- [x] **Task Validation Schema**: Create `src/lib/validations/task.ts` to define strict types for Create, Update, and Filter/Query params.
- [x] **Task Service**: Create `src/services/task-service.ts`.
    - `getTasks(params, userId, isAdmin)`: Centralized query logic with `take`/`skip`.
    - `createTask(data, userId)`: Handles creation + notifications.
    - `updateTask(id, data, userId)`: Handles updates + recurrence logic.
    - `deleteTask(id, userId)`: Handles authorization + deletion.

### Phase 2: Secure & Smart API (COMPLETED)
- [x] **Refactor API Routes**: `src/app/api/tasks/route.ts` will now be a thin wrapper around `TaskService`.
- [x] **Authorization Middleware**: Implement checks in `TaskService` to ensure:
    - Users can only see/edit/delete tasks they created or are assigned to.
    - Admins have full access.
- [x] **Error Handling**: Standardize API responses with proper HTTP status codes and detailed error messages.

### Phase 3: Performance & Scalability (COMPLETED)
- [x] **Server-side Pagination**:
    - Add `totalCount` to API response for pagination UI.
    - Implement `limit` and `offset` in Prisma.
- [x] **Server-side Filtering/Search**:
    - Move `search` (title/desc), `status`, `priority`, and `area` filters to Prisma `where` clauses.
- [x] **Server-side Sorting**: Implement sorting by `due_date`, `priority`, and `created_at` at the database level.

### Phase 4: Real-time Fixes & Optimization (COMPLETED)
- [x] **Fix Real-time Logic**:
    - Currently, `TasksTable` manually updates local state on `INSERT`/`UPDATE`. This is brittle when filters are active.
    - **New Approach**: Real-time events will call `queryClient.invalidateQueries(['tasks'])`. This ensures the view always matches the database state and current filters.
- [x] **Real-time Filters**: Add `filter` param to `useRealtimeSubscription` to only listen for changes relevant to the current user (reduce overhead).

### Phase 5: UI/UX & Testing (COMPLETED)
- [x] Paginated Table: Update `TasksTable` to use server-side pagination controls.
- [x] Delete Modal: Replace `confirm()` with a custom `DeleteTaskDialog`.
- [ ] Unit Tests: Add tests for `TaskService` logic (especially recurrence intervals).

---

## 3. Data Flow Diagram (Conceptual)
```
[User Interaction] 
      |
[React Query (Key: ['tasks', filters, page])]
      |
[API: GET /api/tasks?status=in_progress&page=2]
      |
[TaskService.getTasks()] --> [Prisma Query (where: ..., skip: 20, take: 20)]
      |
[Database]
      |
[JSON Response { data: [...], total: 150 }]
      |
[UI Render]
```

## 4. Real-time Invalidation Flow
```
[Database Update] 
      |
[Supabase Realtime Event]
      |
[useRealtimeSubscription Callback]
      |
[queryClient.invalidateQueries(['tasks'])]
      |
[Refetch triggered automatically with current filters]
```
