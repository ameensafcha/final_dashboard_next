import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.flavors.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch flavors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, short_code, ingredients } = await request.json();
    if (!name || !short_code) return NextResponse.json({ error: "Name and code required" }, { status: 400 });

    const data = await prisma.flavors.create({
      data: { name, short_code, ingredients, is_active: true },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create flavor" }, { status: 500 });
  }
}
