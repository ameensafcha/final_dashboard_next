"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Package, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

async function fetchRawMaterialLogs(rawMaterialId?: string) {
  const url = rawMaterialId 
    ? `/api/raw-material-logs?raw_material_id=${rawMaterialId}`
    : "/api/raw-material-logs";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchRawMaterials() {
  const res = await fetch("/api/raw-materials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface RawMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface RawMaterialLog {
  id: string;
  raw_material_id: number;
  quantity: number;
  type: string;
  reference_id: string | null;
  created_at: string;
  raw_material?: RawMaterial;
}

export default function RawMaterialLogsPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");

  const { data: materials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: fetchRawMaterials,
    refetchInterval: 30000,
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["raw-material-logs", selectedMaterial],
    queryFn: () => fetchRawMaterialLogs(selectedMaterial || undefined),
    refetchInterval: 30000,
  });

  const { data: allLogs } = useQuery({
    queryKey: ["raw-material-logs-all"],
    queryFn: () => fetchRawMaterialLogs(undefined),
    refetchInterval: 30000,
  });

  const materialMap = new Map((materials || []).map((m: RawMaterial) => [m.id, m]));

  const logsList: RawMaterialLog[] = selectedMaterial ? (logs || []) : (allLogs || []);
  const sortedLogs = [...logsList].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/inventory/raw-materials"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-yellow-50 cursor-pointer"
            style={{ color: "#E8C547" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Raw Material Logs</h1>
            <p className="text-sm mt-1" style={{ color: "#A78BFA" }}>Track all material movements</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Filter by Material:</label>
        <select
          value={selectedMaterial}
          onChange={(e) => setSelectedMaterial(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm cursor-pointer"
          style={{ borderColor: "#E8C54720", color: "#1A1A1A", minWidth: "200px" }}
        >
          <option value="">All Materials</option>
          {materials?.map((m: RawMaterial) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span className="text-sm font-medium" style={{ color: "#16A34A" }}>Total Purchases</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#16A34A" }}>
            {logsList.filter(l => l.type === "purchase").length}
          </p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#DC262630", backgroundColor: "#FEF2F2" }}>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" style={{ color: "#DC2626" }} />
            <span className="text-sm font-medium" style={{ color: "#DC2626" }}>Total Used in Batches</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#DC2626" }}>
            {logsList.filter(l => l.type === "batch_used").length}
          </p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#FAF5FF" }}>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="text-sm font-medium" style={{ color: "#E8C547" }}>Total Movements</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#E8C547" }}>
            {logsList.length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#FAF5FF" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date/Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Material</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log, index) => {
              const material = materialMap.get(log.raw_material_id) as RawMaterial | undefined;
              return (
                <tr 
                  key={log.id}
                  style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#FAF5FF" }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {material?.name || `Material #${log.raw_material_id}`}
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: log.type === "purchase" ? "#DCFCE7" : "#FEE2E2",
                        color: log.type === "purchase" ? "#16A34A" : "#DC2626"
                      }}
                    >
                      {log.type === "purchase" ? "Purchase" : "Batch Used"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium" style={{ color: log.type === "purchase" ? "#16A34A" : "#DC2626" }}>
                      {log.type === "purchase" ? "+" : "-"}{log.quantity}
                    </span>
                    <span className="text-xs ml-1" style={{ color: "#A78BFA" }}>
                      {material?.unit || "kg"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sortedLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-12 h-12 opacity-30" style={{ color: "#A78BFA" }} />
                    <p className="font-medium" style={{ color: "#A78BFA" }}>No logs found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
