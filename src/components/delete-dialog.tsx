"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

function DeleteConfirmDialog({ open, onOpenChange, onConfirm, isPending }: DeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ backgroundColor: "#FFFFFF" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "#1A1A1A" }}>Delete Material</DialogTitle>
          <DialogDescription style={{ color: "#C9A83A" }}>
            Are you sure you want to delete this material? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end pt-2">
          <Button 
            onClick={() => onOpenChange(false)}
            style={{ borderColor: "#E8C54720", color: "#1A1A1A" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isPending}
            style={{ backgroundColor: "#DC2626", color: "white" }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { DeleteConfirmDialog };