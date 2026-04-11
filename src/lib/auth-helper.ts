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
    redirect("/dashboard");
  }
  return user;
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