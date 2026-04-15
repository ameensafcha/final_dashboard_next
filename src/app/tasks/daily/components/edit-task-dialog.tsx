'use client';

import React, { useState, useEffect } from 'react';
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
import { Edit3 } from 'lucide-react';

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, biz: string) => void;
  initialTitle: string;
  initialBiz: string;
}

export default function EditTaskDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialTitle, 
  initialBiz 
}: EditTaskDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [biz, setBiz] = useState(initialBiz);

  useEffect(() => {
    setTitle(initialTitle);
    setBiz(initialBiz);
  }, [initialTitle, initialBiz]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl border-none shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Edit3 className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
            Edit <span className="text-amber-600">Mission</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mission Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-50 border-gray-100 rounded-xl h-12 font-medium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz" className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mission Type</Label>
            <select 
              id="biz"
              value={biz}
              onChange={(e) => setBiz(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 text-sm font-bold uppercase tracking-widest px-4 h-12 rounded-xl text-gray-700 focus:text-amber-600 focus:border-amber-200 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="S">Sales (Direct Revenue)</option>
              <option value="N">Non-Sales (Operational)</option>
            </select>
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
            onClick={() => onSubmit(title, biz)}
            disabled={!title.trim()}
            className="bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-gray-900/20"
          >
            Update Mission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
