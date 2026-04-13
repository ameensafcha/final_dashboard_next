import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const roles = await prisma.role.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: roles });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user?.email === process.env.SUPER_ADMIN_EMAIL;
    if (!user || !isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, description } = body;

    if (!name) return NextResponse.json({ error: "Role name required" }, { status: 400 });

    const role = await prisma.role.create({
      data: { name, description, is_active: true },
    });
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
