import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const variants = await prisma.product_variants.findMany({
      include: {
        product: {
          include: {
            product_flavors: {
              include: {
                flavor: true,
              },
            },
          },
        },
        size: true,
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(variants);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, size_id, price, description } = body;

    if (!product_id || !size_id) {
      return NextResponse.json({ error: "Product and Size are required" }, { status: 400 });
    }

    const product = await prisma.products.findUnique({
      where: { id: product_id },
      include: {
        product_flavors: {
          include: { flavor: true },
        },
      },
    });

    const size = await prisma.sizes.findUnique({ where: { id: size_id } });

    if (!product || !size) {
      return NextResponse.json({ error: "Invalid product or size" }, { status: 400 });
    }

    const existingVariant = await prisma.product_variants.findFirst({
      where: { product_id, size_id },
    });

    if (existingVariant) {
      return NextResponse.json({ error: "Variant already exists for this product and size" }, { status: 400 });
    }

    const productPrefix = product.name.substring(0, 3).toUpperCase();
    const flavorCodes = product.product_flavors
      .map(pf => pf.flavor.short_code)
      .join("-");
    let sizeValue: string;
    if (size.unit === "kg") {
      sizeValue = String(parseFloat(size.size) * 1000);
    } else {
      sizeValue = size.size;
    }
    const sku = `${productPrefix}-${flavorCodes}-${sizeValue}`;

    const variant = await prisma.product_variants.create({
      data: {
        product_id,
        size_id,
        price: parseFloat(price) || 0,
        description,
        sku,
      },
      include: {
        product: {
          include: {
            product_flavors: {
              include: { flavor: true },
            },
          },
        },
        size: true,
      },
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, price, description, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updated = await prisma.product_variants.update({
      where: { id },
      data: {
        price: price !== undefined ? parseFloat(price) : undefined,
        description,
        is_active,
      },
      include: {
        product: {
          include: {
            product_flavors: {
              include: { flavor: true },
            },
          },
        },
        size: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.product_variants.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
