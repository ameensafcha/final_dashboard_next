import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TasksTable } from "@/components/tasks-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL;
  const taskFilter = isSuperAdmin ? {} : {
    OR: [
      { created_by: user.id },
      { assignee_id: user.id }
    ]
  };

  const tasks = await prisma.tasks.findMany({
    where: taskFilter,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      subtasks: true,
      attachments: true,
      _count: { select: { comments: true, time_logs: true } },
    },
    orderBy: [
      { priority: "desc" },
      { created_at: "desc" },
    ],
  });

  // Map to the Task interface expected by TasksTable
  const serializedTasks = tasks.map(t => ({
    ...t,
    due_date: t.due_date?.toISOString() || null,
    start_date: t.start_date?.toISOString() || null,
    completed_at: t.completed_at?.toISOString() || null,
    created_at: t.created_at.toISOString(),
    attachments: t.attachments.map(a => ({
      ...a,
      created_at: a.created_at.toISOString(),
    })),
  }));

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
        <p className="text-gray-500">View and manage system-wide tasks</p>
      </header>
      <TasksTable initialData={serializedTasks} currentUserId={user.id} />
    </div>
  );
}
