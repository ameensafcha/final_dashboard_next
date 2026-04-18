"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { TaskDetail } from "./task-detail";
import { useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  created_at: string;
  estimated_hours: number | null;
  recurrence: string | null;
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
  subtasks?: { id: string; title: string; is_completed: boolean }[];
  attachments?: {
    id: string;
    file_name: string;
    file_url: string;
    file_size: number | null;
    file_type: string | null;
    created_at: string;
  }[];
}

const COLUMNS = [
  { id: "not_started", title: "Not Started" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "completed", title: "Completed" },
];

const COLUMN_IDS = new Set(COLUMNS.map((c) => c.id));

interface TaskBoardProps {
  initialData?: Task[];
  currentUserId?: string;
}

function KanbanColumn({
  column,
  tasks,
  isOver,
  onTaskClick,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  isOver: boolean;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-[var(--radius-xl)] p-4 flex flex-col transition-all duration-500 min-h-[500px]",
        column.id === "not_started" && "bg-[var(--surface-container)]/50",
        column.id === "in_progress" && "bg-[var(--accent)]/10",
        column.id === "review" && "bg-[var(--info-bg)]/50",
        column.id === "completed" && "bg-[var(--success-bg)]/50",
        isOver && "ring-4 ring-[var(--accent)]/30 ring-inset brightness-95 scale-[0.98]"
      )}
    >
      <div className="flex items-center justify-between mb-6 px-4">
        <h3 className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em]">{column.title}</h3>
        <span className="text-[10px] font-black text-[var(--primary)] bg-[var(--accent)]/30 px-3 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4 flex-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--muted)] bg-[var(--surface-container-lowest)]/50 rounded-[var(--radius-lg)] border-none shadow-inner animate-pulse">
              <span className="text-[9px] font-black uppercase tracking-widest">Awaiting Mission</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({ initialData = [], currentUserId }: TaskBoardProps) {
  const { addNotification } = useUIStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(initialData);

  useEffect(() => {
    if (initialData.length > 0) {
      setLocalTasks(initialData);
    }
  }, [initialData]);

  const handleTaskUpdate = useCallback((payload: { new: Task }) => {
    // Preserve nested assignee/creator — realtime payload is a flat row without joins
    setLocalTasks((current) =>
      current.map((t) =>
        t.id === payload.new.id
          ? { ...t, ...payload.new, assignee: t.assignee, creator: t.creator }
          : t
      )
    );
  }, []);

  const handleTaskInsert = useCallback(async (payload: { new: { id: string } }) => {
    // Fetch full task with joins — realtime payload is a flat row without nested data
    try {
      const res = await fetch(`/api/tasks/${payload.new.id}`);
      if (res.ok) {
        const { data } = await res.json();
        setLocalTasks((current) => [data, ...current]);
      }
    } catch {
      // silently ignore — board stays consistent on next refresh
    }
  }, []);

  const handleTaskDelete = useCallback((payload: { old: { id: string } }) => {
    setLocalTasks((current) => current.filter(t => t.id !== payload.old.id));
  }, []);

  useRealtimeSubscription({ table: 'tasks', event: 'UPDATE', onMessage: handleTaskUpdate, enabled: !!currentUserId });
  useRealtimeSubscription({ table: 'tasks', event: 'INSERT', onMessage: handleTaskInsert, enabled: !!currentUserId });
  useRealtimeSubscription({ table: 'tasks', event: 'DELETE', onMessage: handleTaskDelete, enabled: !!currentUserId });

  const visibleTasks = localTasks;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      addNotification({ type: "success", message: "Task status updated" });
    },
    onError: (err: Error) => {
      addNotification({ type: "error", message: err.message });
    },
  });

  const resolveColumnId = (overId: string): string | null => {
    if (COLUMN_IDS.has(overId)) return overId;
    const overTask = visibleTasks.find((t) => t.id === overId);
    return overTask?.status ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = visibleTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    setOverColumnId(resolveColumnId(over.id as string));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveTask(null);

    const targetColumn = overColumnId;
    setOverColumnId(null);

    if (!targetColumn) return;

    const taskId = active.id as string;
    const task = visibleTasks.find((t) => t.id === taskId);
    if (task && task.status !== targetColumn) {
      const previousStatus = task.status;
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetColumn } : t))
      );
      updateTaskMutation.mutate(
        { id: taskId, status: targetColumn },
        {
          onError: () => {
            setLocalTasks((prev) =>
              prev.map((t) => (t.id === taskId ? { ...t, status: previousStatus } : t))
            );
          },
        }
      );
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = Object.fromEntries(COLUMNS.map((c) => [c.id, []]));
    for (const task of visibleTasks) {
      if (map[task.status]) map[task.status].push(task);
    }
    return map;
  }, [visibleTasks]);

  return (
    <div className="relative h-full">
      {updateTaskMutation.isPending && (
        <div className="absolute top-0 right-0 z-50 p-4">
          <div className="bg-[var(--glass-bg)] backdrop-blur-xl px-5 py-2.5 rounded-full shadow-[var(--shadow-xl)] border-none flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
            <span className="text-[10px] font-black text-[var(--foreground)] uppercase tracking-widest">Transmitting Updates...</span>
          </div>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-4 gap-6 h-full">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id] ?? []}
              isOver={overColumnId === column.id}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-90 rotate-1 scale-105">
              <TaskCard task={activeTask} onClick={() => {}} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDetail
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
