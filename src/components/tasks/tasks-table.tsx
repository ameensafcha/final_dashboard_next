"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { TaskForm } from "./task-form";
import { TaskDetail } from "./task-detail";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus, Search, Eye, Edit2, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Task {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  company_id: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  created_at: string;
  estimated_hours: number | null;
  recurrence: string | null;
  company?: { id: string; name: string } | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  subtasks?: { id: string; title: string; is_completed: boolean }[];
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    file_type: string | null;
    created_at: string;
  }[];
}

interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

interface TasksTableProps {
  initialData?: Task[];
  filterAssigneeId?: string;
  currentUserId?: string;
}

const AREA_OPTIONS = [
  "Production", "Quality", "Warehouse", "Procurement",
  "HR", "Admin", "Development", "Maintenance", "Finance",
];

export function TasksTable({
  initialData = [],
  filterAssigneeId,
  currentUserId,
}: TasksTableProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  // ── Modal / dialog state ───────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(() => Date.now());

  // ── Inline editing state ───────────────────────────────────────────────────
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineField, setInlineField] = useState<"title" | "due_date" | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // ── Add-row state ──────────────────────────────────────────────────────────
  const [showAddRow, setShowAddRow] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    status: "not_started",
    priority: "medium",
    company_id: "",
    area: "",
    assignee_id: "",
    due_date: "",
  });

  const limit = 20;

  // ── Data queries ───────────────────────────────────────────────────────────
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["active-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies?active=true");
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const json = await res.json();
      return json.data || json || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { search, statusFilter, priorityFilter, areaFilter, companyFilter, page, filterAssigneeId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status: statusFilter,
        priority: priorityFilter,
        area: areaFilter,
        company_id: companyFilter === "all" ? "" : companyFilter,
      });
      if (filterAssigneeId) params.append("assignee_id", filterAssigneeId);
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const tasks = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // ── Real-time ──────────────────────────────────────────────────────────────
  const handleRealtimeChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  useRealtimeSubscription({ table: "tasks", onMessage: handleRealtimeChange, enabled: !!currentUserId });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task deleted" });
      setTaskToDelete(null);
    },
    onError: (err: Error) => addNotification({ type: "error", message: err.message }),
  });

  const updateInlineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onMutate: (variables) => {
      setUpdatingTaskId(variables.id);
    },
    onSettled: () => {
      setUpdatingTaskId(null);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: Error) => addNotification({ type: "error", message: err.message }),
  });

  const createInlineMutation = useMutation({
    mutationFn: async (data: typeof newTask) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          company_id: data.company_id || null,
          area: data.area || null,
          assignee_id: data.assignee_id || null,
          due_date: data.due_date || null,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowAddRow(false);
      setNewTask({ title: "", status: "not_started", priority: "medium", company_id: "", area: "", assignee_id: "", due_date: "" });
      addNotification({ type: "success", message: "Task created" });
    },
    onError: (err: Error) => addNotification({ type: "error", message: err.message }),
  });

  // ── Inline edit helpers ────────────────────────────────────────────────────
  const startInlineEdit = (taskId: string, field: "title" | "due_date", value: string) => {
    setInlineEditingId(taskId);
    setInlineField(field);
    setInlineValue(value ?? "");
  };

  const saveInlineText = (task: Task) => {
    const trimmed = inlineValue.trim();
    const original = inlineField === "title" ? task.title : (task.due_date?.slice(0, 10) ?? "");
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

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      setDeletingId(taskToDelete.id);
      deleteMutation.mutate(taskToDelete.id, { onSettled: () => setDeletingId(null) });
    }
  };

  // ── Time Left sub-component ────────────────────────────────────────────────
  const TimeLeftDisplay = React.memo(function TimeLeftDisplay({
    dueDate,
    now,
  }: {
    dueDate: string | null;
    now: number;
  }) {
    const daysLeft = useMemo(() => {
      if (!dueDate) return null;
      return Math.ceil((new Date(dueDate).getTime() - now) / (1000 * 60 * 60 * 24));
    }, [dueDate, now]);

    if (daysLeft === null) return <span className="text-sm text-gray-400">-</span>;

    return (
      <span className={cn(
        "text-xs font-bold px-3 py-1 rounded-full",
        daysLeft < 0 ? "bg-red-50 text-red-700 border border-red-100" :
        daysLeft <= 2 ? "bg-orange-50 text-orange-700" :
        daysLeft <= 7 ? "bg-amber-50 text-amber-700" :
        "bg-green-50 text-green-700"
      )}>
        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
      </span>
    );
  });

  if (isLoading && !data) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Loader2 className="inline-block w-6 h-6 animate-spin mb-3 text-[#E8C547]" />
        <p className="font-medium text-sm">Loading tasks...</p>
      </div>
    );
  }

  const colCount = filterAssigneeId ? 8 : 9;

  return (
    <div className="w-full">
      {/* ── Filters bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center flex-1 w-full md:w-auto">

          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Search</span>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-[#E8C547] focus:bg-white rounded-full text-sm font-medium transition-all outline-none focus:ring-1 focus:ring-[#E8C547]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Status</span>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-9 bg-gray-50 border-gray-200 rounded-full text-xs font-bold text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Priority</span>
            <Select value={priorityFilter} onValueChange={(val) => { setPriorityFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-9 bg-gray-50 border-gray-200 rounded-full text-xs font-bold text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Priority: All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Area</span>
            <Select value={areaFilter} onValueChange={(val) => { setAreaFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-9 bg-gray-50 border-gray-200 rounded-full text-xs font-bold text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Area: All</SelectItem>
                {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Company</span>
            <Select value={companyFilter} onValueChange={(val) => { setCompanyFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="w-[140px] h-9 bg-gray-50 border-gray-200 rounded-full text-xs font-bold text-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Company: All</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!filterAssigneeId && (
          <button
            onClick={() => setShowForm(true)}
            className="w-full md:w-auto px-6 py-2 bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Task</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Company</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Area</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</th>
              {!filterAssigneeId && (
                <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Assignee</th>
              )}
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Due</th>
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Time Left</th>
              <th className="text-right py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">

            {/* ── Existing task rows ──────────────────────────────────────── */}
            {tasks.map((task: Task) => (
              <tr key={task.id} className="hover:bg-gray-50/80 transition-colors group">

                {/* Title */}
                <td
                  className="py-4 px-6"
                  onClick={() => !inlineEditingId && startInlineEdit(task.id, "title", task.title)}
                >
                  {inlineEditingId === task.id && inlineField === "title" ? (
                    <input
                      autoFocus
                      type="text"
                      value={inlineValue}
                      onChange={(e) => setInlineValue(e.target.value)}
                      onBlur={() => saveInlineText(task)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveInlineText(task);
                        if (e.key === "Escape") { setInlineEditingId(null); setInlineField(null); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-sm font-bold text-gray-900 bg-yellow-50/40 border-b-2 border-[#E8C547] outline-none rounded px-1 py-0.5"
                    />
                  ) : (
                    <div className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-[#E8C547] transition-colors">{task.title}</p>
                        {updatingTaskId === task.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8C547]" />}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{task.description}</p>
                      )}
                    </div>
                  )}
                </td>

                {/* Company */}
                <td className="py-4 px-6">
                  <Select
                    value={task.company_id ?? "__none__"}
                    onValueChange={(val) => saveInlineField(task.id, { company_id: val === "__none__" ? null : val })}
                  >
                    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-80 transition-opacity">
                      {task.company
                        ? <span className="text-xs font-bold px-3 py-1 bg-[#E8C547]/10 text-[#E8C547] rounded-full uppercase tracking-tighter">{task.company.name}</span>
                        : <span className="text-sm text-gray-400">—</span>
                      }
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>

                {/* Area */}
                <td className="py-4 px-6">
                  <Select
                    value={task.area ?? "__none__"}
                    onValueChange={(val) => saveInlineField(task.id, { area: val === "__none__" ? null : val })}
                  >
                    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-80 transition-opacity">
                      {task.area
                        ? <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{task.area}</span>
                        : <span className="text-sm text-gray-400">—</span>
                      }
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>

                {/* Status */}
                <td className="py-4 px-6">
                  <Select
                    value={task.status}
                    onValueChange={(val) => saveInlineField(task.id, { status: val })}
                  >
                    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-80 transition-opacity">
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

                {/* Priority */}
                <td className="py-4 px-6">
                  <Select
                    value={task.priority}
                    onValueChange={(val) => saveInlineField(task.id, { priority: val })}
                  >
                    <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-80 transition-opacity">
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

                {/* Assignee */}
                {!filterAssigneeId && (
                  <td className="py-4 px-6">
                    <Select
                      value={task.assignee_id ?? "__none__"}
                      onValueChange={(val) => saveInlineField(task.id, { assignee_id: val === "__none__" ? null : val })}
                    >
                      <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-80 transition-opacity">
                        {task.assignee ? (
                          <div className="flex items-center gap-2.5">
                            <Avatar name={task.assignee.name} size="sm" />
                            <span className="text-sm font-semibold text-gray-700">{task.assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium italic text-gray-400">Unassigned</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                )}

                {/* Due Date */}
                <td
                  className="py-4 px-6"
                  onClick={() => !inlineEditingId && startInlineEdit(task.id, "due_date", task.due_date ? task.due_date.slice(0, 10) : "")}
                >
                  {inlineEditingId === task.id && inlineField === "due_date" ? (
                    <input
                      autoFocus
                      type="date"
                      value={inlineValue}
                      onChange={(e) => setInlineValue(e.target.value)}
                      onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                      onBlur={() => saveInlineText(task)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveInlineText(task);
                        if (e.key === "Escape") { setInlineEditingId(null); setInlineField(null); }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-gray-600 border-b-2 border-[#E8C547] outline-none bg-yellow-50/40 rounded px-1 py-0.5"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-600 cursor-pointer hover:text-[#E8C547] transition-colors">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : <span className="text-gray-400">—</span>
                      }
                    </span>
                  )}
                </td>

                {/* Time Left */}
                <td className="py-4 px-6">
                  <TimeLeftDisplay dueDate={task.due_date} now={now} />
                </td>

                {/* Actions */}
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-all active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => { setEditingTask(task); setShowForm(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer transition-all active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setTaskToDelete(task)}
                      disabled={deletingId === task.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      {deletingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* ── Inline Add Row ──────────────────────────────────────────── */}
            {showAddRow && (
              <tr className="bg-[#E8C547]/5 border-y border-[#E8C547]/20">
                {/* Title */}
                <td className="py-3 px-6">
                  <input
                    autoFocus
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateInline();
                      if (e.key === "Escape") setShowAddRow(false);
                    }}
                    placeholder="New task title..."
                    className="w-full text-sm font-bold text-gray-800 bg-transparent border-b border-[#E8C547] outline-none placeholder:text-gray-400 placeholder:font-normal py-0.5"
                  />
                </td>
                {/* Company */}
                <td className="py-3 px-6">
                  <Select value={newTask.company_id || "__none__"} onValueChange={(v) => setNewTask(p => ({ ...p, company_id: v === "__none__" ? "" : (v ?? "") }))}>
                    <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[120px] outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Company" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                {/* Area */}
                <td className="py-3 px-6">
                  <Select value={newTask.area || "__none__"} onValueChange={(v) => setNewTask(p => ({ ...p, area: v === "__none__" ? "" : (v ?? "") }))}>
                    <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[120px] outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                {/* Status */}
                <td className="py-3 px-6">
                  <Select value={newTask.status} onValueChange={(v) => setNewTask(p => ({ ...p, status: v ?? "" }))}>
                    <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[120px] outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
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
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask(p => ({ ...p, priority: v ?? "" }))}>
                    <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[110px] outline-none focus:ring-0 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
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
                    <Select value={newTask.assignee_id || "__none__"} onValueChange={(v) => setNewTask(p => ({ ...p, assignee_id: v === "__none__" ? "" : (v ?? "") }))}>
                      <SelectTrigger className="h-7 text-xs border-gray-200 rounded-full w-[130px] outline-none focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Unassigned</SelectItem>
                        {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                )}
                {/* Due Date */}
                <td className="py-3 px-6">
                  <input
                    type="date"
                    value={newTask.due_date}
                    onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
                    onChange={(e) => setNewTask(p => ({ ...p, due_date: e.target.value }))}
                    className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#E8C547]"
                  />
                </td>
                {/* Time Left — blank */}
                <td className="py-3 px-6 text-gray-300 text-sm">—</td>
                {/* Add / Cancel */}
                <td className="py-3 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={handleCreateInline}
                      disabled={!newTask.title.trim() || createInlineMutation.isPending}
                      className="px-3 py-1.5 text-xs font-bold bg-[#1A1A1A] hover:bg-black text-white rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1"
                    >
                      {createInlineMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                    </button>
                    <button
                      onClick={() => setShowAddRow(false)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* ── "Add task…" trigger row ─────────────────────────────────── */}
            {!showAddRow && !filterAssigneeId && (
              <tr
                onClick={() => { setShowAddRow(true); setNewTask({ title: "", status: "not_started", priority: "medium", company_id: "", area: "", assignee_id: "", due_date: "" }); }}
                className="cursor-pointer hover:bg-[#E8C547]/5 transition-colors border-t border-dashed border-gray-100"
              >
                <td colSpan={colCount} className="py-3 px-6">
                  <div className="flex items-center gap-2 text-gray-300 hover:text-[#E8C547] transition-colors">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add task...</span>
                  </div>
                </td>
              </tr>
            )}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {tasks.length === 0 && !showAddRow && (
              <tr>
                <td colSpan={colCount} className="py-12 text-center text-gray-500">
                  <p className="font-medium text-sm">No tasks found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500 font-medium">
            Showing{" "}
            <span className="text-gray-900 font-bold">{(page - 1) * limit + 1}–{Math.min(page * limit, pagination.total)}</span>
            {" "}of{" "}
            <span className="text-gray-900 font-bold">{pagination.total}</span> tasks
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-full px-4">
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-full px-4">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
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
    </div>
  );
}
