/**
 * XPWidget — Premium level/XP display card, pixel-perfect React port.
 *
 * Props:
 *   xp          — current total XP (memberXP from HomePage)
 *   memberName  — optional display name
 *   onOpenInfo  — opens the rank/XP info panel (XPInfoPanel lives in same file)
 *
 * Also exports:
 *   XPInfoPanel — slide-up panel with XP system info
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getLevelFromXP, getActualLevel, XP_LEVELS, getRingTier } from '@/lib/xp';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface XPWidgetProps {
  xp: number;
  memberName?: string;
  onOpenInfo?: () => void;
}

type ThemeKey = 'ember' | 'frost' | 'void' | 'blood' | 'apex';

interface ThemeConfig {
  primary: string;
  secondary: string;
  glow: string;
  cardBorder: string;
  // For gradient fill: dark→mid→light
  barStart: string;
  barMid: string;
  barEnd: string;
}

// ─── Theme definitions ────────────────────────────────────────────────────────

const THEMES: Record<ThemeKey, ThemeConfig> = {
  ember: {
    primary:    '#e8af34',
    secondary:  '#fd7b2f',
    glow:       'rgba(232,175,52,0.15)',
    cardBorder: 'rgba(232,175,52,0.15)',
    barStart:   '#7c4b00',
    barMid:     '#e8af34',
    barEnd:     '#fff3c4',
  },
  frost: {
    primary:    '#0ea5e9',
    secondary:  '#38bdf8',
    glow:       'rgba(14,165,233,0.15)',
    cardBorder: 'rgba(14,165,233,0.3)',
    barStart:   '#0c3f5e',
    barMid:     '#0ea5e9',
    barEnd:     '#bae6fd',
  },
  void: {
    primary:    '#a855f7',
    secondary:  '#c084fc',
    glow:       'rgba(168,85,247,0.15)',
    cardBorder: 'rgba(168,85,247,0.4)',
    barStart:   '#3b0764',
    barMid:     '#a855f7',
    barEnd:     '#e9d5ff',
  },
  blood: {
    primary:    '#ef4444',
    secondary:  '#f87171',
    glow:       'rgba(239,68,68,0.2)',
    cardBorder: 'rgba(239,68,68,0.45)',
    barStart:   '#450a0a',
    barMid:     '#ef4444',
    barEnd:     '#fecaca',
  },
  apex: {
    primary:    '#e2e8f0',
    secondary:  '#f8fafc',
    glow:       'rgba(255,255,255,0.25)',
    cardBorder: 'rgba(255,255,255,0.7)',
    barStart:   '#334155',
    barMid:     '#e2e8f0',
    barEnd:     '#ffffff',
  },
};

function getTheme(level: number): ThemeKey {
  if (level >= 30) return 'apex';
  if (level >= 20) return 'blood';
  if (level >= 12) return 'void';
  if (level >= 6)  return 'frost';
  return 'ember';
}

// ─── Crest SVGs per theme ─────────────────────────────────────────────────────

function CrestSvg({ themeKey, color }: { themeKey: ThemeKey; color: string }) {
  const paths: Record<ThemeKey, React.ReactNode> = {
    ember: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
      </>
    ),
    frost: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </>
    ),
    void: (
      <>
        <path d="M2 12c0 0 4-8 10-8s10 8 10 8-4 8-10 8-10-8-10-8Z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ),
    blood: (
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    ),
    apex: (
      <>
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
      </>
    ),
  };

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        position: 'absolute',
        top: -40,
        right: -40,
        opacity: 0.12,
        transform: 'rotate(15deg)',
        pointerEvents: 'none',
        transition: 'stroke 1s ease',
      }}
    >
      {paths[themeKey]}
    </svg>
  );
}

// ─── Scramble text hook ───────────────────────────────────────────────────────

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%';

function useScramble(target: string, active: boolean): string {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iterRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplay(target);
      return;
    }
    iterRef.current = 0;
    const totalFrames = 20;
    frameRef.current = setInterval(() => {
      iterRef.current++;
      const progress = iterRef.current / totalFrames;
      const resolvedChars = Math.floor(progress * target.length);
      const scrambled = target
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < resolvedChars) return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join('');
      setDisplay(scrambled);
      if (iterRef.current >= totalFrames) {
        setDisplay(target);
        if (frameRef.current) clearInterval(frameRef.current);
      }
    }, 60);
    return () => { if (frameRef.current) clearInterval(frameRef.current); };
  }, [target, active]);

  return display;
}

// ─── XP Bar segmented ────────────────────────────────────────────────────────

function XPBarSegmented({
  progress,
  themeConfig,
  animating,
}: {
  progress: number;
  themeConfig: ThemeConfig;
  animating: boolean;
}) {
  const [renderedPct, setRenderedPct] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setRenderedPct(Math.min(1, Math.max(0, progress))), 60);
    return () => clearTimeout(t);
  }, [progress]);

  const fillPct = renderedPct * 100;
  const SEGMENTS = 4;

  return (
    <div style={{ position: 'relative', height: 8, borderRadius: 6, background: '#111', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)' }}>
      {/* Hatched ghost track */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6,
        background: `repeating-linear-gradient(
          -45deg,
          rgba(255,255,255,0.03) 0px,
          rgba(255,255,255,0.03) 3px,
          transparent 3px,
          transparent 9px
        )`,
        pointerEvents: 'none',
      }} />

      {/* Fill */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.max(fillPct, 0)}%`,
        background: `linear-gradient(90deg, ${themeConfig.barStart} 0%, ${themeConfig.barMid} 55%, ${themeConfig.barEnd} 100%)`,
        borderRadius: 6,
        transition: animating ? 'width 0.6s cubic-bezier(0.16,1,0.3,1)' : 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: `0 0 12px ${themeConfig.glow}`,
      }}>
        {/* Glowing head */}
        {fillPct > 1 && (
          <div style={{
            position: 'absolute', right: -1, top: '50%',
            width: 8, height: 8, borderRadius: '50%',
            background: '#fff',
            transform: 'translateY(-50%)',
            boxShadow: `0 0 8px #fff, 0 0 20px ${themeConfig.primary}`,
            animation: 'xpw-head-pulse 2s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Segment dividers */}
      {Array.from({ length: SEGMENTS - 1 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${((i + 1) / SEGMENTS) * 100}%`,
          width: 1,
          background: 'rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      ))}
    </div>
  );
}

// ─── Medallion ────────────────────────────────────────────────────────────────

interface MedallionProps {
  level: number;
  themeConfig: ThemeConfig;
  flipDeg: number;
  shockwaveActive: boolean;
}

function Medallion({ level, themeConfig, flipDeg, shockwaveActive }: MedallionProps) {
  return (
    <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
      {/* Breathing glow */}
      <div style={{
        position: 'absolute',
        inset: -8,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${themeConfig.glow} 0%, transparent 70%)`,
        animation: 'xpw-breathe 4s ease-in-out infinite alternate',
        pointerEvents: 'none',
        transition: 'background 1s ease',
      }} />

      {/* Shockwave ring */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        border: `2px solid ${themeConfig.primary}`,
        opacity: shockwaveActive ? 0 : 0,
        transform: shockwaveActive ? 'scale(3.5)' : 'scale(1)',
        transition: shockwaveActive
          ? 'transform 0.9s cubic-bezier(0.16,1,0.3,1), opacity 0.9s ease'
          : 'none',
        pointerEvents: 'none',
        zIndex: 10,
      }} />

      {/* Black base circle */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: '#000',
        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8)',
      }} />

      {/* 3D flip container */}
      <div style={{
        position: 'absolute', inset: 0,
        perspective: 400,
      }}>
        <div style={{
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${flipDeg}deg)`,
          transition: 'transform 1.2s cubic-bezier(0.175,0.885,0.32,1.4)',
        }}>
          {/* FRONT FACE */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}>
            <MedallionFace level={level} themeConfig={themeConfig} />
          </div>

          {/* BACK FACE */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}>
            <MedallionFace level={level} themeConfig={themeConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MedallionFace({ level, themeConfig }: { level: number; themeConfig: ThemeConfig }) {
  return (
    <div style={{
      width: '100%', height: '100%', borderRadius: '50%',
      background: 'linear-gradient(135deg, #2a2622 0%, #141210 100%)',
      border: `2px solid transparent`,
      backgroundClip: 'padding-box',
      boxShadow: `inset 0 2px 8px rgba(255,255,255,0.06), inset 0 -2px 8px rgba(0,0,0,0.6), 0 0 0 2px ${themeConfig.primary}33`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 1,
      overflow: 'hidden',
      transition: 'box-shadow 1s ease',
    }}>
      {/* Inner rim gradient ring */}
      <div style={{
        position: 'absolute', inset: 2, borderRadius: '50%',
        background: 'transparent',
        border: `1px solid ${themeConfig.primary}4d`,
        pointerEvents: 'none',
        transition: 'border-color 1s ease',
      }} />

      {/* LVL eyebrow */}
      <span style={{
        fontSize: 8,
        fontWeight: 900,
        color: themeConfig.primary,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        lineHeight: 1,
        opacity: 0.85,
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 1s ease',
        zIndex: 1,
      }}>
        LVL
      </span>

      {/* Large level number */}
      <span style={{
        fontFamily: 'var(--font-display, system-ui)',
        fontSize: level >= 100 ? 18 : level >= 10 ? 22 : 26,
        fontWeight: 900,
        color: '#fff',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 16px ${themeConfig.primary}80`,
        zIndex: 1,
      }}>
        {level}
      </span>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function XPWidget({ xp, memberName: _memberName, onOpenInfo }: XPWidgetProps) {
  const level = getActualLevel(xp);
  const { title, xpForLevel, xpForNext, progress } = getLevelFromXP(xp);
  const themeKey = getTheme(level);
  const tc = THEMES[themeKey];

  // ── Animation state ──────────────────────────────────────────────
  const prevLevelRef = useRef(level);
  const [flipDeg, setFlipDeg] = useState(0);
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [scrambleActive, setScrambleActive] = useState(false);
  const [barOverride, setBarOverride] = useState<number | null>(null); // null = use real progress
  const displayTitle = useScramble(title, scrambleActive);

  // Track actual XP → used to drive bar fill animation
  const [displayProgress, setDisplayProgress] = useState(progress);

  useEffect(() => {
    if (barOverride !== null) return; // let animation control it
    setDisplayProgress(progress);
  }, [progress, barOverride]);

  // ── Level-up detection ───────────────────────────────────────────
  useEffect(() => {
    if (level <= prevLevelRef.current) {
      prevLevelRef.current = level;
      return;
    }
    // Level up!
    const prevLevel = prevLevelRef.current;
    prevLevelRef.current = level;
    void prevLevel; // used in closure for bookkeeping

    // Step 1: bar fills to 100%
    setBarOverride(1);

    // Step 2: screen flash
    const t1 = setTimeout(() => {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 600);
    }, 600);

    // Step 3: medallion flip
    const t2 = setTimeout(() => {
      setFlipDeg(prev => prev + 180);
    }, 700);

    // Step 4: shockwave ring
    const t3 = setTimeout(() => {
      setShockwaveActive(true);
      setTimeout(() => setShockwaveActive(false), 950);
    }, 750);

    // Step 5: card bounce
    const t4 = setTimeout(() => {
      setCardScale(0.96);
      setTimeout(() => setCardScale(1.02), 120);
      setTimeout(() => setCardScale(1), 320);
    }, 800);

    // Step 6: scramble title
    const t5 = setTimeout(() => {
      setScrambleActive(true);
      setTimeout(() => setScrambleActive(false), 1300);
    }, 900);

    // Step 7: bar drains back to new level progress
    const t6 = setTimeout(() => {
      setBarOverride(null);
    }, 1600);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, [level]);

  const currentXP = xp - xpForLevel;
  const nextLevelXP = xpForNext - xpForLevel;
  const barProgress = barOverride !== null ? barOverride : displayProgress;

  return (
    <>
      {/* ── Keyframes injected once ──────────────────────────────────── */}
      <style>{`
        @keyframes xpw-breathe {
          0%   { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes xpw-head-pulse {
          0%,100% { box-shadow: 0 0 6px #fff, 0 0 16px currentColor; }
          50%     { box-shadow: 0 0 12px #fff, 0 0 32px currentColor; }
        }
        @keyframes xpw-flash-out {
          0%   { opacity: 0.4; }
          100% { opacity: 0;   }
        }
        @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
        @keyframes modalSlideUp {
          from { opacity:0; transform: translateY(32px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }
      `}</style>

      {/* ── Screen flash overlay ─────────────────────────────────────── */}
      {screenFlash && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          background: '#fff',
          mixBlendMode: 'overlay',
          opacity: 0,
          animation: 'xpw-flash-out 0.6s ease-out forwards',
          pointerEvents: 'none',
          zIndex: 9999,
        }} />,
        document.body
      )}

      {/* ── Widget card ─────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px 16px',
          background: 'linear-gradient(145deg, #1a1917 0%, #0a0908 100%)',
          border: `1px solid ${tc.cardBorder}`,
          borderRadius: 20,
          padding: 24,
          boxShadow: `0 32px 64px -16px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.08), 0 0 48px ${tc.glow}`,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          overflow: 'hidden',
          position: 'relative',
          transform: `scale(${cardScale})`,
          transition: [
            'border-color 1s ease',
            'box-shadow 1s ease',
            `transform ${cardScale !== 1 ? '0.2s' : '0.3s'} cubic-bezier(0.175,0.885,0.32,1.4)`,
          ].join(', '),
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Crest decoration */}
        <CrestSvg themeKey={themeKey} color={tc.primary} />

        {/* Medallion */}
        <Medallion
          level={level}
          themeConfig={tc}
          flipDeg={flipDeg}
          shockwaveActive={shockwaveActive}
        />

        {/* Data section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: label + info button */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 4,
          }}>
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#6a6864',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              Current Rank
            </span>
            <button
              onClick={e => { e.stopPropagation(); onOpenInfo?.(); }}
              style={{
                width: 20, height: 20, minWidth: 20, minHeight: 20,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.2)',
                background: '#282522',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontStyle: 'normal', fontWeight: 700, fontSize: 12,
                cursor: 'pointer',
                padding: 0, lineHeight: 1,
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                flexShrink: 0,
              }}
              aria-label="XP info"
            >
              i
            </button>
          </div>

          {/* Row 2: Title */}
          <div style={{
            fontFamily: 'var(--font-display, system-ui)',
            fontSize: 17,
            fontWeight: 900,
            color: tc.primary,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            lineHeight: 1.1,
            marginBottom: 8,
            transition: 'color 1s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontVariantNumeric: 'tabular-nums',
            minHeight: '1.2em',
          }}>
            {displayTitle}
          </div>

          {/* Row 3: XP readout */}
          <div style={{
            fontSize: 11,
            color: '#a8a6a1',
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 8,
            lineHeight: 1,
          }}>
            <span style={{ color: '#e2e0db', fontWeight: 700 }}>
              {currentXP.toLocaleString()}
            </span>
            <span style={{ color: '#4a4844', margin: '0 4px' }}>/</span>
            <span>{nextLevelXP.toLocaleString()} XP</span>
          </div>

          {/* Row 4: XP bar */}
          <XPBarSegmented
            progress={barProgress}
            themeConfig={tc}
            animating={true}
          />
        </div>
      </div>


    </>
  );
}

// ─── XP Info Panel ────────────────────────────────────────────────────────────

export function XPInfoPanel({ onClose, xp }: { onClose: () => void; xp: number }) {
  const level = getActualLevel(xp);
  const { title, xpForLevel, xpForNext, progress } = getLevelFromXP(xp);
  const themeKey = getTheme(level);
  const tc = THEMES[themeKey];

  const currentXP = xp - xpForLevel;
  const nextLevelXP = xpForNext - xpForLevel;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(16px)',
        zIndex: 2000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        animation: 'fadeInOverlay 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeInOverlay { from{opacity:0} to{opacity:1} }
        @keyframes modalSlideUp {
          from { opacity:0; transform: translateY(32px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1); }
        }
        @keyframes xpw-breathe {
          0%   { opacity: 0.5; transform: scale(0.95); }
          100% { opacity: 1;   transform: scale(1.05); }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          marginTop: 40, marginBottom: 40,
          background: 'linear-gradient(180deg, #161513 0%, #0f0e0d 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 24,
          padding: '32px 24px',
          paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 32px))',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.9)',
          position: 'relative',
          animation: 'modalSlideUp 0.32s cubic-bezier(0.34,1.28,0.64,1)',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: '#282522', border: '1px solid rgba(255,255,255,0.08)',
            color: '#a8a6a1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 50,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: tc.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6, transition: 'color 1s ease' }}>
            Rank Progress
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display, system-ui)',
            fontSize: 28, fontWeight: 900, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.02em',
            margin: 0, textShadow: `0 0 32px ${tc.glow}`,
          }}>
            XP &amp; Levels
          </h1>
        </div>

        {/* Hero: level + title */}
        <div style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))`,
          border: `1px solid ${tc.cardBorder}`,
          borderRadius: 20,
          padding: '20px 24px',
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 20,
          boxShadow: `0 0 32px ${tc.glow}`,
          transition: 'border-color 1s ease, box-shadow 1s ease',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative crest */}
          <CrestSvg themeKey={themeKey} color={tc.primary} />

          {/* Level badge */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #2a2622, #141210)',
            border: `2px solid ${tc.primary}80`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${tc.glow}, inset 0 2px 8px rgba(255,255,255,0.06)`,
            position: 'relative',
            transition: 'border-color 1s ease, box-shadow 1s ease',
          }}>
            <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', animation: 'xpw-breathe 4s ease-in-out infinite alternate', background: `radial-gradient(circle, ${tc.glow} 0%, transparent 70%)` }} />
            <span style={{ fontSize: 8, fontWeight: 900, color: tc.primary, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, zIndex: 1, transition: 'color 1s ease' }}>LVL</span>
            <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: level >= 10 ? 20 : 24, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', zIndex: 1 }}>{level}</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 18, fontWeight: 900, color: tc.primary, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, transition: 'color 1s ease' }}>
              {title}
            </div>

            {/* Compact XP bar */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ height: 6, borderRadius: 4, background: '#1e1c1a', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(progress * 100, 100)}%`,
                  background: `linear-gradient(90deg, ${tc.barStart ?? tc.primary}, ${tc.primary}, ${tc.barEnd ?? tc.secondary})`,
                  borderRadius: 4,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                  boxShadow: `0 0 8px ${tc.glow}`,
                }} />
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#6a6864', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: '#a8a6a1', fontWeight: 700 }}>{currentXP.toLocaleString()}</span>
              {' / '}{nextLevelXP.toLocaleString()} XP this level
            </div>
          </div>
        </div>

        {/* How to earn XP */}
        <div style={{ fontSize: 11, color: '#a8a6a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          How to Earn XP
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #282522, transparent)' }} />
        </div>

        {[
          { action: 'Class check-in',       xp: '+10',  icon: '🥋', color: '#6a6864', accent: 'rgba(255,255,255,0.06)' },
          { action: 'Enter a tournament',   xp: '+50',  icon: '🏟️', color: '#e8af34', accent: 'rgba(232,175,52,0.08)' },
          { action: 'Bronze medal',         xp: '+75',  icon: '🥉', color: '#cd7f32', accent: 'rgba(205,127,50,0.08)' },
          { action: 'Silver medal',         xp: '+100', icon: '🥈', color: '#c0c0c0', accent: 'rgba(192,192,192,0.08)' },
          { action: 'Gold medal',           xp: '+150', icon: '🥇', color: '#e8af34', accent: 'rgba(232,175,52,0.12)' },
          { action: 'Belt promotion',       xp: '+500', icon: '🎖️', color: '#a855f7', accent: 'rgba(168,85,247,0.1)' },
        ].map(item => (
          <div
            key={item.action}
            style={{
              background: item.accent,
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: 12,
              padding: '11px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 13, color: '#d8d6d1', fontWeight: 500 }}>{item.action}</span>
            <span style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 14, fontWeight: 900, color: item.color,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}>
              {item.xp}
            </span>
          </div>
        ))}

        {/* Upcoming milestones */}
        <div style={{ fontSize: 11, color: '#a8a6a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '24px 0 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          Upcoming Milestones
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #282522, transparent)' }} />
        </div>

        {XP_LEVELS.filter(l => l.level > level).slice(0, 6).map((l) => {
          const xpNeeded = Math.max(0, l.xpRequired - xp);
          const milestoneTheme = getTheme(l.level);
          const mtc = THEMES[milestoneTheme];
          return (
            <div
              key={l.level}
              style={{
                background: '#0f0e0d',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                marginBottom: 8,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Left accent stripe */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: mtc.primary,
                opacity: 0.4,
                borderRadius: '4px 0 0 4px',
              }} />

              {/* Level circle */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #1e1c1a, #2a2622)',
                border: `1px solid ${mtc.primary}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: mtc.primary,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {l.level}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 14, fontWeight: 800, color: '#e2e0db', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  {l.title}
                </div>
                <div style={{ fontSize: 11, color: '#6a6864', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  +{xpNeeded.toLocaleString()} XP away
                </div>
              </div>

              {/* Theme badge */}
              <div style={{
                padding: '3px 10px', borderRadius: 999,
                border: `1px solid ${mtc.primary}40`,
                background: `${mtc.primary}14`,
                fontSize: 9, fontWeight: 900, color: mtc.primary,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                flexShrink: 0,
              }}>
                {milestoneTheme}
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
