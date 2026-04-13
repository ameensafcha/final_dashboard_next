"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Factory, Package, CheckCircle, BookOpen, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores";
import { useState, useEffect } from "react";

async function fetchBatches() {
  const res = await fetch("/api/batches");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchFlavors() {
  const res = await fetch("/api/flavors");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchRawMaterials() {
  const res = await fetch("/api/raw-materials");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchFinishedProducts() {
  const res = await fetch("/api/finished-products");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

async function fetchEmployees() {
  const res = await fetch("/api/employees?active=true");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.employees || data.data || [];
}

interface Flavor {
  id: string;
  name: string;
}

interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Batch {
  id: string;
  batch_id: string;
  date: string;
  logged_by: string;
  raw_material_id: string | null;
  flavor_id: string;
  flavor: Flavor;
  leaves_in: number;
  powder_out: number;
  waste_loss: number;
  yield_percent: number;
  quality_check: boolean;
  status: string;
  notes: string | null;
  created_at: string;
}

interface FinishedProduct {
  id: string;
  flavor_id: string;
  flavor: Flavor;
  quantity: number;
  batch_reference: string | null;
  created_at: string;
}

const STATUSES = ["Draft", "Running", "Complete", "Sent in Factory"];

export default function ProductionPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSOP, setShowSOP] = useState(false);
  const [lastCreatedBatch, setLastCreatedBatch] = useState<Batch | null>(null);
  const [viewBatch, setViewBatch] = useState<Batch | null>(null);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editFinishedOpen, setEditFinishedOpen] = useState(false);
  const [selectedFlavorForEdit, setSelectedFlavorForEdit] = useState<FinishedProduct[]>([]);
  const [editFlavorName, setEditFlavorName] = useState("");
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    logged_by: "",
    raw_material_id: "",
    flavor_id: "",
    leaves_in: "",
    powder_out: "",
    quality_check: false,
    status: "Draft",
    notes: "",
  });

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: fetchBatches,
    refetchInterval: 30000,
  });

  const { data: flavors } = useQuery({
    queryKey: ["flavors"],
    queryFn: fetchFlavors,
    refetchInterval: 30000,
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: fetchRawMaterials,
    refetchInterval: 30000,
  });

  const { data: finishedProducts } = useQuery({
    queryKey: ["finished-products"],
    queryFn: fetchFinishedProducts,
    refetchInterval: 30000,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    staleTime: 60000,
  });

  const teamOptions = employees.length > 0 
    ? employees.map((emp: any) => emp.name) 
    : [];

  const { data: defaultRmSetting } = useQuery({
    queryKey: ["settings", "default_raw_material_id"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=default_raw_material_id");
      const json = await res.json();
      return json.data;
    },
  });

  const defaultRawMaterialId = defaultRmSetting?.value || "";
  const defaultRawMaterial = rawMaterials?.find((rm: RawMaterial) => rm.id === defaultRawMaterialId);

  const selectedFlavor = flavors?.find((f: Flavor) => f.id === formData.flavor_id);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Validate numeric values
      const leavesIn = parseFloat(data.leaves_in);
      const powderOut = parseFloat(data.powder_out);
      if (isNaN(leavesIn) || isNaN(powderOut) || leavesIn <= 0 || powderOut < 0) {
        throw new Error("Invalid numeric values: leaves and powder must be positive numbers");
      }
      
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          logged_by: data.logged_by,
          raw_material_id: data.raw_material_id,
          flavor_id: data.flavor_id,
          leaves_in: leavesIn,
          powder_out: powderOut,
          quality_check: data.quality_check,
          status: data.status,
          notes: data.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      setLastCreatedBatch(data);
      setShowConfirm(true);
      setOpen(false);
      addNotification({ type: "success", message: "Batch created!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/batches?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      setDeleteOpen(false);
      setDeleteId(null);
      addNotification({ type: "success", message: "Batch deleted!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const updateFinishedProductMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await fetch("/api/finished-products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      addNotification({ type: "success", message: "Quantity updated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      // Validate numeric values
      const leavesIn = parseFloat(data.leaves_in);
      const powderOut = parseFloat(data.powder_out);
      if (isNaN(leavesIn) || isNaN(powderOut) || leavesIn <= 0 || powderOut < 0) {
        throw new Error("Invalid numeric values: leaves and powder must be positive numbers");
      }
      
      const res = await fetch(`/api/batches?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          logged_by: data.logged_by,
          raw_material_id: data.raw_material_id,
          flavor_id: data.flavor_id,
          leaves_in: leavesIn,
          powder_out: powderOut,
          quality_check: data.quality_check,
          status: data.status,
          notes: data.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      queryClient.invalidateQueries({ queryKey: ["finished-products"] });
      setOpen(false);
      setEditBatch(null);
      resetForm();
      addNotification({ type: "success", message: "Batch updated!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      logged_by: "",
      raw_material_id: defaultRawMaterialId,
      flavor_id: "",
      leaves_in: "",
      powder_out: "",
      quality_check: false,
      status: "Draft",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.logged_by || !formData.raw_material_id || !formData.flavor_id || !formData.leaves_in || !formData.powder_out) {
      addNotification({ type: "error", message: "Please fill required fields" });
      return;
    }
    
    // Validate numeric values
    const leavesIn = parseFloat(formData.leaves_in);
    const powderOut = parseFloat(formData.powder_out);
    if (isNaN(leavesIn) || isNaN(powderOut) || leavesIn <= 0 || powderOut < 0) {
      addNotification({ type: "error", message: "Invalid numeric values: leaves and powder must be positive numbers" });
      return;
    }

    if (editBatch) {
      updateMutation.mutate({ id: editBatch.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditBatch(null);
    resetForm();
  };

  const handleEdit = (batch: Batch) => {
    setFormData({
      date: new Date(batch.date).toISOString().split("T")[0],
      logged_by: batch.logged_by,
      raw_material_id: batch.raw_material_id ? String(batch.raw_material_id) : "",
      flavor_id: batch.flavor_id,
      leaves_in: batch.leaves_in.toString(),
      powder_out: batch.powder_out.toString(),
      quality_check: batch.quality_check,
      status: batch.status,
      notes: batch.notes || "",
    });
    setEditBatch(batch);
    setOpen(true);
  };

  const calculateYield = () => {
    const leaves = parseFloat(formData.leaves_in);
    const powder = parseFloat(formData.powder_out);
    if (!isNaN(leaves) && !isNaN(powder) && leaves > 0) {
      return ((powder / leaves) * 100).toFixed(2);
    }
    return "0.00";
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: "#E8C547", borderTopColor: "transparent" }}></div>
    </div>
  );

  const batchList: Batch[] = batches || [];
  const totalBatches = batchList.length;
  const avgYield = totalBatches > 0 
    ? (batchList.reduce((sum, b) => sum + b.yield_percent, 0) / totalBatches).toFixed(1)
    : "0";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Production Batches</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Manage production batches</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSOP(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 hover:bg-amber-50 cursor-pointer"
            style={{ borderColor: "#E8C547", color: "#E8C547" }}
          >
            <BookOpen className="w-4 h-4" />
            SOP
          </button>
          <button
            onClick={() => { resetForm(); setOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#F97316", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            Add Batch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#F5F4EE" }}>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="text-sm" style={{ color: "#E8C547" }}>Total Batches</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>{totalBatches}</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#16A34A30", backgroundColor: "#F0FDF4" }}>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: "#16A34A" }} />
            <span className="text-sm" style={{ color: "#16A34A" }}>Avg Yield</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#16A34A" }}>{avgYield}%</p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#F5F4EE" }}>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5" style={{ color: "#E8C547" }} />
            <span className="text-sm" style={{ color: "#E8C547" }}>Complete</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>
            {batchList.filter(b => b.status === "Complete").length}
          </p>
        </div>
        <div className="p-4 rounded-xl border" style={{ borderColor: "#D9770630", backgroundColor: "#FFFBEB" }}>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5" style={{ color: "#D97706" }} />
            <span className="text-sm" style={{ color: "#D97706" }}>Running</span>
          </div>
          <p className="text-2xl font-bold mt-1" style={{ color: "#1A1A1A" }}>
            {batchList.filter(b => b.status === "Running").length}
          </p>
        </div>
      </div>

      <div 
        className="rounded-xl overflow-hidden border"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F5F4EE" }}>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Batch ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Team</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Raw Material</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Flavor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Raw Leaves (kg)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Powder (kg)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Yield %</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Quality</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batchList.map((item, index) => (
              <tr 
                key={item.id}
                style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
              >
                <td className="px-4 py-3">
                  <button 
                    onClick={() => setViewBatch(item)}
                    className="font-mono text-sm font-medium hover:underline cursor-pointer"
                    style={{ color: "#E8C547" }}
                  >
                    {item.batch_id}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                  {item.logged_by}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                  {item.raw_material_id ? rawMaterials?.find((rm: RawMaterial) => rm.id === item.raw_material_id)?.name || "-" : "-"}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                  {item.flavor?.name || "-"}
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#DC2626" }}>
                  {item.leaves_in}
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: "#16A34A" }}>
                  {item.powder_out}
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{ 
                      backgroundColor: item.yield_percent >= 70 ? "#DCFCE7" : item.yield_percent >= 65 ? "#FEF3C7" : "#FEE2E2",
                      color: item.yield_percent >= 70 ? "#16A34A" : item.yield_percent >= 65 ? "#D97706" : "#DC2626"
                    }}
                  >
                    {item.yield_percent.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.quality_check === true ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>Pass</span>
                  ) : item.quality_check === false ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>Fail</span>
                  ) : (
                    <span className="text-xs" style={{ color: "#9CA3AF" }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: item.status === "Sent in Factory" ? "#DCFCE7" : item.status === "Running" ? "#FEF3C7" : item.status === "Complete" ? "#F5F4EE" : "#F3F4F6",
                      color: item.status === "Sent in Factory" ? "#16A34A" : item.status === "Running" ? "#D97706" : item.status === "Complete" ? "#E8C547" : "#6B7280"
                    }}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setViewBatch(item)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-100 cursor-pointer"
                      style={{ color: "#E8C547", backgroundColor: "#F5F4EE" }}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-100 cursor-pointer"
                      style={{ color: "#E8C547", backgroundColor: "#F5F4EE" }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => { setDeleteId(item.id); setDeleteOpen(true); }}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 cursor-pointer" 
                      style={{ color: "#DC2626" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {batchList.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Factory className="w-12 h-12 opacity-30" style={{ color: "#C9A83A" }} />
                    <p className="font-medium" style={{ color: "#C9A83A" }}>No batches yet</p>
                    <p className="text-sm" style={{ color: "#C9A83A" }}>Create your first batch</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Batch Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>{editBatch ? "Edit Batch" : "Add Batch"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date & Team */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-12 text-base"
                  style={{ borderColor: "#E8C547", borderWidth: "2px" }}
                />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Team *</label>
                <select
                  value={formData.logged_by}
                  onChange={(e) => setFormData({ ...formData, logged_by: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border text-base"
                  style={{ borderColor: "#E8C547", borderWidth: "2px" }}
                  required
                >
                  {teamOptions.map((team: string) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Raw Material — auto from admin settings */}
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Raw Material</label>
                {defaultRawMaterial ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ borderColor: "#E8C547", borderWidth: "2px", backgroundColor: "#F5F4EE" }}>
                    <div>
                      <p className="text-base font-semibold" style={{ color: "#1A1A1A" }}>{defaultRawMaterial.name}</p>
                      <p className="text-sm mt-0.5" style={{ color: "#16A34A" }}>
                        Available: {defaultRawMaterial.quantity.toFixed(2)} {defaultRawMaterial.unit}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#E8C54720", color: "#C9A83A" }}>Auto</span>
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-lg border text-sm" style={{ borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#DC2626" }}>
                    No default raw material set. Go to Admin → Settings to configure.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Flavor *</label>
                <select
                  value={formData.flavor_id}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    flavor_id: e.target.value,
                  })}
                  className="w-full px-4 py-3 rounded-lg border text-base"
                  style={{ borderColor: "#E8C547", borderWidth: "2px" }}
                  required
                >
                  <option value="">Select Flavor</option>
                  {flavors?.map((f: Flavor) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

            {/* Production Output */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Raw Leaves (kg) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.leaves_in}
                  onChange={(e) => setFormData({ ...formData, leaves_in: e.target.value })}
                  placeholder="0.00"
                  required
                  className="h-12 text-base"
                  style={{ borderColor: "#E8C547", borderWidth: "2px" }}
                />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Powder Produced (kg) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.powder_out}
                  onChange={(e) => setFormData({ ...formData, powder_out: e.target.value })}
                  placeholder="0.00"
                  required
                  className="h-12 text-base"
                  style={{ borderColor: "#E8C547", borderWidth: "2px" }}
                />
              </div>
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Yield %</label>
                <div className="h-12 px-4 py-3 rounded-lg border text-xl font-bold" style={{ borderColor: "#E8C547", borderWidth: "2px", backgroundColor: "#F5F4EE", color: "#E8C547" }}>
                  {calculateYield()}%
                </div>
              </div>
            </div>

            {/* Quality & Status */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Quality Check</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, quality_check: true })}
                    className={`flex-1 py-3 rounded-lg text-base font-medium transition-all cursor-pointer ${
                      formData.quality_check ? "text-white" : "hover:bg-gray-100"
                    }`}
                    style={{ 
                      backgroundColor: formData.quality_check === true ? "#16A34A" : "#F3F4F6",
                      color: formData.quality_check === true ? "white" : "#16A34A",
                      border: formData.quality_check === true ? "none" : "2px solid #16A34A"
                    }}
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, quality_check: false })}
                    className={`flex-1 py-3 rounded-lg text-base font-medium transition-all cursor-pointer ${
                      formData.quality_check === false ? "text-white" : "hover:bg-gray-100"
                    }`}
                    style={{ 
                      backgroundColor: formData.quality_check === false ? "#DC2626" : "#F3F4F6",
                      color: formData.quality_check === false ? "white" : "#DC2626",
                      border: formData.quality_check === false ? "none" : "2px solid #DC2626"
                    }}
                  >
                    Fail
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: "#1A1A1A" }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border text-base"
                  style={{ borderColor: "#E8C547", borderWidth: "2px" }}
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#1A1A1A" }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-md border text-sm"
                style={{ borderColor: "#E8C54720" }}
              />
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button 
                type="button" 
                onClick={handleClose}
                className="h-12 px-6 text-base font-medium"
                style={{ borderColor: "#E8C547", color: "#E8C547" }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="h-12 px-8 text-base font-bold"
                style={{ backgroundColor: "#E8C547", color: "white" }}
              >
                {editBatch 
                  ? (updateMutation.isPending ? "Updating..." : "Update Batch")
                  : (createMutation.isPending ? "Saving..." : "Create Batch")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "500px" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#16A34A" }} className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              Batch Created Successfully!
            </DialogTitle>
          </DialogHeader>
          
          {lastCreatedBatch && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border" style={{ borderColor: "#E8C54730", backgroundColor: "#F5F4EE" }}>
                <p className="text-lg font-bold font-mono" style={{ color: "#E8C547" }}>{lastCreatedBatch.batch_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border" style={{ borderColor: "#E8C54720" }}>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>Flavor</p>
                  <p className="font-medium" style={{ color: "#1A1A1A" }}>{lastCreatedBatch.flavor?.name}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: "#E8C54720" }}>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>Team</p>
                  <p className="font-medium" style={{ color: "#1A1A1A" }}>{lastCreatedBatch.logged_by}</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: "#DC262630" }}>
                  <p className="text-xs" style={{ color: "#DC2626" }}>Raw Leaves</p>
                  <p className="font-medium" style={{ color: "#DC2626" }}>{lastCreatedBatch.leaves_in} kg</p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: "#16A34A30" }}>
                  <p className="text-xs" style={{ color: "#16A34A" }}>Powder</p>
                  <p className="font-medium" style={{ color: "#16A34A" }}>{lastCreatedBatch.powder_out} kg</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => {
                    setShowConfirm(false);
                    setLastCreatedBatch(null);
                  }}
                  className="flex-1 h-12 text-base font-medium"
                  style={{ backgroundColor: "#E8C547", color: "white" }}
                >
                  Done
                </Button>
                <Button 
                  onClick={() => {
                    if (lastCreatedBatch) {
                      setFormData({
                        date: new Date(lastCreatedBatch.date).toISOString().split("T")[0],
                        logged_by: lastCreatedBatch.logged_by,
                        raw_material_id: lastCreatedBatch.raw_material_id ? String(lastCreatedBatch.raw_material_id) : "",
                        flavor_id: lastCreatedBatch.flavor_id,
                        leaves_in: lastCreatedBatch.leaves_in.toString(),
                        powder_out: lastCreatedBatch.powder_out.toString(),
                        quality_check: lastCreatedBatch.quality_check,
                        status: lastCreatedBatch.status,
                        notes: lastCreatedBatch.notes || "",
                      });
                    }
                    setShowConfirm(false);
                    setLastCreatedBatch(null);
                    setOpen(true);
                  }}
                  className="flex-1 h-12 text-base font-medium"
                  style={{ borderColor: "#E8C547", color: "#E8C547" }}
                >
                  Create Similar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Batch Details Dialog */}
      <Dialog open={!!viewBatch} onOpenChange={(isOpen) => { if (!isOpen) setViewBatch(null); }}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              Batch Details: {viewBatch?.batch_id}
            </DialogTitle>
          </DialogHeader>
          
          {viewBatch && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border" style={{ borderColor: "#E8C54720" }}>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>Date</p>
                  <p className="font-medium" style={{ color: "#1A1A1A" }}>
                    {new Date(viewBatch.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: "#E8C54720" }}>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>Team</p>
                  <p className="font-medium" style={{ color: "#1A1A1A" }}>{viewBatch.logged_by}</p>
                </div>
              </div>

              {/* Production Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#FEE2E2" }}>
                  <p className="text-xs" style={{ color: "#DC2626" }}>Raw Leaves</p>
                  <p className="font-bold" style={{ color: "#DC2626" }}>{viewBatch.leaves_in}</p>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#DCFCE7" }}>
                  <p className="text-xs" style={{ color: "#16A34A" }}>Powder</p>
                  <p className="font-bold" style={{ color: "#16A34A" }}>{viewBatch.powder_out}</p>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#FEF3C7" }}>
                  <p className="text-xs" style={{ color: "#D97706" }}>Waste</p>
                  <p className="font-bold" style={{ color: "#D97706" }}>{viewBatch.waste_loss.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg text-center" style={{ backgroundColor: "#F5F4EE" }}>
                  <p className="text-xs" style={{ color: "#E8C547" }}>Yield</p>
                  <p className="font-bold" style={{ color: "#E8C547" }}>{viewBatch.yield_percent.toFixed(1)}%</p>
                </div>
              </div>

              {/* Status & Quality */}
              <div className="flex items-center gap-4">
                <span 
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: viewBatch.status === "Sent in Factory" ? "#DCFCE7" : viewBatch.status === "Running" ? "#FEF3C7" : viewBatch.status === "Complete" ? "#F5F4EE" : "#F3F4F6",
                    color: viewBatch.status === "Sent in Factory" ? "#16A34A" : viewBatch.status === "Running" ? "#D97706" : viewBatch.status === "Complete" ? "#E8C547" : "#6B7280"
                  }}
                >
                  {viewBatch.status}
                </span>
                <div className="flex items-center gap-1">
                  {viewBatch.quality_check === true ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#DCFCE7", color: "#16A34A" }}>Pass</span>
                  ) : viewBatch.quality_check === false ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>Fail</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}>Not Checked</span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewBatch.notes && (
                <div className="p-3 rounded-lg border" style={{ borderColor: "#E8C54720" }}>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>Notes</p>
                  <p className="text-sm" style={{ color: "#1A1A1A" }}>{viewBatch.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>Delete Batch</DialogTitle>
          </DialogHeader>
          <p style={{ color: "#1A1A1A" }}>
            Are you sure you want to delete this batch? Raw materials will be restored.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button onClick={() => setDeleteOpen(false)} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>
              Cancel
            </Button>
            <Button 
              onClick={() => deleteId && deleteMutation.mutate(deleteId)} 
              disabled={deleteMutation.isPending}
              style={{ backgroundColor: "#DC2626", color: "white" }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SOP Dialog */}
      <Dialog open={showSOP} onOpenChange={setShowSOP}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "640px", maxHeight: "90vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: "#1A1A1A" }}>
              <BookOpen className="w-5 h-5" style={{ color: "#E8C547" }} />
              Standard Operating Procedure
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {[
              {
                step: "1",
                title: "Raw Material Receiving",
                color: "#3B82F6",
                bg: "#EFF6FF",
                points: [
                  "Supplier se raw material aata hai",
                  "Receiving page par quantity, rate aur supplier enter karo",
                  "System automatically raw material stock update karta hai",
                ],
              },
              {
                step: "2",
                title: "Batch Production",
                color: "#F97316",
                bg: "#FFF7ED",
                points: [
                  "Production page par Add Batch karo",
                  "Default raw material auto-select hota hai (Admin → Settings se set karo)",
                  "Leaves In (raw material used) aur Powder Out enter karo",
                  "Status Draft → Running → Complete rakhein jab tak process chal raha ho",
                  "Jab powder factory mein bhej do toh status Sent in Factory karo",
                ],
              },
              {
                step: "3",
                title: "Powder Stock",
                color: "#8B5CF6",
                bg: "#F5F3FF",
                points: [
                  "Batch ka status Sent in Factory hote hi powder stock automatically update hota hai",
                  "Finished Products section mein powder ki quantity track hoti hai",
                  "Stocks page par total available powder dekhein",
                ],
              },
              {
                step: "4",
                title: "3rd Party Dispatch (Packing Logs)",
                color: "#16A34A",
                bg: "#F0FDF4",
                points: [
                  "Packing Logs page par jaao",
                  "3rd party ka naam, bag size (5 ya 10 kg) aur bag count enter karo",
                  "System available powder check karta hai — agar kum ho toh error deta hai",
                  "Dispatch hone par powder stock automatically deduct hota hai",
                  "Galat entry ho toh delete kar sakte ho — stock wapas restore ho jaata hai",
                ],
              },
              {
                step: "5",
                title: "Stock Overview",
                color: "#E8C547",
                bg: "#FEFCE8",
                points: [
                  "Stocks page par raw material, powder aur product inventory dekhein",
                  "Koi bhi quantity negative nahi hogi — system block karta hai",
                ],
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border p-4" style={{ borderColor: item.color + "30", backgroundColor: item.bg }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: item.color }}>
                    {item.step}
                  </span>
                  <h3 className="font-semibold" style={{ color: item.color }}>{item.title}</h3>
                </div>
                <ul className="space-y-1.5 pl-10">
                  {item.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2" style={{ color: "#374151" }}>
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: item.color }} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Finished Products Dialog */}
      <Dialog open={editFinishedOpen} onOpenChange={setEditFinishedOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "600px", maxHeight: "80vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              Edit {editFlavorName} Storage
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <p className="text-sm" style={{ color: "#C9A83A" }}>Click quantity to edit</p>
            {selectedFlavorForEdit.map((fp, idx) => (
              <div 
                key={fp.id} 
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ borderColor: "#E8C54720" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{fp.batch_reference || "—"}</p>
                  <p className="text-xs" style={{ color: "#C9A83A" }}>
                    {new Date(fp.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={fp.quantity}
                    onChange={(e) => {
                      const newQty = parseFloat(e.target.value) || 0;
                      setSelectedFlavorForEdit(prev => 
                        prev.map((p, i) => i === idx ? { ...p, quantity: newQty } : p)
                      );
                    }}
                    className="w-24 h-10 px-3 text-base rounded-lg border text-center font-medium"
                    style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "#C9A83A" }}>kg</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setEditFinishedOpen(false)}
              className="flex-1 h-12 text-base font-medium"
              style={{ borderColor: "#E8C547", color: "#E8C547" }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                selectedFlavorForEdit.forEach(fp => {
                  updateFinishedProductMutation.mutate({ id: fp.id, quantity: fp.quantity });
                });
                setEditFinishedOpen(false);
              }}
              className="flex-1 h-12 text-base font-bold"
              style={{ backgroundColor: "#16A34A", color: "white" }}
            >
              Save All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
