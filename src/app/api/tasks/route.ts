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

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignee_id = searchParams.get("assignee_id");
    const created_by = searchParams.get("created_by");
    const search = searchParams.get("search");

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const where: any = {};

    // Role-based filtering
    if (currentEmployee.role?.name !== "admin") {
      // Non-admin users can only see their tasks (created or assigned)
      where.OR = [
        { created_by: user.id },
        { assignee_id: user.id },
      ];
    }

    // Apply filters
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (assignee_id) {
      where.assignee_id = assignee_id;
    }
    if (created_by) {
      where.created_by = created_by;
    }
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.tasks.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        subtasks: true,
        _count: {
          select: { comments: true, time_logs: true },
        },
      },
      orderBy: [
        { priority: "desc" },
        { created_at: "desc" },
      ],
    });

    return NextResponse.json({ data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, priority, assignee_id, due_date, start_date } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const task = await prisma.tasks.create({
      data: {
        title,
        description,
        priority: priority || "medium",
        status: "not_started",
        created_by: user.id,
        assignee_id: assignee_id || null,
        due_date: due_date ? new Date(due_date) : null,
        start_date: start_date ? new Date(start_date) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, title, description, status, priority, assignee_id, due_date, start_date, completed_at } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const existingTask = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Permission check: only admin or task creator/assignee can update
    const isAdmin = currentEmployee.role?.name === "admin";
    const isCreator = existingTask.created_by === user.id;
    const isAssignee = existingTask.assignee_id === user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const task = await prisma.tasks.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignee_id !== undefined && { assignee_id: assignee_id || null }),
        ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
        ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
        ...(completed_at !== undefined && {
          completed_at: completed_at ? new Date(completed_at) : null,
          ...(completed_at && { status: "completed" }),
        }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        subtasks: true,
      },
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const currentEmployee = await prisma.employees.findUnique({
      where: { id: user.id },
      include: { role: true },
    });

    if (!currentEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const existingTask = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Permission check: only admin or task creator can delete
    const isAdmin = currentEmployee.role?.name === "admin";
    const isCreator = existingTask.created_by === user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "Forbidden - Only admin or task creator can delete" }, { status: 403 });
    }

    await prisma.tasks.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}