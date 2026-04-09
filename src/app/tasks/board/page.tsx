import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { KanbanClient } from "./kanban-client";

export default async function KanbanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tasks = await prisma.tasks.findMany({
    include: {
      assignee: true,
      creator: true,
      subtasks: true,
    },
    orderBy: { created_at: "desc" },
  });

  const serializedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    area: task.area,
    status: task.status,
    priority: task.priority,
    assignee_id: task.assignee_id,
    due_date: task.due_date?.toISOString() || null,
    start_date: task.start_date?.toISOString() || null,
    completed_at: task.completed_at?.toISOString() || null,
    created_at: task.created_at.toISOString(),
    assignee: task.assignee
      ? { id: task.assignee.id, name: task.assignee.name, email: task.assignee.email }
      : null,
    creator: task.creator
      ? { id: task.creator.id, name: task.creator.name, email: task.creator.email }
      : null,
    subtasks: task.subtasks.map((st) => ({ id: st.id, title: st.title, is_completed: st.is_completed })),
  }));

  return (
    <KanbanClient
      userId={user.id}
      userRole={user.role ?? undefined}
      initialData={serializedTasks}
    />
  );
}