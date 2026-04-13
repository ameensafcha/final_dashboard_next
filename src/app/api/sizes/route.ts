import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.sizes.findMany({
      where: { is_active: true },
      orderBy: { size: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sizes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { size, unit, pack_type } = await request.json();
    if (!size || !pack_type) return NextResponse.json({ error: "Size and type required" }, { status: 400 });

    const data = await prisma.sizes.create({
      data: { size, unit: unit || "kg", pack_type, is_active: true },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create size" }, { status: 500 });
  }
}
