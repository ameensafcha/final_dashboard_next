import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiAuth } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { error } = await verifyApiAuth();
    if (error) return error;

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
    const { error } = await verifyApiAuth();
    if (error) return error;

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
