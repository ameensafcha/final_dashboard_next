import { getCurrentUser } from "@/lib/auth";
import { TasksTable } from "@/components/tasks/tasks-table";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Task Management</h1>
        <p className="text-gray-500">View and manage system-wide tasks</p>
      </header>
      <TasksTable currentUserId={user.id} />
    </div>
  );
}
