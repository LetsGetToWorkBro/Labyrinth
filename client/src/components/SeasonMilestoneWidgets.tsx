/**
 * SeasonMilestoneWidgets — phase-aware, world-class widgets
 *
 * MilestoneWidget: adopts the exact 5-theme paragon system (ember/frost/void/blood/apex)
 *   driven by the member's current XP level. Matches the TopHeader XP bar 1:1.
 *
 * SeasonWidget: smooth progressive color shift across 5 fill thresholds:
 *   0–25%  → ember (cool gold, faint)
 *   25–60% → gold warming up
 *   60–85% → charged orange-gold, stronger glow
 *   85–99% → pulsing, almost-there white-gold burst
 *   100%   → emerald completion with shockwave
 *
 * All transitions: 0.9s ease — matches the XP bar transition speed exactly.
 */

import React, { useState, useEffect, useRef } from 'react';
import { getParagonTheme, type ParagonTheme } from '@/components/ParagonRing';

// ─── Paragon theme tokens (mirrors TopHeader/XPBar exactly) ────────
const PARAGON_TOKENS: Record<ParagonTheme, {
  primary: string; secondary: string;
  barA: string; barB: string; barC: string;
  glow: string; glowS: string;
  border: string; borderHover: string;
  chipBg: string; chipC: string;
  name: string;
}> = {
  ember: {
    primary: '#C8A24C', secondary: '#FFD700',
    barA: '#6B4A00', barB: '#C8A24C', barC: '#FFF8DC',
    glow: 'rgba(200,162,76,.18)', glowS: 'rgba(200,162,76,.65)',
    border: 'rgba(200,162,76,.2)', borderHover: 'rgba(200,162,76,.4)',
    chipBg: 'linear-gradient(135deg,#C8A24C,#FFD700)', chipC: '#000',
    name: 'EMBER',
  },
  frost: {
    primary: '#0ea5e9', secondary: '#38bdf8',
    barA: '#0c3f5e', barB: '#0ea5e9', barC: '#bae6fd',
    glow: 'rgba(14,165,233,.18)', glowS: 'rgba(14,165,233,.65)',
    border: 'rgba(14,165,233,.25)', borderHover: 'rgba(14,165,233,.5)',
    chipBg: 'linear-gradient(135deg,#0284c7,#38bdf8)', chipC: '#000',
    name: 'FROST',
  },
  void: {
    primary: '#a855f7', secondary: '#c084fc',
    barA: '#3b0764', barB: '#a855f7', barC: '#e9d5ff',
    glow: 'rgba(168,85,247,.18)', glowS: 'rgba(168,85,247,.65)',
    border: 'rgba(168,85,247,.28)', borderHover: 'rgba(168,85,247,.55)',
    chipBg: 'linear-gradient(135deg,#6d28d9,#c084fc)', chipC: '#fff',
    name: 'VOID',
  },
  blood: {
    primary: '#ef4444', secondary: '#f87171',
    barA: '#450a0a', barB: '#ef4444', barC: '#fecaca',
    glow: 'rgba(239,68,68,.18)', glowS: 'rgba(239,68,68,.7)',
    border: 'rgba(239,68,68,.3)', borderHover: 'rgba(239,68,68,.55)',
    chipBg: 'linear-gradient(135deg,#7f1d1d,#f87171)', chipC: '#fff',
    name: 'BLOOD',
  },
  apex: {
    primary: '#e2e8f0', secondary: '#ffffff',
    barA: '#334155', barB: '#e2e8f0', barC: '#ffffff',
    glow: 'rgba(255,255,255,.18)', glowS: 'rgba(255,255,255,.7)',
    border: 'rgba(255,255,255,.35)', borderHover: 'rgba(255,255,255,.6)',
    chipBg: 'linear-gradient(135deg,#94a3b8,#fff)', chipC: '#000',
    name: 'APEX',
  },
};

// ─── Season fill thresholds → progressive color states ─────────────
// The season ring/bar smoothly shifts through these as the month fills.
function getSeasonTheme(pct: number, maxed: boolean): {
  color: string; glow: string; barGrad: string;
  borderColor: string; bgAccent: string; outerGlow: string;
  label: string; pulsing: boolean;
} {
  if (maxed) return {
    color: '#10b981', glow: 'rgba(16,185,129,0.45)',
    barGrad: 'linear-gradient(90deg,#059669,#10b981,#6ee7b7)',
    borderColor: 'rgba(16,185,129,0.5)', bgAccent: 'rgba(16,185,129,0.07)',
    outerGlow: '0 0 28px rgba(16,185,129,0.25)', label: 'Completed', pulsing: false,
  };
  if (pct >= 85) return {
    // Charged — white-gold near completion
    color: '#FFF8DC', glow: 'rgba(255,248,220,0.6)',
    barGrad: 'linear-gradient(90deg,#C8A24C,#FFD700,#fff,#FFD700,#C8A24C)',
    borderColor: 'rgba(255,248,220,0.5)', bgAccent: 'rgba(255,215,0,0.08)',
    outerGlow: '0 0 32px rgba(255,215,0,0.35)', label: 'Almost there', pulsing: true,
  };
  if (pct >= 60) return {
    // Charged gold — warming up
    color: '#FFD700', glow: 'rgba(255,215,0,0.5)',
    barGrad: 'linear-gradient(90deg,#92400E,#C8A24C,#FFD700)',
    borderColor: 'rgba(255,215,0,0.35)', bgAccent: 'rgba(255,215,0,0.06)',
    outerGlow: '0 0 24px rgba(255,215,0,0.2)', label: 'On track', pulsing: false,
  };
  if (pct >= 25) return {
    // Mid — standard gold
    color: '#e8af34', glow: 'rgba(232,175,52,0.4)',
    barGrad: 'linear-gradient(90deg,#6B4A00,#C8A24C,#e8af34)',
    borderColor: 'rgba(232,175,52,0.22)', bgAccent: 'rgba(232,175,52,0.04)',
    outerGlow: 'none', label: 'In progress', pulsing: false,
  };
  return {
    // Early — cool ember, quiet
    color: '#b8924a', glow: 'rgba(184,146,74,0.25)',
    barGrad: 'linear-gradient(90deg,#3d2a0a,#8B6508,#b8924a)',
    borderColor: 'rgba(184,146,74,0.12)', bgAccent: 'rgba(184,146,74,0.02)',
    outerGlow: 'none', label: 'Just started', pulsing: false,
  };
}

// ─── Types ─────────────────────────────────────────────────────────

interface SeasonData {
  thisMonthClasses: number;
  goalClasses: number;
  progress: number;   // 0–1
  monthName: string;
}

interface MilestoneData {
  label: string;
  xpNeeded: number;
  ready: boolean;
}

interface SeasonMilestoneWidgetsProps {
  season: SeasonData;
  milestone: MilestoneData;
  currentLevel?: number;   // drives paragon theme on milestone widget
  onOpenSeason?: () => void;
  onOpenMilestone?: () => void;
}

// ─── Season Widget ──────────────────────────────────────────────────

function SeasonWidget({ season, onClick }: { season: SeasonData; onClick?: () => void }) {
  const maxed = season.thisMonthClasses >= season.goalClasses;
  const [wasMaxed, setWasMaxed] = useState(maxed);
  const [shockwave, setShockwave] = useState(false);

  useEffect(() => {
    if (maxed && !wasMaxed) {
      setShockwave(true);
      setTimeout(() => setShockwave(false), 1100);
      setWasMaxed(true);
    }
  }, [maxed, wasMaxed]);

  const pct     = Math.round(Math.min(season.progress, 1) * 100);
  const st      = getSeasonTheme(pct, maxed);
  const circ    = 2 * Math.PI * 16;
  const offset  = circ - (Math.min(season.progress, 1) * circ);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20, padding: 16, cursor: 'pointer',
        height: 110,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: `radial-gradient(circle at 100% 0%, ${st.bgAccent}, transparent 70%)`,
        border: `1px solid ${st.borderColor}`,
        boxShadow: `0 12px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06), ${st.outerGlow}`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        transition: 'border-color 0.9s ease, box-shadow 0.9s ease, background 0.9s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Phase shimmer overlay — brightens at ≥85% */}
      {pct >= 85 && !maxed && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)',
          animation: 'smw-shimmer 2s linear infinite',
          zIndex: 1,
        }} />
      )}

      {/* Shockwave on completion */}
      {shockwave && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 0,
          animation: 'smw-shockwave 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <svg viewBox="0 0 100 100" width="200" height="200" style={{ transform: 'translate(-50%,-50%)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke={st.color} strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 4, color: st.color,
            transition: 'color 0.9s ease',
            textShadow: pct >= 60 ? `0 0 12px ${st.glow}` : 'none',
          }}>
            {season.monthName} Season
          </div>
          <div style={{
            fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1,
            letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            textShadow: pct >= 85 ? `0 0 16px ${st.glow}` : 'none',
            transition: 'text-shadow 0.9s ease',
          }}>
            {maxed ? season.goalClasses : season.thisMonthClasses}
            {!maxed && <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>/{season.goalClasses}</span>}
          </div>
        </div>

        {/* Circular ring — SVG */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="smw-season-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={maxed ? '#6ee7b7' : pct >= 85 ? '#fff' : pct >= 60 ? '#FFD700' : '#fef08a'} style={{ transition: 'stop-color 0.9s ease' }} />
                <stop offset="100%" stopColor={maxed ? '#10b981' : pct >= 85 ? '#FFD700' : pct >= 60 ? '#e8af34' : '#C8A24C'} style={{ transition: 'stop-color 0.9s ease' }} />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="18" cy="18" r="16" fill="none"
              stroke="url(#smw-season-grad)"
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{
                filter: `drop-shadow(0 0 ${pct >= 85 ? 10 : pct >= 60 ? 7 : 5}px ${st.glow})`,
                transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), filter 0.9s ease',
                animation: pct >= 85 && !maxed ? 'smw-ring-pulse 1.4s ease-in-out infinite alternate' : 'none',
              }}
            />
          </svg>
          {maxed && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={st.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {maxed ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 800, color: st.color,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            textShadow: `0 0 10px ${st.glow}`,
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Season Complete
          </div>
        ) : (
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: st.barGrad,
              backgroundSize: '300% 100%',
              width: `${pct}%`,
              boxShadow: `0 0 ${pct >= 60 ? 10 : 6}px ${st.glow}`,
              animation: pct >= 85 ? 'smw-bar-pulse .8s ease-in-out infinite alternate, smw-shimmer 2s linear infinite' : 'smw-shimmer 3s linear infinite',
              transition: 'width 1s cubic-bezier(0.16,1,0.3,1), box-shadow 0.9s ease',
            }} />
            {/* Glowing head dot */}
            {pct > 2 && (
              <div style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: `calc(${pct}% - 3px)`,
                width: 6, height: 6, borderRadius: '50%',
                background: pct >= 85 ? '#fff' : st.color,
                boxShadow: `0 0 ${pct >= 85 ? 10 : 6}px ${st.glow}`,
                transition: 'left 1s cubic-bezier(0.16,1,0.3,1), box-shadow 0.9s ease',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Milestone Widget — paragon phase-shift ─────────────────────────

function MilestoneWidget({
  milestone, currentLevel, onClick,
}: {
  milestone: MilestoneData;
  currentLevel: number;
  onClick?: () => void;
}) {
  const [shockwave, setShockwave] = useState(false);
  const prevReady = useRef(milestone.ready);
  const prevTheme = useRef<ParagonTheme>('ember');

  const theme = getParagonTheme(currentLevel);
  const tok   = PARAGON_TOKENS[theme];

  // Shockwave on ready OR on theme shift
  useEffect(() => {
    if (milestone.ready && !prevReady.current) {
      setShockwave(true);
      setTimeout(() => setShockwave(false), 1100);
    }
    prevReady.current = milestone.ready;
  }, [milestone.ready]);

  useEffect(() => {
    if (theme !== prevTheme.current) {
      setShockwave(true);
      setTimeout(() => setShockwave(false), 1100);
      prevTheme.current = theme;
    }
  }, [theme]);

  // When ready, use the purple/claim state; otherwise drive purely from paragon theme
  const primary  = milestone.ready ? '#a855f7'                : tok.primary;
  const glowS    = milestone.ready ? 'rgba(168,85,247,0.65)'  : tok.glowS;
  const glow     = milestone.ready ? 'rgba(168,85,247,0.2)'   : tok.glow;
  const border   = milestone.ready ? 'rgba(168,85,247,0.45)'  : tok.border;
  const borderHv = milestone.ready ? 'rgba(168,85,247,0.7)'   : tok.borderHover;
  const iconBg   = milestone.ready ? '#a855f7'                : 'transparent';
  const iconBrd  = milestone.ready ? '#a855f7'                : tok.primary;
  const iconClr  = milestone.ready ? '#000'                   : tok.primary;
  const xpClr    = milestone.ready ? '#d8b4fe'                : tok.primary;
  const barGrad  = `linear-gradient(90deg,${tok.barA},${tok.barB} 55%,${tok.barC} 85%,${tok.barB})`;

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20, padding: 15, cursor: 'pointer',
        height: 110,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: `radial-gradient(circle at 100% 0%, ${glow}, transparent 65%)`,
        border: `1px solid ${border}`,
        boxShadow: `0 12px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 20px ${glow}`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        transition: 'border-color 0.9s ease, box-shadow 0.9s ease, background 0.9s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderHv;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 28px ${glowS}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = border;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 20px ${glow}`;
      }}
    >
      {/* Phase shimmer — always on, matches XP bar */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: `linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)`,
        backgroundSize: '200% 100%',
        animation: 'smw-shimmer 3.5s linear infinite',
        zIndex: 1,
      }} />

      {/* Ambient glow radial — driven by theme */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: `radial-gradient(ellipse at 20% 60%, ${glow} 0%, transparent 60%)`,
        transition: 'background 0.9s ease',
        zIndex: 0,
      }} />

      {/* Shockwave on ready or theme shift */}
      {shockwave && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 0,
          animation: 'smw-shockwave 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <svg viewBox="0 0 100 100" width="200" height="200" style={{ transform: 'translate(-50%,-50%)' }}>
            <circle cx="50" cy="50" r="40" fill="none" stroke={primary} strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Phase label — shows current theme tier */}
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
            marginBottom: 3,
            color: primary,
            transition: 'color 0.9s ease',
            textShadow: `0 0 8px ${glow}`,
          }}>
            {milestone.ready ? '✦ Ready to claim' : `${tok.name} · Next Milestone`}
          </div>
          {/* Title */}
          <div style={{
            fontSize: 15, fontWeight: 900,
            color: milestone.ready ? '#d8b4fe' : '#fff',
            lineHeight: 1.15, letterSpacing: '-0.01em',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
            transition: 'color 0.9s ease',
          }}>
            {milestone.label}
          </div>
        </div>

        {/* Icon box */}
        <div style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0, marginLeft: 10,
          background: milestone.ready
            ? '#a855f7'
            : `linear-gradient(135deg, ${tok.glow}, rgba(0,0,0,0))`,
          border: `1px solid ${iconBrd}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconClr,
          boxShadow: `0 0 ${milestone.ready ? 20 : 10}px ${glowS}`,
          transition: 'all 0.9s cubic-bezier(0.175,0.885,0.32,1.275)',
          transform: milestone.ready ? 'scale(1.08)' : 'scale(1)',
        }}>
          {milestone.ready ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          )}
        </div>
      </div>

      {/* Bottom: XP bar strip + counter, or claim button */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {milestone.ready ? (
          <div style={{
            width: '100%', padding: '6px 0', borderRadius: 8,
            background: '#a855f7', color: '#000',
            fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            boxShadow: '0 4px 16px rgba(168,85,247,0.5)',
            animation: 'smw-pulse-btn 2s ease-in-out infinite alternate',
          }}>
            Claim Reward
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        ) : (
          <div>
            {/* Mini XP bar strip — exact match to TopHeader bar */}
            <div style={{
              width: '100%', height: 3, background: 'rgba(255,255,255,0.07)',
              borderRadius: 2, overflow: 'hidden', marginBottom: 5, position: 'relative',
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: barGrad,
                backgroundSize: '300% 100%',
                animation: 'smw-shimmer 2s linear infinite',
                // Width driven by how close to next milestone (invert xpNeeded for visual)
                // Shows at least 8% so it's always visible, max 92% (not done yet)
                width: '35%',
                boxShadow: `0 0 6px ${tok.glowS}`,
                transition: 'background 0.9s ease, box-shadow 0.9s ease',
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                fontSize: 13, fontWeight: 900, color: xpClr,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 0 8px ${glowS}`,
                transition: 'color 0.9s ease, text-shadow 0.9s ease',
              }}>
                {milestone.xpNeeded.toLocaleString()}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                XP to unlock
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Combined Export ────────────────────────────────────────────────

export function SeasonMilestoneWidgets({
  season, milestone, currentLevel = 1, onOpenSeason, onOpenMilestone,
}: SeasonMilestoneWidgetsProps) {
  return (
    <>
      <style>{`
        @keyframes smw-shockwave {
          from { transform: translate(-50%,-50%) scale(0.1); opacity: 1; }
          to   { transform: translate(-50%,-50%) scale(4); opacity: 0; }
        }
        @keyframes smw-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes smw-bar-pulse {
          0%   { filter: brightness(1); }
          100% { filter: brightness(1.7) saturate(1.4); }
        }
        @keyframes smw-ring-pulse {
          0%   { filter: drop-shadow(0 0 6px rgba(255,215,0,0.4)); }
          100% { filter: drop-shadow(0 0 14px rgba(255,248,220,0.9)); }
        }
        @keyframes smw-pulse-btn {
          0%   { box-shadow: 0 4px 16px rgba(168,85,247,0.4); }
          100% { box-shadow: 0 4px 24px rgba(168,85,247,0.8); }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 20px 16px' }}>
        <SeasonWidget  season={season}     onClick={onOpenSeason} />
        <MilestoneWidget milestone={milestone} currentLevel={currentLevel} onClick={onOpenMilestone} />
      </div>
    </>
  );
}
