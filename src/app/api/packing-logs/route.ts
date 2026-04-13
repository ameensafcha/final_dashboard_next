import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.packing_logs.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packing logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { third_party_name, bag_size, bag_count } = await request.json();

    if (!third_party_name || !bag_size || !bag_count) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const totalKg = (parseInt(bag_size) * parseInt(bag_count)) / 1000;

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.packing_logs.create({
        data: {
          third_party_name,
          bag_size: parseInt(bag_size),
          bag_count: parseInt(bag_count),
          total_kg: totalKg,
        },
      });

      const powderStock = await tx.powder_stock.findFirst();
      if (powderStock) {
        await tx.powder_stock.update({
          where: { id: powderStock.id },
          data: {
            sent: { increment: totalKg },
            available: { decrement: totalKg },
            updated_at: new Date(),
          },
        });
      }

      return log;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create packing log" }, { status: 500 });
  }
}
