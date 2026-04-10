"use client";

import { useState, useEffect, useCallback } from "react";
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
}

const COLUMNS = [
  { id: "not_started", title: "Not Started", color: "bg-gray-100" },
  { id: "in_progress", title: "In Progress", color: "bg-blue-50" },
  { id: "review", title: "Review", color: "bg-yellow-50" },
  { id: "completed", title: "Completed", color: "bg-green-50" },
];

const COLUMN_IDS = new Set(COLUMNS.map((c) => c.id));

interface TaskBoardProps {
  initialData?: Task[];
  currentUserId?: string;
  currentUserRole?: string;
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
      className={`rounded-lg p-3 ${column.color} min-h-[300px] flex flex-col transition-all ${
        isOver ? "ring-2 ring-amber-400 ring-inset brightness-95" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 text-sm">{column.title}</h3>
        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 flex-1">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-20 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({ initialData = [], currentUserId, currentUserRole }: TaskBoardProps) {
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

  // Real-time subscription to tasks table for UPDATE events (when assignments change)
  const handleTaskUpdate = useCallback((payload: { new: Task; old: Task }) => {
    console.log('[TaskBoard] Task updated:', payload.new.id);
    // Update local task list with the updated task
    setLocalTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === payload.new.id ? { ...task, ...payload.new } : task
      )
    );
  }, []);

  useRealtimeSubscription({
    table: 'tasks',
    event: 'UPDATE',
    filter: 'assignee_id=eq.' + currentUserId,
    onMessage: handleTaskUpdate,
    enabled: !!currentUserId,
  });

  // Real-time subscription to tasks table for INSERT events (new tasks created)
  const handleTaskInsert = useCallback((payload: { new: Task }) => {
    console.log('[TaskBoard] Task created:', payload.new.id);
    setLocalTasks((currentTasks) => [payload.new, ...currentTasks]);
  }, []);

  useRealtimeSubscription({
    table: 'tasks',
    event: 'INSERT',
    filter: 'assignee_id=eq.' + currentUserId,
    onMessage: handleTaskInsert,
    enabled: !!currentUserId,
  });

  // Real-time subscription to tasks table for DELETE events (tasks removed)
  const handleTaskDelete = useCallback((payload: { old: Task }) => {
    console.log('[TaskBoard] Task deleted:', payload.old.id);
    setLocalTasks((currentTasks) => currentTasks.filter((t) => t.id !== payload.old.id));
  }, []);

  useRealtimeSubscription({
    table: 'tasks',
    event: 'DELETE',
    filter: 'assignee_id=eq.' + currentUserId,
    onMessage: handleTaskDelete,
    enabled: !!currentUserId,
  });

  // Real-time subscription to task_comments table for INSERT events (when comments are added)
  const handleCommentInsert = useCallback((payload: { new: { task_id: string } }) => {
    console.log('[TaskBoard] Comment added to task:', payload.new.task_id);
    // Optionally refresh the task, but for now just log
    // This could trigger a UI update if task has comment_count
  }, []);

  useRealtimeSubscription({
    table: 'task_comments',
    event: 'INSERT',
    onMessage: handleCommentInsert,
    enabled: !!currentUserId,
  });

  const visibleTasks =
    currentUserRole === "admin" || !currentUserId
      ? localTasks
      : localTasks.filter(
          (t) => t.creator?.id === currentUserId || t.assignee?.id === currentUserId
        );

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
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetColumn } : t))
      );
      updateTaskMutation.mutate({ id: taskId, status: targetColumn });
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setOverColumnId(null);
  };

  const getTasksByStatus = (status: string) =>
    visibleTasks.filter((task) => task.status === status);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-4 gap-4 h-full">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id)}
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
    </>
  );
}
