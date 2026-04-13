"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { Loader2 } from "lucide-react";
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
  area: string | null;
  company_id: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  recurrence: string | null;
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

export function TaskForm({ open, onClose, task, defaultAssigneeId, canChangeAssignee = false }: TaskFormProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    area: string;
    company_id: string;
    priority: string;
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
        area: task.area || "",
        company_id: task.company_id || "",
        priority: task.priority,
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
          area: data.area || null,
          company_id: data.company_id || null,
          priority: data.priority,
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
          area: data.area || null,
          company_id: data.company_id || null,
          priority: data.priority,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Task description"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <Select 
              value={formData.company_id || "none"} 
              onValueChange={(val) => setFormData({ ...formData, company_id: val === "none" ? "" : (val || "") })}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select Company">
                  {formData.company_id && formData.company_id !== "none"
                    ? companies.find((c) => c.id === formData.company_id)?.name || "Select Company"
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Area / Department</label>
              <Select 
                value={formData.area || "none"} 
                onValueChange={(val) => setFormData({ ...formData, area: val === "none" ? "" : (val || "") })}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                  <SelectItem value="Procurement">Procurement</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <Select 
                value={formData.priority} 
                onValueChange={(val) => setFormData({ ...formData, priority: val || "" })}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Hours</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                placeholder="e.g. 4.5"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Recurrence</label>
              <Select 
                value={formData.recurrence || "none"} 
                onValueChange={(val) => setFormData({ ...formData, recurrence: val === "none" ? "" : (val || "") })}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assignee</label>
            {canChangeAssignee ? (
              <Select 
                value={formData.assignee_id || "unassigned"} 
                onValueChange={(val) => setFormData({ ...formData, assignee_id: val === "unassigned" ? "" : (val || "") })}
              >
                <SelectTrigger className="w-full text-sm">
                  <SelectValue placeholder="Unassigned">
                    {formData.assignee_id && formData.assignee_id !== "unassigned"
                      ? employees.find((e) => e.id === formData.assignee_id)?.name || "Unassigned"
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <input
                value="You (auto-assigned)"
                disabled
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: "#E8C547" }}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                task ? "Update Task" : "Create Task"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
