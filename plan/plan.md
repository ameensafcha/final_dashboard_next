# Tasks Table — Full Notion-Style Inline Add & Edit

## Context
The tasks table (`/src/components/tasks/tasks-table.tsx`) currently uses modal dialogs for all create/edit. User wants Notion-style UX where **every cell is editable inline** — title, status, priority, company, area, assignee, due date — plus an "Add task…" row at the bottom. Auto-save on blur/Enter/Select change. No backend changes needed.

---

## Only File Modified
`src/components/tasks/tasks-table.tsx`

APIs reused: `POST /api/tasks`, `PUT /api/tasks`, `GET /api/companies?active=true`, `GET /api/employees` (need to add this query — already exists in task-form.tsx with queryKey `["employees"]`, so it'll be served from React Query cache).

---

## Inline-Editable Cells (All 7)

| Column | Control | Save Trigger |
|--------|---------|-------------|
| Title | `<input type="text">` | blur / Enter |
| Status | `<Select>` | onChange (immediate) |
| Priority | `<Select>` | onChange (immediate) |
| Company | `<Select>` | onChange (immediate) |
| Area | `<Select>` | onChange (immediate) |
| Assignee | `<Select>` | onChange (immediate) |
| Due Date | `<input type="date">` | blur / Enter |

**Save strategy:** Each field saves independently (per-field, like Notion). Status, Priority, Company, Area, Assignee save as soon as the dropdown value changes. Title and Due Date save on blur or Enter.

---

## New State

```tsx
// Inline editing — tracks which row's text-field (title/date) is active
const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
const [inlineField, setInlineField] = useState<'title' | 'due_date' | null>(null);
const [inlineValue, setInlineValue] = useState('');

// Add row
const [showAddRow, setShowAddRow] = useState(false);
const [newTask, setNewTask] = useState({
  title: '', status: 'not_started', priority: 'medium',
  company_id: '', area: '', assignee_id: '', due_date: ''
});
```

---

## New Data Fetch (Employees)

Add alongside the existing `companies` query:

```tsx
const { data: employees = [] } = useQuery<{ id: string; name: string }[]>({
  queryKey: ['employees'],
  queryFn: async () => {
    const res = await fetch('/api/employees');
    const json = await res.json();
    return json.data || json || [];
  },
});
```

Companies are already fetched. Both are now available for all dropdowns.

---

## New Mutations

```tsx
// Inline field update (reused for all inline saves)
const updateInlineMutation = useMutation({
  mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  onError: (err: Error) => addNotification({ type: 'error', message: err.message }),
});

// Inline create (Add Row)
const createInlineMutation = useMutation({
  mutationFn: async (data: typeof newTask) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        company_id: data.company_id || null,
        area: data.area || null,
        assignee_id: data.assignee_id || null,
        due_date: data.due_date || null,
      }),
    });
    if (!res.ok) throw new Error('Create failed');
    return res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    setShowAddRow(false);
    setNewTask({ title: '', status: 'not_started', priority: 'medium', company_id: '', area: '', assignee_id: '', due_date: '' });
    addNotification({ type: 'success', message: 'Task created' });
  },
  onError: (err: Error) => addNotification({ type: 'error', message: err.message }),
});
```

---

## Helper Functions

```tsx
const startInlineEdit = (taskId: string, field: 'title' | 'due_date', value: string) => {
  setInlineEditingId(taskId);
  setInlineField(field);
  setInlineValue(value ?? '');
};

const saveInlineText = (task: Task) => {
  const trimmed = inlineValue.trim();
  const original = inlineField === 'title' ? task.title : (task.due_date ?? '');
  setInlineEditingId(null);
  setInlineField(null);
  if (!trimmed || trimmed === original) return;
  updateInlineMutation.mutate({ id: task.id, data: { [inlineField!]: trimmed } });
};

const saveInlineField = (id: string, data: Record<string, unknown>) => {
  updateInlineMutation.mutate({ id, data });
};

const handleCreateInline = () => {
  if (!newTask.title.trim()) return;
  createInlineMutation.mutate(newTask);
};
```

---

## Row Cell Implementations

### Title cell
```tsx
<td className="py-4 px-6" onClick={() => !inlineEditingId && startInlineEdit(task.id, 'title', task.title)}>
  {inlineEditingId === task.id && inlineField === 'title' ? (
    <input
      autoFocus
      type="text"
      value={inlineValue}
      onChange={(e) => setInlineValue(e.target.value)}
      onBlur={() => saveInlineText(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') saveInlineText(task); if (e.key === 'Escape') { setInlineEditingId(null); setInlineField(null); } }}
      onClick={(e) => e.stopPropagation()}
      className="w-full text-sm font-bold text-gray-900 bg-yellow-50/40 border-b-2 border-[#E8C547] outline-none rounded px-1 py-0.5"
    />
  ) : (
    <div className="cursor-text">
      <p className="font-bold text-sm text-gray-900 group-hover:text-[#E8C547] transition-colors">{task.title}</p>
      {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{task.description}</p>}
    </div>
  )}
</td>
```

### Status cell (badge wraps Select trigger)
```tsx
<td className="py-4 px-6">
  <Select value={task.status} onValueChange={(val) => saveInlineField(task.id, { status: val })}>
    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none">
      <StatusBadge status={task.status} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="not_started">Not Started</SelectItem>
      <SelectItem value="in_progress">In Progress</SelectItem>
      <SelectItem value="review">Review</SelectItem>
      <SelectItem value="completed">Completed</SelectItem>
    </SelectContent>
  </Select>
</td>
```

### Priority cell (same pattern)
```tsx
<td className="py-4 px-6">
  <Select value={task.priority} onValueChange={(val) => saveInlineField(task.id, { priority: val })}>
    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none">
      <PriorityBadge priority={task.priority} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="low">Low</SelectItem>
      <SelectItem value="medium">Medium</SelectItem>
      <SelectItem value="high">High</SelectItem>
      <SelectItem value="urgent">Urgent</SelectItem>
    </SelectContent>
  </Select>
</td>
```

### Company cell
```tsx
<td className="py-4 px-6">
  <Select value={task.company_id ?? '__none__'} onValueChange={(val) => saveInlineField(task.id, { company_id: val === '__none__' ? null : val })}>
    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none text-xs font-bold">
      {task.company
        ? <span className="px-3 py-1 bg-[#E8C547]/10 text-[#E8C547] rounded-full uppercase tracking-tighter">{task.company.name}</span>
        : <span className="text-sm text-gray-400">—</span>
      }
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">None</SelectItem>
      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
    </SelectContent>
  </Select>
</td>
```

### Area cell
```tsx
<td className="py-4 px-6">
  <Select value={task.area ?? '__none__'} onValueChange={(val) => saveInlineField(task.id, { area: val === '__none__' ? null : val })}>
    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none">
      {task.area
        ? <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{task.area}</span>
        : <span className="text-sm text-gray-400">—</span>
      }
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__none__">None</SelectItem>
      {['Production','Quality','Warehouse','Procurement','HR','Admin','Development','Maintenance','Finance'].map(a =>
        <SelectItem key={a} value={a}>{a}</SelectItem>
      )}
    </SelectContent>
  </Select>
</td>
```

### Assignee cell
```tsx
{!filterAssigneeId && (
  <td className="py-4 px-6">
    <Select value={task.assignee_id ?? '__none__'} onValueChange={(val) => saveInlineField(task.id, { assignee_id: val === '__none__' ? null : val })}>
      <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none">
        {task.assignee
          ? <div className="flex items-center gap-2.5"><Avatar name={task.assignee.name} size="sm" /><span className="text-sm font-semibold text-gray-700">{task.assignee.name}</span></div>
          : <span className="text-sm font-medium italic text-gray-400">Unassigned</span>
        }
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Unassigned</SelectItem>
        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
      </SelectContent>
    </Select>
  </td>
)}
```

### Due Date cell
```tsx
<td className="py-4 px-6" onClick={() => !inlineEditingId && startInlineEdit(task.id, 'due_date', task.due_date ? task.due_date.slice(0, 10) : '')}>
  {inlineEditingId === task.id && inlineField === 'due_date' ? (
    <input
      autoFocus
      type="date"
      value={inlineValue}
      onChange={(e) => setInlineValue(e.target.value)}
      onBlur={() => saveInlineText(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') saveInlineText(task); if (e.key === 'Escape') { setInlineEditingId(null); setInlineField(null); } }}
      onClick={(e) => e.stopPropagation()}
      className="text-sm font-semibold text-gray-600 border-b-2 border-[#E8C547] outline-none bg-yellow-50/40 rounded px-1 py-0.5"
    />
  ) : (
    <span className="text-sm font-semibold text-gray-600 cursor-text hover:text-[#E8C547] transition-colors">
      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : <span className="text-gray-400">—</span>}
    </span>
  )}
</td>
```

---

## Add Row (Full Width, All Fields)

Place inside `<tbody>` **after** the tasks `.map()` and **before** the empty-state row:

```tsx
{showAddRow && (
  <tr className="bg-[#E8C547]/5 border-y border-[#E8C547]/20">
    {/* Title */}
    <td className="py-3 px-6">
      <input autoFocus type="text" value={newTask.title}
        onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateInline(); if (e.key === 'Escape') setShowAddRow(false); }}
        placeholder="New task title..."
        className="w-full text-sm font-bold text-gray-800 bg-transparent border-b border-[#E8C547] outline-none placeholder:text-gray-400 placeholder:font-normal py-0.5"
      />
    </td>
    {/* Company */}
    <td className="py-3 px-6">
      <Select value={newTask.company_id || '__none__'} onValueChange={(v) => setNewTask(p => ({ ...p, company_id: v === '__none__' ? '' : v }))}>
        <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[120px]"><SelectValue placeholder="Company" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </td>
    {/* Area */}
    <td className="py-3 px-6">
      <Select value={newTask.area || '__none__'} onValueChange={(v) => setNewTask(p => ({ ...p, area: v === '__none__' ? '' : v }))}>
        <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[120px]"><SelectValue placeholder="Area" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None</SelectItem>
          {['Production','Quality','Warehouse','Procurement','HR','Admin','Development','Maintenance','Finance'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
    </td>
    {/* Status */}
    <td className="py-3 px-6">
      <Select value={newTask.status} onValueChange={(v) => setNewTask(p => ({ ...p, status: v }))}>
        <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[120px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="review">Review</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </td>
    {/* Priority */}
    <td className="py-3 px-6">
      <Select value={newTask.priority} onValueChange={(v) => setNewTask(p => ({ ...p, priority: v }))}>
        <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[110px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
    </td>
    {/* Assignee */}
    {!filterAssigneeId && (
      <td className="py-3 px-6">
        <Select value={newTask.assignee_id || '__none__'} onValueChange={(v) => setNewTask(p => ({ ...p, assignee_id: v === '__none__' ? '' : v }))}>
          <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[130px]"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unassigned</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
    )}
    {/* Due Date */}
    <td className="py-3 px-6">
      <input type="date" value={newTask.due_date}
        onChange={(e) => setNewTask(p => ({ ...p, due_date: e.target.value }))}
        className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#E8C547]"
      />
    </td>
    {/* Time Left — empty in add row */}
    <td className="py-3 px-6 text-gray-300 text-sm">—</td>
    {/* Actions */}
    <td className="py-3 px-6">
      <div className="flex items-center justify-end gap-2">
        <button onClick={handleCreateInline} disabled={!newTask.title.trim() || createInlineMutation.isPending}
          className="px-3 py-1.5 text-xs font-bold bg-[#1A1A1A] hover:bg-black text-white rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1">
          {createInlineMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
        </button>
        <button onClick={() => setShowAddRow(false)}
          className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-lg">
          Cancel
        </button>
      </div>
    </td>
  </tr>
)}
```

## "Add task…" Trigger Row (bottom of table, always visible)

```tsx
{!showAddRow && !filterAssigneeId && (
  <tr onClick={() => setShowAddRow(true)}
    className="cursor-pointer hover:bg-[#E8C547]/5 transition-colors border-t border-dashed border-gray-100">
    <td colSpan={filterAssigneeId ? 8 : 9} className="py-3 px-6">
      <div className="flex items-center gap-2 text-gray-300 hover:text-[#E8C547] transition-colors">
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add task...</span>
      </div>
    </td>
  </tr>
)}
```

---

## Fix: Black Border on Focus (Daily Plan + Tasks Table)

`SelectTrigger` components wrapping badges must have: `focus:ring-0 focus:outline-none focus:ring-offset-0`  
All `<input>` fields must have: `outline-none` (already present in daily-client.tsx inputs — verify `outline-0` fallback in Tailwind v4 if still showing)

---

## Implementation Order

1. Add `employees` query (1 line useQuery)
2. Add 3 state declarations
3. Add `updateInlineMutation` + `createInlineMutation`
4. Add 3 helper functions
5. Replace each of the 7 table cells (title, status, priority, company, area, assignee, due date)
6. Add `showAddRow` input row inside `<tbody>`
7. Add "Add task…" trigger row inside `<tbody>`

---

## Verification

1. Click title → input appears → type → Enter → saves, row updates
2. Click status badge → Select opens → pick value → saves instantly, badge changes
3. Click priority badge → same
4. Click company cell → Select opens → saves instantly
5. Click area cell → same
6. Click assignee cell → employee list appears → saves instantly
7. Click due date → date picker appears → pick/blur → saves
8. Escape anywhere → cancels without saving
9. Click "Add task…" → full row appears → fill title → press Enter → task created
10. All filters, pagination, real-time, View/Edit/Delete still work
