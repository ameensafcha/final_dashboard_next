import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

function calcKpis(tasks: any[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    pending: tasks.filter(t => t.status !== "completed").length,
    overdue: tasks.filter(t => t.due_date && parseLocalDate(t.due_date) < today && t.status !== "completed").length,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let allTasks: any[] = [];
  try {
    const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL;
    const taskFilter = isSuperAdmin ? {} : {
      OR: [
        { created_by: user.id },
        { assignee_id: user.id }
      ]
    };

    allTasks = await prisma.tasks.findMany({
      where: taskFilter,
      include: {
        assignee: true,
        creator: true,
      },
      orderBy: { created_at: "desc" },
    });
  } catch (err) {
    console.error("[Dashboard] Failed to fetch tasks:", err);
  }

  const serializedTasks = allTasks.map(t => ({
    ...t,
    due_date: t.due_date?.toISOString() || null,
    start_date: t.start_date?.toISOString() || null,
    completed_at: t.completed_at?.toISOString() || null,
    created_at: t.created_at.toISOString(),
  }));

  const kpis = calcKpis(serializedTasks);

  return <DashboardClient kpis={kpis} tasks={serializedTasks.slice(0, 10)} />;
}
