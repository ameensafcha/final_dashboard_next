"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LinkedProduct {
  id: string;
  name: string;
  sku: string;
}

interface DeleteFlavorDialogProps {
  open: boolean;
  isPending: boolean;
  linkedProducts: LinkedProduct[];
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteFlavorDialog({ open, isPending, linkedProducts, onClose, onConfirm }: DeleteFlavorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent style={{ backgroundColor: "#FFFFFF", maxWidth: "450px" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#1A1A1A" }}>Delete Flavor</DialogTitle>
        </DialogHeader>
        {linkedProducts.length > 0 ? (
          <div className="space-y-3">
            <p style={{ color: "#DC2626" }}>This flavor is linked to {linkedProducts.length} product(s). Please delete them first:</p>
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2" style={{ borderColor: "#DC262620" }}>
              {linkedProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#FEE2E2" }}>
                  <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{p.name}</span>
                  <span className="text-xs font-mono" style={{ color: "#C9A83A" }}>{p.sku}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: "#1A1A1A" }}>Are you sure you want to delete this flavor?</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button onClick={onClose} style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}>Cancel</Button>
          {linkedProducts.length === 0 && (
            <Button onClick={onConfirm} disabled={isPending} style={{ backgroundColor: "#DC2626", color: "white" }}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
