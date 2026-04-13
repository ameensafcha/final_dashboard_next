import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StocksTable } from "@/components/stocks-table";

export const dynamic = 'force-dynamic';

export default async function StocksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Read from ORIGINAL table for raw_materials
  const rawMaterials = await prisma.raw_materials.findMany({
    orderBy: { name: "asc" },
  });

  // NEW table for products
  let productStock: any[] = [];
  try {
    productStock = await prisma.product_stock.findMany({
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
    });
  } catch {
    // Fallback to old table
    const variantInventory = await prisma.variant_inventory.findMany({
      include: {
        variant: {
          include: {
            product: true,
            flavor: true,
            size: true,
          },
        },
      },
    });
    productStock = variantInventory.map(vi => ({
      variant_id: vi.variant_id,
      quantity: vi.quantity || 0,
      variant: vi.variant,
    }));
  }

  // Calculate powder from ORIGINAL tables
  const finishedProducts = await prisma.finished_products.findMany();
  const packingLogs = await prisma.packing_logs.findMany();

  const received = finishedProducts.reduce((sum, fp) => sum + (fp.quantity || 0), 0);
  const sent = packingLogs.reduce((sum, log) => sum + (log.total_kg || 0), 0);
  const available = received - sent;

  const totalRawMaterialQty = rawMaterials.reduce((sum, rm) => sum + (rm.quantity || 0), 0);
  const totalVariantStock = productStock.reduce((sum, ps) => sum + (ps.quantity || 0), 0);

  const initialData = {
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
      items: productStock.map(ps => ({
        ...ps,
        quantity: ps.quantity || 0,
      })),
      total_stock: totalVariantStock,
      variant_count: productStock.length,
    },
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#1A1A1A" }}>Stocks</h1>
      <StocksTable initialData={initialData} />
    </div>
  );
}
