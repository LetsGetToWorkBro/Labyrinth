/**
 * LeftDrawer — primary navigation drawer
 *
 * Slides in from the left when `open-left-drawer` event fires (e.g. tap on
 * top-left logo in TopHeader). Shows:
 *   - Profile stage: ParagonRing + name + belt + LV badge (taps to /account)
 *   - Family / linked accounts switcher (if > 1 family members)
 *   - Grouped nav sections (Me, Community, Training, HQ & Admin)
 *   - Sign-out footer (clears namespaced localStorage + navigates home)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { getActualLevel } from '@/lib/xp';
import { ParagonRing } from '@/components/ParagonRing';
import {
  Award, Medal, MessageCircle, CalendarDays, BarChart2, Megaphone, FileText,
  Gamepad2, Thermometer, Trophy, User as UserIcon, BookOpen, LogOut,
} from 'lucide-react';
import { saveActiveProfileToNamespace, loadNamespaceForProfile } from '@/components/FamilyProfilePicker';
import type { FamilyMember } from '@/lib/api';

const GOLD = '#C8A24C';
const GOLD_BRIGHT = '#FFD700';

const BELT_COLORS: Record<string, string> = {
  white: '#E0E0E0',
  grey: '#9CA3AF', gray: '#9CA3AF',
  yellow: '#EAB308',
  orange: '#F97316',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#A855F7',
  brown: '#92400E',
  black: '#111111',
};

function beltColor(belt: string) {
  return BELT_COLORS[(belt || 'white').toLowerCase()] || '#E0E0E0';
}

function readLiveXP(pts?: number): number {
  try {
    const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
    return Math.max(s.xp || 0, s.totalXP || 0, pts || 0);
  } catch { return pts || 0; }
}

function readPFP(): string | null {
  try { return localStorage.getItem('lbjj_profile_picture') || null; } catch { return null; }
}

function initialsFrom(name?: string): string {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getMemberRole(member: any): string {
  return (member?.role || member?.Role || '').toLowerCase();
}
function isAdminRole(role: string): boolean {
  return ['admin', 'owner', 'coach', 'instructor', 'manager'].includes(role);
}

export function LeftDrawer() {
  const { member, familyMembers, switchProfile, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  // Listen for global open event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-left-drawer', handler);
    return () => window.removeEventListener('open-left-drawer', handler);
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const go = useCallback((path: string) => {
    close();
    // small delay so the drawer slides before route change animates
    setTimeout(() => setLocation(path), 80);
  }, [close, setLocation]);

  const goExternal = useCallback((url: string) => {
    close();
    setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), 80);
  }, [close]);

  // Swipe-left to close
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchDeltaX.current < -60) close();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  if (!member) return null;

  const xp = readLiveXP((member as any)?.totalPoints);
  const level = getActualLevel(xp);
  const pfp = readPFP();
  const initials = initialsFrom(member.name);
  const belt = ((member as any)?.belt || 'white').toLowerCase();
  const beltHex = beltColor(belt);
  const role = getMemberRole(member);
  const showAdmin = isAdminRole(role);

  const primaryRow = (member as any)?.row || 0;

  // Build family card list (primary first)
  const familyCards: Array<{ row: number; name: string; belt: string; isPrimary: boolean; isActive: boolean; profilePic?: string | null }> = [];
  const seen = new Set<number>();
  if (primaryRow) {
    seen.add(primaryRow);
    familyCards.push({
      row: primaryRow,
      name: member.name || 'Me',
      belt: (member as any)?.belt || 'white',
      isPrimary: true,
      isActive: true,
      profilePic: pfp,
    });
  }
  for (const f of (familyMembers || [])) {
    if (seen.has(f.row)) continue;
    seen.add(f.row);
    familyCards.push({
      row: f.row,
      name: f.name,
      belt: f.belt,
      isPrimary: !!f.isPrimary,
      isActive: false,
      profilePic: null,
    });
  }
  const showFamily = familyCards.length > 1;

  const handleSwitchFamily = async (fm: FamilyMember | { row: number; isPrimary: boolean }) => {
    // Save current profile's data first
    if (primaryRow) saveActiveProfileToNamespace(primaryRow);

    try {
      if (!fm.isPrimary) {
        await switchProfile(fm.row);
      }
      loadNamespaceForProfile(fm.row);
      close();
      setTimeout(() => {
        try { sessionStorage.removeItem('lbjj_family_picked'); } catch {}
        window.dispatchEvent(new CustomEvent('family-switch-profile'));
      }, 150);
    } catch {
      // swallow; keep drawer open
    }
  };

  const handleSignOut = () => {
    // Device-local keys that must survive sign-out: lbjj_profile_picture, lbjj_streak_cache
    const clearKeys = [
      'lbjj_game_stats_v2',
      'lbjj_member_profile',
      'lbjj_achievements',
      'lbjj_achievement_xp_claimed',
      'lbjj_checkin_history',
      'lbjj_active_family_row',
      'lbjj_family_picked',
      'lbjj_widget_layout',
      'lbjj_belt_promotions_cache',
      'lbjj_home_cache',
      'lbjj_classes_cache',
    ];
    clearKeys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    try { sessionStorage.removeItem('lbjj_family_picked'); } catch {}
    close();
    setTimeout(() => logout(), 150);
  };

  // Nav groups
  type NavItem = { label: string; path?: string; onClick?: () => void; icon: React.ReactNode; external?: boolean; };
  type NavGroup = { title: string; items: NavItem[] };

  const groups: NavGroup[] = [
    {
      title: 'Me',
      items: [
        { label: 'My Account', path: '/account', icon: <UserIcon size={18} color={GOLD} /> },
        { label: 'Belt Journey', path: '/belt', icon: <Award size={18} color={GOLD} /> },
        { label: 'Achievements', path: '/achievements', icon: <Trophy size={18} color={GOLD} /> },
        { label: 'Class History', path: '/history', icon: <CalendarDays size={18} color={GOLD} /> },
      ],
    },
    {
      title: 'Community',
      items: [
        { label: 'Live & Archive', path: '/live', icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: GOLD }}>
            <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z" opacity="0.15" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>
            <path d="M6.34 6.34a8 8 0 0 0 0 11.32"></path>
            <path d="M17.66 6.34a8 8 0 0 1 0 11.32"></path>
            <path d="M9.17 9.17a4 4 0 0 0 0 5.66"></path>
            <path d="M14.83 9.17a4 4 0 0 1 0 5.66"></path>
          </svg>
        ) },
        { label: 'Leaderboard', path: '/leaderboard', icon: <Medal size={18} color={GOLD} /> },
        { label: 'Chat', path: '/chat', icon: <MessageCircle size={18} color={GOLD} /> },
        { label: 'Games', path: '/games', icon: <Gamepad2 size={18} color={GOLD} /> },
      ],
    },
    {
      title: 'Training',
      items: [
        { label: 'Class Schedule', path: '/schedule', icon: <CalendarDays size={18} color={GOLD} /> },
        { label: 'Tournament Calendar', path: '/calendar', icon: <Trophy size={18} color={GOLD} /> },
        { label: 'Book Trial Class', path: '/book', icon: <FileText size={18} color={GOLD} /> },
        { label: 'Sauna', path: '/sauna', icon: <Thermometer size={18} color={GOLD} /> },
      ],
    },
    ...(showAdmin
      ? [{
          title: 'HQ & Admin',
          items: [
            { label: 'Academy Stats', path: '/stats', icon: <BarChart2 size={18} color={GOLD} /> },
            { label: 'Waiver & Agreement', path: '/waiver', icon: <BookOpen size={18} color={GOLD} /> },
            { label: 'Message Blast', path: '/messages', icon: <Megaphone size={18} color={GOLD} /> },
            { label: 'Admin Panel', path: '/admin', icon: <UserIcon size={18} color={GOLD} /> },
          ],
        }]
      : []),
  ];

  return (
    <>
      {/* Inline keyframes (scoped unique names) */}
      <style>{`
        @keyframes ld-fade-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Overlay */}
      {open && (
        <div
          onClick={close}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0, zIndex: 900,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'ld-fade-in 0.25s ease',
          }}
        />
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed', top: 0, bottom: 0, left: 0,
          width: 'min(88vw, 380px)',
          zIndex: 901,
          background: 'linear-gradient(160deg, rgba(20,20,24,0.98), rgba(10,10,12,0.98))',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '20px 0 60px rgba(0,0,0,0.8)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column',
          color: '#EAEAEA',
          overflow: 'hidden',
          paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        {/* Ambient gold glow */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: -120, left: -80, width: 320, height: 320,
            background: 'radial-gradient(circle, rgba(200,162,76,0.22), rgba(200,162,76,0) 70%)',
            pointerEvents: 'none', zIndex: 0,
          }}
        />

        {/* Header */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: GOLD,
            textShadow: `0 0 10px rgba(200,162,76,0.4)`,
          }}>
            Labyrinth BJJ
          </div>
          <button
            onClick={close}
            aria-label="Close menu"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#CCC', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{
          position: 'relative', zIndex: 1,
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Profile stage */}
          <button
            onClick={() => go('/account')}
            aria-label="Open my account"
            style={{
              width: '100%', background: 'transparent', border: 'none',
              padding: '18px 18px 14px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              color: 'inherit',
            }}
          >
            <ParagonRing level={level} size={84} showOrbit={level >= 6}>
              {pfp
                ? <img src={pfp} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: 'linear-gradient(135deg,rgba(200,162,76,0.2),rgba(200,162,76,0.05))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 800, color: GOLD,
                  }}>{initials}</div>
              }
            </ParagonRing>

            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', color: '#F2F2F2', textAlign: 'center' }}>
              {member.name}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Belt badge */}
              <div style={{
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '4px 9px 4px 10px', borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${beltHex}`,
                color: '#F2F2F2',
              }}>
                {belt} belt
              </div>
              {/* Level badge */}
              <div style={{
                fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
                padding: '4px 9px', borderRadius: 6,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                color: '#000',
                boxShadow: '0 2px 8px rgba(200,162,76,0.35)',
              }}>
                LV {level}
              </div>
            </div>
          </button>

          {/* Family switcher */}
          {showFamily && (
            <div style={{ padding: '4px 12px 14px' }}>
              <div style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.18em',
                color: '#7A7A82', textTransform: 'uppercase',
                padding: '4px 6px 8px',
              }}>
                Linked Accounts
              </div>
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 6px 8px',
                scrollbarWidth: 'none',
              }}>
                {familyCards.map(fc => {
                  const active = fc.row === primaryRow;
                  const ringColor = active ? GOLD : 'rgba(255,255,255,0.1)';
                  const shadow = active ? `0 0 12px rgba(200,162,76,0.45)` : 'none';
                  return (
                    <button
                      key={fc.row}
                      onClick={() => handleSwitchFamily(fc)}
                      aria-label={`Switch to ${fc.name}`}
                      style={{
                        flexShrink: 0,
                        width: 72, padding: '8px 6px',
                        background: active ? 'rgba(200,162,76,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${active ? 'rgba(200,162,76,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 12,
                        cursor: 'pointer', color: '#F0F0F0',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: `2px solid ${ringColor}`,
                        boxShadow: shadow,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg,rgba(200,162,76,0.15),rgba(200,162,76,0.03))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: GOLD,
                      }}>
                        {fc.profilePic
                          ? <img src={fc.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span>{initialsFrom(fc.name)}</span>
                        }
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 600, color: active ? GOLD : '#BBB',
                        width: '100%', textAlign: 'center',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {fc.name.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
                {/* Add card */}
                <button
                  onClick={() => {
                    close();
                    setTimeout(() => window.open('mailto:info@labyrinth.vision?subject=Add%20Family%20Member', '_blank'), 100);
                  }}
                  aria-label="Add family member"
                  style={{
                    flexShrink: 0,
                    width: 72, padding: '8px 6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    cursor: 'pointer', color: '#888',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: '#6A6A74',
                  }}>+</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#888' }}>Add</div>
                </button>
              </div>
            </div>
          )}

          {/* Nav sections */}
          <nav style={{ padding: '2px 10px 14px' }}>
            {groups.map((g, gi) => (
              <div key={g.title} style={{ marginTop: gi === 0 ? 0 : 14 }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.2em',
                  color: '#6A6A74', textTransform: 'uppercase',
                  padding: '6px 10px 8px',
                }}>
                  {g.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {g.items.map(item => {
                    const isActive = !!item.path && location === item.path;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          else if (item.path) go(item.path);
                        }}
                        style={{
                          position: 'relative',
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 12px 11px 14px',
                          borderRadius: 10,
                          background: isActive
                            ? 'linear-gradient(90deg, rgba(200,162,76,0.16), rgba(200,162,76,0.02) 90%)'
                            : 'transparent',
                          border: 'none',
                          borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                          paddingLeft: isActive ? 11 : 14,
                          color: isActive ? '#FFF' : '#E0E0E0',
                          fontSize: 14, fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'background 120ms ease',
                        }}
                      >
                        <span style={{ width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.external && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '10px 14px 4px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <button
            onClick={handleSignOut}
            aria-label="Sign out"
            style={{
              width: '100%', padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#F87171',
              fontSize: 14, fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default LeftDrawer;
