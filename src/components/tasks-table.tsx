"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { supabase } from "@/lib/supabase";
import { TaskForm } from "./task-form";
import { TaskDetail } from "./task-detail";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Plus, Search, Trash2, Edit } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
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
}

export function TasksTable({ initialData = [], filterAssigneeId }: TasksTableProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialData);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          
          // Fetch fresh data after any change to get full relations
          fetch('/api/tasks')
            .then(res => res.json())
            .then(json => {
              if (json.data) {
                setTasks(json.data);
              }
            })
            .catch(err => console.error('Failed to fetch fresh data:', err));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
    return true;
  });

  if (tasks.length === 0 && !search && !statusFilter && !priorityFilter) {
    return (
      <>
        <div className="text-center py-12 text-gray-500">
          No tasks found
        </div>
        <TaskForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          task={editingTask}
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
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-3 items-center flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
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
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <Button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-amber-50">
            <tr>
              <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Task</th>
              <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Priority</th>
              <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Assignee</th>
              <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Due Date</th>
              <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="border-t hover:bg-gray-50">
                <td className="p-4">
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="p-4">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="p-4">
                  {task.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={task.assignee.name} size="sm" />
                      <span className="text-sm text-gray-600">{task.assignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                    <button
                      onClick={() => { setEditingTask(task); setShowForm(true); }}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this task?")) {
                          deleteMutation.mutate(task.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No tasks found
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
      />

      <TaskDetail
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}