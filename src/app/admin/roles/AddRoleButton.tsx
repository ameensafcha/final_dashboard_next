'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleForm from '@/components/RoleForm';

export default function AddRoleButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary"
      >
        Add New Role
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-[var(--foreground)]/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-8 rounded-[var(--radius-xl)] max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sub font-display text-[var(--foreground)]">Add New Role</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] transition-all text-[var(--muted-foreground)] hover:bg-[var(--surface-container)]"
              >
                ✕
              </button>
            </div>
            <div className="py-8">
              <RoleForm
                onSuccess={() => {
                  setIsOpen(false);
                  router.refresh();
                }}
                onCancel={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}