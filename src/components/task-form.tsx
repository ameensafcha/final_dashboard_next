"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";

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
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    area: "",
    priority: "medium",
    assignee_id: "",
    due_date: "",
    start_date: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        area: task.area || "",
        priority: task.priority,
        assignee_id: task.assignee_id || "",
        due_date: task.due_date ? task.due_date.split("T")[0] : "",
        start_date: task.start_date ? task.start_date.split("T")[0] : "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        area: "",
        priority: "medium",
        assignee_id: defaultAssigneeId || "",
        due_date: "",
        start_date: "",
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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          area: data.area || null,
          priority: data.priority,
          assignee_id: data.assignee_id || defaultAssigneeId || null,
          due_date: data.due_date || null,
          start_date: data.start_date || null,
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
          priority: data.priority,
          assignee_id: data.assignee_id || defaultAssigneeId || null,
          due_date: data.due_date || null,
          start_date: data.start_date || null,
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
      <DialogContent className="max-w-md">
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
            <label className="block text-sm font-medium mb-1">Area / Department</label>
            <select
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Select Area</option>
              <option value="Production">Production</option>
              <option value="Quality">Quality</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Procurement">Procurement</option>
              <option value="HR">HR</option>
              <option value="Admin">Admin</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Assignee</label>
              {canChangeAssignee ? (
                <select
                  value={formData.assignee_id}
                  onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value="You (auto-assigned)"
                  disabled
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              )}
            </div>
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: "#E8C547" }}
            >
              {isLoading ? "Saving..." : task ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}