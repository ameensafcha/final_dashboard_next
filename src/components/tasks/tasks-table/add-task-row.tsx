import React, { useRef } from "react";
import { Loader2 } from "lucide-react";

interface AddTaskRowProps {
  newTask: { title: string };
  setNewTask: (val: any) => void;
  onAdd: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function AddTaskRow({
  newTask,
  setNewTask,
  onAdd,
  onCancel,
  isPending,
}: AddTaskRowProps) {
  const buttonClicked = useRef(false);

  return (
    <tr className="bg-[var(--accent)]/5 border-none">
      {/* Title - spans all columns */}
      <td className="py-4 px-8" colSpan={7}>
        <div className="flex items-center gap-3">
          <input
            autoFocus
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask((p: any) => ({ ...p, title: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTask.title.trim()) onAdd();
              if (e.key === "Escape") onCancel();
            }}
            onBlur={() => {
              if (!buttonClicked.current && newTask.title.trim()) {
                onAdd();
              }
              buttonClicked.current = false;
            }}
            placeholder="Type task title and press Enter..."
            disabled={isPending}
            className="input-field flex-1 text-sm font-bold px-4 py-3"
          />
          <button
            onClick={() => {
              buttonClicked.current = true;
              onAdd();
            }}
            disabled={!newTask.title.trim() || isPending}
            className="btn-primary px-6 py-3 text-sm flex items-center gap-2 shadow-lg shadow-black/10 disabled:opacity-40"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-3 text-sm font-bold text-[var(--muted)] hover:text-[var(--foreground)] rounded-full transition-colors"
          >
            Cancel
          </button>
        </div>
        {isPending && (
          <p className="text-xs text-[var(--muted)] mt-2">Saving task...</p>
        )}
      </td>
    </tr>
  );
}
