import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMeshSize } from "@/lib/sku";
import { createVariantSchema, updateVariantSchema } from "@/lib/validations/variant";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [variants, total, products, flavors, sizes] = await Promise.all([
      prisma.product_variants.findMany({
        include: {
          product: true,
          flavor: true,
          size: true,
          stock: true,
        },
        orderBy: { product: { name: "asc" } },
        skip,
        take: limit,
      }),
      prisma.product_variants.count(),
      prisma.products.findMany({ where: { is_active: true } }),
      prisma.flavors.findMany({ where: { is_active: true } }),
      prisma.sizes.findMany({ where: { is_active: true } }),
    ]);

    // console.log(variants)

    if (searchParams.has("page") || searchParams.has("limit")) {
      return NextResponse.json({
        data: variants,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    return NextResponse.json({ variants, products, flavors, sizes });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = createVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Strict Active Check: Verify all parent entities are active
    const [product, flavor, size] = await Promise.all([
      prisma.products.findUnique({ where: { id: data.product_id } }),
      prisma.flavors.findUnique({ where: { id: data.flavor_id } }),
      prisma.sizes.findUnique({ where: { id: data.size_id } }),
    ]);

    if (!product?.is_active || !flavor?.is_active || !size?.is_active) {
      return NextResponse.json(
        { error: "Cannot create variant because one or more selected entities (Product, Flavor, or Size) are inactive" },
        { status: 400 }
      );
    }

    // Check if the flavor is allowed for the product
    const allowedFlavor = await prisma.product_flavors.findUnique({
      where: {
        product_id_flavor_id: {
          product_id: data.product_id,
          flavor_id: data.flavor_id,
        },
      },
    });

    if (!allowedFlavor) {
      return NextResponse.json(
        { error: "This flavor is not allowed for the selected product" },
        { status: 400 }
      );
    }

    const variant = await prisma.product_variants.create({
      data: {
        ...data,
        mesh_size: getMeshSize(data.grade),
      },
      include: {
        product: true,
        flavor: true,
        size: true,
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    console.error("Error creating variant:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A variant with this SKU already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create variant" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = updateVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    const variant = await prisma.product_variants.update({
      where: { id },
      data: {
        ...data,
      },
      include: { product: true, flavor: true, size: true },
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json({ error: "Failed to update variant" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.product_variants.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json({ error: "Failed to delete variant" }, { status: 500 });
  }
}
