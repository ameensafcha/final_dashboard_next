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
import { PlusCircle, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, tier: number, biz: string) => void;
  defaultTier: number;
}

export default function AddTaskDialog({ 
  isOpen, 
  onClose, 
  onSubmit, 
  defaultTier 
}: AddTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [tier, setTier] = useState(defaultTier);
  const [biz, setBiz] = useState('N');

  // Sync tier when defaultTier changes (e.g. if user clicks add on Tier 2 section)
  React.useEffect(() => {
    setTier(defaultTier);
  }, [defaultTier, isOpen]);

  const handleFormSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, tier, biz);
    setTitle('');
    setBiz('N');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-white rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
        <div className="bg-gradient-to-br from-[#735c00]/5 to-[#ffd54f]/10 p-8 pb-6">
          <DialogHeader className="space-y-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <PlusCircle className="w-8 h-8 text-[#735c00]" />
            </div>
            <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
              New <span className="text-[#735c00]">Mission</span>
            </DialogTitle>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#735c00] opacity-60">Deploy auxiliary objective to today's grid</p>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Objective Title</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#fbfaf1] border-none rounded-2xl h-14 px-6 text-lg font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-[#ffd54f]/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Priority Tier</Label>
              <div className="flex bg-[#fbfaf1] p-1.5 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setTier(1)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                    tier === 1 ? "bg-white shadow-sm text-[#735c00] font-black" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Alpha</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTier(2)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                    tier === 2 ? "bg-white shadow-sm text-blue-600 font-black" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Beta</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="biz" className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Mission Type</Label>
              <select 
                id="biz"
                value={biz}
                onChange={(e) => setBiz(e.target.value)}
                className="w-full bg-[#fbfaf1] border-none text-[10px] font-black uppercase tracking-widest px-4 h-[52px] rounded-2xl text-gray-700 focus:ring-2 focus:ring-[#ffd54f]/30 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="S">Sales (Revenue)</option>
                <option value="N">Operations</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 h-12"
          >
            Abort
          </Button>
          <Button 
            onClick={handleFormSubmit}
            disabled={!title.trim()}
            className="flex-[2] bg-[#735c00] hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl shadow-[#735c00]/20 h-12 transition-all hover:scale-[1.02] active:scale-95"
          >
            Deploy Mission
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
