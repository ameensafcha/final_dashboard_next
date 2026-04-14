import React from "react";
import { Search, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company, AREA_OPTIONS } from "./types";

interface TaskFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  priorityFilter: string;
  setPriorityFilter: (val: string) => void;
  areaFilter: string;
  setAreaFilter: (val: string) => void;
  companyFilter: string;
  setCompanyFilter: (val: string) => void;
  companies: Company[];
  onAddTask: () => void;
  showAddButton: boolean;
}

export function TaskFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  areaFilter,
  setAreaFilter,
  companyFilter,
  setCompanyFilter,
  companies,
  onAddTask,
  showAddButton,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none">
      <div className="flex flex-wrap gap-4 items-center flex-1 w-full md:w-auto">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-xs">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Search</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-11 pr-4 py-3 bg-[#fbfaf1] border-none rounded-2xl text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-[#ffd54f]/50 placeholder:text-gray-300"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Status</span>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="w-[150px] h-11 bg-[#fbfaf1] border-none rounded-2xl text-xs font-black text-gray-700 focus:ring-2 focus:ring-[#ffd54f]/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
              <SelectItem value="all">Status: All</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Priority</span>
          <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val || "all")}>
            <SelectTrigger className="w-[150px] h-11 bg-[#fbfaf1] border-none rounded-2xl text-xs font-black text-gray-700 focus:ring-2 focus:ring-[#ffd54f]/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
              <SelectItem value="all">Priority: All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Area</span>
          <Select value={areaFilter} onValueChange={(val) => setAreaFilter(val || "all")}>
            <SelectTrigger className="w-[150px] h-11 bg-[#fbfaf1] border-none rounded-2xl text-xs font-black text-gray-700 focus:ring-2 focus:ring-[#ffd54f]/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
              <SelectItem value="all">Area: All</SelectItem>
              {AREA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Company</span>
          <Select value={companyFilter} onValueChange={(val) => setCompanyFilter(val || "all")}>
            <SelectTrigger className="w-[150px] h-11 bg-[#fbfaf1] border-none rounded-2xl text-xs font-black text-gray-700 focus:ring-2 focus:ring-[#ffd54f]/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/80 backdrop-blur-2xl border-none shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-2xl">
              <SelectItem value="all">Company: All</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showAddButton && (
        <button
          onClick={onAddTask}
          className="w-full md:w-auto px-8 py-3 bg-[#1c1b1a] hover:bg-black text-white font-black rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-sm shadow-xl shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      )}
    </div>
  );
}
