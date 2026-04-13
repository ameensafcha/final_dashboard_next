import { prisma } from "@/lib/prisma";
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from "@/lib/validations/task";
import { Prisma } from "@prisma/client";

export class TaskService {
  static async getTasks(query: TaskQueryInput, userId: string, isAdmin: boolean) {
    const { 
      page, 
      limit, 
      search, 
      status, 
      priority, 
      area, 
      assignee_id, 
      created_by, 
      sortBy, 
      sortOrder 
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.tasksWhereInput = {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        status ? { status } : {},
        priority ? { priority } : {},
        area ? { area } : {},
        assignee_id ? { assignee_id } : {},
        created_by ? { created_by } : {},
      ],
    };

    // Authorization check: Non-admins only see their own or assigned tasks
    if (!isAdmin) {
      where.AND = [
        ...(where.AND as Prisma.tasksWhereInput[]),
        {
          OR: [
            { created_by: userId },
            { assignee_id: userId },
          ],
        },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.tasks.findMany({
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
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.tasks.count({ where }),
    ]);

    return {
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async createTask(data: CreateTaskInput, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const task = await tx.tasks.create({
        data: {
          ...data,
          status: "not_started",
          created_by: userId,
          due_date: data.due_date ? new Date(data.due_date) : null,
          start_date: data.start_date ? new Date(data.start_date) : null,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      if (data.assignee_id) {
        await tx.notifications.create({
          data: {
            recipient_id: data.assignee_id,
            actor_id: userId,
            action_type: "task_assigned",
            task_id: task.id,
            task_title: task.title,
          },
        });
      }

      return task;
    });
  }

  static async updateTask(id: string, data: UpdateTaskInput, userId: string, isAdmin: boolean) {
    const existingTask = await prisma.tasks.findUnique({
      where: { id },
    });

    if (!existingTask) throw new Error("Task not found");

    // Authorization: Only creator, assignee or admin can update
    if (!isAdmin && existingTask.created_by !== userId && existingTask.assignee_id !== userId) {
      throw new Error("Unauthorized to update this task");
    }

    const isCompleting = data.status === "completed" && existingTask.status !== "completed";
    
    const updateData: any = { ...data };
    if (isCompleting) {
      updateData.completed_at = new Date();
    }
    if (data.due_date) updateData.due_date = new Date(data.due_date);
    if (data.start_date) updateData.start_date = new Date(data.start_date);

    return await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.tasks.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          subtasks: true,
        },
      });

      // Recurrence Logic: Only spawn if not already spawned for this task
      if (isCompleting && updatedTask.recurrence && !updatedTask.has_spawned_recurrence) {
        await this.handleRecurrence(tx, updatedTask);
        // Mark as spawned
        await tx.tasks.update({
          where: { id: updatedTask.id },
          data: { has_spawned_recurrence: true }
        });
      }

      if (data.assignee_id && data.assignee_id !== existingTask.assignee_id) {
        await tx.notifications.create({
          data: {
            recipient_id: data.assignee_id,
            actor_id: userId,
            action_type: "task_assigned",
            task_id: id,
            task_title: updatedTask.title,
          },
        });
      }

      return updatedTask;
    });
  }

  static async deleteTask(id: string, userId: string, isAdmin: boolean) {
    const existingTask = await prisma.tasks.findUnique({
      where: { id },
      include: { attachments: true }
    });

    if (!existingTask) throw new Error("Task not found");

    // Authorization: Only creator or admin can delete
    if (!isAdmin && existingTask.created_by !== userId) {
      throw new Error("Unauthorized to delete this task");
    }

    // Clean up files in Supabase Storage before deleting from DB
    if (existingTask.attachments && existingTask.attachments.length > 0) {
      try {
        const { getSupabaseAdmin } = await import("@/lib/supabase");
        const supabaseAdmin = getSupabaseAdmin();
        const pathsToRemove = existingTask.attachments
          .map(att => {
            const parts = att.file_url.split('/task-attachments/');
            return parts.length > 1 ? parts[1] : null;
          })
          .filter(Boolean) as string[];

        if (pathsToRemove.length > 0) {
          await supabaseAdmin.storage.from('task-attachments').remove(pathsToRemove);
        }
      } catch (err) {
        console.error("Failed to delete task attachments from storage", err);
      }
    }

    return await prisma.tasks.delete({ where: { id } });
  }

  private static async handleRecurrence(tx: Prisma.TransactionClient, task: any) {
    const nextStartDate = task.start_date ? new Date(task.start_date) : null;
    const nextDueDate = task.due_date ? new Date(task.due_date) : null;
    const interval = task.recurrence.toLowerCase();

    const addInterval = (date: Date) => {
      if (interval === "daily") date.setDate(date.getDate() + 1);
      else if (interval === "weekly") date.setDate(date.getDate() + 7);
      else if (interval === "monthly") date.setMonth(date.getMonth() + 1);
      else if (interval === "yearly") date.setFullYear(date.getFullYear() + 1);
    };

    if (nextStartDate) addInterval(nextStartDate);
    if (nextDueDate) addInterval(nextDueDate);

    await tx.tasks.create({
      data: {
        title: task.title,
        description: task.description,
        area: task.area,
        priority: task.priority,
        status: "not_started",
        created_by: task.created_by,
        assignee_id: task.assignee_id,
        estimated_hours: task.estimated_hours,
        recurrence: task.recurrence,
        start_date: nextStartDate,
        due_date: nextDueDate,
        has_spawned_recurrence: false, // Reset for the new task
      },
    });
  }
}
