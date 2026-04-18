"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { Check, Clock, MessageSquare, Plus, Trash2, User, Calendar, Flag, Activity, FileText, ExternalLink, Paperclip, Loader2, Building2 } from "lucide-react";
import { TaskAttachmentUploader } from "./task-attachment-uploader";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  company?: { id: string; name: string } | null;
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

type ActiveTab = "info" | "tasks" | "comments" | "files";

function PropertyRow({ icon: Icon, label, children, loading = false }: {
  icon: React.ElementType;
  label: string;
  children?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center group py-3 min-h-[40px]">
      <div className="flex items-center gap-3 w-[140px] shrink-0 text-[var(--muted)]">
        <div className="p-1.5 bg-[var(--surface)] rounded-lg group-hover:bg-[var(--accent)]/20 group-hover:text-[var(--primary)] transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex-1 text-[13px] font-bold text-[var(--foreground)]">
        {loading ? <Loader2 className="w-3 h-3 animate-spin text-[var(--primary)]" /> : children}
      </div>
    </div>
  );
}

function TabButton({ id, label, icon: Icon, count, activeTab, setActiveTab }: {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  count?: number;
  activeTab: ActiveTab;
  setActiveTab: (id: ActiveTab) => void;
}) {
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-full",
        activeTab === id
          ? "bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-lg shadow-black/10 scale-[1.02]"
          : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-container)]/50"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-black",
          activeTab === id ? "bg-[var(--surface-container-lowest)]/20 text-[var(--secondary-foreground)]" : "bg-[var(--surface-container)] text-[var(--muted)]"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

const priorityColors = {
  low: "bg-[var(--surface-container)] text-[var(--muted)]",
  medium: "bg-[var(--info-bg)]/50 text-[var(--info)]",
  high: "bg-[var(--accent)]/20 text-[var(--primary)]",
  urgent: "bg-[var(--error-bg)]/50 text-[var(--error)]",
};

const statusColors = {
  not_started: "bg-[var(--surface-container)]/50 text-[var(--muted)]",
  in_progress: "bg-[var(--accent)]/20 text-[var(--primary)]",
  review: "bg-[var(--info-bg)]/50 text-[var(--info)]",
  completed: "bg-[var(--success-bg)]/50 text-[var(--success)]",
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
  const [activeTab, setActiveTab] = useState<ActiveTab>("info");

  useEffect(() => {
    if (open && task) {
      setLocalTask(task);
      setActiveTab("info");
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
      return (await res.json()).data || [];
    },
    enabled: !!currentTask && open,
  });

  const { data: comments = [] } = useQuery<Comment[]>({
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
      setLocalTask(prev => prev ? { ...prev, ...variables } : null);
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

  const completedSubtasks = useMemo(() => subtasks.filter((s) => s.is_completed).length, [subtasks]);
  const totalHours = useMemo(() => timeLogs.reduce((sum, log) => sum + log.hours, 0), [timeLogs]);

  if (!currentTask) return null;


  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-[var(--glass-bg)] backdrop-blur-3xl border-none sm:max-w-[50vw] w-full flex flex-col shadow-[-20px_0_80px_rgba(0,0,0,0.05)] p-0 overflow-hidden">
        {/* Fixed Header Section */}
        <div className="shrink-0">
          {/* Tabs */}
          <div className="px-10 pt-10 pb-4">
            <div className="bg-[var(--surface)] p-1.5 rounded-full flex items-center gap-1 w-fit shadow-inner">
              <TabButton id="info" label="Info" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="tasks" label="Tasks" icon={Check} count={subtasks.length} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="comments" label="Comments" icon={MessageSquare} count={comments.length} activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="files" label="Files" icon={Paperclip} count={currentTask.attachments?.length} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>

          {/* Title - Fixed below tabs */}
          <div className="px-10 pb-8">
            <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight leading-[1.1]">
              {currentTask.title}
            </h1>
          </div>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-10 py-6 space-y-12 max-w-4xl mx-auto">
            
            {activeTab === "info" && (
              <div className="space-y-12 animate-in fade-in duration-500">
                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-2">
                  <PropertyRow icon={Activity} label="Status">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={updateTaskMutation.isPending}
                        className={cn(
                          "h-8 px-4 rounded-full text-[10px] font-black uppercase tracking-widest border-none hover:scale-105 transition-all shadow-sm outline-none flex items-center gap-2",
                          statusColors[currentTask.status as keyof typeof statusColors] || "bg-[var(--surface-container)] text-[var(--muted)]"
                        )}
                      >
                        {updateTaskMutation.isPending
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : statusOptions.find(o => o.value === currentTask.status)?.label ?? currentTask.status}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[var(--glass-bg)] backdrop-blur-2xl border-none shadow-[var(--shadow-xl)] rounded-[var(--radius-lg)]">
                        <DropdownMenuRadioGroup
                          value={currentTask.status}
                          onValueChange={(val) => val && updateTaskMutation.mutate({ status: val })}
                        >
                          {statusOptions.map((opt) => (
                            <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase tracking-widest">
                              {opt.label}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </PropertyRow>

                  <PropertyRow icon={Flag} label="Priority">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                      priorityColors[currentTask.priority as keyof typeof priorityColors] || "bg-[var(--surface-container)] text-[var(--muted)]"
                    )}>
                      {currentTask.priority}
                    </span>
                  </PropertyRow>

                  <PropertyRow icon={Building2} label="Company">
                    {currentTask.company ? (
                      <div className="bg-[var(--surface)] px-4 py-1.5 rounded-full w-fit shadow-sm">
                        <span className="text-[var(--foreground)] text-[12px] font-bold">{currentTask.company.name}</span>
                      </div>
                    ) : <span className="text-[var(--muted)] italic font-medium">No Company</span>}
                  </PropertyRow>

                  <PropertyRow icon={User} label="Assignee">
                    {currentTask.assignee ? (
                      <div className="flex items-center gap-3 bg-[var(--surface)] px-4 py-1.5 rounded-full w-fit shadow-sm">
                        <Avatar name={currentTask.assignee.name} size="sm" className="ring-2 ring-[var(--surface-container-lowest)] w-5 h-5" />
                        <span className="text-[var(--foreground)] text-[12px] font-bold">{currentTask.assignee.name}</span>
                      </div>
                    ) : <span className="text-[var(--muted)] italic font-medium">Unassigned</span>}
                  </PropertyRow>

                  <PropertyRow icon={Clock} label="Estimate">
                    <span className="px-1 text-[14px]">{currentTask.estimated_hours ? `${currentTask.estimated_hours}h` : <span className="text-[var(--muted)] italic font-medium">No Estimate</span>}</span>
                  </PropertyRow>

                  <PropertyRow icon={Activity} label="Actual Logged" loading={loadingLogs}>
                    <span className={cn("px-1 text-[14px]", currentTask.estimated_hours && totalHours > currentTask.estimated_hours ? "text-[var(--error)] font-black" : "text-[var(--foreground)]")}>
                      {totalHours}h
                    </span>
                  </PropertyRow>

                  <PropertyRow icon={Calendar} label="Timeline">
                    <div className="flex items-center gap-3 text-[var(--foreground)] font-bold text-[12px]">
                      <span className="px-2 py-1 bg-[var(--surface)] rounded-[var(--radius-sm)]">{currentTask.start_date ? new Date(currentTask.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "Start"}</span>
                      <span className="text-[var(--muted)]">→</span>
                      <span className="px-2 py-1 bg-[var(--surface)] rounded-[var(--radius-sm)]">{currentTask.due_date ? new Date(currentTask.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "End"}</span>
                    </div>
                  </PropertyRow>
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] px-2">Mission Intelligence</h3>
                  <div className="p-8 bg-[var(--surface)] rounded-[var(--radius-lg)] border-none shadow-inner min-h-[200px]">
                    {currentTask.description ? (
                      <p className="text-[15px] text-[var(--foreground)] leading-relaxed whitespace-pre-wrap font-medium">
                        {currentTask.description}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--muted)] italic">No detailed intelligence provided for this mission.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)]">Tactical Checklist</h3>
                  <div className="px-4 py-1.5 bg-[var(--accent)]/20 text-[var(--primary)] rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {completedSubtasks}/{subtasks.length} Completed
                  </div>
                </div>
                
                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="group flex items-center gap-5 py-4 px-6 bg-[var(--surface-container-lowest)] hover:bg-[var(--surface)] rounded-[var(--radius-lg)] transition-all shadow-[var(--shadow-sm)] hover:shadow-md hover:scale-[1.01]">
                      <button
                        onClick={() => toggleSubtaskMutation.mutate({ id: subtask.id, is_completed: !subtask.is_completed })}
                        disabled={toggleSubtaskMutation.isPending}
                        className={cn(
                          "shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                          subtask.is_completed ? "bg-[var(--primary)] shadow-lg shadow-[var(--primary)]/30" : "bg-[var(--surface)] shadow-inner"
                        )}
                      >
                        {subtask.is_completed && <Check className="w-4 h-4 text-white stroke-[4]" />}
                      </button>
                      <span className={cn(
                        "flex-1 text-[15px] font-bold transition-all",
                        subtask.is_completed ? "line-through text-[var(--muted)]" : "text-[var(--foreground)]"
                      )}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                        disabled={deleteSubtaskMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 p-2 text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-5 px-6 py-4 bg-[var(--surface)] rounded-[var(--radius-lg)] shadow-inner mt-6">
                    <Plus className="w-5 h-5 text-[var(--muted)]" />
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a new tactical objective..."
                      className="flex-1 bg-transparent border-none text-[15px] font-bold placeholder:text-[var(--muted)] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubtask.trim()) createSubtaskMutation.mutate(newSubtask.trim());
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] px-2">Mission Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currentTask.attachments?.map((file) => (
                    <div key={file.id} className="group p-5 bg-[var(--surface-container-lowest)] border-none rounded-[var(--radius-xl)] flex items-center justify-between gap-4 hover:bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-xl)] transition-all hover:scale-[1.02]">
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--surface)] group-hover:bg-[var(--surface-container-lowest)] flex items-center justify-center shrink-0 transition-colors shadow-inner">
                          <Paperclip className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-[var(--foreground)] truncate">{file.file_name}</p>
                          <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-[0.2em] mt-0.5">
                            {file.file_size ? `${(file.file_size / 1024).toFixed(0)} KB` : "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent)]/20 rounded-xl transition-all">
                          <ExternalLink className="w-4.5 h-4.5" />
                        </a>
                        <button onClick={() => deleteAttachmentMutation.mutate(file.id)} disabled={deleteAttachmentMutation.isPending} className="p-2.5 text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-xl transition-all">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="h-full min-h-[120px]">
                    <TaskAttachmentUploader
                      taskId={currentTask.id}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-16 animate-in slide-in-from-right-8 duration-500">
                {/* Time Tracking */}
                <div className="space-y-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] px-2">Operational Hours</h3>
                  <div className="bg-[var(--surface)] p-8 rounded-[var(--radius-lg)] shadow-inner space-y-8">
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={newTimeHours}
                        onChange={(e) => setNewTimeHours(e.target.value)}
                        placeholder="Hr"
                        className="w-20 px-4 py-3 bg-[var(--surface-container-lowest)] border-none rounded-[var(--radius-lg)] text-[15px] font-black outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-[var(--shadow-sm)] transition-all"
                        min="0" step="0.5"
                      />
                      <input
                        type="text"
                        value={newTimeNotes}
                        onChange={(e) => setNewTimeNotes(e.target.value)}
                        placeholder="Detail your contribution..."
                        className="flex-1 px-5 py-3 bg-[var(--surface-container-lowest)] border-none rounded-[var(--radius-lg)] text-[15px] font-bold outline-none focus:ring-2 focus:ring-[var(--accent)] shadow-[var(--shadow-sm)] transition-all"
                      />
                      <button
                        onClick={() => newTimeHours && createTimeLogMutation.mutate({ hours: parseFloat(newTimeHours), notes: newTimeNotes || undefined })}
                        disabled={!newTimeHours || createTimeLogMutation.isPending}
                        className="px-8 py-3 bg-[var(--secondary)] hover:bg-[var(--secondary)]/90 text-[var(--secondary-foreground)] rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 min-w-[120px] shadow-xl shadow-black/10"
                      >
                        {createTimeLogMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Log Hours"}
                      </button>
                    </div>

                    <div className="space-y-4">
                      {timeLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-[var(--surface-container-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] group hover:shadow-md transition-all">
                          <div className="flex items-center gap-5">
                            <div className="px-4 py-1.5 bg-[var(--accent)]/20 text-[var(--primary)] rounded-xl text-xs font-black shadow-sm">{log.hours}h</div>
                            <div>
                              <p className="text-sm font-black text-[var(--foreground)]">{log.employee.name}</p>
                              {log.notes && <p className="text-[12px] text-[var(--muted)] font-medium mt-0.5">{log.notes}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discussion */}
                <div className="space-y-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted)] px-2">Mission Briefing</h3>
                  
                  <div className="space-y-10">
                    <div className="space-y-8">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-5 group">
                          <Avatar name={comment.employee.name} size="md" className="shrink-0 ring-4 ring-[var(--surface)]" />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-4">
                              <span className="text-[13px] font-black text-[var(--foreground)] uppercase tracking-tight">{comment.employee.name}</span>
                              <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-[0.2em]">
                                {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="bg-[var(--surface)] p-6 rounded-[var(--radius-xl)] rounded-tl-none shadow-inner border-none">
                              <p className="text-[15px] text-[var(--foreground)] leading-relaxed font-medium">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-5 pt-10">
                      <div className="w-12 h-12 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[10px] font-black text-[var(--secondary-foreground)] shrink-0 shadow-2xl shadow-black/20 ring-4 ring-[var(--surface-container-lowest)]">
                        YOU
                      </div>
                      <div className="flex-1 space-y-6">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Broadcast a new message..."
                          className="w-full p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] text-[15px] font-bold outline-none min-h-[160px] resize-none placeholder:text-[var(--muted)] transition-all shadow-inner focus:ring-4 focus:ring-[var(--accent)]/30"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                            disabled={!newComment.trim() || createCommentMutation.isPending}
                            className="px-10 py-4 bg-[var(--primary)] hover:bg-[var(--foreground)] text-[var(--primary-container)] font-black uppercase tracking-[0.3em] text-[11px] rounded-full transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-4 shadow-2xl shadow-[var(--primary)]/30"
                          >
                            {createCommentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                            Transmit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
