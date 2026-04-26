'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Eye, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskDetail } from '@/components/tasks/task-detail';
import { Task } from '@/components/tasks/tasks-table/types';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function DailyClient({ currentUserId }: { currentUserId: string }) {
  const [selectedStrategicTask, setSelectedStrategicTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  // Fetch T1 & T2 tasks on the client to ensure reliability with realtime
  const { data: strategicTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['daily-strategic-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?limit=100'); // Standard tasks API
      const json = await res.json();
      // Filter for T1/T2 locally for the command center view
      return (json.data || []).filter((t: Task) => 
        t.tier === 'T1 Strategic' || t.tier === 'T2 Quick Win'
      );
    },
    refetchOnWindowFocus: true,
  });

  // Real-time synchronization: Invalidate query to trigger fresh fetch
  const handleRealtimeChange = useCallback((payload: any) => {
    console.log('🔥 [Daily Command] TRUE REAL-TIME UPDATE RECEIVED:', payload);
    queryClient.invalidateQueries({ queryKey: ['daily-strategic-tasks'] });
  }, [queryClient]);

  useRealtimeSubscription({
    table: 'tasks',
    onMessage: handleRealtimeChange,
    enabled: !!currentUserId
  });

  const t1Tasks = strategicTasks.filter(t => t.status !== 'needs_verification' && t.tier === 'T1 Strategic');
  const t2Tasks = strategicTasks.filter(t => t.status !== 'needs_verification' && t.tier === 'T2 Quick Win');
  const verificationTasks = strategicTasks.filter(t => t.status === 'needs_verification');

  const renderTaskCard = (task: Task) => {
    const isNeedsVerification = task.status === 'needs_verification';
    
    return (
      <div key={task.id} className={cn(
        "transition-all group relative flex flex-col gap-2 p-5 hover:bg-[var(--surface-container-low)] bg-[var(--surface-container-lowest)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]",
        isNeedsVerification && "bg-[var(--warning-bg)]/30 hover:bg-[var(--warning-bg)]/50 shadow-[var(--shadow-md)]"
      )}>
        <h3 
          title={task.title}
          className={cn(
            "text-[16px] font-medium tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors leading-tight font-display line-clamp-1",
            isNeedsVerification && "text-[var(--warning)]"
          )}
        >
          {task.title}
        </h3>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-code-micro text-[var(--muted-foreground)] opacity-80 uppercase tracking-widest truncate">
            <span className="truncate max-w-[90px]">{task.company?.name || 'In-House'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--surface-container-highest)]" />
            <span className="truncate max-w-[90px]">{task.area?.name || 'General'}</span>
            <span className="w-1 h-1 rounded-full bg-[var(--surface-container-highest)]" />
            <span className={cn(
              "font-bold shrink-0",
              isNeedsVerification ? "text-[var(--warning)]" : "text-[var(--primary)]"
            )}>
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStrategicTask(task)}
            className="h-8 px-4 rounded-[var(--radius-md)] bg-[var(--surface-container-low)]/80 hover:bg-[var(--primary-container)] hover:text-[var(--primary)] text-code-micro font-bold transition-all shrink-0"
          >
            Inspect
          </Button>
        </div>
      </div>
    );
  };

  const renderEmptyState = (message: string) => (
    <div className="p-12 text-center space-y-3 bg-[var(--surface-container-low)] rounded-[var(--radius-lg)]">
      <Activity className="w-6 h-6 text-[var(--muted)] mx-auto opacity-20" />
      <h3 className="text-sm font-medium text-[var(--muted)] italic font-display">{message}</h3>
    </div>
  );

  if (isLoading && strategicTasks.length === 0) {
    return <div className="flex items-center justify-center h-screen font-display text-label-sm animate-pulse text-[var(--muted)]">Synchronizing Mission Data...</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col space-y-8 animate-in fade-in duration-1000 px-4 md:px-10 overflow-hidden bg-[var(--surface)]">
      {/* Header Section: Date Only */}
      <div className="flex-shrink-0 pt-6">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-[var(--surface-container-lowest)] shadow-[var(--shadow-sm)] text-label-sm text-[var(--primary)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-container)] animate-pulse shadow-[0_0_10px_var(--primary-container)]" />
          {format(new Date(), 'EEEE, MMMM do yyyy')}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-10 min-h-0 pb-10">
        {/* Column 1: Strategic Horizon (T1) */}
        <div className="flex flex-col min-h-0 bg-[var(--surface-container-low)]/50 rounded-[var(--radius-xl)] p-6 space-y-6">
          <div className="flex-shrink-0 space-y-1">
            <span className="text-code-micro text-[var(--primary)] opacity-40 tracking-[0.6em]">Priority Alpha</span>
            <h2 className="text-sub font-display text-[var(--foreground)]">T1 Strategic</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-4">
            {t1Tasks.length > 0 
              ? t1Tasks.map(renderTaskCard)
              : renderEmptyState("No active Strategic Objectives.")
            }
          </div>
        </div>

        {/* Column 2: Tactical Operations (T2) */}
        <div className="flex flex-col min-h-0 bg-[var(--surface-container-low)]/50 rounded-[var(--radius-xl)] p-6 space-y-6">
          <div className="flex-shrink-0 space-y-1">
            <span className="text-code-micro text-[var(--secondary)] opacity-40 tracking-[0.6em]">Tactical Ops</span>
            <h2 className="text-sub font-display text-[var(--foreground)]">T2 Tactical</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-4">
            {t2Tasks.length > 0 
              ? t2Tasks.map(renderTaskCard)
              : renderEmptyState("No active Tactical Objectives.")
            }
          </div>
        </div>

        {/* Column 3: Quality Control (Verify) */}
        <div className="flex flex-col min-h-0 bg-[var(--surface-container-low)]/50 rounded-[var(--radius-xl)] p-6 space-y-6">
          <div className="flex-shrink-0 space-y-1">
            <span className="text-code-micro text-[var(--warning)] opacity-40 tracking-[0.6em]">Quality Control</span>
            <h2 className="text-sub font-display text-[var(--foreground)]">Verification</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide space-y-4">
            {verificationTasks.length > 0 
              ? verificationTasks.map(renderTaskCard)
              : renderEmptyState("No missions awaiting verification.")
            }
          </div>
        </div>
      </div>

      <TaskDetail
        task={selectedStrategicTask}
        open={!!selectedStrategicTask}
        onClose={() => setSelectedStrategicTask(null)}
      />
    </div>
  );
}
