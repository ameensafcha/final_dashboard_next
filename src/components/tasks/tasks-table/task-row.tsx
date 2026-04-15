import React, { useState, useEffect } from "react";
import { Eye, Edit2, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/ui/status-badge";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Task, Company, Employee, AREA_OPTIONS } from "./types";

const statusColors: Record<string, string> = {
  "": "",
  not_started: "text-[var(--muted)]",
  in_progress: "text-[var(--warning)]",
  review: "text-[var(--info)]",
  completed: "text-[var(--success)]",
};

const priorityColors: Record<string, string> = {
  "": "",
  low: "text-[var(--muted)]",
  medium: "text-[var(--info)]",
  high: "text-[var(--warning)]",
  urgent: "text-[var(--error)]",
};

interface TaskRowProps {
  task: Task;
  inlineEditingId: string | null;
  inlineField: "title" | "due_date" | null;
  inlineValue: string;
  setInlineValue: (val: string) => void;
  startInlineEdit: (taskId: string, field: "title" | "due_date", value: string) => void;
  cancelInlineEdit: () => void;
  saveInlineText: (task: Task) => void;
  saveInlineField: (id: string, data: Record<string, unknown>, onComplete?: () => void) => void;
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
  if (!dueDate) return <span className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">-</span>;
  
  const now = new Date().getTime();
  const daysLeft = Math.ceil((new Date(dueDate).getTime() - now) / (1000 * 60 * 60 * 24));

  return (
    <span className={cn(
      "text-xs font-bold px-3 py-1 rounded-full",
      daysLeft < 0 ? "bg-[var(--error-bg)] text-[var(--error)]" :
      daysLeft <= 2 ? "bg-[var(--warning-bg)] text-[var(--warning)]" :
      daysLeft <= 7 ? "bg-[var(--warning-bg)]/60 text-[var(--warning)]" :
      "bg-[var(--success-bg)] text-[var(--success)]"
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
  const [updatingCell, setUpdatingCell] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (updatingTaskId !== task.id) {
      setUpdatingCell(null);
      setDatePickerOpen(false);
    }
  }, [updatingTaskId, task.id]);

  const isUpdatingTitle = updatingTaskId === task.id && updatingCell === "title";
  const isUpdatingCompany = updatingTaskId === task.id && updatingCell === "company";
  const isUpdatingArea = updatingTaskId === task.id && updatingCell === "area";
  const isUpdatingStatus = updatingTaskId === task.id && updatingCell === "status";
  const isUpdatingPriority = updatingTaskId === task.id && updatingCell === "priority";
  const isUpdatingAssignee = updatingTaskId === task.id && updatingCell === "assignee";
  const isUpdatingDueDate = updatingTaskId === task.id && updatingCell === "due_date";

  return (
    <tr className="hover:bg-[var(--surface)] transition-colors group border-none">
      {/* Title */}
      <td
        className="py-5 px-8 min-w-[250px]"
        onClick={() => !inlineEditingId && startInlineEdit(task.id, "title", task.title)}
      >
        {inlineEditingId === task.id && inlineField === "title" ? (
          <input
            autoFocus
            type="text"
            value={inlineValue}
            onChange={(e) => setInlineValue(e.target.value)}
            onBlur={() => {
              setUpdatingCell("title");
              saveInlineText(task);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setUpdatingCell("title");
                saveInlineText(task);
              }
              if (e.key === "Escape") cancelInlineEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-bold text-[var(--foreground)] bg-[var(--accent)]/10 border-b-2 border-[var(--accent)] outline-none rounded-lg px-2 py-1"
          />
        ) : (
          <div className="cursor-pointer">
            <div className={cn("flex items-center gap-2", isUpdatingTitle && "opacity-50")}>
              {isUpdatingTitle && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />}
              <p className="font-bold text-sm text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                {task.title.length > 25 ? task.title.slice(0, 25) + "..." : task.title}
              </p>
            </div>
          </div>
        )}
      </td>

      {/* Company */}
      <td className="py-5 px-8">
        <DropdownMenu>
          <DropdownMenuTrigger 
            disabled={isUpdatingCompany}
            className={cn(
              "outline-none cursor-pointer p-0 bg-transparent border-none flex items-center gap-2",
              isUpdatingCompany && "opacity-50 pointer-events-none"
            )}
          >
            {isUpdatingCompany && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />}
            {task.company
              ? <span className="text-[10px] font-black px-3 py-1 bg-[var(--accent)]/20 text-[var(--primary)] rounded-full uppercase tracking-widest">{task.company.name}</span>
              : <span className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">Select</span>
            }
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={task.company_id ?? "__none__"}
              onValueChange={(val) => {
                setUpdatingCell("company");
                saveInlineField(task.id, { company_id: val === "__none__" ? null : val });
              }}
            >
              <DropdownMenuRadioItem value="__none__">None</DropdownMenuRadioItem>
              {companies.map(c => <DropdownMenuRadioItem key={c.id} value={c.id}>{c.name}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      {/* Area */}
      <td className="py-5 px-8">
        <DropdownMenu>
          <DropdownMenuTrigger 
            disabled={isUpdatingArea}
            className={cn(
              "outline-none cursor-pointer p-0 bg-transparent border-none flex items-center gap-2",
              isUpdatingArea && "opacity-50 pointer-events-none"
            )}
          >
            {isUpdatingArea && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />}
            {task.area
              ? <span className="text-[10px] font-black px-3 py-1 bg-[var(--surface-container)] text-[var(--muted)] rounded-full uppercase tracking-widest">{task.area}</span>
              : <span className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">Select</span>
            }
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={task.area ?? "__none__"}
              onValueChange={(val) => {
                setUpdatingCell("area");
                saveInlineField(task.id, { area: val === "__none__" ? null : val });
              }}
            >
              <DropdownMenuRadioItem value="__none__">None</DropdownMenuRadioItem>
              {AREA_OPTIONS.map(a => <DropdownMenuRadioItem key={a} value={a}>{a}</DropdownMenuRadioItem>)}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      {/* Status */}
      <td className="py-5 px-8">
        <DropdownMenu>
          <DropdownMenuTrigger 
            disabled={isUpdatingStatus}
            className={cn(
              "outline-none cursor-pointer p-0 bg-transparent border-none flex items-center gap-2",
              isUpdatingStatus && "opacity-50 pointer-events-none"
            )}
          >
            {isUpdatingStatus && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />}
            <StatusBadge status={task.status} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={task.status}
              onValueChange={(val) => {
                setUpdatingCell("status");
                saveInlineField(task.id, { status: val });
              }}
            >
              <DropdownMenuRadioItem value="not_started">Not Started</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="in_progress">In Progress</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="review">Review</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      {/* Priority */}
      <td className="py-5 px-8">
        <DropdownMenu>
          <DropdownMenuTrigger 
            disabled={isUpdatingPriority}
            className={cn(
              "outline-none cursor-pointer p-0 bg-transparent border-none flex items-center gap-2",
              isUpdatingPriority && "opacity-50 pointer-events-none"
            )}
          >
            {isUpdatingPriority && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />}
            <PriorityBadge priority={task.priority} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={task.priority}
              onValueChange={(val) => {
                setUpdatingCell("priority");
                saveInlineField(task.id, { priority: val });
              }}
            >
              <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      {/* Assignee */}
      {showAssignee && (
        <td className="py-5 px-8">
          <DropdownMenu>
            <DropdownMenuTrigger 
              disabled={isUpdatingAssignee}
              className={cn(
                "outline-none cursor-pointer p-0 bg-transparent border-none flex items-center gap-2",
                isUpdatingAssignee && "opacity-50 pointer-events-none"
              )}
            >
              {isUpdatingAssignee && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />}
              {task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee.name} size="sm" className="ring-2 ring-[var(--surface-container-lowest)]" />
                  <span className="text-xs font-bold text-[var(--foreground)]">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">Select</span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={task.assignee_id ?? "__none__"}
                onValueChange={(val) => {
                  setUpdatingCell("assignee");
                  saveInlineField(task.id, { assignee_id: val === "__none__" ? null : val });
                }}
              >
                <DropdownMenuRadioItem value="__none__">Unassigned</DropdownMenuRadioItem>
                {employees.map(e => <DropdownMenuRadioItem key={e.id} value={e.id}>{e.name}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      )}

      {/* Due Date (Using Shadcn Popover + Calendar) */}
      <td className="py-5 px-8">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger
            onClick={() => {
              setUpdatingCell("due_date");
              setDatePickerOpen(true);
            }}
            className={cn(
              "flex items-center gap-2 cursor-pointer hover:text-[#735c00] transition-colors outline-none bg-transparent border-none text-left min-w-[120px]",
              isUpdatingDueDate && "opacity-50 pointer-events-none"
            )}
          >
            {isUpdatingDueDate ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)] shrink-0" />
            ) : (
              <span className="text-xs font-bold text-[var(--muted)] flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 opacity-50" />
                {task.due_date ? (
                  format(new Date(task.due_date), "MMM d, yyyy")
                ) : (
                  <span className="text-xs font-bold text-[var(--muted)] hover:text-[var(--primary)] transition-colors cursor-pointer">Set date</span>
                )}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={task.due_date ? new Date(task.due_date) : undefined}
              onSelect={(date) => {
                saveInlineField(task.id, { due_date: date ? format(date, "yyyy-MM-dd") : null }, () => {
                  setDatePickerOpen(false);
                });
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </td>

      {/* Time Left */}
      <td className={cn("py-5 px-8 transition-opacity", isUpdatingDueDate && "opacity-50")}>
        <TimeLeftDisplay dueDate={task.due_date} />
      </td>

      {/* Actions */}
      <td className="py-5 px-8">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onView(task)}
            className="p-2 bg-[var(--surface-container)] text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--accent)]/20 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-2 bg-[var(--surface-container)] text-[var(--muted)] hover:text-[var(--warning)] hover:bg-[var(--warning-bg)] rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            disabled={isDeleting}
            className="p-2 bg-[var(--surface-container)] text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--error-bg)] rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
          </button>
        </div>
      </td>
    </tr>
  );
});