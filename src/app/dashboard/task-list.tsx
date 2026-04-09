"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Calendar, ListTodo } from "lucide-react";

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

// Priority ke liye ab left indicator line use karenge, poora background nahi
const priorityIndicatorColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-gray-300",
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-amber-500" />
          My Tasks
        </h2>
        
        {/* Modern Pill Filters instead of Native Select */}
        <div className="flex gap-1 p-1 bg-gray-100/80 rounded-xl overflow-x-auto hide-scrollbar">
          {[
            { id: "today", label: "Today" },
            { id: "week", label: "This Week" },
            { id: "overdue", label: "Overdue" },
            { id: "all", label: "All Tasks" }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                filter === f.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Task List Section */}
      <div className="divide-y divide-gray-50">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">You're all caught up!</p>
            <p className="text-xs text-gray-500">No tasks found for this filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const indicatorColor = priorityIndicatorColors[task.priority] || priorityIndicatorColors.low;
            const isCompleted = task.status === "completed";
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted;
            
            return (
              <div
                key={task.id}
                onClick={() => onTaskClick?.(task)}
                className="group relative flex items-center gap-4 p-5 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Left Priority Indicator Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${indicatorColor}`} />
                
                {/* Checkbox Icon */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 group-hover:text-amber-400 transition-colors" />
                  )}
                </div>
                
                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate transition-colors ${isCompleted ? "line-through text-gray-400" : "text-gray-900 group-hover:text-amber-600"}`}>
                    {task.title}
                  </p>
                </div>
                
                {/* Date Badge */}
                <div className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                  isOverdue ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDueDate(task.due_date)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}