import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { variantInventorySchema } from "@/lib/validations/inventory";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inventory = await prisma.variant_inventory.findMany({
      include: {
        variant: {
          include: {
            product: true,
            flavor: true,
            size: true,
          },
        },
      },
      orderBy: {
        quantity: "desc",
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = variantInventorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { variant_id, quantity, type } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update variant_inventory
      const updatedInventory = await tx.variant_inventory.upsert({
        where: { variant_id },
        create: {
          variant_id,
          quantity: type === "subtract" ? -quantity : quantity,
        },
        update: {
          quantity: 
            type === "set" ? quantity : 
            type === "add" ? { increment: quantity } : 
            { decrement: quantity }
        },
      });

      // 2. Keep product_stock in sync to avoid mismatches
      await tx.product_stock.upsert({
        where: { variant_id },
        create: {
          variant_id,
          quantity: type === "subtract" ? -quantity : quantity,
        },
        update: {
          quantity: 
            type === "set" ? quantity : 
            type === "add" ? { increment: quantity } : 
            { decrement: quantity }
        },
      });

      return updatedInventory;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating manual inventory:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
