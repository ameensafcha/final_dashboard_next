"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { EmployeeForm } from "@/components/employee-form";
import { useUIStore } from "@/lib/stores";
import styles from "./employees.module.css";

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
    <div className={styles.container}>
      <div className={styles.navLinkContainer}>
        <Link href="/admin/roles" className={styles.navLink}>
          &larr; Manage Roles & Permissions
        </Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Employees</h1>
          <p className={styles.subtitle}>Manage your team members</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowForm(true); }}
          className={styles.addButton}
        >
          Add Employee
        </button>
      </div>

      {isLoading ? (
        <div className={styles.spinnerContainer}>
          <div className={styles.spinner}></div>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Email</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr key={emp.id} className={styles.tr}>
                  <td className={styles.td}><span className={styles.nameCell}>{emp.name}</span></td>
                  <td className={styles.td}><span className={styles.emailCell}>{emp.email}</span></td>
                  <td className={styles.td}>
                    <select
                      value={emp.role_id || ""}
                      onChange={(e) => updateRoleMutation.mutate({ employeeId: emp.id, roleId: e.target.value })}
                      disabled={updateRoleMutation.isPending}
                      className={styles.select}
                    >
                      <option value="">No Role</option>
                      {roles?.map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${emp.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <button
                        onClick={() => { setEditingEmployee(emp); setShowForm(true); }}
                        className={`${styles.actionButton} ${styles.editAction}`}
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
                          className={`${styles.actionButton} ${styles.deactivateAction}`}
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
                          className={`${styles.actionButton} ${styles.activateAction}`}
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
                  <td colSpan={5} className={styles.emptyState}>
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{confirmDialog.title}</h3>
              <button
                className={styles.modalClose}
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, color: "#4B5563" }}>{confirmDialog.message}</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.button} ${styles.buttonOutline}`}
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              >
                Cancel
              </button>
              <button
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={confirmDialog.onConfirm}
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
