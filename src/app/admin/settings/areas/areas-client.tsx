"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Check, X, Loader2, Folder } from "lucide-react";
import { useUIStore } from "@/lib/stores";

interface Area {
  id: string;
  name: string;
  color: string;
  description: string | null;
  is_active: boolean;
}

export default function AreasClient() {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newDescription, setNewDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);

  const { data, isLoading } = useQuery<{ data: Area[] }>({
    queryKey: ["admin-areas"],
    queryFn: async () => {
      const res = await fetch("/api/areas");
      return res.json();
    },
  });

  const areas = data?.data || [];

  const createMutation = useMutation({
    mutationFn: async ({ name, color, description }: { name: string; color: string; description: string }) => {
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, description, is_active: true }),
      });
      if (!res.ok) throw new Error("Failed to create area");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-areas"] });
      setNewName("");
      setNewColor("#6366f1");
      setNewDescription("");
      setIsAdding(false);
      addNotification({ type: "success", message: "Area added successfully" });
    },
    onError: (error: any) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color, description, is_active }: Partial<Area> & { id: string }) => {
      const res = await fetch(`/api/areas?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, description, is_active }),
      });
      if (!res.ok) throw new Error("Failed to update area");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-areas"] });
      setEditingId(null);
      addNotification({ type: "success", message: "Area updated" });
    },
    onError: (error: any) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/areas?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete area");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-areas"] });
      addNotification({ type: "success", message: "Area deleted" });
    },
    onError: (error: any) => {
      addNotification({ type: "error", message: error.message });
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-section font-display text-[var(--foreground)] flex items-center gap-3">
            <Folder className="w-6 h-6 text-[var(--primary)]" />
            Area Management
          </h1>
          <p className="text-body-light mt-1 text-[var(--muted-foreground)]">
            Manage task areas for organization
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Area
        </button>
      </header>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[var(--surface)]">
              <tr>
                <th className="text-label-sm px-6 py-4 text-left">Color</th>
                <th className="text-label-sm px-6 py-4 text-left">Area Name</th>
                <th className="text-label-sm px-6 py-4 text-left">Description</th>
                <th className="text-label-sm px-6 py-4 text-center">Status</th>
                <th className="text-label-sm px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAdding && (
                <tr className="bg-[var(--accent)]/10">
                  <td className="px-6 py-4">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Enter area name..."
                      className="input-field"
                      onKeyDown={(e) => e.key === "Enter" && createMutation.mutate({ name: newName, color: newColor, description: newDescription })}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="input-field"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">-</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => createMutation.mutate({ name: newName, color: newColor, description: newDescription })}
                        disabled={createMutation.isPending || !newName.trim()}
                        className="p-2 rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--success)] hover:bg-[var(--success-bg)]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsAdding(false)}
                        className="p-2 rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--muted-foreground)] hover:bg-[var(--surface-container)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {areas.map((area) => (
                <tr key={area.id} className="group hover:bg-[var(--surface)] transition-colors">
                  <td className="px-6 py-4">
                    {editingId === area.id ? (
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: area.color }}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === area.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field"
                        onKeyDown={(e) => e.key === "Enter" && updateMutation.mutate({ id: area.id, name: editName, color: editColor, description: editDescription, is_active: editActive })}
                      />
                    ) : (
                      <span className="text-sm font-bold text-[var(--foreground)]">{area.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === area.id ? (
                      <input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="input-field"
                        placeholder="Description"
                      />
                    ) : (
                      <span className="text-sm text-[var(--muted-foreground)]">{area.description || "-"}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === area.id ? (
                      <select
                        value={editActive ? "true" : "false"}
                        onChange={(e) => setEditActive(e.target.value === "true")}
                        className="input-field text-center w-20"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          area.is_active
                            ? "bg-[var(--success-bg)] text-[var(--success)]"
                            : "bg-[var(--error-bg)] text-[var(--error)]"
                        }`}
                      >
                        {area.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      {editingId === area.id ? (
                        <>
                          <button
                            onClick={() => updateMutation.mutate({ id: area.id, name: editName, color: editColor, description: editDescription, is_active: editActive })}
                            className="p-2 rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--success)] hover:bg-[var(--success-bg)]"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--muted-foreground)] hover:bg-[var(--surface-container)]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(area.id); setEditName(area.name); setEditColor(area.color); setEditDescription(area.description || ""); setEditActive(area.is_active); }}
                            className="p-2 rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--primary)] hover:bg-[var(--accent)]/20"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(area.id); }}
                            className="p-2 rounded-[var(--radius-md)] transition-all hover:scale-[1.02] text-[var(--error)] hover:bg-[var(--error-bg)]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {areas.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-[var(--muted)]">
                    No areas found. Add your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}