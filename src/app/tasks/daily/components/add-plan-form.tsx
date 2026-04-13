'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Trash2, 
  History, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PendingItem {
  id: string;
  title: string;
  biz: string;
  tier: number;
  carryover_count: number;
  daily_plan: { plan_date: string };
}

export default function AddPlanForm({ 
  pendingHistory, 
  onPlanCreated 
}: { 
  pendingHistory: PendingItem[], 
  onPlanCreated: (plan: any) => void 
}) {
  const [items, setItems] = useState<any[]>([
    { title: '', tier: 1, biz: 'N', notes: '', carryover_count: 0 }
  ]);
  const [tomorrowNotes, setTomorrowNotes] = useState<string[]>(['', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addItem = (tier: number) => {
    setItems([...items, { title: '', tier, biz: 'N', notes: '', carryover_count: 0 }]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const importFromHistory = (item: PendingItem) => {
    setItems([...items, { 
      title: item.title, 
      tier: item.tier, 
      biz: item.biz, 
      notes: '', 
      carryover_count: item.carryover_count + 1 
    }]);
  };

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.title.trim() !== '');
    if (validItems.length === 0) return alert('At least one task title is required!');
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/daily-plans/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: validItems, 
          tomorrow_notes: tomorrowNotes.filter(n => n.trim() !== '') 
        }),
      });
      const data = await res.json();
      onPlanCreated(data);
    } catch (error) {
      console.error('Error creating plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20 mb-2">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase italic">
          Start Your <span className="text-amber-600 underline decoration-amber-200 underline-offset-8">Mission</span>
        </h1>
        <div className="flex items-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-xs">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(), 'EEEE, MMMM do yyyy')}
        </div>
      </div>

      {/* 3-Day History: Smart Context */}
      {pendingHistory.length > 0 && (
        <Card className="bg-white border-2 border-dashed border-amber-200 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100 py-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-700">Unfinished Missions (Last 3 Days)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex flex-wrap gap-3">
            {pendingHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => importFromHistory(item)}
                className="group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:border-amber-500 hover:bg-amber-50 rounded-xl transition-all text-sm font-bold text-gray-700 shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                {item.title}
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-1.5 h-5 text-[10px] font-black">
                  {item.carryover_count + 1}D
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tier 1 Builder: Move the Needle */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Tier 1: Move the Needle</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">High impact focus tasks (Limit 3 recommended)</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addItem(1)} 
            className="border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 font-bold rounded-xl"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> NEW FOCUS
          </Button>
        </div>
        
        <div className="grid gap-4">
          {items.filter(i => i.tier === 1).map((item, idx) => {
            const globalIdx = items.indexOf(item);
            return (
              <div key={globalIdx} className="group flex items-center gap-4 bg-white p-2 pr-4 rounded-2xl border border-gray-200 shadow-sm hover:border-amber-300 transition-all">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-50 text-gray-400 font-black rounded-xl border border-gray-100 text-xs">
                  {idx + 1}
                </div>
                <Input 
                  placeholder="What is the critical mission today?" 
                  value={item.title}
                  onChange={(e) => updateItem(globalIdx, 'title', e.target.value)}
                  className="flex-1 border-none bg-transparent text-lg font-bold placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-12"
                />
                <div className="flex items-center gap-2">
                  <select 
                    value={item.biz}
                    onChange={(e) => updateItem(globalIdx, 'biz', e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl text-gray-500 focus:text-amber-600 focus:border-amber-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="S">Sales</option>
                    <option value="N">Non-Sales</option>
                  </select>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(globalIdx)} 
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier 2 Builder: Quick Wins */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Tier 2: Quick Wins</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight mt-0.5">Smaller tasks to maintain velocity</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => addItem(2)} 
            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-bold rounded-xl"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> QUICK WIN
          </Button>
        </div>
        
        <div className="grid gap-3">
          {items.filter(i => i.tier === 2).map((item, idx) => {
            const globalIdx = items.indexOf(item);
            return (
              <div key={globalIdx} className="group flex items-center gap-4 bg-white p-2 pr-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                <Input 
                  placeholder="Task title..." 
                  value={item.title}
                  onChange={(e) => updateItem(globalIdx, 'title', e.target.value)}
                  className="flex-1 border-none bg-transparent font-bold placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-10"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeItem(globalIdx)} 
                  className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tomorrow's Prep */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <ArrowRight className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">Tomorrow's Vision</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tomorrowNotes.map((note, idx) => (
            <div key={idx} className="relative">
              <Input 
                placeholder={`Priority #${idx + 1}`}
                value={note}
                onChange={(e) => {
                  const newNotes = [...tomorrowNotes];
                  newNotes[idx] = e.target.value;
                  setTomorrowNotes(newNotes);
                }}
                className="bg-white border-2 border-gray-100 rounded-2xl h-12 px-4 font-medium text-gray-700 focus:border-emerald-200 focus:ring-emerald-50 placeholder:text-gray-300"
              />
              <span className="absolute -top-2 -left-2 w-5 h-5 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-[9px] font-black text-gray-400">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-64 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-amber-100 flex justify-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl w-full flex items-center justify-between">
          <div className="hidden md:block">
            <p className="text-sm font-black text-gray-900 uppercase italic">Ready to Execute?</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Initialization sequence standing by</p>
          </div>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="h-14 px-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest text-lg rounded-2xl shadow-xl shadow-amber-500/30 group transition-all transform active:scale-95"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                LAUNCHING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Initialize Command <ChevronRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-2" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
