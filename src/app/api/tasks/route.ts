import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TaskService } from "@/services/task-service";
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from "@/lib/validations/task";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

async function checkIsAdmin(user: any) {
  if (!user) return false;
  
  // 1. Check Super Admin Email from env
  if (process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL) {
    return true;
  }

  // 2. Check Role from Database
  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    include: { role: true }
  });

  return employee?.role?.name === "Admin";
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = taskQuerySchema.parse(queryParams);
    const isAdmin = await checkIsAdmin(user);

    const result = await TaskService.getTasks(validatedQuery, user.id, !!isAdmin);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters", details: error.issues }, { status: 400 });
    }
    console.error("GET Tasks Error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const task = await TaskService.createTask(validatedData, user.id);
    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("POST Task Validation Error:", error.issues);
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);
    const isAdmin = await checkIsAdmin(user);

    const task = await TaskService.updateTask(validatedData.id, validatedData, user.id, !!isAdmin);
    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("PUT Task Validation Error:", error.issues);
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    const status = error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update task" }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Task ID is required" }, { status: 400 });

    const isAdmin = await checkIsAdmin(user);
    await TaskService.deleteTask(id, user.id, !!isAdmin);

    return NextResponse.json({ success: true });
  } catch (error) {
    const status = error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete task" }, { status });
  }
}
