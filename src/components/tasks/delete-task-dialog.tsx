"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  taskTitle?: string;
}

export function DeleteTaskDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  taskTitle,
}: DeleteTaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-10 rounded-[var(--radius-xl)] border-none shadow-[var(--shadow-xl)] bg-[var(--glass-bg)] backdrop-blur-3xl overflow-hidden">
        <DialogHeader className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--error-bg)] flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-black font-display tracking-tight text-[var(--foreground)]">
              Terminate Mission?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400 font-bold leading-relaxed">
              Are you certain you want to delete <span className="text-[var(--primary)] font-black">"{taskTitle}"</span>? 
              This will permanently erase all tactical data, subtasks, and communications.
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-10">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-full font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all h-12"
          >
            Abort
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full font-black text-[11px] uppercase tracking-[0.2em] bg-red-500 hover:bg-red-600 text-white h-12 shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Terminating...
              </>
            ) : (
              "Confirm Deletion"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
