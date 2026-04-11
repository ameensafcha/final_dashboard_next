'use client';

import React, { useState } from 'react';
import styles from '../app/admin/roles/roles.module.css';

interface RoleFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RoleForm({ initialData, onSuccess, onCancel }: RoleFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setError(null);

    if (!name.trim()) {
      setValidationError('Role name is required');
      return;
    }

    setIsLoading(true);

    try {
      const isEdit = !!initialData?.id;
      const url = '/api/roles';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit 
        ? { id: initialData.id, name, description }
        : { name, description };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save role');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>Role Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${styles.input} ${validationError ? styles.inputError : ''}`}
          placeholder="e.g. Administrator"
          disabled={isLoading}
        />
        {validationError && <span className={styles.error}>{validationError}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${styles.input} ${styles.textarea}`}
          placeholder="Describe the role's responsibilities..."
          disabled={isLoading}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Role'}
        </button>
      </div>
    </form>
  );
}
