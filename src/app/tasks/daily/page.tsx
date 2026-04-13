import { Suspense } from 'react';
import DailyClient from './daily-client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export default async function DailyTasksPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Unauthorized</div>;
  }

  // Fetch initial state if possible (optional SSR optimization)
  const today = new Date();
  const plan = await prisma.dailyPlan.findFirst({
    where: {
      employee_id: user.id,
      plan_date: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
    include: {
      items: true,
      blockers: true,
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-[#fbfaf1] min-h-screen text-gray-900">
      <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Command Center...</div>}>
        <DailyClient initialPlan={JSON.parse(JSON.stringify(plan))} />
      </Suspense>
    </div>
  );
}
