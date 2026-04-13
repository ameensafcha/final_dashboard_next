import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const batches = await prisma.batches.findMany({
      include: { flavor: true },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(batches);
  } catch {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { date, logged_by, raw_material_id, flavor_id, leaves_in, powder_out, quality_check, status, notes } = body;

    if (!logged_by || !flavor_id || !leaves_in || !powder_out) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const leavesInFloat = parseFloat(leaves_in);
    const powderOutFloat = parseFloat(powder_out);

    if (raw_material_id && leavesInFloat > 0) {
      const currentRM = await prisma.raw_materials.findUnique({ where: { id: raw_material_id } });
      if (!currentRM) return NextResponse.json({ error: "Raw material not found" }, { status: 404 });
      if (currentRM.quantity < leavesInFloat) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${currentRM.quantity.toFixed(2)} kg, Required: ${leavesInFloat} kg` },
          { status: 400 }
        );
      }
    }

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const batchIdPrefix = `BATCH-${dateStr}`;
    
    const result = await prisma.$transaction(async (tx) => {
      const latestBatch = await tx.batches.findFirst({
        where: { batch_id: { startsWith: batchIdPrefix } },
        orderBy: { created_at: "desc" },
      });
      
      let sequence = 1;
      if (latestBatch?.batch_id) {
        const lastSeq = parseInt(latestBatch.batch_id.split("-")[2] || "0");
        sequence = lastSeq + 1;
      }
      const batchId = `${batchIdPrefix}-${sequence.toString().padStart(4, "0")}`;
      
      const wasteLoss = leavesInFloat - powderOutFloat;
      const yieldPercent = (powderOutFloat / leavesInFloat) * 100;
      
      const batch = await tx.batches.create({
        data: {
          batch_id: batchId,
          date: date ? new Date(date) : new Date(),
          logged_by,
          raw_material_id: raw_material_id || null,
          flavor_id,
          leaves_in: leavesInFloat,
          powder_out: powderOutFloat,
          waste_loss: wasteLoss,
          yield_percent: yieldPercent,
          quality_check: quality_check || false,
          status: status || "Draft",
          notes: notes || null,
        },
        include: { flavor: true },
      });

      if (raw_material_id && leavesInFloat > 0) {
        await tx.raw_materials.update({
          where: { id: raw_material_id },
          data: { quantity: { decrement: leavesInFloat } },
        });
        await tx.raw_material_logs.create({
          data: { raw_material_id, quantity: leavesInFloat, type: "batch_used", reference_id: batch.id },
        });
      }

      if ((status?.trim() || "") === "Sent in Factory") {
        await tx.finished_products.create({
          data: { flavor_id: batch.flavor_id, quantity: powderOutFloat, batch_reference: batch.batch_id },
        });
        
        const powderStock = await tx.powder_stock.findFirst();
        if (powderStock) {
          await tx.powder_stock.update({
            where: { id: powderStock.id },
            data: { 
              total_from_batches: { increment: powderOutFloat }, 
              received: { increment: powderOutFloat },
              available: { increment: powderOutFloat }, 
              updated_at: new Date() 
            },
          });
        } else {
          await tx.powder_stock.create({
            data: { total_from_batches: powderOutFloat, total_sent: 0, received: powderOutFloat, available: powderOutFloat },
          });
        }
      }

      return batch;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create batch" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, date, logged_by, raw_material_id, flavor_id, leaves_in, powder_out, quality_check, status, notes } = body;

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });
    const existing = await prisma.batches.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    const leavesInFloat = parseFloat(leaves_in);
    const powderOutFloat = parseFloat(powder_out);
    const wasteLoss = leavesInFloat - powderOutFloat;
    const yieldPercent = (powderOutFloat / leavesInFloat) * 100;

    if (raw_material_id && leavesInFloat > 0) {
      const currentRM = await prisma.raw_materials.findUnique({ where: { id: raw_material_id } });
      if (!currentRM) return NextResponse.json({ error: "Raw material not found" }, { status: 404 });
      const restoredQty = existing.raw_material_id === raw_material_id ? (existing.leaves_in || 0) : 0;
      const effectiveAvailable = currentRM.quantity + restoredQty;
      if (effectiveAvailable < leavesInFloat) {
        return NextResponse.json(
          { error: `Insufficient stock. Available: ${effectiveAvailable.toFixed(2)} kg, Required: ${leavesInFloat} kg` },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (existing.raw_material_id && existing.leaves_in) {
        await tx.raw_materials.update({
          where: { id: existing.raw_material_id },
          data: { quantity: { increment: existing.leaves_in } },
        });
      }

      if (raw_material_id && leavesInFloat > 0) {
        await tx.raw_materials.update({
          where: { id: raw_material_id },
          data: { quantity: { decrement: leavesInFloat } },
        });
        await tx.raw_material_logs.create({
          data: { raw_material_id, quantity: leavesInFloat, type: "batch_used", reference_id: id },
        });
      }

      const batch = await tx.batches.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(logged_by && { logged_by }),
          raw_material_id: raw_material_id || null,
          ...(flavor_id && { flavor_id }),
          leaves_in: leavesInFloat,
          powder_out: powderOutFloat,
          ...(quality_check !== undefined && { quality_check }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
          waste_loss: wasteLoss,
          yield_percent: yieldPercent,
        },
        include: { flavor: true },
      });

      const oldStatus = existing.status;
      const newStatus = status;

      if (oldStatus !== "Sent in Factory" && newStatus === "Sent in Factory") {
        await tx.finished_products.create({
          data: { flavor_id: batch.flavor_id, quantity: powderOutFloat, batch_reference: batch.batch_id },
        });
        await tx.powder_stock.updateMany({
          data: { total_from_batches: { increment: powderOutFloat }, received: { increment: powderOutFloat }, available: { increment: powderOutFloat }, updated_at: new Date() },
        });
      }

      if (oldStatus === "Sent in Factory" && newStatus !== "Sent in Factory") {
        await tx.finished_products.deleteMany({ where: { batch_reference: batch.batch_id } });
        await tx.powder_stock.updateMany({
          data: { total_from_batches: { decrement: existing.powder_out }, received: { decrement: existing.powder_out }, available: { decrement: existing.powder_out }, updated_at: new Date() },
        });
      }

      return batch;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update batch" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const existing = await prisma.batches.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Batch not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      if (existing.raw_material_id && existing.leaves_in) {
        await tx.raw_materials.update({
          where: { id: existing.raw_material_id },
          data: { quantity: { increment: existing.leaves_in } },
        });
      }

      if (existing.status === "Sent in Factory") {
        await tx.finished_products.deleteMany({ where: { batch_reference: existing.batch_id } });
        await tx.powder_stock.updateMany({
          data: { total_from_batches: { decrement: existing.powder_out }, available: { decrement: existing.powder_out }, updated_at: new Date() },
        });
      }

      await tx.batches.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}
