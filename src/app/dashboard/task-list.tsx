"use client";

import { useState } from "react";
import { CheckCircle, Circle, Calendar } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  start_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  assignee?: { id: string; name: string } | null;
  creator?: { id: string; name: string } | null;
}

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const priorityBgColors: Record<string, string> = {
  urgent: "bg-red-50",
  high: "bg-red-50",
  medium: "bg-amber-50",
  low: "bg-gray-50",
};

const priorityBorderColors: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-red-500",
  medium: "border-l-amber-400",
  low: "border-l-gray-400",
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "No date";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dueDate = new Date(dateStr);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate.getTime() === today.getTime()) {
    return "Today";
  } else if (dueDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else if (dueDate < today) {
    return "Overdue";
  } else if (dueDate < nextWeek) {
    return "This Week";
  } else {
    return dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export function TaskList({ tasks: initialTasks, onTaskClick }: TaskListProps) {
  const [filter, setFilter] = useState("today");

  const filteredTasks = initialTasks.filter((task) => {
    if (filter === "all") return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const dueDate = task.due_date ? new Date(task.due_date) : null;
    
    if (filter === "today") {
      return dueDate && dueDate >= today && dueDate < tomorrow;
    }
    if (filter === "week") {
      return dueDate && dueDate >= today && dueDate < nextWeek;
    }
    if (filter === "overdue") {
      return dueDate && dueDate < today && task.status !== "completed";
    }
    return true;
  });

  return (
    <>
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#1A1A1A" }}>
            My Tasks
          </h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="all">All Tasks</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <div className="divide-y">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks found
            </div>
          ) : (
            filteredTasks.map((task) => {
              const bgColor = priorityBgColors[task.priority] || priorityBgColors.low;
              const borderColor = priorityBorderColors[task.priority] || priorityBorderColors.low;
              const isCompleted = task.status === "completed";
              
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick?.(task)}
                  className={`p-4 flex items-center gap-4 ${bgColor} border-l-4 ${borderColor} cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isCompleted ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {task.title}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {formatDueDate(task.due_date)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}