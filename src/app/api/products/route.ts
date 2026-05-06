import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { productSchema, updateProductSchema } from "@/lib/validations/product";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const products = await prisma.products.findMany({
      include: { 
        product_flavors: { include: { flavor: true } },
        variants: {
          include: {
            flavor: true,
            size: true,
            inventory: true,
            stock: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    // Calculate variants_count and total stock for each product
    const productsWithData = products.map(p => ({
      ...p,
      variants_count: {
        active: p.variants.filter(v => v.is_active).length,
        inactive: p.variants.filter(v => !v.is_active).length,
        total: p.variants.length,
      }
    }));

    return NextResponse.json(productsWithData);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = productSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, description, flavor_ids, is_active } = validation.data;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.products.create({ 
        data: { name, description, is_active: is_active ?? true } 
      });
      
      if (flavor_ids && flavor_ids.length > 0) {
        await tx.product_flavors.createMany({
          data: flavor_ids.map((fId: string) => ({ product_id: p.id, flavor_id: fId })),
        });
      }
      
      return tx.products.findUnique({
        where: { id: p.id },
        include: { 
          product_flavors: { include: { flavor: true } },
          variants: { include: { flavor: true, size: true, inventory: true, stock: true } }
        },
      });
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = updateProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, name, description, flavor_ids, is_active } = validation.data;

    const product = await prisma.$transaction(async (tx) => {
      await tx.products.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(is_active !== undefined && { is_active }),
        },
      });

      // Cascading Deactivation: If product is deactivated, deactivate all its variants
      if (is_active === false) {
        await tx.product_variants.updateMany({
          where: { product_id: id },
          data: { is_active: false },
        });
      }

      // Fix: Check if flavor_ids is defined to handle clearing (empty array)
      if (flavor_ids !== undefined) {
        // Find flavors being removed
        const currentFlavors = await tx.product_flavors.findMany({
          where: { product_id: id },
          select: { flavor_id: true },
        });
        const currentIds = currentFlavors.map((f) => f.flavor_id);
        const removedIds = currentIds.filter((cid) => !flavor_ids.includes(cid));

        await tx.product_flavors.deleteMany({ where: { product_id: id } });
        
        if (flavor_ids.length > 0) {
          await tx.product_flavors.createMany({
            data: flavor_ids.map((fId: string) => ({ product_id: id, flavor_id: fId })),
          });
        }

        // Deactivate variants whose flavors were removed
        if (removedIds.length > 0) {
          await tx.product_variants.updateMany({
            where: {
              product_id: id,
              flavor_id: { in: removedIds },
            },
            data: { is_active: false },
          });
        }
      }

      return tx.products.findUnique({
        where: { id },
        include: { 
          product_flavors: { include: { flavor: true } },
          variants: { include: { flavor: true, size: true, inventory: true, stock: true } }
        },
      });
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.products.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete product because it is in use by variants or batches" }, 
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
