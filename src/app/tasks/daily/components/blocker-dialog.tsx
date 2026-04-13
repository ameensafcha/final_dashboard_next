'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserPlus } from 'lucide-react';

interface BlockerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, owner: string) => void;
  taskTitle: string;
}

export default function BlockerDialog({ isOpen, onClose, onSubmit, taskTitle }: BlockerDialogProps) {
  const [reason, setReason] = useState('');
  const [owner, setOwner] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border-none shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
            Mission <span className="text-red-600">Blocked</span>
          </DialogTitle>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{taskTitle}</p>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Kyun block hua?</Label>
            <Input
              id="reason"
              placeholder="e.g., Pending client approval..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-gray-50 border-gray-100 rounded-xl h-12 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Who needs to act?</Label>
            <div className="relative">
              <Input
                id="owner"
                placeholder="Name or Department"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="bg-gray-50 border-gray-100 rounded-xl h-12 font-medium pl-10"
              />
              <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-xl font-bold text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onSubmit(reason, owner);
              setReason('');
              setOwner('');
            }}
            disabled={!reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-red-600/20"
          >
            Confirm Blocker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
