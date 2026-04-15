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
      if (res.redirected) {
        window.location.href = "/login";
        return [];
      }
      if (!res.ok) return []; 
      const json = await res.json();
      return json.data || json || [];
    },
  });

  const { data: setting } = useQuery({
    queryKey: ["settings", "default_raw_material_id"],
    queryFn: async () => {
      const res = await fetch("/api/settings?key=default_raw_material_id");
      if (res.redirected) {
        window.location.href = "/login";
        return null;
      }
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    },
  });

  useEffect(() => {
    if (setting?.value) {
      setSelectedRmId(setting.value);
    }
  }, [setting?.value]);

  const saveMutation = useMutation({
    mutationFn: async (rmId: string) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "default_raw_material_id", value: rmId }),
      });
      if (!res.ok) throw new Error("Failed to save setting");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "default_raw_material_id"] });
      addNotification({ type: "success", message: "Setting saved" });
    },
    onError: () => {
      addNotification({ type: "error", message: "Failed to save setting" });
    },
  });

  const hasChanged = setting?.value !== selectedRmId && selectedRmId !== "";
  const selectedMaterial = rawMaterials.find((rm) => rm.id === selectedRmId);

  return (
    <div className="p-8 min-h-screen bg-[var(--surface)]">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-6 h-6 text-[var(--primary)]" />
          <h1 className="text-section font-display text-[var(--foreground)]">
            System Settings
          </h1>
        </div>
        <p className="text-body-light text-[var(--muted-foreground)]">
          Configure default values for production
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-1 text-[var(--foreground)]">
            Default Raw Material
          </h2>
          <p className="text-sm mb-4 text-[var(--muted-foreground)]">
            Ye material batch creation form mein auto-select hoga. Dropdown ki zaroorat nahi padegi.
          </p>

          <select
            value={selectedRmId}
            onChange={(e) => setSelectedRmId(e.target.value)}
            className="input-field"
          >
            <option value="">�� No default selected —</option>
            {rawMaterials.map((rm) => (
              <option key={rm.id} value={rm.id}>
                {rm.name} — {rm.quantity.toFixed(2)} {rm.unit} available
              </option>
            ))}
          </select>
          
          {selectedMaterial && (
            <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-[var(--surface)]">
              <p className="text-sm font-medium text-[var(--foreground)]">
                {selectedMaterial.name}
              </p>
              <p className="text-xs mt-0.5 text-[var(--primary)]">
                Available: {selectedMaterial.quantity.toFixed(2)} {selectedMaterial.unit}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={() => saveMutation.mutate(selectedRmId)}
          disabled={saveMutation.isPending || !hasChanged}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? "Saving..." : "Save Setting"}
        </Button>
      </div>
    </div>
  );
}