import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type AuthErrorType = "UNAUTHORIZED" | "NOT_FOUND" | "INACTIVE" | "UNKNOWN";

export interface AuthError {
  type: AuthErrorType;
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string | null;
  isAdmin: boolean;
}

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

export function authResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json({ error }, { status });
}