import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { bulkVariantSchema } from "@/lib/validations/variant";
import { getMeshSize } from "@/lib/sku";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = bulkVariantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { variants } = validation.data;

    // Validate all flavor relationships before starting the transaction
    const flavorChecks = await Promise.all(
      variants.map((v: any) =>
        prisma.product_flavors.findUnique({
          where: {
            product_id_flavor_id: {
              product_id: v.product_id,
              flavor_id: v.flavor_id,
            },
          },
        })
      )
    );

    if (flavorChecks.some((check) => !check)) {
      return NextResponse.json(
        { error: "One or more variants have flavors not allowed for their product" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      variants.map((v: any) =>
        prisma.product_variants.upsert({
          where: { sku: v.sku },
          update: {
            price: v.price,
            is_active: v.is_active,
          },
          create: {
            product_id: v.product_id,
            size_id: v.size_id,
            flavor_id: v.flavor_id,
            sku: v.sku,
            price: v.price,
            is_active: v.is_active,
            grade: v.grade,
            mesh_size: getMeshSize(v.grade),
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Error processing bulk variants:", error);
    return NextResponse.json({ error: "Failed to process bulk variants" }, { status: 500 });
  }
}
