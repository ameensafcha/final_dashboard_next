# Refactor Tasks Table (`src/components/tasks/tasks-table.tsx`)

## Overview
The `tasks-table.tsx` file has grown to ~800 lines. This makes it difficult to maintain, debug, and scale. You have observed valid performance and structural issues. We need to split this monolithic file into a clean, modular structure under a new folder `src/components/tasks/tasks-table/` while strictly preserving the current inline-editing functionality and visual behavior.

## Current Problems Addressed
1. **Monolithic File**: ~800 lines of UI, state, and data fetching mixed together. Hard to debug.
2. **Double Mutation Risk**: Pressing "Enter" triggers `onKeyDown` and then `onBlur` immediately because the input is unmounted, potentially firing duplicate API calls.
3. **Stale "Time Left" Logic**: Using `useState(() => Date.now())` freezes the time at initial render.
4. **Performance (Massive Re-renders)**: Typing in the search field triggers a full re-render of all 20 rows because they are all bound to inline arrow functions within `.map()`.
5. **Missing Debounce**: Search field doesn't debounce, spamming backend queries on every keystroke.

## Will this break the inline row concept?
**NO.** We will extract the logic so that `TasksTable` acts as the orchestrator, and `TaskRow` handles its own rendering. To ensure the "only one cell editing at a time" rule is maintained, the orchestrator (`TasksTable`) will still hold the `inlineEditingId` state and pass it down. The UI/UX will remain 100% identical.

## Directory Structure Plan
We will create a new folder: `src/components/tasks/tasks-table/`
And break the code into the following files:

1.  **`use-tasks.ts`** (Custom Hook)
    *   Moves all `useQuery`, `useMutation`, and realtime subscriptions out of the UI.
    *   Handles the filter states (`search`, `statusFilter`, `page`, etc.).
    *   Adds debouncing to the `search` state to prevent query spam.
2.  **`task-filters.tsx`** (UI Component)
    *   Extracts the entire top bar (Search input + 4 Dropdowns + Add Task button).
    *   Cleans up the main table file.
3.  **`task-row.tsx`** (UI Component)
    *   Extracts the `<tr key={task.id}>` logic.
    *   Wrapped in `React.memo` to prevent unnecessary re-renders.
    *   Fixes the double mutation bug (checks if `inlineField` is null before saving).
4.  **`add-task-row.tsx`** (UI Component)
    *   Extracts the inline Add Row (`showAddRow`) logic to keep the table body clean.
5.  **`tasks-table.tsx`** (Main Orchestrator - **Overwritten**)
    *   Assembles the pieces. It will drop from 800 lines down to ~150 lines.

## Safety Check
- **Are we changing Zod schemas or APIs?** No.
- **Are we altering the UI design?** No, same classes and markup.
- **Are we changing the inline edit concept?** No, we are just moving the exact same logic into smaller files to make it debuggable and scalable.

*Please review this plan. If you approve, I will proceed with breaking down the file.*