import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    // Read from ORIGINAL tables
    const [rawMaterials, productStock, finishedProducts, packingLogs] = await Promise.all([
      // Original table - raw_materials
      prisma.raw_materials.findMany({
        orderBy: { name: "asc" },
      }),
      // New table - product_stock (for products)
      prisma.product_stock.findMany({
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
      }).catch(() => []),
      // Original tables for powder calculation
      prisma.finished_products.findMany(),
      prisma.packing_logs.findMany(),
    ]);

    const totalRawMaterialQty = rawMaterials.reduce((sum, rm) => sum + (rm.quantity || 0), 0);
    const totalVariantStock = productStock.reduce((sum, ps) => sum + (ps.quantity || 0), 0);

    // Calculate powder from source tables (original)
    const received = finishedProducts.reduce((sum, fp) => sum + (fp.quantity || 0), 0);
    const sent = packingLogs.reduce((sum, log) => sum + (log.total_kg || 0), 0);
    const available = received - sent;

    return NextResponse.json({
      raw_materials: {
        items: rawMaterials.map(rm => ({
          ...rm,
          id: typeof rm.id === 'string' ? parseInt(rm.id) || rm.id : rm.id,
        })),
        total_quantity: totalRawMaterialQty,
        item_count: rawMaterials.length,
      },
      powder: {
        received,
        sent,
        available,
      },
      products: {
        items: productStock,
        total_stock: totalVariantStock,
        variant_count: productStock.length,
      },
    });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 });
  }
}