"use client";

import { useQuery } from "@tanstack/react-query";
import { Truck, Archive } from "lucide-react";
import Link from "next/link";

async function fetchPackingLogs() {
  const res = await fetch("/api/packing-logs");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface PackingLog {
  id: string;
  third_party_name: string;
  bag_size: number;
  bag_count: number;
  total_kg: number;
  created_at: string;
}

export default function PackingLogsPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["packing-logs"],
    queryFn: fetchPackingLogs,
    refetchInterval: 30000,
  });

  const logsList: PackingLog[] = logs || [];
  const totalSent = logsList.reduce((sum, log) => sum + log.total_kg, 0);
  const totalBags = logsList.reduce((sum, log) => sum + log.bag_count, 0);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#E8C547" }}></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Packing Logs</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>3rd party dispatch records</p>
        </div>
        <Link href="/finished-products">
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-yellow-50 cursor-pointer"
            style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
          >
            ← Back to Finished Products
          </button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span className="text-sm" style={{ color: "#16A34A" }}>Total Dispatches</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{logsList.length}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span className="text-sm" style={{ color: "#16A34A" }}>Total Powder Sent</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{totalSent.toFixed(2)} kg</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span className="text-sm" style={{ color: "#16A34A" }}>Total Bags</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{totalBags}</p>
        </div>
      </div>

      {/* Table */}
      {logsList.length === 0 ? (
        <div className="text-center py-16">
          <Truck className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "#C9A83A" }} />
          <p className="text-lg font-medium" style={{ color: "#C9A83A" }}>No packing logs yet</p>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>
            Send powder to 3rd party from Finished Products page
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F5F4EE" }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>3rd Party</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Bag Size</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Bags</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Total (kg)</th>
              </tr>
            </thead>
            <tbody>
              {logsList.map((log, index) => (
                <tr 
                  key={log.id}
                  style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
                >
                  <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {log.third_party_name}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                    {log.bag_size} kg
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                    {log.bag_count}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: "#16A34A" }}>
                    {log.total_kg.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
