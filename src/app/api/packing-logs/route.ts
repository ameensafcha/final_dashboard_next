import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const logs = await prisma.packing_logs.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packing logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const body = await req.json();
    const { third_party_name, bag_size, bag_count } = body;

    // Validation
    if (!third_party_name || typeof third_party_name !== "string" || third_party_name.trim().length === 0) {
      return NextResponse.json({ error: "Third party name is required" }, { status: 400 });
    }

    if (!bag_size || typeof bag_size !== "number") {
      return NextResponse.json({ error: "Bag size is required" }, { status: 400 });
    }

    if (bag_size !== 5 && bag_size !== 10) {
      return NextResponse.json({ error: "Bag size must be 5 or 10 kg" }, { status: 400 });
    }

    if (!bag_count || typeof bag_count !== "number" || bag_count < 1) {
      return NextResponse.json({ error: "Bag count must be at least 1" }, { status: 400 });
    }

    const total_kg = bag_size * bag_count;

    // Check available powder from powder_stock table
    let powderStock = await prisma.powder_stock.findFirst();
    
    if (!powderStock || powderStock.available < total_kg) {
      const available = powderStock?.available || 0;
      return NextResponse.json(
        { error: `Not enough powder in stock. Available: ${available.toFixed(2)} kg, Requested: ${total_kg} kg` },
        { status: 400 }
      );
    }

    // Create packing log
    const packingLog = await prisma.packing_logs.create({
      data: {
        third_party_name,
        bag_size,
        bag_count,
        total_kg,
      },
    });

    // Update powder_stock
    await prisma.powder_stock.update({
      where: { id: powderStock.id },
      data: {
        total_sent: { increment: total_kg },
        available: { decrement: total_kg },
        updated_at: new Date(),
      },
    });

    return NextResponse.json(packingLog);
  } catch (error) {
    console.error("Packing log error:", error);
    return NextResponse.json({ error: "Failed to create packing log" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const existing = await prisma.packing_logs.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Packing log not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Restore powder stock
      await tx.powder_stock.updateMany({
        data: {
          total_sent: { decrement: existing.total_kg },
          available: { increment: existing.total_kg },
          updated_at: new Date(),
        },
      });
      await tx.packing_logs.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete packing log" }, { status: 500 });
  }
}
