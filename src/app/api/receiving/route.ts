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
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { raw_material_id, quantity, rate, supplier, date, notes } = body;

    const result = await prisma.$transaction(async (tx) => {
      const currentMaterial = await tx.raw_materials.findUnique({
        where: { id: parseInt(raw_material_id) },
      });

      let newPricePerKg = currentMaterial?.price_per_kg || null;

      if (rate && currentMaterial) {
        const oldQty = currentMaterial.quantity || 0;
        const oldPrice = currentMaterial.price_per_kg || 0;
        const newQty = parseInt(quantity);
        const newRate = parseFloat(rate);

        if (oldQty + newQty > 0) {
          newPricePerKg = ((oldPrice * oldQty) + (newRate * newQty)) / (oldQty + newQty);
        }
      }

      const receiving = await tx.receiving_materials.create({
        data: {
          raw_material_id: parseInt(raw_material_id),
          quantity: parseInt(quantity),
          rate: rate ? parseFloat(rate) : null,
          supplier,
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
        },
      });

      const updatedMaterial = await tx.raw_materials.update({
        where: { id: parseInt(raw_material_id) },
        data: {
          quantity: { increment: parseInt(quantity) },
          ...(newPricePerKg !== null && { price_per_kg: newPricePerKg }),
        },
      });

      return { receiving, material: updatedMaterial };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
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

      const qtyDiff = parseInt(quantity) - oldReceiving.quantity;
      const oldRawMaterialId = oldReceiving.raw_material_id;

      await tx.receiving_materials.update({
        where: { id },
        data: {
          raw_material_id: parseInt(raw_material_id),
          quantity: parseInt(quantity),
          rate: rate ? parseFloat(rate) : null,
          supplier,
          date: date ? new Date(date) : new Date(),
          notes: notes || null,
        },
      });

      if (oldRawMaterialId !== parseInt(raw_material_id)) {
        await tx.raw_materials.update({
          where: { id: oldRawMaterialId },
          data: { quantity: { decrement: oldReceiving.quantity } },
        });

        const newMaterial = await tx.raw_materials.findUnique({
          where: { id: parseInt(raw_material_id) },
        });

        let newPricePerKg = newMaterial?.price_per_kg || null;
        if (rate && newMaterial) {
          const oldQty = newMaterial.quantity || 0;
          const oldPrice = newMaterial.price_per_kg || 0;
          const newQty = parseInt(quantity);
          const newRate = parseFloat(rate);
          if (oldQty + newQty > 0) {
            newPricePerKg = ((oldPrice * oldQty) + (newRate * newQty)) / (oldQty + newQty);
          }
        }

        await tx.raw_materials.update({
          where: { id: parseInt(raw_material_id) },
          data: {
            quantity: { increment: parseInt(quantity) },
            ...(newPricePerKg !== null && { price_per_kg: newPricePerKg }),
          },
        });
      } else {
        const updatedMaterial = await tx.raw_materials.findUnique({
          where: { id: parseInt(raw_material_id) },
        });

        let newPricePerKg = updatedMaterial?.price_per_kg || null;
        if (rate && updatedMaterial) {
          const oldQty = (updatedMaterial.quantity || 0) - qtyDiff;
          const oldPrice = oldMaterial?.price_per_kg || 0;
          const newQty = parseInt(quantity);
          const newRate = parseFloat(rate);
          
          const totalQty = updatedMaterial.quantity || 0;
          const totalValue = (oldPrice * oldQty) + (newRate * newQty);
          if (totalQty > 0) {
            newPricePerKg = totalValue / totalQty;
          }
        }

        await tx.raw_materials.update({
          where: { id: parseInt(raw_material_id) },
          data: {
            quantity: { increment: qtyDiff },
            ...(newPricePerKg !== null && { price_per_kg: newPricePerKg }),
          },
        });
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
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

      return { success: true, material };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}