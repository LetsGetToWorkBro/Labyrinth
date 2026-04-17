/**
 * FloatingIdentityWidget — fixed bottom-right, persists across all pages.
 * Collapsed: 52×52 avatar with ProfileRing + level pill.
 * Expanded (tap): XP card showing level, rank title, XP bar, sources.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getRingTier } from '@/lib/xp';
import { ProfileRing } from '@/components/ProfileRing';
import { GrapplingIcon, TrophyIcon, GoldMedalIcon } from '@/components/icons/LbjjIcons';
import { useLocation } from 'wouter';

// Pages where the widget should be hidden
const HIDDEN_PATHS = ['/waiver', '/book', '/reset', '/account', '/admin'];

export function FloatingIdentityWidget() {
  const { member, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [animateBar, setAnimateBar] = useState(false);
  const expandRef = useRef<HTMLDivElement>(null);
  const [localXP, setLocalXP] = useState<number>(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      const gasXP = (member as any)?.totalPoints || 0;
      return Math.max(stats.xp || 0, stats.totalXP || 0, gasXP);
    } catch { return (member as any)?.totalPoints || 0; }
  });
  useEffect(() => {
    const sync = () => {
      try {
        const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        setLocalXP(prev => Math.max(prev, stats.xp || 0, stats.totalXP || 0, (member as any)?.totalPoints || 0));
      } catch {}
    };
    window.addEventListener('storage', sync);
    const t = setInterval(sync, 4000);
    return () => { window.removeEventListener('storage', sync); clearInterval(t); };
  }, [member]);
  const xp = localXP;
  const { level, title, progress, xpForNext, xpForLevel } = getLevelFromXP(xp);
  const ringTier = getRingTier(level);
  const xpIntoLevel = xp - xpForLevel;
  const xpNeeded = xpForNext - xpForLevel;
  const xpToNext = xpNeeded - xpIntoLevel;

  // Load avatar from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lbjj_profile_picture');
      if (saved) setAvatarSrc(saved);
    } catch {}
  }, [member]);

  // Animate XP bar when expanded
  useEffect(() => {
    if (expanded) {
      setAnimateBar(false);
      const t = setTimeout(() => setAnimateBar(true), 80);
      return () => clearTimeout(t);
    }
  }, [expanded]);

  // Close on outside tap
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (expandRef.current && !expandRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [expanded]);

  if (!isAuthenticated || !member) return null;
  if (HIDDEN_PATHS.some(p => location.startsWith(p))) return null;

  const initials = member.name
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const beltColor = (() => {
    const belt = member.belt || 'white';
    const map: Record<string, string> = {
      white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6',
      brown: '#92400E', black: '#2A2A2A', grey: '#9CA3AF',
      yellow: '#EAB308', orange: '#F97316', green: '#22C55E',
    };
    return map[belt] || '#C8A24C';
  })();

  const barPct = animateBar ? Math.max(progress * 100, 2) : 0;

  return (
    <>
      {/* Expanded XP card */}
      {expanded && (
        <div
          ref={expandRef}
          style={{
            position: 'fixed',
            bottom: 82,
            right: 12,
            width: 260,
            background: 'linear-gradient(135deg, #141418 0%, #1A1A1E 100%)',
            border: '1px solid rgba(200,162,76,0.18)',
            borderRadius: 18,
            padding: '16px 16px 14px',
            zIndex: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(200,162,76,0.08)',
            animation: 'fid-expand 200ms cubic-bezier(0.34,1.56,0.64,1) both',
            transformOrigin: 'bottom right',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {/* Avatar small */}
            <ProfileRing tier={ringTier} size={40} level={level > 1 ? level : undefined}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: avatarSrc ? 'transparent' : `linear-gradient(135deg, ${beltColor}44, ${beltColor}22)`,
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: beltColor,
                flexShrink: 0,
              }}>
                {avatarSrc
                  ? <img src={avatarSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : initials}
              </div>
            </ProfileRing>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F0F0F0', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.name?.split(' ')[0] || 'Warrior'}
              </div>
              <div style={{ fontSize: 11, color: '#C8A24C', fontWeight: 600 }}>{title}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>to next</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#C8A24C' }}>+{xpToNext.toLocaleString()}</div>
            </div>
          </div>

          {/* Level + XP row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 28, fontWeight: 900, color: '#C8A24C', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{level}</span>
            <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>LV</span>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: '#888' }}>{xpIntoLevel.toLocaleString()} XP</span>
          </div>

          {/* XP Bar */}
          <div style={{
            height: 10, borderRadius: 5, background: '#0A0A0A',
            overflow: 'hidden', position: 'relative',
            border: '1px solid #1A1A1A',
            marginBottom: 12,
          }}>
            <div style={{
              height: '100%', borderRadius: 5,
              width: `${barPct}%`,
              background: 'linear-gradient(90deg, #6B4A00 0%, #C8A24C 40%, #FFD700 70%, #FFF8DC 85%, #FFD700 100%)',
              backgroundSize: '300% 100%',
              animation: animateBar ? 'xp-shimmer 2s linear infinite' : 'none',
              transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 8px rgba(255,215,0,0.5)',
            }} />
            {/* Notch marks */}
            {[25, 50, 75].map(p => (
              <div key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(0,0,0,0.4)' }} />
            ))}
          </div>

          {/* XP sources */}
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[
              { icon: <GrapplingIcon size={14} color="#C8A24C" />, xp: '+10 XP', label: 'Check in' },
              { icon: <TrophyIcon size={14} color="#C8A24C" />, xp: '+50 XP', label: 'Tournament' },
              { icon: <GoldMedalIcon size={14} />, xp: '+150 XP', label: 'Gold' },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center', opacity: 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>{item.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#C8A24C' }}>{item.xp}</div>
                <div style={{ fontSize: 9, color: '#555' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed pill — always visible */}
      <div
        style={{
          position: 'fixed',
          bottom: 76,
          right: 12,
          zIndex: expanded ? 499 : 490,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          filter: expanded ? 'none' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          transition: 'transform 150ms cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={() => setExpanded(e => !e)}
        aria-label={expanded ? 'Collapse XP widget' : 'View XP and level'}
        role="button"
      >
        <ProfileRing tier={ringTier} size={52} level={level > 1 ? level : undefined}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: avatarSrc
              ? 'transparent'
              : `linear-gradient(135deg, ${beltColor}55, ${beltColor}22)`,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: beltColor,
            position: 'relative',
          }}>
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials}
          </div>
        </ProfileRing>

        {/* Level pill */}
        <div style={{
          position: 'absolute',
          bottom: -2,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #C8A24C, #E8B84B)',
          color: '#000',
          fontSize: 9,
          fontWeight: 900,
          padding: '2px 6px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          border: '1.5px solid #0A0A0A',
          lineHeight: 1.4,
          letterSpacing: '0.03em',
          pointerEvents: 'none',
        }}>
          LV {level}
        </div>
      </div>

      <style>{`
        @keyframes fid-expand {
          from { opacity: 0; transform: scale(0.85) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  );
}
