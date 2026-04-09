"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/stores";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";

interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [selectedRmId, setSelectedRmId] = useState("");

  const { data: rawMaterials = [] } = useQuery<RawMaterial[]>({
    queryKey: ["raw-materials"],
    queryFn: async () => {
      const res = await fetch("/api/raw-materials");
      const json = await res.json();
      return json.data || json || [];
    },
  });

  const { data: setting } = useQuery({
    queryKey: ["settings", "default_raw_material_id"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=default_raw_material_id");
      const json = await res.json();
      return json.data;
    },
  });

  useEffect(() => {
    if (setting?.value) {
      setSelectedRmId(setting.value);
    }
  }, [setting]);

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default_raw_material_id", value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      addNotification({ type: "success", message: "Default raw material saved" });
    },
    onError: () => {
      addNotification({ type: "error", message: "Failed to save setting" });
    },
  });

  const savedRmId = setting?.value ?? "";
  const hasChanged = selectedRmId !== savedRmId;
  const selectedMaterial = rawMaterials.find((rm) => rm.id === selectedRmId);

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-6 h-6" style={{ color: "#E8C547" }} />
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>System Settings</h1>
        </div>
        <p className="text-gray-600">Configure default values for production</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6" style={{ borderColor: "#E8C54730" }}>
        <div>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#1A1A1A" }}>
            Default Raw Material
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ye material batch creation form mein auto-select hoga. Dropdown ki zaroorat nahi padegi.
          </p>

          <select
            value={selectedRmId}
            onChange={(e) => setSelectedRmId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border text-base"
            style={{ borderColor: "#E8C547", borderWidth: "2px" }}
          >
            <option value="">— No default selected —</option>
            {rawMaterials.map((rm) => (
              <option key={rm.id} value={rm.id}>
                {rm.name} — {rm.quantity.toFixed(2)} {rm.unit} available
              </option>
            ))}
          </select>

          {selectedMaterial && (
            <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: "#F5F4EE" }}>
              <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                {selectedMaterial.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#C9A83A" }}>
                Available: {selectedMaterial.quantity.toFixed(2)} {selectedMaterial.unit}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => saveMutation.mutate(selectedRmId)}
          disabled={saveMutation.isPending || !hasChanged}
          className="flex items-center gap-2"
          style={{ backgroundColor: "#E8C547", color: "#1A1A1A" }}
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
