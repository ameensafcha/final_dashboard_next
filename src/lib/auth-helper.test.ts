import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getCurrentUser, requirePermissionApi, requireAdminApi, getTaskFilterByRole } from './auth-helper';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';
import { getUserPermissions } from './rbac';

// Mock Supabase
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    setAll: vi.fn(),
  })),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock rbac
vi.mock('./rbac', () => ({
  getUserPermissions: vi.fn(),
}));

// Mock react
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

describe('auth-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-key';
  });

  describe('getCurrentUser', () => {
    it('should return null if no Supabase user is found', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null if no database employee is found', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id' } } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);
      (prisma.employee.findUnique as any).mockResolvedValue(null);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user with permissions from RBAC module', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id', email: 'test@example.com' } } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
      });
      (getUserPermissions as any).mockResolvedValue({
        role: 'employee',
        permissions: ['products:view', 'products:manage'],
      });

      const user = await getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.role).toBe('employee');
      expect(user?.permissions).toContain('products:view');
      expect(user?.permissions).toContain('products:manage');
    });
  });

  describe('requirePermissionApi', () => {
    it('should return error if user does not have permission', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id' } } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: 'user-id',
        is_active: true,
      });
      (getUserPermissions as any).mockResolvedValue({
        role: 'employee',
        permissions: [],
      });

      const { error } = await requirePermissionApi('products:manage');
      expect(error).not.toBeNull();
    });

    it('should allow super admin regardless of permissions', async () => {
      process.env.SUPER_ADMIN_EMAIL = 'super@example.com';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id', email: 'super@example.com' } } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: 'user-id',
        email: 'super@example.com',
        is_active: true,
      });
      (getUserPermissions as any).mockResolvedValue({
        role: 'admin',
        permissions: [],
      });

      const { error } = await requirePermissionApi('products:manage');
      expect(error).toBeNull();
    });

    it('should NOT allow non-super admin (even with admin role) if permission is missing', async () => {
      process.env.SUPER_ADMIN_EMAIL = 'super@example.com';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id', email: 'not-super@example.com' } } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: 'user-id',
        email: 'not-super@example.com',
        is_active: true,
      });
      (getUserPermissions as any).mockResolvedValue({
        role: 'admin',
        permissions: [],
      });

      const { error } = await requirePermissionApi('products:manage');
      expect(error).not.toBeNull();
    });
  });

  describe('requireAdminApi', () => {
    it('should return error if user is not admin', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-id' } } }),
        },
      };
      (createServerClient as any).mockReturnValue(mockSupabase);
      (prisma.employee.findUnique as any).mockResolvedValue({
        id: 'user-id',
        is_active: true,
      });
      (getUserPermissions as any).mockResolvedValue({
        role: 'employee',
        permissions: [],
      });

      const { error } = await requireAdminApi();
      expect(error).not.toBeNull();
    });
  });

  describe('getTaskFilterByRole', () => {
    it('should return empty filter for admin', () => {
      const filter = getTaskFilterByRole({ id: 'admin-id', isAdmin: true });
      expect(filter).toEqual({});
    });

    it('should return ownership filter for non-admin', () => {
      const filter = getTaskFilterByRole({ id: 'user-id', isAdmin: false });
      expect(filter).toEqual({
        OR: [
          { created_by: 'user-id' },
          { assignee_id: 'user-id' }
        ]
      });
    });
  });
});
