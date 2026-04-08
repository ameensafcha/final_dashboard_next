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

    const finishedProducts = await prisma.finished_products.findMany({
      include: {
        flavor: true,
      },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(finishedProducts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch finished products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const body = await request.json();
    const { flavor_id, quantity, batch_reference } = body;

    if (!flavor_id || !quantity) {
      return NextResponse.json({ error: "flavor_id and quantity are required" }, { status: 400 });
    }

    const finishedProduct = await prisma.finished_products.create({
      data: {
        flavor_id,
        quantity: parseFloat(quantity),
        batch_reference,
      },
      include: {
        flavor: true,
      },
    });

    return NextResponse.json(finishedProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create finished product" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return authResponse("Unauthorized");

    const body = await request.json();
    const { id, quantity } = body;

    if (!id || quantity === undefined) {
      return NextResponse.json({ error: "id and quantity are required" }, { status: 400 });
    }

    const existing = await prisma.finished_products.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Finished product not found" }, { status: 404 });
    }

    const updated = await prisma.finished_products.update({
      where: { id },
      data: {
        quantity: parseFloat(quantity),
      },
      include: {
        flavor: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update finished product" }, { status: 500 });
  }
}
