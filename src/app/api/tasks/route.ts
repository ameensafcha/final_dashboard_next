import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, authResponse } from "@/lib/auth-helper";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignee_id = searchParams.get("assignee_id");
    const created_by = searchParams.get("created_by");
    const search = searchParams.get("search");

    const where: any = {};

    // Role-based filtering + search
    if (!user.isAdmin) {
      const roleFilter = { OR: [{ created_by: user.id }, { assignee_id: user.id }] };
      if (search) {
        where.AND = [
          roleFilter,
          {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          },
        ];
      } else {
        where.OR = [roleFilter.OR[0], roleFilter.OR[1]];
      }
    } else if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply additional filters
    const statusFilter = status ? { status } : null;
    const priorityFilter = priority ? { priority } : null;
    const assigneeFilter = assignee_id ? { assignee_id } : null;
    const createdByFilter = created_by ? { created_by } : null;

    const extraFilters = [statusFilter, priorityFilter, assigneeFilter, createdByFilter].filter(Boolean);

    if (!user.isAdmin) {
      if (where.AND) {
        where.AND.push(...extraFilters);
      } else if (extraFilters.length > 0) {
        where.AND = [...(where.OR ? [{ OR: where.OR }] : []), ...extraFilters];
        delete where.OR;
      }
    } else {
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assignee_id) where.assignee_id = assignee_id;
      if (created_by) where.created_by = created_by;
    }

    const tasks = await prisma.tasks.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        area: true,
        status: true,
        priority: true,
        due_date: true,
        start_date: true,
        completed_at: true,
        created_at: true,
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
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const { title, description, area, priority, assignee_id, due_date, start_date } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Use transaction to ensure atomicity: task creation and notification succeed or both fail
    const task = await prisma.$transaction(async (tx) => {
      // Create task first
      const newTask = await tx.tasks.create({
        data: {
          title,
          description,
          area,
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

      // Create notification if assignee is set (D-01)
      if (assignee_id) {
        await tx.notifications.create({
          data: {
            recipient_id: assignee_id,
            actor_id: user.id,
            action_type: "task_assigned",
            task_id: newTask.id,
            task_title: newTask.title,
          },
        });
      }

      return newTask;
    });

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const { id, title, description, area, status, priority, assignee_id, due_date, start_date, completed_at } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existingTask = await prisma.tasks.findUnique({
      where: { id },
      include: { assignee: true, creator: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Permission check: only admin or task creator/assignee can update
    const isCreator = existingTask.created_by === user.id;
    const isAssignee = existingTask.assignee_id === user.id;

    if (!user.isAdmin && !isCreator && !isAssignee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Field-level permissions
    const isAdminOrCreator = user.isAdmin || isCreator;

    // Auto-set completed_at when status changes to completed
    const isCompleting = status === "completed" && existingTask.status !== "completed";
    const completionTime = isCompleting ? new Date() : null;

    // Fields allowed for Admin + Creator
    const fullUpdate = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(area !== undefined && { area }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assignee_id !== undefined && { assignee_id: assignee_id || null }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
      ...(completed_at !== undefined && { completed_at: completed_at ? new Date(completed_at) : completionTime }),
    };

    // Fields allowed for Assignee-only
    const restrictedUpdate = {
      ...(status !== undefined && { status }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
      ...(completed_at !== undefined || isCompleting ? { completed_at: isCompleting ? completionTime : (completed_at ? new Date(completed_at) : null) } : {}),
    };

    const updateData = isAdminOrCreator ? fullUpdate : restrictedUpdate;

    // Use transaction to ensure atomicity: both task update and notification creation succeed or both fail
    const task = await prisma.$transaction(async (tx) => {
      // Update task
      const updatedTask = await tx.tasks.update({
        where: { id },
        data: updateData,
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

      // Create notification if assignee changed (and new assignee exists)
      const newAssigneeId = assignee_id !== undefined ? assignee_id : existingTask.assignee_id;
      const assigneeChanged = newAssigneeId !== existingTask.assignee_id;

      if (assigneeChanged && newAssigneeId) {
        // Verify new assignee exists
        const newAssignee = await tx.employees.findUnique({
          where: { id: newAssigneeId },
        });

        if (newAssignee) {
          await tx.notifications.create({
            data: {
              recipient_id: newAssigneeId,
              actor_id: user.id,
              action_type: "task_assigned",
              task_id: id,
              task_title: updatedTask.title,
            },
          });
        }
      }

      return updatedTask;
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return authResponse("Unauthorized");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const existingTask = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Permission check: only admin or task creator can delete
    const isCreator = existingTask.created_by === user.id;

    if (!user.isAdmin && !isCreator) {
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