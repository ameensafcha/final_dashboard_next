import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

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
    return NextResponse.json({ error: "Failed to initialize" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const powderStock = await prisma.powder_stock.findFirst();
    
    if (!powderStock) {
      return NextResponse.json({ error: "Powder stock not initialized" }, { status: 404 });
    }

    return NextResponse.json(powderStock);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
