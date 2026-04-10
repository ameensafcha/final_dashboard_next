"use client";

import { AlertCircle } from 'lucide-react';
import { useRealtimeConnectionStatus } from '@/hooks/use-realtime-connection-status';

export function OfflineBanner() {
  const { isConnected } = useRealtimeConnectionStatus();

  if (isConnected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-50 border-b border-yellow-300 px-4 py-3 flex items-center gap-3 z-40">
      <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-yellow-800">
          Offline — Reconnecting...
        </p>
        <p className="text-xs text-yellow-700 mt-0.5">
          Some features may be outdated. Changes will sync when connection is restored.
        </p>
      </div>
    </div>
  );
}
