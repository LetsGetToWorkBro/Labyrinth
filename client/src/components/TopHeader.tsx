import React, { useState, useEffect } from 'react';
import { OnlineBubble } from '@/components/OnlineBubble';
import { BeltIcon } from '@/components/BeltIcon';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getActualLevel } from '@/lib/xp';
import { ParagonRing } from '@/components/ParagonRing';
import logoMaze from '../assets/logo-maze.webp';

// Belt colors — matches app-wide palette


function readLiveXP(memberTotalPoints?: number): number {
  try {
    const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
    return Math.max(stats.xp || 0, stats.totalXP || 0, memberTotalPoints || 0);
  } catch { return memberTotalPoints || 0; }
}

export function TopHeader({ onMenuOpen, onXpOpen }: { onMenuOpen: () => void; onXpOpen: () => void }) {
  const { member, isAuthenticated } = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [liveXP, setLiveXP] = useState(0);
  const [hidden, setHidden] = useState(() => {
    const p = window.location.hash.replace(/^#/, '') || '/';
    return ['/waiver', '/book', '/reset'].some(h => p.startsWith(h));
  });

  // Sync avatar
  useEffect(() => {
    const sync = () => {
      try { const s = localStorage.getItem('lbjj_profile_picture'); if (s) setAvatarSrc(s); } catch {}
    };
    sync();
    const t = setInterval(sync, 2000);
    window.addEventListener('pfp-updated', sync);
    return () => { clearInterval(t); window.removeEventListener('pfp-updated', sync); };
  }, []);

  // Sync live XP
  useEffect(() => {
    const syncXP = () => setLiveXP(readLiveXP((member as any)?.totalPoints));
    syncXP();
    const t = setInterval(syncXP, 2000);
    window.addEventListener('xp-updated', syncXP);
    window.addEventListener('checkin-complete', syncXP);
    return () => { clearInterval(t); window.removeEventListener('xp-updated', syncXP); window.removeEventListener('checkin-complete', syncXP); };
  }, [member]);

  // Hide on auth pages
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
  const belt = ((member as any)?.belt || 'white').toLowerCase();
  const xpInLevel = xp - xpForLevel;
  const xpNeeded = Math.max(1, xpForNext - xpForLevel);

  const initials = member.name
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // ParagonRing size — 44px portrait inside the frame
  const PORTRAIT = 44;

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(9,9,11,0.96)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
      paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Logo → menu */}
        <button onClick={onMenuOpen} aria-label="Open menu" style={{
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center',
        }}>
          <img src={logoMaze} alt="Labyrinth BJJ"
            style={{ width: 26, height: 26, objectFit: 'contain', opacity: 0.9 }} />
        </button>

        {/* Center: level + title + belt + XP bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: LV chip | title | belt */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{
              fontSize: 10, fontWeight: 900, color: '#000',
              background: 'linear-gradient(135deg,#C8A24C,#FFD700)',
              borderRadius: 4, padding: '1px 5px', lineHeight: 1.5, flexShrink: 0,
            }}>
              LV{level}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#888',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            }}>
              {title}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <BeltIcon belt={belt} stripes={(member as any)?.stripes || 0} width={52} />
              <span style={{ fontSize: 9, color: '#555', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                {belt}
              </span>
            </div>
          </div>

          {/* Row 2: XP bar + online bubble inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              flex: 1, height: 10, borderRadius: 5, background: '#000',
              overflow: 'hidden', border: '1px solid #1C1C1C',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 19.5%, rgba(255,255,255,0.04) 19.5%, rgba(255,255,255,0.04) 20.5%)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${Math.max(progress * 100, 2)}%`,
                background: 'linear-gradient(90deg,#6B4A00,#C8A24C 40%,#FFD700 70%,#FFF8DC 85%,#FFD700 100%)',
                backgroundSize: '300% 100%',
                animation: 'xp-shimmer 2s linear infinite',
                transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '0 0 8px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                borderRadius: 5,
              }}>
                {/* Glowing head */}
                <div style={{
                  position: 'absolute', right: 0, top: 0, bottom: 0,
                  width: 2, background: '#fff',
                  boxShadow: '-2px 0 4px rgba(253,224,71,0.8)',
                  borderRadius: 2,
                }} />
              </div>
            </div>
            <span style={{ fontSize: 8, color: '#3A3A3A', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {xpInLevel.toLocaleString()}/{xpNeeded.toLocaleString()}
            </span>
            {/* Online micro-pill — sits at end of XP row */}
            <OnlineBubble compact />
          </div>
        </div>

        {/* PFP with Paragon frame — tapping opens XP modal */}
        <button onClick={onXpOpen} aria-label="View XP and level" style={{
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          overflow: 'visible',
        }}>
          <ParagonRing level={level} size={PORTRAIT} showOrbit={level >= 6}>
            {avatarSrc
              ? <img src={avatarSrc} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} alt="Profile" />
              : <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(200,162,76,0.2), rgba(200,162,76,0.05))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: Math.round(PORTRAIT * 0.3), fontWeight: 800, color: '#C8A24C',
                }}>{initials}</div>
            }
          </ParagonRing>
        </button>

      </div>
    </div>
  );
}
