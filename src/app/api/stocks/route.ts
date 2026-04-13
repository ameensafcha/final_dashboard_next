import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [rawMaterials, finishedProducts, productStock, packingReceiveItems] = await Promise.all([
      prisma.raw_materials.findMany(),
      prisma.finished_products.findMany(),
      prisma.product_stock.findMany({ include: { variant: { include: { product: true, flavor: true, size: true } } } }),
      prisma.packing_receive_items.findMany({ include: { variant: { include: { product: true, flavor: true, size: true } } } }),
    ]);

    const powderStock = await prisma.powder_stock.findFirst();

    return NextResponse.json({
      raw_materials: {
        items: rawMaterials,
        total_quantity: rawMaterials.reduce((sum, item) => sum + item.quantity, 0),
        item_count: rawMaterials.length,
      },
      powder: powderStock || { received: 0, sent: 0, available: 0 },
      products: {
        items: productStock,
        total_stock: productStock.reduce((sum, item) => sum + item.quantity, 0),
        variant_count: productStock.length,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stocks" }, { status: 500 });
  }
}
