import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");
    if (!user.isAdmin) return authResponse("Forbidden: Admin only", 403);

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
