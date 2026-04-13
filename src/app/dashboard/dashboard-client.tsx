"use client";

import { useState, useCallback } from "react";
import { KPICards } from "./kpi-cards";
import { TaskList } from "./task-list";
import { TaskDetail } from "@/components/tasks/task-detail";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { useAuth } from "@/contexts/auth-context";

interface TaskDetailTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  created_at: string;
  estimated_hours: number | null;
  recurrence: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  creator?: { id: string; name: string; email: string };
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

interface KPIData {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

interface SerializedTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  start_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  estimated_hours?: number | null;
  recurrence?: string | null;
  assignee?: { id: string; name: string; email?: string } | null;
  creator?: { id: string; name: string; email?: string } | null;
  attachments?: any[];
}

function calcKpis(tasks: SerializedTask[]): KPIData {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    pending: tasks.filter(t => t.status !== "completed").length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== "completed").length,
  };
}

export function DashboardClient({ kpis: initialKpis, tasks: initialTasks, error, authError }: { kpis: KPIData; tasks: SerializedTask[]; error?: string | null; authError?: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SerializedTask[]>(initialTasks);
  const [kpis, setKpis] = useState<KPIData>(initialKpis);
  const [selectedTask, setSelectedTask] = useState<TaskDetailTask | null>(null);

  const refreshTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.data) {
        const all: SerializedTask[] = data.data;
        // Only update if visible tasks changed or KPIs need updating
        setTasks(all.slice(0, 10));
        setKpis(calcKpis(all));
      }
    } catch {}
  }, []);

  // Standardized real-time subscriptions with basic filters
  useRealtimeSubscription({ 
    table: 'tasks', 
    event: '*', 
    onMessage: refreshTasks, 
    enabled: !!user 
  });

  const handleTaskClick = (task: SerializedTask) => {
    setSelectedTask({
      id: task.id,
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      start_date: task.start_date ?? null,
      completed_at: task.completed_at ?? null,
      created_at: task.created_at,
      estimated_hours: task.estimated_hours ?? null,
      recurrence: task.recurrence ?? null,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name, email: task.assignee.email ?? "" } : null,
      creator: task.creator ? { id: task.creator.id, name: task.creator.name, email: task.creator.email ?? "" } : { id: "", name: "", email: "" },
      subtasks: [],
      attachments: task.attachments ?? [],
    });
  };

  return (
    <div className="p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {authError === "unauthorized" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-2">
          <span className="text-lg">🔒</span>
          <span>You must be logged in to access that page.</span>
        </div>
      )}

      {authError === "forbidden" && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded flex items-center gap-2">
          <span className="text-lg">🚫</span>
          <span>You do not have permission to access that page.</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
          Welcome!
        </h1>
        <p className="text-gray-600">Here&apos;s your task overview</p>
      </div>

      <KPICards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="hidden lg:block">
          {/* Left side - empty or future content */}
        </div>

        <div className="w-full">
          <TaskList tasks={tasks} onTaskClick={handleTaskClick} />
        </div>
      </div>

      <TaskDetail
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
