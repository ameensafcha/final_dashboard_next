import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RolePermissions, type Permission } from "./permissions";

/**
 * Role hierarchy for RBAC - lower index = less privilege
 * Mirrors ROLES from auth-rbac.ts to avoid circular dependency
 */
const ROLE_HIERARCHY = ['viewer', 'employee', 'admin'] as const;

export type AuthErrorType = "UNAUTHORIZED" | "NOT_FOUND" | "INACTIVE" | "UNKNOWN";

export interface AuthUser {
  id: string;
  email: string;
  role: string | null;
  isAdmin: boolean;
}

export type AuthError = {
  type: AuthErrorType;
  message: string;
};

async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Next.js Server Components warning handler
          }
        },
      },
    }
  );
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) return null;

    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee || !employee.is_active) return null;

    return {
      id: employee.id,
      email: employee.email,
      role: employee.role?.name ?? null,
      isAdmin: employee.role?.name === "admin",
    };
  } catch (error) {
    const err = error as Error & { digest?: string };
    const isExpectedSSGError = err.digest?.includes("DYNAMIC_SERVER_USAGE");
    if (!isExpectedSSGError) {
      console.error("[getCurrentUser] Failed to fetch current user:", error);
    }
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!user.isAdmin) {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Check if the current user has the required role or higher.
 * Returns the user object if authorized, or a NextResponse with 401/403 if not.
 * 
 * @param requiredRole - The role required (viewer, employee, admin)
 * @returns AuthUser if authorized, NextResponse with error if not
 */
export async function requireRole(requiredRole: string): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  
  if (!user) {
    return authResponse("Unauthorized", 401);
  }
  
  const userRoleIndex = ROLE_HIERARCHY.indexOf(user.role as typeof ROLE_HIERARCHY[number]);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole as typeof ROLE_HIERARCHY[number]);
  
  if (userRoleIndex === -1 || requiredRoleIndex === -1) {
    return authResponse(`Forbidden: ${requiredRole} role required`, 403);
  }
  
  if (userRoleIndex >= requiredRoleIndex) {
    return user;
  }
  
  return authResponse(`Forbidden: ${requiredRole} role required`, 403);
}

/**
 * Check if the current user has the required permission.
 * Returns the user object if authorized, or a NextResponse with 401/403 if not.
 * 
 * @param requiredPermission - The permission string required (e.g., 'edit:admin', 'view:settings')
 * @returns AuthUser if authorized, NextResponse with error if not
 */
export async function requirePermission(requiredPermission: Permission): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  
  if (!user) {
    return authResponse("Unauthorized", 401);
  }
  
  if (!user.role) {
    return authResponse(`Forbidden: ${requiredPermission} permission required`, 403);
  }
  
  const userPermissions = RolePermissions[user.role] ?? [];
  
  if (userPermissions.includes(requiredPermission)) {
    return user;
  }
  
  return authResponse(`Forbidden: ${requiredPermission} permission required`, 403);
}

export function authResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json({ error }, { status });
}