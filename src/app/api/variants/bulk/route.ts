import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, flavor_ids, size_ids } = body;

    if (!product_id || !flavor_ids || !size_ids || !Array.isArray(flavor_ids) || !Array.isArray(size_ids)) {
      return NextResponse.json({ error: "Product, flavors and sizes are required" }, { status: 400 });
    }

    if (flavor_ids.length === 0 || size_ids.length === 0) {
      return NextResponse.json({ error: "At least one flavor and one size required" }, { status: 400 });
    }

    const product = await prisma.products.findUnique({
      where: { id: product_id },
      include: { product_flavors: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const [flavors, sizes] = await Promise.all([
      prisma.flavors.findMany({ where: { id: { in: flavor_ids } } }),
      prisma.sizes.findMany({ where: { id: { in: size_ids } } }),
    ]);

    if (flavors.length !== flavor_ids.length || sizes.length !== size_ids.length) {
      return NextResponse.json({ error: "Invalid flavors or sizes" }, { status: 400 });
    }

    const variantsToCreate: {
      product_id: string;
      flavor_id: string;
      size_id: string;
      price: number;
      sku: string;
      is_active: boolean;
    }[] = [];

    for (const flavor of flavors) {
      for (const size of sizes) {
        const existingVariant = await prisma.product_variants.findFirst({
          where: { product_id, flavor_id: flavor.id, size_id: size.id },
        });

        if (existingVariant) {
          continue;
        }

        const productPrefix = product.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
        const flavorCode = flavor.short_code || "XX";
        let sizeValue: string;
        if (size.unit === "kg") {
          sizeValue = String(parseFloat(size.size) * 1000);
        } else {
          sizeValue = size.size.replace(/[^0-9]/g, "");
        }
        const sku = `${productPrefix}-${flavorCode}-${sizeValue}`;

        variantsToCreate.push({
          product_id,
          flavor_id: flavor.id,
          size_id: size.id,
          price: 0,
          sku,
          is_active: false,
        });
      }
    }

    if (variantsToCreate.length === 0) {
      return NextResponse.json({ error: "All variants already exist" }, { status: 400 });
    }

    const created = await prisma.product_variants.createMany({
      data: variantsToCreate,
    });

    return NextResponse.json({
      success: true,
      message: `${created.count} variants generated successfully`,
      count: created.count,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate variants" }, { status: 500 });
  }
}
