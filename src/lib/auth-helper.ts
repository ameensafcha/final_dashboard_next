import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cache } from "react";
// Permissions will be redesigned in Phase 4-5
// import { getRolePermissionsFromDB, type Permission } from "./permissions";
type Permission = string;

export type AuthUser = {
  id: string;
  email: string;
  role: string | null;
  isAdmin: boolean;
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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Next.js static generation warning handler
          }
        },
      },
    }
  );
}

/**
 * 1. Get Current User (Cached)
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
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
    console.error("[getCurrentUser] Error:", error);
    return null;
  }
});

/**
 * 2. Require Authentication (Server Components)
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * 3. Require Admin (Server Components)
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (!user.isAdmin) {
    throw new Error("Admin access required");
  }
  return user;
}

/**
 * 3b. Require Admin for API Routes (returns NextResponse)
 */
export async function requireAdminApi() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    return user;
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * 3c. Require Role for API Routes (returns user or NextResponse)
 */
export async function requireRole(roleName: string): Promise<AuthUser | NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== roleName && !user.isAdmin) {
      return NextResponse.json({ error: `Role '${roleName}' required` }, { status: 403 });
    }
    return user;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * 4. Require Specific Permission (Server Components)
 */
export async function requirePermission(permission: string) {
  const user = await requireAuth();
  if (!user.role) {
    throw new Error(`Permission denied: ${permission} - no role assigned`);
  }

  const employee = await prisma.employees.findUnique({
    where: { id: user.id },
    include: { role: true },
  });

  if (!employee?.role_id) {
    throw new Error(`Permission denied: ${permission} - no role`);
  }

  const hasPermission = await prisma.role_permissions.findFirst({
    where: {
      role_id: employee.role_id,
      permission: permission,
      is_active: true,
    },
  });

  if (!hasPermission) {
    throw new Error(`Permission denied: ${permission} required`);
  }

  return user;
}

/**
 * 4b. Require Specific Permission for API Routes (returns NextResponse)
 */
export async function requirePermissionApi(permission: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.role) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee?.role_id) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const hasPermission = await prisma.role_permissions.findFirst({
      where: {
        role_id: employee.role_id,
        permission: permission,
        is_active: true,
      },
    });

    if (!hasPermission) {
      return NextResponse.json({ error: `Forbidden: ${permission} permission required` }, { status: 403 });
    }

    return user;
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

/**
 * 4. API Endpoint Authorization Helper
 */
export async function verifyApiAuth(requiredPermission?: Permission) {
  const user = await getCurrentUser();
  
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }

  // Permissions will be re-implemented in Phase 4-5
  // For now, allow all authenticated users
  if (requiredPermission) {
    // TODO: Re-implement with new permissions system
    // const userPermissions = await getRolePermissionsFromDB(user.role ?? "");
    // if (!userPermissions.includes(requiredPermission)) {
    //   return { error: NextResponse.json({ error: `Forbidden: ${requiredPermission} required` }, { status: 403 }), user: null };
    // }
  }

  return { error: null, user };
}

/**
 * 5. Task Filter Logic
 */
export function getTaskFilterByRole(user: AuthUser): any {
  if (user.isAdmin) return {};
  return { assignee_id: user.id };
}

/**
 * 6. Auth Response Helper (FIXED: Added back to fix Build Error)
 */
export function authResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json({ error }, { status });
}