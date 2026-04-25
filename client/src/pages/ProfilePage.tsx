/**
 * ProfilePage — view a member profile (own or another's).
 * Spec: profile_reimagine_v2.html
 *
 * Routes: /profile (own) and /profile/:email (other member)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { getActualLevel, getLevelFromXP } from '@/lib/xp';
import { gasCall } from '@/lib/api';
import { ALL_ACHIEVEMENTS } from '@/lib/achievements';

// ─── Belt SVG (mirrors BeltJourneyPage.tsx) ──────────────────────
const BELT_DEFS: Record<string, { base: string; light: string; dark: string; darkest: string; glow: string; name: string }> = {
  white:  { base: '#E5E5E5', light: '#FFFFFF', dark: '#B0B0B0', darkest: '#888888', glow: 'rgba(255,255,255,0.4)', name: 'White' },
  grey:   { base: '#A0A0A0', light: '#C0C0C0', dark: '#808080', darkest: '#606060', glow: 'rgba(160,160,160,0.4)', name: 'Grey' },
  yellow: { base: '#FFD700', light: '#FFEB3B', dark: '#FFA500', darkest: '#FF8C00', glow: 'rgba(255,215,0,0.5)',   name: 'Yellow' },
  orange: { base: '#FF8C00', light: '#FFA500', dark: '#FF6347', darkest: '#FF4500', glow: 'rgba(255,140,0,0.5)',   name: 'Orange' },
  green:  { base: '#228B22', light: '#32CD32', dark: '#006400', darkest: '#004000', glow: 'rgba(34,139,34,0.5)',   name: 'Green' },
  blue:   { base: '#1A56DB', light: '#4A7FF0', dark: '#103A99', darkest: '#0A2266', glow: 'rgba(26,86,219,0.5)',  name: 'Blue' },
  purple: { base: '#7E3AF2', light: '#A26DF8', dark: '#521BA6', darkest: '#2E0F5C', glow: 'rgba(126,58,242,0.5)', name: 'Purple' },
  brown:  { base: '#92400E', light: '#B85E24', dark: '#632A08', darkest: '#381603', glow: 'rgba(146,64,14,0.5)',  name: 'Brown' },
  black:  { base: '#222222', light: '#444444', dark: '#111111', darkest: '#000000', glow: 'rgba(200,162,76,0.4)', name: 'Black' },
};

let pageBeltUid = 0;
function beltSVG(belt: string, stripes = 0, size = 320, bar: 'none' | 'white' | 'black' = 'none'): string {
  pageBeltUid++;
  const c = BELT_DEFS[belt] || BELT_DEFS.white;
  const isBlack = belt === 'black';
  const barColor = isBlack ? '#C71A1A' : '#111111';
  const barLight = isBlack ? '#E83A3A' : '#2A2A2A';
  const barDark  = isBlack ? '#800B0B' : '#050505';

  const beltH = Math.round(size * 0.36);
  const beltY = Math.round((size - beltH) / 2);
  const barW  = Math.round(size * 0.26);
  const barX  = 6;
  const rx    = Math.round(size * 0.05);

  const gradId    = 'pgrad-' + belt + '-' + pageBeltUid;
  const barGradId = 'pbarGrad-' + belt + '-' + pageBeltUid;
  const tapeGradId = 'ptapeGrad-' + pageBeltUid;
  const patternId = 'pweave-' + pageBeltUid;
  const hBarGradId = 'phBarGrad-' + pageBeltUid;

  const defs = `
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c.dark}" />
        <stop offset="15%" stop-color="${c.base}" />
        <stop offset="35%" stop-color="${c.light}" />
        <stop offset="50%" stop-color="${c.base}" />
        <stop offset="85%" stop-color="${c.dark}" />
        <stop offset="100%" stop-color="${c.darkest}" />
      </linearGradient>
      <linearGradient id="${barGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${barDark}" />
        <stop offset="15%" stop-color="${barColor}" />
        <stop offset="35%" stop-color="${barLight}" />
        <stop offset="50%" stop-color="${barColor}" />
        <stop offset="85%" stop-color="${barDark}" />
        <stop offset="100%" stop-color="#000" />
      </linearGradient>
      <linearGradient id="${tapeGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#AAAAAA" />
        <stop offset="15%" stop-color="#FFFFFF" />
        <stop offset="35%" stop-color="#F5F5F5" />
        <stop offset="50%" stop-color="#EEEEEE" />
        <stop offset="85%" stop-color="#CCCCCC" />
        <stop offset="100%" stop-color="#666666" />
      </linearGradient>
      <linearGradient id="${hBarGradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bar === 'white' ? '#D0D0D0' : '#1A1A1A'}" />
        <stop offset="15%" stop-color="${bar === 'white' ? '#FFFFFF' : '#333333'}" />
        <stop offset="35%" stop-color="${bar === 'white' ? '#F5F5F5' : '#222222'}" />
        <stop offset="50%" stop-color="${bar === 'white' ? '#EEEEEE' : '#222222'}" />
        <stop offset="85%" stop-color="${bar === 'white' ? '#D0D0D0' : '#1A1A1A'}" />
        <stop offset="100%" stop-color="${bar === 'white' ? '#A0A0A0' : '#000000'}" />
      </linearGradient>
      <pattern id="${patternId}" patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" transform="translate(1,0)" />
      </pattern>
    </defs>
  `;

  let stripesSVG = '';
  const sw = Math.max(1.5, size * 0.035);
  const gap = Math.max(1, size * 0.025);
  const startOffset = Math.max(2, size * 0.03);
  for (let i = 0; i < stripes; i++) {
    const sx = barX + barW - startOffset - (i * (sw + gap)) - sw;
    stripesSVG += `
      <g>
        <rect x="${sx}" y="${beltY}" width="${sw}" height="${beltH}" fill="url(#${tapeGradId})" />
        <rect x="${sx}" y="${beltY}" width="${sw}" height="${beltH}" fill="url(#${patternId})" opacity="0.3" />
        <rect x="${sx}" y="${beltY}" width="0.5" height="${beltH}" fill="rgba(0,0,0,0.3)" />
        <rect x="${sx + sw - 0.5}" y="${beltY}" width="0.5" height="${beltH}" fill="rgba(0,0,0,0.3)" />
      </g>
    `;
  }

  let barStripesSVG = '';
  if (bar !== 'none') {
    const barH = Math.round(beltH * 0.22);
    const barStripY = beltY + Math.round((beltH - barH) / 2);
    const leftWidth = barX;
    const rightStart = barX + barW;
    const rightWidth = size - barX - barW - 2;
    barStripesSVG = `
      <g>
        <rect x="2" y="${barStripY}" width="${leftWidth - 2}" height="${barH}" fill="url(#${hBarGradId})" />
        <rect x="2" y="${barStripY}" width="${leftWidth - 2}" height="${barH}" fill="url(#${patternId})" opacity="0.15" />
        <rect x="${rightStart}" y="${barStripY}" width="${rightWidth}" height="${barH}" fill="url(#${hBarGradId})" />
        <rect x="${rightStart}" y="${barStripY}" width="${rightWidth}" height="${barH}" fill="url(#${patternId})" opacity="0.15" />
      </g>
    `;
  }

  let framingSVG = '';
  if (isBlack) {
    const fw = Math.max(1.5, size * 0.025);
    framingSVG = `
      <rect x="${barX}" y="${beltY}" width="${fw}" height="${beltH}" fill="url(#${tapeGradId})" />
      <rect x="${barX + barW - fw}" y="${beltY}" width="${fw}" height="${beltH}" fill="url(#${tapeGradId})" />
    `;
  }

  return `
    <svg viewBox="0 0 ${size} ${size}" width="100%" height="auto" style="overflow:visible; display:block;">
      ${defs}
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="url(#${gradId})" />
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="url(#${patternId})" />
      ${barStripesSVG}
      <rect x="${barX}" y="${beltY}" width="${barW}" height="${beltH}" fill="url(#${barGradId})" />
      <rect x="${barX}" y="${beltY}" width="${barW}" height="${beltH}" fill="url(#${patternId})" />
      ${framingSVG}
      ${stripesSVG}
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
      <rect x="2" y="${beltY}" width="${size - 4}" height="${beltH}" rx="${rx}" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1" transform="translate(0,1)"/>
    </svg>
  `;
}

// ─── Theme (mirrors TopHeader V10) ───────────────────────────────
type ThemeKey = 'bronze' | 'frozen' | 'void' | 'blood' | 'crown';
const THEME_PALETTE: Record<ThemeKey, { color: string; light: string; glow: string }> = {
  bronze: { color: '#CD7F32', light: '#F4A460', glow: 'rgba(205,127,50,0.4)' },
  frozen: { color: '#3b82f6', light: '#93c5fd', glow: 'rgba(59,130,246,0.5)' },
  void:   { color: '#a855f7', light: '#d8b4fe', glow: 'rgba(168,85,247,0.6)' },
  blood:  { color: '#ef4444', light: '#fca5a5', glow: 'rgba(239,68,68,0.6)' },
  crown:  { color: '#D4AF37', light: '#FFF0B3', glow: 'rgba(212,175,55,0.6)' },
};
function levelToTheme(level: number): ThemeKey {
  if (level >= 30) return 'crown';
  if (level >= 20) return 'blood';
  if (level >= 12) return 'void';
  if (level >= 6)  return 'frozen';
  return 'bronze';
}

// ─── Rarity colors ───────────────────────────────────────────────
const RARITY_COLORS: Record<string, { color: string; bg: string }> = {
  Common:    { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  Rare:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Epic:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  Legendary: { color: '#D4AF37', bg: 'rgba(212,175,55,0.12)' },
  Mythic:    { color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

// ─── Inline CSS ──────────────────────────────────────────────────
const STYLE_TAG_ID = 'lbjj-profile-page-styles';
const CSS = `
.pp-root { --gold-primary: #D4AF37; --gold-light: #FFF0B3; --gold-dark: #8A6507; --bg-card: rgba(255,255,255,0.02); --border-card: rgba(255,255,255,0.05); width: 100%; max-width: 480px; margin: 0 auto; min-height: 100vh; background: #030305; position: relative; overflow-x: hidden; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); color: #fff; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.pp-top-nav { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; background: rgba(3,3,5,0.8); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
.pp-nav-btn { background: none; border: none; color: #fff; display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 16px; cursor: pointer; padding: 0; transition: color 0.2s; }
.pp-nav-btn:active { color: #aaa; }
.pp-profile-hero { position: relative; padding: 32px 20px 0; display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: -40px; }
.pp-hero-glow { position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; background: var(--theme-glow, rgba(212,175,55,0.15)); filter: blur(60px); border-radius: 50%; z-index: 0; pointer-events: none; }
.pp-paragon-frame { position: relative; width: 100px; height: 100px; z-index: 1; margin-bottom: 16px; }
.pp-frame-ring { position: absolute; inset: 0; border: 3px solid var(--theme-color, var(--gold-primary)); border-radius: 50%; box-shadow: 0 0 20px var(--theme-glow, rgba(212,175,55,0.4)), inset 0 0 10px var(--theme-glow, rgba(212,175,55,0.4)); }
.pp-frame-orb { position: absolute; width: 10px; height: 10px; background: var(--theme-light, var(--gold-light)); border-radius: 50%; box-shadow: 0 0 10px var(--theme-color, var(--gold-primary)); }
.pp-frame-orb.top { top: -5px; left: 50%; transform: translateX(-50%); }
.pp-frame-orb.bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }
.pp-frame-orb.left { left: -5px; top: 50%; transform: translateY(-50%); }
.pp-frame-orb.right { right: -5px; top: 50%; transform: translateY(-50%); }
.pp-avatar-img { position: absolute; inset: 6px; border-radius: 50%; background: #222; overflow: hidden; display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: 800; color: #fff; }
.pp-avatar-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pp-user-name { font-size: 26px; font-weight: 900; color: #fff; margin: 0 0 4px 0; letter-spacing: -0.02em; z-index: 1; position: relative; }
.pp-user-handle { font-size: 14px; font-weight: 600; color: #888; margin: 0 0 24px 0; z-index: 1; position: relative; }
.pp-hero-belt-wrap { width: 320px; max-width: 100%; position: relative; z-index: 2; filter: drop-shadow(0 20px 20px rgba(0,0,0,0.8)); transform: translateZ(40px); margin-bottom: 24px; }
.pp-hero-belt-wrap svg { width: 100%; height: auto; display: block; overflow: visible; }
.pp-dashboard { padding: 40px 20px 0; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 1; background: linear-gradient(180deg, transparent, #030305 40px); }
.pp-card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 20px; padding: 20px; backdrop-filter: blur(10px); }
.pp-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.pp-card-title { font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
.pp-card-title svg { color: var(--gold-primary); }
.pp-action-link { font-size: 12px; font-weight: 700; color: var(--gold-primary); text-decoration: none; cursor: pointer; background: none; border: none; padding: 0; }
.pp-quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.pp-btn-action { padding: 14px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; font-size: 13px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.pp-btn-action svg { color: var(--gold-primary); }
.pp-btn-action:active { transform: scale(0.96); background: rgba(255,255,255,0.06); }
.pp-btn-action.primary { background: linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02)); border-color: rgba(212,175,55,0.3); }
.pp-activity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.pp-activity-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 14px; padding: 16px; position: relative; overflow: hidden; }
.pp-activity-icon { position: absolute; right: 12px; top: 12px; opacity: 0.1; color: #fff; }
.pp-activity-val { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 4px; display: flex; align-items: baseline; gap: 4px; }
.pp-activity-unit { font-size: 12px; font-weight: 700; color: #666; }
.pp-activity-label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
.pp-streak-fire { color: #ef4444; filter: drop-shadow(0 0 8px rgba(239,68,68,0.5)); }
.pp-achievements-list { display: flex; flex-direction: column; gap: 10px; }
.pp-achievement-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; }
.pp-ach-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2); display: grid; place-items: center; color: var(--gold-primary); flex-shrink: 0; font-size: 22px; }
.pp-ach-info { flex: 1; min-width: 0; }
.pp-ach-title { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pp-ach-date { font-size: 11px; font-weight: 600; color: #666; }
.pp-ach-rarity { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
.pp-heatmap-container { width: 100%; display: flex; gap: 4px; margin-top: 12px; overflow-x: hidden; }
.pp-heat-col { display: flex; flex-direction: column; gap: 4px; }
.pp-heat-cell { width: 12px; height: 12px; border-radius: 2px; background: rgba(255,255,255,0.05); }
.pp-heat-cell.l3 { background: rgba(212,175,55,1); box-shadow: 0 0 5px rgba(212,175,55,0.5); }
.pp-empty { font-size: 13px; color: #666; text-align: center; padding: 12px 0; }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ─── Helpers ─────────────────────────────────────────────────────
function timeAgo(ms?: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  if (diff < 0) return 'just now';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function makeHandle(name: string, email?: string): string {
  if (name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '_');
    return `@${slug}`;
  }
  if (email) return `@${email.split('@')[0]}`;
  return '@member';
}

// ─── Component ───────────────────────────────────────────────────
export default function ProfilePage() {
  const params = useParams<{ email?: string }>();
  const [, navigate] = useLocation();
  const { member: ownMember } = useAuth();
  const targetEmail = params.email ? decodeURIComponent(params.email) : '';
  const isOwn = !targetEmail || (ownMember && (ownMember as any).email?.toLowerCase() === targetEmail.toLowerCase());

  const [enriched, setEnriched] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { injectStyles(); }, []);

  // Fetch other member when needed
  useEffect(() => {
    if (isOwn) return;
    if (!targetEmail) return;
    setLoading(true);
    gasCall('getMemberByEmail', { email: targetEmail })
      .then((res: any) => {
        if (res?.member) setEnriched(res.member);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOwn, targetEmail]);

  // Resolve data
  const data = useMemo(() => {
    if (isOwn && ownMember) {
      const stats = (() => {
        try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); }
        catch { return {}; }
      })();
      const xpVal = Math.max(stats.xp || 0, stats.totalXP || 0, (ownMember as any).totalPoints || 0);
      const profilePic = (() => {
        try { return localStorage.getItem('lbjj_profile_picture') || ''; } catch { return ''; }
      })();
      return {
        name: ownMember.name || 'Member',
        email: (ownMember as any).email || '',
        belt: ((ownMember as any).belt || 'white').toLowerCase(),
        bar: ((ownMember as any).bar || 'none') as 'none' | 'white' | 'black',
        stripes: Number((ownMember as any).stripes || 0),
        xp: xpVal,
        classesAttended: (ownMember as any).classesAttended || stats.classesAttended || 0,
        currentStreak: (ownMember as any).currentStreak || stats.currentStreak || 0,
        maxStreak: (ownMember as any).maxStreak || stats.maxStreak || stats.bestStreak || 0,
        profilePic,
      };
    }
    if (enriched) {
      return {
        name: enriched.name || 'Member',
        email: enriched.email || targetEmail,
        belt: (enriched.belt || 'white').toLowerCase(),
        bar: (enriched.bar || 'none') as 'none' | 'white' | 'black',
        stripes: Number(enriched.stripes || 0),
        xp: enriched.totalPoints || 0,
        classesAttended: enriched.classesAttended || 0,
        currentStreak: enriched.currentStreak || 0,
        maxStreak: enriched.maxStreak || 0,
        profilePic: enriched.profilePicture || '',
      };
    }
    return null;
  }, [isOwn, ownMember, enriched, targetEmail]);

  // Heatmap (own profile only — other members don't expose history)
  const heatmap = useMemo(() => {
    if (!isOwn) return null;
    let history: string[] = [];
    try { history = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]'); }
    catch { history = []; }
    const set = new Set(history);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 12 cols x 4 rows = 48 days, oldest on left
    const cols: { active: boolean }[][] = [];
    for (let c = 0; c < 12; c++) {
      const col: { active: boolean }[] = [];
      for (let r = 0; r < 4; r++) {
        const dayIdx = 47 - (c * 4 + r);
        const d = new Date(today);
        d.setDate(today.getDate() - dayIdx);
        const key = d.toISOString().slice(0, 10);
        col.push({ active: set.has(key) });
      }
      cols.push(col);
    }
    return cols;
  }, [isOwn]);

  // Achievements (recent unlocks)
  const recentUnlocks = useMemo(() => {
    let unlocked: Record<string, number> = {};
    if (isOwn) {
      try { unlocked = JSON.parse(localStorage.getItem('lbjj_achievements') || '{}'); }
      catch { unlocked = {}; }
    } else if (enriched?.achievements) {
      unlocked = enriched.achievements;
    } else {
      return [];
    }
    const entries = Object.entries(unlocked)
      .map(([key, ts]) => {
        const def = ALL_ACHIEVEMENTS.find(a => a.key === key);
        if (!def) return null;
        return { key, ts: Number(ts) || 0, def };
      })
      .filter(Boolean) as { key: string; ts: number; def: typeof ALL_ACHIEVEMENTS[number] }[];
    entries.sort((a, b) => b.ts - a.ts);
    return entries.slice(0, 3);
  }, [isOwn, enriched]);

  // Theme based on level
  const level = data ? getActualLevel(data.xp) : 1;
  const themeKey = levelToTheme(level);
  const palette = THEME_PALETTE[themeKey];

  const themeStyle = {
    ['--theme-color' as any]: palette.color,
    ['--theme-light' as any]: palette.light,
    ['--theme-glow' as any]: palette.glow,
  } as React.CSSProperties;

  if (!data) {
    return (
      <div className="pp-root" style={themeStyle}>
        <nav className="pp-top-nav">
          <button className="pp-nav-btn" onClick={() => window.history.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </button>
        </nav>
        <div className="pp-empty">{loading ? 'Loading…' : 'Profile not found'}</div>
      </div>
    );
  }

  const initials = data.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const handle = makeHandle(data.name, data.email);

  const beltSvgHtml = beltSVG(data.belt, data.stripes, 320, data.bar);

  // Quick actions
  const onBeltJourney = () => {
    if (isOwn) navigate('/belt');
    else navigate(`/belt/${encodeURIComponent(data.email)}`);
  };
  const onMessage = () => {
    navigate('/chat');
  };
  const onAchievements = () => navigate('/achievements');

  return (
    <div className="pp-root" style={themeStyle}>
      <nav className="pp-top-nav">
        <button className="pp-nav-btn" onClick={() => window.history.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          {isOwn ? 'Hub' : 'Back'}
        </button>
        {isOwn && (
          <button className="pp-nav-btn" style={{ color: '#888' }} onClick={() => navigate('/account')} aria-label="Edit profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        )}
      </nav>

      <section className="pp-profile-hero">
        <div className="pp-hero-glow" />
        <div className="pp-paragon-frame">
          <div className="pp-frame-ring" />
          <div className="pp-frame-orb top" />
          <div className="pp-frame-orb bottom" />
          <div className="pp-frame-orb left" />
          <div className="pp-frame-orb right" />
          <div className="pp-avatar-img">
            {data.profilePic
              ? <img src={data.profilePic} alt={data.name} />
              : <span>{initials}</span>}
          </div>
        </div>

        <h1 className="pp-user-name">{data.name}</h1>
        <p className="pp-user-handle">{handle}</p>

        <div className="pp-hero-belt-wrap" dangerouslySetInnerHTML={{ __html: beltSvgHtml }} />
      </section>

      <main className="pp-dashboard">
        <div className="pp-quick-actions">
          <button className="pp-btn-action primary" onClick={onBeltJourney}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {isOwn ? 'Belt Journey' : 'View Belt Journey'}
          </button>
          {isOwn ? (
            <button className="pp-btn-action" onClick={onAchievements}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Achievements
            </button>
          ) : (
            <button className="pp-btn-action" onClick={onMessage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Message
            </button>
          )}
        </div>

        <div className="pp-card">
          <div className="pp-card-header">
            <div className="pp-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Activity
            </div>
          </div>
          <div className="pp-activity-grid">
            <div className="pp-activity-box">
              <svg className="pp-activity-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div className="pp-activity-val">{data.classesAttended}</div>
              <div className="pp-activity-label">Classes Attended</div>
            </div>
            <div className="pp-activity-box">
              <svg className="pp-activity-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
              <div className="pp-activity-val pp-streak-fire">{data.maxStreak} <span className="pp-activity-unit">Days</span></div>
              <div className="pp-activity-label">Longest Streak</div>
            </div>
          </div>

          {heatmap && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>
                Consistency (Last 48 Days)
              </div>
              <div className="pp-heatmap-container">
                {heatmap.map((col, ci) => (
                  <div key={ci} className="pp-heat-col">
                    {col.map((cell, ri) => (
                      <div key={ri} className={`pp-heat-cell ${cell.active ? 'l3' : ''}`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pp-card">
          <div className="pp-card-header">
            <div className="pp-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Recent Unlocks
            </div>
            <button className="pp-action-link" onClick={onAchievements}>View All</button>
          </div>

          <div className="pp-achievements-list">
            {recentUnlocks.length === 0 && (
              <div className="pp-empty">No achievements unlocked yet.</div>
            )}
            {recentUnlocks.map(({ key, ts, def }) => {
              const rar = def.rarity || 'Common';
              const rc = RARITY_COLORS[rar];
              return (
                <div key={key} className="pp-achievement-row">
                  <div className="pp-ach-icon" style={{ background: rc.bg, borderColor: rc.color, color: rc.color }}>
                    <span aria-hidden>{def.icon}</span>
                  </div>
                  <div className="pp-ach-info">
                    <div className="pp-ach-title">{def.label}</div>
                    <div className="pp-ach-date">{timeAgo(ts)}</div>
                  </div>
                  <div className="pp-ach-rarity" style={{ color: rc.color, background: rc.bg }}>
                    {rar.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
