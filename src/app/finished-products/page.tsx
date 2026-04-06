"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Archive, Truck, ExternalLink } from "lucide-react";
import { useUIStore } from "@/lib/stores";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

async function fetchFinishedProducts() {
  const res = await fetch("/api/finished-products");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchPowderStock() {
  const res = await fetch("/api/powder-stock");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Flavor {
  id: string;
  name: string;
}

interface FinishedProduct {
  id: string;
  flavor_id: string;
  flavor: Flavor;
  quantity: number;
  batch_reference: string | null;
  created_at: string;
}

interface PowderStock {
  id: number;
  total_from_batches: number;
  total_sent: number;
  available: number;
}

const THIRD_PARTY_OPTIONS = [
  { value: "ABC Packers", label: "ABC Packers" },
  { value: "XYZ Packaging", label: "XYZ Packaging" },
  { value: "Other", label: "Other (Manual)" },
];

export default function FinishedProductsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [sendOpen, setSendOpen] = useState(false);
  const [formData, setFormData] = useState({
    third_party: "ABC Packers",
    third_party_other: "",
    bag_size: 5 as number,
    bag_count: "" as string | number,
  });

  const { data: finishedProducts, isLoading } = useQuery({
    queryKey: ["finished-products"],
    queryFn: fetchFinishedProducts,
    refetchInterval: 5000,
  });

  const { data: powderStock } = useQuery({
    queryKey: ["powder-stock"],
    queryFn: fetchPowderStock,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const thirdPartyName = data.third_party === "Other" ? data.third_party_other : data.third_party;
      
      if (!thirdPartyName.trim()) {
        throw new Error("Please enter 3rd party name");
      }

      const bagCountNum = parseInt(data.bag_count as string) || 0;
      const res = await fetch("/api/packing-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          third_party_name: thirdPartyName,
          bag_size: data.bag_size,
          bag_count: bagCountNum,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      queryClient.invalidateQueries({ queryKey: ["powder-stock"] });
      setSendOpen(false);
      setFormData({
        third_party: "ABC Packers",
        third_party_other: "",
        bag_size: 5,
        bag_count: "",
      });
      addNotification({ type: "success", message: "Powder sent to 3rd party!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const bagCountNum = parseInt(formData.bag_count as string) || 0;
  const totalPowder = (finishedProducts as FinishedProduct[] || []).reduce((sum, p) => sum + p.quantity, 0);
  const totalKg = formData.bag_size * bagCountNum;
  const availableStock = powderStock ? (powderStock as PowderStock).available : totalPowder;
  const canSend = availableStock >= totalKg && totalKg > 0;

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
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
          Finished Products Storage
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/packing-logs">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-yellow-50 cursor-pointer"
              style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
            >
              <Truck className="w-4 h-4" />
              Packing Logs
            </button>
          </Link>
          <Link href="/packing-receives">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-yellow-50 cursor-pointer"
              style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
            >
              <Package className="w-4 h-4" />
              Receive
            </button>
          </Link>
          <button 
            onClick={() => setSendOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
            disabled={(finishedProducts as FinishedProduct[] || []).length === 0}
          >
            <Truck className="w-4 h-4" />
            Send to 3rd Party
          </button>
        </div>
      </div>

      {(finishedProducts as FinishedProduct[] || []).length === 0 ? (
        <div className="text-center py-16">
          <Archive className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "#C9A83A" }} />
          <p className="text-lg font-medium" style={{ color: "#C9A83A" }}>No finished products yet</p>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>
            Create batches and mark them as "Sent in Factory" to add finished products
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Powder Stock KPI */}
          {powderStock ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#FEF9C3" }}>
                <p className="text-sm" style={{ color: "#E8C547" }}>Available</p>
                <p className="text-3xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{(powderStock as PowderStock).available.toFixed(2)} kg</p>
              </div>
              <div className="p-5 rounded-xl border" style={{ borderColor: "#F9731630", backgroundColor: "#FFF7ED" }}>
                <p className="text-sm" style={{ color: "#F97316" }}>Sent to Packing</p>
                <p className="text-3xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{(powderStock as PowderStock).total_sent.toFixed(2)} kg</p>
              </div>
              <div className="p-5 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
                <p className="text-sm" style={{ color: "#16A34A" }}>Received</p>
                <p className="text-3xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{(powderStock as PowderStock).total_from_batches.toFixed(2)} kg</p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold" style={{ color: "#16A34A" }}>Received</p>
                  <p className="text-4xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{totalPowder.toFixed(2)} kg</p>
                </div>
                <Package className="w-12 h-12" style={{ color: "#16A34A" }} />
              </div>
            </div>
          )}

          {/* All Entries Table */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: "#1A1A1A" }}>All Entries</h2>
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#F5F4EE" }}>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Powder</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Batch Ref</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Quantity (kg)</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(finishedProducts as FinishedProduct[]).map((fp, index) => (
                    <tr 
                      key={fp.id}
                      style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
                    >
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>{fp.flavor?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#E8C547" }}>{fp.batch_reference || "—"}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#16A34A" }}>{fp.quantity.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>{new Date(fp.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Send to 3rd Party Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "450px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              Send to 3rd Party for Packing
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 3rd Party Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>3rd Party Company</label>
              <select
                value={formData.third_party}
                onChange={(e) => setFormData({ ...formData, third_party: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border text-base"
                style={{ borderColor: "#E8C547" }}
              >
                {THIRD_PARTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Manual Input for Other */}
            {formData.third_party === "Other" && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>Company Name</label>
                <Input
                  type="text"
                  value={formData.third_party_other}
                  onChange={(e) => setFormData({ ...formData, third_party_other: e.target.value })}
                  placeholder="Enter company name"
                  style={{ borderColor: "#E8C547" }}
                />
              </div>
            )}

            {/* Bag Size */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>Bag Size</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bag_size"
                    value={5}
                    checked={formData.bag_size === 5}
                    onChange={() => setFormData({ ...formData, bag_size: 5 })}
                    style={{ accentColor: "#E8C547" }}
                  />
                  <span style={{ color: "#1A1A1A" }}>5 kg</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="bag_size"
                    value={10}
                    checked={formData.bag_size === 10}
                    onChange={() => setFormData({ ...formData, bag_size: 10 })}
                    style={{ accentColor: "#E8C547" }}
                  />
                  <span style={{ color: "#1A1A1A" }}>10 kg</span>
                </label>
              </div>
            </div>

            {/* Bag Count */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>Number of Bags</label>
              <Input
                type="number"
                min="1"
                value={formData.bag_count}
                onChange={(e) => setFormData({ ...formData, bag_count: e.target.value })}
                placeholder="Enter number of bags"
                style={{ borderColor: "#E8C547" }}
              />
            </div>

            {/* Summary */}
            <div className="p-4 rounded-lg border" style={{ backgroundColor: "#F5F4EE", borderColor: "#E8C54720" }}>
              <div className="flex justify-between items-center">
                <span style={{ color: "#1A1A1A" }}>Total:</span>
                <span className="font-bold" style={{ color: "#1A1A1A" }}>{totalKg} kg</span>
              </div>
              {!canSend && totalKg > 0 && (
                <p className="text-sm mt-2" style={{ color: "#DC2626" }}>
                  Not enough powder in stock. Available: {availableStock.toFixed(2)} kg
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setSendOpen(false)}
              className="flex-1 h-12 text-base font-medium"
              style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => sendMutation.mutate(formData)}
              disabled={!canSend || sendMutation.isPending}
              className="flex-1 h-12 text-base font-bold"
              style={{ 
                backgroundColor: canSend ? "#E8C547" : "#E5E5E5", 
                color: canSend ? "#1A1A1A" : "#9CA3AF",
                cursor: canSend ? "pointer" : "not-allowed"
              }}
            >
              {sendMutation.isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
