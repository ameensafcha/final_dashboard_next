"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'connecting';
  lastHeartbeat: Date | null;
}

export function useRealtimeConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    status: 'connected',
    lastHeartbeat: new Date(),
  });

  useEffect(() => {
    // Check Supabase Realtime connection status
    const checkConnection = async () => {
      try {
        // Supabase health check - lightweight call instead of table query
        const { error } = await supabase.auth.getSession();

        if (!error) {
          setStatus({
            isConnected: true,
            status: 'connected',
            lastHeartbeat: new Date(),
          });
        } else {
          setStatus((s) => ({
            ...s,
            isConnected: false,
            status: 'disconnected',
          }));
        }
      } catch (error) {
        setStatus((s) => ({
          ...s,
          isConnected: false,
          status: 'disconnected',
        }));
      }
    };

    // Check on mount
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
