"use client";

import { useEffect, useRef, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notifications';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';
import { useRealtimeConnectionStatus } from '@/hooks/use-realtime-connection-status';
import { useAuth } from '@/contexts/auth-context';

export function NotificationCenter() {
  const { user, isLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    dropdownOpen,
    toggleDropdown,
    setNotifications,
    markAsRead,
    markAllAsRead,
    setConnected,
  } = useNotificationStore();
  const { isConnected } = useRealtimeConnectionStatus();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.data) setNotifications(data.data);
    } catch {}
  }, [setNotifications]);

  // Load on mount once authenticated
  useEffect(() => {
    if (!user || isLoading) return;
    loadNotifications();
  }, [user, isLoading, loadNotifications]);

  // FIX 1 & 4: Add Real-time filter by recipient_id so we don't over-fetch
  useRealtimeSubscription({
    table: 'notifications',
    event: 'INSERT',
    filter: user?.id ? `recipient_id=eq.${user.id}` : undefined,
    onMessage: async (payload: any) => {
      // Re-fetch quietly to get the joined data (actor_name, task_title)
      // Since it's filtered, it will only trigger for THIS user.
      loadNotifications();
    },
    enabled: !!(user?.id) && !isLoading,
  });

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        toggleDropdown();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen, toggleDropdown]);

  // FIX 2: Remove redundant fetch calls (Store already handles persistence)
  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Bell */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-amber-100/50 rounded-xl transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-black text-white bg-red-500 rounded-full border-2 border-[#F9F8F3]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* FIX: Dropdown positioning fixed to open UPWARDS and towards the RIGHT */}
      {dropdownOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-80 bg-white rounded-2xl shadow-2xl border border-amber-100 max-h-[420px] overflow-hidden flex flex-col z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 text-gray-200" />
                <p className="text-xs font-bold text-gray-400">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-4 hover:bg-amber-50/30 transition-colors ${
                      notif.read_at ? '' : 'bg-amber-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 leading-normal">
                          <span className="font-bold text-gray-900">{notif.actor_name}</span>
                          {' '}
                          <span className="text-gray-500">
                            {notif.action_type === 'task_assigned' ? 'assigned you' : 'commented on'}
                          </span>
                          {' '}
                          <span className="font-bold text-gray-900">{notif.task_title}</span>
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-tighter">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read_at && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1.5 hover:bg-white rounded-lg shadow-sm border border-amber-100 flex-shrink-0 transition-transform active:scale-90"
                          title="Mark as read"
                        >
                          <Check className="w-3 h-3 text-amber-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offline indicator */}
      {!isConnected && (
        <div className="absolute bottom-full right-0 mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full whitespace-nowrap border border-amber-300 shadow-sm animate-pulse">
          Connecting...
        </div>
      )}
    </div>
  );
}
