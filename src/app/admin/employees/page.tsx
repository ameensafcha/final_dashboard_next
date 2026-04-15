"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { EmployeeForm } from "@/components/employee-form";
import { useUIStore } from "@/lib/stores";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      if (res.redirected) {
        window.location.href = "/login";
        return [];
      }
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

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const json = await res.json();
      return json.data || [];
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      addNotification({ type: "success", message: "Role updated successfully" });
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  return (
    <div className="p-8 min-h-screen bg-[var(--surface)]">
      <div className="mb-6">
        <Link href="/admin/roles" className="text-label-sm hover:underline text-[var(--primary)]">
          ← Manage Roles & Permissions
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-section font-display text-[var(--foreground)]">
            Employees
          </h1>
          <p className="text-body-light mt-1 text-[var(--muted-foreground)]">
            Manage your team members
          </p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowForm(true); }}
          className="btn-primary"
        >
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--surface)]">
              <tr>
                <th className="text-label-sm py-5 px-6 text-left">Name</th>
                <th className="text-label-sm py-5 px-6 text-left">Email</th>
                <th className="text-label-sm py-5 px-6 text-left">Role</th>
                <th className="text-label-sm py-5 px-6 text-left">Status</th>
                <th className="text-label-sm py-5 px-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr key={emp.id} className="hover:bg-[var(--surface)] transition-colors">
                  <td className="py-5 px-6">
                    <span className="font-semibold text-[var(--foreground)]">{emp.name}</span>
                  </td>
                  <td className="py-5 px-6 text-[var(--muted-foreground)]">{emp.email}</td>
                  <td className="py-5 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="w-full px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium flex items-center justify-between transition-colors bg-[var(--surface-container)]"
                      >
                        <span>{emp.role?.name || "No Role"}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuRadioGroup 
                          value={emp.role_id || ""} 
                          onValueChange={(val) => updateRoleMutation.mutate({ employeeId: emp.id, roleId: val || "" })}
                        >
                          <DropdownMenuRadioItem value="">No Role</DropdownMenuRadioItem>
                          {roles?.map((role) => (
                            <DropdownMenuRadioItem key={role.id} value={role.id}>
                              {role.name}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${emp.is_active ? 'bg-[var(--success-bg)] text-[var(--success)]' : 'bg-[var(--error-bg)] text-[var(--error)]'}`}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingEmployee(emp); setShowForm(true); }}
                        className="px-3 py-2 text-sm font-semibold transition-all hover:scale-[1.02] rounded-[var(--radius-md)] text-[var(--primary)] hover:bg-[var(--accent)]/20"
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
                          className="px-3 py-2 text-sm font-semibold transition-all hover:scale-[1.02] rounded-[var(--radius-md)] text-[var(--error)] hover:bg-[var(--error-bg)]"
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
                          className="px-3 py-2 text-sm font-semibold transition-all hover:scale-[1.02] rounded-[var(--radius-md)] text-[var(--success)] hover:bg-[var(--success-bg)]"
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
                  <td colSpan={5} className="py-16 text-center text-[var(--muted)]">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <EmployeeForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingEmployee(null); }}
          employee={editingEmployee}
        />
      )}

      {confirmDialog.open && (
        <div className="fixed inset-0 glass-card flex items-center justify-center z-50">
          <div className="glass-card p-8 rounded-[var(--radius-xl)] max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sub font-display">{confirmDialog.title}</h3>
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] transition-all text-[var(--muted-foreground)] hover:bg-[var(--surface-container)]"
              >
                ✕
              </button>
            </div>
            <p className="mb-6 text-[var(--muted-foreground)]">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-[1.02] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-container)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}