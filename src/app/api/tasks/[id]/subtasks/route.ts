import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const { createServerClient } = await import("@supabase/ssr");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subtasks = await prisma.subtasks.findMany({
      where: { task_id: taskId },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ data: subtasks });
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify task exists and user has access
    const task = await prisma.tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Permission: admin, task creator, or assignee can add subtasks
    const isAdmin = currentEmployee.role?.name === "admin";
    const isCreator = task.created_by === user.id;
    const isAssignee = task.assignee_id === user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subtask = await prisma.subtasks.create({
      data: {
        task_id: taskId,
        title,
        is_completed: false,
      },
    });

    return NextResponse.json({ data: subtask }, { status: 201 });
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, is_completed } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    // Verify subtask exists
    const subtask = await prisma.subtasks.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task_id !== taskId) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Permission: admin, task creator, or assignee can update subtasks
    const isAdmin = currentEmployee.role?.name === "admin";
    const isCreator = subtask.task.created_by === user.id;
    const isAssignee = subtask.task.assignee_id === user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedSubtask = await prisma.subtasks.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(typeof is_completed === "boolean" && { is_completed }),
      },
    });

    return NextResponse.json({ data: updatedSubtask });
  } catch (error) {
    console.error("Error updating subtask:", error);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subtask ID is required" }, { status: 400 });
    }

    // Verify subtask exists
    const subtask = await prisma.subtasks.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask || subtask.task_id !== taskId) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Permission: admin or task creator can delete subtasks
    const isAdmin = currentEmployee.role?.name === "admin";
    const isCreator = subtask.task.created_by === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.subtasks.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 });
  }
}