import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleForm from './RoleForm';

// Mock fetch
global.fetch = vi.fn();

describe('RoleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial values', () => {
    render(<RoleForm />);
    expect(screen.getByLabelText(/role name/i)).toBeDefined();
    expect(screen.getByLabelText(/description/i)).toBeDefined();
  });

  it('validates that role name is not empty', async () => {
    render(<RoleForm />);
    fireEvent.click(screen.getByRole('button', { name: /save role/i }));
    expect(await screen.findByText(/role name is required/i)).toBeDefined();
  });

  it('submits a new role', async () => {
    const onSuccess = vi.fn();
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1', name: 'Admin' }),
    });

    render(<RoleForm onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByLabelText(/role name/i), { target: { value: 'Admin' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'Super User' } });
    
    fireEvent.click(screen.getByRole('button', { name: /save role/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/roles', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Admin', description: 'Super User' }),
      }));
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('edits an existing role', async () => {
    const onSuccess = vi.fn();
    const initialData = { id: '1', name: 'Editor', description: 'Can edit content' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...initialData }),
    });

    render(<RoleForm initialData={initialData} onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByLabelText(/role name/i), { target: { value: 'Lead Editor' } });
    
    fireEvent.click(screen.getByRole('button', { name: /save role/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/roles', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ id: '1', name: 'Lead Editor', description: 'Can edit content' }),
      }));
    });

    expect(onSuccess).toHaveBeenCalled();
  });
});
