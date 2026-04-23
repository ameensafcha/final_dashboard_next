'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, ShieldAlert, Eye, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskDetail } from '@/components/tasks/task-detail';
import { Task } from '@/components/tasks/tasks-table/types';

export default function DailyClient({ strategicTasks = [] }: { strategicTasks?: Task[] }) {
  const [selectedStrategicTask, setSelectedStrategicTask] = useState<Task | null>(null);

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
            Strategic<br />
            <span className="text-[#735c00] drop-shadow-sm">Command</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-10 bg-white/60 backdrop-blur-xl p-8 rounded-[3rem] shadow-xl shadow-[#735c00]/5 border border-white/40 transform transition-transform hover:scale-[1.02]">
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Impact Velocity</p>
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-7xl font-black text-gray-900 leading-none tracking-tighter font-manrope">
                {strategicTasks.filter(t => t.status === 'completed' || t.status === 'review').length}
              </span>
              <span className="text-2xl font-black text-[#ffd54f]">/ {strategicTasks.length}</span>
            </div>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-[#735c00] to-[#ffd54f] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-[#735c00]/30 transform rotate-6 transition-all hover:rotate-0">
            <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 space-y-12">
          {/* Strategic Horizon */}
          <section className="space-y-8">
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-900 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-black/20 transform rotate-3 transition-transform hover:rotate-0">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-widest text-gray-900">Strategic Horizon</h2>
                  <p className="text-[12px] text-gray-500 font-black uppercase tracking-[0.3em] opacity-60">High-Impact T1 Objectives</p>
                </div>
              </div>
              <div className="h-px flex-1 mx-10 bg-gradient-to-r from-gray-900/20 to-transparent" />
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-900/5 overflow-hidden border border-white/50 divide-y divide-[#fbfaf1]">
              {strategicTasks && strategicTasks.length > 0 ? (
                strategicTasks.map((task) => {
                  const isNeedsVerification = task.status === 'needs_verification';
                  return (
                    <div key={task.id} className={cn(
                      "transition-all group relative flex items-center gap-8 p-10 hover:bg-[#fbfaf1]/50",
                      isNeedsVerification && "bg-orange-50/40 hover:bg-orange-50/60"
                    )}>
                      {isNeedsVerification && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-6">
                          {isNeedsVerification && (
                            <div className="flex-shrink-0 relative">
                              <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20" />
                              <div className="relative bg-orange-100 p-3 rounded-2xl border border-orange-200 shadow-sm">
                                <ShieldAlert className="w-6 h-6 text-orange-600" />
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <h3 className={cn(
                                "text-2xl font-bold tracking-tight text-gray-900 group-hover:text-[#735c00] transition-colors leading-tight",
                                isNeedsVerification && "text-orange-900"
                              )}>
                                {task.title}
                              </h3>
                              {isNeedsVerification && (
                                <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-orange-600/20">
                                  Verification Needed
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                                {task.area?.name || 'General'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg">
                                {task.company?.name || 'In-House'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="px-5 py-2 rounded-2xl bg-gray-900/5 text-gray-500 font-black text-[10px] uppercase tracking-widest border border-gray-100">
                          {task.status.replace('_', ' ')}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStrategicTask(task)}
                          className="h-12 px-8 rounded-2xl bg-white shadow-xl shadow-gray-900/5 text-gray-400 hover:text-gray-900 hover:scale-[1.05] active:scale-[0.95] transition-all font-black text-[11px] uppercase tracking-widest gap-2 border border-white"
                        >
                          <Eye className="w-5 h-5" />
                          Inspect
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-24 text-center space-y-4">
                  <div className="w-24 h-24 bg-[#fbfaf1] rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-12 h-12 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-300 italic">No Strategic Objectives assigned.</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-200">System Standing By</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Strategic Task Detail View */}
      <TaskDetail
        task={selectedStrategicTask}
        open={!!selectedStrategicTask}
        onClose={() => setSelectedStrategicTask(null)}
      />
    </div>
  );
}
