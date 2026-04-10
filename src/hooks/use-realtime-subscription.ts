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
  enabled?: boolean; // When false, subscription is cleaned up. Guard with auth loading state: enabled={!!(user?.id) && !isLoading && isConnected}
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

  // Create unique instance ID to prevent channel name collisions
  // When NotificationCenter renders in multiple places or in React Strict Mode,
  // each instance needs its own channel to avoid one cleanup destroying another's channel
  const instanceId = useRef(Math.random().toString(36).substring(2, 9)).current;

  // Keep onMessage ref updated without causing re-renders
  onMessageRef.current = onMessage;

  useEffect(() => {
    // Guard: if disabled (e.g., auth still loading), clean up any existing subscription
    if (!enabled) {
      // Cleanup when disabled
      if (channelRef.current) {
        console.log(`[Realtime] Cleaning up disabled subscription`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    // Generate unique channel name with instance ID to prevent collisions
    // When multiple components subscribe to same table, each needs its own channel
    // to prevent one cleanup destroying another's subscription
    const channelName = `${schema}:${table}:${event}${filter ? ':' + filter : ''}-${instanceId}`;

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
  }, [enabled, table, event, filter, schema]); // instanceId is a constant ref and shouldn't trigger re-subscriptions
}
