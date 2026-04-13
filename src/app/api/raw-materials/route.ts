import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawMaterials = await prisma.raw_materials.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: rawMaterials });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, quantity, unit, price_per_kg } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const material = await prisma.raw_materials.create({
      data: { name, quantity: parseFloat(quantity) || 0, unit: unit || "kg", price_per_kg: price_per_kg ? parseFloat(price_per_kg) : null },
    });
    return NextResponse.json({ data: material }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name, quantity, unit, price_per_kg } = await request.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updated = await prisma.raw_materials.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit && { unit }),
        ...(price_per_kg !== undefined && { price_per_kg: price_per_kg ? parseFloat(price_per_kg) : null }),
      },
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.raw_materials.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
