"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/lib/stores";
import { useAuth } from "@/contexts/auth-context";

interface Role {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role_id: string | null;
  is_active: boolean;
  created_at: string;
  role?: Role | null;
}

interface EmployeeFormProps {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

export function EmployeeForm({ open, onClose, employee }: EmployeeFormProps) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        password: "",
      });
    } else {
      setFormData({ name: "", email: "", password: "" });
    }
  }, [employee, open]);

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
  });

  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (employee) {
      setRoleId(employee.role_id || "");
    } else {
      setRoleId("");
    }
  }, [employee, open]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string; role_id: string }) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      addNotification({ type: "success", message: "Employee created successfully" });
      onClose();
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; role_id: string }) => {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      addNotification({ type: "success", message: "Employee updated successfully" });
      onClose();
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employee) {
      updateMutation.mutate({
        id: employee.id,
        name: formData.name,
        role_id: roleId,
      });
    } else {
      createMutation.mutate({ ...formData, role_id: roleId });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email"
              required
              disabled={!!employee}
            />
          </div>
          {!employee && (
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 8 characters"
                required
                minLength={8}
              />
            </div>
          )}
          {employee && (
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select role</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              style={{ backgroundColor: "#E8C547" }}
            >
              {isLoading ? "Saving..." : employee ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}