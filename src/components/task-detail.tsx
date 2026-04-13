"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { Check, Clock, MessageSquare, Plus, Trash2, User, Calendar, Flag, Activity, FileText, ExternalLink, Paperclip, Loader2 } from "lucide-react";
import { TaskAttachmentUploader } from "./task-attachment-uploader";
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

interface Subtask { id: string; title: string; is_completed: boolean }
interface Comment { id: string; content: string; created_at: string; employee: { id: string; name: string; email: string; } }
interface TimeLog { id: string; hours: number; notes: string | null; created_at: string; employee: { id: string; name: string; email: string; } }

interface TaskDetailProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const priorityColors = {
  low: "bg-gray-50 text-gray-500",
  medium: "bg-blue-50 text-blue-600",
  high: "bg-orange-50 text-orange-600",
  urgent: "bg-red-50 text-red-600",
};

const statusColors = {
  not_started: "bg-gray-100 text-gray-600",
  in_progress: "bg-amber-100 text-amber-700",
  review: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
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
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newTimeHours, setNewTimeHours] = useState("");
  const [newTimeNotes, setNewTimeNotes] = useState("");
  const [localTask, setLocalTask] = useState<Task | null>(null);

  useEffect(() => {
    if (open && task) setLocalTask(task);
    if (!open) {
      setLocalTask(null);
    }
  }, [task, open]);

  const currentTask = localTask || task;

  const { data: subtasks = [], isLoading: loadingSubtasks } = useQuery<Subtask[]>({
    queryKey: ["subtasks", currentTask?.id],
    queryFn: async () => {
      if (!currentTask) return [];
      const res = await fetch(`/api/tasks/${currentTask.id}/subtasks`);
      return (await res.json()).data || [];
    },
    enabled: !!currentTask && open,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery<Comment[]>({
    queryKey: ["comments", currentTask?.id],
    queryFn: async () => {
      if (!currentTask) return [];
      const res = await fetch(`/api/tasks/${currentTask.id}/comments`);
      return (await res.json()).data || [];
    },
    enabled: !!currentTask && open,
  });

  const { data: timeLogs = [], isLoading: loadingLogs } = useQuery<TimeLog[]>({
    queryKey: ["time-logs", currentTask?.id],
    queryFn: async () => {
      if (!currentTask) return [];
      const res = await fetch(`/api/tasks/${currentTask.id}/time-logs`);
      return (await res.json()).data || [];
    },
    enabled: !!currentTask && open,
  });

  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/subtasks`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subtasks", currentTask?.id] }); setNewSubtask(""); },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/subtasks`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, is_completed }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", currentTask?.id] }),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/subtasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks", currentTask?.id] }),
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/comments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["comments", currentTask?.id] }); setNewComment(""); },
  });

  const createTimeLogMutation = useMutation({
    mutationFn: async (data: { hours: number; notes?: string }) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/time-logs`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs", currentTask?.id] });
      setNewTimeHours(""); setNewTimeNotes("");
      addNotification({ type: "success", message: "Time logged" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await fetch("/api/tasks", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: currentTask!.id, ...data }),
      });
      if (!res.ok) throw new Error("Failed"); return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setLocalTask(prev => prev ? { ...prev, ...(variables as any) } : null);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/api/tasks/${currentTask!.id}/attachments?attachment_id=${attachmentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete attachment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Attachment deleted" });
    },
  });

  const completedSubtasks = subtasks.filter((s) => s.is_completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);

  if (!currentTask) return null;

  const PropertyRow = ({ icon: Icon, label, children, loading = false }: any) => (
    <div className="flex items-center group py-1 min-h-[32px]">
      <div className="flex items-center gap-2 w-[120px] shrink-0 text-gray-400">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <div className="flex-1 text-[13px] font-medium text-gray-900">
        {loading ? <Loader2 className="w-3 h-3 animate-spin text-gray-200" /> : children}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-white overflow-y-auto p-0 border-none sm:max-w-2xl">
        <div className="flex flex-col h-full">
          <div className="flex-1 p-10 md:p-16 space-y-12">
            
            {/* Minimalist Title */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                <FileText className="w-3 h-3" />
                <span>Private / Tasks</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight leading-[1.1]">
                {currentTask.title}
              </h1>
            </div>

            {/* Properties List (Notion Style) */}
            <div className="space-y-0.5">
              <PropertyRow icon={Activity} label="Status">
                <Select 
                  value={currentTask.status} 
                  disabled={updateTaskMutation.isPending}
                  onValueChange={(val) => updateTaskMutation.mutate({ status: val } as any)}
                >
                  <SelectTrigger className={cn(
                    "w-fit h-7 px-2 py-0 rounded text-[11px] font-bold uppercase tracking-wider border-none hover:bg-gray-100",
                    statusColors[currentTask.status as keyof typeof statusColors] || "bg-gray-100 text-gray-600"
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[11px] font-bold uppercase tracking-wider">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>

              <PropertyRow icon={Flag} label="Priority">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                  priorityColors[currentTask.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-600"
                )}>
                  {currentTask.priority}
                </span>
              </PropertyRow>

              <PropertyRow icon={User} label="Assignee">
                {currentTask.assignee ? (
                  <div className="flex items-center gap-2 hover:bg-gray-50 px-1.5 py-0.5 rounded-md cursor-default w-fit transition-colors">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-700">
                      {currentTask.assignee.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{currentTask.assignee.name}</span>
                  </div>
                ) : <span className="text-gray-300 italic px-1.5">Empty</span>}
              </PropertyRow>

              <PropertyRow icon={Clock} label="Estimate">
                <span className="px-1.5">{currentTask.estimated_hours ? `${currentTask.estimated_hours}h` : <span className="text-gray-300 italic">Empty</span>}</span>
              </PropertyRow>

              <PropertyRow icon={Activity} label="Actual Logged" loading={loadingLogs}>
                <span className={cn("px-1.5", currentTask.estimated_hours && totalHours > currentTask.estimated_hours ? "text-red-600 font-bold" : "text-gray-900")}>
                  {totalHours}h
                </span>
              </PropertyRow>

              {currentTask.recurrence && (
                <PropertyRow icon={Clock} label="Recurrence">
                  <span className="text-amber-600 font-bold uppercase text-[10px] tracking-widest bg-amber-50 px-2 py-0.5 rounded">
                    {currentTask.recurrence}
                  </span>
                </PropertyRow>
              )}

              <PropertyRow icon={Calendar} label="Timeline">
                <div className="flex items-center gap-2 px-1.5">
                  <span className="hover:bg-gray-50 px-1 rounded transition-colors">{currentTask.start_date ? new Date(currentTask.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "Start"}</span>
                  <span className="text-gray-200">→</span>
                  <span className="hover:bg-gray-50 px-1 rounded transition-colors">{currentTask.due_date ? new Date(currentTask.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "End"}</span>
                </div>
              </PropertyRow>
            </div>

            {/* Description Section */}
            <div className="space-y-4 pt-4 border-t border-gray-50">
              {currentTask.description ? (
                <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                  {currentTask.description}
                </p>
              ) : (
                <p className="text-sm text-gray-300 italic">Add a description...</p>
              )}
            </div>

            {/* Subtasks checklist */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Subtasks</h3>
                {loadingSubtasks && <Loader2 className="w-3 h-3 animate-spin text-gray-200" />}
              </div>
              
              <div className="space-y-1">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="group flex items-center gap-3 py-1.5 px-2 hover:bg-gray-50 rounded-md transition-all">
                    <button
                      onClick={() => toggleSubtaskMutation.mutate({ id: subtask.id, is_completed: !subtask.is_completed })}
                      disabled={toggleSubtaskMutation.isPending}
                      className={cn(
                        "shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all",
                        subtask.is_completed ? "bg-blue-500 border-blue-500" : "border-gray-300 hover:border-gray-400 bg-white"
                      )}
                    >
                      {subtask.is_completed && <Check className="w-3 h-3 text-white stroke-[4]" />}
                    </button>
                    <span className={cn(
                      "flex-1 text-[14px] font-medium transition-all",
                      subtask.is_completed ? "line-through text-gray-300" : "text-gray-700"
                    )}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                      disabled={deleteSubtaskMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                
                <div className="flex items-center gap-3 px-2 py-1.5">
                  <Plus className="w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="New subtask..."
                    className="flex-1 bg-transparent border-none text-[14px] font-medium placeholder:text-gray-300 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubtask.trim()) createSubtaskMutation.mutate(newSubtask.trim());
                    }}
                  />
                  {createSubtaskMutation.isPending && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-6 pt-6">
              <h3 className="text-sm font-bold text-gray-900">Attachments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentTask.attachments?.map((file) => (
                  <div key={file.id} className="group p-3 border border-gray-100 rounded-xl flex items-center justify-between gap-3 hover:border-gray-200 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{file.file_name}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                          {file.file_size ? `${(file.file_size / 1024).toFixed(0)} KB` : "--"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-gray-900">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => deleteAttachmentMutation.mutate(file.id)} disabled={deleteAttachmentMutation.isPending} className="p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <TaskAttachmentUploader
                  taskId={currentTask.id}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
                />
              </div>
            </div>

            {/* Time Logs */}
            <div className="space-y-6 pt-6">
              <h3 className="text-sm font-bold text-gray-900">Time Tracking</h3>
              <div className="space-y-4">
                <div className="flex gap-2 bg-gray-50/50 p-2 rounded-xl">
                  <input
                    type="number"
                    value={newTimeHours}
                    onChange={(e) => setNewTimeHours(e.target.value)}
                    placeholder="Hr"
                    className="w-14 px-2 py-1.5 bg-white border border-gray-100 rounded-lg text-[13px] font-bold outline-none"
                    min="0" step="0.5"
                  />
                  <input
                    type="text"
                    value={newTimeNotes}
                    onChange={(e) => setNewTimeNotes(e.target.value)}
                    placeholder="Notes..."
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-[13px] font-medium outline-none"
                  />
                  <button
                    onClick={() => newTimeHours && createTimeLogMutation.mutate({ hours: parseFloat(newTimeHours), notes: newTimeNotes || undefined })}
                    disabled={!newTimeHours || createTimeLogMutation.isPending}
                    className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-black transition-all disabled:opacity-50 min-w-[60px] flex items-center justify-center"
                  >
                    {createTimeLogMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Log"}
                  </button>
                </div>

                <div className="divide-y divide-gray-50">
                  {timeLogs.map((log) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-bold text-gray-900">{log.hours}h</span>
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-medium text-gray-500">{log.employee.name}</p>
                          {log.notes && <p className="text-[11px] text-gray-400">{log.notes}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-300 uppercase opacity-0 group-hover:opacity-100 transition-opacity">{new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- DISCUSSION (AT THE VERY BOTTOM) --- */}
            <div className="space-y-10 pt-16 border-t border-gray-100 pb-20">
              <h3 className="text-sm font-bold text-gray-900">Discussion</h3>

              <div className="space-y-8">
                <div className="space-y-8">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-400 shrink-0">
                        {comment.employee.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-gray-900">{comment.employee.name}</span>
                          <span className="text-[10px] font-medium text-gray-300">
                            {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[14px] text-gray-600 leading-relaxed font-medium">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-4 pt-4">
                  <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                    YOU
                  </div>
                  <div className="flex-1 space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl text-[14px] font-medium focus:ring-1 focus:ring-gray-200 outline-none min-h-[100px] resize-none placeholder:text-gray-300"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                        disabled={!newComment.trim() || createCommentMutation.isPending}
                        className="px-6 py-2 bg-gray-900 text-white font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {createCommentMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                        Send Message
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
