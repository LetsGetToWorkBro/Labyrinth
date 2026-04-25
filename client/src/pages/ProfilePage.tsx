/**
 * ProfilePage V2 — view a member profile (own or another's). Redesigned 2026-04-25.
 * Spec: profile_reimagine_v2.html
 *
 * Routes: /profile (own) and /profile/:email (other member)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth-context';
import { getActualLevel } from '@/lib/xp';
import { gasCall } from '@/lib/api';
import { ALL_ACHIEVEMENTS } from '@/lib/achievements';

const _PROFILE_V = 'v2.1';
(globalThis as any).__PROFILE_V = _PROFILE_V;

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

// ─── Theme ───────────────────────────────────────────────────────
type ThemeKey = 'bronze' | 'frozen' | 'void' | 'blood' | 'crown';
function levelToTheme(lv: number): ThemeKey {
  if (lv >= 30) return 'crown';
  if (lv >= 20) return 'blood';
  if (lv >= 12) return 'void';
  if (lv >= 6)  return 'frozen';
  return 'bronze';
}

// ─── Rarity colors ───────────────────────────────────────────────
const RARITY_STYLES: Record<string, { color: string; bg: string }> = {
  Common:    { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  Rare:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  Epic:      { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  Legendary: { color: '#D4AF37', bg: 'rgba(212,175,55,0.1)' },
  Mythic:    { color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
};

// ─── Inline CSS (verbatim from profile_reimagine_v2.html, pv2- prefixed) ─
const STYLE_TAG_ID = 'lbjj-profile-v2-styles';
const CSS = `
.pv2-root { background: #030305; min-height: 100vh; position: relative; overflow-x: hidden; padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; width: 100%; max-width: 480px; margin: 0 auto; color: #fff; --gold-primary: #D4AF37; --gold-light: #FFF0B3; --gold-dark: #8A6507; --bg-card: rgba(255,255,255,0.02); --border-card: rgba(255,255,255,0.05); }

.pv2-top-nav { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; background: rgba(3,3,5,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); }
.pv2-nav-btn { background: none; border: none; color: #fff; display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 16px; cursor: pointer; padding: 0; transition: color 0.2s; font-family: inherit; }
.pv2-nav-btn:active { color: #aaa; }

.pv2-profile-hero { position: relative; padding: 24px 20px 0; display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 0; }
.pv2-hero-glow { position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%); width: 200px; height: 200px; background: rgba(212, 175, 55, 0.15); filter: blur(60px); border-radius: 50%; z-index: 0; pointer-events: none; }

.pv2-paragon-frame { position: relative; width: 100px; height: 100px; z-index: 1; margin-bottom: 16px; }
.pv2-frame-ring { position: absolute; inset: 0; border: 3px solid var(--gold-primary); border-radius: 50%; box-shadow: 0 0 20px rgba(212,175,55,0.4), inset 0 0 10px rgba(212,175,55,0.4); }
.pv2-frame-orb { position: absolute; width: 10px; height: 10px; background: var(--gold-light); border-radius: 50%; box-shadow: 0 0 10px var(--gold-primary); }
.pv2-frame-orb.top { top: -5px; left: 50%; transform: translateX(-50%); }
.pv2-frame-orb.bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }
.pv2-frame-orb.left { left: -5px; top: 50%; transform: translateY(-50%); }
.pv2-frame-orb.right { right: -5px; top: 50%; transform: translateY(-50%); }
.pv2-avatar-img { position: absolute; inset: 6px; border-radius: 50%; background: #222; overflow: hidden; display: flex; justify-content: center; align-items: center; font-size: 32px; font-weight: 800; color: #fff; }

.pv2-user-name { font-size: 22px; font-weight: 900; color: #fff; margin: 0 0 2px 0; letter-spacing: -0.02em; z-index: 1; position: relative; }
.pv2-user-handle { font-size: 13px; font-weight: 600; color: #888; margin: 0 0 16px 0; z-index: 1; position: relative; }

.pv2-hero-belt-wrap { width: 240px; max-width: 90%; position: relative; z-index: 2; filter: drop-shadow(0 12px 12px rgba(0,0,0,0.7)); margin-bottom: 16px; }
.pv2-hero-belt-wrap svg { width: 100%; height: auto; display: block; overflow: visible; }

.pv2-dashboard { padding: 16px 20px 0; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 1; }

.pv2-card { background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 20px; padding: 20px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.pv2-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.pv2-card-title { font-size: 13px; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
.pv2-card-title svg { color: var(--gold-primary); }
.pv2-action-link { font-size: 12px; font-weight: 700; color: var(--gold-primary); text-decoration: none; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; }

.pv2-quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.pv2-btn-action { padding: 14px; border-radius: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #fff; font-size: 13px; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
.pv2-btn-action svg { color: var(--gold-primary); }
.pv2-btn-action:active { transform: scale(0.96); background: rgba(255,255,255,0.06); }
.pv2-btn-action.primary { background: linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02)); border-color: rgba(212,175,55,0.3); }

.pv2-activity-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.pv2-activity-box { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 14px; padding: 16px; position: relative; overflow: hidden; }
.pv2-activity-icon { position: absolute; right: 12px; top: 12px; opacity: 0.1; color: #fff; }
.pv2-activity-val { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 4px; display: flex; align-items: baseline; gap: 4px; }
.pv2-activity-unit { font-size: 12px; font-weight: 700; color: #666; }
.pv2-activity-label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.05em; }
.pv2-streak-fire { color: #ef4444; filter: drop-shadow(0 0 8px rgba(239,68,68,0.5)); }

.pv2-achievements-list { display: flex; flex-direction: column; gap: 10px; }
.pv2-achievement-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04); border-radius: 12px; }
.pv2-ach-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2); display: grid; place-items: center; color: var(--gold-primary); flex-shrink: 0; }
.pv2-ach-info { flex: 1; min-width: 0; }
.pv2-ach-title { font-size: 13px; font-weight: 800; color: #fff; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pv2-ach-date { font-size: 11px; font-weight: 600; color: #666; }
.pv2-ach-rarity { font-size: 10px; font-weight: 800; color: #a855f7; padding: 2px 6px; background: rgba(168,85,247,0.1); border-radius: 4px; }

.pv2-heatmap-container { width: 100%; display: flex; gap: 4px; margin-top: 12px; overflow-x: hidden; }
.pv2-heat-col { display: flex; flex-direction: column; gap: 4px; }
.pv2-heat-cell { width: 12px; height: 12px; border-radius: 2px; background: rgba(255,255,255,0.05); }
.pv2-heat-cell.l1 { background: rgba(212,175,55,0.2); }
.pv2-heat-cell.l2 { background: rgba(212,175,55,0.5); }
.pv2-heat-cell.l3 { background: rgba(212,175,55,1); box-shadow: 0 0 5px rgba(212,175,55,0.5); }

/* Theme variants */
.pv2-theme-bronze .pv2-frame-ring { border-color: #CD7F32; box-shadow: 0 0 20px rgba(205,127,50,0.4), inset 0 0 10px rgba(205,127,50,0.2); }
.pv2-theme-bronze .pv2-frame-orb { background: #F4A460; box-shadow: 0 0 10px #CD7F32; }
.pv2-theme-bronze .pv2-hero-glow { background: rgba(205,127,50,0.15); }
.pv2-theme-frozen .pv2-frame-ring { border-color: #3b82f6; box-shadow: 0 0 20px rgba(59,130,246,0.4), inset 0 0 10px rgba(59,130,246,0.2); }
.pv2-theme-frozen .pv2-frame-orb { background: #93c5fd; box-shadow: 0 0 10px #3b82f6; }
.pv2-theme-frozen .pv2-hero-glow { background: rgba(59,130,246,0.12); }
.pv2-theme-void .pv2-frame-ring { border-color: #a855f7; box-shadow: 0 0 20px rgba(168,85,247,0.4), inset 0 0 10px rgba(168,85,247,0.2); }
.pv2-theme-void .pv2-frame-orb { background: #e9d5ff; box-shadow: 0 0 10px #a855f7; }
.pv2-theme-void .pv2-hero-glow { background: rgba(168,85,247,0.12); }
.pv2-theme-blood .pv2-frame-ring { border-color: #ef4444; box-shadow: 0 0 20px rgba(239,68,68,0.4), inset 0 0 10px rgba(239,68,68,0.2); }
.pv2-theme-blood .pv2-frame-orb { background: #fca5a5; box-shadow: 0 0 10px #ef4444; }
.pv2-theme-blood .pv2-hero-glow { background: rgba(239,68,68,0.12); }
.pv2-theme-crown .pv2-frame-ring { border-color: #D4AF37; box-shadow: 0 0 20px rgba(212,175,55,0.4), inset 0 0 10px rgba(212,175,55,0.2); }
.pv2-theme-crown .pv2-frame-orb { background: #FFF0B3; box-shadow: 0 0 10px #D4AF37; }
.pv2-theme-crown .pv2-hero-glow { background: rgba(212,175,55,0.15); }
`;

function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_TAG_ID)) return;
  const tag = document.createElement('style');
  tag.id = STYLE_TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

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
        achievements: achievementsRaw, // dict {key: ts}
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

  // Theme calculation
  const totalXP = profileData?.totalPoints || 0;
  const level = getActualLevel(totalXP);
  const theme = levelToTheme(level);

  // Heatmap (own profile only)
  const heatmapCells = useMemo(() => {
    if (!isOwnProfile) return null;
    const history: string[] = profileData?.checkinHistory || [];
    const histSet = new Set(history);
    const cols: ('l3' | '')[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let c = 0; c < 12; c++) {
      const col: ('l3' | '')[] = [];
      for (let r = 0; r < 4; r++) {
        const dayIdx = 47 - (c * 4 + r);
        const d = new Date(today);
        d.setDate(today.getDate() - dayIdx);
        const key = d.toISOString().slice(0, 10);
        col.push(histSet.has(key) ? 'l3' : '');
      }
      cols.push(col);
    }
    return cols;
  }, [isOwnProfile, profileData?.checkinHistory]);

  // Recent achievements
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
      <div className={`pv2-root pv2-theme-${theme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ color: '#555', fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  const handle = '@' + (profileData.name || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const initials = (profileData.name || 'M').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const beltSvgHtml = beltSVG(profileData.belt || 'white', profileData.stripes || 0, 240, profileData.bar || 'none');

  return (
    <div className={`pv2-root pv2-theme-${theme}`}>
      {/* Top Nav */}
      <nav className="pv2-top-nav">
        <button className="pv2-nav-btn" onClick={() => window.history.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        {isOwnProfile && (
          <button className="pv2-nav-btn" style={{ color: '#888' }} onClick={() => navigate('/account')} aria-label="Edit profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        )}
      </nav>

      {/* Hero */}
      <section className="pv2-profile-hero">
        <div className="pv2-hero-glow" />
        <div className="pv2-paragon-frame">
          <div className="pv2-frame-ring" />
          <div className="pv2-frame-orb top" />
          <div className="pv2-frame-orb bottom" />
          <div className="pv2-frame-orb left" />
          <div className="pv2-frame-orb right" />
          <div className="pv2-avatar-img">
            {profileData.profilePic
              ? <img src={profileData.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span>{initials}</span>}
          </div>
        </div>
        <h1 className="pv2-user-name">{profileData.name}</h1>
        <p className="pv2-user-handle">{handle}</p>
        <div className="pv2-hero-belt-wrap" dangerouslySetInnerHTML={{ __html: beltSvgHtml }} />
      </section>

      {/* Dashboard */}
      <main className="pv2-dashboard">
        {/* Quick Actions */}
        <div className="pv2-quick-actions">
          <button
            className="pv2-btn-action primary"
            onClick={() => navigate(isOwnProfile ? '/belt' : `/belt/${encodeURIComponent(profileData.email)}`)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Belt Journey
          </button>
          {!isOwnProfile ? (
            <button className="pv2-btn-action" onClick={() => navigate('/chat')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Message
            </button>
          ) : (
            <button className="pv2-btn-action" onClick={() => navigate('/achievements')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Achievements
            </button>
          )}
        </div>

        {/* Activity Card */}
        <div className="pv2-card">
          <div className="pv2-card-header">
            <div className="pv2-card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Activity
            </div>
          </div>
          <div className="pv2-activity-grid">
            <div className="pv2-activity-box">
              <svg className="pv2-activity-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div className="pv2-activity-val">{profileData.classesAttended || 0}</div>
              <div className="pv2-activity-label">Classes Attended</div>
            </div>
            <div className="pv2-activity-box">
              <svg className="pv2-activity-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>
              <div className="pv2-activity-val pv2-streak-fire">{profileData.maxStreak || 0} <span className="pv2-activity-unit">Days</span></div>
              <div className="pv2-activity-label">Best Streak</div>
            </div>
          </div>

          {isOwnProfile && heatmapCells && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Consistency (Last 48 Days)</div>
              <div className="pv2-heatmap-container">
                {heatmapCells.map((col, ci) => (
                  <div key={ci} className="pv2-heat-col">
                    {col.map((level, ri) => (
                      <div key={ri} className={`pv2-heat-cell${level ? ' ' + level : ''}`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Unlocks */}
        {recentAchievements.length > 0 && (
          <div className="pv2-card">
            <div className="pv2-card-header">
              <div className="pv2-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Recent Unlocks
              </div>
              {isOwnProfile && (
                <button className="pv2-action-link" onClick={() => navigate('/achievements')}>View All</button>
              )}
            </div>
            <div className="pv2-achievements-list">
              {recentAchievements.map(({ key, def }) => {
                const rar = def.rarity || 'Common';
                const rs = RARITY_STYLES[rar] || RARITY_STYLES.Common;
                return (
                  <div key={key} className="pv2-achievement-row">
                    <div className="pv2-ach-icon" style={{ background: rs.bg, borderColor: rs.color + '33', color: rs.color }}>
                      <span style={{ fontSize: 18 }} aria-hidden>{def.icon}</span>
                    </div>
                    <div className="pv2-ach-info">
                      <div className="pv2-ach-title">{def.label}</div>
                    </div>
                    <div className="pv2-ach-rarity" style={{ color: rs.color, background: rs.bg }}>{rar.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
