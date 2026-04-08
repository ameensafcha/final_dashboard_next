import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

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
