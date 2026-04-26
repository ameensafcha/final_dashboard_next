import { Suspense } from 'react';
import DailyClient from './daily-client';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DailyTasksPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="flex-1 bg-[var(--surface)] min-h-screen">
      <Suspense fallback={<div className="flex items-center justify-center h-screen font-display text-label-sm animate-pulse text-[var(--muted)]">Initializing Strategic Command...</div>}>
        <DailyClient currentUserId={user.id} />
      </Suspense>
    </div>
  );
}
