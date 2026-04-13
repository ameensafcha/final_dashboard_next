import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const variants = await prisma.product_variants.findMany({
      where: {
        is_active: true,
      },
      include: {
        product: true,
        flavor: true,
        size: true,
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(variants);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}
