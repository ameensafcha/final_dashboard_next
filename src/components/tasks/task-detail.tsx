"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import { Check, Clock, MessageSquare, Plus, Trash2, User, Calendar, Flag, Activity, FileText, ExternalLink, Paperclip, Loader2, Building2 } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"info" | "tasks" | "comments" | "files">("info");

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
    <div className="flex items-center group py-2 min-h-[36px]">
      <div className="flex items-center gap-2 w-[140px] shrink-0 text-gray-400">
        <Icon className="w-4 h-4" />
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
      <div className="flex-1 text-[13px] font-bold text-gray-900">
        {loading ? <Loader2 className="w-3 h-3 animate-spin text-[#E8C547]" /> : children}
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, count }: { id: typeof activeTab, label: string, icon: any, count?: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2",
        activeTab === id 
          ? "border-[#E8C547] text-gray-900" 
          : "border-transparent text-gray-400 hover:text-gray-600"
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black",
          activeTab === id ? "bg-[#E8C547] text-white" : "bg-gray-100 text-gray-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-white overflow-hidden p-0 border-none sm:max-w-[50vw] w-full flex flex-col shadow-2xl">
        {/* Header Section */}
        <div className="bg-white px-8 pt-10 pb-6 border-b border-gray-50 shrink-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#E8C547]">
              <Activity className="w-3 h-3" />
              <span>System / Task Management</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
              {currentTask.title}
            </h1>
          </div>
        </div>

        {/* Custom Tab Bar */}
        <div className="bg-white px-8 flex items-center border-b border-gray-100 shrink-0">
          <TabButton id="info" label="Info" icon={FileText} />
          <TabButton id="tasks" label="Tasks" icon={Check} count={subtasks.length} />
          <TabButton id="comments" label="Comments" icon={MessageSquare} count={comments.length} />
          <TabButton id="files" label="Files" icon={Paperclip} count={currentTask.attachments?.length} />
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-10 space-y-12 max-w-4xl mx-auto">
            
            {activeTab === "info" && (
              <div className="space-y-12 animate-in fade-in duration-300">
                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  <PropertyRow icon={Activity} label="Status">
                    <Select 
                      value={currentTask.status} 
                      disabled={updateTaskMutation.isPending}
                      onValueChange={(val) => updateTaskMutation.mutate({ status: val } as any)}
                    >
                      <SelectTrigger className={cn(
                        "w-fit h-7 px-3 py-0 rounded-full text-[10px] font-black uppercase tracking-widest border-none hover:brightness-95 transition-all",
                        statusColors[currentTask.status as keyof typeof statusColors] || "bg-gray-100 text-gray-600"
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase tracking-widest">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PropertyRow>

                  <PropertyRow icon={Flag} label="Priority">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      priorityColors[currentTask.priority as keyof typeof priorityColors] || "bg-gray-100 text-gray-600"
                    )}>
                      {currentTask.priority}
                    </span>
                  </PropertyRow>

                  <PropertyRow icon={Building2} label="Company">
                    {currentTask.company ? (
                      <div className="bg-gray-50 px-3 py-1 rounded-full w-fit">
                        <span className="text-gray-700">{currentTask.company.name}</span>
                      </div>
                    ) : <span className="text-gray-300 italic">No Company</span>}
                  </PropertyRow>

                  <PropertyRow icon={User} label="Assignee">
                    {currentTask.assignee ? (
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full w-fit">
                        <div className="w-4 h-4 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[8px] font-black text-white">
                          {currentTask.assignee.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-700">{currentTask.assignee.name}</span>
                      </div>
                    ) : <span className="text-gray-300 italic">Unassigned</span>}
                  </PropertyRow>

                  <PropertyRow icon={Clock} label="Estimate">
                    <span className="px-1">{currentTask.estimated_hours ? `${currentTask.estimated_hours}h` : <span className="text-gray-300 italic">No Estimate</span>}</span>
                  </PropertyRow>

                  <PropertyRow icon={Activity} label="Actual Logged" loading={loadingLogs}>
                    <span className={cn("px-1", currentTask.estimated_hours && totalHours > currentTask.estimated_hours ? "text-red-600 font-black" : "text-gray-900")}>
                      {totalHours}h
                    </span>
                  </PropertyRow>

                  <PropertyRow icon={Calendar} label="Timeline">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>{currentTask.start_date ? new Date(currentTask.start_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "Start"}</span>
                      <span className="text-gray-300">→</span>
                      <span>{currentTask.due_date ? new Date(currentTask.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "End"}</span>
                    </div>
                  </PropertyRow>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Description</h3>
                  <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 min-h-[150px]">
                    {currentTask.description ? (
                      <p className="text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                        {currentTask.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-300 italic">No description provided.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Checklist</h3>
                  <div className="px-3 py-1 bg-[#E8C547]/10 text-[#E8C547] rounded-full text-[10px] font-black uppercase tracking-widest">
                    {completedSubtasks}/{subtasks.length} Completed
                  </div>
                </div>
                
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <div key={subtask.id} className="group flex items-center gap-4 py-3 px-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all">
                      <button
                        onClick={() => toggleSubtaskMutation.mutate({ id: subtask.id, is_completed: !subtask.is_completed })}
                        disabled={toggleSubtaskMutation.isPending}
                        className={cn(
                          "shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                          subtask.is_completed ? "bg-[#E8C547] border-[#E8C547]" : "border-gray-200 hover:border-[#E8C547] bg-white"
                        )}
                      >
                        {subtask.is_completed && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                      </button>
                      <span className={cn(
                        "flex-1 text-[14px] font-bold transition-all",
                        subtask.is_completed ? "line-through text-gray-300" : "text-gray-700"
                      )}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => deleteSubtaskMutation.mutate(subtask.id)}
                        disabled={deleteSubtaskMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center gap-4 px-4 py-3 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                    <Plus className="w-5 h-5 text-gray-300" />
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a new subtask..."
                      className="flex-1 bg-transparent border-none text-[14px] font-bold placeholder:text-gray-300 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSubtask.trim()) createSubtaskMutation.mutate(newSubtask.trim());
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentTask.attachments?.map((file) => (
                    <div key={file.id} className="group p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between gap-4 hover:border-[#E8C547] hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-gray-900 truncate">{file.file_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {file.file_size ? `${(file.file_size / 1024).toFixed(0)} KB` : "--"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#E8C547] hover:bg-[#E8C547]/10 rounded-lg">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => deleteAttachmentMutation.mutate(file.id)} disabled={deleteAttachmentMutation.isPending} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="h-full min-h-[100px]">
                    <TaskAttachmentUploader
                      taskId={currentTask.id}
                      onSuccess={() => queryClient.invalidateQueries({ queryKey: ["tasks"] })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "comments" && (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                {/* Time Tracking */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Time Tracking</h3>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-6">
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={newTimeHours}
                        onChange={(e) => setNewTimeHours(e.target.value)}
                        placeholder="Hr"
                        className="w-16 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[14px] font-black outline-none focus:ring-2 focus:ring-[#E8C547]/20 focus:border-[#E8C547]"
                        min="0" step="0.5"
                      />
                      <input
                        type="text"
                        value={newTimeNotes}
                        onChange={(e) => setNewTimeNotes(e.target.value)}
                        placeholder="What did you do?"
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[14px] font-bold outline-none focus:ring-2 focus:ring-[#E8C547]/20 focus:border-[#E8C547]"
                      />
                      <button
                        onClick={() => newTimeHours && createTimeLogMutation.mutate({ hours: parseFloat(newTimeHours), notes: newTimeNotes || undefined })}
                        disabled={!newTimeHours || createTimeLogMutation.isPending}
                        className="px-6 py-2 bg-[#1A1A1A] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 min-w-[80px]"
                      >
                        {createTimeLogMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Log Time"}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {timeLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 group">
                          <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-[#E8C547]/10 text-[#E8C547] rounded-lg text-xs font-black">{log.hours}h</div>
                            <div>
                              <p className="text-sm font-black text-gray-900">{log.employee.name}</p>
                              {log.notes && <p className="text-xs text-gray-500 font-medium">{log.notes}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-gray-300 uppercase">{new Date(log.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Discussion */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Discussion</h3>
                  
                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-black text-gray-400 shrink-0 border border-gray-200 group-hover:border-[#E8C547] transition-all">
                          {comment.employee.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-gray-900">{comment.employee.name}</span>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
                              {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                            <p className="text-[14px] text-gray-700 leading-relaxed font-bold">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-4 pt-6">
                      <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-black/10">
                        YOU
                      </div>
                      <div className="flex-1 space-y-4">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a message..."
                          className="w-full p-5 bg-white border-2 border-gray-100 rounded-3xl text-[14px] font-bold focus:border-[#E8C547] focus:ring-4 focus:ring-[#E8C547]/10 outline-none min-h-[120px] resize-none placeholder:text-gray-300 transition-all shadow-sm"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => newComment.trim() && createCommentMutation.mutate(newComment.trim())}
                            disabled={!newComment.trim() || createCommentMutation.isPending}
                            className="px-8 py-3 bg-[#E8C547] hover:bg-[#d4b33e] text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-full transition-all disabled:opacity-50 flex items-center gap-3 shadow-lg shadow-[#E8C547]/20"
                          >
                            {createCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                            Send Message
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
