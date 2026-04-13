"use client";

import { TaskBoard } from "@/components/tasks/task-board";

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

interface KanbanClientProps {
  userId: string;
  initialData: Task[];
}

export function KanbanClient({ userId, initialData }: KanbanClientProps) {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Kanban Board</h1>
          <p className="text-gray-600">Drag tasks between columns to update status</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <TaskBoard
          initialData={initialData}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}
