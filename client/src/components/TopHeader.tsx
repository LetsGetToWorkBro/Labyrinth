import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getActualLevel, getRingTier } from '@/lib/xp';
import { ProfileRing } from '@/components/ProfileRing';
import logoMaze from '../assets/logo-maze.webp';

// Belt colors — matches app-wide palette
const BELT_COLORS: Record<string, { fill: string; tip: string; tipStripe: string }> = {
  white:  { fill: '#DCDCDC', tip: '#111111', tipStripe: '#DCDCDC' },
  blue:   { fill: '#1A5DAB', tip: '#0A0A0A', tipStripe: '#1A5DAB' },
  purple: { fill: '#7E3AF2', tip: '#0A0A0A', tipStripe: '#7E3AF2' },
  brown:  { fill: '#92400E', tip: '#0A0A0A', tipStripe: '#92400E' },
  black:  { fill: '#1A1A1A', tip: '#C8A24C', tipStripe: '#0A0A0A' },
  grey:   { fill: '#9CA3AF', tip: '#0A0A0A', tipStripe: '#9CA3AF' },
  yellow: { fill: '#EAB308', tip: '#0A0A0A', tipStripe: '#EAB308' },
  orange: { fill: '#F97316', tip: '#0A0A0A', tipStripe: '#F97316' },
  green:  { fill: '#22C55E', tip: '#0A0A0A', tipStripe: '#22C55E' },
};

function BeltSVG({ belt, width = 36, height = 14 }: { belt: string; width?: number; height?: number }) {
  const b = (belt || 'white').toLowerCase();
  const c = BELT_COLORS[b] || BELT_COLORS.white;
  // Tip panel width = ~28% of total width
  const tipW = Math.round(width * 0.28);
  const tipX = width - tipW;
  const r = Math.round(height * 0.28); // border radius

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Belt body */}
      <rect x="0" y="0" width={width} height={height} rx={r}
        fill={c.fill} stroke="rgba(0,0,0,0.3)" strokeWidth="0.5"/>
      {/* Black/gold tip */}
      <rect x={tipX} y="0" width={tipW} height={height} rx={r}
        fill={c.tip}/>
      {/* Stripe on tip */}
      <rect
        x={tipX + Math.round(tipW * 0.35)}
        y={Math.round(height * 0.18)}
        width={Math.max(2, Math.round(tipW * 0.18))}
        height={Math.round(height * 0.64)}
        rx={1}
        fill={c.tipStripe} opacity="0.85"/>
    </svg>
  );
}

// Read live XP from the correct cache key
function readLiveXP(memberTotalPoints?: number): number {
  try {
    const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
    const cached = Math.max(stats.xp || 0, stats.totalXP || 0);
    return Math.max(cached, memberTotalPoints || 0);
  } catch {
    return memberTotalPoints || 0;
  }
}

export function TopHeader({ onMenuOpen, onXpOpen }: { onMenuOpen: () => void; onXpOpen: () => void }) {
  const { member, isAuthenticated } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [liveXP, setLiveXP] = useState<number>(0);
  const [hidden, setHidden] = useState<boolean>(() => {
    const p = window.location.hash.replace(/^#/, '') || '/';
    return ['/waiver', '/book', '/reset'].some(h => p.startsWith(h));
  });

  // Sync avatar
  useEffect(() => {
    const sync = () => {
      try {
        const s = localStorage.getItem('lbjj_profile_picture');
        if (s) setAvatarSrc(s);
      } catch {}
    };
    sync();
    const t = setInterval(sync, 2000);
    window.addEventListener('pfp-updated', sync);
    return () => { clearInterval(t); window.removeEventListener('pfp-updated', sync); };
  }, []);

  // Sync live XP — poll every 2s and respond to custom events
  useEffect(() => {
    const syncXP = () => {
      setLiveXP(readLiveXP((member as any)?.totalPoints));
    };
    syncXP();
    const t = setInterval(syncXP, 2000);
    window.addEventListener('xp-updated', syncXP);
    window.addEventListener('checkin-complete', syncXP);
    return () => {
      clearInterval(t);
      window.removeEventListener('xp-updated', syncXP);
      window.removeEventListener('checkin-complete', syncXP);
    };
  }, [member]);

  // Hide on auth-only pages
  useEffect(() => {
    const h = () => {
      const p = window.location.hash.replace(/^#/, '') || '/';
      setHidden(['/waiver', '/book', '/reset'].some(x => p.startsWith(x)));
    };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  if (!isAuthenticated || !member || hidden) return null;

  const xp = liveXP || (member as any)?.totalPoints || 0;
  const level = getActualLevel(xp);
  const { title, progress, xpForLevel, xpForNext } = getLevelFromXP(xp);
  const ringTier = getRingTier(level);
  const belt = ((member as any)?.belt || 'white').toLowerCase();

  const xpInLevel = xp - xpForLevel;
  const xpNeeded = Math.max(1, xpForNext - xpForLevel);

  const initials = member.name
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // Ring size — compact but readable
  const RING_SIZE = 44;

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(9,9,11,0.96)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(200,162,76,0.10)',
      paddingTop: 'max(10px, env(safe-area-inset-top, 10px))',
      paddingBottom: 8,
      paddingLeft: 14, paddingRight: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* ── Logo → menu ── */}
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center',
          }}
        >
          <img src={logoMaze} alt="Labyrinth BJJ"
            style={{ width: 26, height: 26, objectFit: 'contain', opacity: 0.9 }} />
        </button>

        {/* ── Center column: level row + XP bar ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Row 1: LV badge  |  title  |  belt SVG + name */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 5,
          }}>
            {/* Level chip */}
            <span style={{
              fontSize: 10, fontWeight: 900, color: '#000',
              background: 'linear-gradient(135deg,#C8A24C,#FFD700)',
              borderRadius: 4, padding: '1px 5px',
              lineHeight: 1.5, flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              LV{level}
            </span>

            {/* Title — takes remaining space, ellipsis if needed */}
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#888',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', flex: 1, lineHeight: 1.3,
            }}>
              {title}
            </span>

            {/* Belt SVG + label — right-aligned, same row as title */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0,
            }}>
              <BeltSVG belt={belt} width={36} height={13} />
              <span style={{
                fontSize: 9, color: '#555', textTransform: 'capitalize',
                whiteSpace: 'nowrap', lineHeight: 1,
              }}>
                {belt}
              </span>
            </div>
          </div>

          {/* Row 2: XP bar */}
          <div style={{ position: 'relative' }}>
            {/* XP progress label — floats above bar */}
            <div style={{
              position: 'absolute', right: 0, top: -13,
              fontSize: 9, color: '#3A3A3A', lineHeight: 1,
              whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
              {xpInLevel.toLocaleString()}/{xpNeeded.toLocaleString()} XP
            </div>

            {/* Bar */}
            <div style={{
              height: 12, borderRadius: 6,
              background: '#111',
              overflow: 'hidden',
              border: '1px solid #1C1C1C',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
            }}>
              <div style={{
                height: '100%', borderRadius: 6,
                width: `${Math.max(progress * 100, 2)}%`,
                background: 'linear-gradient(90deg,#6B4A00,#C8A24C 40%,#FFD700 70%,#FFF8DC 85%,#FFD700 100%)',
                backgroundSize: '300% 100%',
                animation: 'xp-shimmer 2s linear infinite',
                transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 10px rgba(255,215,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
              }} />
            </div>
          </div>
        </div>

        {/* ── PFP + ProfileRing ── */}
        <button
          onClick={onXpOpen}
          aria-label="View XP and level"
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center',
            // Give the ring a tiny bit of breathing room so the outer pulse glow isn't clipped
            overflow: 'visible',
          }}
        >
          <ProfileRing tier={ringTier} size={RING_SIZE}>
            {avatarSrc
              ? (
                <img
                  src={avatarSrc}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                    borderRadius: '50%',
                  }}
                  alt="Profile"
                />
              )
              : (
                <div style={{
                  width: '100%', height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(200,162,76,0.2), rgba(200,162,76,0.05))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.round(RING_SIZE * 0.28), fontWeight: 800, color: '#C8A24C',
                }}>
                  {initials}
                </div>
              )
            }
          </ProfileRing>
        </button>

      </div>
    </div>
  );
}
