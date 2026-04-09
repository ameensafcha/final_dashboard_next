import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await prisma.app_settings.findUnique({ where: { key } });
      return NextResponse.json({ data: setting });
    }

    const settings = await prisma.app_settings.findMany();
    return NextResponse.json({ data: settings });
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");
    if (!user.isAdmin) return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });

    const { key, value } = await request.json();
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });

    const setting = await prisma.app_settings.upsert({
      where: { key },
      update: { value, updated_at: new Date() },
      create: { key, value },
    });

    return NextResponse.json({ data: setting });
  } catch {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
