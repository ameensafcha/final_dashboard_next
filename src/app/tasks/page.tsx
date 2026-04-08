import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/tasks-table";
import { TaskForm } from "@/components/task-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function TasksPage() {
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
    status: task.status,
    priority: task.priority,
    assignee_id: task.assignee_id,
    due_date: task.due_date?.toISOString() || null,
    start_date: task.start_date?.toISOString() || null,
    completed_at: task.completed_at?.toISOString() || null,
    created_at: task.created_at.toISOString(),
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.email,
        }
      : null,
    creator: {
      id: task.creator.id,
      name: task.creator.name,
      email: task.creator.email,
    },
    subtasks: task.subtasks.map((st) => ({
      id: st.id,
      title: st.title,
      is_completed: st.is_completed,
    })),
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
            All Tasks
          </h1>
          <p className="text-gray-600">View and manage all tasks</p>
        </div>
      </div>

      <TasksTable initialData={serializedTasks} />
    </div>
  );
}