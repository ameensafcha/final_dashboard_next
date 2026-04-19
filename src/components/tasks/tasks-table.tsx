"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { TaskForm } from "./task-form";
import { TaskDetail } from "./task-detail";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { useTasks } from "./tasks-table/use-tasks";
import { TaskFilters } from "./tasks-table/task-filters";
import { TaskRow } from "./tasks-table/task-row";
import { AddTaskRow } from "./tasks-table/add-task-row";
import { Task } from "./tasks-table/types";

interface TasksTableProps {
  initialData?: Task[];
  filterAssigneeId?: string;
  currentUserId?: string;
}

export function TasksTable({
  filterAssigneeId,
  currentUserId,
}: TasksTableProps) {
  const {
    tasks,
    isLoading,
    pagination,
    companies,
    employees,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    areaFilter,
    setAreaFilter,
    companyFilter,
    setCompanyFilter,
    page,
    setPage,
    limit,
    deleteMutation,
    bulkDeleteMutation,
    updateInlineMutation,
    createInlineMutation,
  } = useTasks(currentUserId, filterAssigneeId);

  // ── UI Local state ─────────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Bulk selection state ───────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.size === tasks.length && tasks.length > 0
      ? new Set()
      : new Set(tasks.map((t: Task) => t.id))
    );
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    bulkDeleteMutation.mutate(ids, {
      onSuccess: () => { setSelectedIds(new Set()); setShowBulkDeleteConfirm(false); }
    });
  };

  // ── Inline editing state ───────────────────────────────────────────────────
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineField, setInlineField] = useState<"title" | "due_date" | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "", status: "not_started", priority: "medium",
    company_id: "", area: "", assignee_id: "", due_date: "", start_date: ""
  });

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const startInlineEdit = (taskId: string, field: "title" | "due_date", value: string) => {
    setInlineEditingId(taskId || null);
    setInlineField(taskId ? field : null);
    setInlineValue(value ?? "");
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineField(null);
    setInlineValue("");
  };

  const saveInlineText = (task: Task) => {
    if (!inlineField) return; // Fix double mutation race condition
    const trimmed = inlineValue.trim();
    const original = inlineField === "title" ? task.title : (task.due_date?.slice(0, 10) ?? "");
    
    setInlineEditingId(null);
    setInlineField(null);
    
    if (!trimmed || trimmed === original) return;
    
    setUpdatingTaskId(task.id);
    updateInlineMutation.mutate(
      { id: task.id, data: { [inlineField]: trimmed } },
      { onSettled: () => setUpdatingTaskId(null) }
    );
  };

  const saveInlineField = (id: string, data: Record<string, unknown>, onComplete?: () => void) => {
    setUpdatingTaskId(id);
    updateInlineMutation.mutate(
      { id, data },
      { onSettled: () => { 
        setUpdatingTaskId(null);
        onComplete?.();
      } }
    );
  };

  const handleCreateInline = () => {
    if (!newTask.title.trim()) return;
    createInlineMutation.mutate(newTask, {
      onSuccess: () => {
        setShowAddRow(false);
        setNewTask({ title: "", status: "not_started", priority: "medium", company_id: "", area: "", assignee_id: "", due_date: "", start_date: "" });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      setDeletingId(taskToDelete.id);
      deleteMutation.mutate(taskToDelete.id, { 
        onSettled: () => { setDeletingId(null); setTaskToDelete(null); } 
      });
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted)]">
        <Loader2 className="inline-block w-6 h-6 animate-spin mb-3 text-[var(--primary)]" />
        <p className="font-medium text-sm">Loading tasks...</p>
      </div>
    );
  }

  const colCount = filterAssigneeId ? 10 : 11;

  return (
    <div className="w-full">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 px-5 py-3 bg-[var(--error-bg)] border border-[var(--error)]/20 rounded-xl">
          <span className="text-sm font-black text-[var(--error)] uppercase tracking-widest">
            {selectedIds.size} task{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            disabled={bulkDeleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-1.5 bg-[var(--error)] text-white text-xs font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
          >
            {bulkDeleteMutation.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />}
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-black text-[var(--muted)] hover:text-[var(--foreground)] uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <TaskFilters 
        search={search} setSearch={setSearch}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
        areaFilter={areaFilter} setAreaFilter={setAreaFilter}
        companyFilter={companyFilter} setCompanyFilter={setCompanyFilter}
        companies={companies}
        onAddTask={() => setShowForm(true)}
        showAddButton={!filterAssigneeId}
      />

      <div className="bg-[var(--surface-container-lowest)] rounded-[var(--radius-xl)] shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden overflow-x-auto border-none">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-[var(--surface)]/50 border-none">
              <th className="py-5 pl-4 pr-0 w-10">
                <input
                  type="checkbox"
                  checked={tasks.length > 0 && selectedIds.size === tasks.length}
                  ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < tasks.length; }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded accent-[var(--primary)] cursor-pointer"
                />
              </th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Task</th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Company</th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Area</th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Status</th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Priority</th>
              {!filterAssigneeId && (
                <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Assignee</th>
              )}
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Start Date</th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Due</th>
              <th className="text-left py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Time Left</th>
              <th className="text-right py-5 px-8 text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">Actions</th>
            </tr>
          </thead>
          <tbody className="border-none">
            {tasks.map((task: Task) => (
              <TaskRow
                key={task.id}
                task={task}
                inlineEditingId={inlineEditingId}
                inlineField={inlineField}
                inlineValue={inlineValue}
                setInlineValue={setInlineValue}
                startInlineEdit={startInlineEdit}
                cancelInlineEdit={cancelInlineEdit}
                saveInlineText={saveInlineText}
                saveInlineField={saveInlineField}
                updatingTaskId={updatingTaskId}
                onView={setSelectedTask}
                onEdit={(t) => { setEditingTask(t); setShowForm(true); }}
                onDelete={setTaskToDelete}
                isDeleting={deletingId === task.id}
                companies={companies}
                employees={employees}
                showAssignee={!filterAssigneeId}
                isSelected={selectedIds.has(task.id)}
                onToggleSelect={toggleSelect}
              />
            ))}

            {showAddRow && (
              <AddTaskRow 
                newTask={newTask}
                setNewTask={(val) => setNewTask(prev => ({ ...prev, ...val }))}
                onAdd={handleCreateInline}
                onCancel={() => setShowAddRow(false)}
                isPending={createInlineMutation.isPending}
              />
            )}

            {!showAddRow && !filterAssigneeId && (
              <tr
                onClick={() => { 
                  setShowAddRow(true); 
                  setNewTask({ title: "", status: "not_started", priority: "medium", company_id: "", area: "", assignee_id: "", due_date: "", start_date: "" }); 
                }}
                className="cursor-pointer hover:bg-[var(--accent)]/5 transition-colors border-none"
              >
                <td colSpan={colCount} className="py-5 px-8">
                  <div className="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--primary)] transition-colors group/add">
                    <div className="p-1 bg-[var(--surface-container)] rounded-lg group-hover/add:bg-[var(--accent)]/20 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Add task...</span>
                  </div>
                </td>
              </tr>
            )}

            {tasks.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={colCount} className="py-20 text-center text-[var(--muted)]">
                  <p className="font-black uppercase tracking-[0.3em] text-[10px]">No missions found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 px-6">
          <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest">
            Mission <span className="text-[var(--foreground)]">{(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)}</span> of <span className="text-[var(--foreground)]">{pagination.total}</span>
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)} 
              className="rounded-full px-6 bg-[var(--surface-container-lowest)] border-none shadow-[var(--shadow-sm)] hover:bg-[var(--surface)] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-full px-6 bg-[var(--surface-container-lowest)] border-none shadow-[var(--shadow-sm)] hover:bg-[var(--surface)] font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <TaskForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        task={editingTask}
        canChangeAssignee={true}
      />
      <TaskDetail
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
      <DeleteTaskDialog
        open={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
        taskTitle={taskToDelete?.title}
      />

      {/* Bulk delete confirm */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--surface-container-lowest)] rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <h3 className="text-base font-black text-[var(--foreground)] mb-2">
              {selectedIds.size} Tasks Delete Karni Hain?
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6">
              Yeh action permanent hai — wapas nahi ho sakta.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-container)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-[var(--error)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkDeleteMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export Plus for trigger row if needed, but imported in filters already.
import { Plus } from "lucide-react";
