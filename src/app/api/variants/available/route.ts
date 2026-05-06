import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const grade = searchParams.get("grade") || "STD";

    if (!productId) {
      return NextResponse.json(
        { error: "product_id query parameter is required" },
        { status: 400 }
      );
    }

    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        product_flavors: { include: { flavor: true } },
        variants: { where: { grade } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const productFlavors = product.product_flavors.map((pf) => pf.flavor);
    const activeSizes = await prisma.sizes.findMany({ where: { is_active: true } });
    const existingVariants = product.variants.filter((v) => v.is_active);

    const already_generated = existingVariants.length;
    const totalPossibleCombinations = productFlavors.length * activeSizes.length;
    const can_generate = Math.max(0, totalPossibleCombinations - already_generated);

    const flavors = productFlavors.map((flavor: { id: string; name: string; short_code: string }) => {
      const flavorVariantCount = existingVariants.filter((v) => v.flavor_id === flavor.id).length;
      return {
        id: flavor.id,
        name: flavor.name,
        short_code: flavor.short_code,
        is_generated: activeSizes.length > 0 && flavorVariantCount === activeSizes.length,
      };
    });

    const sizes = activeSizes.map((size) => {
      const sizeVariantCount = existingVariants.filter((v) => v.size_id === size.id).length;
      return {
        id: size.id,
        size: size.size,
        unit: size.unit,
        pack_type: size.pack_type,
        is_generated: productFlavors.length > 0 && sizeVariantCount === productFlavors.length,
      };
    });

    return NextResponse.json({
      stats: { already_generated, can_generate },
      flavors,
      sizes,
    });
  } catch (error) {
    console.error("Error in /api/variants/available:", error);
    return NextResponse.json(
      { error: "Failed to fetch available variants" },
      { status: 500 }
    );
  }
}
