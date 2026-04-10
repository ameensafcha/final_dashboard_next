import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import { OfflineBanner } from "@/components/offline-banner";

export const dynamic = 'force-dynamic';

// Define Task type for proper typing (instead of any[])
// Uses Date | null from Prisma, serialized to ISO string for client
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  start_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
  created_by: string;
  assignee_id: string | null;
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string } | null;
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resolvedSearchParams = await searchParams;
  const authError = resolvedSearchParams.error;

  let tasks: Task[] = [];
  let error: string | null = null;

  try {
    tasks = await prisma.tasks.findMany({
      include: {
        assignee: true,
        creator: true,
      },
      orderBy: { created_at: "desc" },
    });
  } catch (err) {
    console.error("[Dashboard] Failed to fetch tasks:", err);
    error = "Failed to load tasks";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userTasks = user.isAdmin
    ? tasks
    : tasks.filter((t) => t.created_by === user.id || t.assignee_id === user.id);

  const totalTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = userTasks.filter((t) => t.status !== "completed").length;
  const overdueTasks = userTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < today && t.status !== "completed"
  ).length;

  const serializedTasks = userTasks.slice(0, 10).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date?.toISOString() || null,
    start_date: task.start_date?.toISOString() || null,
    completed_at: task.completed_at?.toISOString() || null,
    created_at: task.created_at.toISOString(),
    assignee: task.assignee
      ? { id: task.assignee.id, name: task.assignee.name }
      : null,
    creator: task.creator
      ? { id: task.creator.id, name: task.creator.name }
      : null,
  }));

  const kpis = {
    total: totalTasks,
    completed: completedTasks,
    pending: pendingTasks,
    overdue: overdueTasks,
  };

  // Naya Crextio theme background wrapper
  return (
    <>
      <OfflineBanner />
      <main className="min-h-screen bg-[#F5F4EE] w-full">
        <DashboardClient kpis={kpis} tasks={serializedTasks} error={error} authError={authError} />
      </main>
    </>
  );
}