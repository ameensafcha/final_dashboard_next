import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { variants } = await request.json();

    if (!variants || !Array.isArray(variants)) {
      return NextResponse.json({ error: "Invalid variants data" }, { status: 400 });
    }

    const results = await prisma.$transaction(
      variants.map((v: any) =>
        prisma.product_variants.upsert({
          where: { sku: v.sku },
          update: {
            price: parseFloat(v.price) || 0,
            is_active: v.is_active ?? true,
          },
          create: {
            product_id: v.product_id,
            size_id: v.size_id,
            flavor_id: v.flavor_id,
            sku: v.sku,
            price: parseFloat(v.price) || 0,
            is_active: v.is_active ?? true,
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process bulk variants" }, { status: 500 });
  }
}
