import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { Task, Company, Employee, CreateTaskInput } from "./types";

export function useTasks(currentUserId?: string, filterAssigneeId?: string) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, areaFilter, companyFilter]);

  // ── Data queries ───────────────────────────────────────────────────────────
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["active-companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies?active=true");
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      const json = await res.json();
      return json.data || json || [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", { search: debouncedSearch, statusFilter, priorityFilter, areaFilter, companyFilter, page, filterAssigneeId }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        status: statusFilter,
        priority: priorityFilter,
        area: areaFilter,
        company_id: companyFilter === "all" ? "" : companyFilter,
      });
      if (filterAssigneeId) params.append("assignee_id", filterAssigneeId);
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const tasks = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // ── Real-time ──────────────────────────────────────────────────────────────
  const handleRealtimeChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [queryClient]);

  useRealtimeSubscription({ table: "tasks", onMessage: handleRealtimeChange, enabled: !!currentUserId });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task deleted" });
    },
    onError: (err: Error) => addNotification({ type: "error", message: err.message }),
  });

  const updateInlineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (err: Error) => addNotification({ type: "error", message: err.message }),
  });

  const createInlineMutation = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          company_id: data.company_id || null,
          area: data.area || null,
          assignee_id: data.assignee_id || null,
          due_date: data.due_date || null,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      addNotification({ type: "success", message: "Task created" });
    },
    onError: (err: Error) => addNotification({ type: "error", message: err.message }),
  });

  return {
    tasks,
    isLoading,
    pagination,
    companies,
    employees,
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
    page,
    setPage,
    limit,
    deleteMutation,
    updateInlineMutation,
    createInlineMutation,
  };
}
