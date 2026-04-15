import { getCurrentUser } from "@/lib/auth";
import { TasksTable } from "@/components/tasks/tasks-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-8 bg-[var(--surface)] min-h-screen">
      <header className="mb-8">
        <h1 className="text-sub font-display text-[var(--foreground)]">
          Task Management
        </h1>
        <p className="text-body-light text-[var(--muted)] mt-1">
          View and manage system-wide tasks
        </p>
      </header>
      <TasksTable currentUserId={user.id} />
    </div>
  );
}
