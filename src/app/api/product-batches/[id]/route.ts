import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quantity, packaging_state, location, notes, expiry_date, manufacturing_date } =
      await request.json();

    const batch = await prisma.$transaction(async (tx) => {
      // Get old batch to calculate difference
      const oldBatch = await tx.product_batches.findUnique({
        where: { id: params.id },
      });

      if (!oldBatch) throw new Error("Batch not found");

      const updated = await tx.product_batches.update({
        where: { id: params.id },
        data: {
          ...(quantity !== undefined && { quantity: parseInt(quantity) }),
          ...(packaging_state !== undefined && { packaging_state }),
          ...(location !== undefined && { location }),
          ...(notes !== undefined && { notes }),
          ...(expiry_date !== undefined && { expiry_date: expiry_date ? new Date(expiry_date) : null }),
          ...(manufacturing_date !== undefined && { manufacturing_date: manufacturing_date ? new Date(manufacturing_date) : null }),
        },
        include: { variant: { include: { flavor: true, size: true } } },
      });

      // Sync Inventory: Adjust by difference
      if (quantity !== undefined) {
        const diff = parseInt(quantity) - oldBatch.quantity;
        await tx.variant_inventory.upsert({
          where: { variant_id: oldBatch.variant_id },
          update: { quantity: { increment: diff } },
          create: { variant_id: oldBatch.variant_id, quantity: parseInt(quantity) },
        });
      }

      return updated;
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.$transaction(async (tx) => {
      const oldBatch = await tx.product_batches.findUnique({
        where: { id: params.id },
      });

      if (oldBatch) {
        // Sync Inventory: Decrement before deleting
        await tx.variant_inventory.update({
          where: { variant_id: oldBatch.variant_id },
          data: { quantity: { decrement: oldBatch.quantity } },
        });
      }

      await tx.product_batches.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}
