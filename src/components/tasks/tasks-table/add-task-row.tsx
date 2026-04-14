import React from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company, Employee, AREA_OPTIONS } from "./types";

interface AddTaskRowProps {
  newTask: any;
  setNewTask: (val: any) => void;
  onAdd: () => void;
  onCancel: () => void;
  isPending: boolean;
  companies: Company[];
  employees: Employee[];
  showAssignee: boolean;
  colCount: number;
}

export function AddTaskRow({
  newTask,
  setNewTask,
  onAdd,
  onCancel,
  isPending,
  companies,
  employees,
  showAssignee,
  colCount,
}: AddTaskRowProps) {
  return (
    <tr className="bg-[#ffd54f]/5 border-none">
      {/* Title */}
      <td className="py-5 px-8 text-sm">
        <input
          autoFocus
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask((p: any) => ({ ...p, title: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
            if (e.key === "Escape") onCancel();
          }}
          placeholder="New task title..."
          className="w-full text-sm font-bold text-gray-800 bg-[#fbfaf1] border-none rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#ffd54f]/50 placeholder:text-gray-300 transition-all"
        />
      </td>
      {/* Company */}
      <td className="py-5 px-8">
        <Select 
          value={newTask.company_id || "__none__"} 
          onValueChange={(v) => setNewTask((p: any) => ({ ...p, company_id: v === "__none__" ? "" : (v ?? "") }))}
        >
          <SelectTrigger className="h-10 text-xs bg-[#fbfaf1] border-none rounded-xl w-[130px] outline-none focus:ring-2 focus:ring-[#ffd54f]/50">
            <SelectValue placeholder="Company" />
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
          value={newTask.area || "__none__"} 
          onValueChange={(v) => setNewTask((p: any) => ({ ...p, area: v === "__none__" ? "" : (v ?? "") }))}
        >
          <SelectTrigger className="h-10 text-xs bg-[#fbfaf1] border-none rounded-xl w-[130px] outline-none focus:ring-2 focus:ring-[#ffd54f]/50">
            <SelectValue placeholder="Area" />
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
          value={newTask.status} 
          onValueChange={(v) => setNewTask((p: any) => ({ ...p, status: v ?? "" }))}
        >
          <SelectTrigger className="h-10 text-xs bg-[#fbfaf1] border-none rounded-xl w-[130px] outline-none focus:ring-2 focus:ring-[#ffd54f]/50">
            <SelectValue />
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
          value={newTask.priority} 
          onValueChange={(v) => setNewTask((p: any) => ({ ...p, priority: v ?? "" }))}
        >
          <SelectTrigger className="h-10 text-xs bg-[#fbfaf1] border-none rounded-xl w-[120px] outline-none focus:ring-2 focus:ring-[#ffd54f]/50">
            <SelectValue />
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
            value={newTask.assignee_id || "__none__"} 
            onValueChange={(v) => setNewTask((p: any) => ({ ...p, assignee_id: v === "__none__" ? "" : (v ?? "") }))}
          >
            <SelectTrigger className="h-10 text-xs bg-[#fbfaf1] border-none rounded-xl w-[140px] outline-none focus:ring-2 focus:ring-[#ffd54f]/50">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
              <SelectItem value="__none__">Unassigned</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </td>
      )}
      {/* Due Date */}
      <td className="py-5 px-8">
        <input
          type="date"
          value={newTask.due_date}
          onFocus={(e) => { try { e.target.showPicker(); } catch (err) {} }}
          onChange={(e) => setNewTask((p: any) => ({ ...p, due_date: e.target.value }))}
          className="text-xs font-bold text-gray-600 bg-[#fbfaf1] border-none rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#ffd54f]/50"
        />
      </td>
      {/* Time Left — blank */}
      <td className="py-5 px-8 text-gray-300 text-sm">—</td>
      {/* Add / Cancel */}
      <td className="py-5 px-8">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onAdd}
            disabled={!newTask.title.trim() || isPending}
            className="px-5 py-2 text-xs font-black bg-[#1c1b1a] hover:bg-black text-white rounded-full transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-black/10"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}
