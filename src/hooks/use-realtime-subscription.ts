"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  schema?: string;
  table: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string; // e.g., "recipient_id=eq.uuid-123"
  onMessage: (payload: any) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription({
  schema = 'public',
  table,
  event = '*',
  filter,
  onMessage,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  
  // Keep onMessage ref updated without causing re-renders
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled) {
      // Cleanup when disabled
      if (channelRef.current) {
        console.log(`[Realtime] Cleaning up disabled subscription`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Generate deterministic channel name
    const channelName = `${schema}:${table}:${event}${filter ? ':' + filter : ''}`;

    console.log(`[Realtime] Subscribing to ${channelName}`);

    const channel = supabase.channel(channelName);

    const postgresChangeConfig: any = {
      event,
      schema,
      table,
    };

    if (filter) {
      postgresChangeConfig.filter = filter;
    }

    // Subscribe to postgres changes - use ref to always get latest callback
    const subscription = channel
      .on('postgres_changes', postgresChangeConfig, (payload) => {
        console.log(`[Realtime] ✅ Event on ${table}:${event}`, payload);
        onMessageRef.current(payload);
      })
      .on('system', { event: 'join' }, () => {
        console.log(`[Realtime] ✅ Joined channel: ${channelName}`);
      })
      .on('system', { event: 'leave' }, () => {
        console.log(`[Realtime] ❌ Left channel: ${channelName}`);
      })
      .subscribe((status) => {
        console.log(`[Realtime] Subscription status for ${channelName}: ${status} (OK=connected, ERROR=failed, TIMED_OUT=timeout, CLOSED=closed)`);
      });

    channelRef.current = channel;

    // CRITICAL: Cleanup function to prevent memory leaks
    // This runs when component unmounts or dependencies change
    return () => {
      console.log(`[Realtime] Unsubscribing from ${channelName}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, table, event, filter, schema]); // Removed onMessage from deps
}
