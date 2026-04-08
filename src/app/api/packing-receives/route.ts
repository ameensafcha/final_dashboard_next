import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const receives = await prisma.packing_receives.findMany({
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
    });
    return NextResponse.json(receives);
  } catch (error) {
    console.error("Error fetching packing receives:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const body = await req.json();
    const { third_party_name, notes, items } = body;

    // Validation
    if (!third_party_name || typeof third_party_name !== "string" || third_party_name.trim().length === 0) {
      return NextResponse.json({ error: "Third party name is required" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.variant_id || typeof item.variant_id !== "string") {
        return NextResponse.json({ error: `Item ${i + 1}: variant_id is required` }, { status: 400 });
      }
      if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1) {
        return NextResponse.json({ error: `Item ${i + 1}: quantity must be at least 1` }, { status: 400 });
      }
    }

    // Create receive record and items in transaction
    const result = await prisma.$transaction(async (tx) => {
      const receive = await tx.packing_receives.create({
        data: {
          third_party_name,
          notes: notes || null,
        },
      });

      for (const item of items) {
        // Create receive item
        await tx.packing_receive_items.create({
          data: {
            packing_receive_id: receive.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          },
        });

        // Update variant inventory
        const existingInventory = await tx.variant_inventory.findUnique({
          where: { variant_id: item.variant_id },
        });

        if (existingInventory) {
          await tx.variant_inventory.update({
            where: { variant_id: item.variant_id },
            data: {
              quantity: { increment: item.quantity },
              updated_at: new Date(),
            },
          });
        } else {
          await tx.variant_inventory.create({
            data: {
              variant_id: item.variant_id,
              quantity: item.quantity,
            },
          });
        }
      }

      return receive;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating packing receive:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
