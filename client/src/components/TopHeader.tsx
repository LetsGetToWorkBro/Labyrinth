/**
 * TopHeader V10 — fixed glass header w/ paragon theme tokens
 * Spec: persistent_header_v10_final_belts.html
 *
 * Layout: [Logo btn] [Center col (LV pill + title + bell, belt chip + epic XP bar + xp text)] [Paragon avatar]
 * Scroll: header collapses height 78 → 56 and hides bottom row
 * Theme:  level → bronze | frozen | void | blood | crown
 * Belt:   data-driven adult/kids belt chip with bar variant
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getActualLevel } from '@/lib/xp';
import { NotificationBell } from '@/components/NotificationTray';
import { OnlineBubble } from '@/components/OnlineBubble';
import { pushLocalNotification } from '@/components/NotificationProvider';
import logoMaze from '../assets/logo-maze.webp';

// ─── Theme system ────────────────────────────────────────────────
type ThemeKey = 'bronze' | 'frozen' | 'void' | 'blood' | 'crown';

const THEME_TIER_NAMES: Record<ThemeKey, string> = {
  bronze: 'Bronze Forge',
  frozen: 'Frozen Aura',
  void:   'Void Star',
  blood:  'Blood Flame',
  crown:  'Grandmaster Crown',
};

function levelToTheme(level: number): ThemeKey {
  if (level >= 40) return 'crown';   // Crown / Grandmaster
  if (level >= 30) return 'crown';   // Apex → reuse crown tokens (per spec)
  if (level >= 20) return 'blood';
  if (level >= 12) return 'void';
  if (level >= 6)  return 'frozen';
  if (level >= 3)  return 'bronze';
  return 'bronze'; // ember tier reuses bronze tokens
}

function readLiveXP(pts?: number): number {
  try {
    const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
    return Math.max(s.xp || 0, s.totalXP || 0, pts || 0);
  } catch { return pts || 0; }
}

// ─── Belt helpers ────────────────────────────────────────────────
function getBeltClass(belt: string, bar: string): string {
  const b = (belt || 'white').toLowerCase();
  const isKids = ['grey', 'gray', 'yellow', 'orange', 'green'].includes(b);
  if (!isKids) return `belt-${b}`;
  const beltKey = b === 'gray' ? 'grey' : b;
  const cssKey = beltKey === 'orange' ? 'yellow' : beltKey;
  if (bar === 'white') return `belt-kids-${cssKey}-white`;
  if (bar === 'black') return `belt-kids-${cssKey}-black`;
  return `belt-kids-${cssKey}`;
}

function getBeltAbbrev(belt: string, bar: string): string {
  const b = (belt || 'white').toLowerCase();
  const abbrevMap: Record<string, string> = {
    white: 'WHT', blue: 'BLU', purple: 'PUR', brown: 'BRN', black: 'BLK',
    grey: 'GRY', gray: 'GRY', yellow: 'YEL', orange: 'ORG', green: 'GRN',
  };
  const base = abbrevMap[b] || b.slice(0, 3).toUpperCase();
  if (bar === 'white') return `${base}/W`;
  if (bar === 'black') return `${base}/B`;
  return base;
}

// ─── Inline CSS (V10) ────────────────────────────────────────────
const STYLE_TAG_ID = 'lbjj-topheader-v10-styles';

const CSS = `
/* ── PERSISTENT HEADER V10 ── */
.v10-header {
  position: fixed; top: 0; left: 0; right: 0; max-width: 480px; margin: 0 auto;
  height: 78px; box-sizing: border-box;
  background: rgba(8, 8, 11, 0.75);
  backdrop-filter: blur(24px) saturate(120%); -webkit-backdrop-filter: blur(24px) saturate(120%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: end;
  padding: 0 16px 10px; z-index: 100;
  overflow: hidden;
  transition: height 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s;
}
.v10-header.scrolled { height: 56px; background: rgba(3, 3, 5, 0.9); box-shadow: 0 10px 30px rgba(0,0,0,0.5); align-items: center; }

.v10-logo-btn { width: 42px; height: 42px; cursor: pointer; background: none; border: none; padding: 0; position: relative; display: grid; place-items: center; border-radius: 50%; transition: all 0.3s; }
.v10-logo-btn:active { transform: scale(0.92); }
.v10-lab-logo { width: 100%; height: 100%; background-color: var(--theme-color); -webkit-mask-image: var(--lbj-logo-mask); mask-image: var(--lbj-logo-mask); -webkit-mask-size: contain; mask-size: contain; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; -webkit-mask-position: center; mask-position: center; transition: background-color 0.5s; filter: drop-shadow(0 0 6px var(--theme-glow)); }

.v10-center-col { display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; min-width: 0; }
.v10-center-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.v10-title-group { display: flex; align-items: center; gap: 6px; min-width: 0; }
.v10-lv-pill { background: var(--theme-grad); color: #000; font-size: 11px; font-weight: 900; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 8px var(--theme-glow); transition: all 0.5s; flex-shrink: 0; }
.v10-title-text { color: #fff; font-size: 14px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; transition: font-size 0.3s; }
.v10-action-group { display: flex; align-items: center; gap: 8px; flex-shrink: 0; height: 20px; overflow: visible; }
.v10-bell-btn { color: var(--theme-color); display: grid; place-items: center; position: relative; background: none; border: none; padding: 0; cursor: pointer; transition: color 0.5s; }
.v10-bell-badge { position: absolute; top: 0; right: 0; width: 6px; height: 6px; border-radius: 50%; background: #ef4444; border: 1px solid #030305; }

.v10-center-bottom { display: flex; align-items: center; gap: 8px; overflow: hidden; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); max-height: 20px; opacity: 1; }
.v10-header.scrolled .v10-center-bottom { max-height: 0; opacity: 0; margin-top: -6px; }

/* Belt chips */
.belt-chip {
  display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05);
  padding: 3px 8px 3px 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
  transition: all 0.3s;
}
.belt-visual {
  width: 14px; height: 14px; border-radius: 3px; position: relative; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.8); box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);
}
.belt-rank-bar { position: absolute; right: 0; top: 0; bottom: 0; width: 4px; border-left: 1px solid rgba(0,0,0,0.5); }
.belt-text { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }

/* Adult */
.belt-white .belt-visual { background: #f8f8f8; }
.belt-white .belt-rank-bar { background: #111; }
.belt-white .belt-text { color: #ccc; }

.belt-blue .belt-visual { background: #2563eb; }
.belt-blue .belt-rank-bar { background: #111; }
.belt-blue .belt-text { color: #60a5fa; }

.belt-purple .belt-visual { background: #9333ea; }
.belt-purple .belt-rank-bar { background: #111; }
.belt-purple .belt-text { color: #c084fc; }

.belt-brown .belt-visual { background: #78350f; }
.belt-brown .belt-rank-bar { background: #111; }
.belt-brown .belt-text { color: #d97706; }

.belt-black .belt-visual { background: #111; }
.belt-black .belt-rank-bar { background: #ef4444; }
.belt-black .belt-text { color: #ccc; }

/* Kids Grey */
.belt-kids-grey-white .belt-visual { background: linear-gradient(180deg, #9ca3af 38%, #f8f8f8 38%, #f8f8f8 62%, #9ca3af 62%); }
.belt-kids-grey-white .belt-rank-bar { background: #111; }
.belt-kids-grey-white .belt-text { color: #9ca3af; }
.belt-kids-grey .belt-visual { background: #9ca3af; }
.belt-kids-grey .belt-rank-bar { background: #111; }
.belt-kids-grey .belt-text { color: #9ca3af; }
.belt-kids-grey-black .belt-visual { background: linear-gradient(180deg, #9ca3af 38%, #111 38%, #111 62%, #9ca3af 62%); }
.belt-kids-grey-black .belt-rank-bar { background: #111; border-left: 1px solid rgba(255,255,255,0.3); }
.belt-kids-grey-black .belt-text { color: #9ca3af; }

/* Kids Yellow */
.belt-kids-yellow-white .belt-visual { background: linear-gradient(180deg, #facc15 38%, #f8f8f8 38%, #f8f8f8 62%, #facc15 62%); }
.belt-kids-yellow-white .belt-rank-bar { background: #111; }
.belt-kids-yellow-white .belt-text { color: #fde047; }
.belt-kids-yellow .belt-visual { background: #facc15; }
.belt-kids-yellow .belt-rank-bar { background: #111; }
.belt-kids-yellow .belt-text { color: #fde047; }
.belt-kids-yellow-black .belt-visual { background: linear-gradient(180deg, #facc15 38%, #111 38%, #111 62%, #facc15 62%); }
.belt-kids-yellow-black .belt-rank-bar { background: #111; border-left: 1px solid rgba(255,255,255,0.3); }
.belt-kids-yellow-black .belt-text { color: #fde047; }

/* Kids Green */
.belt-kids-green-white .belt-visual { background: linear-gradient(180deg, #22c55e 38%, #f8f8f8 38%, #f8f8f8 62%, #22c55e 62%); }
.belt-kids-green-white .belt-rank-bar { background: #111; }
.belt-kids-green-white .belt-text { color: #86efac; }
.belt-kids-green .belt-visual { background: #22c55e; }
.belt-kids-green .belt-rank-bar { background: #111; }
.belt-kids-green .belt-text { color: #86efac; }
.belt-kids-green-black .belt-visual { background: linear-gradient(180deg, #22c55e 38%, #111 38%, #111 62%, #22c55e 62%); }
.belt-kids-green-black .belt-rank-bar { background: #111; border-left: 1px solid rgba(255,255,255,0.3); }
.belt-kids-green-black .belt-text { color: #86efac; }

/* Epic XP bar */
.epic-xp-wrap { flex: 1; position: relative; height: 14px; background: rgba(0,0,0,0.8); border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); box-shadow: inset 0 2px 8px rgba(0,0,0,0.8); overflow: hidden; cursor: pointer; }
.epic-xp-fill { height: 100%; width: 0%; background: var(--theme-grad); box-shadow: 0 0 15px var(--theme-glow), inset 0 2px 4px rgba(255,255,255,0.3); transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.5s, box-shadow 0.5s; position: relative; overflow: hidden; }
.epic-xp-fill::before { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent); animation: v10-xp-scan 2s linear infinite; }
@keyframes v10-xp-scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.epic-xp-fill::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 6px; background: #fff; box-shadow: -2px 0 10px #fff, 0 0 15px var(--theme-color); border-radius: 3px; }
.epic-xp-ticks { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(90deg, transparent, transparent calc(10% - 1px), rgba(255,255,255,0.1) calc(10% - 1px), rgba(255,255,255,0.1) 10%); z-index: 2; }
.xp-text { font-size: 10px; font-weight: 700; color: #888; flex-shrink: 0; font-variant-numeric: tabular-nums; transition: color 0.3s; width: 42px; text-align: right; }

/* Paragon avatar */
.v10-paragon-avatar {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.v10-paragon-avatar:active .v10-avatar-inner { transform: scale(0.92); }

.v10-avatar-inner {
  width: 52px;
  height: 52px;
  min-width: 52px;
  min-height: 52px;
  border-radius: 50%;
  position: relative;
  transition: width 0.3s cubic-bezier(0.16,1,0.3,1), height 0.3s cubic-bezier(0.16,1,0.3,1), min-width 0.3s cubic-bezier(0.16,1,0.3,1), min-height 0.3s cubic-bezier(0.16,1,0.3,1);
  flex-shrink: 0;
}
.v10-header.scrolled .v10-avatar-inner {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}
.v10-ring { position: absolute; inset: 0; transition: all 0.5s; z-index: 2; pointer-events: none; }
.v10-avatar-img { position: absolute; inset: 4px; border-radius: 50%; background: #333; overflow: hidden; border: 1px solid rgba(0,0,0,0.5); transition: inset 0.3s; z-index: 1; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; }
.v10-header.scrolled .v10-avatar-img { inset: 2px; }
.v10-avatar-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* Themes */
.v10-theme-bronze { --theme-color: #CD7F32; --theme-glow: rgba(205, 127, 50, 0.4); --theme-grad: linear-gradient(90deg, #8A5A19, #CD7F32, #F4A460); }
.v10-theme-bronze .v10-ring { border-radius: 50%; border: 2px solid var(--theme-color); box-shadow: 0 0 10px var(--theme-glow), inset 0 0 8px var(--theme-glow); }
.v10-theme-bronze .orb { position: absolute; width: 6px; height: 6px; border-radius: 50%; background: #F4A460; box-shadow: 0 0 8px var(--theme-color); }
.v10-theme-bronze .orb.top { top: -3px; left: 50%; transform: translateX(-50%); }
.v10-theme-bronze .orb.bottom { bottom: -3px; left: 50%; transform: translateX(-50%); }

.v10-theme-frozen { --theme-color: #3b82f6; --theme-glow: rgba(59, 130, 246, 0.5); --theme-grad: linear-gradient(90deg, #1e3a8a, #3b82f6, #93c5fd); }
.v10-theme-frozen .v10-ring { border-radius: 50%; border: 2px solid var(--theme-color); box-shadow: 0 0 15px var(--theme-glow), inset 0 0 10px var(--theme-glow); }
.v10-theme-frozen .orb { position: absolute; width: 10px; height: 10px; background: #93c5fd; transform: rotate(45deg); box-shadow: 0 0 10px var(--theme-color); }
.v10-theme-frozen .orb.top { top: -5px; left: 50%; margin-left: -5px; }
.v10-theme-frozen .orb.bottom { bottom: -5px; left: 50%; margin-left: -5px; }

.v10-theme-void { --theme-color: #a855f7; --theme-glow: rgba(168, 85, 247, 0.6); --theme-grad: linear-gradient(90deg, #581c87, #a855f7, #d8b4fe); }
.v10-theme-void .v10-ring { border-radius: 50%; border: 2px dashed var(--theme-color); box-shadow: 0 0 20px var(--theme-glow), inset 0 0 15px var(--theme-glow); animation: v10-slow-spin 10s linear infinite; }
.v10-theme-void .orb { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: radial-gradient(circle at center, #e9d5ff, #a855f7); box-shadow: 0 0 15px var(--theme-color); }
.v10-theme-void .orb.top { top: -2px; right: -2px; }
@keyframes v10-slow-spin { 100% { transform: rotate(360deg); } }

.v10-theme-blood { --theme-color: #ef4444; --theme-glow: rgba(239, 68, 68, 0.6); --theme-grad: linear-gradient(90deg, #7f1d1d, #ef4444, #fca5a5); }
.v10-theme-blood .v10-ring { border-radius: 50%; border: 2px solid var(--theme-color); box-shadow: 0 0 25px var(--theme-glow), inset 0 0 15px var(--theme-glow); }
.v10-theme-blood .orb { position: absolute; width: 14px; height: 20px; background: linear-gradient(180deg, #fca5a5, #ef4444); clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); box-shadow: 0 0 15px var(--theme-color); }
.v10-theme-blood .orb.top { top: -10px; left: 50%; transform: translateX(-50%); }
.v10-theme-blood .orb.bottom { bottom: -10px; left: 50%; transform: translateX(-50%); }

.v10-theme-crown { --theme-color: #D4AF37; --theme-glow: rgba(212, 175, 55, 0.6); --theme-grad: linear-gradient(90deg, #8a6507, #D4AF37, #FFF0B3); }
.v10-theme-crown .v10-ring { border-radius: 50%; border: 3px solid var(--theme-color); box-shadow: 0 0 30px var(--theme-glow), inset 0 0 20px var(--theme-glow); }
.v10-theme-crown .orb { position: absolute; width: 14px; height: 14px; background: #FFF0B3; transform: rotate(45deg); box-shadow: 0 0 20px var(--theme-color); }
.v10-theme-crown .orb.left { left: -7px; top: 50%; margin-top: -7px; }
.v10-theme-crown .orb.right { right: -7px; top: 50%; margin-top: -7px; }
.v10-theme-crown .orb.bottom { bottom: -6px; left: 50%; margin-left: -8px; width: 16px; height: 16px; border-radius: 50%; background: #FFF0B3; transform: none; }

/* Effects */
.v10-level-up-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; animation: v10-flash 0.8s ease-out forwards; z-index: 10; border-radius: 6px; }
@keyframes v10-flash { 0% { opacity: 0.8; box-shadow: 0 0 30px #fff; } 100% { opacity: 0; } }
.v10-ring-spin { animation: v10-spin 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes v10-spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
.v10-lv-pop { animation: v10-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
@keyframes v10-pop { 0% { transform: scale(1); } 50% { transform: scale(1.3); background: #fff; color: var(--theme-color); } 100% { transform: scale(1); } }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// Resolve logo as a CSS mask URL once for the lab-logo element.
const LOGO_MASK_VAR = `url("${logoMaze}")`;

// ─── TopHeader ────────────────────────────────────────────────────
export function TopHeader({ onMenuOpen, onXpOpen }: { onMenuOpen: () => void; onXpOpen: () => void }) {
  const { member, isAuthenticated } = useAuth();

  const [liveXP, setLiveXP] = useState(() => readLiveXP((member as any)?.totalPoints));
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const [popKey, setPopKey] = useState(0);
  const [spinKey, setSpinKey] = useState(0);
  const prevLevelRef = useRef(1);
  const lockedRef = useRef(false);
  const xpFillRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (spacerRef.current) {
      spacerRef.current.style.height = scrolled
        ? 'calc(56px + env(safe-area-inset-top, 0px))'
        : 'calc(78px + env(safe-area-inset-top, 0px))';
    }
  }, [scrolled]);

  // XP sync
  useEffect(() => {
    const sync = () => setLiveXP(readLiveXP((member as any)?.totalPoints));
    sync();
    window.addEventListener('xp-updated', sync);
    window.addEventListener('checkin-complete', sync);
    return () => {
      window.removeEventListener('xp-updated', sync);
      window.removeEventListener('checkin-complete', sync);
    };
  }, [member]);

  // Hide on chat/admin
  useEffect(() => {
    const h = () => {
      const hash = window.location.hash;
      setHidden(hash.includes('/chat') || hash.includes('/admin'));
    };
    h();
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  // Scroll — listen broadly so we catch any page-specific scroll container
  useEffect(() => {
    const checkScroll = () => {
      const appContent = document.querySelector('.app-content') as HTMLElement | null;
      const docEl = document.documentElement;
      const scrollTop = Math.max(
        window.scrollY || 0,
        docEl?.scrollTop || 0,
        appContent?.scrollTop || 0,
      );
      setScrolled(scrollTop > 20);
    };
    checkScroll();

    window.addEventListener('scroll', checkScroll, { passive: true });
    document.addEventListener('scroll', checkScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', checkScroll);
      document.removeEventListener('scroll', checkScroll, { capture: true } as any);
    };
  }, []);

  // Initial level
  useEffect(() => {
    const xp = readLiveXP((member as any)?.totalPoints);
    prevLevelRef.current = getActualLevel(xp);
  }, []);

  // Watch for level up → trigger animations + global overlay
  useEffect(() => {
    const newLv = getActualLevel(liveXP);
    const oldLv = prevLevelRef.current;
    if (newLv > oldLv && !lockedRef.current) {
      lockedRef.current = true;
      const { title } = getLevelFromXP(liveXP);
      try {
        pushLocalNotification({
          type: 'level_up',
          title: 'Level Up! ⚡',
          body: `You reached Level ${newLv} — ${title}!`,
          data: { route: '/' },
        });
      } catch {}
      // Fire global event so App.tsx can show LevelUpOverlay
      window.dispatchEvent(new CustomEvent('level-up', { detail: { newLevel: newLv, prevLevel: oldLv } }));
      setFlashKey(k => k + 1);
      setPopKey(k => k + 1);
      setSpinKey(k => k + 1);
      setTimeout(() => { lockedRef.current = false; }, 1200);
    }
    prevLevelRef.current = newLv;
  }, [liveXP]);

  if (!isAuthenticated || !member || hidden) return null;

  const xp = liveXP;
  const level = getActualLevel(xp);
  const { xpForLevel, xpForNext, progress } = getLevelFromXP(xp);
  const themeKey = levelToTheme(level);
  const tierName = THEME_TIER_NAMES[themeKey];

  const belt = ((member as any)?.belt || 'white').toLowerCase();
  const bar = (member as any)?.bar || 'none';
  const beltClass = getBeltClass(belt, bar);
  const beltAbbrev = getBeltAbbrev(belt, bar);

  const xpInLevel = Math.max(0, Math.round(xp - xpForLevel));
  const xpNeeded = Math.max(1, Math.round(xpForNext - xpForLevel));
  const xpPct = Math.max(2, Math.min(100, progress * 100));

  const avatarSrc = (() => {
    try { return localStorage.getItem('lbjj_profile_picture') || ''; } catch { return ''; }
  })();
  const initials = member.name
    ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const goAccount = () => { onXpOpen(); };

  // Orbs vary by theme
  const orbs = (() => {
    if (themeKey === 'crown') {
      return (
        <>
          <div className="orb left" /><div className="orb right" /><div className="orb bottom" />
        </>
      );
    }
    if (themeKey === 'void') {
      return <div className="orb top" />;
    }
    return (
      <>
        <div className="orb top" /><div className="orb bottom" />
      </>
    );
  })();

  return (
    <>
      {/* Spacer reserves vertical space since the header is position:fixed */}
      <div
        ref={spacerRef}
        aria-hidden
        style={{
          height: 'calc(78px + env(safe-area-inset-top, 0px))',
          flexShrink: 0,
          width: '100%',
          transition: 'height 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
      <header
      className={`v10-header v10-theme-${themeKey} ${scrolled ? 'scrolled' : ''}`}
      style={{ ['--lbj-logo-mask' as any]: LOGO_MASK_VAR } as React.CSSProperties}
    >
      <button className="v10-logo-btn" onClick={onMenuOpen} aria-label="Open menu">
        <div className="v10-lab-logo" />
      </button>

      <div className="v10-center-col">
        <div className="v10-center-top">
          <div className="v10-title-group">
            <span key={`pill-${popKey}`} className={`v10-lv-pill ${popKey > 0 ? 'v10-lv-pop' : ''}`}>LV{level}</span>
            <span className="v10-title-text">{tierName}</span>
          </div>
          <div className="v10-action-group">
            <OnlineBubble compact />
            <NotificationBell />
          </div>
        </div>

        <div className="v10-center-bottom">
          <div className={`belt-chip ${beltClass}`}>
            <div className="belt-visual"><div className="belt-rank-bar" /></div>
            <span className="belt-text">{beltAbbrev}</span>
          </div>

          <div className="epic-xp-wrap" onClick={onXpOpen} role="button" aria-label="View XP and level">
            <div className="epic-xp-ticks" />
            <div ref={xpFillRef} className="epic-xp-fill" style={{ width: `${xpPct}%` }}>
              {flashKey > 0 && <div key={`flash-${flashKey}`} className="v10-level-up-flash" />}
            </div>
          </div>
          <span className="xp-text">{xpInLevel}/{xpNeeded}</span>
        </div>
      </div>

      <button
        className="v10-paragon-avatar"
        onClick={goAccount}
        aria-label="View account"
        key={`av-${spinKey}`}
      >
        <div className={`v10-avatar-inner ${spinKey > 0 ? 'v10-ring-spin' : ''}`}>
          <div className="v10-ring" />
          <div>{orbs}</div>
          <div className="v10-avatar-img">
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" />
              : <span>{initials}</span>}
          </div>
        </div>
      </button>
    </header>
    </>
  );
}
