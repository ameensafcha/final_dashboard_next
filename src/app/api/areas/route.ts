import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";
const areaSchema = z.object({
  name: z.string().min(1, "Name required").max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color").default("#6366f1"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
});
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const areas = await prisma.area.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: areas });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const validatedData = areaSchema.parse(body);
    const area = await prisma.area.create({ data: validatedData });
    return NextResponse.json({ data: area }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: "Area already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create area" }, { status: 500 });
  }
}