import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const flavors = await prisma.flavors.findMany({
      include: {
        ingredients: {
          include: {
            raw_material: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(flavors);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, short_code, ingredient_ids } = body;

    const newFlavor = await prisma.flavors.create({
      data: {
        name,
        short_code: short_code || "XX",
        is_active: true,
        ingredients: ingredient_ids && ingredient_ids.length > 0
          ? {
              create: ingredient_ids.map((rmId: number) => ({
                raw_material_id: rmId,
              })),
            }
          : undefined,
      },
      include: {
        ingredients: {
          include: {
            raw_material: true,
          },
        },
      },
    });

    return NextResponse.json(newFlavor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, short_code, is_active, ingredient_ids } = body;

    await prisma.flavor_ingredients.deleteMany({
      where: { flavor_id: id },
    });

    if (ingredient_ids && ingredient_ids.length > 0) {
      await prisma.flavor_ingredients.createMany({
        data: ingredient_ids.map((rmId: number) => ({
          flavor_id: id,
          raw_material_id: rmId,
        })),
      });
    }

    const updated = await prisma.flavors.update({
      where: { id },
      data: { name, short_code, is_active },
      include: {
        ingredients: {
          include: {
            raw_material: true,
          },
        },
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

    const linkedProducts = await prisma.product_flavors.findMany({
      where: { flavor_id: id },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });

    if (linkedProducts.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete flavor - ${linkedProducts.length} product(s) are linked to this flavor`,
          linkedProducts: linkedProducts.map(p => p.product)
        },
        { status: 400 }
      );
    }

    await prisma.flavors.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
