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

  // No server-side filter — postgres_changes filters need RLS to be configured.
  // We subscribe to all inserts and refetch; the API already filters by recipient_id.
  useRealtimeSubscription({
    table: 'notifications',
    event: 'INSERT',
    onMessage: loadNotifications,
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

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    fetch('/api/notifications/mark-all-read', { method: 'POST' }).catch(() => {});
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Bell */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — fixed so it stays in viewport */}
      {dropdownOpen && (
        <div className="absolute bottom-full left-full ml-2 mb-1 w-80 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[420px] overflow-hidden flex flex-col z-[100]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors ${
                      notif.read_at ? '' : 'bg-blue-50/60'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-800 leading-snug break-words">
                          <span className="font-semibold">{notif.actor_name}</span>
                          {' '}
                          <span className="text-gray-500">
                            {notif.action_type === 'task_assigned' ? 'assigned you' : 'commented on'}
                          </span>
                          {' '}
                          <span className="font-semibold">{notif.task_title}</span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read_at && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5 text-gray-400" />
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
        <div className="absolute bottom-full right-0 mb-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded whitespace-nowrap border border-yellow-300">
          Offline — reconnecting...
        </div>
      )}
    </div>
  );
}
