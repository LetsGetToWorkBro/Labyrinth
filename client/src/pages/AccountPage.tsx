// AccountPage V2 — multi-view with belt themes, family, sizing, notifications
import { useState, useEffect, useRef, useCallback } from "react";
import { useHashLocation as useHashLoc } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth-context";
import { gasCall } from "@/lib/api";

// ─── Belt theme mapping (same as ProfilePage) ───────────────────────
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
  const base = b.split('_')[0];
  return BELT_THEMES[b] || BELT_THEMES[base] || BELT_THEMES.white;
}

// ─── XP → Level (simplified, matches xp.ts curve) ──────────────────
const XP_LEVELS = [
  { level: 1,  xp: 0 },     { level: 2,  xp: 100 },   { level: 3,  xp: 250 },
  { level: 4,  xp: 450 },   { level: 5,  xp: 700 },   { level: 6,  xp: 1000 },
  { level: 7,  xp: 1350 },  { level: 8,  xp: 1750 },  { level: 9,  xp: 2200 },
  { level: 10, xp: 2700 },  { level: 11, xp: 3250 },  { level: 12, xp: 3850 },
  { level: 13, xp: 4500 },  { level: 14, xp: 5200 },  { level: 15, xp: 6000 },
  { level: 16, xp: 6900 },  { level: 17, xp: 7900 },  { level: 18, xp: 9000 },
  { level: 19, xp: 10200 }, { level: 20, xp: 11500 }, { level: 25, xp: 19500 },
  { level: 30, xp: 31500 }, { level: 40, xp: 60000 }, { level: 50, xp: 100000 },
];

function getActualLevel(xp: number): number {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) {
      if (i === XP_LEVELS.length - 1) return XP_LEVELS[i].level;
      const next = XP_LEVELS[i + 1];
      const diff = next.level - XP_LEVELS[i].level;
      const frac = (xp - XP_LEVELS[i].xp) / (next.xp - XP_LEVELS[i].xp);
      return Math.floor(XP_LEVELS[i].level + frac * diff);
    }
  }
  return 1;
}

// ─── Belt SVG helpers ───────────────────────────────────────────────
function getBeltSvgParams(belt: string, bar: string): { beltColor: string; barColor: string } {
  const b = (belt || 'white').toLowerCase();
  const isKids = ['grey', 'gray', 'yellow', 'orange', 'green'].includes(b);
  if (!isKids) return { beltColor: b, barColor: b === 'black' ? 'red' : 'black' };
  const base = b === 'gray' ? 'grey' : b;
  if (bar === 'white') return { beltColor: `${base}_white`, barColor: 'black' };
  if (bar === 'black') return { beltColor: `${base}_black`, barColor: 'black' };
  return { beltColor: base, barColor: 'none' };
}

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

  const w = 440, h = 56, rx = 6, barW = 84, barX = w - barW - 16;
  let base = colors.white.main;
  let isCoral = false, isKidsSplit = false, kidsSplitMiddle = '';

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

  const defs = `<defs>
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
  </defs>`;

  let rects = '';
  if (isCoral) {
    rects += `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="#ef4444" />`;
    for (let i = 0; i < w; i += 45) rects += `<rect x="${i}" y="0" width="22.5" height="${h}" fill="#18181b" />`;
  } else {
    rects += `<rect x="0" y="0" width="${w}" height="${h}" rx="${rx}" fill="${base}" />`;
    if (isKidsSplit) {
      const splitH = 16, splitY = (h - 16) / 2, rightW = w - (barX + barW);
      rects += `<rect x="0" y="${splitY}" width="${barX}" height="${splitH}" fill="${kidsSplitMiddle}" />
        <rect x="0" y="${splitY}" width="${barX}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="0" y="${splitY + splitH - 2.5}" width="${barX}" height="2.5" fill="rgba(255,255,255,0.3)" />
        <rect x="${barX + barW}" y="${splitY}" width="${rightW}" height="${splitH}" fill="${kidsSplitMiddle}" />
        <rect x="${barX + barW}" y="${splitY}" width="${rightW}" height="2.5" fill="rgba(0,0,0,0.4)" />
        <rect x="${barX + barW}" y="${splitY + splitH - 2.5}" width="${rightW}" height="2.5" fill="rgba(255,255,255,0.3)" />`;
    }
  }

  const stitches = `<line x1="8" y1="10" x2="${w - 8}" y2="10" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="18" x2="${w - 8}" y2="18" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${h - 18}" x2="${w - 8}" y2="${h - 18}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="${h - 10}" x2="${w - 8}" y2="${h - 10}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-dasharray="5,4" />
    <line x1="8" y1="11" x2="${w - 8}" y2="11" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />
    <line x1="8" y1="19" x2="${w - 8}" y2="19" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="5,4" />`;

  let rankBar = '';
  if (barColor !== 'none') {
    rankBar += `<rect x="${barX - 5}" y="0" width="5" height="${h}" fill="url(#barShadowLeft)" />`;
    rankBar += `<rect x="${barX + barW}" y="0" width="5" height="${h}" fill="url(#barShadowRight)" />`;
    rankBar += `<rect x="${barX}" y="0" width="${barW}" height="${h}" fill="${barFill}" />`;
    rankBar += `<rect x="${barX}" y="0" width="1.5" height="${h}" fill="rgba(255,255,255,0.4)" />`;
    rankBar += `<rect x="${barX + barW - 1.5}" y="0" width="1.5" height="${h}" fill="rgba(0,0,0,0.8)" />`;
    const stripeColor = barColor === 'white' ? '#18181b' : '#ffffff';
    for (let i = 0; i < stripes; i++) {
      const sx = barX + barW - 16 - (i * 15);
      rankBar += `<rect x="${sx - 3}" y="0" width="14" height="${h}" fill="rgba(0,0,0,0.5)" />`;
      rankBar += `<rect x="${sx}" y="0" width="8" height="${h}" fill="${stripeColor}" />`;
      rankBar += `<rect x="${sx}" y="0" width="8" height="${h}" fill="url(#tapeCurve)" />`;
      rankBar += `<rect x="${sx}" y="0" width="1" height="${h}" fill="rgba(255,255,255,0.6)" />`;
      rankBar += `<rect x="${sx + 7}" y="0" width="1" height="${h}" fill="rgba(0,0,0,0.6)" />`;
    }
  }

  return `<svg viewBox="0 -30 ${w} ${h + 60}" width="100%" height="100%">
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
  </svg>`;
}

// ─── CSS (verbatim from HTML) ───────────────────────────────────────
const ACCOUNT_V2_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

.acv2-root {
  --bg: #05060a;
  --card: rgba(13,15,20,0.7);
  --border: rgba(255,255,255,0.07);
  --text: #f0f2f5;
  --muted: #9ca3af;
  --subtle: rgba(255,255,255,0.04);
  padding-top: 0; /* safe area handled by top-nav */
}

.acv2-root * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
.acv2-root {
  font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased;
  background: radial-gradient(ellipse 80% 40% at 50% -10%, rgba(var(--th-rgb),0.15), transparent), var(--bg);
  color: var(--text); min-height: 100vh; padding-bottom: 100px;
  transition: background 0.5s ease;
  overflow-y: auto; overflow-x: hidden;
}

/* TOP NAV */
.acv2-root .top-nav {
  position: sticky; top: 0; z-index: 50;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 20px 14px;
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(5,6,10,0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.acv2-root .nav-back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; color: var(--text);
  font: 600 15px/1 'Inter',sans-serif; cursor: pointer; transition: opacity 0.2s;
  min-height: 44px;
  min-width: 44px;
}
.acv2-root .nav-back:active { opacity: 0.6; }
.acv2-root .nav-title { font-size: 15px; font-weight: 700; color: var(--muted); }

/* LAYOUT & VIEWS */
.acv2-root .page { max-width: 480px; margin: 0 auto; padding: 24px 16px; position: relative; }
.acv2-root .view { display: none; flex-direction: column; gap: 16px; animation: acv2SlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.acv2-root .view.active { display: flex; }
@keyframes acv2SlideIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

/* CARDS */
.acv2-root .card {
  background: var(--card); border: 1px solid var(--border); border-radius: 24px;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04);
  overflow: hidden;
}
.acv2-root .card-pad { padding: 24px; }
.acv2-root .sec-title {
  font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--muted); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.acv2-root .sec-title svg { color: var(--th); transition: color 0.5s; }

/* HERO HEADER */
.acv2-root .hero { display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; padding: 36px 24px 28px; }
.acv2-root .hero-glow {
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  width: 180px; height: 180px; background: var(--th); filter: blur(80px); opacity: 0.15;
  pointer-events: none; transition: background 0.5s, opacity 0.5s;
}
.acv2-root .avatar-ring-wrap { position: relative; width: 96px; height: 96px; margin-bottom: 18px; z-index: 2; cursor: pointer; transition: transform 0.2s; }
.acv2-root .avatar-ring-wrap:active { transform: scale(0.95); }
.acv2-root .avatar-spin {
  position: absolute; inset: -5px; border-radius: 50%; border: 2px dashed var(--th);
  animation: acv2Spin 16s linear infinite; box-shadow: 0 0 18px var(--th-glow); transition: border-color 0.5s, box-shadow 0.5s;
}
@keyframes acv2Spin { to { transform: rotate(360deg); } }
.acv2-root .avatar {
  width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
  background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1);
  display: grid; place-items: center; font-size: 30px; font-weight: 900; color: #fff; position: relative; z-index: 1;
}
.acv2-root .avatar img { width: 100%; height: 100%; object-fit: cover; }
.acv2-root .avatar-edit {
  position: absolute; bottom: -2px; right: -2px; z-index: 3;
  width: 28px; height: 28px;
  padding: 8px;
  margin: -8px;
  border-radius: 50%;
  background: var(--th); border: 2px solid var(--bg);
  display: grid; place-items: center; color: var(--bg);
}
.acv2-root .hero-name { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 4px; z-index: 2; }
.acv2-root .hero-tier { font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--th); margin-bottom: 12px; z-index: 2; transition: color 0.5s; }

.acv2-root .public-profile-btn {
  z-index: 2; margin-bottom: 24px;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; font-size: 11px; font-weight: 600; text-decoration: none;
  cursor: pointer; transition: background 0.2s;
}
.acv2-root .public-profile-btn:hover { background: rgba(255,255,255,0.1); }
.acv2-root .public-profile-btn:active { transform: scale(0.96); }

.acv2-root .belt-wrap { width: 100%; max-width: 420px; margin: 0 auto; z-index: 2; }
.acv2-root .belt-wrap svg { width: 100%; height: auto; display: block; overflow: visible; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.6)); }

/* WALLET BUTTONS */
.acv2-root .wallet-btns { display: flex; gap: 10px; margin-top: 16px; }
.acv2-root .wallet-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 6px; border-radius: 12px;
  background: #000; border: 1px solid rgba(255,255,255,0.15);
  color: #fff; font: 700 13px 'Inter',sans-serif; cursor: pointer; transition: transform 0.2s, background 0.2s;
  white-space: nowrap;
}
.acv2-root .wallet-btn:active { transform: scale(0.97); background: rgba(255,255,255,0.05); }
.acv2-root .wallet-btn.google-btn { background: #1a1b1e; }
.acv2-root .wallet-btn svg { flex-shrink: 0; }

/* SETTINGS ROW */
.acv2-root .settings-list { display: flex; flex-direction: column; }
.acv2-root .setting-row {
  display: flex; align-items: center; gap: 14px; padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s;
}
.acv2-root .setting-row:last-child { border-bottom: none; }
.acv2-root .setting-row:active { background: rgba(255,255,255,0.02); border-radius: 12px; }
.acv2-root .setting-icon {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); display: grid; place-items: center; color: var(--text);
}
.acv2-root .setting-icon.accent-icon { background: rgba(var(--th-rgb),0.1); border-color: rgba(var(--th-rgb),0.2); color: var(--th); }
.acv2-root .setting-label { flex: 1; }
.acv2-root .setting-name { font-size: 14px; font-weight: 700; color: var(--text); }
.acv2-root .setting-desc { font-size: 11px; font-weight: 500; color: var(--muted); margin-top: 2px; }
.acv2-root .setting-chevron { color: var(--muted); opacity: 0.5; }
.acv2-root .setting-tag { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.06em; }
.acv2-root .tag-pro { color: var(--th); background: rgba(var(--th-rgb),0.12); border: 1px solid rgba(var(--th-rgb),0.25); transition: all 0.5s; }

/* MEMBERSHIP & CARDS */
.acv2-root .mem-card {
  background: linear-gradient(135deg, rgba(var(--th-rgb),0.12), rgba(var(--th-rgb),0.04));
  border: 1px solid rgba(var(--th-rgb),0.22); border-radius: 18px; padding: 18px 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 24px; transition: background 0.5s, border-color 0.5s;
}
.acv2-root .mem-info { display: flex; flex-direction: column; gap: 4px; }
.acv2-root .mem-plan { font-size: 16px; font-weight: 900; color: #fff; }
.acv2-root .mem-since { font-size: 11px; font-weight: 600; color: var(--muted); }
.acv2-root .mem-status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #22c55e; }
.acv2-root .mem-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: acv2PulseDot 2s ease infinite; }
@keyframes acv2PulseDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.6;transform:scale(1.4);} }

.acv2-root .cc-list { display: flex; flex-direction: column; gap: 10px; }
.acv2-root .cc-row {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
}
.acv2-root .cc-icon { width: 36px; height: 24px; background: #fff; border-radius: 4px; display: grid; place-items: center; }
.acv2-root .cc-details { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.acv2-root .cc-num { font-size: 14px; font-weight: 700; color: #fff; letter-spacing: 1px; }
.acv2-root .cc-exp { font-size: 11px; font-weight: 500; color: var(--muted); }
.acv2-root .cc-primary-badge { font-size: 10px; font-weight: 800; color: var(--th); background: rgba(var(--th-rgb),0.15); padding: 4px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
.acv2-root .cc-add {
  display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px;
  border: 1px dashed rgba(255,255,255,0.15); border-radius: 14px; color: var(--th); font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.2s; background: rgba(var(--th-rgb),0.05);
}
.acv2-root .cc-add:active { background: rgba(var(--th-rgb),0.1); }

/* DANGER ZONE */
.acv2-root .danger-group { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.acv2-root .btn {
  width: 100%; padding: 16px; border-radius: 16px; font: 700 14px/1 'Inter',sans-serif;
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s;
}
.acv2-root .btn:active { transform: scale(0.98); }
.acv2-root .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text); }
.acv2-root .btn-danger { background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15); color: #ef4444; }
.acv2-root .btn-danger-text { background: none; border: none; color: rgba(239,68,68,0.7); font-size: 12px; padding: 12px; text-decoration: underline; cursor: pointer; }

/* FORMS & INPUTS */
.acv2-root .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.acv2-root .form-group label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.acv2-root .form-input {
  width: 100%; padding: 14px 16px; border-radius: 12px; background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.08); color: #fff; font: 500 15px 'Inter',sans-serif; outline: none; transition: border-color 0.3s;
}
.acv2-root .form-input:focus { border-color: var(--th); box-shadow: 0 0 0 3px rgba(var(--th-rgb),0.15); }
.acv2-root select.form-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px; }

.acv2-root .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); }
.acv2-root .toggle-row:last-child { border-bottom: none; }
.acv2-root .toggle-info { display: flex; flex-direction: column; gap: 4px; }
.acv2-root .toggle-title { font-size: 14px; font-weight: 600; color: #fff; }
.acv2-root .toggle-desc { font-size: 11px; color: var(--muted); }
.acv2-root .switch { position: relative; width: 44px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 12px; cursor: pointer; transition: background 0.3s; flex-shrink: 0; }
.acv2-root .switch.on { background: var(--th); }
.acv2-root .switch::after {
  content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
  background: #fff; border-radius: 50%; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.acv2-root .switch.on::after { transform: translateX(20px); }

.acv2-root .btn-save { background: var(--th); color: var(--bg); border: none; margin-top: 8px; }
.acv2-root .ver { text-align: center; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.15); padding: 8px 0; letter-spacing: 0.08em; }

.acv2-root .dep-card { display: flex; align-items: center; gap: 12px; padding: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 12px; }
.acv2-root .dep-avatar { width: 40px; height: 40px; border-radius: 50%; background: #22c55e; display: grid; place-items: center; font-weight: 800; color: #05060a; }
`;

// ─── View types ─────────────────────────────────────────────────────
type AccountView = 'main' | 'edit' | 'family' | 'sizing' | 'events' | 'connected' | 'notif' | 'privacy' | 'membership' | 'delete' | 'waiver' | 'refer';

// ─── SVG icons (inline) ────────────────────────────────────────────
const ChevronLeft = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>;
const ChevronRight = () => <svg className="setting-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>;
const CameraSvg = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;

export default function AccountPage() {
  const { member, logout, refreshProfile } = useAuth();
  const [, navigate] = useHashLoc();

  // View state
  const [view, setView] = useState<AccountView>('main');
  const [navTitle, setNavTitle] = useState('My Account');

  function navTo(v: AccountView, title: string) {
    setView(v);
    setNavTitle(title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function navBack() {
    if (view === 'main') {
      navigate('/more');
    } else {
      setView('main');
      setNavTitle('My Account');
    }
  }

  // Profile picture state (preserved from original)
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try { return localStorage.getItem("lbjj_profile_picture"); } catch { return null; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      setProfilePic(base64);
      try { localStorage.setItem("lbjj_profile_picture", base64); } catch {}
    };
    img.src = URL.createObjectURL(file);
  };

  // Edit profile state (preserved from original)
  const [editName, setEditName] = useState(member?.name || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [secondaryEmail, setSecondaryEmail] = useState(() => {
    try {
      const stored = localStorage.getItem("lbjj_member_profile");
      if (stored) return JSON.parse(stored).SecondaryEmail || "";
    } catch {}
    return "";
  });
  const [emergencyContact, setEmergencyContact] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Wallet loading states (preserved from original)
  const [walletLoading, setWalletLoading] = useState(false);
  const [googleWalletLoading, setGoogleWalletLoading] = useState(false);

  // Logout confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Sizing state
  const [sizingGiTop, setSizingGiTop] = useState((member as any)?.sizingGiTop || 'A2');
  const [sizingRashguard, setSizingRashguard] = useState((member as any)?.sizingRashguard || 'Medium');
  const [sizingShorts, setSizingShorts] = useState((member as any)?.sizingShorts || 'Medium');
  const [sizingSaving, setSizingSaving] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('lbjj_notif_prefs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return { push: true, email: true, marketing: false };
  });

  // Privacy prefs
  const [privacyPrefs, setPrivacyPrefs] = useState({ publicProfile: true, leaderboard: true });

  // Delete confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState('');
  const showToast = useCallback((msg: string, _isError?: boolean) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  // Inject CSS
  useEffect(() => {
    const id = 'lbjj-account-v2-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = ACCOUNT_V2_CSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  // Computed values
  const belt = ((member as any)?.belt || 'white').toLowerCase();
  const beltBar = ((member as any)?.beltBar || '').toLowerCase();
  const stripes = Number((member as any)?.stripes) || 0;
  const theme = getBeltTheme(belt);
  const xp = Number((member as any)?.xp) || 0;
  const level = getActualLevel(xp);
  const initials = (member?.name || "M").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const { beltColor: svgBeltColor, barColor: svgBarColor } = getBeltSvgParams(belt, beltBar);
  const beltSvgHtml = generateProfileBeltSVG(svgBeltColor, svgBarColor, stripes);

  const memberSince = (() => {
    const d = (member as any)?.joinDate || (member as any)?.startDate || (member as any)?.StartDate || (member as any)?.memberSince || (member as any)?.['Start Date'] || (member as any)?.CreatedAt || (member as any)?.createdAt;
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); } catch { return ''; }
  })();

  const familyMembers: any[] = (member as any)?.familyMembers || [];

  // Handlers (preserved from original)
  const handleAddToWallet = async () => {
    if (!navigator.onLine) { showToast('No internet connection'); return; }
    if (walletLoading) return;
    setWalletLoading(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      if (!token) { showToast('Please sign in again'); setWalletLoading(false); return; }
      window.location.href = `https://labyrinth-pass-server-production.up.railway.app/pass/generate?memberToken=${encodeURIComponent(token)}`;
    } catch { showToast('Could not generate pass'); }
    finally { setWalletLoading(false); }
  };

  const handleAddToGoogleWallet = async () => {
    if (!navigator.onLine) { showToast('No internet connection'); return; }
    if (googleWalletLoading) return;
    setGoogleWalletLoading(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      if (!token) { showToast('Please sign in again'); return; }
      const response = await fetch('https://labyrinth-pass-server-production.up.railway.app/pass/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberToken: token }),
      });
      if (!response.ok) throw new Error('Server error');
      const { saveUrl } = await response.json();
      window.location.href = saveUrl;
    } catch { showToast('Could not generate Google Wallet pass'); }
    finally { setGoogleWalletLoading(false); }
  };

  const handleSaveProfile = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      await gasCall("updateMemberProfileApp", { memberEmail: member?.email, name: editName, phone, secondaryEmail });
      const stored = localStorage.getItem("lbjj_member_profile");
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          profile.Name = editName;
          profile.Phone = phone;
          profile.SecondaryEmail = secondaryEmail;
          localStorage.setItem("lbjj_member_profile", JSON.stringify(profile));
        } catch {}
      }
      await refreshProfile();
      setSaved(true);
      setTimeout(() => { setSaved(false); navTo('main', 'My Account'); }, 1200);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const handleSaveSizing = async () => {
    setSizingSaving(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || '';
      await gasCall("updateMemberProfileApp", { token, sizingGiTop, sizingRashguard, sizingShorts });
      showToast('Sizes saved');
      setTimeout(() => navTo('main', 'My Account'), 800);
    } catch { showToast('Could not save sizes'); }
    setSizingSaving(false);
  };

  const toggleNotif = (key: string) => {
    setNotifPrefs((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('lbjj_notif_prefs', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Reset edit fields when entering edit view
  useEffect(() => {
    if (view === 'edit') {
      setEditName(member?.name || '');
      setPhone(member?.phone || '');
      setError('');
      setSaved(false);
    }
  }, [view, member?.name, member?.phone]);

  return (
    <div className="acv2-root" style={{ '--th': theme.color, '--th-rgb': theme.rgb, '--th-glow': `rgba(${theme.rgb},0.35)` } as React.CSSProperties}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, backdropFilter: 'blur(20px)' }}>
          {toast}
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />

      {/* TOP NAV */}
      <nav className="top-nav">
        <button className="nav-back" onClick={navBack}>
          <ChevronLeft /> Back
        </button>
        <span className="nav-title">{navTitle}</span>
        <div style={{ width: 36 }} />
      </nav>

      <div className="page">

        {/* ═══════ VIEW: MAIN ═══════ */}
        <div className={`view ${view === 'main' ? 'active' : ''}`}>

          {/* HERO CARD */}
          <div className="card">
            <div className="hero">
              <div className="hero-glow" style={{ background: theme.color }} />

              <div className="avatar-ring-wrap" onClick={() => fileInputRef.current?.click()}>
                <div className="avatar-spin" />
                <div className="avatar">
                  {profilePic ? <img src={profilePic} alt="Profile" /> : initials}
                </div>
                <div className="avatar-edit"><CameraSvg /></div>
              </div>

              <h1 className="hero-name">{member?.name || 'Member'}</h1>
              <div className="hero-tier">LV{level} &bull; {theme.label}</div>

              <button className="public-profile-btn" onClick={() => navigate('/profile')}>
                View Public Profile
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>

              <div className="belt-wrap" dangerouslySetInnerHTML={{ __html: beltSvgHtml }} />
            </div>
          </div>

          {/* DIGITAL ACCESS PASS */}
          <div className="card card-pad">
            <div className="sec-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Digital Access Pass
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 0, lineHeight: 1.5 }}>
              Use your phone to unlock the gym doors and check-in. Add your 24/7 pass to your digital wallet.
            </p>
            <div className="wallet-btns">
              <button className="wallet-btn" onClick={handleAddToWallet} disabled={walletLoading}>
                <svg viewBox="0 0 384 512" width="15" height="15"><path fill="#fff" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 24 184.8 8 273.5q-9 53.6 15.3 111.4c16.2 38.6 44.8 84.8 82.2 82.8 35.5-1.9 49.4-23.7 90.1-23.7s52.7 23.7 90.1 21.8c39.4-1.9 64.3-43.6 80.5-80.8-39.6-14.8-67.4-48-67.4-116.3zM255.4 75.3c21.2-24.9 35.5-59.6 31.6-94.3-29.4 1.2-66.3 19.1-88.3 43.9-17.6 19.6-34.6 55.4-30 89.3 32.9 2.5 65.5-13.8 86.7-38.9z"/></svg>
                {walletLoading ? 'Generating...' : 'Apple Wallet'}
              </button>
              <button className="wallet-btn google-btn" onClick={handleAddToGoogleWallet} disabled={googleWalletLoading}>
                <svg viewBox="0 0 48 48" width="16" height="16"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {googleWalletLoading ? 'Generating...' : 'Google Wallet'}
              </button>
            </div>
          </div>

          {/* SETTINGS MENU */}
          <div className="card card-pad">
            <div className="sec-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              Account Settings
            </div>
            <div className="settings-list">
              <div className="setting-row" onClick={() => navTo('edit', 'Edit Profile')}>
                <div className="setting-icon accent-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Edit Profile</div>
                  <div className="setting-desc">Name, emails, contact info</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('family', 'Family & Dependents')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Family & Dependents</div>
                  <div className="setting-desc">Manage kids' profiles</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('sizing', 'Sizing & Preferences')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20.38 3.46L16 2a8 8 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Apparel Sizing</div>
                  <div className="setting-desc">Gi & No-Gi sizes for pro shop</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('events', 'Events & Seminars')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Events & Seminars</div>
                  <div className="setting-desc">Registrations and tickets</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('connected', 'Connected Apps')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Connected Apps</div>
                  <div className="setting-desc">Apple Health, Whoop, Garmin</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('notif', 'Notifications')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Notifications</div>
                  <div className="setting-desc">Push & email preferences</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('privacy', 'Privacy & Security')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Privacy & Security</div>
                  <div className="setting-desc">Password, visibility</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('waiver', 'Waivers')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Waivers & Agreements</div>
                  <div className="setting-desc">View signed documents</div>
                </div>
                <ChevronRight />
              </div>

              <div className="setting-row" onClick={() => navTo('refer', 'Refer a Friend')}>
                <div className="setting-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></div>
                <div className="setting-label">
                  <div className="setting-name">Refer a Friend</div>
                  <div className="setting-desc">Earn XP for referrals</div>
                </div>
                <span className="setting-tag tag-pro">PRO</span>
              </div>
            </div>
          </div>

          {/* MEMBERSHIP & BILLING */}
          <div className="card card-pad">
            <div className="sec-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
              Membership & Billing
            </div>

            <div className="mem-card">
              <div className="mem-info">
                <div className="mem-plan">{(member as any)?.membership || (member as any)?.plan || 'Member'}</div>
                <div className="mem-since">{memberSince ? `Member since ${memberSince}` : 'Member'}</div>
                <div className="mem-status"><div className="mem-dot" /> Active</div>
              </div>
            </div>

            <div className="sec-title" style={{ marginTop: 16, marginBottom: 12, fontSize: 10, color: 'var(--text)' }}>
              Payment Methods
            </div>

            <div className="cc-list">
              <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  {(member as any)?.lastFour
                    ? `•••• ${(member as any).lastFour}`
                    : 'Payment managed through membership portal'}
                </div>
              </div>
              <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
                Card management available at labyrinth.vision
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="danger-group">
            {!showLogoutConfirm ? (
              <button className="btn btn-danger" onClick={() => setShowLogoutConfirm(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-danger" onClick={logout} style={{ flex: 2 }}>Confirm Sign Out</button>
              </div>
            )}
            <button className="btn-danger-text" onClick={() => navTo('delete', 'Account Deletion')}>
              Request Account Deletion
            </button>
          </div>

          <div className="ver">LABYRINTH BJJ &bull; V3.6 &bull; MEMBER PORTAL</div>
        </div>

        {/* ═══════ VIEW: EDIT PROFILE ═══════ */}
        <div className={`view ${view === 'edit' ? 'active' : ''}`}>
          <div className="card card-pad">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-input" value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Primary Email</label>
              <input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" className="form-input" value={member?.email || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label>Secondary Email</label>
              <input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" className="form-input" placeholder="backup@email.com" value={secondaryEmail} onChange={e => setSecondaryEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" inputMode="tel" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Emergency Contact</label>
              <input type="text" className="form-input" placeholder="Name & Number" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
            </div>
            {error && <p style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</p>}
            <button className="btn btn-save" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : saved ? '\u2713 Saved' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ═══════ VIEW: FAMILY ═══════ */}
        <div className={`view ${view === 'family' ? 'active' : ''}`}>
          <div className="card card-pad">
            <div className="sec-title" style={{ marginBottom: 20 }}>Linked Accounts</div>
            {familyMembers.length > 0 ? (
              familyMembers.map((fm: any, i: number) => {
                const fmInitials = (fm.name || fm.Name || 'FM').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                const fmBeltColors: Record<string, string> = { green: '#22c55e', grey: '#9ca3af', yellow: '#facc15', orange: '#ea580c', white: '#e5e7eb', blue: '#3b82f6', purple: '#a855f7' };
                const fmBelt = (fm.belt || fm.Belt || 'green').toLowerCase();
                return (
                  <div className="dep-card" key={i}>
                    <div className="dep-avatar" style={{ background: fmBeltColors[fmBelt] || '#22c55e' }}>{fmInitials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{fm.name || fm.Name}</div>
                      <div style={{ fontSize: 12, color: fmBeltColors[fmBelt] || '#22c55e', fontWeight: 600 }}>
                        {fm.type || fm.Type || `Kids ${fmBelt.charAt(0).toUpperCase() + fmBelt.slice(1)} Series`}
                      </div>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 20, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
                <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>No linked accounts</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Add dependents to manage their profiles</div>
              </div>
            )}
            <div style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
              Contact staff to add family members
            </div>
          </div>
        </div>

        {/* ═══════ VIEW: SIZING ═══════ */}
        <div className={`view ${view === 'sizing' ? 'active' : ''}`}>
          <div className="card card-pad">
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Set your sizes here so the pro shop can pre-filter gear and suggest the right fit.
            </p>
            <div className="form-group">
              <label>Gi Size</label>
              <select className="form-input" value={sizingGiTop} onChange={e => setSizingGiTop(e.target.value)}>
                {['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>No-Gi Top / Rash Guard</label>
              <select className="form-input" value={sizingRashguard} onChange={e => setSizingRashguard(e.target.value)}>
                {['XS', 'Small', 'Medium', 'Large', 'X-Large', 'XXL'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>No-Gi Shorts</label>
              <select className="form-input" value={sizingShorts} onChange={e => setSizingShorts(e.target.value)}>
                {['XS', 'Small', 'Medium', 'Large', 'X-Large', 'XXL'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <button className="btn btn-save" onClick={handleSaveSizing} disabled={sizingSaving}>
              {sizingSaving ? 'Saving...' : 'Save Sizes'}
            </button>
          </div>
        </div>

        {/* ═══════ VIEW: EVENTS ═══════ */}
        <div className={`view ${view === 'events' ? 'active' : ''}`}>
          <div className="card card-pad">
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Manage your registrations for upcoming seminars, camps, and in-house tournaments.
            </p>
            <div style={{ padding: 20, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>No upcoming events</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>You haven't registered for anything recently.</div>
            </div>
          </div>
        </div>

        {/* ═══════ VIEW: CONNECTED APPS ═══════ */}
        <div className={`view ${view === 'connected' ? 'active' : ''}`}>
          <div className="card card-pad">
            {/* Connected Apps — coming in future update */}
            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Apple Health, Whoop, and Garmin integrations are coming in a future update.</div>
            </div>
          </div>
        </div>

        {/* ═══════ VIEW: NOTIFICATIONS ═══════ */}
        <div className={`view ${view === 'notif' ? 'active' : ''}`}>
          <div className="card card-pad">
            <div className="toggle-row" onClick={() => toggleNotif('push')} style={{ cursor: 'pointer' }}>
              <div className="toggle-info">
                <div className="toggle-title">Push Notifications</div>
                <div className="toggle-desc">Class updates and app alerts</div>
              </div>
              <div className={`switch ${notifPrefs.push ? 'on' : ''}`} />
            </div>
            <div className="toggle-row" onClick={() => toggleNotif('email')} style={{ cursor: 'pointer' }}>
              <div className="toggle-info">
                <div className="toggle-title">Email Reminders</div>
                <div className="toggle-desc">Schedule and billing receipts</div>
              </div>
              <div className={`switch ${notifPrefs.email ? 'on' : ''}`} />
            </div>
            <div className="toggle-row" onClick={() => toggleNotif('marketing')} style={{ cursor: 'pointer' }}>
              <div className="toggle-info">
                <div className="toggle-title">Marketing & Promos</div>
                <div className="toggle-desc">Merch drops and seminars</div>
              </div>
              <div className={`switch ${notifPrefs.marketing ? 'on' : ''}`} />
            </div>
          </div>
        </div>

        {/* ═══════ VIEW: PRIVACY & SECURITY ═══════ */}
        <div className={`view ${view === 'privacy' ? 'active' : ''}`}>
          <div className="card card-pad">
            <div className="toggle-row" onClick={() => setPrivacyPrefs(p => ({ ...p, publicProfile: !p.publicProfile }))} style={{ cursor: 'pointer' }}>
              <div className="toggle-info">
                <div className="toggle-title">Public Profile</div>
                <div className="toggle-desc">Let other members see your belt rank</div>
              </div>
              <div className={`switch ${privacyPrefs.publicProfile ? 'on' : ''}`} />
            </div>
            <div className="toggle-row" onClick={() => setPrivacyPrefs(p => ({ ...p, leaderboard: !p.leaderboard }))} style={{ marginBottom: 16, cursor: 'pointer' }}>
              <div className="toggle-info">
                <div className="toggle-title">Leaderboard Opt-In</div>
                <div className="toggle-desc">Appear on global XP leaderboards</div>
              </div>
              <div className={`switch ${privacyPrefs.leaderboard ? 'on' : ''}`} />
            </div>
            <div className="sec-title" style={{ marginTop: 24 }}>Change Password</div>
            <div className="form-group">
              <input type="password" className="form-input" placeholder="Current Password" />
            </div>
            <div className="form-group">
              <input type="password" className="form-input" placeholder="New Password" />
            </div>
            <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => showToast(`Password reset email sent to ${member?.email || 'your email'}`)}>
              Update Password
            </button>
          </div>
        </div>

        {/* ═══════ VIEW: WAIVERS ═══════ */}
        <div className={`view ${view === 'waiver' ? 'active' : ''}`}>
          <div className="card card-pad">
            <div className="cc-list">
              <div className="cc-row">
                <div className="cc-icon" style={{ background: 'rgba(255,255,255,0.1)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div className="cc-details">
                  <div className="cc-num">Liability Waiver 2024</div>
                  <div className="cc-exp">Signed Jan 14, 2024</div>
                </div>
                <div className="cc-primary-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>SIGNED</div>
              </div>
              <div className="cc-row">
                <div className="cc-icon" style={{ background: 'rgba(255,255,255,0.1)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div className="cc-details">
                  <div className="cc-num">Code of Conduct</div>
                  <div className="cc-exp">Signed Jan 14, 2024</div>
                </div>
                <div className="cc-primary-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>SIGNED</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ VIEW: REFER A FRIEND ═══════ */}
        <div className={`view ${view === 'refer' ? 'active' : ''}`}>
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#129309;</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Invite Friends, Earn XP</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Give your friends a free trial week. If they sign up for a membership, you'll earn <strong>5,000 XP</strong> and a unique profile badge!
            </p>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Your Referral Link</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" className="form-input" value={`join.labyrinth.com/ref/${(member?.name || 'member').split(' ')[0].toLowerCase()}`} readOnly />
                <button className="btn btn-save" style={{ width: 'auto', margin: 0, padding: '0 16px' }} onClick={() => { navigator.clipboard?.writeText(`join.labyrinth.com/ref/${(member?.name || 'member').split(' ')[0].toLowerCase()}`); showToast('Copied!'); }}>
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ VIEW: DELETE ACCOUNT ═══════ */}
        <div className={`view ${view === 'delete' ? 'active' : ''}`}>
          <div className="card card-pad">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ef4444', marginBottom: 12 }}>Danger Zone</h2>
            <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 24, lineHeight: 1.5 }}>
              Deleting your account is permanent. All your training history, belt rank progression, and XP will be permanently wiped from the Labyrinth database. Your active membership will also be canceled immediately.
            </p>
            <div className="form-group">
              <label style={{ color: '#ef4444' }}>Type "DELETE" to confirm</label>
              <input type="text" className="form-input" placeholder="DELETE" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} />
            </div>
            <button
              className="btn btn-danger"
              style={{ marginTop: 16, opacity: deleteConfirmText !== 'DELETE' || deleting ? 0.5 : 1 }}
              disabled={deleteConfirmText !== 'DELETE' || deleting}
              onClick={async () => {
                if (!member?.email) return;
                setDeleting(true);
                try {
                  const token = localStorage.getItem('lbjj_session_token') || '';
                  await gasCall('requestAccountDeletion', { token, email: member.email, reason: 'User requested via app' });
                  navTo('main', 'My Account');
                  showToast('Deletion requested — your account will be removed within 48 hours.');
                } catch {
                  showToast('Could not submit request. Contact info@labyrinth.vision', true);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Submitting…' : 'Confirm Deletion Request'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
