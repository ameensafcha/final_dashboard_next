import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.powder_stock.findFirst();
    if (existing) {
      return NextResponse.json(existing);
    }

    const [finishedProducts, packingLogs] = await Promise.all([
      prisma.finished_products.findMany(),
      prisma.packing_logs.findMany(),
    ]);

    const totalFromBatches = finishedProducts.reduce((sum, fp) => sum + fp.quantity, 0);
    const totalSent = packingLogs.reduce((sum, log) => sum + log.total_kg, 0);
    const available = totalFromBatches - totalSent;

    const powderStock = await prisma.powder_stock.create({
      data: {
        total_from_batches: totalFromBatches,
        total_sent: totalSent,
        available,
      },
    });

    return NextResponse.json(powderStock);
  } catch (error) {
    console.error('[PowderStock POST] Error:', error);
    return NextResponse.json({ error: "Failed to initialize" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const powderStock = await prisma.powder_stock.findFirst();
    
    if (!powderStock) {
      return NextResponse.json({
        id: 0,
        total_from_batches: 0,
        total_sent: 0,
        available: 0,
        message: "Powder stock not initialized"
      });
    }

    return NextResponse.json(powderStock);
  } catch (error) {
    console.error('[PowderStock GET] Error:', error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
