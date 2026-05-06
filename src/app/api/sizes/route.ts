import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sizeSchema, updateSizeSchema } from "@/lib/validations/size";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    const data = await prisma.sizes.findMany({
     
      orderBy: { size: "asc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return NextResponse.json({ error: "Failed to fetch sizes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = sizeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const data = await prisma.sizes.create({
      data: validation.data,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating size:", error);
    return NextResponse.json({ error: "Failed to create size" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = updateSizeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;
    const updated = await prisma.sizes.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating size:", error);
    return NextResponse.json({ error: "Failed to update size" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.sizes.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting size:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete size because it is in use by variants" }, 
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to delete size" }, { status: 500 });
  }
}
