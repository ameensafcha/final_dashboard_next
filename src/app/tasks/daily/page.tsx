import { Suspense } from 'react';
import DailyClient from './daily-client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function DailyTasksPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Fetch all T1 Strategic tasks regardless of assignee (Global visibility)
  const strategicTasks = await prisma.tasks.findMany({
    where: {
      tier: 'T1 Strategic',
      // We still exclude archived, but show everything else with this tier
      status: { not: 'archived' },
    },
    include: {
      area: true,
      company: true,
      assignee: true,
      creator: true,
      subtasks: true,
      attachments: true,
      _count: {
        select: {
          comments: true,
          time_logs: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-[#fbfaf1] min-h-screen text-gray-900">
      <Suspense fallback={<div className="flex items-center justify-center h-screen font-black uppercase tracking-widest text-gray-400 animate-pulse">Initializing Strategic Command...</div>}>
        <DailyClient 
          strategicTasks={JSON.parse(JSON.stringify(strategicTasks))}
        />
      </Suspense>
    </div>
  );
}
