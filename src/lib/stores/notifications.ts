"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  actor_name: string;
  action_type: string; // 'task_assigned', 'comment_posted'
  task_id: string;
  task_title: string;
  created_at: string;
  read_at: string | null;
}

interface NotificationStore {
  // State
  notifications: Notification[];
  unreadCount: number;
  dropdownOpen: boolean;
  isConnected: boolean;

  // Actions
  addNotification: (notif: Notification) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifs: Notification[]) => void;
  toggleDropdown: () => void;
  setConnected: (connected: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    unreadCount: 0,
    dropdownOpen: false,
    isConnected: true,

    addNotification: (notif) =>
      set((state) => {
        // Prepend new notification, keep only last 50
        const updated = [notif, ...state.notifications].slice(0, 50);
        return {
          notifications: updated,
          unreadCount: notif.read_at ? state.unreadCount : state.unreadCount + 1,
        };
      }),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),

    markAsRead: (id) =>
      set((state) => {
        const notif = state.notifications.find((n) => n.id === id);
        const wasUnread = notif && !notif.read_at;
        return {
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read_at: new Date().toISOString() } : n
          ),
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
        };
      }),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read_at: new Date().toISOString(),
        })),
        unreadCount: 0,
      })),

    setNotifications: (notifs) =>
      set((state) => ({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.read_at).length,
      })),

    toggleDropdown: () =>
      set((state) => ({
        dropdownOpen: !state.dropdownOpen,
      })),

    setConnected: (connected) =>
      set({ isConnected: connected }),
  }))
);
