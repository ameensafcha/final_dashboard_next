import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");
    // Initialize raw_material_stock
    const rawMaterials = await prisma.raw_materials.findMany();
    
    for (const rm of rawMaterials) {
      await prisma.raw_material_stock.upsert({
        where: { id: rm.id },
        update: { 
          name: rm.name,
          quantity: rm.quantity,
          unit: rm.unit,
          price_per_kg: rm.price_per_kg,
          updated_at: new Date()
        },
        create: {
          id: rm.id,
          name: rm.name,
          quantity: rm.quantity,
          unit: rm.unit,
          price_per_kg: rm.price_per_kg,
        }
      });
    }

    // Initialize product_stock
    const variantInventory = await prisma.variant_inventory.findMany();
    
    for (const vi of variantInventory) {
      await prisma.product_stock.upsert({
        where: { variant_id: vi.variant_id },
        update: { 
          quantity: vi.quantity || 0,
          updated_at: new Date()
        },
        create: {
          variant_id: vi.variant_id,
          quantity: vi.quantity || 0,
        }
      });
    }

    // Initialize powder_stock (consolidated model)
    const finishedProducts = await prisma.finished_products.findMany();
    const packingLogs = await prisma.packing_logs.findMany();
    
    const received = finishedProducts.reduce((sum, fp) => sum + fp.quantity, 0);
    const sent = packingLogs.reduce((sum, log) => sum + log.total_kg, 0);
    const available = received - sent;

    await prisma.powder_stock.upsert({
      where: { id: 1 },
      update: { received, sent, total_from_batches: received, total_sent: sent, available, updated_at: new Date() },
      create: { id: 1, received, sent, total_from_batches: received, total_sent: sent, available }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Stock tables initialized",
      stats: {
        rawMaterials: rawMaterials.length,
        productVariants: variantInventory.length,
        powder: { received, sent, available }
      }
    });
  } catch (error) {
    console.error("Error initializing stock tables:", error);
    return NextResponse.json({ error: "Failed to initialize stocks" }, { status: 500 });
  }
}