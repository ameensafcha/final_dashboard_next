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
    addNotification,
    setNotifications,
    markAsRead,
    markAllAsRead,
    setConnected,
  } = useNotificationStore();
  const { isConnected } = useRealtimeConnectionStatus();
  const containerRef = useRef<HTMLDivElement>(null);

  // Update connection status in store
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected, setConnected]);

  // Load initial notifications on mount
  useEffect(() => {
    if (!user || isLoading) return;  // Wait for auth to fully load

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        if (data.data) {
          setNotifications(data.data);
        }
      } catch (error) {
        console.error('[NotificationCenter] Failed to load notifications:', error);
      }
    };

    loadNotifications();
  }, [user, isLoading, setNotifications]);

  // Memoize onMessage callback to prevent subscription re-runs
  // Use a ref to always have the latest addNotification without causing re-renders
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  const handleNewNotification = useCallback((payload: any) => {
    addNotificationRef.current({
      id: payload.new.id,
      recipient_id: payload.new.recipient_id,
      actor_id: payload.new.actor_id,
      actor_name: payload.new.actor_name || 'Unknown',
      action_type: payload.new.action_type,
      task_id: payload.new.task_id,
      task_title: payload.new.task_title,
      created_at: payload.new.created_at,
      read_at: payload.new.read_at,
    });
  }, []);

  // Debug: Log subscription status
  useEffect(() => {
    console.log('[NotificationCenter] Subscription enabled:', !!(user?.id) && !isLoading && isConnected);
  }, [user, isLoading, isConnected]);

  // Subscribe to new notifications via Realtime (only INSERT events)
  // Only enable when we have a valid user ID (not just user object)
  useRealtimeSubscription({
    table: 'notifications',
    event: 'INSERT',
    filter: user?.id ? `recipient_id=eq.${user.id}` : undefined,
    onMessage: handleNewNotification,
    enabled: !!(user?.id) && !isLoading && isConnected,
  });

  // Handle click outside dropdown to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (dropdownOpen) {
          toggleDropdown();
        }
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen, toggleDropdown]);

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    markAsRead(notificationId);
    // Persist to server (fire and forget, or handle error)
    fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }).catch((error) => {
      console.error('[NotificationCenter] Failed to mark as read:', error);
    });
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    markAllAsRead();
    // Persist to server
    fetch('/api/notifications/mark-all-read', { method: 'POST' }).catch((error) => {
      console.error('[NotificationCenter] Failed to mark all as read:', error);
    });
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Icon with Unread Badge */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Notifications"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {/* Header */}
          <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notif.read_at ? 'opacity-60' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        <span className="text-gray-700">{notif.actor_name}</span>
                        {' '}
                        <span className="text-gray-600">
                          {notif.action_type === 'task_assigned' ? 'assigned' : 'commented on'}
                        </span>
                        {' '}
                        <span className="font-semibold text-gray-900">{notif.task_title}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read_at && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connection Status (Offline Indicator) */}
      {!isConnected && (
        <div className="absolute bottom-full right-0 mb-2 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded whitespace-nowrap border border-yellow-300">
          Offline — reconnecting...
        </div>
      )}
    </div>
  );
}
