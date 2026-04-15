'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleForm from '@/components/RoleForm';

interface Role {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    employees: number;
  };
}

interface RoleTableProps {
  roles: Role[];
}

export default function RoleTable({ roles }: RoleTableProps) {
  const router = useRouter();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the role "${name}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/roles?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete role');
      }

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--surface)]">
          <tr>
            <th className="text-label-sm py-5 px-6 text-left">Role Name</th>
            <th className="text-label-sm py-5 px-6 text-left">Description</th>
            <th className="text-label-sm py-5 px-6 text-left">Employees</th>
            <th className="text-label-sm py-5 px-6 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="hover:bg-[var(--surface)] transition-colors">
              <td className="py-5 px-6">
                <span className="font-semibold uppercase text-[var(--foreground)]">{role.name}</span>
              </td>
              <td className="py-5 px-6 text-[var(--muted-foreground)]">{role.description || 'N/A'}</td>
              <td className="py-5 px-6">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium bg-[var(--surface-container)] text-[var(--foreground)]">
                  {role._count?.employees || 0}
                </span>
              </td>
              <td className="py-5 px-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRole(role)}
                    className="px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--primary)] hover:bg-[var(--accent)]/20"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    disabled={isDeleting === role.id}
                    className="px-4 py-2 text-sm font-semibold rounded-[var(--radius-md)] transition-all hover:scale-[1.02] disabled:opacity-50 text-[var(--error)] hover:bg-[var(--error-bg)]"
                  >
                    {isDeleting === role.id ? '...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {roles.length === 0 && (
            <tr>
              <td colSpan={4} className="py-16 text-center font-semibold text-[var(--muted)]">
                No roles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editingRole && (
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 rounded-[var(--radius-xl)] max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sub font-display text-[var(--foreground)]">Edit Role</h3>
              <button
                onClick={() => setEditingRole(null)}
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] transition-all text-[var(--muted-foreground)] hover:bg-[var(--surface-container)]"
              >
                ✕
              </button>
            </div>
            <div className="py-8">
              <RoleForm
                initialData={editingRole}
                onSuccess={() => {
                  setEditingRole(null);
                  router.refresh();
                }}
                onCancel={() => setEditingRole(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}