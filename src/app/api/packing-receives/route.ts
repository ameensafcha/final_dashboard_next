import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [receives, variants] = await Promise.all([
      prisma.packing_receives.findMany({
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                  flavor: true,
                  size: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.product_variants.findMany({
        include: {
          product: true,
          flavor: true,
          size: true,
        },
        where: { is_active: true },
      }),
    ]);

    return NextResponse.json({ receives, variants });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch receives" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { third_party_name, notes, items } = await request.json();

    if (!third_party_name || !items || !items.length) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const receive = await tx.packing_receives.create({
        data: {
          third_party_name,
          notes,
        },
      });

      const receiveItems = await Promise.all(
        items.map(async (item: any) => {
          const receiveItem = await tx.packing_receive_items.create({
            data: {
              packing_receive_id: receive.id,
              variant_id: item.variant_id,
              quantity: parseInt(item.quantity),
            },
          });

          await tx.product_stock.upsert({
            where: { variant_id: item.variant_id },
            update: {
              quantity: { increment: parseInt(item.quantity) },
              updated_at: new Date(),
            },
            create: {
              variant_id: item.variant_id,
              quantity: parseInt(item.quantity),
            },
          });

          return receiveItem;
        })
      );

      return { ...receive, items: receiveItems };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create receive" }, { status: 500 });
  }
}
