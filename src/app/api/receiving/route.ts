import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const receivings = await prisma.receiving_materials.findMany({
      include: { raw_material: true },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(receivings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { raw_material_id, quantity, rate, supplier, date, notes } = body;

    const result = await prisma.$transaction(async (tx) => {
      const currentMaterial = await tx.raw_materials.findUnique({
        where: { id: raw_material_id },
      });

      let newPricePerKg = currentMaterial?.price_per_kg || null;

      if (rate && currentMaterial) {
        const oldQty = currentMaterial.quantity || 0;
        const oldPrice = currentMaterial.price_per_kg || 0;
        const newQty = parseFloat(quantity);
        const newRate = parseFloat(rate);

        if (oldQty + newQty > 0) {
          newPricePerKg = ((oldPrice * oldQty) + (newRate * newQty)) / (oldQty + newQty);
        }
      }

      const receiving = await tx.receiving_materials.create({
        data: {
          raw_material_id,
          quantity: parseFloat(quantity),
          unit: currentMaterial?.unit || "kg",
          rate: rate ? parseFloat(rate) : null,
          supplier,
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
        },
      });

      const updatedMaterial = await tx.raw_materials.update({
        where: { id: raw_material_id },
        data: {
          quantity: { increment: parseFloat(quantity) },
          ...(newPricePerKg !== null && { price_per_kg: newPricePerKg }),
        },
      });

      // Create raw material log for purchase
      await tx.raw_material_logs.create({
        data: {
          raw_material_id,
          quantity: parseFloat(quantity),
          type: "purchase",
          reference_id: receiving.id,
        },
      });

      // Auto-create transaction for purchase
      const transactionRate = rate ? parseFloat(rate) : (currentMaterial?.price_per_kg || 0);
      const transactionAmount = parseFloat(quantity) * transactionRate;

      if (transactionAmount > 0) {
        await tx.transactions.create({
          data: {
            type: "purchase",
            amount: transactionAmount,
            date: date ? new Date(date) : new Date(),
            reference_id: receiving.id,
            person: supplier,
            note: `Purchase: ${currentMaterial?.name || "Raw Material"}`,
          },
        });
      }

      return { receiving, material: updatedMaterial };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, raw_material_id, quantity, rate, supplier, date, notes } = body;

    const result = await prisma.$transaction(async (tx) => {
      const oldReceiving = await tx.receiving_materials.findUnique({
        where: { id },
      });

      if (!oldReceiving) {
        throw new Error("Receiving not found");
      }

      const oldMaterial = await tx.raw_materials.findUnique({
        where: { id: oldReceiving.raw_material_id },
      });

      const newMaterial = await tx.raw_materials.findUnique({
        where: { id: raw_material_id },
      });

      const qtyDiff = parseFloat(quantity) - oldReceiving.quantity;
      const oldRawMaterialId = oldReceiving.raw_material_id;

      await tx.receiving_materials.update({
        where: { id },
        data: {
          raw_material_id,
          quantity: parseFloat(quantity),
          unit: newMaterial?.unit || "kg",
          rate: rate ? parseFloat(rate) : null,
          supplier,
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
        },
      });

      if (oldRawMaterialId !== raw_material_id) {
        await tx.raw_materials.update({
          where: { id: oldRawMaterialId },
          data: { quantity: { decrement: oldReceiving.quantity } },
        });

        let newPricePerKg = newMaterial?.price_per_kg || null;
        if (rate && newMaterial) {
          const oldQty = newMaterial.quantity || 0;
          const oldPrice = newMaterial.price_per_kg || 0;
          const newQty = parseFloat(quantity);
          const newRate = parseFloat(rate);
          if (oldQty + newQty > 0) {
            newPricePerKg = ((oldPrice * oldQty) + (newRate * newQty)) / (oldQty + newQty);
          }
        }

        await tx.raw_materials.update({
          where: { id: raw_material_id },
          data: {
            quantity: { increment: parseFloat(quantity) },
            ...(newPricePerKg !== null && { price_per_kg: newPricePerKg }),
          },
        });
      } else {
        let newPricePerKg = newMaterial?.price_per_kg || null;
        if (rate && newMaterial) {
          const oldQty = (newMaterial.quantity || 0) - qtyDiff;
          const oldPrice = oldMaterial?.price_per_kg || 0;
          const newQty = parseFloat(quantity);
          const newRate = parseFloat(rate);
          
          const totalQty = newMaterial.quantity || 0;
          const totalValue = (oldPrice * oldQty) + (newRate * newQty);
          if (totalQty > 0) {
            newPricePerKg = totalValue / totalQty;
          }
        }

        await tx.raw_materials.update({
          where: { id: raw_material_id },
          data: {
            quantity: { increment: qtyDiff },
            ...(newPricePerKg !== null && { price_per_kg: newPricePerKg }),
          },
        });
      }

      // Update or create transaction
      const existingTransaction = await tx.transactions.findFirst({
        where: { reference_id: id },
      });

      const transactionRate = rate ? parseFloat(rate) : (newMaterial?.price_per_kg || 0);
      const transactionAmount = parseFloat(quantity) * transactionRate;

      if (existingTransaction) {
        if (transactionAmount > 0) {
          await tx.transactions.update({
            where: { id: existingTransaction.id },
            data: {
              amount: transactionAmount,
              date: date ? new Date(date) : new Date(),
              person: supplier,
              note: `Purchase: ${newMaterial?.name || "Raw Material"}`,
            },
          });
        } else {
          await tx.transactions.delete({ where: { id: existingTransaction.id } });
        }
      } else if (transactionAmount > 0) {
        await tx.transactions.create({
          data: {
            type: "purchase",
            amount: transactionAmount,
            date: date ? new Date(date) : new Date(),
            reference_id: id,
            person: supplier,
            note: `Purchase: ${newMaterial?.name || "Raw Material"}`,
          },
        });
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const receiving = await tx.receiving_materials.findUnique({
        where: { id },
      });

      if (!receiving) {
        throw new Error("Receiving not found");
      }

      await tx.receiving_materials.delete({
        where: { id },
      });

      const material = await tx.raw_materials.update({
        where: { id: receiving.raw_material_id },
        data: {
          quantity: { decrement: receiving.quantity },
        },
      });

      // Delete associated raw material log
      await tx.raw_material_logs.deleteMany({
        where: { reference_id: id },
      });

      // Delete associated transaction
      await tx.transactions.deleteMany({
        where: { reference_id: id },
      });

      return { success: true, material };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}