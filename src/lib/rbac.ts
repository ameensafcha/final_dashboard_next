import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Fetch the user's role and associated permissions.
 * Memoized per request with cache() and cross-request with unstable_cache().
 */
export const getUserPermissions = cache(async (userId: string) => {
  return unstable_cache(
    async () => {
      const user = await prisma.employee.findUnique({
        where: { id: userId },
        select: {
          role_id: true,
          role: {
            select: {
              name: true,
              permissions: {
                where: { is_active: true },
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!user || !user.role) {
        return { role: null, permissions: [] };
      }

      const permissions = user.role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`
      );

      return {
        role: user.role.name,
        permissions,
      };
    },
    [`user-perms-${userId}`],
    {
      tags: ['permissions', `user-${userId}`],
      revalidate: 3600, // 1 hour
    }
  )();
});

/**
 * Server-side utility to check if a user has a specific permission.
 * Supports admin bypass.
 * 
 * @param permissionKey The permission string (e.g., 'dashboard:view')
 * @param userId The ID of the employee to check
 * @returns Promise<boolean>
 */
export async function checkPermission(permissionKey: string, userId: string): Promise<boolean> {
  const { role, permissions } = await getUserPermissions(userId);

  if (!role) return false;

  return permissions.includes(permissionKey);
}
