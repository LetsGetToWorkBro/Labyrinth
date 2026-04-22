/**
 * StreakWidget — v11 final polish, ported to React
 *
 * Props mirror existing HomePage state:
 *   dailyStreakCount  — consecutive week-streak (0-30)
 *   weekDots         — array of 7 { trained: boolean, date: string } from weeklyTraining()
 *   trainedCount     — weekDots.filter(d=>d.trained).length
 *   comboMultiplier  — 1 | 1.5 | 2 | 3
 *   onOpenInfo       — open the streak info modal
 *   onCheckIn        — trigger a check-in from the active day circle
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────

interface WeekDot { trained: boolean; date?: string; }

interface StreakWidgetProps {
  dailyStreakCount: number;
  weekDots: WeekDot[];
  trainedCount: number;
  comboMultiplier: number;
  onOpenInfo?: () => void;
  onCheckIn?: () => void;
}

// ─── Phase config (mirrors HTML phases array) ─────────────────────

const PHASES = [
  { start: 1, end: 7,  tierClass: 'tier-1', title: 'Initiate', subtitle: 'Phase 1',
    nodes: [{ day: 3, label: '1.5×', icon: '🔥' }, { day: 5, label: '2.0×', icon: '🏆' }, { day: 7, label: 'Ember', icon: '💎' }] },
  { start: 8,  end: 14, tierClass: 'tier-2', title: 'Warrior',  subtitle: 'Phase 2',
    nodes: [{ day: 10, label: '1.5×', icon: '🔥' }, { day: 12, label: '2.0×', icon: '🏆' }, { day: 14, label: 'Frost', icon: '❄️' }] },
  { start: 15, end: 21, tierClass: 'tier-3', title: 'Elite',    subtitle: 'Phase 3',
    nodes: [{ day: 17, label: '1.5×', icon: '🔥' }, { day: 19, label: '2.0×', icon: '🏆' }, { day: 21, label: 'Blood', icon: '🩸' }] },
  { start: 22, end: 30, tierClass: 'tier-4', title: 'Legend',   subtitle: 'Phase 4',
    nodes: [{ day: 25, label: '2.0×', icon: '🔥' }, { day: 28, label: '3.0×', icon: '🏆' }, { day: 30, label: 'Void', icon: '🌌' }] },
];

const TIER_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  'tier-1': { primary: '#e8af34', secondary: '#fd7b2f', glow: 'rgba(232,175,52,0.2)' },
  'tier-2': { primary: '#0ea5e9', secondary: '#3b82f6', glow: 'rgba(14,165,233,0.2)' },
  'tier-3': { primary: '#ef4444', secondary: '#dc2626', glow: 'rgba(239,68,68,0.2)' },
  'tier-4': { primary: '#a855f7', secondary: '#7e22ce', glow: 'rgba(168,85,247,0.2)' },
};

const RELIC_COLORS = ['#e8af34', '#0ea5e9', '#ef4444', '#a855f7'];
const RELIC_NAMES = ['Ember Core', 'Frost Matrix', 'Blood Prism', 'Void Star'];
const RELIC_DAYS  = [7, 14, 21, 30];

function getPhaseIndex(day: number): number {
  for (let i = 0; i < PHASES.length; i++) if (day <= PHASES[i].end) return i;
  return PHASES.length - 1;
}

// ─── Relic orbs (CSS, no canvas) ─────────────────────────────────

function OrbEmber() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'radial-gradient(circle at 30% 30%, #fff, #fde047 20%, #e8af34 50%, #7c2d12 90%)',
      boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.8), inset 4px 4px 12px rgba(255,255,255,0.9), 0 0 20px #e8af34',
      animation: 'sw-float 4s ease-in-out infinite, sw-pulse-glow 3s infinite alternate',
    }} />
  );
}
function OrbFrost() {
  return (
    <div style={{
      width: 36, height: 42,
      background: 'radial-gradient(circle at 40% 20%, #fff, #7dd3fc 30%, #0ea5e9 60%, #1e3a8a 90%)',
      boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.8), inset 4px 4px 12px rgba(255,255,255,0.9), 0 0 24px #0ea5e9',
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      animation: 'sw-float 5s ease-in-out infinite 1s',
    }} />
  );
}
function OrbBlood() {
  return (
    <div style={{
      width: 40, height: 48,
      background: 'radial-gradient(circle at 30% 30%, #fff, #fca5a5 20%, #ef4444 50%, #450a0a 90%)',
      boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.8), inset 4px 4px 12px rgba(255,255,255,0.9), 0 0 24px #ef4444',
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      animation: 'sw-float 3s ease-in-out infinite 0.5s',
    }} />
  );
}
function OrbVoid() {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', position: 'relative',
      background: 'radial-gradient(circle at 30% 30%, #fff, #d8b4fe 20%, #a855f7 60%, #111827 90%)',
      boxShadow: 'inset -6px -6px 12px rgba(0,0,0,0.9), inset 4px 4px 12px rgba(255,255,255,0.9), 0 0 32px #a855f7',
      animation: 'sw-float 6s ease-in-out infinite',
    }} />
  );
}

const ORBS = [OrbEmber, OrbFrost, OrbBlood, OrbVoid];

// ─── Spark particle ───────────────────────────────────────────────

function Sparks({ x, y, color, count = 18, onDone }: { x: number; y: number; color: string; count?: number; onDone?: () => void }) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const v = 30 + Math.random() * 80;
      return { dx: Math.cos(angle) * v, dy: Math.sin(angle) * v, size: Math.random() > 0.8 ? 6 : 3, delay: Math.random() * 0.1 };
    })
  );
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: x, top: y,
          width: p.size, height: p.size,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 ${p.size * 3}px ${color}`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          transform: 'translate(-50%,-50%)',
          animation: `sw-spark-${i % 4} ${0.6 + p.delay + Math.random() * 0.4}s cubic-bezier(0,0.5,0.5,1) ${p.delay}s both`,
          '--dx': `${p.dx}px`,
          '--dy': `${p.dy}px`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ─── Info Panel (replaces old streak modal) ───────────────────────

export function StreakInfoPanel({ onClose, trainedCount, isEliteWeek, isPerfectWeek }: {
  onClose: () => void;
  trainedCount: number;
  isEliteWeek: boolean;
  isPerfectWeek: boolean;
}) {
  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', zIndex: 2000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto', animation: 'fadeInOverlay 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, marginTop: 40, marginBottom: 40,
          background: 'linear-gradient(180deg,#161513 0%,#0f0e0d 100%)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 24, padding: '32px 24px',
          boxShadow: '0 32px 64px -16px rgba(0,0,0,0.9)',
          position: 'relative',
          animation: 'modalSlideUp 0.32s cubic-bezier(0.34,1.28,0.64,1)',
          paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom) + 32px))',
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: '#282522', border: '1px solid rgba(255,255,255,0.08)', color: '#a8a6a1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#e8af34', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Progression Guide</div>
          <h1 style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 28, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0, textShadow: '0 0 32px rgba(232,175,52,0.3)' }}>Streaks & Relics</h1>
        </div>

        {/* Weekly Multipliers */}
        <div style={{ fontSize: 11, color: '#a8a6a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          Weekly Multipliers
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #282522, transparent)' }} />
        </div>

        {[
          { label: '1 Class',   mult: '1.0×', desc: 'Base XP per check-in. Show up and build.',                     icon: '🥋', color: '#6a6864', bg: 'transparent' },
          { label: '3 Classes', mult: '1.5×', desc: 'On a Roll. Your combo bonus kicks in for the week.',           icon: '🔥', color: '#fd7b2f', bg: 'rgba(253,123,47,0.1)' },
          { label: '5 Classes', mult: '2.0×', desc: 'Perfect Week. Double all your hard-earned XP.',                icon: '🏆', color: '#e8af34', bg: 'rgba(232,175,52,0.1)' },
          { label: '7 Classes', mult: '3.0×', desc: 'Legendary Week. Triple XP. You live on the mats.',            icon: '👑', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
        ].map(tier => (
          <div key={tier.label} style={{
            background: '#0f0e0d', border: '1px solid rgba(255,255,255,0.03)',
            borderRadius: 16, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 16,
            marginBottom: 10, position: 'relative',
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: tier.color, opacity: 0.5, borderRadius: '4px 0 0 4px' }} />
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#282522,#1e1c1a)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {tier.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 16, fontWeight: 800, color: '#fff' }}>{tier.label}</span>
                <span style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.color}`, padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>{tier.mult}</span>
              </div>
              <span style={{ fontSize: 13, color: '#a8a6a1', lineHeight: 1.4 }}>{tier.desc}</span>
            </div>
          </div>
        ))}

        {/* Relic Forge */}
        <div style={{ fontSize: 11, color: '#e8af34', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '28px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          The Relic Forge (30 Days)
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(232,175,52,0.3), transparent)' }} />
        </div>

        <div style={{ background: '#0f0e0d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, marginBottom: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#a8a6a1', lineHeight: 1.5, margin: 0 }}>For the relentless. Train consecutive days to forge legendary relics and lock in permanent status.</p>
        </div>

        {[
          { name: 'Ember Core',   day: 7,  color: '#e8af34', glow: 'rgba(232,175,52,0.3)',   desc: 'Ignite your journey. The first spark of undeniable consistency.',                OrbC: OrbEmber },
          { name: 'Frost Matrix', day: 14, color: '#0ea5e9', glow: 'rgba(14,165,233,0.3)',   desc: 'Solidify your habit. Precise, unbroken, and cold under pressure.',              OrbC: OrbFrost },
          { name: 'Blood Prism',  day: 21, color: '#ef4444', glow: 'rgba(239,68,68,0.3)',    desc: 'Sacrifice and resilience. You have bled for the art. Mark of the elite.',        OrbC: OrbBlood },
          { name: 'Void Star',    day: 30, color: '#a855f7', glow: 'rgba(168,85,247,0.4)',   desc: 'Total mastery. A legendary relic forged in the unknown.',                       OrbC: OrbVoid  },
        ].map(r => (
          <div key={r.name} style={{
            background: '#0f0e0d', border: '1px solid rgba(255,255,255,0.03)',
            borderRadius: 14, padding: 14,
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0f0e0d', border: `2px solid rgba(255,255,255,0.05)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <r.OrbC />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 18, fontWeight: 900, color: r.color, textTransform: 'uppercase' }}>{r.name}</span>
                <span style={{ background: `rgba(255,255,255,0.05)`, color: r.color, border: `1px solid ${r.color}`, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 900 }}>Day {r.day}</span>
              </div>
              <p style={{ fontSize: 13, color: '#a8a6a1', lineHeight: 1.4, margin: 0 }}>{r.desc}</p>
            </div>
          </div>
        ))}

        <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '20px 24px', textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Miss a week, lose the multiplier.</div>
          <div style={{ fontSize: 12, color: '#a8a6a1' }}>Miss a day, the Forge resets. Commit to the mats.</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Widget ──────────────────────────────────────────────────

export function StreakWidget({ dailyStreakCount, weekDots, trainedCount, comboMultiplier, onOpenInfo, onCheckIn }: StreakWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; color: string; count: number }[]>([]);
  const [impactFlash, setImpactFlash] = useState(false);
  const [levelUpText, setLevelUpText] = useState('');
  const [relicsUnlocked, setRelicsUnlocked] = useState<Set<number>>(() => {
    // Pre-populate from streak count
    const s = new Set<number>();
    RELIC_DAYS.forEach((d, i) => { if (dailyStreakCount >= d) s.add(i); });
    return s;
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const sparkIdRef = useRef(0);
  const prevStreakRef = useRef(dailyStreakCount);

  const phaseIdx = getPhaseIndex(Math.max(1, dailyStreakCount));
  const phase = PHASES[phaseIdx];
  const tc = TIER_COLORS[phase.tierClass];

  const phaseLength = phase.end - phase.start + 1;
  const dayInPhase = Math.max(0, dailyStreakCount - phase.start + 1);
  const trackFillPct = dailyStreakCount >= phase.start
    ? Math.min((dayInPhase / phaseLength) * 100, 100)
    : 0;

  // Overall ring progress 0-100 (out of 30 days)
  const ringOffset = 2 * Math.PI * 10; // r=10 circumference
  const ringDashOffset = ringOffset - (Math.min(dailyStreakCount, 30) / 30) * ringOffset;

  // Badge text from nodes
  let badgeIcon = '🔥', badgeText = 'Building';
  phase.nodes.forEach(n => {
    if (dailyStreakCount >= n.day) { badgeIcon = n.icon; badgeText = n.label; }
  });
  if (dailyStreakCount >= 30) { badgeIcon = '👑'; badgeText = 'Legendary'; }

  // Weekly XP state
  const isPerfectWeek = trainedCount >= 5;
  const isEliteWeek = trainedCount >= 7;

  // Multiplier badge for header
  const multLabel = isEliteWeek ? '3×' : isPerfectWeek ? '2×' : trainedCount >= 3 ? '1.5×' : '1×';

  // Spark helper
  const addSparks = useCallback((x: number, y: number, color: string, count = 18) => {
    const id = ++sparkIdRef.current;
    setSparks(prev => [...prev, { id, x, y, color, count }]);
  }, []);

  // Detect relic unlock on streak change
  useEffect(() => {
    const prev = prevStreakRef.current;
    if (dailyStreakCount !== prev) {
      RELIC_DAYS.forEach((d, i) => {
        if (dailyStreakCount >= d && prev < d && !relicsUnlocked.has(i)) {
          setRelicsUnlocked(s => new Set([...s, i]));
          setLevelUpText(d === 30 ? 'LEGENDARY' : 'PHASE CLEARED');
          setImpactFlash(true);
          setTimeout(() => setImpactFlash(false), 1200);
          setTimeout(() => setLevelUpText(''), 2500);
        }
      });
      prevStreakRef.current = dailyStreakCount;
    }
  }, [dailyStreakCount, relicsUnlocked]);

  // Expand/collapse
  const expand = () => {
    if (isExpanded) return;
    setIsExpanded(true);
  };
  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  // Animated expand height
  const [expandHeight, setExpandHeight] = useState(0);
  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setExpandHeight(contentRef.current.scrollHeight);
    } else {
      setExpandHeight(0);
    }
  }, [isExpanded, dailyStreakCount, trainedCount]);

  return (
    <>
      {/* ─── Keyframe styles injected once ─────────────────────── */}
      <style>{`
        @keyframes sw-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes sw-pulse-glow { 0%{filter:brightness(1)} 100%{filter:brightness(1.3)} }
        @keyframes sw-sonar {
          0%   { transform:scale(0.8); opacity:1; border-width:2px; }
          100% { transform:scale(1.6); opacity:0; border-width:0px; }
        }
        @keyframes sw-spark-0 { to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity:0; } }
        @keyframes sw-spark-1 { to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity:0; } }
        @keyframes sw-spark-2 { to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity:0; } }
        @keyframes sw-spark-3 { to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0); opacity:0; } }
        @keyframes sw-impact { 0%{opacity:0.6} 100%{opacity:0} }
        @keyframes sw-level-up { 0%{opacity:1;transform:translate(-50%,-50%) scale(0.5) translateY(40px)} 100%{opacity:0;transform:translate(-50%,-50%) scale(1.2) translateY(-60px)} }
        @keyframes sw-track-head-pulse { 0%,100%{box-shadow:0 0 12px #fff, 0 0 32px ${tc.primary}} 50%{box-shadow:0 0 20px #fff, 0 0 48px ${tc.primary}} }
        .sw-widget:not(.sw-expanded):active { transform: scale(0.97); }
        .sw-widget.sw-expanded { cursor: default; }
        .sw-day-col.is-active .sw-day-circle::after {
          content:''; position:absolute; inset:-8px; border-radius:999px; border:1px solid ${tc.primary};
          animation: sw-sonar 2s cubic-bezier(0.16,1,0.3,1) infinite;
        }
      `}</style>

      <div
        ref={widgetRef}
        className={`sw-widget${isExpanded ? ' sw-expanded' : ''}`}
        onClick={() => { if (!isExpanded) { expand(); } }}
        style={{
          background: `linear-gradient(180deg, #161513 0%, #0f0e0d 100%)`,
          border: `1px solid rgba(255,255,255,0.05)`,
          borderTop: `1px solid rgba(255,255,255,0.15)`,
          borderRadius: 24,
          padding: isExpanded ? '24px 24px 32px' : '20px 20px',
          boxShadow: `0 16px 64px -16px rgba(0,0,0,0.8), 0 0 50px ${tc.glow}`,
          cursor: isExpanded ? 'default' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.6s, padding 0.4s',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          margin: '0 20px 16px',
        }}
      >
        {/* Impact flash */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: `radial-gradient(circle at 50% 50%, ${tc.primary} 0%, transparent 80%)`,
          opacity: impactFlash ? 0.35 : 0,
          pointerEvents: 'none',
          transition: 'opacity 0.8s ease',
          mixBlendMode: 'color-dodge',
        }} />

        {/* Sparks layer */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 100 }}>
          {sparks.map(s => (
            <Sparks key={s.id} x={s.x} y={s.y} color={s.color} count={s.count}
              onDone={() => setSparks(p => p.filter(sp => sp.id !== s.id))} />
          ))}
        </div>

        {/* PHASE CLEARED text */}
        {levelUpText && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', zIndex: 150,
            pointerEvents: 'none',
            fontFamily: 'var(--font-display, system-ui)', fontSize: 26, fontWeight: 900,
            color: '#fff', textTransform: 'uppercase', letterSpacing: 2,
            textShadow: `0 0 20px ${tc.primary}, 0 0 40px ${tc.primary}`,
            animation: 'sw-level-up 2.2s cubic-bezier(0.16,1,0.3,1) forwards',
            whiteSpace: 'nowrap',
          }}>
            {levelUpText}
          </div>
        )}

        {/* Close button — only when expanded */}
        {isExpanded && (
          <button onClick={collapse} style={{
            position: 'absolute', top: 20, right: 20, width: 34, height: 34,
            borderRadius: '50%', background: '#282522', border: '1px solid rgba(255,255,255,0.08)',
            color: '#a8a6a1', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 50, transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}

        {/* ── HEADER ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Ring complication */}
            <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="#282522" strokeWidth="4" />
                <circle cx="12" cy="12" r="10" fill="none" stroke={tc.primary} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${ringOffset}`}
                  strokeDashoffset={ringDashOffset}
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.175,0.885,0.32,1.275), stroke 0.6s', filter: `drop-shadow(0 0 8px ${tc.glow})` }}
                />
              </svg>
              <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1, zIndex: 2 }}>
                {dailyStreakCount}
              </span>
            </div>

            {/* Title group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#a8a6a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1 }}>
                {phase.subtitle}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 20, fontWeight: 900, color: tc.primary, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1, transition: 'color 0.6s' }}>
                  {phase.title}
                </span>
                {/* Info button */}
                <button
                  onClick={e => { e.stopPropagation(); onOpenInfo?.(); }}
                  aria-label="Streak info"
                  style={{
                    width: 22, height: 22, minWidth: 22, minHeight: 22,
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)',
                    background: '#282522', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontStyle: 'normal', fontWeight: 700, fontSize: 13,
                    lineHeight: 1, padding: 0,
                    cursor: 'pointer', boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  i
                </button>
              </div>
            </div>
          </div>

          {/* Badge */}
          <div style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%)`,
            color: tc.primary, border: `1px solid ${tc.glow}`,
            padding: '5px 12px 4px', borderRadius: 999,
            fontSize: 11, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase',
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.1), 0 0 15px ${tc.glow}`,
            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.6s',
          }}>
            <span>{badgeIcon}</span><span>{badgeText}</span>
            {trainedCount >= 3 && <span style={{ opacity: 0.7 }}>{multLabel}</span>}
          </div>
        </div>

        {/* ── EXPANDED CONTENT ─────────────────────────────────── */}
        <div ref={wrapperRef} style={{
          height: expandHeight,
          overflow: isExpanded ? 'visible' : 'hidden',
          transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div ref={contentRef}>
            <div style={{ paddingTop: 28 }}>

              {/* ── Phase: Day dots ── */}
              <div style={{ marginBottom: 24 }}>
                {/* Days row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: phase.end - phase.start + 1 }, (_, i) => {
                    const d = phase.start + i;
                    const isCompleted = d <= dailyStreakCount;
                    const isActive = d === dailyStreakCount + 1;
                    const xp = 10 + (i % 5);

                    return (
                      <div key={d} className={`sw-day-col${isCompleted ? ' is-completed' : ''}${isActive ? ' is-active' : ''}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, position: 'relative' }}
                      >
                        {/* XP label */}
                        <span style={{
                          fontSize: 11, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1,
                          color: isActive ? tc.primary : isCompleted ? tc.primary : '#6a6864',
                          opacity: isActive ? 1 : isCompleted ? 0.5 : 0.4,
                          textShadow: isActive ? `0 0 16px ${tc.glow}` : 'none',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          +{xp}
                        </span>

                        {/* Circle */}
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            if (!isExpanded) { expand(); return; }
                            if (isActive && onCheckIn) {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              const wRect = widgetRef.current?.getBoundingClientRect();
                              if (wRect) addSparks(rect.left - wRect.left + rect.width / 2, rect.top - wRect.top + rect.height / 2, tc.primary, 22);
                              setImpactFlash(true);
                              setTimeout(() => setImpactFlash(false), 800);
                              onCheckIn();
                            }
                          }}
                          style={{
                            width: '100%', maxWidth: 40, maxHeight: 40, aspectRatio: '1',
                            borderRadius: 999,
                            border: isCompleted ? 'none' : isActive ? `2px solid ${tc.primary}` : `2px solid #282522`,
                            background: isCompleted
                              ? `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`
                              : '#161513',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, lineHeight: 1,
                            color: isCompleted ? '#0f0e0d' : isActive ? tc.primary : '#6a6864',
                            boxShadow: isCompleted
                              ? `inset 0 -2px 8px rgba(0,0,0,0.4), inset 0 2px 8px rgba(255,255,255,0.4), 0 8px 16px ${tc.glow}`
                              : isActive ? `inset 0 0 16px ${tc.glow}, 0 0 24px ${tc.glow}` : 'none',
                            transform: isCompleted ? 'scale(0.95)' : 'scale(1)',
                            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                            cursor: isActive ? 'pointer' : 'default',
                            position: 'relative',
                          }}
                        >
                          {isCompleted
                            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            : <span style={{ opacity: isActive ? 1 : 0.6 }}>{d}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Track + nodes */}
                <div style={{ position: 'relative', padding: '20px 0', margin: '0 5%' }}>
                  {/* Rail */}
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 8, background: '#1e1c1a', borderRadius: 4, transform: 'translateY(-50%)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8)', zIndex: 1 }} />
                  {/* Fill */}
                  <div style={{
                    position: 'absolute', top: '50%', left: 0,
                    width: `${trackFillPct}%`, height: 8,
                    background: `linear-gradient(90deg, ${tc.primary}, ${tc.secondary})`,
                    borderRadius: 4, transform: 'translateY(-50%)',
                    boxShadow: `0 0 24px ${tc.glow}, inset 0 2px 4px rgba(255,255,255,0.4)`,
                    transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                    zIndex: 2,
                  }}>
                    {/* Glowing head */}
                    {trackFillPct > 2 && (
                      <div style={{
                        position: 'absolute', right: 0, top: '50%',
                        width: 14, height: 14, background: '#fff', borderRadius: '50%',
                        transform: 'translate(50%, -50%)',
                        boxShadow: `0 0 12px #fff, 0 0 32px ${tc.primary}`,
                        animation: 'sw-track-head-pulse 2s ease-in-out infinite',
                      }} />
                    )}
                  </div>

                  {/* Nodes */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', zIndex: 10 }}>
                    {phase.nodes.map(node => {
                      const pct = ((node.day - phase.start) / (phaseLength - 1)) * 100;
                      const isReached = dailyStreakCount >= node.day;
                      return (
                        <div key={node.day} style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          {/* Label above */}
                          <div style={{
                            position: 'absolute', bottom: 'calc(50% + 38px)', left: '50%', transform: 'translateX(-50%)',
                            fontFamily: 'var(--font-display, system-ui)', fontSize: 13, fontWeight: 900,
                            color: isReached ? tc.primary : '#6a6864',
                            textShadow: isReached ? `0 0 16px ${tc.glow}` : 'none',
                            whiteSpace: 'nowrap', letterSpacing: 0.5,
                            transition: 'color 0.4s',
                          }}>
                            {node.label}
                          </div>
                          {/* Diamond marker */}
                          <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: isReached ? `linear-gradient(135deg, #0f0e0d, ${tc.secondary})` : '#161513',
                            border: isReached ? '2px solid rgba(255,255,255,0.4)' : '2px solid #282522',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transform: 'rotate(45deg)',
                            boxShadow: isReached ? `0 12px 32px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.3), 0 0 32px ${tc.glow}` : '0 8px 24px rgba(0,0,0,0.6)',
                            transition: 'all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                          }}>
                            <div style={{ transform: 'rotate(-45deg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{ fontSize: isReached ? 18 : 14, lineHeight: 1, opacity: isReached ? 1 : 0.4, transition: 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)' }}>{node.icon}</span>
                              <span style={{ fontSize: 10, fontWeight: 900, color: isReached ? '#fff' : '#6a6864', lineHeight: 1 }}>{node.day}D</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Spacer */}
                  <div style={{ height: 52 }} />
                </div>
              </div>

              {/* ── Relic Forge ── */}
              <div style={{
                background: 'linear-gradient(180deg, #1e1c1a, #161513)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '18px 20px',
                boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.8)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 }}>The Relic Forge</span>
                  <span style={{ fontSize: 11, color: tc.primary, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, transition: 'color 0.6s' }}>
                    {relicsUnlocked.size > 0 ? `${relicsUnlocked.size * 7}/30 Collected` : `${30 - dailyStreakCount} Days to Legend`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {ORBS.map((OrbComp, i) => {
                    const unlocked = relicsUnlocked.has(i);
                    return (
                      <div key={i} style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: '#0f0e0d',
                        border: unlocked ? '2px solid rgba(255,255,255,0.1)' : '2px solid #282522',
                        boxShadow: unlocked ? 'inset 0 4px 12px rgba(0,0,0,0.6)' : 'inset 0 8px 16px rgba(0,0,0,0.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.4s',
                      }}>
                        <div style={{
                          opacity: unlocked ? 1 : 0,
                          transform: unlocked ? 'scale(1) translateY(0)' : 'scale(0) translateY(10px)',
                          transition: 'all 0.8s cubic-bezier(0.175,0.885,0.32,1.275)',
                        }}>
                          <OrbComp />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
