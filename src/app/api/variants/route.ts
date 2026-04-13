import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [variants, products, flavors, sizes] = await Promise.all([
      prisma.product_variants.findMany({
        include: {
          product: true,
          flavor: true,
          size: true,
          stock: true,
        },
        orderBy: { product: { name: "asc" } },
      }),
      prisma.products.findMany({ where: { is_active: true } }),
      prisma.flavors.findMany({ where: { is_active: true } }),
      prisma.sizes.findMany({ where: { is_active: true } }),
    ]);

    return NextResponse.json({ variants, products, flavors, sizes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { product_id, size_id, flavor_id, sku, price, is_active, description } = await request.json();

    if (!product_id || !size_id || !flavor_id || !sku) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const variant = await prisma.product_variants.create({
      data: {
        product_id,
        size_id,
        flavor_id,
        sku,
        price: parseFloat(price) || 0,
        is_active: is_active ?? true,
        description,
      },
      include: {
        product: true,
        flavor: true,
        size: true,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
  }
}
