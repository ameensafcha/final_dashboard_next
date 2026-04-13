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
      <DialogContent className="sm:max-w-[400px] p-6 rounded-[24px] border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Delete Task?
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 font-medium leading-relaxed">
              Are you sure you want to delete <span className="text-gray-900 font-bold">"{taskTitle}"</span>? 
              This action cannot be undone and will remove all associated subtasks and comments.
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-full font-bold border-gray-100 hover:bg-gray-50 text-gray-600 h-11"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full font-bold bg-red-600 hover:bg-red-700 h-11 shadow-sm shadow-red-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
