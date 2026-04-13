import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignee_id = searchParams.get("assignee_id");
    const created_by = searchParams.get("created_by");
    const search = searchParams.get("search");

    const queryConditions: any[] = [];
    if (search) {
      queryConditions.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const filters: any[] = [];
    if (status) filters.push({ status });
    if (priority) filters.push({ priority });
    if (assignee_id) filters.push({ assignee_id });
    if (created_by) filters.push({ created_by });

    let where: any = {};
    if (queryConditions.length > 0 && filters.length > 0) {
      where = { AND: [...queryConditions, ...filters] };
    } else if (queryConditions.length > 0) {
      where = queryConditions.length === 1 ? queryConditions[0] : { AND: queryConditions };
    } else if (filters.length > 0) {
      where = filters.length === 1 ? filters[0] : { AND: filters };
    }

    // Simplified task filter: Admin sees all, User sees assigned/created
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL;
    if (!isSuperAdmin) {
      const roleFilter = {
        OR: [
          { created_by: user.id },
          { assignee_id: user.id }
        ]
      };
      where = Object.keys(where).length > 0 ? { AND: [where, roleFilter] } : roleFilter;
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
        estimated_hours: true,
        recurrence: true,
        created_at: true,
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        subtasks: true,
        attachments: true,
        _count: { select: { comments: true, time_logs: true } },
      },
      orderBy: [{ priority: "desc" }, { created_at: "desc" }],
    });
    return NextResponse.json({ data: tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { 
      title, 
      description, 
      area, 
      priority, 
      assignee_id, 
      due_date, 
      start_date,
      estimated_hours,
      recurrence
    } = await request.json();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const task = await prisma.$transaction(async (tx) => {
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
          estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
          recurrence: recurrence || null,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

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
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { 
      id, 
      title, 
      description, 
      area, 
      status, 
      priority, 
      assignee_id, 
      due_date, 
      start_date, 
      completed_at,
      estimated_hours,
      recurrence
    } = await request.json();
    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    const existingTask = await prisma.tasks.findUnique({ where: { id } });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const isCompleting = status === "completed" && existingTask.status !== "completed";
    const updateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(area !== undefined && { area }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(assignee_id !== undefined && { assignee_id: assignee_id || null }),
      ...(due_date !== undefined && { due_date: due_date ? new Date(due_date) : null }),
      ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
      ...(estimated_hours !== undefined && { estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null }),
      ...(recurrence !== undefined && { recurrence: recurrence || null }),
      ...(isCompleting && { completed_at: new Date() }),
    };

    const task = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.tasks.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          subtasks: true,
        },
      });

      // Recurrence Logic
      if (isCompleting && updatedTask.recurrence) {
        const nextStartDate = updatedTask.start_date ? new Date(updatedTask.start_date) : null;
        const nextDueDate = updatedTask.due_date ? new Date(updatedTask.due_date) : null;

        const interval = updatedTask.recurrence.toLowerCase();
        
        if (nextStartDate) {
          if (interval === "daily") nextStartDate.setDate(nextStartDate.getDate() + 1);
          else if (interval === "weekly") nextStartDate.setDate(nextStartDate.getDate() + 7);
          else if (interval === "monthly") nextStartDate.setMonth(nextStartDate.getMonth() + 1);
          else if (interval === "yearly") nextStartDate.setFullYear(nextStartDate.getFullYear() + 1);
        }

        if (nextDueDate) {
          if (interval === "daily") nextDueDate.setDate(nextDueDate.getDate() + 1);
          else if (interval === "weekly") nextDueDate.setDate(nextDueDate.getDate() + 7);
          else if (interval === "monthly") nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          else if (interval === "yearly") nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        }

        await tx.tasks.create({
          data: {
            title: updatedTask.title,
            description: updatedTask.description,
            area: updatedTask.area,
            priority: updatedTask.priority,
            status: "not_started",
            created_by: updatedTask.created_by,
            assignee_id: updatedTask.assignee_id,
            estimated_hours: updatedTask.estimated_hours,
            recurrence: updatedTask.recurrence,
            start_date: nextStartDate,
            due_date: nextDueDate,
          },
        });
      }

      if (assignee_id && assignee_id !== existingTask.assignee_id) {
        await tx.notifications.create({
          data: {
            recipient_id: assignee_id,
            actor_id: user.id,
            action_type: "task_assigned",
            task_id: id,
            task_title: updatedTask.title,
          },
        });
      }
      return updatedTask;
    });

    return NextResponse.json({ data: task });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    await prisma.tasks.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
