import { vi, describe, it, expect, beforeEach } from 'vitest';
import { checkPermission } from './rbac';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findUnique: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
    },
  },
}));

// Mock next/cache and react
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
  revalidateTag: vi.fn(),
}));

vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

describe('checkPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return FALSE for admin role if specific permission is missing', async () => {
    (prisma.employee.findUnique as any).mockResolvedValue({
      role_id: 'admin-role-id',
      role: { 
        name: 'admin',
        permissions: []
      },
    });

    const result = await checkPermission('dashboard:view', 'user-123');
    expect(result).toBe(false);
  });

  it('should return true for admin role IF it has the permission', async () => {
    (prisma.employee.findUnique as any).mockResolvedValue({
      role_id: 'admin-role-id',
      role: { 
        name: 'admin',
        permissions: [
          { permission: { resource: 'dashboard', action: 'view' } },
        ]
      },
    });

    const result = await checkPermission('dashboard:view', 'user-123');
    expect(result).toBe(true);
  });

  it('should return true if employee has the requested permission', async () => {
    (prisma.employee.findUnique as any).mockResolvedValue({
      role_id: 'employee-role-id',
      role: { 
        name: 'employee',
        permissions: [
          { permission: { resource: 'dashboard', action: 'view' } },
          { permission: { resource: 'inventory', action: 'read' } },
        ]
      },
    });

    const result = await checkPermission('dashboard:view', 'user-123');
    expect(result).toBe(true);
  });

  it('should return false if employee does NOT have the requested permission', async () => {
    (prisma.employee.findUnique as any).mockResolvedValue({
      role_id: 'employee-role-id',
      role: { 
        name: 'employee',
        permissions: [
          { permission: { resource: 'inventory', action: 'read' } },
        ]
      },
    });

    const result = await checkPermission('dashboard:view', 'user-123');
    expect(result).toBe(false);
  });
});
