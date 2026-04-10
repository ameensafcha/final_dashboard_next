import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Build query based on role (D-06, D-08, D-09)
    // D-06: Users receive only notifications where recipient_id matches their user ID
    // D-08: Task managers receive notifications for tasks they created
    // D-09: Admins can see all notifications
    const isAdmin = user.role?.includes('admin');

    let whereClause: any = {};

    if (isAdmin) {
      // D-09: Admins see all notifications (no filter)
      whereClause = {};
    } else {
      // D-06: Non-admin users see their own notifications OR
      // D-08: Notifications for tasks they created
      whereClause = {
        OR: [
          { recipient_id: user.id }, // D-06: assigned to me
          { task: { created_by: user.id } }, // D-08: I created the task
        ],
      };
    }

    // Fetch last 50 notifications for the authenticated user
    const notifications = await prisma.notifications.findMany({
      where: whereClause,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // Transform to include actor_name for UI
    const transformed = notifications.map((n) => ({
      id: n.id,
      recipient_id: n.recipient_id,
      actor_id: n.actor_id,
      actor_name: n.actor.name,
      action_type: n.action_type,
      task_id: n.task_id,
      task_title: n.task_title,
      created_at: n.created_at.toISOString(),
      read_at: n.read_at?.toISOString() || null,
    }));

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("[API /notifications] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
