import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useHashLocation } from 'wouter/use-hash-location';
import { ALL_ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, checkAndUnlockAchievements, getRarityXP } from '@/lib/achievements';
import type { Achievement, AchievementRarity } from '@/lib/achievements';
import { gasCall, syncAchievements, saveMemberStats } from '@/lib/api';
import { LockedParagonRing } from '@/components/ParagonRing';
import { getActualLevel } from '@/lib/xp';
import { useAuth } from '@/lib/auth-context';
import { pushLocalNotification } from '@/components/NotificationProvider';

// ─── Rarity config ────────────────────────────────────────────────
const TIERS: { id: 'All' | AchievementRarity; label: string; color: string }[] = [
  { id: 'All',       label: 'All Tiers',  color: '#ffffff' },
  { id: 'Common',    label: 'Common',     color: '#b0c4de' },
  { id: 'Rare',      label: 'Rare',       color: '#cd7f32' },
  { id: 'Epic',      label: 'Epic',       color: '#8a2be2' },
  { id: 'Legendary', label: 'Legendary',  color: '#ff4500' },
  { id: 'Mythic',    label: 'Mythic',     color: '#ffd700' },
];

// ─── Progress map ─────────────────────────────────────────────────
function getProgress(key: string, stats: any): { current: number; target: number } | null {
  const map: Record<string, { current: () => number; target: number }> = {
    ten_classes:      { current: () => stats?.classesAttended || 0, target: 10 },
    thirty_classes:   { current: () => stats?.classesAttended || 0, target: 30 },
    hundred_classes:  { current: () => stats?.classesAttended || 0, target: 100 },
    fivehundred_classes: { current: () => stats?.classesAttended || 0, target: 500 },
    streak_4:         { current: () => stats?.currentStreak || 0, target: 4 },
    streak_8:         { current: () => stats?.currentStreak || 0, target: 8 },
    streak_12:        { current: () => stats?.currentStreak || 0, target: 12 },
    streak_52:        { current: () => stats?.currentStreak || 0, target: 52 },
    game_win_5:       { current: () => stats?.wins || 0, target: 5 },
    game_win_10:      { current: () => stats?.wins || 0, target: 10 },
    game_50:          { current: () => stats?.gamesPlayed || 0, target: 50 },
    level_10:         { current: () => stats?.level || 0, target: 10 },
    level_20:         { current: () => stats?.level || 0, target: 20 },
    level_30:         { current: () => stats?.level || 0, target: 30 },
  };
  const cfg = map[key];
  if (!cfg) return null;
  const current = cfg.current();
  if (current <= 0) return null;
  return { current, target: cfg.target };
}

// ─── Holographic SVG badge generator ─────────────────────────────
function genBadgeSVG(type: string, primaryStr: string, secondaryStr: string, ringColor?: string): string {
  const p = primaryStr; const s = secondaryStr; const rC = ringColor || p;
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    rays += `<polygon points="98,100 102,100 120,-20 80,-20" fill="#ffffff" opacity="0.06" transform="rotate(${angle} 100 100)"/>`;
  }

  const defs = `<defs>
    <linearGradient id="bezel-outer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fcfcfc"/><stop offset="25%" stop-color="#a5a5a5"/>
      <stop offset="50%" stop-color="#404040"/><stop offset="75%" stop-color="#666666"/><stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <linearGradient id="bezel-inner" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="35%" stop-color="#5a5a5a"/><stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <radialGradient id="plate" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${rC}" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="${s}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow-ambient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${rC}" stop-opacity="0.8"/><stop offset="100%" stop-color="${rC}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow-heavy" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="16" stdDeviation="12" flood-color="#000" flood-opacity="0.95"/>
    </filter>
    <filter id="icon-pop" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.8"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur"/>
      <feOffset in="blur" dx="-1" dy="-2" result="offsetBlur"/>
      <feComposite operator="out" in="SourceAlpha" in2="offsetBlur" result="inverse"/>
      <feFlood flood-color="white" flood-opacity="0.8" result="color"/>
      <feComposite operator="in" in="color" in2="inverse" result="rimLight"/>
      <feComposite operator="over" in="rimLight" in2="SourceGraphic"/>
    </filter>
    <linearGradient id="metal1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="50%" stop-color="#d1d1d1"/><stop offset="100%" stop-color="#7a7a7a"/>
    </linearGradient>
    <linearGradient id="metal2" x1="100%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="${s}"/><stop offset="100%" stop-color="#111"/>
    </linearGradient>
    <clipPath id="inner-clip"><circle cx="100" cy="100" r="78"/></clipPath>
  </defs>`;

  const coinBase = `
    <circle cx="100" cy="100" r="98" fill="url(#glow-ambient)" opacity="0.5" filter="url(#shadow-heavy)"/>
    <circle cx="100" cy="100" r="90" fill="url(#bezel-outer)" filter="url(#shadow-heavy)"/>
    <circle cx="100" cy="100" r="83" fill="url(#bezel-inner)"/>
    <circle cx="100" cy="100" r="78" fill="url(#plate)"/>
    <g clip-path="url(#inner-clip)"><g>${rays}<animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="40s" repeatCount="indefinite"/></g></g>
    <circle cx="100" cy="100" r="70" fill="none" stroke="${rC}" stroke-width="2" stroke-dasharray="12 6" opacity="0.8">
      <animateTransform attributeName="transform" type="rotate" from="360 100 100" to="0 100 100" dur="25s" repeatCount="indefinite"/>
    </circle>
    <circle cx="100" cy="100" r="60" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="2 8" opacity="0.5">
      <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="35s" repeatCount="indefinite"/>
    </circle>`;

  const glassDome = `
    <path d="M 22 100 A 78 78 0 0 1 178 100 A 78 45 0 0 0 22 100 Z" fill="url(#glass)"/>
    <path d="M 22 100 A 78 78 0 0 0 178 100 A 78 45 0 0 1 22 100 Z" fill="#000000" opacity="0.2"/>`;

  let silhouette = '';
  if (type === 'belt_rank') {
    silhouette = `<g transform="translate(0,-5)" filter="url(#icon-pop)">
      <circle cx="100" cy="45" r="14" fill="url(#metal1)"/>
      <path d="M82,65 Q100,55 118,65 L130,115 L115,130 L85,130 L70,115 Z" fill="url(#metal1)"/>
      <path d="M85,140 L100,140 L100,185 L75,185 Z" fill="url(#metal1)"/>
      <path d="M100,140 L115,140 L125,185 L100,185 Z" fill="url(#metal1)"/>
      <path d="M80,125 L120,125 L125,140 L75,140 Z" fill="${p}"/>
      <path d="M90,140 L80,175 L95,175 L100,140 Z" fill="${p}"/>
      <path d="M100,140 L105,165 L120,165 L110,140 Z" fill="${p}"/>
      <path d="M70,70 L50,105 L80,130" fill="none" stroke="url(#metal1)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M130,70 L150,105 L120,130" fill="none" stroke="url(#metal1)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  } else if (type === 'victory') {
    silhouette = `<g transform="translate(-10,-5)" filter="url(#icon-pop)">
      <circle cx="65" cy="70" r="11" fill="url(#metal1)"/>
      <path d="M55,85 L75,85 L80,140 L50,140 Z" fill="url(#metal1)"/>
      <path d="M50,140 L65,140 L65,185 L45,185 Z" fill="url(#metal1)"/>
      <path d="M65,140 L80,140 L90,185 L65,185 Z" fill="url(#metal1)"/>
      <circle cx="125" cy="55" r="13" fill="url(#metal1)"/>
      <path d="M110,75 L140,75 L145,135 L105,135 Z" fill="url(#metal1)"/>
      <path d="M115,80 L100,35" fill="none" stroke="url(#metal1)" stroke-width="11" stroke-linecap="round"/>
      <path d="M135,80 L155,45" fill="none" stroke="url(#metal1)" stroke-width="11" stroke-linecap="round"/>
    </g>`;
  } else if (type === 'takedown') {
    silhouette = `<g transform="translate(-8,-5)" filter="url(#icon-pop)">
      <circle cx="100" cy="85" r="13" fill="url(#metal1)"/>
      <path d="M85,105 Q100,95 115,105 L120,145 L80,145 Z" fill="url(#metal1)"/>
      <path d="M80,145 L100,145 L85,180 L55,180 Z" fill="url(#metal1)"/>
      <path d="M100,145 L120,145 L145,180 L115,180 Z" fill="url(#metal1)"/>
      <path d="M85,110 L60,90 L85,65" fill="none" stroke="url(#metal1)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="65" cy="45" r="12" fill="url(#metal1)"/>
      <path d="M80,55 L125,75 L115,95 L70,75 Z" fill="url(#metal1)"/>
    </g>`;
  } else if (type === 'guard') {
    silhouette = `<g transform="translate(-5,-12)" filter="url(#icon-pop)">
      <circle cx="135" cy="90" r="12" fill="url(#metal1)"/>
      <path d="M145,100 L170,145 L150,165 L125,120 Z" fill="url(#metal1)"/>
      <circle cx="55" cy="145" r="13" fill="url(#metal1)"/>
      <path d="M45,125 L85,135 L85,165 L45,165 Z" fill="url(#metal1)"/>
      <path d="M75,130 L115,85 L135,105 L95,150 Z" fill="url(#metal1)"/>
      <path d="M85,155 L145,145 L135,115 L110,125 Z" fill="url(#metal1)"/>
    </g>`;
  } else if (type === 'calendar') {
    silhouette = `<g filter="url(#icon-pop)">
      <rect x="60" y="60" width="80" height="80" rx="12" fill="url(#metal1)"/>
      <path d="M60,90 L140,90" stroke="#111" stroke-width="6"/>
      <rect x="75" y="45" width="12" height="25" rx="6" fill="${p}"/>
      <rect x="115" y="45" width="12" height="25" rx="6" fill="${p}"/>
      <path d="M80,115 L95,130 L125,100" fill="none" stroke="${p}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
  } else if (type === 'smartphone') {
    silhouette = `<g filter="url(#icon-pop)">
      <rect x="65" y="40" width="70" height="120" rx="12" fill="url(#metal1)"/>
      <circle cx="100" cy="145" r="6" fill="url(#metal1)"/>
      <rect x="75" y="60" width="50" height="70" rx="4" fill="${p}" opacity="0.9"/>
      <path d="M85,95 L115,95" stroke="url(#metal1)" stroke-width="4" stroke-linecap="round"/>
      <path d="M85,110 L105,110" stroke="url(#metal1)" stroke-width="4" stroke-linecap="round"/>
    </g>`;
  } else if (type === 'chess') {
    silhouette = `<g transform="translate(0,-2)" filter="url(#icon-pop)">
      <path d="M60,140 L140,140 L130,160 L70,160 Z" fill="url(#metal1)"/>
      <path d="M65,140 L50,80 L80,105 L100,60 L120,105 L150,80 L135,140 Z" fill="url(#metal1)"/>
      <circle cx="50" cy="75" r="9" fill="${p}"/>
      <circle cx="100" cy="50" r="11" fill="${p}"/>
      <circle cx="150" cy="75" r="9" fill="${p}"/>
    </g>`;
  } else if (type === 'trophy') {
    silhouette = `<g transform="translate(0,5)" filter="url(#icon-pop)">
      <path d="M70,140 L130,140 L120,120 L80,120 Z" fill="url(#metal1)"/>
      <path d="M85,120 L115,120 L105,80 L95,80 Z" fill="url(#metal1)"/>
      <path d="M60,30 L140,30 Q140,80 100,90 Q60,80 60,30 Z" fill="url(#metal1)"/>
      <path d="M60,40 C30,40 30,80 75,80" fill="none" stroke="url(#metal1)" stroke-width="10"/>
      <path d="M140,40 C170,40 170,80 125,80" fill="none" stroke="url(#metal1)" stroke-width="10"/>
      <circle cx="100" cy="55" r="14" fill="${p}"/>
    </g>`;
  } else if (type === 'medal') {
    silhouette = `<g transform="translate(0,-15)" filter="url(#icon-pop)">
      <path d="M70,15 L100,80 L130,15" fill="none" stroke="${p}" stroke-width="16"/>
      <circle cx="100" cy="115" r="45" fill="url(#metal1)"/>
      <circle cx="100" cy="115" r="35" fill="url(#metal1)"/>
      <path d="M90,125 L100,100 L110,125 L135,125 L115,140 L125,165 L100,150 L75,165 L85,140 L65,125 Z" fill="${p}" transform="translate(100,115) scale(0.5) translate(-100,-115)"/>
    </g>`;
  } else if (type === 'shield') {
    silhouette = `<g filter="url(#icon-pop)">
      <path d="M30 65 L100 30 L170 65 L160 115 C150 150 100 175 100 175 C100 175 50 150 40 115 Z" fill="url(#metal1)"/>
      <path d="M100 50 L140 80 L100 150 L60 80 Z" fill="#ffffff" opacity="0.9"/>
      <path d="M100 50 L140 80 L100 150 Z" fill="${p}"/>
      <circle cx="100" cy="100" r="16" fill="url(#metal1)"/>
      <circle cx="100" cy="100" r="10" fill="${p}"/>
    </g>`;
  } else if (type === 'diamond') {
    silhouette = `<g filter="url(#icon-pop)">
      <path d="M100 25 L175 100 L100 175 L25 100 Z" fill="url(#metal1)"/>
      <path d="M100 25 L175 100 L100 100 Z" fill="#ffffff" opacity="0.6"/>
      <path d="M100 25 L25 100 L100 100 Z" fill="url(#metal1)" opacity="0.8"/>
      <circle cx="100" cy="100" r="28" fill="${p}"/>
      <circle cx="100" cy="100" r="12" fill="url(#metal1)"/>
    </g>`;
  } else if (type === 'hex') {
    silhouette = `<g filter="url(#icon-pop)">
      <polygon points="100,25 165,60 165,140 100,175 35,140 35,60" fill="url(#metal1)"/>
      <circle cx="100" cy="100" r="45" fill="url(#metal1)"/>
      <circle cx="100" cy="100" r="35" fill="none" stroke="${p}" stroke-width="6"/>
      <path d="M100 75 L120 115 L80 115 Z" fill="${p}"/>
    </g>`;
  } else if (type === 'star') {
    silhouette = `<g filter="url(#icon-pop)">
      <path d="M100 20 L115 85 L180 100 L115 115 L100 180 L85 115 L20 100 L85 85 Z" fill="url(#metal1)"/>
      <circle cx="100" cy="100" r="25" fill="url(#metal1)"/>
      <circle cx="100" cy="100" r="15" fill="${p}"/>
    </g>`;
  } else if (type.startsWith('num_')) {
    const num = type.split('_')[1];
    silhouette = `<g filter="url(#icon-pop)">
      <text x="100" y="100" font-family="system-ui,sans-serif" font-size="80" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="url(#metal1)">${num}</text>
      <text x="100" y="100" font-family="system-ui,sans-serif" font-size="80" font-weight="900" text-anchor="middle" dominant-baseline="central" fill="none" stroke="${rC}" stroke-width="2">${num}</text>
    </g>`;
  } else {
    // Fallback: star
    silhouette = `<g filter="url(#icon-pop)">
      <path d="M100 20 L115 85 L180 100 L115 115 L100 180 L85 115 L20 100 L85 85 Z" fill="url(#metal1)"/>
      <circle cx="100" cy="100" r="20" fill="${p}"/>
    </g>`;
  }

  return `<svg viewBox="0 0 200 200" width="100%" height="100%" style="overflow:visible;">${defs}${coinBase}${silhouette}${glassDome}</svg>`;
}

// ─── SecretRevealOverlay ──────────────────────────────────────────
function SecretRevealOverlay({ achievement, onComplete }: { achievement: Achievement; onComplete: () => void }) {
  const [phase, setPhase] = useState<'vignette' | 'orb' | 'text' | 'crack' | 'done'>('vignette');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('orb'), 400);
    const t2 = setTimeout(() => setPhase('text'), 1200);
    const t3 = setTimeout(() => setPhase('crack'), 2000);
    const t4 = setTimeout(() => { setPhase('done'); onComplete(); }, 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);
  const badgeSvg = genBadgeSVG(achievement.badgeType || 'star', achievement.color, achievement.badgeColor2 || '#111', achievement.color);
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        background: phase === 'crack' ? 'transparent' : 'radial-gradient(circle,#222,#0a0a0a)',
        border: phase === 'crack' ? 'none' : '2px solid #333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: phase === 'orb' || phase === 'text' ? 'spin 0.6s linear infinite' : 'none',
        transition: 'all 0.3s',
      }}>
        {phase === 'crack'
          ? <div style={{ width: 120, height: 120 }} dangerouslySetInnerHTML={{ __html: badgeSvg }} />
          : <span style={{ fontSize: 48, opacity: phase === 'vignette' ? 0 : 1, transition: 'opacity 0.4s' }}>?</span>
        }
      </div>
      {(phase === 'text' || phase === 'crack') && (
        <div style={{ fontSize: 13, fontWeight: 900, color: '#e05555', letterSpacing: '0.2em', textTransform: 'uppercase', animation: 'fadeInUp 0.4s ease both' }}>
          Hidden Achievement Unlocked
        </div>
      )}
      {phase === 'crack' && (
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', animation: 'fadeInUp 0.4s ease 0.1s both', opacity: 0 }}>
          {achievement.label}
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── VFX: nuclear claim ───────────────────────────────────────────
function triggerNuclearClaim(color: string, onDone?: () => void, xpAmount: number = 150) {
  // Create a self-contained overlay so this works anywhere in the app,
  // not dependent on #ach-vfx-layer being present in the DOM.
  const vfx = document.createElement('div');
  vfx.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:19999;overflow:hidden;';
  document.body.appendChild(vfx);
  const cleanup = () => { try { document.body.removeChild(vfx); } catch {} };
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;

  // Phase 1: incoming particles
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:4px;height:20px;background:${color};border-radius:4px;box-shadow:0 0 20px ${color};`;
      const ang = Math.random() * Math.PI * 2;
      const dist = 250 + Math.random() * 200;
      p.style.left = `${cx + Math.cos(ang) * dist}px`;
      p.style.top = `${cy + Math.sin(ang) * dist}px`;
      p.style.transform = `rotate(${ang + Math.PI / 2}rad)`;
      vfx.appendChild(p);
      p.animate([
        { transform: `translate(0,0) rotate(${ang + Math.PI / 2}rad)`, opacity: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: `translate(${-Math.cos(ang) * dist}px,${-Math.sin(ang) * dist}px) rotate(${ang + Math.PI / 2}rad)`, opacity: 1 },
      ], { duration: 400, easing: 'ease-in' }).onfinish = () => p.remove();
    }, i * 10);
  }

  setTimeout(() => {
    // Flash
    const flash = document.createElement('div');
    flash.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:1;pointer-events:none;';
    vfx.appendChild(flash);
    flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'ease-out' }).onfinish = () => flash.remove();

    // Shockwave
    const sw = document.createElement('div');
    sw.style.cssText = `position:absolute;top:50%;left:50%;width:10px;height:10px;border-radius:50%;transform:translate(-50%,-50%);border:30px solid rgba(255,255,255,0.9);box-shadow:0 0 100px rgba(255,255,255,0.8);`;
    vfx.appendChild(sw);
    sw.animate([
      { transform: 'translate(-50%,-50%) scale(0.1)', opacity: 1, borderWidth: '80px' },
      { transform: 'translate(-50%,-50%) scale(25)', opacity: 0, borderWidth: '1px' },
    ], { duration: 700, easing: 'cubic-bezier(0.1,0.8,0.3,1)' }).onfinish = () => sw.remove();

    // Burst particles
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:4px;height:20px;background:${i % 2 === 0 ? '#fff' : color};border-radius:4px;box-shadow:0 0 20px ${color};`;
      const ang = Math.random() * Math.PI * 2;
      const v = 300 + Math.random() * 500;
      p.style.left = `${cx}px`; p.style.top = `${cy}px`;
      vfx.appendChild(p);
      p.animate([
        { transform: `translate(0,0) rotate(${ang + Math.PI / 2}rad) scale(1)`, opacity: 1 },
        { transform: `translate(${Math.cos(ang) * v}px,${Math.sin(ang) * v}px) rotate(${ang + Math.PI / 2}rad) scale(0)`, opacity: 0 },
      ], { duration: 800 + Math.random() * 500, easing: 'cubic-bezier(0.1,0.8,0.3,1)' }).onfinish = () => p.remove();
    }

    // XP float
    const xpc = document.createElement('div');
    xpc.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;pointer-events:none;`;
    xpc.innerHTML = `
      <div style="font-family:system-ui,sans-serif;font-size:72px;font-weight:900;color:#fff;text-shadow:0 0 40px ${color},0 0 80px ${color};line-height:1;letter-spacing:-0.02em;white-space:nowrap;">+${xpAmount}</div>
      <div style="font-family:system-ui,sans-serif;font-size:20px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.3em;margin-top:-4px;text-shadow:0 0 20px ${color};">EXPERIENCE</div>
    `;
    vfx.appendChild(xpc);
    xpc.animate([
      { transform: 'translate(-50%,-10%) scale(0.2)', opacity: 0, filter: 'blur(10px)' },
      { transform: 'translate(-50%,-50%) scale(1.3)', opacity: 1, filter: 'blur(0px)', offset: 0.1 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, filter: 'blur(0px)', offset: 0.15 },
      { transform: 'translate(-50%,-55%) scale(1)', opacity: 1, filter: 'blur(0px)', offset: 0.8 },
      { transform: 'translate(-50%,-80%) scale(1.1)', opacity: 0, filter: 'blur(15px)' },
    ], { duration: 3500, easing: 'cubic-bezier(0.16,1,0.3,1)' }).onfinish = () => { xpc.remove(); cleanup(); onDone?.(); };
  }, 500);
}

// ─── HoloCard ─────────────────────────────────────────────────────
function HoloCard({
  achievement, isEarned, isClaimable, isSecret, stats, justUnlocked,
  onClick,
}: {
  achievement: Achievement;
  isEarned: boolean;
  isClaimable: boolean;
  isSecret: boolean;
  stats: any;
  justUnlocked: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const isLocked = !isEarned && !isClaimable;
  const c1 = isLocked ? '#333' : achievement.color;
  const c2 = isLocked ? '#111' : (achievement.badgeColor2 || '#0a0a0a');
  const badgeSvg = genBadgeSVG(achievement.badgeType || 'star', c1, c2, c1);
  const progress = !isSecret && isLocked ? getProgress(achievement.key, stats) : null;

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card || isLocked) return;
    const rect = card.getBoundingClientRect();
    const rx = (((e.clientY - rect.top) - (rect.height / 2)) / (rect.height / 2)) * -18;
    const ry = (((e.clientX - rect.left) - (rect.width / 2)) / (rect.width / 2)) * 18;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.06,1.06,1.06)`;
    if (foilRef.current) {
      foilRef.current.style.setProperty('--x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
      foilRef.current.style.setProperty('--y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
      foilRef.current.style.opacity = '0.45';
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    if (foilRef.current) foilRef.current.style.opacity = '0';
  };

  const rarityColor = achievement.color;
  const rarityLabel = achievement.rarity || 'Common';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '0.68',
        borderRadius: 12,
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.1s',
        background: '#080808',
        border: isClaimable
          ? `1.5px solid ${rarityColor}`
          : isEarned
            ? `1px solid ${rarityColor}55`
            : '1px solid #141414',
        boxShadow: isClaimable
          ? `0 0 20px ${rarityColor}40, inset 0 0 15px ${rarityColor}20`
          : isEarned
            ? `0 4px 20px rgba(0,0,0,0.7), 0 0 8px ${rarityColor}15`
            : '0 4px 14px rgba(0,0,0,0.7)',
        animation: isClaimable ? 'ach-float-breathe 3s infinite ease-in-out' : justUnlocked ? 'ach-pop-in 0.5s cubic-bezier(0.16,1,0.3,1) both' : undefined,
        filter: isLocked && !progress ? 'grayscale(1) brightness(0.3)' : undefined,
      }}
    >
      {/* Holographic foil */}
      {!isLocked && (
        <div
          ref={foilRef}
          style={{
            position: 'absolute', inset: 0, borderRadius: 12, zIndex: 5,
            pointerEvents: 'none', mixBlendMode: 'color-dodge', opacity: 0,
            background: 'radial-gradient(farthest-corner circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 50%)',
            transition: 'opacity 0.3s',
          } as any}
        />
      )}

      {/* Shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.04) 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Badge */}
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        transform: 'translate(-50%, -45%)',
        width: '75%', height: '75%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.7))',
      }} dangerouslySetInnerHTML={{ __html: badgeSvg }} />

      {/* Card footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '8px 6px 10px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 3,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 900, textTransform: 'uppercase',
          textAlign: 'center', lineHeight: 1.1, letterSpacing: '0.02em',
          color: isLocked ? '#555' : rarityColor,
          textShadow: isEarned ? `0 0 12px ${rarityColor}80` : 'none',
        }}>
          {isSecret ? '???' : achievement.label}
        </div>
        <div style={{ fontSize: 8, fontWeight: 800, color: isLocked ? '#333' : '#777', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          {rarityLabel}
        </div>

        {/* Progress bar for partially completed locked achievements */}
        {progress && (
          <div style={{ width: '80%', marginTop: 4 }}>
            <div style={{ height: 2.5, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((progress.current / progress.target) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${rarityColor}88, ${rarityColor})`,
                borderRadius: 2,
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ fontSize: 8, color: '#444', marginTop: 2, textAlign: 'center', fontWeight: 700 }}>
              {progress.current}/{progress.target}
            </div>
          </div>
        )}
      </div>

      {/* Earned checkmark */}
      {isEarned && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 16, height: 16, borderRadius: '50%',
          background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" width="10" height="10">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Claimable glow ring */}
      {isClaimable && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          width: 16, height: 16, borderRadius: '50%',
          background: rarityColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'ach-pulse-dot 2s infinite', zIndex: 10,
        }}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" style={{ color: '#000' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Inspect Overlay ──────────────────────────────────────────────
function InspectOverlay({
  achievement, isEarned, isClaimable, isSecret, onClose, onClaimed, earnedDate,
}: {
  achievement: Achievement;
  isEarned: boolean;
  isClaimable: boolean;
  isSecret: boolean;
  onClose: () => void;
  onClaimed: (key: string) => void;
  earnedDate: string | null;
}) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const angRef = useRef(0);
  const animRef = useRef<number>();
  const [claiming, setClaiming] = useState(false);

  const c1 = (isSecret && !isEarned && !isClaimable) ? '#555' : achievement.color;
  const c2 = (isSecret && !isEarned && !isClaimable) ? '#222' : (achievement.badgeColor2 || '#0a0a0a');
  const badgeSvg = genBadgeSVG(achievement.badgeType || 'star', c1, c2, c1);
  const rarityLabel = achievement.rarity || 'Common';
  const rarityColor = achievement.color;
  const tierColors: Record<string, string> = {
    Common: '#b0c4de', Rare: '#cd7f32', Epic: '#8a2be2', Legendary: '#ff4500', Mythic: '#ffd700',
  };
  const tc = tierColors[rarityLabel] || '#fff';

  useEffect(() => {
    const animate = () => {
      angRef.current += 0.4;
      if (badgeRef.current) {
        badgeRef.current.style.transform = `scale(1) translateY(${Math.sin(angRef.current / 10) * 12}px) rotateY(${Math.sin(angRef.current / 20) * 14}deg)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current!);
  }, []);

  const handleClaim = () => {
    if (claiming) return;
    // Hard idempotency: read the claimed set fresh from localStorage so double-taps or
    // stale state cannot re-award XP. If already claimed, bail out without awarding.
    const alreadyClaimed = (() => {
      try {
        const arr = JSON.parse(localStorage.getItem('lbjj_achievement_xp_claimed') || '[]');
        return Array.isArray(arr) && arr.includes(achievement.key);
      } catch { return false; }
    })();
    if (alreadyClaimed) {
      onClose();
      return;
    }
    setClaiming(true);
    // Mark claimed FIRST so any re-entry/double-tap immediately short-circuits above.
    try {
      const arr = JSON.parse(localStorage.getItem('lbjj_achievement_xp_claimed') || '[]');
      const set = Array.isArray(arr) ? arr : [];
      if (!set.includes(achievement.key)) {
        set.push(achievement.key);
        localStorage.setItem('lbjj_achievement_xp_claimed', JSON.stringify(set));
      }
    } catch {}
    // Award XP once — scaled by rarity
    const xpReward = achievement.xp ?? getRarityXP(achievement.rarity);
    try {
      const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      s.xp = (s.xp || 0) + xpReward;
      s.totalXP = (s.totalXP || 0) + xpReward;
      localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(s));
      window.dispatchEvent(new CustomEvent('xp-updated'));
      // Push the new total to the server so the leaderboard level matches.
      saveMemberStats({
        xp: s.xp || 0,
        streak: s.currentStreak || 0,
        maxStreak: s.maxStreak || 0,
      }).catch(() => {});
    } catch {}
    try {
      pushLocalNotification({
        type: 'achievement',
        title: 'Achievement Unlocked! 🏅',
        body: `You earned: ${achievement.label}`,
        data: { route: '/achievements' },
      });
    } catch {}
    onClaimed(achievement.key);
    triggerNuclearClaim(rarityColor, () => {
      setClaiming(false);
      onClose();
    }, xpReward);
  };

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
        zIndex: 2000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'opacity 0.4s',
      }}
      onClick={onClose}
    >
      {/* God rays */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '200vw', height: '200vw',
        transform: 'translate(-50%,-50%)',
        background: 'repeating-conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.025) 10deg, transparent 20deg)',
        animation: 'ach-spin-rays 40s linear infinite',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute', top: 'max(44px,env(safe-area-inset-top,44px))', right: 24,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}
      >✕</button>

      {/* Badge */}
      <div
        ref={badgeRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 10,
          width: 220, height: 220,
          filter: 'drop-shadow(0 40px 50px rgba(0,0,0,0.9))',
        }}
        dangerouslySetInnerHTML={{ __html: badgeSvg }}
      />

      {/* Info */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          marginTop: 32, padding: '0 28px', maxWidth: 360,
          animation: 'ach-fade-in-up 0.5s ease both',
        }}
      >
        <div style={{
          fontSize: 11, fontWeight: 900, color: tc, letterSpacing: '0.25em',
          textTransform: 'uppercase', marginBottom: 10,
          textShadow: `0 0 20px ${tc}`,
        }}>
          {rarityLabel} Artifact
        </div>
        <h2 style={{
          fontFamily: 'system-ui,sans-serif', fontSize: 34, fontWeight: 900,
          textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: '0.02em',
          color: '#fff', textShadow: '0 8px 20px rgba(0,0,0,0.8)', lineHeight: 1.05,
        }}>
          {isSecret && !isEarned && !isClaimable ? 'Undiscovered' : achievement.label}
        </h2>
        <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.55, fontWeight: 500, margin: 0 }}>
          {isSecret && !isEarned && !isClaimable
            ? 'Only the worthy will uncover this artifact through relentless training.'
            : achievement.desc}
        </p>
        {earnedDate && (
          <p style={{ fontSize: 12, color: '#555', marginTop: 10 }}>
            Earned {new Date(earnedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Rarity dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
          {(['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'] as AchievementRarity[]).map(r => {
            const active = (['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].indexOf(rarityLabel) >= ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].indexOf(r));
            return (
              <div key={r} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: active ? tierColors[r] : '#222',
                boxShadow: active ? `0 0 6px ${tierColors[r]}` : 'none',
                transition: 'all 0.3s',
              }} />
            );
          })}
        </div>
      </div>

      {/* Claim button */}
      {isClaimable && !claiming && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 280, marginTop: 36 }}
        >
          <button
            onClick={handleClaim}
            style={{
              width: '100%', padding: '18px 0',
              fontFamily: 'system-ui,sans-serif', fontSize: 17, fontWeight: 900,
              textTransform: 'uppercase', letterSpacing: '0.1em', color: '#000',
              border: 'none', borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
              background: `linear-gradient(90deg, ${rarityColor}, #fff8dc, ${rarityColor})`,
              backgroundSize: '200% auto',
              animation: 'ach-shine 3s linear infinite',
              boxShadow: `0 0 30px ${rarityColor}66, inset 0 0 20px rgba(255,255,255,0.8)`,
            }}
          >
            ⚡ Extract Energy
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function AchievementsPage() {
  const [, navigate] = useHashLocation();
  const { member } = useAuth();
  const [tierIdx, setTierIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [earnedKeys, setEarnedKeys] = useState<string[]>([]);
  const [newBadgeKeys, setNewBadgeKeys] = useState<string[]>([]);
  const [claimedXpKeys, setClaimedXpKeys] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('lbjj_achievement_xp_claimed') || '[]'); } catch { return []; }
  });
  const [inspect, setInspect] = useState<Achievement | null>(null);
  const [memberStats, setMemberStats] = useState<any>({});
  const [secretReveal, setSecretReveal] = useState<Achievement | null>(null);
  const [isShifting, setIsShifting] = useState(false);
  const [dialLabel, setDialLabel] = useState('All Tiers');
  const tierColor = TIERS[tierIdx]?.color || '#fff';

  // Load achievements + sync
  useEffect(() => {
    const profile = (() => { try { return JSON.parse(localStorage.getItem('lbjj_member_profile') || '{}'); } catch { return {}; } })();
    const stats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    checkAndUnlockAchievements(profile, stats);
    const local: string[] = (() => { try { return JSON.parse(localStorage.getItem('lbjj_achievements') || '[]'); } catch { return []; } })();
    setEarnedKeys(local);
    if (local.length > 0) {
      const toSync = local.map((key: string) => {
        const def = ALL_ACHIEVEMENTS.find(a => a.key === key);
        return def ? { key, label: def.label, icon: def.icon, earnedAt: new Date().toISOString() } : null;
      }).filter(Boolean) as Array<{ key: string; label: string; icon: string; earnedAt: string }>;
      syncAchievements(toSync).catch(() => {});
    }
    if (member?.email) {
      gasCall('getMemberBadges', { email: (member as any).email }).then((res: any) => {
        if (res?.badges && Array.isArray(res.badges)) {
          const serverKeys = res.badges.map((b: any) => b.key || b.BadgeKey);
          const merged = Array.from(new Set([...local, ...serverKeys]));
          if (merged.length > local.length) {
            setEarnedKeys(merged as string[]);
            localStorage.setItem('lbjj_achievements', JSON.stringify(merged));
            window.dispatchEvent(new CustomEvent('achievements-updated'));
          }
        }
      }).catch(() => {});
    }
  }, [(member as any)?.email]);

  // Member stats
  useEffect(() => {
    const profile = (() => { try { return JSON.parse(localStorage.getItem('lbjj_member_profile') || '{}'); } catch { return {}; } })();
    const gameStats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    setMemberStats({ ...profile, ...gameStats });
  }, []);

  // New badges
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lbjj_new_badges');
      if (raw) { const keys = JSON.parse(raw); if (Array.isArray(keys)) setNewBadgeKeys(keys); }
    } catch {}
  }, []);

  // Secret reveal
  useEffect(() => {
    if (newBadgeKeys.length > 0) {
      const secretNew = ALL_ACHIEVEMENTS.find(a => a.secret && newBadgeKeys.includes(a.key));
      if (secretNew) setSecretReveal(secretNew);
    }
  }, [newBadgeKeys]);

  // Keep claimedXpKeys in sync with localStorage so the UI always reflects the truth.
  // Fires on achievements-updated events (same tab) and on storage events (other tabs).
  useEffect(() => {
    const refresh = () => {
      try {
        const arr = JSON.parse(localStorage.getItem('lbjj_achievement_xp_claimed') || '[]');
        if (Array.isArray(arr)) setClaimedXpKeys(arr);
      } catch {}
    };
    window.addEventListener('achievements-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('achievements-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Scramble dial text
  const scramble = useCallback((el: HTMLElement, text: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let iter = 0;
    const iv = setInterval(() => {
      el.textContent = text.split('').map((c, i) => {
        if (c === ' ') return ' ';
        if (i < iter) return text[i];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      iter += 0.4;
      if (iter >= text.length) { clearInterval(iv); el.textContent = text; }
    }, 20);
  }, []);

  const shiftTier = (dir: number) => {
    let next = tierIdx + dir;
    if (next < 0) next = TIERS.length - 1;
    if (next >= TIERS.length) next = 0;
    setIsShifting(true);
    setTimeout(() => {
      setTierIdx(next);
      setDialLabel(TIERS[next].label);
      setIsShifting(false);
      const el = document.getElementById('ach-dial-title');
      if (el) scramble(el, TIERS[next].label);
    }, 350);
  };

  const getEarnedDate = (key: string): string | null => {
    try { const d = JSON.parse(localStorage.getItem('lbjj_achievement_dates') || '{}'); return d[key] || null; } catch { return null; }
  };

  const handleShare = (a: Achievement) => {
    const msg = `Just unlocked: ${a.label} ${a.icon}`;
    localStorage.setItem('lbjj_chat_prefill', msg);
    navigate('/chat');
  };

  const handleClaimed = (key: string) => {
    // Read fresh from localStorage so we don't drop entries written in handleClaim's
    // idempotency step, and so a duplicate key never gets pushed twice.
    const existing = (() => {
      try { const a = JSON.parse(localStorage.getItem('lbjj_achievement_xp_claimed') || '[]'); return Array.isArray(a) ? a : []; } catch { return []; }
    })();
    if (existing.includes(key)) {
      setClaimedXpKeys(existing);
    } else {
      const nc = [...existing, key];
      setClaimedXpKeys(nc);
      localStorage.setItem('lbjj_achievement_xp_claimed', JSON.stringify(nc));
    }
    window.dispatchEvent(new CustomEvent('achievements-updated'));
  };

  const tierFilter = TIERS[tierIdx].id;

  let filtered = activeCategory === 'all'
    ? ALL_ACHIEVEMENTS
    : ALL_ACHIEVEMENTS.filter(a => a.category === activeCategory);

  if (tierFilter !== 'All') {
    filtered = filtered.filter(a => (a.rarity || 'Common') === tierFilter);
  }

  // Sort: claimable first (earned but XP not yet claimed), then claimed, then locked;
  // within each group sort by rarity desc.
  const tierOrder: Record<string, number> = { Common: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5 };
  const bucket = (key: string) => {
    const earned = earnedKeys.includes(key);
    const claimed = claimedXpKeys.includes(key);
    if (earned && !claimed) return 0; // claimable — highest priority
    if (earned && claimed) return 1;  // already claimed
    return 2;                          // locked
  };
  filtered = [...filtered].sort((a, b) => {
    const aE = bucket(a.key);
    const bE = bucket(b.key);
    if (aE !== bE) return aE - bE;
    return (tierOrder[b.rarity || 'Common'] || 1) - (tierOrder[a.rarity || 'Common'] || 1);
  });

  const earnedCount = earnedKeys.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes ach-spin-rays { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes ach-float-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes ach-pulse-bg { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
        @keyframes ach-pop-in { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes ach-fade-in-up { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes ach-shine { to { background-position: 200% center; } }
        @keyframes ach-pulse-dot { 0%,100% { transform: scale(1); box-shadow: 0 0 4px currentColor; } 50% { transform: scale(1.4); box-shadow: 0 0 12px currentColor; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        #ach-bg-glow { animation: ach-pulse-bg 8s infinite alternate ease-in-out; }
        .ach-grid { transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s; }
        .ach-grid.shifting { transform: translateZ(-80px) translateY(16px) rotateX(-8deg); opacity: 0; }
      `}</style>

      {/* VFX layer */}
      <div id="ach-vfx-layer" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }} />

      <div style={{
        background: 'var(--bg, #030303)', minHeight: '100dvh', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dynamic background glow */}
        <div id="ach-bg-glow" style={{
          position: 'fixed', top: '-20vh', left: '-20vw',
          width: '140vw', height: '140vh',
          background: `radial-gradient(circle at 50% 30%, ${tierColor}, transparent 70%)`,
          opacity: 0.07, pointerEvents: 'none', zIndex: 0,
          transition: 'background 0.8s ease',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 500, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ padding: '40px 20px 0', textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'system-ui,sans-serif', fontSize: 30, fontWeight: 900,
              margin: 0, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.1em',
              background: 'linear-gradient(180deg,#ffffff,#999999)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Artifacts
            </h1>
            <div style={{ fontSize: 9, color: '#555', fontWeight: 700, marginTop: 5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Your Legacy Engraved
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Collection</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: tierColor }}>{earnedCount} / {totalCount}</span>
            </div>
            <div style={{ height: 3, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${totalCount > 0 ? Math.round(earnedCount / totalCount * 100) : 0}%`,
                background: `linear-gradient(90deg, ${tierColor}88, ${tierColor})`,
                borderRadius: 2, transition: 'width 1s ease',
              }} />
            </div>
          </div>

          {/* Back button */}
          <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', color: tierColor, fontWeight: 700, fontSize: 13 }}
            >
              ← Back
            </button>
          </div>

          {/* Rarity Dial */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px' }}>
            <button
              onClick={() => shiftTier(-1)}
              style={{
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#555', cursor: 'pointer', borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div
                id="ach-dial-title"
                style={{
                  fontFamily: 'system-ui,sans-serif', fontSize: 20, fontWeight: 900,
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: tierColor, textShadow: `0 0 20px ${tierColor}`,
                  transition: 'color 0.5s, text-shadow 0.5s',
                }}
              >
                {dialLabel}
              </div>
              <div style={{
                height: 2, margin: '6px auto 0',
                background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)`,
                boxShadow: `0 0 15px ${tierColor}`, opacity: 0.6,
                transition: 'background 0.5s, box-shadow 0.5s',
                maxWidth: 160,
              }} />
            </div>
            <button
              onClick={() => shiftTier(1)}
              style={{
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#555', cursor: 'pointer', borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>

          {/* Category filter tabs */}
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 20px 4px',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
          }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                border: activeCategory === 'all' ? `1px solid ${tierColor}66` : '1px solid #1a1a1a',
                background: activeCategory === 'all' ? `${tierColor}18` : '#0a0a0a',
                color: activeCategory === 'all' ? tierColor : '#444',
              }}
            >All</button>
            {ACHIEVEMENT_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  flexShrink: 0, padding: '6px 12px', borderRadius: 20,
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  border: activeCategory === cat.key ? `1px solid ${cat.color}55` : '1px solid #1a1a1a',
                  background: activeCategory === cat.key ? `${cat.color}18` : '#0a0a0a',
                  color: activeCategory === cat.key ? cat.color : '#444',
                }}
              >{cat.label}</button>
            ))}
          </div>

          {/* Locked paragon tiers — long-term goals */}
          {(() => {
            const xp = memberStats?.xp ?? memberStats?.totalPoints ?? memberStats?.TotalPoints ?? 0;
            const lvl = getActualLevel(xp);
            if (lvl >= 50) return null;
            return (
              <div style={{
                display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-start',
                padding: '14px 20px 4px', flexWrap: 'wrap',
              }}>
                {lvl < 40 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <LockedParagonRing unlockLevel={40} size={44} />
                    <div style={{ fontSize: 10, color: '#6A6A74', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>???</div>
                    <div style={{ fontSize: 10, color: '#8A8A94' }}>Reach Level 40 to unlock</div>
                  </div>
                )}
                {lvl < 50 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <LockedParagonRing unlockLevel={50} size={44} />
                    <div style={{ fontSize: 10, color: '#6A6A74', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>???</div>
                    <div style={{ fontSize: 10, color: '#8A8A94' }}>Reach Level 50 to unlock</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Grid */}
          <div
            className={`ach-grid${isShifting ? ' shifting' : ''}`}
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: 10, padding: '14px 20px 120px',
              perspective: 1000,
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: '#333', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                No artifacts in this tier
              </div>
            ) : filtered.map((a) => {
              const isEarned = earnedKeys.includes(a.key);
              const isClaimable = isEarned && !claimedXpKeys.includes(a.key);
              const isSecret = !!a.secret && !isEarned;
              const justUnlocked = newBadgeKeys.includes(a.key);
              return (
                <HoloCard
                  key={a.key}
                  achievement={a}
                  isEarned={isEarned}
                  isClaimable={isClaimable}
                  isSecret={isSecret}
                  stats={memberStats}
                  justUnlocked={justUnlocked}
                  onClick={() => setInspect(a)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Inspect overlay */}
      {inspect && (
        <InspectOverlay
          achievement={inspect}
          isEarned={earnedKeys.includes(inspect.key)}
          isClaimable={earnedKeys.includes(inspect.key) && !claimedXpKeys.includes(inspect.key)}
          isSecret={!!inspect.secret && !earnedKeys.includes(inspect.key)}
          onClose={() => setInspect(null)}
          onClaimed={handleClaimed}
          earnedDate={getEarnedDate(inspect.key)}
        />
      )}

      {/* Secret reveal */}
      {secretReveal && (
        <SecretRevealOverlay achievement={secretReveal} onComplete={() => setSecretReveal(null)} />
      )}
    </>
  );
}
