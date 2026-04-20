import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { TrophyIcon, AchievedIcon, CalendarSparkIcon, SaunaIcon, ChartBarsIcon, MegaphoneIcon, ShieldIcon } from '@/components/icons/LbjjIcons';

export function ProfileTray({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout, isAdmin, member } = useAuth();

  useEffect(() => {
    if (!open) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-tray-sheet')) onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const navigate = (path: string) => {
    window.location.hash = path.replace(/^#?\//, '/');
    onClose();
  };

  const items: { icon: React.ReactNode; label: string; path: string }[] = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
      label: 'My Account',
      path: '/account',
    },
    { icon: <TrophyIcon size={18} color="#C8A24C" />, label: 'Achievements', path: '/achievements' },
    { icon: <AchievedIcon size={18} color="#C8A24C" />, label: 'Belt Journey', path: '/belt' },
    { icon: <CalendarSparkIcon size={18} color="#C8A24C" />, label: 'Class History', path: '/history' },
    { icon: <SaunaIcon size={18} color="#C8A24C" />, label: 'Sauna', path: '/sauna' },
    { icon: <ChartBarsIcon size={18} color="#C8A24C" />, label: 'Academy Stats', path: '/stats' },
    { icon: <TrophyIcon size={18} color="#C8A24C" />, label: 'Tournament Calendar', path: '/calendar' },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      label: 'Book Trial Class',
      path: '/book',
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      label: 'Waiver & Agreement',
      path: '/waiver',
    },
    ...(isAdmin
      ? [
          { icon: <MegaphoneIcon size={18} color="#C8A24C" />, label: 'Message Blast', path: '/messages' },
          { icon: <ShieldIcon size={18} color="#C8A24C" />, label: 'Admin Panel', path: '/admin' },
        ]
      : []),
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="profile-tray-sheet"
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: '#0F0F12',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(200,162,76,0.12)',
          borderBottom: 'none',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
          maxHeight: '80vh', overflowY: 'auto',
          animation: 'tray-slide-up 250ms cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '12px auto 16px' }} />

        <div style={{ padding: '0 20px 16px', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>{member?.name?.split(' ')[0]}</div>
          <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize', marginTop: 2 }}>{(member as any)?.belt || 'white'} belt</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '16px 16px 8px' }}>
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px', borderRadius: 12,
                background: '#141418', border: '1px solid rgba(255,255,255,0.06)',
                color: '#F0F0F0', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 120ms ease',
              }}
            >
              {item.icon}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '8px 16px 0' }}>
          <button
            onClick={() => { onClose(); setTimeout(() => logout(), 200); }}
            style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'transparent', border: '1px solid #2A2A2A', color: '#E05252', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
