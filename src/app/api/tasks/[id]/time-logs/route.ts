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

    const timeLogs = await prisma.task_time_logs.findMany({
      where: { task_id: taskId },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: timeLogs });
  } catch (error) {
    console.error("Error fetching time logs:", error);
    return NextResponse.json({ error: "Failed to fetch time logs" }, { status: 500 });
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
    const { hours, notes } = await request.json();

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: "Valid hours are required" }, { status: 400 });
    }

    // Verify task exists
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const timeLog = await prisma.task_time_logs.create({
      data: {
        task_id: taskId,
        employee_id: user.id,
        hours,
        notes,
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ data: timeLog }, { status: 201 });
  } catch (error) {
    console.error("Error creating time log:", error);
    return NextResponse.json({ error: "Failed to create time log" }, { status: 500 });
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
      return NextResponse.json({ error: "Time log ID is required" }, { status: 400 });
    }

    // Verify time log exists
    const timeLog = await prisma.task_time_logs.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!timeLog || timeLog.task_id !== taskId) {
      return NextResponse.json({ error: "Time log not found" }, { status: 404 });
    }

    await prisma.task_time_logs.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time log:", error);
    return NextResponse.json({ error: "Failed to delete time log" }, { status: 500 });
  }
}
