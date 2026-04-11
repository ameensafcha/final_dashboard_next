'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './roles.module.css';
import RoleForm from '@/components/RoleForm';

export default function AddRoleButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`${styles.button} ${styles.buttonPrimary}`}
      >
        Add New Role
      </button>

      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Role</h3>
              <button className={styles.modalClose} onClick={() => setIsOpen(false)}>&times;</button>
            </div>
            <div className={styles.modalBody}>
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
