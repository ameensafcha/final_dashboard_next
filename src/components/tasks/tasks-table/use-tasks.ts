"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import { Task, Company, Employee, CreateTaskInput } from "./types";

export function useTasks(currentUserId?: string, filterAssigneeId?: string) {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const limit = 20;

  // Local state for the search input — debounced before writing to URL
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  // All other filters read directly from URL (persisted across refreshes)
  const statusFilter  = searchParams.get("status")   ?? "all";
  const priorityFilter = searchParams.get("priority") ?? "all";
  const areaFilter    = searchParams.get("area")      ?? "all";
  const companyFilter = searchParams.get("company")   ?? "all";
  const page          = Number(searchParams.get("page") ?? "1");

  // ── URL helper ─────────────────────────────────────────────────────────────
  // "all", "", "1" are defaults — remove them to keep URL clean
  const setParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all" || value === "1") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), router, pathname]);

  // Debounce search → URL, reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => setParams({ q: search, page: "1" }), 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Setters for filter dropdowns (all reset page to 1)
  const setStatusFilter   = useCallback((val: string) => setParams({ status: val,   page: "1" }), [setParams]);
  const setPriorityFilter = useCallback((val: string) => setParams({ priority: val, page: "1" }), [setParams]);
  const setAreaFilter     = useCallback((val: string) => setParams({ area: val,     page: "1" }), [setParams]);
  const setCompanyFilter  = useCallback((val: string) => setParams({ company: val,  page: "1" }), [setParams]);
  const setPage = useCallback((updater: number | ((prev: number) => number)) => {
    const next = typeof updater === "function" ? updater(page) : updater;
    setParams({ page: next.toString() });
  }, [page, setParams]);

  // debouncedSearch = what's actually in the URL (updated after 300 ms)
  const debouncedSearch = searchParams.get("q") ?? "";

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
          start_date: data.start_date || null,
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
