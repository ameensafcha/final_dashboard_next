import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function sanitizeInput(input: string | undefined): string | undefined {
  if (!input) return undefined;
  return input.trim().slice(0, 500);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search")?.toLowerCase() || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { product: { name: { contains: search, mode: "insensitive" as const } } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [variants, total] = await Promise.all([
      prisma.product_variants.findMany({
        where,
        include: {
          product: {
            include: {
              product_flavors: {
                include: { flavor: true },
              },
            },
          },
          flavor: true,
          size: true,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.product_variants.count({ where }),
    ]);

    return NextResponse.json({
      data: variants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { product_id, flavor_id, size_id, price, description } = body;

    if (!product_id || !flavor_id || !size_id) {
      return NextResponse.json({ error: "Product, Flavor and Size are required" }, { status: 400 });
    }

    product_id = String(product_id).trim();
    flavor_id = String(flavor_id).trim();
    size_id = String(size_id).trim();

    if (typeof price !== "undefined" && price !== "") {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
      price = parsedPrice;
    } else {
      price = 0;
    }

    description = sanitizeInput(description);

    const [product, flavor, size] = await Promise.all([
      prisma.products.findUnique({ where: { id: product_id } }),
      prisma.flavors.findUnique({ where: { id: flavor_id } }),
      prisma.sizes.findUnique({ where: { id: size_id } }),
    ]);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!flavor) {
      return NextResponse.json({ error: "Flavor not found" }, { status: 404 });
    }

    if (!size) {
      return NextResponse.json({ error: "Size not found" }, { status: 404 });
    }

    const existingVariant = await prisma.product_variants.findFirst({
      where: { product_id, flavor_id, size_id },
    });

    if (existingVariant) {
      return NextResponse.json(
        { error: "Variant already exists for this product, flavor and size combination" },
        { status: 400 }
      );
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

    const is_active = price > 0;

    const variant = await prisma.product_variants.create({
      data: {
        product_id,
        flavor_id,
        size_id,
        price,
        description,
        sku,
        is_active,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let { id, price, description, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "Variant ID is required" }, { status: 400 });
    }

    id = String(id).trim();

    if (typeof price !== "undefined" && price !== "") {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
      price = parsedPrice;
    }

    description = sanitizeInput(description);

    const existing = await prisma.product_variants.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    if (price !== undefined && price > 0 && !existing.is_active) {
      is_active = true;
    }

    const updated = await prisma.product_variants.update({
      where: { id },
      data: {
        ...(price !== undefined && { price }),
        description,
        is_active,
      },
      include: {
        product: true,
        flavor: true,
        size: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update variant" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Variant ID is required" }, { status: 400 });
    }

    const existing = await prisma.product_variants.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    await prisma.product_variants.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Variant deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete variant" }, { status: 500 });
  }
}
