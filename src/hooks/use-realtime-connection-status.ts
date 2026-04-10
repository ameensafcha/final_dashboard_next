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
        // Supabase health check - try to get channel info
        const { data, error } = await supabase.from('employees').select('id').limit(1).maybeSingle();
        
        // If no error, we're connected to Supabase
        if (!error) {
          setStatus({
            isConnected: true,
            status: 'connected',
            lastHeartbeat: new Date(),
          });
        } else {
          console.log('[Connection] Supabase error:', error.message);
          setStatus((s) => ({
            ...s,
            isConnected: false,
            status: 'disconnected',
          }));
        }
      } catch (error) {
        console.log('[Connection] Offline detected', error);
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
