'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Target, 
  Zap, 
  AlertCircle, 
  UserPlus, 
  ArrowRight,
  Clock,
  Loader2,
  Edit2,
  Lock,
  History,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AddPlanForm from './components/add-plan-form';
import BlockerDialog from './components/blocker-dialog';
import EditTaskDialog from './components/edit-task-dialog';

interface DailyItem {
  id: string;
  title: string;
  tier: number;
  biz: string;
  status: string;
  notes?: string;
  blocker_reason?: string;
  action_owner?: string;
  carryover_count: number;
}

interface DailyPlan {
  id: string;
  score: number;
  items: DailyItem[];
  tomorrow_notes: string[];
}

export default function DailyClient({ initialPlan }: { initialPlan: any }) {
  const [plan, setPlan] = useState<DailyPlan | null>(initialPlan);
  const [pendingHistory, setPendingHistory] = useState<any[]>([]);
  const [updatingItems, setUpdatingItems] = useState<string[]>([]);
  
  // Dialog States
  const [isBlockerOpen, setIsBlockerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<DailyItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/daily-plans/today');
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
      }
      setPendingHistory(data.pendingHistory || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const updatePlanItem = (itemId: string, updates: Partial<DailyItem>) => {
    if (!plan) return;
    const newItems = plan.items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    setPlan({ ...plan, items: newItems });
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    setUpdatingItems(prev => [...prev, itemId]);
    
    try {
      const res = await fetch(`/api/daily-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          // Clear blocker info if completed or archived
          ...(newStatus === 'COMPLETED' || newStatus === 'ARCHIVED' ? { blocker_reason: null, action_owner: null } : {})
        }),
      });
      const updatedItem = await res.json();
      updatePlanItem(itemId, { 
        status: newStatus,
        blocker_reason: newStatus === 'COMPLETED' || newStatus === 'ARCHIVED' ? undefined : updatedItem.blocker_reason,
        action_owner: newStatus === 'COMPLETED' || newStatus === 'ARCHIVED' ? undefined : updatedItem.action_owner
      });
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleToggleStatus = (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    handleStatusChange(itemId, newStatus);
  };

  const handleImportTask = async (task: any) => {
    if (!plan) return;
    setUpdatingItems(prev => [...prev, task.id]);
    
    try {
      const res = await fetch('/api/daily-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          daily_plan_id: plan.id,
          title: task.title,
          tier: task.tier,
          biz: task.biz,
          carryover_count: task.carryover_count + 1
        }),
      });
      const newItem = await res.json();
      
      // Update local plan with new item
      setPlan({
        ...plan,
        items: [...plan.items, newItem]
      });
      
      // Remove from pending history locally
      setPendingHistory(prev => prev.filter(t => t.id !== task.id));
    } catch (error) {
      console.error('Error importing task:', error);
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== task.id));
    }
  };

  const handleBlockSubmit = async (reason: string, owner: string) => {
    if (!activeItem) return;
    const itemId = activeItem.id;
    setIsBlockerOpen(false);
    setUpdatingItems(prev => [...prev, itemId]);

    try {
      const res = await fetch(`/api/daily-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'BLOCKED',
          blocker_reason: reason,
          action_owner: owner
        }),
      });
      updatePlanItem(itemId, { 
        status: 'BLOCKED', 
        blocker_reason: reason, 
        action_owner: owner 
      });
    } catch (error) {
      console.error('Error blocking item:', error);
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
      setActiveItem(null);
    }
  };

  const handleEditSubmit = async (title: string, biz: string) => {
    if (!activeItem) return;
    const itemId = activeItem.id;
    setIsEditOpen(false);
    setUpdatingItems(prev => [...prev, itemId]);

    try {
      const res = await fetch(`/api/daily-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, biz }),
      });
      updatePlanItem(itemId, { title, biz });
    } catch (error) {
      console.error('Error updating item:', error);
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
      setActiveItem(null);
    }
  };

  if (!plan) {
    return (
      <AddPlanForm 
        pendingHistory={pendingHistory} 
        onPlanCreated={(newPlan) => setPlan(newPlan)} 
      />
    );
  }

  const activeItems = plan.items.filter(i => i.status !== 'ARCHIVED');
  const completedCount = activeItems.filter(i => i.status === 'COMPLETED').length;
  const totalCount = activeItems.length;

  const tier1Items = activeItems.filter(i => i.tier === 1);
  const tier2Items = activeItems.filter(i => i.tier === 2);

  const TaskRow = ({ item }: { item: DailyItem }) => {
    const isUpdating = updatingItems.includes(item.id);
    const isBlocked = item.status === 'BLOCKED';
    const isCompleted = item.status === 'COMPLETED';

    return (
      <tr className={cn(
        "transition-all group",
        isCompleted ? "opacity-40" : "hover:bg-[#fbfaf1]/50",
        isBlocked && "bg-red-50/50"
      )}>
        <td className="px-8 py-5">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center w-6 h-6">
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#735c00]" />
              ) : (
                <Checkbox 
                  checked={isCompleted} 
                  onCheckedChange={() => handleToggleStatus(item.id, item.status)}
                  className="w-6 h-6 border-2 border-gray-200 data-[state=checked]:bg-[#735c00] data-[state=checked]:border-[#735c00] rounded-lg transition-all shadow-sm"
                />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-3">
                {item.carryover_count > 0 && !isCompleted && (
                  <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    {item.carryover_count}D Carry
                  </span>
                )}
                <span className={cn(
                  "text-lg font-bold text-gray-900 truncate tracking-tight",
                  isCompleted && "line-through text-gray-400 font-medium"
                )}>
                  {item.title}
                </span>
              </div>
              {isBlocked && (
                <p className="text-[11px] text-red-500 font-bold italic mt-1 uppercase tracking-widest opacity-80">
                  {item.blocker_reason} {item.action_owner && `• Wait for ${item.action_owner}`}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-5 text-center">
          <span className={cn(
            "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
            item.biz === 'S' 
              ? "bg-[#ffd54f]/20 text-[#735c00]" 
              : "bg-gray-100 text-gray-500"
          )}>
            {item.biz === 'S' ? 'Sales' : 'Ops'}
          </span>
        </td>
        <td className="px-8 py-5">
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="icon"
              disabled={isUpdating || isCompleted}
              onClick={() => {
                setActiveItem(item);
                setIsEditOpen(true);
              }}
              className="w-9 h-9 rounded-full text-gray-400 hover:text-[#735c00] hover:bg-[#ffd54f]/10"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isUpdating || isCompleted || isBlocked}
              onClick={() => {
                setActiveItem(item);
                setIsBlockerOpen(true);
              }}
              className={cn(
                "w-9 h-9 rounded-full transition-all",
                isBlocked ? "text-red-600 bg-red-50" : "text-gray-400 hover:text-red-600 hover:bg-red-50"
              )}
            >
              <Lock className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isUpdating || isCompleted}
              onClick={() => handleStatusChange(item.id, 'ARCHIVED')}
              className="w-9 h-9 rounded-full text-gray-300 hover:text-gray-600 hover:bg-gray-100"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32">
      {/* Header Section: Editorial Poster Style */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 pt-8 px-4">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white shadow-sm text-[11px] font-black uppercase tracking-[0.2em] text-[#735c00]">
            <span className="w-2 h-2 rounded-full bg-[#ffd54f] animate-pulse" />
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </div>
          <h1 className="text-7xl font-black tracking-tighter text-gray-900 uppercase italic leading-[0.85] font-manrope">
            Mission<br />
            <span className="text-[#735c00] drop-shadow-sm">Control</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-10 bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl shadow-[#735c00]/5 border border-white/40 transform transition-transform hover:scale-[1.02]">
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Efficiency Rating</p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-7xl font-black text-gray-900 leading-none tracking-tighter font-manrope">{completedCount}</span>
              <span className="text-2xl font-black text-[#ffd54f]">/ {totalCount}</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-[#735c00] to-[#ffd54f] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-[#735c00]/30 transform rotate-6 transition-all hover:rotate-0">
            <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Tier Lists */}
        <div className="lg:col-span-8 space-y-12">
          {/* Tier 1 */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#735c00] rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-[#735c00]/20 transform -rotate-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Priority Alpha</h2>
                  <p className="text-[11px] text-[#735c00] font-black uppercase tracking-[0.2em] opacity-60">Critical Path Objectives</p>
                </div>
              </div>
              <div className="h-px flex-1 mx-8 bg-gradient-to-r from-[#735c00]/20 to-transparent" />
            </div>
            
            <div className="bg-white rounded-[3rem] shadow-xl shadow-[#735c00]/5 overflow-hidden border border-white/50">
              <table className="w-full border-collapse">
                <tbody>
                  {tier1Items.map((item) => <TaskRow key={item.id} item={item} />)}
                  {tier1Items.length === 0 && (
                    <tr>
                      <td className="p-12 text-center text-gray-300 italic text-lg font-medium">No critical missions today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tier 2 */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#ffd54f] rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-[#ffd54f]/40 transform rotate-3">
                  <Zap className="w-6 h-6 text-[#735c00]" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">Priority Beta</h2>
                  <p className="text-[11px] text-[#ffd54f] font-black uppercase tracking-[0.2em]">Tactical Velocity Gains</p>
                </div>
              </div>
              <div className="h-px flex-1 mx-8 bg-gradient-to-r from-[#ffd54f]/40 to-transparent" />
            </div>
            
            <div className="bg-white rounded-[3rem] shadow-xl shadow-[#ffd54f]/5 overflow-hidden border border-white/50">
              <table className="w-full border-collapse">
                <tbody>
                  {tier2Items.map((item) => <TaskRow key={item.id} item={item} />)}
                  {tier2Items.length === 0 && (
                    <tr>
                      <td className="p-12 text-center text-gray-300 italic text-lg font-medium">No support objectives assigned.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar Info Panels */}
        <div className="lg:col-span-4 space-y-10">
          {/* Blockers Panel */}
          <Card className="bg-white border-none rounded-[3rem] shadow-2xl shadow-red-900/5 overflow-hidden">
            <CardHeader className="p-8 pb-4 bg-red-50/30">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-red-900">Grid Lockdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4 space-y-6">
              {plan.items.filter(i => i.status === 'BLOCKED').length > 0 ? (
                plan.items.filter(i => i.status === 'BLOCKED').map(item => (
                  <div key={item.id} className="group relative bg-[#fbfaf1]/50 p-6 rounded-[2rem] border border-red-100/50 transition-all hover:bg-white hover:shadow-xl hover:shadow-red-900/5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate pr-4">{item.title}</p>
                      <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm font-bold text-red-600 leading-relaxed italic opacity-80 mb-4">
                      "{item.blocker_reason}"
                    </p>
                    {item.action_owner && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full mb-4">
                        <UserPlus className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Wait for {item.action_owner}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={() => handleStatusChange(item.id, 'COMPLETED')} className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:scale-[1.05] transition-transform text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20">
                        Resolve
                      </Button>
                      <Button onClick={() => handleStatusChange(item.id, 'ARCHIVED')} className="h-10 w-10 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors">
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 bg-[#fbfaf1] rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                  </div>
                  <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.3em]">Clear Skies</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending History */}
          {pendingHistory.length > 0 && (
            <Card className="bg-[#ffd54f]/5 border-none rounded-[3rem] shadow-sm">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-[#735c00]" />
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-[#735c00]">Echoes</CardTitle>
                  </div>
                  <span className="bg-[#ffd54f]/20 text-[#735c00] px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">History</span>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-4">
                {pendingHistory.map((task) => (
                  <div key={task.id} className="group flex flex-col gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-[2rem] border border-[#ffd54f]/20 transition-all hover:shadow-xl hover:shadow-[#735c00]/5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-gray-700 uppercase tracking-tight truncate pr-4">{task.title}</p>
                      <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{task.carryover_count + 1}D</span>
                    </div>
                    <Button 
                      onClick={() => handleImportTask(task)}
                      disabled={updatingItems.includes(task.id)}
                      className="h-11 w-full bg-secondary hover:bg-secondary/90 hover:scale-[1.02] transition-all text-on-secondary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl"
                    >
                      {updatingItems.includes(task.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Re-Deploy'}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tomorrow Notes */}
          <Card className="bg-white border-none rounded-[3rem] shadow-sm overflow-hidden">
            <CardHeader className="p-8 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-900">Next Horizon</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              {plan.tomorrow_notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-[#fbfaf1]/50 border border-emerald-100/30">
                  <span className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-emerald-600 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-bold text-gray-600 leading-relaxed italic">{note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <BlockerDialog 
        isOpen={isBlockerOpen} 
        onClose={() => {
          setIsBlockerOpen(false);
          setActiveItem(null);
        }}
        onSubmit={handleBlockSubmit}
        taskTitle={activeItem?.title || ''}
      />
      <EditTaskDialog
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setActiveItem(null);
        }}
        onSubmit={handleEditSubmit}
        initialTitle={activeItem?.title || ''}
        initialBiz={activeItem?.biz || 'N'}
      />
    </div>
  );
}
