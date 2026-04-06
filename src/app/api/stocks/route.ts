import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [rawMaterials, powderStock, variantInventory] = await Promise.all([
      prisma.raw_materials.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.powder_stock.findFirst(),
      prisma.variant_inventory.findMany({
        include: {
          variant: {
            include: {
              product: true,
              flavor: true,
              size: true,
            },
          },
        },
        orderBy: { quantity: "desc" },
      }),
    ]);

    const totalRawMaterialQty = rawMaterials.reduce((sum, rm) => sum + rm.quantity, 0);
    const totalVariantStock = variantInventory.reduce((sum, vi) => sum + vi.quantity, 0);

    if (!powderStock) {
      const finishedProducts = await prisma.finished_products.findMany();
      const totalFromBatches = finishedProducts.reduce((sum, fp) => sum + fp.quantity, 0);

      const packingLogs = await prisma.packing_logs.findMany();
      const totalSent = packingLogs.reduce((sum, log) => sum + log.total_kg, 0);

      const newPowderStock = await prisma.powder_stock.create({
        data: {
          total_from_batches: totalFromBatches,
          total_sent: totalSent,
          available: totalFromBatches - totalSent,
        },
      });

      return NextResponse.json({
        raw_materials: {
          items: rawMaterials,
          total_quantity: totalRawMaterialQty,
          item_count: rawMaterials.length,
        },
        powder: {
          received: newPowderStock.total_from_batches,
          sent: newPowderStock.total_sent,
          available: newPowderStock.available,
        },
        products: {
          items: variantInventory,
          total_stock: totalVariantStock,
          variant_count: variantInventory.length,
        },
      });
    }

    return NextResponse.json({
      raw_materials: {
        items: rawMaterials,
        total_quantity: totalRawMaterialQty,
        item_count: rawMaterials.length,
      },
      powder: {
        received: powderStock.total_from_batches,
        sent: powderStock.total_sent,
        available: powderStock.available,
      },
      products: {
        items: variantInventory,
        total_stock: totalVariantStock,
        variant_count: variantInventory.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 });
  }
}
