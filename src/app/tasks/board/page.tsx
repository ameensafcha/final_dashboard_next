import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TaskBoard } from "@/components/tasks/task-board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
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
      _count: { select: { comments: true } },
    },
  });

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

  const employees = await prisma.employee.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-8 h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <header className="mb-8 flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
        <p className="text-gray-500">Visualize and manage your tasks through stages</p>
      </header>
      <div className="flex-1 overflow-auto scrollbar-hide">
        <TaskBoard initialData={serializedTasks} currentUserId={user.id} />
      </div>
    </div>
  );
}
