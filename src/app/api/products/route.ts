import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }
    const products = await prisma.products.findMany({
      include: {
        product_flavors: {
          include: {
            flavor: true,
          },
        },
        variants: {
          include: {
            flavor: true,
            size: true,
          },
          orderBy: [
            { flavor: { name: 'asc' } },
            { size: { size: 'asc' } }
          ],
        },
      },
      orderBy: { created_at: "desc" },
    });

    const productsWithCounts = products.map(product => {
      const activeCount = product.variants.filter((v: any) => v.is_active).length;
      const inactiveCount = product.variants.filter((v: any) => !v.is_active).length;
      return {
        ...product,
        variants_count: {
          active: activeCount,
          inactive: inactiveCount,
          total: product.variants.length,
        },
      };
    });

    return NextResponse.json(productsWithCounts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const body = await request.json();
    const { name, description, flavor_ids, is_active } = body;

    if (!name || !flavor_ids || !Array.isArray(flavor_ids) || flavor_ids.length === 0) {
      return NextResponse.json({ error: "Name and at least one flavor are required" }, { status: 400 });
    }

    const createdProduct = await prisma.products.create({
      data: {
        name,
        description,
        is_active: is_active ?? true,
        product_flavors: {
          create: flavor_ids.map((flavorId: string) => ({
            flavor_id: flavorId,
          })),
        },
      },
      include: {
        product_flavors: {
          include: {
            flavor: true,
          },
        },
      },
    });

    return NextResponse.json(createdProduct);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const body = await request.json();
    const { id, name, description, flavor_ids, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (flavor_ids && Array.isArray(flavor_ids)) {
      await prisma.product_flavors.deleteMany({
        where: { product_id: id },
      });

      await prisma.product_flavors.createMany({
        data: flavor_ids.map((flavorId: string) => ({
          product_id: id,
          flavor_id: flavorId,
        })),
      });
    }

    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        name,
        description,
        is_active,
      },
      include: {
        product_flavors: {
          include: {
            flavor: true,
          },
        },
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.products.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
