import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { flavorSchema, updateFlavorSchema } from "@/lib/validations/flavor";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    const data = await prisma.flavors.findMany({
     
      orderBy: { name: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching flavors:", error);
    return NextResponse.json({ error: "Failed to fetch flavors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = flavorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = await prisma.flavors.create({
      data: validation.data,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Error creating flavor:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A flavor with this short code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create flavor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = updateFlavorSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;
    const updated = await prisma.flavors.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating flavor:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A flavor with this short code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update flavor" }, { status: 500 });
  }
}

// api/flavors/route.ts → DELETE
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // ✅ Check relations BEFORE attempting delete
    const linked = await prisma.product_flavors.findMany({
      where: { flavor_id: id },
      select: { product: { select: { id: true, name: true,} } }
    });

    const linkedProducts = linked.map(l => l.product);
    if (linkedProducts.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete flavor because it is in use by products",
        linkedProducts 
      }, { status: 400 });
    }

    await prisma.flavors.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting flavor:", error);
    return NextResponse.json({ error: "Failed to delete flavor" }, { status: 500 });
  }
}