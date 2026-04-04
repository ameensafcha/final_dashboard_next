import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.products.findMany({
      include: {
        product_flavors: {
          include: {
            flavor: {
              include: {
                ingredients: {
                  include: {
                    raw_material: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
          create: flavor_ids.map((flavorId: string, index: number) => ({
            flavor_id: flavorId,
            is_primary: index === 0,
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
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
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
        data: flavor_ids.map((flavorId: string, index: number) => ({
          product_id: id,
          flavor_id: flavorId,
          is_primary: index === 0,
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

    await prisma.products.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
