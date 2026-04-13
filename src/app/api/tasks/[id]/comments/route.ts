import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;

    const comments = await prisma.task_comments.findMany({
      where: { task_id: taskId },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify task exists and get creator/assignee for notifications
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
      include: { creator: true, assignee: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Use transaction to ensure atomicity: both comment creation and notification creation succeed or both fail
    const comment = await prisma.$transaction(async (tx) => {
      // Create comment
      const newComment = await tx.task_comments.create({
        data: {
          task_id: taskId,
          employee_id: user.id,
          content,
        },
        include: {
          employee: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Determine notification recipients (task creator and assignee, excluding commenter)
      const notificationRecipients = new Set<string>();

      if (task.created_by !== user.id) {
        notificationRecipients.add(task.created_by);
      }

      if (task.assignee_id && task.assignee_id !== user.id) {
        notificationRecipients.add(task.assignee_id);
      }

      // Create notifications for all recipients
      await Promise.all(
        Array.from(notificationRecipients).map((recipientId) =>
          tx.notifications.create({
            data: {
              recipient_id: recipientId,
              actor_id: user.id,
              action_type: "comment_posted",
              task_id: taskId,
              task_title: task.title,
            },
          })
        )
      );

      return newComment;
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    // Verify comment exists
    const comment = await prisma.task_comments.findUnique({
      where: { id },
    });

    if (!comment || comment.task_id !== taskId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.task_comments.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
