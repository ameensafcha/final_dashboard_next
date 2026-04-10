import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify user owns this notification
    const notification = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification || notification.recipient_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Mark as read
    const updated = await prisma.notifications.update({
      where: { id },
      data: { read_at: new Date() },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        recipient_id: updated.recipient_id,
        actor_id: updated.actor_id,
        action_type: updated.action_type,
        task_id: updated.task_id,
        task_title: updated.task_title,
        created_at: updated.created_at.toISOString(),
        read_at: updated.read_at?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("[API /notifications/[id]/read] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
