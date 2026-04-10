import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mark all unread notifications as read for the current user
    await prisma.notifications.updateMany({
      where: {
        recipient_id: user.id,
        read_at: null,
      },
      data: { read_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /notifications/mark-all-read] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
