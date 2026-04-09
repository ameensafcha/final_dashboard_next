"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { Check, Clock, MessageSquare, Plus, Trash2, User, Calendar, Flag, Activity, FileText, UserCheck } from "lucide-react";

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
  urgent: "bg-red-100 text-red-800 border border-red-200",
};

const statusColors = {
  not_started: "border-gray-200 text-gray-700 bg-gray-50",
  in_progress: "border-blue-300 text-blue-700 bg-blue-50",
  review: "border-amber-300 text-amber-700 bg-amber-50",
  completed: "border-green-300 text-green-700 bg-green-50",
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
  const [localTask, setLocalTask] = useState<Task | null>(null);

  useEffect(() => {
    if (open && task) {
      setLocalTask(task);
    }
    if (!open) {
      setLocalTask(null);
    }
  }, [task, open]);

  const currentTask = localTask || task;

  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: ["subtasks", currentTask?.id],
    queryFn: async () => {
      if (!currentTask) return [];
      const res = await fetch(`/api/tasks/${currentTask.id}/subtasks`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!currentTask && activeTab === "subtasks",
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", currentTask?.id],
    queryFn: async () => {
      if (!currentTask) return [];
      const res = await fetch(`/api/tasks/${currentTask.id}/comments`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!currentTask && activeTab === "comments",
  });

  const { data: timeLogs = [] } = useQuery<TimeLog[]>({
    queryKey: ["time-logs", currentTask?.id],
    queryFn: async () => {
      if (!currentTask) return [];
      const res = await fetch(`/api/tasks/${currentTask.id}/time-logs`);
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!currentTask && activeTab === "time",
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", currentTask?.id] });
      setNewSubtask("");
    },
    onError: () => addNotification({ type: "error", message: "Failed to add subtask" }),
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/subtasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_completed }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", currentTask?.id] }),
    onError: () => addNotification({ type: "error", message: "Failed to update subtask" }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/subtasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", currentTask?.id] }),
    onError: () => addNotification({ type: "error", message: "Failed to delete subtask" }),
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", currentTask?.id] });
      setNewComment("");
    },
    onError: () => addNotification({ type: "error", message: "Failed to add comment" }),
  });

  const createTimeLogMutation = useMutation({
    mutationFn: async (data: { hours: number; notes?: string }) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/time-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs", currentTask?.id] });
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
        body: JSON.stringify({ id: currentTask!.id, ...data }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setLocalTask(prev => prev ? { ...prev, ...variables } : null);
      addNotification({ type: "success", message: "Task updated" });
    },
    onError: () => addNotification({ type: "error", message: "Failed to update task" }),
  });

  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  if (!currentTask) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl md:w-1/2 md:max-w-[50%] bg-[#FAFAFA] overflow-y-auto border-l-0 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl font-bold text-gray-900">{currentTask.title}</SheetTitle>
          </SheetHeader>

          {/* Modern Segmented Tabs */}
          <div className="flex gap-1 p-1.5 bg-gray-200/60 rounded-xl mb-6 overflow-x-auto hide-scrollbar">
            {(["overview", "subtasks", "comments", "time"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-semibold capitalize rounded-lg transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                }`}
              >
                {tab === "overview" && "Overview"}
                {tab === "subtasks" && `Subtasks (${subtasks.length})`}
                {tab === "comments" && `Comments (${comments.length})`}
                {tab === "time" && `Time (${totalHours}h)`}
              </button>
            ))}
          </div>

          <div className="mt-2">
            {activeTab === "overview" && (
              <div className="space-y-4">

                {/* Status Dropdown */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Status</span>
                  </div>
                  <select
                    value={currentTask.status}
                    onChange={(e) => updateTaskMutation.mutate({ status: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-xl text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all ${statusColors[currentTask.status as keyof typeof statusColors] || statusColors.not_started}`}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Priority + Assignee Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <Flag className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Priority</span>
                    </div>
                    <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold ${priorityColors[currentTask.priority as keyof typeof priorityColors]}`}>
                      {currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)}
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Assignee</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {currentTask.assignee?.name || <span className="text-gray-400 font-normal italic">Unassigned</span>}
                    </p>
                  </div>
                </div>

                {/* Created By */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Created By</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{currentTask.creator?.name || "-"}</p>
                </div>

                {/* Dates Grid */}
                {(currentTask.start_date || currentTask.due_date) && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentTask.start_date && (
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Date</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(currentTask.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                    {currentTask.due_date && (
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Due Date</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(currentTask.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed Banner */}
                {currentTask.completed_at && (
                  <div className="bg-green-50 rounded-2xl p-5 shadow-sm border border-green-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1">Completed On</p>
                        <p className="text-sm font-semibold text-green-800">
                          {new Date(currentTask.completed_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {subtasks.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Progress</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{completedSubtasks}/{subtasks.length} tasks</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-400 mt-2 text-right">
                      {Math.round(progress)}% complete
                    </p>
                  </div>
                )}

                {/* Description */}
                {currentTask.description && (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{currentTask.description}</p>
                  </div>
                )}

              </div>
            )}

            {/* --- SUBTASKS TAB --- */}
            {activeTab === "subtasks" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a new subtask..."
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubtask.trim()) {
                        createSubtaskMutation.mutate(newSubtask.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => newSubtask.trim() && createSubtaskMutation.mutate(newSubtask.trim())}
                    className="px-4 py-2.5 bg-[#E8C547] hover:bg-[#D6B53D] text-[#1A1A1A] font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="group flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                      <button
                        onClick={() => toggleSubtaskMutation.mutate({ id: subtask.id, is_completed: !subtask.is_completed })}
                        className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          subtask.is_completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-amber-400"
                        }`}
                      >
                        {subtask.is_completed && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <span className={`flex-1 text-sm font-medium transition-colors ${subtask.is_completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {subtasks.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm font-medium">No subtasks added yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- COMMENTS TAB --- */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newComment.trim()) {
                        createCommentMutation.mutate(newComment.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                    className="px-4 py-2.5 bg-[#E8C547] hover:bg-[#D6B53D] text-[#1A1A1A] font-semibold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">{comment.employee.name}</span>
                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                          {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm font-medium">No comments yet. Start the conversation!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- TIME LOGS TAB --- */}
            {activeTab === "time" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="number"
                    value={newTimeHours}
                    onChange={(e) => setNewTimeHours(e.target.value)}
                    placeholder="Hours (e.g. 1.5)"
                    className="w-full sm:w-32 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all shadow-sm"
                    min="0"
                    step="0.5"
                  />
                  <input
                    type="text"
                    value={newTimeNotes}
                    onChange={(e) => setNewTimeNotes(e.target.value)}
                    placeholder="What did you work on? (optional)"
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all shadow-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTimeHours) {
                        createTimeLogMutation.mutate({ hours: parseFloat(newTimeHours), notes: newTimeNotes || undefined });
                      }
                    }}
                  />
                  <button
                    onClick={() => newTimeHours && createTimeLogMutation.mutate({ hours: parseFloat(newTimeHours), notes: newTimeNotes || undefined })}
                    disabled={!newTimeHours}
                    className="px-4 py-2.5 bg-[#E8C547] hover:bg-[#D6B53D] text-[#1A1A1A] font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="sm:hidden">Log Time</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {timeLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md">{log.hours}h</span>
                          <span className="text-sm font-semibold text-gray-700">{log.employee.name}</span>
                        </div>
                        {log.notes && <p className="text-sm text-gray-500 mt-1">{log.notes}</p>}
                      </div>
                      <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md self-start sm:self-auto">
                        {new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  ))}
                  {timeLogs.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-400 text-sm font-medium">No time logged for this task yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}