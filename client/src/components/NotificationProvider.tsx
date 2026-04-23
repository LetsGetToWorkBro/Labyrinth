/**
 * NotificationProvider — in-app notification context.
 *
 * - Polls GAS `getNotifications` every 60s for the signed-in member.
 * - Merges server results with locally-added optimistic notifications
 *   (check-ins, level-ups, badge unlocks) so feedback feels instant.
 * - Persists the most recent 50 notifications in localStorage so the
 *   tray is already populated before the first network round-trip.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { gasCall } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export type NotificationType =
  | 'belt_promotion'
  | 'checkin'
  | 'achievement'
  | 'announcement'
  | 'tournament'
  | 'streak'
  | 'level_up'
  | 'dm'
  | 'access_granted'
  | 'rank_change';

export interface Notification {
  notifId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string; // ISO
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  trayOpen: boolean;
  openTray: () => void;
  closeTray: () => void;
  toggleTray: () => void;
  markRead: (notifId: string) => void;
  markAllRead: () => void;
  addLocalNotif: (notif: Notification) => void;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'lbjj_notifications_cache';
const CACHE_LIMIT = 50;
const POLL_MS = 60_000;

const NotificationContext = createContext<NotificationContextValue | null>(null);

function readCache(): Notification[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeCache(list: Notification[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(list.slice(0, CACHE_LIMIT))
    );
  } catch {}
}

function dedupeAndSort(list: Notification[]): Notification[] {
  const seen = new Map<string, Notification>();
  for (const n of list) {
    if (!n || !n.notifId) continue;
    const prev = seen.get(n.notifId);
    if (!prev) {
      seen.set(n.notifId, n);
    } else {
      // Prefer the most-read state + newest timestamp
      seen.set(n.notifId, {
        ...prev,
        ...n,
        read: prev.read || n.read,
      });
    }
  }
  return Array.from(seen.values()).sort((a, b) => {
    const ta = Date.parse(a.createdAt) || 0;
    const tb = Date.parse(b.createdAt) || 0;
    return tb - ta;
  });
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { member, isAuthenticated } = useAuth();
  const email = (member as any)?.email || (member as any)?.Email || '';

  const [notifications, setNotifications] = useState<Notification[]>(() => readCache());
  const [trayOpen, setTrayOpen] = useState(false);
  const pollingRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const updateList = useCallback((updater: (prev: Notification[]) => Notification[]) => {
    setNotifications(prev => {
      const next = dedupeAndSort(updater(prev)).slice(0, CACHE_LIMIT);
      writeCache(next);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !email) return;
    try {
      const res: any = await gasCall('getNotifications', { email });
      if (!mountedRef.current) return;
      const serverList: Notification[] = Array.isArray(res?.notifications)
        ? res.notifications.map((n: any) => ({
            notifId: String(n.notifId || n.NotifId || ''),
            type: (n.type || n.Type || 'announcement') as NotificationType,
            title: String(n.title || n.Title || ''),
            body: String(n.body || n.Body || ''),
            data: n.data || null,
            read: n.read === true || n.read === 'true' || n.Read === true,
            createdAt: String(n.createdAt || n.CreatedAt || new Date().toISOString()),
          }))
        : [];
      if (serverList.length === 0) return;
      updateList(prev => [...serverList, ...prev]);
    } catch (err) {
      // Silent — poll will try again
    }
  }, [email, isAuthenticated, updateList]);

  // Poll loop
  useEffect(() => {
    mountedRef.current = true;
    if (!isAuthenticated || !email) return;
    refresh();
    pollingRef.current = window.setInterval(refresh, POLL_MS) as unknown as number;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [isAuthenticated, email, refresh]);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY) {
        setNotifications(readCache());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markRead = useCallback(
    (notifId: string) => {
      updateList(prev => prev.map(n => (n.notifId === notifId ? { ...n, read: true } : n)));
      if (!email || !notifId || notifId.startsWith('local_')) return;
      gasCall('markNotificationRead', { notifId, email }).catch(() => {});
    },
    [email, updateList]
  );

  const markAllRead = useCallback(() => {
    updateList(prev => prev.map(n => ({ ...n, read: true })));
    if (!email) return;
    gasCall('markAllNotificationsRead', { email }).catch(() => {});
  }, [email, updateList]);

  const addLocalNotif = useCallback(
    (notif: Notification) => {
      const safe: Notification = {
        ...notif,
        notifId: notif.notifId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: notif.createdAt || new Date().toISOString(),
        read: notif.read ?? false,
      };
      updateList(prev => [safe, ...prev]);
    },
    [updateList]
  );

  const openTray = useCallback(() => setTrayOpen(true), []);
  const closeTray = useCallback(() => setTrayOpen(false), []);
  const toggleTray = useCallback(() => setTrayOpen(v => !v), []);

  const unreadCount = useMemo(
    () => notifications.reduce((n, x) => n + (x.read ? 0 : 1), 0),
    [notifications]
  );

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    trayOpen,
    openTray,
    closeTray,
    toggleTray,
    markRead,
    markAllRead,
    addLocalNotif,
    refresh,
  };

  // Expose a tiny global so non-React modules (e.g. lib/api.ts) can push notifs
  useEffect(() => {
    (window as any).__lbjjAddNotif = addLocalNotif;
    return () => {
      if ((window as any).__lbjjAddNotif === addLocalNotif) {
        delete (window as any).__lbjjAddNotif;
      }
    };
  }, [addLocalNotif]);

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Return a safe no-op shim so consumers outside the provider don't crash
    return {
      notifications: [],
      unreadCount: 0,
      trayOpen: false,
      openTray: () => {},
      closeTray: () => {},
      toggleTray: () => {},
      markRead: () => {},
      markAllRead: () => {},
      addLocalNotif: () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}

/** Fire a local-only notification from anywhere — no-op if provider absent. */
export function pushLocalNotification(notif: Omit<Notification, 'notifId' | 'createdAt' | 'read'> & { notifId?: string; createdAt?: string; read?: boolean }) {
  const fn = (window as any).__lbjjAddNotif as ((n: Notification) => void) | undefined;
  if (!fn) return;
  fn({
    notifId: notif.notifId || `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: notif.type,
    title: notif.title,
    body: notif.body,
    data: notif.data,
    read: notif.read ?? false,
    createdAt: notif.createdAt || new Date().toISOString(),
  });
}
