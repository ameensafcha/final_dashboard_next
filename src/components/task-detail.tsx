"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { Check, Clock, MessageSquare, Plus, Trash2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
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

interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface TimeLog {
  id: string;
  hours: number;
  notes: string | null;
  created_at: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const statusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

export function TaskDetail({ task, open, onClose }: TaskDetailProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [activeTab, setActiveTab] = useState<"overview" | "subtasks" | "comments" | "time">("overview");
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newTimeHours, setNewTimeHours] = useState("");
  const [newTimeNotes, setNewTimeNotes] = useState("");

  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: ["subtasks", task?.id],
    queryFn: async () => {
      if (!task) return [];
      const res = await fetch(`/api/tasks/${task.id}/subtasks`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!task && activeTab === "subtasks",
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", task?.id],
    queryFn: async () => {
      if (!task) return [];
      const res = await fetch(`/api/tasks/${task.id}/comments`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!task && activeTab === "comments",
  });

  const { data: timeLogs = [] } = useQuery<TimeLog[]>({
    queryKey: ["time-logs", task?.id],
    queryFn: async () => {
      if (!task) return [];
      const res = await fetch(`/api/tasks/${task.id}/time-logs`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!task && activeTab === "time",
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/tasks/${task!.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", task?.id] });
      setNewSubtask("");
    },
    onError: () => addNotification({ type: "error", message: "Failed to add subtask" }),
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const res = await fetch(`/api/tasks/${task!.id}/subtasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_completed }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", task?.id] }),
    onError: () => addNotification({ type: "error", message: "Failed to update subtask" }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${task!.id}/subtasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", task?.id] }),
    onError: () => addNotification({ type: "error", message: "Failed to delete subtask" }),
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${task!.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task?.id] });
      setNewComment("");
    },
    onError: () => addNotification({ type: "error", message: "Failed to add comment" }),
  });

  const createTimeLogMutation = useMutation({
    mutationFn: async (data: { hours: number; notes?: string }) => {
      const res = await fetch(`/api/tasks/${task!.id}/time-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs", task?.id] });
      setNewTimeHours("");
      setNewTimeNotes("");
      addNotification({ type: "success", message: "Time logged" });
    },
    onError: () => addNotification({ type: "error", message: "Failed to log time" }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task!.id, ...data }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task updated" });
    },
    onError: () => addNotification({ type: "error", message: "Failed to update task" }),
  });

  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <div className="flex gap-2 border-b mb-4">
            {(["overview", "subtasks", "comments", "time"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-amber-400 text-amber-700"
                    : "text-gray-500"
                }`}
              >
                {tab === "overview" && "Overview"}
                {tab === "subtasks" && `Subtasks (${subtasks.length})`}
                {tab === "comments" && `Comments (${comments.length})`}
                {tab === "time" && `Time (${totalHours}h)`}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-4">
              {task.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskMutation.mutate({ status: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Assignee</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {task.assignee?.name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created by</label>
                  <p className="text-sm text-gray-700 mt-1">{task.creator?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {task.due_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-sm text-gray-700 mt-1">
                      {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {task.completed_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Completed</label>
                    <p className="text-sm text-gray-700 mt-1">
                      {new Date(task.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {subtasks.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Progress</label>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {completedSubtasks} of {subtasks.length} subtasks completed
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "subtasks" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add subtask..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newSubtask.trim()) {
                      createSubtaskMutation.mutate(newSubtask.trim());
                    }
                  }}
                />
                <button
                  onClick={() => newSubtask.trim() && createSubtaskMutation.mutate(newSubtask.trim())}
                  className="px-3 py-2 bg-amber-400 text-white rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => toggleSubtaskMutation.mutate({ id: subtask.id, is_completed: !subtask.is_completed })}
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        subtask.is_completed ? "bg-green-500 border-green-500" : "border-gray-300"
                      }`}
                    >
                      {subtask.is_completed && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${subtask.is_completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {subtasks.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">No subtasks yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add comment..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newComment.trim()) {
                      createCommentMutation.mutate(newComment.trim());
                    }
                  }}
                />
                <button
                  onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                  className="px-3 py-2 bg-amber-400 text-white rounded-lg text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">{comment.employee.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">No comments yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "time" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newTimeHours}
                  onChange={(e) => setNewTimeHours(e.target.value)}
                  placeholder="Hours"
                  className="w-20 px-3 py-2 border rounded-lg text-sm"
                  min="0"
                  step="0.5"
                />
                <input
                  type="text"
                  value={newTimeNotes}
                  onChange={(e) => setNewTimeNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => newTimeHours && createTimeLogMutation.mutate({ hours: parseFloat(newTimeHours), notes: newTimeNotes || undefined })}
                  disabled={!newTimeHours}
                  className="px-3 py-2 bg-amber-400 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {timeLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{log.hours}h</span>
                      {log.notes && <span className="text-xs text-gray-500 ml-2">{log.notes}</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {log.employee.name} • {new Date(log.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {timeLogs.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">No time logged yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}