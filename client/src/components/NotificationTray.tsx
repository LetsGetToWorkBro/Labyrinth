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
import { Bell } from 'lucide-react';
import {
  Notification,
  NotificationType,
  useNotifications,
} from '@/components/NotificationProvider';

const GOLD = '#C8A24C';

/** Static per-type presentation config. */
const TYPE_META: Record<NotificationType, { emoji: string; color: string; tint: string }> = {
  belt_promotion: { emoji: '🥋', color: '#C8A24C', tint: 'rgba(200,162,76,0.16)' },
  checkin:        { emoji: '✅', color: '#34D399', tint: 'rgba(52,211,153,0.16)' },
  achievement:    { emoji: '🏅', color: '#FBBF24', tint: 'rgba(251,191,36,0.16)' },
  announcement:   { emoji: '📢', color: '#60A5FA', tint: 'rgba(96,165,250,0.16)' },
  tournament:     { emoji: '🏆', color: '#FB923C', tint: 'rgba(251,146,60,0.16)' },
  streak:         { emoji: '🔥', color: '#F87171', tint: 'rgba(248,113,113,0.16)' },
  level_up:       { emoji: '⚡', color: '#C084FC', tint: 'rgba(192,132,252,0.18)' },
  dm:             { emoji: '💬', color: '#2DD4BF', tint: 'rgba(45,212,191,0.16)' },
  access_granted: { emoji: '🔓', color: '#34D399', tint: 'rgba(52,211,153,0.16)' },
  rank_change:    { emoji: '📊', color: '#818CF8', tint: 'rgba(129,140,248,0.18)' },
};

function fallbackMeta(type: string) {
  return TYPE_META[type as NotificationType] || {
    emoji: '🔔',
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
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        {meta.emoji}
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
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <>
      <style>{`
        @keyframes bellPulse {
          0%,100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(200,162,76,0)); }
          50%     { transform: scale(1.12); filter: drop-shadow(0 0 6px rgba(200,162,76,0.6)); }
        }
        @keyframes bellShake {
          0%,100% { transform: rotate(0deg); }
          15%     { transform: rotate(-10deg); }
          30%     { transform: rotate(8deg); }
          45%     { transform: rotate(-6deg); }
          60%     { transform: rotate(4deg); }
          75%     { transform: rotate(-2deg); }
        }
      `}</style>
      <button
        onClick={toggleTray}
        aria-label={`Notifications${showBadge ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={trayOpen}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
          background: trayOpen ? 'rgba(200,162,76,0.12)' : 'transparent',
        }}
      >
        <Bell
          size={19}
          color={showBadge ? GOLD : '#9CA3AF'}
          strokeWidth={2.1}
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
              top: 2,
              right: 0,
              minWidth: 15,
              height: 15,
              padding: '0 4px',
              borderRadius: 999,
              background: '#EF4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              lineHeight: '15px',
              textAlign: 'center',
              boxShadow: '0 0 0 2px #09090B, 0 2px 6px rgba(239,68,68,0.6)',
              letterSpacing: 0.2,
            }}
          >
            {badgeLabel}
          </span>
        )}
      </button>
    </>
  );
}
