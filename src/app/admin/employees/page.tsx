"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmployeeForm } from "@/components/employee-form";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");

      // FIX: Agar API chup-chaap login page pe redirect ho gayi hai, toh crash roko
      if (res.redirected) {
        window.location.href = "/login";
        return [];
      }

      // FIX: Agar API fail ho jaye, toh crash roko
      if (!res.ok) throw new Error("Failed to fetch employees");

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      addNotification({ type: "success", message: "Employee deactivated" });
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/employees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to activate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      addNotification({ type: "success", message: "Employee activated" });
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  // Task 1: Add roles query for dropdown
  const { data: roles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const json = await res.json();
      return json.data || [];
    },
  });

  // Task 2: Add role update mutation with permission cache invalidation (EMP-03)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ employeeId, roleId }: { employeeId: string; roleId: string }) => {
      const res = await fetch("/api/auth/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, roleId: roleId || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      // EMP-03: Invalidate permissions cache so new role takes effect immediately
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      addNotification({ type: "success", message: "Role updated successfully" });
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Employees</h1>
          <p className="text-gray-600">Manage your team members</p>
        </div>
        <Button
          onClick={() => { setEditingEmployee(null); setShowForm(true); }}
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-50">
              <tr>
                <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Name</th>
                <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Email</th>
                <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Role</th>
                <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Status</th>
                <th className="text-left p-4 font-medium" style={{ color: "#1A1A1A" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr key={emp.id} className="border-t hover:bg-gray-50">
                  <td className="p-4" style={{ color: "#1A1A1A" }}>{emp.name}</td>
                  <td className="p-4" style={{ color: "#6B7280" }}>{emp.email}</td>
                  <td className="p-4">
                    <select
                      value={emp.role_id || ""}
                      onChange={(e) => updateRoleMutation.mutate({ employeeId: emp.id, roleId: e.target.value })}
                      disabled={updateRoleMutation.isPending}
                      className="w-full px-2 py-1 border rounded text-sm bg-white"
                    >
                      <option value="">No Role</option>
                      {roles?.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${emp.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingEmployee(emp); setShowForm(true); }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                      {emp.is_active ? (
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "Deactivate Employee",
                              message: `Are you sure you want to deactivate ${emp.name}?`,
                              onConfirm: () => {
                                deleteMutation.mutate(emp.id);
                                setConfirmDialog(prev => ({ ...prev, open: false }));
                              },
                            });
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              open: true,
                              title: "Activate Employee",
                              message: `Are you sure you want to activate ${emp.name}?`,
                              onConfirm: () => {
                                activateMutation.mutate(emp.id);
                                setConfirmDialog(prev => ({ ...prev, open: false }));
                              },
                            });
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium cursor-pointer"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!employees || employees.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingEmployee(null); }}
        employee={editingEmployee}
      />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
          </DialogHeader>
          <p className="py-4">{confirmDialog.message}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              onClick={confirmDialog.onConfirm}
              style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}