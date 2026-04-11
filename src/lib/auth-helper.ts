import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

// 1. Supabase Client Setup
async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {}
        },
      },
    }
  );
}

/**
 * 2. Get Current User with Permissions
 */
export const getCurrentUser = cache(async () => {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: {
        role: {
          include: {
            permissions: { where: { is_active: true } }
          }
        }
      }
    });

    if (!employee || !employee.is_active) return null;

    const isSuperAdmin =
      employee.role?.name === 'admin' ||
      (!!process.env.SUPER_ADMIN_EMAIL && employee.email === process.env.SUPER_ADMIN_EMAIL);

    return {
      id: employee.id,
      email: employee.email,
      name: employee.name,
      role: employee.role?.name || null,
      isAdmin: isSuperAdmin,
      permissions: employee.role?.permissions.map(p => p.permission) || []
    };
  } catch (error) {
    return null;
  }
});

/**
 * 3. Auth Response Helper
 */
export function authResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json({ error }, { status });
}

/**
 * 4. Specific Permission Guard (API)
 */
export async function requirePermissionApi(permission: string) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  if (user.isAdmin) return { error: null, user };
  if (!user.permissions.includes(permission)) {
    return { error: NextResponse.json({ error: `Forbidden: ${permission} required` }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

/**
 * 4. Admin Only Guard (API) - FIXES YOUR BUILD ERROR
 */
export async function requireAdminApi() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  if (!user.isAdmin) return { error: NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 }), user: null };
  return { error: null, user };
}

/**
 * 5. General Auth Check
 */
export async function verifyApiAuth() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  return { error: null, user };
}

/**
 * 6. Task Filter for Dashboard (FIX FOR BUILD ERROR)
 * Admin: Sabhi tasks dekh sakta hai
 * User: Sirf wahi tasks dekhega jo ya toh usne banaye hain, ya use assign hue hain.
 */
export function getTaskFilterByRole(user: { id: string; isAdmin: boolean }) {
  if (user.isAdmin) {
    return {}; // Admin ke liye koi filter nahi, return everything
  }

  // Normal users ke liye filter
  return {
    OR: [
      { created_by: user.id },
      { assignee_id: user.id }
    ]
  };
}