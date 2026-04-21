import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getRingTier } from '@/lib/xp';
import { ProfileRing } from '@/components/ProfileRing';
import logoMaze from '../assets/logo-maze.webp';

// Belt color map — matches rest of app
const BELT_COLORS: Record<string, string> = {
  white:  '#E0E0E0',
  blue:   '#1A5DAB',
  purple: '#7E3AF2',
  brown:  '#92400E',
  black:  '#2A2A2A',
  grey:   '#9CA3AF',
  yellow: '#EAB308',
  orange: '#F97316',
  green:  '#22C55E',
};

function BeltRankIcon({ belt, size = 22 }: { belt: string; size?: number }) {
  const b = (belt || 'white').toLowerCase();
  const color = BELT_COLORS[b] || '#E0E0E0';
  const isBlack = b === 'black';

  // Belt SVG: rectangle with two stripes on the right (like a BJJ belt)
  return (
    <svg width={size} height={Math.round(size * 0.45)} viewBox="0 0 44 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Belt body */}
      <rect x="0" y="3" width="44" height="14" rx="3"
        fill={color}
        stroke={isBlack ? '#C8A24C' : 'rgba(0,0,0,0.25)'}
        strokeWidth={isBlack ? 1 : 0.5}
      />
      {/* Black tip panel */}
      <rect x="32" y="3" width="12" height="14" rx="2"
        fill={isBlack ? '#C8A24C' : '#0A0A0A'}
        opacity={isBlack ? 1 : 0.7}
      />
      {/* Stripe on tip */}
      <rect x="35" y="5.5" width="2" height="9" rx="1"
        fill={isBlack ? '#0A0A0A' : color}
        opacity="0.9"
      />
    </svg>
  );
}

export function TopHeader({ onMenuOpen, onXpOpen }: { onMenuOpen: () => void; onXpOpen: () => void }) {
  const { member, isAuthenticated } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [hidden, setHidden] = useState<boolean>(() => {
    const p = window.location.hash.replace(/^#/, '') || '/';
    return ['/waiver', '/book', '/reset'].some(h => p.startsWith(h));
  });

  useEffect(() => {
    const sync = () => {
      try {
        const s = localStorage.getItem('lbjj_profile_picture');
        if (s) setAvatarSrc(s);
      } catch {}
    };
    sync();
    const t = setInterval(sync, 3000);
    window.addEventListener('pfp-updated', sync);
    return () => { clearInterval(t); window.removeEventListener('pfp-updated', sync); };
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

  // Use actual stored XP from localStorage for real-time accuracy
  const storedStats = (() => {
    try { return JSON.parse(localStorage.getItem('lbjj_stats_cache') || '{}'); } catch { return {}; }
  })();
  const xp = storedStats.xp ?? (member as any)?.totalPoints ?? 0;

  const { level, title, progress, xpForNext, xpForLevel } = getLevelFromXP(xp);
  const ringTier = getRingTier(level);
  const xpInLevel = xp - xpForLevel;
  const xpNeeded = xpForNext - xpForLevel;
  const belt = (member as any)?.belt || 'white';

  const initials = member.name
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(9,9,11,0.95)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(200,162,76,0.10)',
      paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
      paddingBottom: 10,
      paddingLeft: 16, paddingRight: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo → menu */}
        <button
          className="btn-icon-sm"
          onClick={onMenuOpen}
          aria-label="Open menu"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
        >
          <img src={logoMaze} alt="Labyrinth BJJ" style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.9 }} />
        </button>

        {/* Center: label row + XP bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top row: "Home" label area + belt SVG on right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#C8A24C', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              LV {level}
            </span>
            <span style={{ fontSize: 10, color: '#666', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {title}
            </span>
            {/* Belt rank icon — same alignment as "Home" text area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <BeltRankIcon belt={belt} size={24} />
              <span style={{ fontSize: 9, color: '#555', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{belt}</span>
            </div>
          </div>

          {/* XP bar — thicker (12px), real progress */}
          <div style={{ position: 'relative' }}>
            <div style={{
              height: 12, borderRadius: 6,
              background: '#111',
              overflow: 'hidden',
              border: '1px solid #1A1A1A',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                height: '100%', borderRadius: 6,
                width: `${Math.max(progress * 100, 1.5)}%`,
                background: 'linear-gradient(90deg, #6B4A00, #C8A24C 40%, #FFD700 70%, #FFF8DC 85%, #FFD700 100%)',
                backgroundSize: '300% 100%',
                animation: 'xp-shimmer 2s linear infinite',
                transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 10px rgba(255,215,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }} />
            </div>
            {/* XP label inside bar area */}
            <div style={{
              position: 'absolute', right: 0, top: -14,
              fontSize: 9, color: '#444', whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </div>
          </div>
        </div>

        {/* PFP + ProfileRing — fixed alignment */}
        <button
          className="btn-icon-sm"
          onClick={onXpOpen}
          aria-label="View XP and level"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
        >
          <ProfileRing tier={ringTier} size={40}>
            {avatarSrc
              ? <img
                  src={avatarSrc}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    objectFit: 'cover', display: 'block',
                  }}
                  alt="Profile"
                />
              : <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(200,162,76,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: '#C8A24C',
                }}>
                  {initials}
                </div>
            }
          </ProfileRing>
        </button>
      </div>
    </div>
  );
}
