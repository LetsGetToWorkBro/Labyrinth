/**
 * NotificationTray — iOS-style slide-down notification center.
 *
 * Mounted once at the App root. Reads open/closed state + list from
 * NotificationProvider. Renders via portal at z-index 8000 so it sits
 * above the TopHeader (z-index 100) and the left drawer, but below
 * toasts (9999) and the level-up cinema overlay.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Bell,
  CheckCircle,
  Flame,
  type LucideIcon,
  MessageCircle,
  Megaphone,
  Star,
  TrendingUp,
  Trophy,
  Unlock,
  Zap,
} from 'lucide-react';
import {
  Notification,
  NotificationType,
  useNotifications,
} from '@/components/NotificationProvider';

const GOLD = '#C8A24C';

/** Static per-type presentation config. */
const TYPE_META: Record<NotificationType, { Icon: LucideIcon; color: string; tint: string }> = {
  belt_promotion: { Icon: Award,        color: '#C8A24C', tint: 'rgba(200,162,76,0.15)' },
  checkin:        { Icon: CheckCircle,  color: '#22C55E', tint: 'rgba(34,197,94,0.15)' },
  achievement:    { Icon: Star,         color: '#F59E0B', tint: 'rgba(245,158,11,0.15)' },
  announcement:   { Icon: Megaphone,    color: '#3B82F6', tint: 'rgba(59,130,246,0.15)' },
  tournament:     { Icon: Trophy,       color: '#F97316', tint: 'rgba(249,115,22,0.15)' },
  streak:         { Icon: Flame,        color: '#EF4444', tint: 'rgba(239,68,68,0.15)' },
  level_up:       { Icon: Zap,          color: '#A855F7', tint: 'rgba(168,85,247,0.15)' },
  dm:             { Icon: MessageCircle,color: '#14B8A6', tint: 'rgba(20,184,166,0.15)' },
  access_granted: { Icon: Unlock,       color: '#C8A24C', tint: 'rgba(200,162,76,0.15)' },
  rank_change:    { Icon: TrendingUp,   color: '#6366F1', tint: 'rgba(99,102,241,0.15)' },
};

function fallbackMeta(type: string) {
  return TYPE_META[type as NotificationType] || {
    Icon: Bell,
    color: '#C8A24C',
    tint: 'rgba(200,162,76,0.12)',
  };
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (!t) return '';
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const sec = Math.round(diff / 1000);
  if (sec < 45) return 'just now';
  if (sec < 90) return '1m ago';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = new Date(t);
  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, yesterday)) return 'Yesterday';
  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function navigateTo(route: string) {
  if (!route) return;
  const hash = route.startsWith('#') ? route : `#${route.startsWith('/') ? route : '/' + route}`;
  window.location.hash = hash;
}

/* ─── NotificationRow ─────────────────────────────────────────── */

function NotificationRow({
  notif,
  onActivate,
  onDismiss,
}: {
  notif: Notification;
  onActivate: (n: Notification) => void;
  onDismiss: (n: Notification) => void;
}) {
  const meta = fallbackMeta(notif.type);
  const [dx, setDx] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    moved.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const d = e.touches[0].clientX - startX.current;
    if (Math.abs(d) > 6) moved.current = true;
    if (d < 0) setDx(Math.max(d, -220));
  };
  const onTouchEnd = () => {
    if (dx < -80) {
      setDismissing(true);
      setDx(-window.innerWidth);
      window.setTimeout(() => onDismiss(notif), 240);
    } else {
      setDx(0);
    }
    startX.current = null;
  };

  const handleClick = () => {
    if (moved.current) return;
    onActivate(notif);
  };

  return (
    <div
      onClick={handleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 12,
        background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(200,162,76,0.06)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderLeft: notif.read ? '1px solid rgba(255,255,255,0.05)' : `2px solid ${GOLD}`,
        cursor: 'pointer',
        transform: `translateX(${dx}px)`,
        opacity: dismissing ? 0 : 1,
        transition: startX.current == null ? 'transform 0.25s ease, opacity 0.25s ease, background 0.25s ease' : 'none',
        touchAction: 'pan-y',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Icon tile */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: meta.tint,
          border: `1px solid ${meta.color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <meta.Icon size={18} color={meta.color} strokeWidth={2.2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: notif.read ? 'rgba(234,234,234,0.72)' : '#EAEAEA',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0,
            }}
          >
            {notif.title}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#6A6A74',
              flexShrink: 0,
              letterSpacing: 0.3,
            }}
          >
            {formatRelative(notif.createdAt)}
          </div>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: '#8A8A94',
            marginTop: 3,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}
        >
          {notif.body}
        </div>
      </div>
    </div>
  );
}

/* ─── NotificationTray ────────────────────────────────────────── */

export function NotificationTray() {
  const { notifications, trayOpen, closeTray, markRead, markAllRead, unreadCount } =
    useNotifications();

  // Allow scroll lock + escape to close
  useEffect(() => {
    if (!trayOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTray();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [trayOpen, closeTray]);

  if (!trayOpen) return null;

  const onActivate = (n: Notification) => {
    if (!n.read) markRead(n.notifId);
    const route = n?.data && typeof n.data === 'object' ? (n.data as any).route : null;
    if (route) {
      closeTray();
      window.setTimeout(() => navigateTo(String(route)), 80);
    }
  };

  const onDismiss = (n: Notification) => {
    if (!n.read) markRead(n.notifId);
  };

  return createPortal(
    <>
      <style>{`
        @keyframes notif-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes notif-tray-in {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={closeTray}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 7999,
          animation: 'notif-backdrop-in 0.25s ease forwards',
        }}
      />

      {/* Tray panel */}
      <div
        role="dialog"
        aria-label="Notifications"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 8000,
          background: 'rgba(10,10,12,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
          paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
          paddingBottom: 12,
          paddingLeft: 14,
          paddingRight: 14,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'notif-tray-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: 'rgba(200,162,76,0.14)',
              border: '1px solid rgba(200,162,76,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={15} color={GOLD} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#EAEAEA', lineHeight: 1 }}>
              Notifications
            </div>
            <div style={{ fontSize: 10.5, color: '#6A6A74', marginTop: 3 }}>
              {unreadCount > 0
                ? `${unreadCount} unread`
                : notifications.length > 0
                ? 'All caught up'
                : ''}
            </div>
          </div>
          <button
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            aria-label="Mark all notifications read"
            style={{
              background: 'none',
              border: 'none',
              color: unreadCount > 0 ? GOLD : '#3a3a3a',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.2,
              cursor: unreadCount > 0 ? 'pointer' : 'default',
              padding: '6px 8px',
            }}
          >
            Mark all read
          </button>
          <button
            onClick={closeTray}
            aria-label="Close notifications"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: '#EAEAEA',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingBottom: 10,
            paddingRight: 2,
          }}
        >
          {notifications.length === 0 ? (
            <div
              style={{
                margin: '28px auto 14px',
                padding: '26px 20px',
                maxWidth: 320,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(200,162,76,0.08)',
                  border: '1px solid rgba(200,162,76,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={26} color={GOLD} strokeWidth={1.8} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#EAEAEA' }}>
                You're all caught up
              </div>
              <div style={{ fontSize: 11.5, color: '#6A6A74', textAlign: 'center' }}>
                We'll let you know when something new happens.
              </div>
            </div>
          ) : (
            notifications.map(n => (
              <NotificationRow
                key={n.notifId}
                notif={n}
                onActivate={onActivate}
                onDismiss={onDismiss}
              />
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ─── NotificationBell ────────────────────────────────────────── */

export function NotificationBell() {
  const { unreadCount, toggleTray, trayOpen } = useNotifications();
  const showBadge = unreadCount > 0;

  return (
    <>
      <button
        onClick={toggleTray}
        aria-label={`Notifications${showBadge ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={trayOpen}
        style={{
          position: 'relative',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Bell
          size={18}
          color={GOLD}
          strokeWidth={2.2}
          style={{
            animation: showBadge
              ? 'bellPulse 2.2s ease-in-out infinite, bellShake 2.2s ease-in-out infinite'
              : 'none',
            transformOrigin: '50% 20%',
          }}
        />
        {showBadge && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: '#EF4444',
              boxShadow: '0 0 0 1.5px #09090B, 0 0 6px rgba(239,68,68,0.6)',
            }}
          />
        )}
      </button>
    </>
  );
}
