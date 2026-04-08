import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

function getCookies(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map(c => c.trim()).filter(Boolean).reduce((acc, cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name) acc.push({ name, value: rest.join("=") });
    return acc;
  }, [] as { name: string; value: string }[]);
  return cookies;
}

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient({ getAll: () => getCookies(request) });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!employee || employee.role?.name !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const roles = await prisma.roles.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}