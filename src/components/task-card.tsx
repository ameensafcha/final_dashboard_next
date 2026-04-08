"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const combinedDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-all",
        "border-l-4",
        combinedDragging && "opacity-50 shadow-lg ring-2 ring-amber-400",
        task.priority === "urgent" && "border-l-red-500",
        task.priority === "high" && "border-l-orange-500",
        task.priority === "medium" && "border-l-amber-400",
        task.priority === "low" && "border-l-gray-400"
      )}
    >
      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <PriorityBadge priority={task.priority} />
        
        {task.assignee && (
          <Avatar name={task.assignee.name} size="sm" />
        )}

        {task.due_date && (
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export function TaskCardSimple({ task, onClick }: TaskCardProps) {
  return <TaskCard task={task} onClick={onClick} />;
}