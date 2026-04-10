"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Archive, Plus, Trash2, ArrowLeft } from "lucide-react";
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

async function fetchVariants() {
  const res = await fetch("/api/variants");
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data || [];
}

async function fetchPackingReceives() {
  const res = await fetch("/api/packing-receives");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface Variant {
  id: string;
  product: { name: string };
  flavor: { name: string };
  size: { size: string; unit: string };
}

interface ReceiveItem {
  variant_id: string;
  variant?: Variant;
  quantity: number;
}

const THIRD_PARTY_OPTIONS = [
  { value: "ABC Packers", label: "ABC Packers" },
  { value: "XYZ Packaging", label: "XYZ Packaging" },
  { value: "Other", label: "Other (Manual)" },
];

export default function PackingReceivesPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    third_party: "ABC Packers",
    third_party_other: "",
    notes: "",
  });
  const [items, setItems] = useState<ReceiveItem[]>([]);

  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ["variants"],
    queryFn: fetchVariants,
  });

  const { data: receives, isLoading } = useQuery({
    queryKey: ["packing-receives"],
    queryFn: fetchPackingReceives,
    refetchInterval: 30000,
  });

  const receiveMutation = useMutation({
    mutationFn: async (data: { third_party: string; notes: string; items: ReceiveItem[] }) => {
      const res = await fetch("/api/packing-receives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          third_party_name: data.third_party,
          notes: data.notes,
          items: data.items.map(item => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to receive");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing-receives"] });
      queryClient.invalidateQueries({ queryKey: ["variant-inventory"] });
      setOpen(false);
      setFormData({ third_party: "ABC Packers", third_party_other: "", notes: "" });
      setItems([]);
      addNotification({ type: "success", message: "Products received successfully!" });
    },
    onError: (error: Error) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const addItem = () => {
    if (variantsLoading) {
      addNotification({ type: "error", message: "Loading variants. Please wait..." });
      return;
    }
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      addNotification({ type: "error", message: "No product variants. Create variants first in Products > Variants" });
      return;
    }
    setItems([...items, { 
      variant_id: variants[0].id, 
      quantity: 1 
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      addNotification({ type: "error", message: "Add at least one item" });
      return;
    }
    const thirdPartyName = formData.third_party === "Other" ? formData.third_party_other : formData.third_party;
    if (!thirdPartyName.trim()) {
      addNotification({ type: "error", message: "Enter 3rd party name" });
      return;
    }
    receiveMutation.mutate({
      third_party: thirdPartyName,
      notes: formData.notes,
      items: items,
    });
  };

  const getVariantLabel = (variantId: string) => {
    const variant = (variants as Variant[] || []).find(v => v.id === variantId);
    if (!variant) return "Select variant";
    return `${variant.product.name} - ${variant.flavor.name} (${variant.size.size} ${variant.size.unit})`;
  };

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
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Packing Receives</h1>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>Receive packed products from 3rd party</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/finished-products">
            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all hover:bg-yellow-50 cursor-pointer"
              style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <button 
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
          >
            <Plus className="w-4 h-4" />
            Receive Products
          </button>
        </div>
      </div>

      {/* Receives Table */}
      {(receives as any[] || []).length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: "#C9A83A" }} />
          <p className="text-lg font-medium" style={{ color: "#C9A83A" }}>No receives yet</p>
          <p className="text-sm mt-1" style={{ color: "#C9A83A" }}>
            Receive packed products from 3rd party
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#FFFFFF", borderColor: "#E8C54720" }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F5F4EE" }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>3rd Party</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Items</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: "#1A1A1A" }}>Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {(receives as any[]).map((receive, index) => {
                const totalQty = receive.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                return (
                  <tr 
                    key={receive.id}
                    style={{ backgroundColor: index % 2 === 0 ? "transparent" : "#F5F4EE" }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                      {new Date(receive.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#1A1A1A" }}>
                      {receive.third_party_name}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: "#1A1A1A" }}>
                      {receive.items?.map((item: any) => (
                        <div key={item.id}>
                          {item.variant?.product?.name} - {item.variant?.flavor?.name} ({item.variant?.size?.size} {item.variant?.size?.unit})
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#16A34A" }}>
                      {totalQty}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Receive Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "600px", maxHeight: "80vh", overflow: "auto" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#1A1A1A" }}>
              Receive Packed Products
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

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: "#1A1A1A" }}>Products</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-sm"
                  style={{ color: "#E8C547" }}
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              
              {items.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#C9A83A" }}>
                  Click "Add Item" to add products
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: "#E8E7E1" }}>
                      <select
                        value={item.variant_id}
                        onChange={(e) => updateItem(idx, "variant_id", e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border text-sm"
                        style={{ borderColor: "#E8C547" }}
                        disabled={variantsLoading}
                      >
                        {variantsLoading ? (
                          <option>Loading...</option>
                        ) : variants && variants.length > 0 ? (
                          variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.product?.name || "Product"} - {v.flavor?.name || "Flavor"} ({v.size?.size} {v.size?.unit})
                            </option>
                          ))
                        ) : (
                          <option>No variants available</option>
                        )}
                      </select>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="w-20 h-10 px-3 text-base rounded-lg border text-center"
                        style={{ borderColor: "#E8C547" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 rounded-lg hover:bg-red-100 cursor-pointer"
                        style={{ color: "#DC2626" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#1A1A1A" }}>Notes (Optional)</label>
              <Input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes..."
                style={{ borderColor: "#E8C547" }}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => setOpen(false)}
              className="flex-1 h-12 text-base font-medium"
              style={{ borderColor: "#E8C547", color: "#1A1A1A" }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={receiveMutation.isPending}
              className="flex-1 h-12 text-base font-bold"
              style={{ backgroundColor: "#16A34A", color: "white" }}
            >
              {receiveMutation.isPending ? "Receiving..." : "Receive"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
