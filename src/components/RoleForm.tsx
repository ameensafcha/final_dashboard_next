'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Role Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="e.g. Administrator"
          disabled={isLoading}
        />
        {validationError && <span className="text-xs font-medium" style={{ color: 'var(--error)' }}>{validationError}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field min-h-[100px] resize-none"
          placeholder="Describe the role's responsibilities..."
          disabled={isLoading}
        />
      </div>

      {error && <div className="text-xs font-medium" style={{ color: 'var(--error)' }}>{error}</div>}

      <div className="flex justify-end gap-3 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest transition-all hover:scale-[1.02]"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)' }}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isLoading ? 'Saving...' : 'Save Role'}
        </button>
      </div>
    </form>
  );
}