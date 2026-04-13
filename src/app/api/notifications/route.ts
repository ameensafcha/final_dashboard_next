import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notifications.findMany({
      where: { recipient_id: user.id },
      include: {
        actor: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const transformed = notifications.map((n) => ({
      id: n.id,
      recipient_id: n.recipient_id,
      actor_id: n.actor_id,
      actor_name: n.actor?.name || "Someone",
      action_type: n.action_type,
      task_id: n.task_id,
      task_title: n.task_title,
      created_at: n.created_at,
      read_at: n.read_at,
    }));

    return NextResponse.json({ data: transformed });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
