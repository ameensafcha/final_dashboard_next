"use client";

import { useState } from "react";
import { TasksTable } from "@/components/tasks-table";
import { TaskForm } from "@/components/task-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TasksPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>All Tasks</h1>
          <p className="text-gray-600">View and manage all tasks</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <TasksTable />

      <TaskForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}