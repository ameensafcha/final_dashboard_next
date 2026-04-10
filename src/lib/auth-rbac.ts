/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Provides functions for checking user roles and permissions.
 * Uses auth-helper.ts for user authentication and permissions.ts for permission mappings.
 */

import { type NextRequest } from 'next/server';
import { getCurrentUser, type AuthUser } from './auth-helper';
import { RolePermissions, type Permission } from './permissions';
import { prisma } from './prisma';

/**
 * Single source of truth for role definitions.
 * All role-related constants should be imported from this file.
 */
export const ROLES = ['viewer', 'employee', 'admin'] as const;
export type Role = typeof ROLES[number];

/**
 * Role hierarchy for RBAC - lower index = less privilege
 * Used throughout the codebase for role comparisons.
 */
export const ROLE_HIERARCHY = ROLES;

/**
 * Default route-to-role mappings (code-based defaults).
 * These can be overridden by entries in the route_permissions table.
 */
export const DEFAULT_ROUTE_PERMISSIONS: Record<string, string> = {
  '/settings': 'admin',
  '/admin': 'admin',
  '/employees': 'admin',
  '/dashboard': 'employee',
  '/batches': 'employee',
  '/stock': 'employee',
};

/**
 * Protected routes that require specific roles.
 */
export const PROTECTED_ROUTES = ['/settings', '/admin', '/employees'];

/**
 * Public routes that skip role checks.
 */
export const PUBLIC_ROUTES = [
  '/login',
  '/dashboard',
  '/batches',
  '/stock',
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
];

/**
 * Check if a route is public (doesn't require role check).
 * @param pathname - The route pathname to check
 * @returns true if the route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('/')) {
      // Prefix match for /api/auth/, /_next/
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route;
  });
}

/**
 * Get the user's role by querying the database with the user ID from the request.
 * This function works in both server components and middleware.
 * @param userId - The Supabase user ID
 * @returns The role name or null if user not found/inactive
 */
async function getRoleByUserId(userId: string): Promise<string | null> {
  try {
    const employee = await prisma.employees.findFirst({
      where: {
        id: userId,
        is_active: true,
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    
    return employee?.role?.name ?? null;
  } catch {
    return null;
  }
}

/**
 * Get user role from a NextRequest.
 * Extracts user from Supabase cookie and queries DB for their role.
 * Works in middleware context.
 * @param request - The NextRequest object
 * @returns The role name or null if unauthenticated
 */
export async function getUserRoleFromRequest(request: NextRequest): Promise<string | null> {
  // Import the Supabase client setup
  const { createServerClient } = await import('@supabase/ssr');
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return getRoleByUserId(user.id);
}

/**
 * Result of a route permission check.
 */
export type PermissionCheckResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Check if a user has permission to access a specific route.
 * Uses hybrid storage: code defaults with database overrides.
 * @param request - The NextRequest object
 * @param routePath - The route path to check
 * @returns PermissionCheckResult with allowed flag and optional reason
 */
export async function checkRoutePermission(
  request: NextRequest,
  routePath: string
): Promise<PermissionCheckResult> {
  // 1. Get user role from request
  const userRole = await getUserRoleFromRequest(request);
  
  if (!userRole) {
    return {
      allowed: false,
      reason: 'unauthenticated',
    };
  }
  
  // 2. Check if route is in protected list
  const requiredRole = DEFAULT_ROUTE_PERMISSIONS[routePath];
  
  if (!requiredRole) {
    // Not a protected route, allow access
    return {
      allowed: true,
    };
  }
  
  // 3. Check database for admin overrides
  try {
    const routePerm = await prisma.route_permissions.findFirst({
      where: {
        route_path: routePath,
        is_active: true,
      },
    });
    
    // 4. Use database override if exists, otherwise use code default
    const effectiveRequiredRole = routePerm?.required_role ?? requiredRole;
    
    // 5. Check if user's role meets the requirement
    const roleHierarchy = ['viewer', 'employee', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(effectiveRequiredRole);
    
    if (userRoleIndex >= requiredRoleIndex) {
      return {
        allowed: true,
      };
    }
    
    return {
      allowed: false,
      reason: `${effectiveRequiredRole}_required`,
    };
  } catch {
    // Database error - fallback to code defaults
    const roleHierarchy = ['viewer', 'employee', 'admin'];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    if (userRoleIndex >= requiredRoleIndex) {
      return {
        allowed: true,
      };
    }
    
    return {
      allowed: false,
      reason: `${requiredRole}_required`,
    };
  }
}

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