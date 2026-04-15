import { Search, Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTriggerStyled,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Company, AREA_OPTIONS } from "./types";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "": "",
  all: "",
  not_started: "text-[var(--muted)]",
  in_progress: "text-[var(--primary)]",
  review: "text-[var(--info)]",
  completed: "text-[var(--success)]",
};

const priorityColors: Record<string, string> = {
  "": "",
  all: "",
  low: "text-[var(--muted)]",
  medium: "text-[var(--info)]",
  high: "text-[var(--warning)]",
  urgent: "text-[var(--error)]",
};

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
  companies = [],
  onAddTask,
  showAddButton,
}: TaskFiltersProps) {
  
  const formatStatus = (status?: string) => {
    if (!status || status === "all") return "All Status";
    return status.replace(/_/g, " ");
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-[var(--surface-container-lowest)] p-6 rounded-[var(--radius-xl)] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border-none">
      <div className="flex flex-wrap gap-4 items-center flex-1 w-full md:w-auto">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-xs">
          <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] px-2">Search</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="input-field w-full pl-11 pr-4 py-3 text-sm font-semibold"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] px-2">Status</span>
          <DropdownMenu>
            <DropdownMenuTriggerStyled>
              <span className={cn("truncate capitalize", statusColors[statusFilter] || "")}>
                {formatStatus(statusFilter)}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </DropdownMenuTriggerStyled>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup 
                value={statusFilter} 
                onValueChange={(val) => setStatusFilter(val || "all")}
              >
                <DropdownMenuRadioItem value="all">All Status</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="not_started">Not Started</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="in_progress">In Progress</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="review">Review</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Priority</span>
          <DropdownMenu>
            <DropdownMenuTriggerStyled>
              <span className={cn("truncate capitalize", priorityColors[priorityFilter] || "")}>
                {priorityFilter === "all" || !priorityFilter ? "All Priority" : priorityFilter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </DropdownMenuTriggerStyled>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup 
                value={priorityFilter} 
                onValueChange={(val) => setPriorityFilter(val || "all")}
              >
                <DropdownMenuRadioItem value="all">All Priority</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Area</span>
          <DropdownMenu>
            <DropdownMenuTriggerStyled>
              <span className="truncate">
                {areaFilter === "all" || !areaFilter ? "All Areas" : areaFilter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </DropdownMenuTriggerStyled>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup 
                value={areaFilter} 
                onValueChange={(val) => setAreaFilter(val || "all")}
              >
                <DropdownMenuRadioItem value="all">All Areas</DropdownMenuRadioItem>
                {AREA_OPTIONS.map(a => <DropdownMenuRadioItem key={a} value={a}>{a}</DropdownMenuRadioItem>)}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Company</span>
          <DropdownMenu>
            <DropdownMenuTriggerStyled>
              <span className="truncate">
                {companyFilter === "all" || !companyFilter 
                  ? "All Companies" 
                  : companies?.find(c => c.id === companyFilter)?.name || "All Companies"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
            </DropdownMenuTriggerStyled>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup 
                value={companyFilter} 
                onValueChange={(val) => setCompanyFilter(val || "all")}
              >
                <DropdownMenuRadioItem value="all">All Companies</DropdownMenuRadioItem>
                {companies?.map((company) => (
                  <DropdownMenuRadioItem key={company.id} value={company.id}>{company.name}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showAddButton && (
        <button
          onClick={onAddTask}
          className="btn-primary w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2 text-sm shadow-xl shadow-black/10"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      )}
    </div>
  );
}