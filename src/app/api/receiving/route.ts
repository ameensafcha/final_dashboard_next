import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.receiving_materials.findMany({
      include: { raw_material: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch receiving" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { raw_material_id, quantity, rate, supplier, date, notes } = await request.json();

    if (!raw_material_id || !quantity) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const receiving = await tx.receiving_materials.create({
        data: {
          raw_material_id,
          quantity: parseFloat(quantity),
          rate: rate ? parseFloat(rate) : null,
          supplier: supplier || "Unknown",
          date: date ? new Date(date) : new Date(),
          notes,
        },
      });

      await tx.raw_materials.update({
        where: { id: raw_material_id },
        data: { quantity: { increment: parseFloat(quantity) } },
      });

      await tx.raw_material_logs.create({
        data: {
          raw_material_id,
          quantity: parseFloat(quantity),
          type: "received",
          reference_id: receiving.id,
        },
      });

      return receiving;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create receiving" }, { status: 500 });
  }
}
