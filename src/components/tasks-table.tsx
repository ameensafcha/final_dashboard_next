"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { TaskForm } from "./task-form";
import { TaskDetail } from "./task-detail";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

interface Task {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  created_at: string;
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
}

interface TasksTableProps {
  initialData?: Task[];
  filterAssigneeId?: string;
  currentUserId?: string;
  currentUserRole?: string;
}

export function TasksTable({
  initialData = [],
  filterAssigneeId,
  currentUserId,
  currentUserRole,
}: TasksTableProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [tasks, setTasks] = useState<Task[]>(() =>
    filterAssigneeId
      ? initialData.filter(t => t.assignee?.id === filterAssigneeId)
      : initialData
  );
  const [isLoading, setIsLoading] = useState(() =>
    !!(filterAssigneeId && initialData.length === 0)
  );

// Memoized time left display component - only updates when task.due_date or now changes
const TimeLeftDisplay = React.memo(function TimeLeftDisplay({ 
  dueDate, 
  now 
}: { 
  dueDate: string | null; 
  now: number 
}) {
  const daysLeft = useMemo(() => {
    if (!dueDate) return null;
    return Math.ceil((new Date(dueDate).getTime() - now) / (1000 * 60 * 60 * 24));
  }, [dueDate, now]);

  if (daysLeft === null) {
    return <span className="text-sm text-gray-400">-</span>;
  }

  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
      daysLeft < 0 ? "bg-red-50 text-red-700 border border-red-100" :
      daysLeft <= 2 ? "bg-orange-50 text-orange-700" :
      daysLeft <= 7 ? "bg-amber-50 text-amber-700" :
      "bg-green-50 text-green-700"
    }`}>
      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
    </span>
  );
});

  useEffect(() => {
    if (filterAssigneeId && initialData.length === 0) {
      setIsLoading(true);
      fetch(`/api/tasks?assignee_id=${filterAssigneeId}`)
        .then(res => res.json())
        .then(json => {
          if (json.data) setTasks(json.data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [filterAssigneeId]);

  // Real-time subscription to tasks table for UPDATE events
  const handleTaskUpdate = useCallback((payload: { new: Task; old: Task }) => {
    console.log('[TasksTable] Task updated:', payload.new.id);
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === payload.new.id ? { ...task, ...payload.new } : task
      )
    );
  }, []);

  useRealtimeSubscription({
    table: 'tasks',
    event: 'UPDATE',
    onMessage: handleTaskUpdate,
    enabled: !!currentUserId,
  });

  // Real-time subscription to task_comments table for INSERT events
  const handleCommentInsert = useCallback((payload: { new: { task_id: string } }) => {
    console.log('[TasksTable] Comment added to task:', payload.new.task_id);
    // When a comment is added to a task, optionally update task metadata
    // For now, we log the event - UI may show comment count or trigger task list refresh
  }, []);

  useRealtimeSubscription({
    table: 'task_comments',
    event: 'INSERT',
    onMessage: handleCommentInsert,
    enabled: !!currentUserId,
  });

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
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const filteredTasks = tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter && task.status !== statusFilter) {
      return false;
    }
    if (priorityFilter && task.priority !== priorityFilter) {
      return false;
    }
    if (areaFilter && task.area !== areaFilter) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-[#E8C547] rounded-full animate-spin mb-3" />
        <p className="font-medium text-sm">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0 && !search && !statusFilter && !priorityFilter && !areaFilter) {
    return (
      <>
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No tasks found</p>
          {!filterAssigneeId && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-2.5 bg-[#E8C547] hover:bg-[#D6B53D] text-[#1A1A1A] font-bold rounded-full transition-colors text-sm shadow-sm"
            >
              Create your first task
            </button>
          )}
        </div>
        <TaskForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          task={editingTask}
          canChangeAssignee={currentUserRole === "admin"}
        />
        <TaskDetail
          task={selectedTask}
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      </>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center flex-1 w-full md:w-auto">
          
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 focus:border-[#E8C547] focus:bg-white rounded-full text-sm font-medium transition-all outline-none focus:ring-1 focus:ring-[#E8C547]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-bold text-gray-700 cursor-pointer outline-none transition-all focus:border-[#E8C547] focus:ring-1 focus:ring-[#E8C547]"
          >
            <option value="">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-bold text-gray-700 cursor-pointer outline-none transition-all focus:border-[#E8C547] focus:ring-1 focus:ring-[#E8C547]"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-bold text-gray-700 cursor-pointer outline-none transition-all focus:border-[#E8C547] focus:ring-1 focus:ring-[#E8C547]"
          >
            <option value="">All Areas</option>
            <option value="Production">Production</option>
            <option value="Quality">Quality</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Procurement">Procurement</option>
            <option value="HR">HR</option>
            <option value="Admin">Admin</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Finance">Finance</option>
          </select>
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

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="text-left py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Task</th>
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
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50/80 transition-colors group">
                <td className="py-4 px-6">
                  <div>
                    <p className="font-bold text-sm text-gray-900 group-hover:text-[#E8C547] transition-colors">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 max-w-[200px]">{task.description}</p>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  {task.area ? (
                    <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-600 rounded-full">{task.area}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <StatusBadge status={task.status} />
                </td>
                <td className="py-4 px-6">
                  <PriorityBadge priority={task.priority} />
                </td>
                {!filterAssigneeId && (
                  <td className="py-4 px-6">
                    {task.assignee ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar name={task.assignee.name} size="sm" />
                        <span className="text-sm font-semibold text-gray-700">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium italic text-gray-400">Unassigned</span>
                    )}
                  </td>
                )}
                <td className="py-4 px-6 text-sm font-semibold text-gray-600">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                </td>
                <td className="py-4 px-6">
                  <TimeLeftDisplay dueDate={task.due_date} now={now} />
                </td>
                
                {/* --- ACTIONS COLUMN (SOFT TINTED BUTTONS) --- */}
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    
                    {/* View Button - Soft Blue */}
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                    >
                      View
                    </button>

                    {/* Edit Button - Soft Amber */}
                    {(currentUserRole === "admin" || task.creator?.id === currentUserId) && (
                      <button
                        onClick={() => { setEditingTask(task); setShowForm(true); }}
                        className="px-4 py-2 text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                      >
                        Edit
                      </button>
                    )}

                    {/* Delete Button - Soft Red */}
                    {(currentUserRole === "admin" || task.creator?.id === currentUserId) && (
                      <button
                        onClick={() => {
                          if (confirm("Delete this task?")) {
                            deleteMutation.mutate(task.id);
                          }
                        }}
                        className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                      >
                        Delete
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <p className="font-medium text-sm">No tasks match your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TaskForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        task={editingTask}
        canChangeAssignee={currentUserRole === "admin"}
      />

      <TaskDetail
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}