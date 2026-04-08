import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const batches = await prisma.batches.findMany({
      include: {
        flavor: true,
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(batches);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const body = await request.json();
    const { 
      date, 
      logged_by, 
      raw_material_id,
      flavor_id, 
      leaves_in, 
      powder_out, 
      quality_check, 
      status, 
      notes 
    } = body;

    if (!logged_by || !flavor_id || !leaves_in || !powder_out) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const latestBatch = await prisma.batches.findFirst({
      where: {
        batch_id: { startsWith: `BATCH-${dateStr}` },
      },
      orderBy: { created_at: "desc" },
    });

    let sequence = 1;
    if (latestBatch?.batch_id) {
      const lastSeq = parseInt(latestBatch.batch_id.split('-')[2] || "0");
      sequence = lastSeq + 1;
    }
    const batchId = `BATCH-${dateStr}-${sequence.toString().padStart(4, "0")}`;

    const wasteLoss = parseFloat(leaves_in) - parseFloat(powder_out);
    const yieldPercent = (parseFloat(powder_out) / parseFloat(leaves_in)) * 100;
    
    const rawMaterialIdInt = raw_material_id || null;
    const leavesInFloat = parseFloat(leaves_in);

    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batches.create({
        data: {
          batch_id: batchId,
          date: date ? new Date(date) : new Date(),
          logged_by,
          raw_material_id: rawMaterialIdInt,
          flavor_id,
          leaves_in: leavesInFloat,
          powder_out: parseFloat(powder_out),
          waste_loss: wasteLoss,
          yield_percent: yieldPercent,
          quality_check: quality_check || false,
          status: status || "Draft",
          notes: notes || null,
        },
        include: {
          flavor: true,
        },
      });

      // Deduct raw material if selected and valid
      if (rawMaterialIdInt && !isNaN(rawMaterialIdInt) && leavesInFloat > 0) {
        try {
          const currentRM = await tx.raw_materials.findUnique({
            where: { id: rawMaterialIdInt },
          });
          
          const updatedRM = await tx.raw_materials.update({
            where: { id: rawMaterialIdInt },
            data: { quantity: { decrement: leavesInFloat } },
          });

          await tx.raw_material_logs.create({
            data: {
              raw_material_id: rawMaterialIdInt,
              quantity: leavesInFloat,
              type: "batch_used",
              reference_id: batch.id,
            },
          });
        } catch (deductError) {
          console.error(deductError);
        }
      }

      // Add to finished products if status is "Sent in Factory"
      const statusStr = status?.trim() || "";
      if (statusStr === "Sent in Factory") {
        await tx.finished_products.create({
          data: {
            flavor_id: batch.flavor_id,
            quantity: batch.powder_out,
            batch_reference: batch.batch_id,
          },
        });

        // Update powder_stock
        const powderOutFloat = parseFloat(powder_out);
        let powderStock = await tx.powder_stock.findFirst();
        if (powderStock) {
          await tx.powder_stock.update({
            where: { id: powderStock.id },
            data: {
              total_from_batches: { increment: powderOutFloat },
              available: { increment: powderOutFloat },
              updated_at: new Date(),
            },
          });
        } else {
          await tx.powder_stock.create({
            data: {
              total_from_batches: powderOutFloat,
              total_sent: 0,
              available: powderOutFloat,
            },
          });
        }
      }

      return batch;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const body = await request.json();
    const {
      id,
      date,
      logged_by,
      raw_material_id,
      flavor_id,
      leaves_in,
      powder_out,
      quality_check,
      status,
      notes
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.batches.findUnique({ 
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const wasteLoss = parseFloat(leaves_in) - parseFloat(powder_out);
    const yieldPercent = (parseFloat(powder_out) / parseFloat(leaves_in)) * 100;
    
    const rawMaterialIdInt = raw_material_id || null;
    const leavesInFloat = parseFloat(leaves_in);

    const result = await prisma.$transaction(async (tx) => {
      // Handle raw material changes - restore old if exists
      if (existing.raw_material_id && existing.leaves_in) {
        await tx.raw_materials.update({
          where: { id: existing.raw_material_id },
          data: { quantity: { increment: existing.leaves_in } },
        });
      }

      // Deduct new raw material if selected and valid
      if (rawMaterialIdInt && leavesInFloat > 0) {
        await tx.raw_materials.update({
          where: { id: rawMaterialIdInt },
          data: { quantity: { decrement: leavesInFloat } },
        });

        await tx.raw_material_logs.create({
          data: {
            raw_material_id: rawMaterialIdInt,
            quantity: leavesInFloat,
            type: "batch_used",
            reference_id: id,
          },
        });
      }

      const batch = await tx.batches.update({
        where: { id },
        data: {
          ...(date && { date: new Date(date) }),
          ...(logged_by && { logged_by }),
          ...(raw_material_id && { raw_material_id }),
          ...(flavor_id && { flavor_id }),
          ...(leaves_in !== undefined && { leaves_in: parseFloat(leaves_in) }),
          ...(powder_out !== undefined && { powder_out: parseFloat(powder_out) }),
          ...(quality_check !== undefined && { quality_check }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
          waste_loss: wasteLoss,
          yield_percent: yieldPercent,
        },
        include: {
          flavor: true,
        },
      });

      const oldStatus = existing.status;
      const newStatus = status;

      if (oldStatus !== "Sent in Factory" && newStatus === "Sent in Factory") {
        await tx.finished_products.create({
          data: {
            flavor_id: batch.flavor_id,
            quantity: batch.powder_out,
            batch_reference: batch.batch_id,
          },
        });
      }

      if (oldStatus === "Sent in Factory" && newStatus !== "Sent in Factory") {
        await tx.finished_products.deleteMany({
          where: { batch_reference: batch.batch_id },
        });
      }

    return batch;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.batches.findUnique({ 
      where: { id },
    });

    if (existing) {
      await prisma.$transaction(async (tx) => {
        // Restore raw material if exists
        if (existing.raw_material_id && existing.leaves_in) {
          await tx.raw_materials.update({
            where: { id: existing.raw_material_id },
            data: { quantity: { increment: existing.leaves_in } },
          });
        }

        await tx.batches.delete({ where: { id } });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
  }
}
