/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Provides functions for checking user roles and permissions.
 * Uses auth-helper.ts for user authentication and permissions.ts for permission mappings.
 */

import { getCurrentUser, type AuthUser } from './auth-helper';
import { RolePermissions, type Permission } from './permissions';

/**
 * Get the current user's role from the database.
 * @returns The role name or null if user not authenticated
 */
export async function getUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/**
 * Check if the current user has a specific role.
 * @param requiredRole - The role name to check for
 * @returns true if the user has the role, false otherwise
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const userRole = await getUserRole();
  return userRole === requiredRole;
}

/**
 * Check if the current user has a specific permission.
 * @param requiredPermission - The permission to check for
 * @returns true if the user has the permission, false otherwise
 */
export async function hasPermission(requiredPermission: Permission): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.role) {
    return false;
  }

  const permissions = RolePermissions[user.role] ?? [];
  return permissions.includes(requiredPermission);
}

/**
 * Check if the current user is an admin.
 * @returns true if the user has admin role, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Get all permissions for the current user based on their role.
 * @returns Array of permissions or empty array if not authenticated
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const user = await getCurrentUser();
  if (!user?.role) {
    return [];
  }
  return RolePermissions[user.role] ?? [];
}

/**
 * Check if user can perform an action requiring multiple permissions.
 * @param requiredPermissions - Array of permissions required
 * @returns true if user has ALL required permissions
 */
export async function hasAllPermissions(requiredPermissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions();
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

/**
 * Check if user can perform an action requiring any of the specified permissions.
 * @param requiredPermissions - Array of permissions (any one required)
 * @returns true if user has ANY of the required permissions
 */
export async function hasAnyPermission(requiredPermissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions();
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}
