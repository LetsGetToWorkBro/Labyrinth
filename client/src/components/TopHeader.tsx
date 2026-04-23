/**
 * TopHeader — XP toolbar + cinematic level-up
 * Ported from levelup_v4_oss.html
 * 5 paragon themes: ember · frost · void · blood · apex
 * Full orchestrator: flash, chroma, vignette, sweep, flip-medallion, cinema overlay
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { OnlineBubble } from '@/components/OnlineBubble';
import { useAuth } from '@/lib/auth-context';
import { getLevelFromXP, getActualLevel } from '@/lib/xp';
import { ParagonRing, getParagonTheme } from '@/components/ParagonRing';
import logoMaze from '../assets/logo-maze.webp';

// ─── Theme tokens (mirrored from levelup_v4_oss.html) ─────────────
type Theme = 'ember' | 'frost' | 'void' | 'blood' | 'apex';

const THEME_TOKENS: Record<Theme, {
  primary: string; secondary: string;
  glow: string; glowS: string;
  barA: string; barB: string; barC: string;
  border: string;
  chipBg: string; chipC: string;
  ornBg: string; ornSh: string;
  orb: boolean; dotBg?: string; dotSh?: string;
  name: string;
}> = {
  ember: {
    primary: '#C8A24C', secondary: '#FFD700',
    glow: 'rgba(200,162,76,.18)', glowS: 'rgba(200,162,76,.6)',
    barA: '#6B4A00', barB: '#C8A24C', barC: '#FFF8DC',
    border: 'rgba(200,162,76,.25)',
    chipBg: 'linear-gradient(135deg,#C8A24C,#FFD700)', chipC: '#000',
    ornBg: 'radial-gradient(circle,#fde047,#ca8a04,#854d0e)',
    ornSh: '0 2px 4px rgba(0,0,0,1),inset 0 1px 1px rgba(255,255,255,.8)',
    orb: false, name: 'EMBER',
  },
  frost: {
    primary: '#0ea5e9', secondary: '#38bdf8',
    glow: 'rgba(14,165,233,.18)', glowS: 'rgba(14,165,233,.65)',
    barA: '#0c3f5e', barB: '#0ea5e9', barC: '#bae6fd',
    border: 'rgba(14,165,233,.35)',
    chipBg: 'linear-gradient(135deg,#0284c7,#38bdf8)', chipC: '#000',
    ornBg: 'linear-gradient(135deg,#fff,#0ea5e9)',
    ornSh: '0 0 12px #0ea5e9',
    orb: true, dotBg: '#fff', dotSh: '0 0 8px #fff,0 0 18px #0ea5e9', name: 'FROST',
  },
  void: {
    primary: '#a855f7', secondary: '#c084fc',
    glow: 'rgba(168,85,247,.18)', glowS: 'rgba(168,85,247,.65)',
    barA: '#3b0764', barB: '#a855f7', barC: '#e9d5ff',
    border: 'rgba(168,85,247,.4)',
    chipBg: 'linear-gradient(135deg,#6d28d9,#c084fc)', chipC: '#fff',
    ornBg: 'radial-gradient(circle at 30% 30%,#f3e8ff,#a855f7,#581c87)',
    ornSh: '0 0 20px #a855f7',
    orb: true, dotBg: '#d8b4fe', dotSh: '0 0 14px #a855f7', name: 'VOID',
  },
  blood: {
    primary: '#ef4444', secondary: '#f87171',
    glow: 'rgba(239,68,68,.18)', glowS: 'rgba(239,68,68,.7)',
    barA: '#450a0a', barB: '#ef4444', barC: '#fecaca',
    border: 'rgba(239,68,68,.45)',
    chipBg: 'linear-gradient(135deg,#7f1d1d,#f87171)', chipC: '#fff',
    ornBg: 'radial-gradient(circle at 30% 30%,#fca5a5,#dc2626,#7f1d1d)',
    ornSh: '0 0 18px #ef4444',
    orb: true, dotBg: '#fca5a5', dotSh: '0 0 14px #ef4444', name: 'BLOOD',
  },
  apex: {
    primary: '#e2e8f0', secondary: '#ffffff',
    glow: 'rgba(255,255,255,.2)', glowS: 'rgba(255,255,255,.8)',
    barA: '#334155', barB: '#e2e8f0', barC: '#ffffff',
    border: 'rgba(255,255,255,.6)',
    chipBg: 'linear-gradient(135deg,#94a3b8,#fff)', chipC: '#000',
    ornBg: 'radial-gradient(circle at 30% 30%,#fff,#fde047,#ca8a04)',
    ornSh: '0 0 28px #fff,inset 0 0 6px rgba(255,255,255,.9)',
    orb: true, dotBg: '#fff', dotSh: '0 0 20px #fff,0 0 40px #fde047', name: 'APEX',
  },
};

function levelToTheme(level: number): Theme {
  if (level >= 30) return 'apex';
  if (level >= 20) return 'blood';
  if (level >= 12) return 'void';
  if (level >= 6)  return 'frost';
  return 'ember';
}

function readLiveXP(pts?: number): number {
  try {
    const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
    return Math.max(s.xp || 0, s.totalXP || 0, pts || 0);
  } catch { return pts || 0; }
}

// ─── TopHeader ────────────────────────────────────────────────────
export function TopHeader({ onMenuOpen, onXpOpen }: { onMenuOpen: () => void; onXpOpen: () => void }) {
  const { member, isAuthenticated } = useAuth();

  const [liveXP, setLiveXP] = useState(() => readLiveXP((member as any)?.totalPoints));
  const [hidden, setHidden] = useState(false);

  // Bar animation state
  const [barPct, setBarPct] = useState(0);
  const [barOD, setBarOD] = useState(false);       // overdrive / at-100%
  const [sweepPlay, setSweepPlay] = useState(false);
  const [hdrGlow, setHdrGlow] = useState(false);

  // Medallion flip
  const [flipDeg, setFlipDeg] = useState(0);
  const [frontLv, setFrontLv] = useState(1);
  const [backLv,  setBackLv]  = useState(1);

  // Cinema
  const [cinema, setCinema] = useState(false);
  const [cinTitle, setCinTitle] = useState(false);
  const [cinOrb,   setCinOrb]   = useState(false);
  const [cinDiv,   setCinDiv]   = useState(false);
  const [cinRank,  setCinRank]  = useState(false);
  const [cinBtn,   setCinBtn]   = useState(false);
  const [cinLevel, setCinLevel] = useState(1);
  const [cinRankName, setCinRankName] = useState('');

  // Theme
  const [theme, setTheme] = useState<Theme>('ember');

  // FX layers (imperative DOM for performance)
  const flashRef    = useRef<HTMLDivElement>(null);
  const vigRef      = useRef<HTMLDivElement>(null);
  const streaksRef  = useRef<HTMLDivElement>(null);
  const ch1Ref      = useRef<HTMLDivElement>(null);
  const ch2Ref      = useRef<HTMLDivElement>(null);
  const ripRef      = useRef<HTMLDivElement>(null);
  const medShRef    = useRef<HTMLDivElement>(null);
  const medSh2Ref   = useRef<HTMLDivElement>(null);
  const parShRef    = useRef<HTMLDivElement>(null);
  const parSh2Ref   = useRef<HTMLDivElement>(null);

  const prevLevelRef = useRef(1);
  const lockedRef = useRef(false);
  const t = useCallback((ms: number) => new Promise<void>(r => setTimeout(r, ms)), []);

  const tok = THEME_TOKENS[theme];

  // Sync XP
  useEffect(() => {
    const sync = () => setLiveXP(readLiveXP((member as any)?.totalPoints));
    sync();
    window.addEventListener('xp-updated', sync);
    window.addEventListener('checkin-complete', sync);
    return () => { window.removeEventListener('xp-updated', sync); window.removeEventListener('checkin-complete', sync); };
  }, [member]);

  // Hide on chat
  useEffect(() => {
    const h = () => { const hash = window.location.hash; setHidden(hash.includes('/chat') || hash.includes('/admin')); };
    h();
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  // Set initial state
  useEffect(() => {
    const xp = readLiveXP((member as any)?.totalPoints);
    const lv = getActualLevel(xp);
    prevLevelRef.current = lv;
    setTheme(levelToTheme(lv));
    setFrontLv(lv);
    setBackLv(lv);
    const { progress } = getLevelFromXP(xp);
    setBarPct(Math.max(progress * 100, 2));
  }, []);

  // Watch for level up
  useEffect(() => {
    const newLv = getActualLevel(liveXP);
    const oldLv = prevLevelRef.current;
    const { progress, title } = getLevelFromXP(liveXP);

    if (newLv > oldLv && !lockedRef.current) {
      lockedRef.current = true;
      orchestrate(oldLv, newLv, title).finally(() => { lockedRef.current = false; });
    } else if (newLv === oldLv) {
      setBarPct(Math.max(progress * 100, 2));
    }
    prevLevelRef.current = newLv;
  }, [liveXP]);

  // ── Orchestrator ─────────────────────────────────────────────────
  const scrambleTitle = useCallback(async (newTitle: string) => {
    // Not needed in React — just set; the title is already scrambled-text in cinema
  }, []);

  const orchestrate = useCallback(async (oldLv: number, newLv: number, newTitle: string) => {
    const { progress } = getLevelFromXP(liveXP);
    const newTheme = levelToTheme(newLv);

    // P1 — Fill bar to 100% OD
    setBarPct(100);
    setBarOD(true);
    setHdrGlow(true);

    await t(380);

    // P2 — Flash + vignette
    if (flashRef.current) {
      flashRef.current.style.transition = 'none';
      flashRef.current.style.opacity = '.72';
      requestAnimationFrame(() => {
        if (flashRef.current) {
          flashRef.current.style.transition = 'opacity .8s ease-out';
          flashRef.current.style.opacity = '0';
        }
      });
    }
    if (vigRef.current)     { vigRef.current.style.opacity = '1'; }
    if (streaksRef.current) { streaksRef.current.style.opacity = '.45'; }
    setTimeout(() => {
      if (vigRef.current)     vigRef.current.style.opacity = '0';
      if (streaksRef.current) streaksRef.current.style.opacity = '0';
    }, 1500);

    // P3 — Chromatic aberration
    [ch1Ref, ch2Ref].forEach((ref, i) => {
      if (!ref.current) return;
      ref.current.style.animation = 'none';
      void ref.current.offsetWidth;
      ref.current.style.top = (30 + Math.random() * 40) + '%';
      ref.current.style.opacity = '1';
      ref.current.style.animation = `th-chroma ${.32 + i * .07}s ease forwards`;
      setTimeout(() => { if (ref.current) ref.current.style.opacity = '0'; }, 450);
    });

    // P4 — Ripple
    if (ripRef.current) {
      ripRef.current.style.animation = 'none';
      void ripRef.current.offsetWidth;
      ripRef.current.style.animation = 'th-ripple 1.1s cubic-bezier(.16,1,.3,1) forwards';
    }

    // P5 — Sweeps + shockwaves
    setSweepPlay(false);
    await t(10);
    setSweepPlay(true);
    const fireShock = (ref: React.RefObject<HTMLDivElement>) => {
      if (!ref.current) return;
      ref.current.classList.remove('th-shock-play');
      void ref.current.offsetWidth;
      ref.current.classList.add('th-shock-play');
    };
    fireShock(medShRef);
    fireShock(medSh2Ref);
    fireShock(parShRef);
    fireShock(parSh2Ref);

    await t(150);

    // P6 — Medallion flip
    const newDeg = flipDeg + 180;
    setFlipDeg(newDeg);
    if (newDeg % 360 !== 0) setBackLv(newLv); else setFrontLv(newLv);

    await t(220);

    // P7 — Theme shift
    setTheme(newTheme);

    // P8 — Cinema
    setCinLevel(newLv);
    setCinRankName(newTitle);
    setCinTitle(false); setCinOrb(false); setCinDiv(false); setCinRank(false); setCinBtn(false);
    await t(10);
    setCinema(true);
    await t(40);
    setCinTitle(true);
    await t(280);
    setCinOrb(true);
    await t(500);
    setCinDiv(true);
    await t(220);
    setCinRank(true);
    await t(380);
    setCinBtn(true);

    // P9 — Bar drains to new level position
    await t(450);
    setBarOD(false);
    setHdrGlow(false);
    setBarPct(0);
    await t(55);
    setBarPct(Math.max(progress * 100, 2));
  }, [liveXP, flipDeg, t]);

  const dismissCinema = useCallback(() => {
    setCinema(false);
    setCinTitle(false); setCinOrb(false); setCinDiv(false); setCinRank(false); setCinBtn(false);
  }, []);

  if (!isAuthenticated || !member || hidden) return null;

  const xp = liveXP;
  const level = getActualLevel(xp);
  const { title, xpForLevel, xpForNext } = getLevelFromXP(xp);
  const belt = ((member as any)?.belt || 'white').toLowerCase();
  const xpInLevel = xp - xpForLevel;
  const xpNeeded = Math.max(1, xpForNext - xpForLevel);
  const PORTRAIT = 44;
  const avatarSrc = (() => { try { return localStorage.getItem('lbjj_profile_picture') || ''; } catch { return ''; } })();
  const initials = member.name ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  const beltColors: Record<string, { bg: string; color: string; border: string }> = {
    white:  { bg: 'rgba(245,245,244,.12)', color: '#f5f5f4', border: '1px solid rgba(245,245,244,.25)' },
    blue:   { bg: 'rgba(59,130,246,.15)',  color: '#60a5fa', border: '1px solid rgba(59,130,246,.3)' },
    purple: { bg: 'rgba(168,85,247,.15)',  color: '#c084fc', border: '1px solid rgba(168,85,247,.3)' },
    brown:  { bg: 'rgba(146,64,14,.2)',    color: '#d97706', border: '1px solid rgba(146,64,14,.4)' },
    black:  { bg: 'rgba(255,255,255,.08)', color: '#fff',    border: '1px solid rgba(255,255,255,.2)' },
    grey:   { bg: 'rgba(156,163,175,.12)', color: '#9ca3af', border: '1px solid rgba(156,163,175,.25)' },
    yellow: { bg: 'rgba(234,179,8,.15)',   color: '#fde047', border: '1px solid rgba(234,179,8,.3)' },
    orange: { bg: 'rgba(249,115,22,.15)',  color: '#fb923c', border: '1px solid rgba(249,115,22,.3)' },
    green:  { bg: 'rgba(34,197,94,.15)',   color: '#4ade80', border: '1px solid rgba(34,197,94,.3)' },
  };
  const bs = beltColors[belt] || beltColors.white;

  const barGrad = `linear-gradient(90deg,${tok.barA},${tok.barB} 55%,${tok.barC} 85%,${tok.barB})`;
  const barGradOD = `linear-gradient(90deg,${tok.barA},${tok.barB} 40%,#fff 72%,${tok.barB})`;

  const cinTok = THEME_TOKENS[levelToTheme(cinLevel)];

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes th-shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes th-shimmer-f { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes th-chroma    { 0%{transform:translateX(-100%) skewX(-6deg)} 100%{transform:translateX(200%) skewX(-6deg)} }
        @keyframes th-ripple    { 0%{transform:translate(-50%,-50%) scale(0);opacity:.7} 100%{transform:translate(-50%,-50%) scale(1);opacity:0} }
        @keyframes th-bar-pulse { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.8) saturate(1.6)} }
        @keyframes th-head-pulse{ 0%,100%{box-shadow:0 0 6px #fff,0 0 14px ${tok.primary}} 50%{box-shadow:0 0 14px #fff,0 0 30px ${tok.primary}} }
        @keyframes th-sweep     { 0%{left:-80%;opacity:1} 100%{left:160%;opacity:0} }
        @keyframes th-shock     { 0%{transform:scale(1);opacity:1} 100%{transform:scale(4.5);opacity:0} }
        @keyframes th-shock2    { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(3.2);opacity:0} }
        @keyframes th-spin      { to{transform:rotate(360deg)} }
        @keyframes th-spin-rev  { to{transform:rotate(-360deg)} }
        @keyframes th-float-j   { 0%{transform:translateX(-50%) translateY(0)} 100%{transform:translateX(-50%) translateY(-4px)} }
        @keyframes th-breathe   { 0%{opacity:.4;transform:scale(.92)} 100%{opacity:1;transform:scale(1.08)} }
        @keyframes th-title-slam{
          0%  {opacity:0;transform:translate(-50%,-50%) scale(.55);filter:blur(28px);letter-spacing:0}
          12% {opacity:1;transform:translate(-50%,-50%) scale(1.05);filter:blur(0);letter-spacing:10px}
          72% {opacity:1;transform:translate(-50%,-50%) scale(1.07);letter-spacing:14px}
          100%{opacity:0;transform:translate(-50%,-60%) scale(1.1);filter:blur(10px);letter-spacing:20px}
        }
        @keyframes th-orb-pop   { 0%{transform:scale(0) rotate(-160deg);opacity:0} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes th-orb-breath{ 0%,100%{box-shadow:0 0 40px ${tok.glowS},0 0 80px ${tok.glow}} 50%{box-shadow:0 0 70px ${tok.glowS},0 0 130px ${tok.glow}} }
        @keyframes th-tier-in   { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes th-btn-rise  { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes th-divider-in{ 0%{width:0;opacity:0} 100%{width:48px;opacity:1} }
        @keyframes th-btn-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes th-btn-glow  { 0%,100%{box-shadow:0 0 0 0 ${tok.glow},0 6px 28px rgba(0,0,0,.7)} 50%{box-shadow:0 0 0 5px transparent,0 8px 36px rgba(0,0,0,.8)} }
        @keyframes th-sub-rise  { 0%{opacity:0;transform:translate(-50%,-50%) translateY(10px)} 100%{opacity:1;transform:translate(-50%,-50%) translateY(0)} }
        .th-shock-play.med-sh  { animation: th-shock  .9s cubic-bezier(.16,1,.3,1) forwards !important; }
        .th-shock-play.med-sh2 { animation: th-shock2 1.15s cubic-bezier(.16,1,.3,1) .12s forwards !important; }
        .th-shock-play.par-sh  { animation: th-shock  .95s cubic-bezier(.16,1,.3,1) forwards !important; }
        .th-shock-play.par-sh2 { animation: th-shock2 1.2s cubic-bezier(.16,1,.3,1) .15s forwards !important; }
      `}</style>

      {/* ── FX layers ── */}
      <div ref={flashRef}   style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:9999,background:'#fff',mixBlendMode:'overlay',opacity:0 }} />
      <div ref={vigRef}     style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:8998,background:'radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.97) 100%)',opacity:0,transition:'opacity .5s ease' }} />
      <div ref={streaksRef} style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:8997,background:'repeating-conic-gradient(from 0deg at 50% 50%,transparent 0deg,transparent 11.4deg,rgba(255,255,255,.018) 11.4deg,rgba(255,255,255,.018) 12deg)',opacity:0,transition:'opacity .35s ease' }} />
      <div ref={ch1Ref} style={{ position:'fixed',left:0,right:0,height:2,pointerEvents:'none',zIndex:9997,mixBlendMode:'screen',opacity:0,background:'rgba(0,255,255,.55)' }} />
      <div ref={ch2Ref} style={{ position:'fixed',left:0,right:0,height:2,pointerEvents:'none',zIndex:9997,mixBlendMode:'screen',opacity:0,background:'rgba(255,0,128,.55)' }} />
      <div ref={ripRef} style={{ position:'fixed',left:'50%',top:'42%',width:280,height:280,marginLeft:-140,marginTop:-140,borderRadius:'50%',pointerEvents:'none',zIndex:8999,opacity:0,border:`1.5px solid ${tok.primary}`,transition:'border-color 1s ease' }} />

      {/* ── Cinema overlay ── */}
      {cinema && createPortal(
        <div
          onClick={dismissCinema}
          style={{ position:'fixed',inset:0,zIndex:9000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.82)',backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)' }}
        >
          {/* LEVEL UP title slam */}
          <div style={{
            position:'absolute',top:'18%',left:'50%',
            fontSize:'clamp(38px,8.5vw,80px)',fontWeight:900,textTransform:'uppercase',
            color:'#fff',letterSpacing:4,pointerEvents:'none',whiteSpace:'nowrap',
            textShadow:`0 0 80px ${cinTok.primary},0 0 160px ${cinTok.glowS}`,
            opacity: cinTitle ? 1 : 0,
            animation: cinTitle ? 'th-title-slam 2.8s cubic-bezier(.16,1,.3,1) forwards' : 'none',
          }}>LEVEL UP</div>

          {/* Orb stack */}
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:0,marginTop:24 }} onClick={e => e.stopPropagation()}>

            {/* Orb */}
            <div style={{
              position:'relative',
              width:'clamp(120px,24vw,200px)',height:'clamp(120px,24vw,200px)',
              borderRadius:'50%',
              background: cinTok.chipC === '#000'
                ? 'radial-gradient(circle at 35% 30%,#2e2b27,#0d0c0b)'
                : 'radial-gradient(circle at 35% 30%,#1a0a2e,#080413)',
              border:`2px solid ${cinTok.primary}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              flexShrink:0,
              boxShadow:`0 0 40px ${cinTok.glowS},0 0 80px ${cinTok.glow}`,
              opacity: cinOrb ? 1 : 0,
              animation: cinOrb ? 'th-orb-pop .65s cubic-bezier(.34,1.56,.64,1) .1s forwards, th-orb-breath 2.5s ease 1s infinite' : 'none',
              transition:'border-color 1s ease,box-shadow 1s ease',
            }}>
              {/* Counter ring */}
              <div style={{ position:'absolute',inset:-20,borderRadius:'50%',border:'1px dashed rgba(255,255,255,.12)',animation:'th-spin-rev 10s linear infinite',zIndex:1,pointerEvents:'none' }} />
              {/* Spinning ring */}
              <div style={{
                position:'absolute',inset:-10,borderRadius:'50%',
                background:`conic-gradient(from 0deg,${cinTok.barA},${cinTok.primary},${cinTok.barA},${cinTok.secondary},${cinTok.barA})`,
                animation:'th-spin 6s linear infinite',
                WebkitMask:'linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)',
                WebkitMaskComposite:'destination-out',
                maskComposite:'exclude',
                padding:6,zIndex:2,
                transition:'background 1s ease',
              }} />
              {/* Glow ring */}
              <div style={{ position:'absolute',inset:-10,borderRadius:'50%',border:`1px solid ${cinTok.primary}`,boxShadow:`0 0 20px ${cinTok.glowS}`,zIndex:3,pointerEvents:'none',transition:'border-color 1s ease,box-shadow 1s ease' }} />
              {/* Top ornament */}
              <div style={{ position:'absolute',zIndex:5,left:'50%',transform:'translateX(-50%)',top:-16,width:13,height:13,borderRadius:'50%',background:cinTok.ornBg,boxShadow:cinTok.ornSh,border:'1px solid #333',animation:'th-float-j 2.5s ease-in-out infinite alternate' }} />
              {/* Bottom ornament */}
              <div style={{ position:'absolute',zIndex:5,left:'50%',transform:'translateX(-50%)',bottom:-16,width:11,height:11,borderRadius:'50%',background:cinTok.ornBg,boxShadow:cinTok.ornSh,border:'1px solid #333' }} />
              {/* Level number */}
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:4 }}>
                <div style={{ fontSize:'clamp(44px,10vw,80px)',fontWeight:900,color:cinTok.primary,textShadow:`0 0 40px ${cinTok.glowS}`,lineHeight:1 }}>{cinLevel}</div>
                <div style={{ fontSize:9,fontWeight:800,color:'rgba(255,255,255,.3)',letterSpacing:3,textTransform:'uppercase',marginTop:-2 }}>Level</div>
              </div>
            </div>

            {/* Divider */}
            <div style={{
              height:1,background:cinTok.border,margin:'20px 0 16px',opacity: cinDiv ? 1 : 0,
              animation: cinDiv ? 'th-divider-in .5s ease forwards' : 'none',
              width: cinDiv ? 48 : 0,
              transition:'background 1s ease',
            }} />

            {/* Rank block */}
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:6,opacity: cinRank?1:0, animation: cinRank ? 'th-tier-in .5s ease forwards' : 'none' }}>
              <div style={{ fontSize:9,fontWeight:800,color:cinTok.primary,letterSpacing:4,textTransform:'uppercase',transition:'color 1s ease' }}>New Rank Unlocked</div>
              <div style={{ fontSize:'clamp(16px,3.5vw,26px)',fontWeight:900,color:'#fff',letterSpacing:'.04em',textAlign:'center',lineHeight:1.1 }}>{cinRankName}</div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={e => { e.stopPropagation(); dismissCinema(); }}
              style={{
                position:'relative',overflow:'hidden',display:'block',
                background:'linear-gradient(160deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,.02) 60%,rgba(255,255,255,.07) 100%)',
                border:`1px solid ${cinTok.border}`,
                width:220,height:52,padding:0,borderRadius:14,
                cursor:'pointer',fontFamily:'system-ui,sans-serif',
                marginTop:28,
                backdropFilter:'blur(10px)',
                opacity: cinBtn ? 1 : 0,
                animation: cinBtn ? 'th-btn-rise .5s ease forwards, th-btn-glow 2.5s ease 1.2s infinite' : 'none',
                transition:'border-color 1s ease,box-shadow 1s ease',
              }}
            >
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:11,width:'100%',height:'100%',position:'relative',zIndex:1 }}>
                <div style={{
                  width:32,height:32,borderRadius:9,
                  background:cinTok.primary,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 2px 10px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.28)',
                  flexShrink:0,
                }}>
                  <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
                    <path d="M13 3L3 3L3 13L13 13L13 5" stroke={cinTok.chipC === '#fff' ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.88)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 5L11 5L11 11L5 11L5 7" stroke={cinTok.chipC === '#fff' ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.88)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="7" y="7" width="2" height="2" rx=".5" fill={cinTok.chipC === '#fff' ? 'rgba(255,255,255,.88)' : 'rgba(0,0,0,.88)'}/>
                  </svg>
                </div>
                <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-start',gap:2 }}>
                  <span style={{ fontSize:13,fontWeight:900,letterSpacing:'.2em',textTransform:'uppercase',color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.5)',lineHeight:1 }}>OSS</span>
                  <span style={{ fontSize:8,fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:cinTok.primary,opacity:.65,lineHeight:1,transition:'color 1s ease' }}>Continue Training</span>
                </div>
              </div>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Header bar ── */}
      <div style={{
        position:'sticky',top:0,zIndex:100,
        background:'rgba(9,9,11,.96)',
        backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',
        borderBottom: hdrGlow ? `1px solid ${tok.primary}` : '1px solid rgba(255,255,255,.05)',
        boxShadow: hdrGlow ? `0 2px 28px ${tok.glow}` : 'none',
        paddingTop:'max(8px,env(safe-area-inset-top,8px))',
        paddingBottom:8,paddingLeft:10,paddingRight:10,
        transition:'border-color .9s ease,box-shadow .9s ease',
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>

          {/* Logo / menu */}
          <button onClick={onMenuOpen} aria-label="Open menu" style={{ background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center' }}>
            <img src={logoMaze} alt="Labyrinth BJJ" style={{ width:26,height:26,objectFit:'contain',opacity:.9,mixBlendMode:'screen' }} />
          </button>

          {/* Center: LV chip + title + belt + XP bar */}
          <div style={{ flex:1,minWidth:0 }}>
            {/* Row 1 */}
            <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:5 }}>
              <span style={{
                fontSize:10,fontWeight:900,color:tok.chipC,
                background:tok.chipBg,
                borderRadius:4,padding:'1px 5px',lineHeight:1.5,flexShrink:0,
                transition:'background .9s ease,color .9s ease',
              }}>LV{level}</span>
              <span style={{ fontSize:11,fontWeight:600,color:'#888',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,transition:'color .9s ease' }}>
                {title}
              </span>
              {/* Belt chip */}
              <div style={{ fontSize:9,fontWeight:800,padding:'2px 6px',borderRadius:4,textTransform:'uppercase',letterSpacing:'.08em',background:bs.bg,color:bs.color,border:bs.border,flexShrink:0,...(belt==='black'?{borderLeft:'3px solid #ef4444'}:{}) }}>
                {belt}
              </div>
            </div>

            {/* Row 2: bar + nums + online */}
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <div style={{
                flex:1,height:10,borderRadius:5,background:'#000',
                overflow:'hidden',border:'1px solid #1C1C1C',
                boxShadow:'inset 0 2px 4px rgba(0,0,0,.8)',
                backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 19.5%,rgba(255,255,255,.04) 19.5%,rgba(255,255,255,.04) 20.5%)',
                position:'relative',
              }}>
                {/* Fill */}
                <div style={{
                  position:'absolute',left:0,top:0,bottom:0,
                  width:`${barPct}%`,
                  background: barOD ? barGradOD : barGrad,
                  backgroundSize:'300% 100%',
                  animation: barOD ? 'th-shimmer .35s linear infinite, th-bar-pulse .35s ease infinite' : 'th-shimmer 2s linear infinite',
                  boxShadow: barOD ? `0 0 28px ${tok.glowS},0 0 6px #fff` : `0 0 8px ${tok.glow},inset 0 1px 0 rgba(255,255,255,.15)`,
                  transition:`width 1s cubic-bezier(.4,0,.2,1),background .9s ease,box-shadow .9s ease`,
                  borderRadius:5,
                }}>
                  {/* Glowing head */}
                  {!barOD && <div style={{ position:'absolute',right:0,top:0,bottom:0,width:2,background:'#fff',boxShadow:`-2px 0 4px ${tok.glowS}`,borderRadius:2 }} />}
                </div>
                {/* Sweep */}
                {sweepPlay && (
                  <div style={{ position:'absolute',top:0,bottom:0,width:'70%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.92),transparent)',left:'-80%',opacity:0,pointerEvents:'none',borderRadius:5,animation:'th-sweep .55s ease forwards' }} />
                )}
                {/* Segment marks */}
                {[25,50,75].map(p => <div key={p} style={{ position:'absolute',top:0,bottom:0,left:`${p}%`,width:1,background:'rgba(255,255,255,.04)' }} />)}
              </div>
              <span style={{ fontSize:8,color:'#3A3A3A',whiteSpace:'nowrap',flexShrink:0 }}>
                {xpInLevel.toLocaleString()}/{xpNeeded.toLocaleString()}
              </span>
              <OnlineBubble compact />
            </div>
          </div>

          {/* ParagonRing portrait */}
          <button onClick={onXpOpen} aria-label="View XP and level" style={{ background:'none',border:'none',padding:0,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',overflow:'visible',position:'relative' }}>
            <ParagonRing level={level} size={PORTRAIT} showOrbit={level >= 6}>
              {avatarSrc
                ? <img src={avatarSrc} style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%',display:'block' }} alt="Profile" />
                : <div style={{ width:'100%',height:'100%',borderRadius:'50%',background:'linear-gradient(135deg,rgba(200,162,76,.2),rgba(200,162,76,.05))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(PORTRAIT*.3),fontWeight:800,color:'#C8A24C' }}>{initials}</div>
              }
            </ParagonRing>
            {/* Shockwave rings on portrait */}
            <div ref={parShRef}  className="par-sh"  style={{ position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${tok.primary}`,opacity:0,pointerEvents:'none',zIndex:6,transition:'border-color 1s ease' }} />
            <div ref={parSh2Ref} className="par-sh2" style={{ position:'absolute',inset:-5,borderRadius:'50%',border:`1px solid ${tok.primary}`,opacity:0,pointerEvents:'none',zIndex:6 }} />
          </button>
        </div>
      </div>
    </>
  );
}
