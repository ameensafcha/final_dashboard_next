import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // This is a one-time utility to ensure initial stock records exist for all variants
    const variants = await prisma.product_variants.findMany();
    
    const results = await Promise.all(
      variants.map(async (v) => {
        return prisma.product_stock.upsert({
          where: { variant_id: v.id },
          update: {},
          create: {
            variant_id: v.id,
            quantity: 0,
          },
        });
      })
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: "Initialization failed" }, { status: 500 });
  }
}
