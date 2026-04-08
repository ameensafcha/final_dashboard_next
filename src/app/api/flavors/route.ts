import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const flavors = await prisma.flavors.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(flavors);
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
    const { name, short_code, ingredients } = body;

    const newFlavor = await prisma.flavors.create({
      data: {
        name,
        short_code: short_code || "XX",
        ingredients: ingredients || null,
        is_active: true,
      },
    });

    return NextResponse.json(newFlavor);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const body = await request.json();
    const { id, name, short_code, ingredients, is_active } = body;

    const updated = await prisma.flavors.update({
      where: { id },
      data: { name, short_code, ingredients, is_active },
    });

    return NextResponse.json(updated);
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
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
