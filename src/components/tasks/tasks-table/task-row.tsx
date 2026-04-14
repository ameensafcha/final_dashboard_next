import React, { useMemo } from "react";
import { Eye, Edit2, Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Task, Company, Employee, AREA_OPTIONS } from "./types";

interface TaskRowProps {
  task: Task;
  inlineEditingId: string | null;
  inlineField: "title" | "due_date" | null;
  inlineValue: string;
  setInlineValue: (val: string) => void;
  startInlineEdit: (taskId: string, field: "title" | "due_date", value: string) => void;
  cancelInlineEdit: () => void;
  saveInlineText: (task: Task) => void;
  saveInlineField: (id: string, data: Record<string, unknown>) => void;
  updatingTaskId: string | null;
  onView: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isDeleting: boolean;
  companies: Company[];
  employees: Employee[];
  showAssignee: boolean;
}

const TimeLeftDisplay = React.memo(function TimeLeftDisplay({
  dueDate,
}: {
  dueDate: string | null;
}) {
  if (!dueDate) return <span className="text-sm text-gray-400">-</span>;
  
  const now = new Date().getTime();
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - now) / (1000 * 60 * 60 * 24));

  return (
    <span className={cn(
      "text-xs font-bold px-3 py-1 rounded-full",
      daysLeft < 0 ? "bg-red-50 text-red-700 border border-red-100" :
      daysLeft <= 2 ? "bg-orange-50 text-orange-700" :
      daysLeft <= 7 ? "bg-amber-50 text-amber-700" :
      "bg-green-50 text-green-700"
    )}>
      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
    </span>
  );
});

export const TaskRow = React.memo(function TaskRow({
  task,
  inlineEditingId,
  inlineField,
  inlineValue,
  setInlineValue,
  startInlineEdit,
  cancelInlineEdit,
  saveInlineText,
  saveInlineField,
  updatingTaskId,
  onView,
  onEdit,
  onDelete,
  isDeleting,
  companies,
  employees,
  showAssignee,
}: TaskRowProps) {
  const isUpdating = updatingTaskId === task.id;

  return (
    <tr className="hover:bg-[#fbfaf1] transition-colors group border-none">
      {/* Title */}
      <td
        className="py-5 px-8"
        onClick={() => !inlineEditingId && startInlineEdit(task.id, "title", task.title)}
      >
        {inlineEditingId === task.id && inlineField === "title" ? (
          <input
            autoFocus
            type="text"
            value={inlineValue}
            onChange={(e) => setInlineValue(e.target.value)}
            onBlur={() => saveInlineText(task)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveInlineText(task);
              if (e.key === "Escape") cancelInlineEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-bold text-gray-900 bg-[#ffd54f]/10 border-b-2 border-[#ffd54f] outline-none rounded-lg px-2 py-1"
          />
        ) : (
          <div className="cursor-pointer">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-gray-900 group-hover:text-[#735c00] transition-colors">{task.title}</p>
              {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#735c00]" />}
            </div>
            {task.description && (
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 max-w-[200px]">{task.description}</p>
            )}
          </div>
        )}
      </td>

      {/* Company */}
      <td className="py-5 px-8">
        <Select
          value={task.company_id ?? "__none__"}
          onValueChange={(val) => saveInlineField(task.id, { company_id: val === "__none__" ? null : val })}
        >
          <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-70 transition-opacity">
            {task.company
              ? <span className="text-[10px] font-black px-3 py-1 bg-[#ffd54f]/20 text-[#735c00] rounded-full uppercase tracking-widest">{task.company.name}</span>
              : <span className="text-sm text-gray-300">—</span>
            }
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
            <SelectItem value="__none__">None</SelectItem>
            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>

      {/* Area */}
      <td className="py-5 px-8">
        <Select
          value={task.area ?? "__none__"}
          onValueChange={(val) => saveInlineField(task.id, { area: val === "__none__" ? null : val })}
        >
          <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-70 transition-opacity">
            {task.area
              ? <span className="text-[10px] font-black px-3 py-1 bg-gray-100 text-gray-500 rounded-full uppercase tracking-widest">{task.area}</span>
              : <span className="text-sm text-gray-300">—</span>
            }
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
            <SelectItem value="__none__">None</SelectItem>
            {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>

      {/* Status */}
      <td className="py-5 px-8">
        <Select
          value={task.status}
          onValueChange={(val) => saveInlineField(task.id, { status: val })}
        >
          <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-70 transition-opacity">
            <StatusBadge status={task.status} />
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="review">Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Priority */}
      <td className="py-5 px-8">
        <Select
          value={task.priority}
          onValueChange={(val) => saveInlineField(task.id, { priority: val })}
        >
          <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-70 transition-opacity">
            <PriorityBadge priority={task.priority} />
          </SelectTrigger>
          <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Assignee */}
      {showAssignee && (
        <td className="py-5 px-8">
          <Select
            value={task.assignee_id ?? "__none__"}
            onValueChange={(val) => saveInlineField(task.id, { assignee_id: val === "__none__" ? null : val })}
          >
            <SelectTrigger className="border-none shadow-none p-0 h-auto bg-transparent w-auto focus:ring-0 focus:outline-none focus:ring-offset-0 outline-none cursor-pointer hover:opacity-70 transition-opacity">
              {task.assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar name={task.assignee.name} size="sm" className="ring-2 ring-white" />
                  <span className="text-xs font-bold text-gray-700">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-xs font-medium italic text-gray-300">Unassigned</span>
              )}
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
              <SelectItem value="__none__">Unassigned</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
      )}

      {/* Due Date */}
      <td
        className="py-5 px-8"
        onClick={() => !inlineEditingId && startInlineEdit(task.id, "due_date", task.due_date ? task.due_date.slice(0, 10) : "")}
      >
        {inlineEditingId === task.id && inlineField === "due_date" ? (
          <input
            autoFocus
            type="date"
            value={inlineValue}
            onChange={(e) => setInlineValue(e.target.value)}
            onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
            onBlur={() => saveInlineText(task)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveInlineText(task);
              if (e.key === "Escape") cancelInlineEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-bold text-gray-900 bg-[#ffd54f]/10 border-b-2 border-[#ffd54f] outline-none rounded-lg px-2 py-1"
          />
        ) : (
          <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-[#735c00] transition-colors">
            {task.due_date
              ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : <span className="text-gray-300">—</span>
            }
          </span>
        )}
      </td>

      {/* Time Left */}
      <td className="py-5 px-8">
        <TimeLeftDisplay dueDate={task.due_date} />
      </td>

      {/* Actions */}
      <td className="py-5 px-8">
        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(task)}
            className="p-2 bg-[#fbfaf1] text-gray-400 hover:text-[#735c00] rounded-xl transition-all active:scale-95"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-2 bg-[#fbfaf1] text-gray-400 hover:text-amber-600 rounded-xl transition-all active:scale-95"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            disabled={isDeleting}
            className="p-2 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </td>
    </tr>
  );
});
