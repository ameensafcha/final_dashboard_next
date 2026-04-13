'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './roles.module.css';
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
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Role Name</th>
            <th className={styles.th}>Description</th>
            <th className={styles.th}>Employees</th>
            <th className={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className={styles.row}>
              <td className={styles.td}>
                <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{role.name}</span>
              </td>
              <td className={styles.td}>{role.description || 'N/A'}</td>
              <td className={styles.td}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '2rem', 
                  height: '2rem', 
                  borderRadius: '50%', 
                  backgroundColor: '#f3f4f6',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  {role._count?.employees || 0}
                </span>
              </td>
              <td className={styles.td}>
                <div className={styles.actions}>
                  <button
                    onClick={() => setEditingRole(role)}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    className={`${styles.button} ${styles.buttonDanger}`}
                    disabled={isDeleting === role.id}
                  >
                    {isDeleting === role.id ? '...' : 'Delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {roles.length === 0 && (
            <tr>
              <td colSpan={4} className={styles.td} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                No roles found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editingRole && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Role</h3>
              <button className={styles.modalClose} onClick={() => setEditingRole(null)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
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
