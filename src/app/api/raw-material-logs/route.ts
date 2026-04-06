import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw_material_id = searchParams.get("raw_material_id");

    const where = raw_material_id 
      ? { raw_material_id: parseInt(raw_material_id) }
      : {};

    const logs = await prisma.raw_material_logs.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
