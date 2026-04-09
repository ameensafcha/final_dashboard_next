/**
 * Role-based Access Control (RBAC) Permissions
 * 
 * Defines permission strings and role-permission mappings for the application.
 * This file establishes consistent permission checking across the entire application.
 */

export type Permission = 
  | 'view:dashboard'
  | 'edit:dashboard'
  | 'view:admin'
  | 'edit:admin'
  | 'view:settings'
  | 'edit:settings'
  | 'view:employees'
  | 'edit:employees'
  | 'view:batches'
  | 'edit:batches'
  | 'view:stock'
  | 'edit:stock';

/**
 * Mapping of role names to their associated permissions.
 * Each role inherits all permissions from less privileged roles.
 */
export const RolePermissions: Record<string, Permission[]> = {
  admin: [
    'view:dashboard',
    'edit:dashboard',
    'view:admin',
    'edit:admin',
    'view:settings',
    'edit:settings',
    'view:employees',
    'edit:employees',
    'view:batches',
    'edit:batches',
    'view:stock',
    'edit:stock',
  ],
  employee: [
    'view:dashboard',
    'edit:dashboard',
    'view:batches',
    'edit:batches',
    'view:stock',
    'edit:stock',
  ],
  viewer: [
    'view:dashboard',
    'view:batches',
    'view:stock',
  ],
};

/**
 * Array of all defined permissions for validation and iteration.
 */
export const PERMISSIONS: Permission[] = [
  'view:dashboard',
  'edit:dashboard',
  'view:admin',
  'edit:admin',
  'view:settings',
  'edit:settings',
  'view:employees',
  'edit:employees',
  'view:batches',
  'edit:batches',
  'view:stock',
  'edit:stock',
];

/**
 * Check if a role has a specific permission.
 * @param role - The role name to check
 * @param permission - The permission to verify
 * @returns true if the role has the permission, false otherwise
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const permissions = RolePermissions[role] ?? [];
  return permissions.includes(permission);
}

/**
 * Get all permissions for a given role.
 * @param role - The role name
 * @returns Array of permissions for the role
 */
export function getRolePermissions(role: string): Permission[] {
  return RolePermissions[role] ?? [];
}

/**
 * Get all available roles in the system.
 * @returns Array of role names
 */
export function getAvailableRoles(): string[] {
  return Object.keys(RolePermissions);
}
