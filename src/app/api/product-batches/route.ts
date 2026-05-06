import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get("variant_id");

    const batches = await prisma.product_batches.findMany({
      where: variantId ? { variant_id: variantId } : {},
      include: { variant: { include: { flavor: true, size: true, product: true } } },
      orderBy: { expiry_date: "asc" },
    });

    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { variant_id, quantity, manufacturing_date, expiry_date, packaging_state, location, notes } =
      await request.json();

    if (!variant_id || !quantity) {
      return NextResponse.json({ error: "variant_id and quantity are required" }, { status: 400 });
    }

    const variant = await prisma.product_variants.findUnique({ where: { id: variant_id } });
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

    const dateStr = manufacturing_date
      ? format(new Date(manufacturing_date), "yyMMdd")
      : format(new Date(), "yyMMdd");
    const batch_id = `${variant.sku}-${dateStr}`;

    const existingCount = await prisma.product_batches.count({ where: { batch_id: { startsWith: batch_id } } });
    const finalBatchId = existingCount > 0 ? `${batch_id}-${existingCount + 1}` : batch_id;

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.product_batches.create({
        data: {
          variant_id,
          batch_id: finalBatchId,
          quantity: parseInt(quantity),
          manufacturing_date: manufacturing_date ? new Date(manufacturing_date) : null,
          expiry_date: expiry_date ? new Date(expiry_date) : null,
          packaging_state: packaging_state || "raw",
          location: location || "factory",
          notes,
        },
        include: { variant: { include: { flavor: true, size: true, product: true } } },
      });

      // Sync Inventory: Increment variant_inventory
      await tx.variant_inventory.upsert({
        where: { variant_id },
        update: { quantity: { increment: parseInt(quantity) } },
        create: { variant_id, quantity: parseInt(quantity) },
      });

      return b;
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
