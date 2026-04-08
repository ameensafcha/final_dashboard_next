import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const materials = await prisma.raw_materials.findMany();
    return NextResponse.json(materials);
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
    const { name, quantity, unit, price_per_kg } = body;

    const material = await prisma.raw_materials.create({
      data: {
        name,
        quantity: parseFloat(quantity),
        unit: unit || "kg",
        price_per_kg: price_per_kg ? parseFloat(price_per_kg) : null,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const body = await request.json();
    const { id, name, quantity, unit, price_per_kg } = body;

    const material = await prisma.raw_materials.update({
      where: { id },
      data: {
        name,
        quantity: parseFloat(quantity),
        unit,
        price_per_kg: price_per_kg ? parseFloat(price_per_kg) : null,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await prisma.raw_materials.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
