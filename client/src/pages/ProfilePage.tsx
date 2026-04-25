/**
 * ProfilePage V3 — dynamic belt-driven theme. Redesigned 2026-04-25.
 * Spec: profile_reimagine_dynamic_themes.html
 *
 * Routes: /profile (own) and /profile/:email (other member)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { gasCall } from '@/lib/api';
import { ALL_ACHIEVEMENTS } from '@/lib/achievements';

const _PROFILE_V = 'v3.0';
(globalThis as any).__PROFILE_V = _PROFILE_V;

// ─── Belt → Theme map (from spec) ────────────────────────────────
const BELT_THEMES: Record<string, { color: string; rgb: string; label: string }> = {
  white:  { color: '#e5e7eb', rgb: '229,231,235', label: 'Iron Forge' },
  grey:   { color: '#9ca3af', rgb: '156,163,175', label: 'Steel Resolve' },
  gray:   { color: '#9ca3af', rgb: '156,163,175', label: 'Steel Resolve' },
  yellow: { color: '#facc15', rgb: '250,204,21',  label: 'Lightning Strike' },
  orange: { color: '#ea580c', rgb: '234,88,12',   label: 'Ember Rush' },
  green:  { color: '#22c55e', rgb: '34,197,94',   label: 'Viper Fang' },
  blue:   { color: '#3b82f6', rgb: '59,130,246',  label: 'Frozen Aura' },
  purple: { color: '#a855f7', rgb: '168,85,247',  label: 'Void Star' },
  brown:  { color: '#ea580c', rgb: '234,88,12',   label: 'Blood Flame' },
  black:  { color: '#eab308', rgb: '234,179,8',   label: 'Grandmaster Crown' },
};

function getBeltTheme(belt: string): { color: string; rgb: string; label: string } {
  const b = (belt || 'white').toLowerCase();
  // Strip kids split suffix (grey_white, yellow_black, etc.)
  const base = b.split('_')[0];
  return BELT_THEMES[b] || BELT_THEMES[base] || BELT_THEMES.white;
}

function getBeltSvgParams(belt: string, bar: string): { beltColor: string; barColor: string } {
  const b = (belt || 'white').toLowerCase();
  const isKids = ['grey', 'gray', 'yellow', 'orange', 'green'].includes(b);
  if (!isKids) {
    return { beltColor: b, barColor: b === 'black' ? 'red' : 'black' };
  }
  const base = b === 'gray' ? 'grey' : b;
  if (bar === 'white') return { beltColor: `${base}_white`, barColor: 'black' };
  if (bar === 'black') return { beltColor: `${base}_black`, barColor: 'black' };
  return { beltColor: base, barColor: 'none' };
}

// ─── Belt SVG generator (verbatim from spec HTML) ────────────────
function generateProfileBeltSVG(beltColor: string, barColor: string, stripes: number): string {
  const colors: Record<string, { main: string; edge: string }> = {
    white:  { main: '#f8f8f8', edge: '#d4d4d4' },
    blue:   { main: '#2563eb', edge: '#1d4ed8' },
    purple: { main: '#9333ea', edge: '#7e22ce' },
    brown:  { main: '#78350f', edge: '#451a03' },
    black:  { main: '#18181b', edge: '#000000' },
    grey:   { main: '#9ca3af', edge: '#6b7280' },
    yellow: { main: '#facc15', edge: '#ca8a04' },
    orange: { main: '#ea580c', edge: '#c2410c' },
    green:  { main: '#22c55e', edge: '#16a34a' },
  };

  const w = 440;
  const h = 56;
  const rx = 6;
  const barW = 84;
  const barX = w - barW - 16;

  let base = colors.white.main;
  let isCoral = false;
  let isKidsSplit = false;
  let kidsSplitMiddle = '';

  if (colors[beltColor]) {
    base = colors[beltColor].main;
  } else if (beltColor === 'red_black') {
    isCoral = true;
  } else if (beltColor.includes('_')) {
    const parts = beltColor.split('_');
    base = colors[parts[0]] ? colors[parts[0]].main : base;
    isKidsSplit = true;
    kidsSplitMiddle = parts[1] === 'white' ? '#f8f8f8' : '#18181b';
  }

  let barFill = '#18181b';
  if (barColor === 'red') barFill = '#ef4444';
  if (barColor === 'white') barFill = '#f8f8f8';

  const defs = `
    <defs>
      <filter id="beltTexture" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise"/>
        <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply"/>
      </filter>
      <filter id="beltShadow" x="-20%" y="-20%" width="140%" height="200%">
        <feDropShadow dx="0" dy="20" stdDeviation="15" flood-opacity="0.6"/>
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity="0.4"/>
      </filter>
      <linearGradient id="beltCurve" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.3)"/>
        <stop offset="10%" stop-color="rgba(255,255,255,0.1)"/>
        <stop offset="40%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="85%" stop-color="rgba(0,0,0,0.2)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.6)"/>
      </linearGradient>
      <linearGradient id="tapeCurve" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0.6)"/>
        <stop offset="15%" stop-color="rgba(255,255,255,0.1)"/>
        <stop offset="50%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="85%" stop-color="rgba(0,0,0,0.2)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
      </linearGradient>
      <linearGradient id="barShadowLeft" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(0,0,0,0.7)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
      </linearGradient>
      <linearGradient id="barShadowRight" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.7)"/>
      </linearGradient>
    </defs>
  `;

  let rects = '';
  if (isCoral) {
    rects += `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="#ef4444" />`;
    for (let i = 0; i < w; i += 45) {
      rects += `<rect x="${i}" y="0" width="22.5" height="${h}" fill="#18181b" />`;
    }
  } else {
    rects += `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${base}" />`;

    if (isKidsSplit) {
      const splitH = 16;
      const splitY = (h - splitH) / 2;
      const rightW = w - (barX + barW);

      rects += `
        <rect x="0" y="${splitY}" width="${barX}" height="${splitH}" fill="${kidsSplitMiddle}" />
        <rect x="0" y="${splitY}" width="${barX}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="0" y="${splitY + splitH - 2.5}" width="${barX}" height="2.5" fill="rgba(255,255,255,0.3)" />

        <rect x="${barX + barW}" y="${splitY}" width="${rightW}" height="${splitH}" fill="${kidsSplitMiddle}" />
        <rect x="${barX + barW}" y="${splitY}" width="${rightW}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${barX + barW}" y="${splitY + splitH - 2.5}" width="${rightW}" height="2.5" fill="rgba(255,255,255,0.3)" />
      `;
    }
  }

  const stitches = `
    <line x1="8" y1="10" x2="${w - 8}" y2="10" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="18" x2="${w - 8}" y2="18" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${h - 18}" x2="${w - 8}" y2="${h - 18}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${h - 10}" x2="${w - 8}" y2="${h - 10}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />

    <line x1="8" y1="11" x2="${w - 8}" y2="11" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
    <line x1="8" y1="19" x2="${w - 8}" y2="19" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
  `;

  let rankBar = '';
  if (barColor !== 'none') {
    rankBar += `<rect x="${barX - 5}" y="0" width="5" height="${h}" fill="url(#barShadowLeft)" />`;
    rankBar += `<rect x="${barX + barW}" y="0" width="5" height="${h}" fill="url(#barShadowRight)" />`;

    rankBar += `<rect x="${barX}" y="0" width="${barW}" height="${h}" fill="${barFill}" />`;

    rankBar += `<rect x="${barX}" y="0" width="1.5" height="${h}" fill="rgba(255,255,255,0.4)" />`;
    rankBar += `<rect x="${barX + barW - 1.5}" y="0" width="1.5" height="${h}" fill="rgba(0,0,0,0.8)" />`;

    const stripeColor = (barColor === 'white') ? '#18181b' : '#ffffff';
    for (let i = 0; i < stripes; i++) {
      const sx = barX + barW - 16 - (i * 15);

      rankBar += `<rect x="${sx - 3}" y="0" width="14" height="${h}" fill="rgba(0,0,0,0.5)" />`;
      rankBar += `<rect x="${sx}" y="0" width="8" height="${h}" fill="${stripeColor}" />`;
      rankBar += `<rect x="${sx}" y="0" width="8" height="${h}" fill="url(#tapeCurve)" />`;
      rankBar += `<rect x="${sx}" y="0" width="1" height="${h}" fill="rgba(255,255,255,0.6)" />`;
      rankBar += `<rect x="${sx + 7}" y="0" width="1" height="${h}" fill="rgba(0,0,0,0.6)" />`;
    }
  }

  return `
    <svg viewBox="0 -30 ${w} ${h + 60}" width="100%" height="100%">
      ${defs}
      <g filter="url(#beltShadow)">
        <g filter="url(#beltTexture)">
          ${rects}
          <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="url(#beltCurve)" />
          ${stitches}
          ${rankBar}
          <rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
          <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
        </g>
      </g>
    </svg>
  `;
}

// ─── CSS (scoped under .pdyn-root) ───────────────────────────────
const STYLE_TAG_ID = 'lbjj-profile-dynamic-styles';
const CSS = `
.pdyn-root {
  min-height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding: 0 0 calc(80px + env(safe-area-inset-bottom, 0px));
  transition: background 0.4s ease;
  color: var(--text-main, #f8f9fa);
  width: 100%;
}

.pdyn-top-nav {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(5,6,10,0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.pdyn-nav-btn {
  background: none; border: none; color: #fff;
  display: flex; align-items: center; gap: 6px;
  font-weight: 600; font-size: 15px; cursor: pointer; padding: 0;
  font-family: inherit;
  transition: color 0.2s; -webkit-tap-highlight-color: transparent;
}
.pdyn-nav-btn:active { color: #aaa; }

.pdyn-container { max-width: 480px; margin: 0 auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }

.pdyn-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
}

.pdyn-profile-header {
  display: flex; flex-direction: column; align-items: center;
  text-align: center; position: relative; overflow: visible;
}
.pdyn-profile-header::before {
  content: ''; position: absolute; top: -50px; left: 50%; transform: translateX(-50%);
  width: 150px; height: 150px;
  background: var(--theme-color);
  filter: blur(80px);
  opacity: 0.3;
  pointer-events: none;
  transition: background 0.4s ease;
}

.pdyn-avatar-wrap { position: relative; width: 96px; height: 96px; margin-bottom: 16px; z-index: 1; }
.pdyn-avatar-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px dashed var(--theme-color);
  animation: pdyn-spin 15s linear infinite;
  box-shadow: 0 0 20px var(--theme-glow);
  transition: border-color 0.4s, box-shadow 0.4s;
}
@keyframes pdyn-spin { 100% { transform: rotate(360deg); } }
.pdyn-avatar-img {
  width: 100%; height: 100%; border-radius: 50%;
  object-fit: cover; border: 2px solid rgba(255,255,255,0.1);
  background: #111; display: flex; align-items: center; justify-content: center;
  font-size: 32px; font-weight: 800; color: #fff; overflow: hidden;
  cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.pdyn-avatar-img img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

.pdyn-name { font-size: 24px; font-weight: 900; margin: 0 0 4px; letter-spacing: -0.02em; z-index: 1; color: var(--text-main); }
.pdyn-title-badge { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--theme-color); margin-bottom: 20px; z-index: 1; transition: color 0.4s; }

.pdyn-belt-wrap { width: 100%; max-width: 440px; margin: 0 auto 8px; position: relative; z-index: 2; cursor: pointer; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.pdyn-belt-wrap:active { transform: scale(0.97); }
.pdyn-belt-wrap svg { width: 100%; height: auto; display: block; overflow: visible; }

.pdyn-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; width: 100%; }
.pdyn-btn {
  padding: 14px 16px; border-radius: 14px; border: none; cursor: pointer;
  font-size: 13px; font-weight: 800; letter-spacing: 0.02em;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  transition: all 0.2s; -webkit-tap-highlight-color: transparent;
  color: #fff; font-family: inherit;
}
.pdyn-btn:active { transform: scale(0.96); }
.pdyn-btn-primary {
  background: linear-gradient(135deg, rgba(var(--theme-rgb),0.2), rgba(var(--theme-rgb),0.06));
  border: 1px solid rgba(var(--theme-rgb),0.35);
  color: var(--theme-color);
}
.pdyn-btn-secondary {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-muted);
}
.pdyn-btn svg { color: inherit; }

.pdyn-section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0 0 20px; display: flex; align-items: center; gap: 8px; }
.pdyn-section-title svg { color: var(--theme-color); transition: color 0.4s; }

.pdyn-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.pdyn-stat-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; }
.pdyn-stat-value { font-size: 32px; font-weight: 900; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
.pdyn-stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.pdyn-fire { color: #ef4444; font-size: 24px; filter: drop-shadow(0 0 8px rgba(239,68,68,0.6)); }

.pdyn-heatmap-wrapper { background: rgba(0,0,0,0.2); border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.03); }
.pdyn-heatmap-header { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #fff; margin-bottom: 16px; }
.pdyn-heatmap-legend-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 8px; text-align: center; font-size: 10px; font-weight: 800; color: var(--text-muted); }
.pdyn-heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
.pdyn-day { aspect-ratio: 1; border-radius: 4px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.03); transition: all 0.4s ease; }
.pdyn-day.l1 { background: rgba(var(--theme-rgb),0.35); border-color: rgba(var(--theme-rgb),0.45); }
.pdyn-day.l2 { background: rgba(var(--theme-rgb),0.7); border-color: rgba(var(--theme-rgb),0.8); box-shadow: 0 0 8px rgba(var(--theme-rgb),0.3); }
.pdyn-day.l3 { background: var(--theme-color); border-color: var(--theme-color); box-shadow: 0 0 12px var(--theme-glow); }
.pdyn-day.l4 { background: #fff; border-color: #fff; box-shadow: 0 0 16px #fff; }
.pdyn-heatmap-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

.pdyn-unlocks-list { display: flex; flex-direction: column; gap: 12px; }
.pdyn-unlock-card { display: flex; align-items: center; gap: 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 16px; position: relative; overflow: hidden; transition: transform 0.2s; }
.pdyn-unlock-card:active { transform: scale(0.98); }
.pdyn-unlock-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(0,0,0,0.4); display: grid; place-items: center; font-size: 24px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
.pdyn-unlock-info { flex: 1; min-width: 0; }
.pdyn-unlock-title { font-size: 15px; font-weight: 800; color: #fff; margin: 0 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pdyn-unlock-desc { font-size: 12px; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pdyn-rarity { font-size: 9px; font-weight: 900; padding: 4px 8px; border-radius: 6px; letter-spacing: 0.1em; flex-shrink: 0; }
.pdyn-rarity-common   { color: #9ca3af; background: rgba(156,163,175,0.15); border: 1px solid rgba(156,163,175,0.3); }
.pdyn-rarity-rare     { color: #60a5fa; background: rgba(96,165,250,0.15);  border: 1px solid rgba(96,165,250,0.3); }
.pdyn-rarity-epic     { color: #c084fc; background: rgba(192,132,252,0.15); border: 1px solid rgba(192,132,252,0.3); }
.pdyn-rarity-legendary{ color: #fbbf24; background: rgba(251,191,36,0.15);  border: 1px solid rgba(251,191,36,0.3); }
.pdyn-rarity-mythic   { color: #a855f7; background: rgba(168,85,247,0.15);  border: 1px solid rgba(168,85,247,0.3); }
.pdyn-unlock-card.epic-card::before     { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#c084fc; box-shadow:0 0 15px #c084fc; }
.pdyn-unlock-card.legendary-card::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#fbbf24; box-shadow:0 0 15px #fbbf24; }
.pdyn-unlock-card.rare-card::before     { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#60a5fa; box-shadow:0 0 15px #60a5fa; }
.pdyn-unlock-card.mythic-card::before   { content:''; position:absolute; left:0; top:0; bottom:0; width:4px; background:#a855f7; box-shadow:0 0 15px #a855f7; }

@keyframes pdyn-spin-load { 100% { transform: rotate(360deg); } }
.pdyn-spinner { width:36px; height:36px; border:3px solid rgba(255,255,255,0.1); border-top-color: var(--theme-color); border-radius:50%; animation: pdyn-spin-load 0.8s linear infinite; }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

const RARITY_CARD_CLASS: Record<string, string> = {
  epic: 'epic-card',
  legendary: 'legendary-card',
  rare: 'rare-card',
  mythic: 'mythic-card',
};

// ─── Component ───────────────────────────────────────────────────
export default function ProfilePage() {
  const params = useParams<{ email?: string }>();
  const viewEmail = params?.email ? decodeURIComponent(params.email) : null;
  const { member } = useAuth();
  const isOwnProfile = !viewEmail || (member && (member as any).email?.toLowerCase() === viewEmail.toLowerCase());
  const [, navigate] = useLocation();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    if (isOwnProfile) {
      const stats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
      const achievementsRaw = (() => { try { return JSON.parse(localStorage.getItem('lbjj_achievements') || '{}'); } catch { return {}; } })();
      const checkinHistory = (() => { try { return JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]'); } catch { return []; } })();
      const pfp = (() => { try { return localStorage.getItem('lbjj_profile_picture') || ''; } catch { return ''; } })();
      setProfileData({
        name: member?.name || 'Member',
        email: (member as any)?.email || '',
        belt: ((member as any)?.belt || 'white').toLowerCase(),
        stripes: Number((member as any)?.stripes || 0),
        bar: ((member as any)?.bar || 'none') as 'none' | 'white' | 'black',
        totalPoints: Math.max(stats.totalXP || 0, stats.xp || 0, (member as any)?.totalPoints || 0),
        classesAttended: (member as any)?.classesAttended || stats.classesAttended || 0,
        currentStreak: (member as any)?.currentStreak || stats.currentStreak || 0,
        maxStreak: (member as any)?.maxStreak || stats.maxStreak || stats.bestStreak || 0,
        achievements: achievementsRaw,
        checkinHistory,
        profilePic: pfp,
      });
      setLoading(false);
    } else if (viewEmail) {
      setLoading(true);
      const token = (() => { try { return localStorage.getItem('lbjj_session_token') || ''; } catch { return ''; } })();
      gasCall('getMemberByEmail', { token, email: viewEmail })
        .then((res: any) => {
          const m = res?.member || res || {};
          setProfileData({
            name: m.name || m.Name || viewEmail.split('@')[0] || 'Member',
            email: viewEmail,
            belt: (m.belt || m.Belt || 'white').toLowerCase(),
            stripes: Number(m.stripes || m.Stripes || 0),
            bar: ((m.bar || m.Bar || 'none') as 'none' | 'white' | 'black'),
            totalPoints: m.totalPoints || m.TotalPoints || 0,
            classesAttended: m.classesAttended || m.ClassesAttended || 0,
            currentStreak: m.currentStreak || m.CurrentStreak || 0,
            maxStreak: m.maxStreak || m.MaxStreak || 0,
            achievements: m.achievements || {},
            checkinHistory: [],
            profilePic: m.profilePic || m.ProfilePic || m.profilePicture || '',
          });
        })
        .catch(() => {
          setProfileData({
            name: viewEmail.split('@')[0] || 'Member',
            email: viewEmail,
            belt: 'white', stripes: 0, bar: 'none',
            totalPoints: 0, classesAttended: 0, currentStreak: 0, maxStreak: 0,
            achievements: {}, checkinHistory: [], profilePic: '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isOwnProfile, viewEmail, member]);

  const theme = getBeltTheme(profileData?.belt || 'white');

  const cssVars = {
    '--theme-color': theme.color,
    '--theme-rgb': theme.rgb,
    '--theme-glow': `rgba(${theme.rgb},0.4)`,
    '--bg-dark': '#05060a',
    '--card-bg': 'rgba(15,17,23,0.6)',
    '--card-border': 'rgba(255,255,255,0.08)',
    '--text-main': '#f8f9fa',
    '--text-muted': '#9ca3af',
    background: `radial-gradient(circle at 50% 0%, rgba(${theme.rgb},0.15), transparent 50%), #05060a`,
  } as React.CSSProperties;

  // 28-day heatmap (7 cols × 4 rows). Monday-first columns.
  const heatmapCells = useMemo(() => {
    const history: string[] = profileData?.checkinHistory || [];
    const histSet = new Set(history);
    const cells: number[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    // Find Monday of the week 4 weeks ago (so last row contains current week to-date)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon
    const startDay = new Date(now);
    startDay.setDate(now.getDate() - dayOfWeek - 21);
    for (let i = 0; i < 28; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      // Use local date string YYYY-MM-DD
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dd}`;
      const isFuture = d > now;
      cells.push(isFuture ? 0 : (histSet.has(dateStr) ? 3 : 0));
    }
    return cells;
  }, [profileData?.checkinHistory]);

  const recentAchievements = useMemo(() => {
    const earned = profileData?.achievements || {};
    if (!earned || typeof earned !== 'object') return [];
    const entries = Object.entries(earned)
      .map(([key, ts]) => {
        const def = ALL_ACHIEVEMENTS.find(a => a.key === key);
        if (!def) return null;
        return { key, ts: Number(ts) || 0, def };
      })
      .filter(Boolean) as { key: string; ts: number; def: typeof ALL_ACHIEVEMENTS[number] }[];
    entries.sort((a, b) => b.ts - a.ts);
    return entries.slice(0, 3);
  }, [profileData?.achievements]);

  if (loading || !profileData) {
    return (
      <div className="pdyn-root" style={{ ...cssVars, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="pdyn-spinner" />
      </div>
    );
  }

  const { beltColor, barColor } = getBeltSvgParams(profileData.belt || 'white', profileData.bar || 'none');
  const beltSvgHtml = generateProfileBeltSVG(beltColor, barColor, profileData.stripes || 0);
  const initials = (profileData.name || 'M').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="pdyn-root" style={cssVars}>
      <nav className="pdyn-top-nav">
        <button className="pdyn-nav-btn" onClick={() => window.history.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        {isOwnProfile && (
          <button className="pdyn-nav-btn" style={{ color: '#888', fontSize: 13 }} onClick={() => navigate('/account')} aria-label="Edit profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        )}
      </nav>

      <div className="pdyn-container">
        <div className="pdyn-card pdyn-profile-header">
          <div className="pdyn-avatar-wrap">
            <div className="pdyn-avatar-ring" />
            <div className="pdyn-avatar-img">
              {profileData.profilePic
                ? <img src={profileData.profilePic} alt="" />
                : initials}
            </div>
          </div>

          <h1 className="pdyn-name">{profileData.name}</h1>
          <div className="pdyn-title-badge">{theme.label}</div>

          <div
            className="pdyn-belt-wrap"
            dangerouslySetInnerHTML={{ __html: beltSvgHtml }}
            onClick={() => navigate(isOwnProfile ? '/belt' : `/belt/${encodeURIComponent(profileData.email || viewEmail || '')}`)}
          />

          <div className="pdyn-actions">
            <button
              className="pdyn-btn pdyn-btn-primary"
              onClick={() => navigate(isOwnProfile ? '/belt' : `/belt/${encodeURIComponent(profileData.email || viewEmail || '')}`)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Belt Journey
            </button>
            {!isOwnProfile ? (
              <button className="pdyn-btn pdyn-btn-secondary" onClick={() => navigate('/chat')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Message
              </button>
            ) : (
              <button className="pdyn-btn pdyn-btn-secondary" onClick={() => navigate('/achievements')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Achievements
              </button>
            )}
          </div>
        </div>

        <div className="pdyn-card">
          <h2 className="pdyn-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Activity & Momentum
          </h2>
          <div className="pdyn-stats-grid">
            <div className="pdyn-stat-box">
              <div className="pdyn-stat-value">{profileData.classesAttended || 0}</div>
              <div className="pdyn-stat-label">Classes Attended</div>
            </div>
            <div className="pdyn-stat-box">
              <div className="pdyn-stat-value">{profileData.maxStreak || 0} <span className="pdyn-fire">🔥</span></div>
              <div className="pdyn-stat-label">Longest Streak</div>
            </div>
          </div>

          {isOwnProfile && (
            <div className="pdyn-heatmap-wrapper">
              <div className="pdyn-heatmap-header">
                <span>Training Activity</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Last 28 Days</span>
              </div>
              <div className="pdyn-heatmap-legend-row">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="pdyn-heatmap-grid">
                {heatmapCells.map((level, i) => (
                  <div key={i} className={`pdyn-day${level > 0 ? ` l${Math.min(level, 4)}` : ''}`} />
                ))}
              </div>
              <div className="pdyn-heatmap-footer">
                <span>Consistency</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Less</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2, 3, 4].map(l => (
                      <div
                        key={l}
                        className={`pdyn-day${l > 0 ? ` l${l}` : ''}`}
                        style={{ width: 12, height: 12, aspectRatio: 'auto' }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {recentAchievements.length > 0 && (
          <div className="pdyn-card">
            <h2 className="pdyn-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              Recent Unlocks
            </h2>
            <div className="pdyn-unlocks-list">
              {recentAchievements.map(({ key, def }) => {
                const rarity = (def.rarity || 'Common').toLowerCase();
                const cardCls = RARITY_CARD_CLASS[rarity] || '';
                return (
                  <div key={key} className={`pdyn-unlock-card ${cardCls}`}>
                    <div className="pdyn-unlock-icon">{def.icon}</div>
                    <div className="pdyn-unlock-info">
                      <h3 className="pdyn-unlock-title">{def.label}</h3>
                      {def.desc && <p className="pdyn-unlock-desc">{def.desc}</p>}
                    </div>
                    <div className={`pdyn-rarity pdyn-rarity-${rarity}`}>{rarity.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
