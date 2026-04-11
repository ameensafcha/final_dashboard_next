import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getCurrentUser } from '@/lib/auth-helper';

// 1. Mock the auth-helper
vi.mock('@/lib/auth-helper', () => ({
  getCurrentUser: vi.fn(),
}));

// 2. Mock prisma to prevent actual DB connection during test
vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

describe('GET /api/users/permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock user as null
    (getCurrentUser as any).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return permissions array from user object', async () => {
    // Mock user with permissions
    (getCurrentUser as any).mockResolvedValue({
      id: 'user-123',
      permissions: ['products:read', 'batches:write'],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.permissions).toEqual(['products:read', 'batches:write']);
  });

  it('should return an empty array if user has no permissions', async () => {
    // Mock user with no permissions
    (getCurrentUser as any).mockResolvedValue({
      id: 'user-123',
      permissions: [],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.permissions).toEqual([]);
  });
});
