import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const products = await prisma.products.findMany({
      include: { product_flavors: { include: { flavor: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description, flavors } = await request.json();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.products.create({ data: { name, description, is_active: true } });
      if (flavors && Array.isArray(flavors)) {
        await tx.product_flavors.createMany({
          data: flavors.map((fId: string) => ({ product_id: p.id, flavor_id: fId })),
        });
      }
      return tx.products.findUnique({
        where: { id: p.id },
        include: { product_flavors: { include: { flavor: true } } },
      });
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
