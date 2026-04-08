import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get("product_id");

    if (!product_id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await prisma.products.findUnique({
      where: { id: product_id },
      include: {
        product_flavors: {
          include: { flavor: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const sizes = await prisma.sizes.findMany({
      where: { is_active: true },
      orderBy: { size: "asc" },
    });

    const existingVariants = await prisma.product_variants.findMany({
      where: { product_id },
      select: { flavor_id: true, size_id: true },
    });

    const generatedMap = new Set(
      existingVariants.map(v => `${v.flavor_id}-${v.size_id}`)
    );

    const flavorsWithStatus = product.product_flavors.map(pf => ({
      id: pf.flavor.id,
      name: pf.flavor.name,
      is_generated: existingVariants.some(v => v.flavor_id === pf.flavor.id),
    }));

    const sizesWithStatus = sizes.map(s => ({
      id: s.id,
      size: s.size,
      unit: s.unit,
      pack_type: s.pack_type,
      is_generated: existingVariants.some(v => v.size_id === s.id),
    }));

    const alreadyGenerated = existingVariants.length;
    const totalPossible = product.product_flavors.length * sizes.length;
    const canGenerate = totalPossible - alreadyGenerated;

    return NextResponse.json({
      product_id,
      product_name: product.name,
      flavors: flavorsWithStatus,
      sizes: sizesWithStatus,
      stats: {
        already_generated: alreadyGenerated,
        can_generate: canGenerate,
        total_possible: totalPossible,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch available variants" }, { status: 500 });
  }
}
