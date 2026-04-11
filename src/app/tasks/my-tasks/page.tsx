"use client";

import { useState } from "react";
import { TasksTable } from "@/components/tasks-table";
import { TaskForm } from "@/components/task-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Plus } from "lucide-react";

export default function MyTasksPage() {
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return <div className="p-6">Please log in to view your tasks.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>My Tasks</h1>
          <p className="text-gray-600">Tasks assigned to you</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <TasksTable
        filterAssigneeId={user.id}
        currentUserId={user.id}
      />

      <TaskForm
        open={showForm}
        onClose={() => setShowForm(false)}
        defaultAssigneeId={user.id}
        canChangeAssignee={false}
      />
    </div>
  );
}
