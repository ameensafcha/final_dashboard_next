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
  company?: { id: string; name: string } | null;
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
        "bg-[var(--surface-container-lowest)] rounded-[var(--radius-lg)] p-5 cursor-pointer hover:shadow-[var(--shadow-xl)] hover:scale-[1.02] transition-all border-none shadow-[var(--shadow-sm)] flex flex-col gap-4",
        combinedDragging && "opacity-50 shadow-[var(--shadow-xl)] ring-4 ring-[var(--accent)]/50 rotate-2 scale-105 z-50",
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <h4 className="font-black text-[14px] text-[var(--foreground)] line-clamp-2 leading-snug tracking-tight">
          {task.title}
        </h4>
        {task.company && (
          <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-[var(--surface)] text-[var(--primary)] px-2 py-1 rounded-md shadow-inner">
            {task.company.name}
          </span>
        )}
      </div>
      
      {task.description && (
        <p className="text-[12px] text-[var(--muted)] line-clamp-2 font-bold leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-3">
          <PriorityBadge priority={task.priority} />
          
          {task.assignee && (
            <div className="flex items-center gap-2 bg-[var(--surface)] px-2 py-1 rounded-full">
              <Avatar name={task.assignee.name} size="sm" className="w-4 h-4" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--muted)]">{task.assignee.name.split(' ')[0]}</span>
            </div>
          )}
        </div>

        {task.due_date && (
          <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest bg-[var(--surface-container)] px-2 py-1 rounded-md">
            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}

