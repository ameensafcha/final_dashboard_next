import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const inventory = await prisma.variant_inventory.findMany({
      include: {
        variant: {
          include: {
            product: true,
            flavor: true,
            size: true,
          },
        },
      },
      orderBy: { quantity: "desc" },
    });
    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Error fetching variant inventory:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
