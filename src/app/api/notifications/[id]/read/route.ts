import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { read } = await request.json();

    const notification = await prisma.notifications.findUnique({ where: { id } });
    if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (notification.recipient_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.notifications.update({
      where: { id },
      data: { read_at: read ? new Date() : null },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
