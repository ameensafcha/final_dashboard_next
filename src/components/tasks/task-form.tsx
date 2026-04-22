"use client";

import { useState, useEffect, useMemo } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { Loader2, ChevronDown } from "lucide-react";
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
  area_id: string | null;
  company_id: string | null;
  status: string;
  priority: string;
  tier: string | null;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  recurrence: string | null;
  area?: { id: string; name: string; color: string } | null;
  assignee?: { id: string; name: string; email?: string } | null;
  company?: { id: string; name: string } | null;
}

interface Company {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultAssigneeId?: string;
  canChangeAssignee?: boolean;
}

function FormDropdown({
  value,
  displayValue,
  onValueChange,
  placeholder,
  children,
}: {
  value: string;
  displayValue?: string;
  onValueChange: (val: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  const label = displayValue ?? value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-12 w-full bg-[var(--surface)] border-none rounded-[var(--radius-lg)] px-5 text-sm font-bold focus:ring-2 focus:ring-[var(--accent)]/50 transition-all flex items-center justify-between outline-none">
        <span className={label ? "text-[var(--foreground)]" : "text-[var(--muted)]"}>
          {label || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--muted)] shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[var(--glass-bg)] backdrop-blur-2xl border-none shadow-[var(--shadow-xl)] rounded-[var(--radius-lg)]">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {children}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TaskForm({ open, onClose, task, defaultAssigneeId, canChangeAssignee = false }: TaskFormProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  const { data: areas = [] } = useQuery<{ id: string; name: string; color: string }[]>({
    queryKey: ["areas"],
    queryFn: async () => {
      const res = await fetch("/api/areas");
      const json = await res.json();
      return json.data || [];
    },
    enabled: open,
  });

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    area: string;
    company_id: string;
    priority: string;
    status: string;
    tier: string;
    assignee_id: string;
    due_date: string;
    start_date: string;
    estimated_hours: string;
    recurrence: string;
  }>({
    title: "",
    description: "",
    area: "",
    company_id: "",
    priority: "medium",
    status: "not_started",
    tier: "",
    assignee_id: "",
    due_date: "",
    start_date: "",
    estimated_hours: "",
    recurrence: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        area: task.area_id || "",
        company_id: task.company_id || "",
        priority: task.priority,
        status: task.status,
        tier: task.tier || "",
        assignee_id: task.assignee_id || task.assignee?.id || "",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
        start_date: task.start_date ? task.start_date.split("T")[0] : "",
        estimated_hours: task.estimated_hours?.toString() || "",
        recurrence: task.recurrence || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        area: "",
        company_id: "",
        priority: "medium",
        status: "not_started",
        tier: "",
        assignee_id: defaultAssigneeId || "",
        due_date: "",
        start_date: "",
        estimated_hours: "",
        recurrence: "",
      });
    }
  }, [task, open, defaultAssigneeId]);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const json = await res.json();
      return json.data || [];
    },
    enabled: canChangeAssignee,
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["active-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies?active=true");
      const json = await res.json();
      return json.data || [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          area_id: data.area || null,
          company_id: data.company_id || null,
          priority: data.priority,
          status: data.status,
          tier: data.tier || null,
          assignee_id: data.assignee_id || defaultAssigneeId || null,
          due_date: data.due_date || null,
          start_date: data.start_date || null,
          estimated_hours: data.estimated_hours || null,
          recurrence: data.recurrence || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task created" });
      onClose();
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task!.id,
          title: data.title,
          description: data.description || null,
          area_id: data.area || null,
          company_id: data.company_id || null,
          priority: data.priority,
          status: data.status,
          tier: data.tier || null,
          assignee_id: data.assignee_id || defaultAssigneeId || null,
          due_date: data.due_date || null,
          start_date: data.start_date || null,
          estimated_hours: data.estimated_hours || null,
          recurrence: data.recurrence || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task updated" });
      onClose();
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const selectedCompanyName = useMemo(() => companies.find(c => c.id === formData.company_id)?.name || "", [companies, formData.company_id]);
  const selectedAssigneeName = useMemo(() => employees.find(e => e.id === formData.assignee_id)?.name || "", [employees, formData.assignee_id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[var(--glass-bg)] backdrop-blur-3xl border-none rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-10 scrollbar-hide">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-black font-display tracking-tight">{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              required
              className="input-field h-12 px-5 text-sm font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide more context..."
              className="w-full p-5 bg-[var(--surface)] border-none rounded-[var(--radius-lg)] text-sm font-bold min-h-[120px] resize-none outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all placeholder:text-[var(--muted)]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Company</label>
            <FormDropdown
              value={formData.company_id || "__none__"}
              displayValue={selectedCompanyName}
              onValueChange={(val) => setFormData({ ...formData, company_id: val === "__none__" ? "" : val })}
              placeholder="Select Company"
            >
              <DropdownMenuRadioItem value="__none__">None</DropdownMenuRadioItem>
              {companies.map((company) => (
                <DropdownMenuRadioItem key={company.id} value={company.id}>{company.name}</DropdownMenuRadioItem>
              ))}
            </FormDropdown>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Category</label>
              <FormDropdown
                value={formData.area || "__none__"}
                displayValue={areas.find(a => a.id === formData.area)?.name || ""}
                onValueChange={(val) => setFormData({ ...formData, area: val === "__none__" ? "" : val })}
                placeholder="Select Category"
              >
                <DropdownMenuRadioItem value="__none__">None</DropdownMenuRadioItem>
                {areas.map((area) => (
                  <DropdownMenuRadioItem key={area.id} value={area.id}>
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: area.color }} />
                    {area.name}
                  </DropdownMenuRadioItem>
                ))}
              </FormDropdown>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Status</label>
              <FormDropdown
                value={formData.status}
                displayValue={formData.status ? formData.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ""}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
                placeholder="Select Status"
              >
                <DropdownMenuRadioItem value="not_started">Not Started</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="in_progress">In Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="review">Review</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="active">Active</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="blocked">Blocked</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="recurring">Recurring</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="sop">SOP</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="parked">Parked</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="needs_verification">Needs Verification</DropdownMenuRadioItem>
              </FormDropdown>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Priority</label>
              <FormDropdown
                value={formData.priority}
                displayValue={formData.priority ? formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1) : ""}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
                placeholder="Select Priority"
              >
                <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
              </FormDropdown>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Tier</label>
              <FormDropdown
                value={formData.tier || "__none__"}
                displayValue={formData.tier || ""}
                onValueChange={(val) => setFormData({ ...formData, tier: val === "__none__" ? "" : val })}
                placeholder="Select Tier"
              >
                <DropdownMenuRadioItem value="__none__">None</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="T1 Strategic">T1 Strategic</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="T2 Quick Win">T2 Quick Win</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="SOP">SOP</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Recurring">Recurring</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="Long-term">Long-term</DropdownMenuRadioItem>
              </FormDropdown>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Estimated Hours</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="e.g. 4.5"
                className="input-field h-12 px-5 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Recurrence</label>
              <FormDropdown
                value={formData.recurrence || "__none__"}
                displayValue={formData.recurrence ? formData.recurrence.charAt(0).toUpperCase() + formData.recurrence.slice(1) : ""}
                onValueChange={(val) => setFormData({ ...formData, recurrence: val === "__none__" ? "" : val })}
                placeholder="None"
              >
                <DropdownMenuRadioItem value="__none__">None</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="daily">Daily</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="weekly">Weekly</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="monthly">Monthly</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="yearly">Yearly</DropdownMenuRadioItem>
              </FormDropdown>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Assignee</label>
            {canChangeAssignee ? (
              <FormDropdown
                value={formData.assignee_id || "__unassigned__"}
                displayValue={selectedAssigneeName}
                onValueChange={(val) => setFormData({ ...formData, assignee_id: val === "__unassigned__" ? "" : val })}
                placeholder="Unassigned"
              >
                <DropdownMenuRadioItem value="__unassigned__">Unassigned</DropdownMenuRadioItem>
                {employees.map((emp) => (
                  <DropdownMenuRadioItem key={emp.id} value={emp.id}>{emp.name}</DropdownMenuRadioItem>
                ))}
              </FormDropdown>
            ) : (
              <div className="h-12 bg-[var(--surface)] rounded-[var(--radius-lg)] px-5 flex items-center text-sm font-bold text-[var(--muted)] italic">
                Self (Auto-assigned)
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Start Date</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                onFocus={(e) => { try { e.target.showPicker(); } catch {} }}
                className="input-field h-12 px-5 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-2 px-1">Deadline</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                onFocus={(e) => { try { e.target.showPicker(); } catch {} }}
                className="input-field h-12 px-5 text-sm font-bold"
              />
            </div>
          </div>

          <DialogFooter className="pt-6 gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-8 py-3 text-xs font-black uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-10 py-3 text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-black/10 min-w-[160px] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                task ? "Update Task" : "Add Task"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
