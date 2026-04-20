import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getRingTier } from '@/lib/xp';
import { ProfileRing } from '@/components/ProfileRing';
import logoMaze from '../assets/logo-maze.webp';

export function TopHeader({ onTrayOpen }: { onTrayOpen: () => void }) {
  const { member, isAuthenticated } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [hidden, setHidden] = useState<boolean>(() => {
    const p = window.location.hash.replace(/^#/, '') || '/';
    return ['/waiver', '/book', '/reset'].some(h => p.startsWith(h));
  });

  useEffect(() => {
    try { const s = localStorage.getItem('lbjj_profile_picture'); if (s) setAvatarSrc(s); } catch {}
    const handler = () => { try { const s = localStorage.getItem('lbjj_profile_picture'); if (s) setAvatarSrc(s); } catch {} };
    window.addEventListener('pfp-updated', handler);
    return () => window.removeEventListener('pfp-updated', handler);
  }, []);

  useEffect(() => {
    const h = () => {
      const p = window.location.hash.replace(/^#/, '') || '/';
      setHidden(['/waiver', '/book', '/reset'].some(x => p.startsWith(x)));
    };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  if (!isAuthenticated || !member || hidden) return null;

  const xp = (member as any)?.totalPoints || 0;
  const { level, title, progress, xpForNext } = getLevelFromXP(xp);
  const ringTier = getRingTier(level);
  const xpToNext = Math.max(0, xpForNext - xp);
  const initials = member.name
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(9,9,11,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(200,162,76,0.08)',
      paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
      paddingBottom: 8,
      paddingLeft: 16, paddingRight: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={logoMaze} alt="Labyrinth BJJ" style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.9, flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#C8A24C', letterSpacing: '0.04em' }}>LV {level}</span>
            <span style={{ fontSize: 10, color: '#666', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</span>
            <span style={{ fontSize: 9, color: '#444', whiteSpace: 'nowrap' }}>+{xpToNext.toLocaleString()} to next</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#111', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${Math.max(progress * 100, 1.5)}%`,
              background: 'linear-gradient(90deg, #6B4A00, #C8A24C 50%, #FFD700)',
              backgroundSize: '200% 100%',
              animation: 'xp-shimmer 2.5s linear infinite',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>

        <button
          onClick={onTrayOpen}
          aria-label="Open menu"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
        >
          <ProfileRing tier={ringTier} size={36}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: avatarSrc ? 'transparent' : 'rgba(200,162,76,0.15)',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#C8A24C',
            }}>
              {avatarSrc
                ? <img src={avatarSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
                : initials}
            </div>
          </ProfileRing>
        </button>
      </div>
    </div>
  );
}
