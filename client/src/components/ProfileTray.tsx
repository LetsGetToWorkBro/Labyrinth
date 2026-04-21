import React from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Award, Medal, MessageCircle, CalendarDays,
  BarChart2, Megaphone, Home,
  FileText, BookOpen,
} from 'lucide-react';
import { CalendarSparkIcon, SaunaIcon, ShieldIcon, GrapplingIcon, GamepadIcon } from '@/components/icons/LbjjIcons';

export function ProfileTray({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout, isAdmin, member } = useAuth();

  const navigate = (path: string) => {
    window.location.hash = path.replace(/^#?\//, '/');
    onClose();
  };

  const GOLD = '#C8A24C';

  // Icons match bottom nav and App.tsx ALL_NAV_OPTIONS exactly
  const items: { icon: React.ReactNode; label: string; path: string }[] = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
      label: 'My Account',
      path: '/account',
    },
    // Matches bottom nav: Award = Achievements
    { icon: <Award size={18} color={GOLD} />, label: 'Achievements', path: '/achievements' },
    // Matches bottom nav: Medal = Leaderboard
    { icon: <Medal size={18} color={GOLD} />, label: 'Leaderboard', path: '/leaderboard' },
    // Matches bottom nav: MessageCircle = Chat
    { icon: <MessageCircle size={18} color={GOLD} />, label: 'Chat', path: '/chat' },
    // Matches bottom nav: CalendarDays = Schedule
    { icon: <CalendarSparkIcon size={18} color={GOLD} />, label: 'Class Schedule', path: '/schedule' },
    { icon: <GrapplingIcon size={18} color={GOLD} />, label: 'Belt Journey', path: '/belt' },
    { icon: <CalendarDays size={18} color={GOLD} />, label: 'Class History', path: '/history' },
    { icon: <GamepadIcon size={18} color={GOLD} />, label: 'Games', path: '/games' },
    { icon: <SaunaIcon size={18} color={GOLD} />, label: 'Sauna', path: '/sauna' },
    { icon: <BarChart2 size={18} color={GOLD} />, label: 'Academy Stats', path: '/stats' },
    { icon: <CalendarDays size={18} color={GOLD} />, label: 'Tournament Calendar', path: '/calendar' },
    {
      icon: <FileText size={18} color={GOLD} />,
      label: 'Book Trial Class',
      path: '/book',
    },
    {
      icon: <BookOpen size={18} color={GOLD} />,
      label: 'Waiver & Agreement',
      path: '/waiver',
    },
    ...(isAdmin
      ? [
          { icon: <Megaphone size={18} color={GOLD} />, label: 'Message Blast', path: '/messages' },
          { icon: <ShieldIcon size={18} color={GOLD} />, label: 'Admin Panel', path: '/admin' },
        ]
      : []),
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.55)' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, bottom: 0, left: 0,
        width: '82vw', maxWidth: 340,
        background: '#0F0F12',
        borderRight: '1px solid rgba(200,162,76,0.12)',
        zIndex: 501,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 16px',
          borderBottom: '1px solid #1A1A1A', marginBottom: 8,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>
              {member?.name?.split(' ')[0]}
            </div>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize', marginTop: 2 }}>
              {(member as any)?.belt || 'white'} belt
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid #2A2A2A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#888',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '8px 12px', flex: 1 }}>
          {items.map(item => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 10px', borderRadius: 10,
                background: 'transparent', border: 'none',
                color: '#F0F0F0', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
                marginBottom: 2,
                transition: 'background 100ms ease',
              }}
            >
              <span style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ padding: '8px 12px 0' }}>
          <button
            onClick={() => { onClose(); setTimeout(() => logout(), 200); }}
            style={{
              width: '100%', padding: '13px', borderRadius: 12,
              background: 'transparent', border: '1px solid #2A2A2A',
              color: '#E05252', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
