"use client";

import { useState } from "react";
import { TaskBoard } from "@/components/task-board";
import { TaskForm } from "@/components/task-form";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { Plus } from "lucide-react";

export default function KanbanPage() {
  const [showForm, setShowForm] = useState(false);
  const { role } = useAuth();
  const isAdmin = role === "admin";

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Kanban Board</h1>
          <p className="text-gray-600">Drag tasks between columns to update status</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <TaskBoard />
      </div>

      <TaskForm open={showForm} onClose={() => setShowForm(false)} canChangeAssignee={isAdmin} />
    </div>
  );
}