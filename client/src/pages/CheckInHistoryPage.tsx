/**
 * CheckInHistoryPage — "The Mat Record"
 *
 * Ported from labyrinth-bjj-history-final.html:
 *   - Bento dashboard: total classes + XP (full-width), this month mini, leaderboard link
 *   - 7-day Matrix Engine: animated bar chart + day pills + hover HUD
 *   - Timeline "Chronicle": themed nodes (gold/blue/emerald/purple) with
 *     expand-in-place telemetry grids, shockwave, energy beam, ambient light shift
 *   - Themes: gold=regular class, blue=tournament, emerald=achievement, purple=promotion
 *
 * All state is derived from existing getMemberCheckIns() API call.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMemberCheckIns, gasCall } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { createPortal } from 'react-dom';

// ─── Helpers ──────────────────────────────────────────────────────

const XP_PER_CLASS        = 10;
const XP_TOURNAMENT_GOLD  = 500;
const XP_TOURNAMENT_SILVER = 100;
const XP_TOURNAMENT_BRONZE = 75;
const XP_ACHIEVEMENT      = 150;
const XP_PROMOTION        = 200;

function getEntryXP(ci: any): number {
  const name = (ci.className || ci.class || ci.classType || '').toLowerCase();
  if (ci.type === 'tournament' || name.includes('tournament') || ci.placement) {
    const p = (ci.placement || '').toLowerCase();
    if (p.includes('gold') || p.includes('1st') || p === '1') return XP_TOURNAMENT_GOLD;
    if (p.includes('silver') || p.includes('2nd') || p === '2') return XP_TOURNAMENT_SILVER;
    if (p.includes('bronze') || p.includes('3rd') || p === '3') return XP_TOURNAMENT_BRONZE;
    return XP_TOURNAMENT_GOLD;
  }
  if (ci.type === 'achievement' || name.includes('achievement')) return XP_ACHIEVEMENT;
  if (ci.type === 'promotion' || name.includes('stripe') || name.includes('promotion')) return XP_PROMOTION;
  return XP_PER_CLASS;
}

function getNodeTheme(ci: any): 'gold' | 'blue' | 'emerald' | 'purple' {
  const name = (ci.className || ci.class || ci.classType || '').toLowerCase();
  if (ci.type === 'tournament' || name.includes('tournament') || ci.placement) return 'blue';
  if (ci.type === 'achievement' || name.includes('achievement')) return 'emerald';
  if (ci.type === 'promotion' || name.includes('stripe') || name.includes('promotion')) return 'purple';
  return 'gold';
}

function getEntryDate(ci: any): Date {
  return new Date(ci.timestamp || ci.date || ci.checkInDate || ci.classDate || 0);
}

function formatDateLabel(d: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  if (diffDays < 14) return 'Last Week';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── Theme palette ─────────────────────────────────────────────────

const THEMES = {
  gold:    { color: '#e8af34', glow: 'rgba(232,175,52,0.4)',   border: 'rgba(232,175,52,0.4)',  bg: 'rgba(232,175,52,0.05)',   title: '#e8af34',  beamEnd: '#fef08a',  ambientGlow: 'rgba(232,175,52,0.4)',   subtitle: 'Your Journey' },
  blue:    { color: '#3b82f6', glow: 'rgba(59,130,246,0.5)',   border: 'rgba(59,130,246,0.4)',  bg: 'rgba(59,130,246,0.05)',   title: '#93c5fd',  beamEnd: '#93c5fd',  ambientGlow: 'rgba(59,130,246,0.5)',   subtitle: 'Tournament Glory' },
  emerald: { color: '#10b981', glow: 'rgba(16,185,129,0.5)',   border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.05)',   title: '#6ee7b7',  beamEnd: '#6ee7b7',  ambientGlow: 'rgba(16,185,129,0.5)',   subtitle: 'Achievement Unlocked' },
  purple:  { color: '#a855f7', glow: 'rgba(168,85,247,0.5)',   border: 'rgba(168,85,247,0.4)',  bg: 'rgba(168,85,247,0.05)',   title: '#d8b4fe',  beamEnd: '#d8b4fe',  ambientGlow: 'rgba(168,85,247,0.5)',   subtitle: 'Epic Milestone' },
};

// ─── Bar color helper ──────────────────────────────────────────────

function barColor(ci: any): 'gold' | 'blue' | 'emerald' {
  const t = getNodeTheme(ci);
  if (t === 'blue') return 'blue';
  if (t === 'emerald') return 'emerald';
  return 'gold';
}

const BAR_GRADIENTS = {
  gold:    'linear-gradient(180deg, rgba(254,240,138,0.8), rgba(232,175,52,0.8))',
  blue:    'linear-gradient(180deg, rgba(147,197,253,0.8), rgba(59,130,246,0.8))',
  emerald: 'linear-gradient(180deg, rgba(110,231,183,0.8), rgba(16,185,129,0.8))',
};
const BAR_SHADOWS = {
  gold:    '0 0 16px rgba(232,175,52,0.4)',
  blue:    '0 0 16px rgba(59,130,246,0.5)',
  emerald: '0 0 16px rgba(16,185,129,0.5)',
};

// ─── 7-day Matrix chart data ────────────────────────────────────────

function build7DayData(checkIns: any[]) {
  const days: { letter: string; date: Date; classes: any[]; xp: number; label: string; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const letter = ['S','M','T','W','T','F','S'][d.getDay()];
    days.push({ letter, date: d, classes: [], xp: 0, label: '', isToday: i === 0 });
  }
  checkIns.forEach(ci => {
    const d = getEntryDate(ci);
    const dayIdx = days.findIndex(day => {
      const dDay = new Date(d); dDay.setHours(0, 0, 0, 0);
      return dDay.getTime() === day.date.getTime();
    });
    if (dayIdx >= 0) {
      days[dayIdx].classes.push(ci);
      days[dayIdx].xp += getEntryXP(ci);
    }
  });
  days.forEach(d => {
    if (d.classes.length === 0) d.label = 'Rest Day';
    else if (d.classes.length >= 2) d.label = 'Double Day';
    else d.label = d.classes[0].className || d.classes[0].class || 'Class';
  });
  const maxXP = Math.max(1, ...days.map(d => d.xp));
  return days.map(d => ({ ...d, heightPct: Math.max(0, (d.xp / maxXP) * 100) }));
}

// ─── Animated counter ──────────────────────────────────────────────

function useCountUp(target: number, duration = 1500, delay = 200) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = Date.now() + delay;
    const from = value;
    const tick = () => {
      const now = Date.now();
      if (now < start) { requestAnimationFrame(tick); return; }
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return value;
}

// ─── Main Component ─────────────────────────────────────────────────

export default function CheckInHistoryPage() {
  const { member } = useAuth();
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNodeIdx, setActiveNodeIdx] = useState<number | null>(null);
  const [hudData, setHudData] = useState<{ xp: number; label: string; x: number; y: number } | null>(null);
  const [ambientTheme, setAmbientTheme] = useState<keyof typeof THEMES>('gold');
  const [activeSubtitle, setActiveSubtitle] = useState('Your Journey');
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [energyHeight, setEnergyHeight] = useState(0);
  const [shockwaveActive, setShockwaveActive] = useState<number | null>(null);

  useEffect(() => {
    getMemberCheckIns().then((data: any[]) => {
      const seen = new Set<string>();
      const deduped = data.filter((ci: any) => {
        const dateStr = (ci.timestamp || ci.date || ci.checkInDate || ci.classDate || '').toString();
        const day = dateStr.split('T')[0] || dateStr.split(' ')[0] || '';
        const key = (ci.className || ci.class || ci.classType || '') + '|' + day;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const sorted = [...deduped].sort((a, b) =>
        getEntryDate(b).getTime() - getEntryDate(a).getTime()
      );
      setCheckIns(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Derived stats
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCount = checkIns.filter(c => getEntryDate(c) >= thisMonthStart).length;
  const totalXP = (() => {
    try {
      const cached = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      return Math.max(cached.xp || 0, cached.totalXP || 0, checkIns.reduce((s, c) => s + getEntryXP(c), 0));
    } catch { return checkIns.reduce((s, c) => s + getEntryXP(c), 0); }
  })();
  const weekData = build7DayData(checkIns);
  const weekXPTotal = weekData.reduce((s, d) => s + d.xp, 0);

  const displayTotal = useCountUp(loading ? 0 : checkIns.length, 1400, 300);
  const displayXP    = useCountUp(loading ? 0 : weekXPTotal, 1600, 400);
  const displayMonth = useCountUp(loading ? 0 : thisMonthCount, 1200, 350);

  // Toggle node expansion
  const toggleNode = useCallback((idx: number) => {
    if (activeNodeIdx === idx) {
      setActiveNodeIdx(null);
      setEnergyHeight(0);
      setAmbientTheme('gold');
      setActiveSubtitle('Your Journey');
      return;
    }
    setActiveNodeIdx(idx);
    setShockwaveActive(idx);
    setTimeout(() => setShockwaveActive(null), 900);

    const ci = checkIns[idx];
    const theme = getNodeTheme(ci);
    setAmbientTheme(theme);
    setActiveSubtitle(THEMES[theme].subtitle);

    // Measure dot top for energy beam
    const dot = dotRefs.current[idx];
    if (dot && containerRef.current) {
      const dotRect = dot.getBoundingClientRect();
      const contRect = containerRef.current.getBoundingClientRect();
      setEnergyHeight(dotRect.top - contRect.top + 14);
    }
  }, [activeNodeIdx, checkIns]);

  const tc = THEMES[ambientTheme];

  return (
    <>
      <style>{`
        @keyframes ch-stagger-in {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ch-shockwave {
          from { transform: scale(0.2); opacity: 1; }
          to   { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ch-bar-in {
          from { height: 0 !important; }
        }
        @keyframes ch-energy-pulse {
          0%,100% { filter: blur(1px) brightness(1); }
          50% { filter: blur(1.5px) brightness(1.3); }
        }
        .ch-stagger-1 { animation: ch-stagger-in 1s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .ch-stagger-2 { animation: ch-stagger-in 1s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .ch-stagger-3 { animation: ch-stagger-in 1s cubic-bezier(0.16,1,0.3,1) 0.20s both; }

        /* Bento cards */
        .ch-bento {
          position: relative; overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s !important;
        }
        .ch-bento::after {
          content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none;
          background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.09) 0%, transparent 55%);
          opacity: 0; transition: opacity 0.4s;
          border-radius: inherit;
        }
        .ch-bento:hover { transform: translateY(-3px) scale(1.015); border-color: rgba(255,255,255,0.18) !important; z-index: 20;
          box-shadow: 0 24px 48px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.18) !important; }
        .ch-bento:hover::after { opacity: 1; }
        .ch-bento:active { transform: translateY(0) scale(0.97) !important; }

        /* Bento icon */
        .ch-bento:hover .ch-bento-icon { transform: scale(1.12) rotate(-5deg) !important; background: rgba(255,255,255,0.15) !important; }
        .ch-bento.ch-lb:hover .ch-bento-icon { transform: scale(1.12) rotate(-5deg) !important; background: #e8af34 !important; color: #000 !important; box-shadow: 0 4px 12px rgba(232,175,52,0.5) !important; }

        /* Bar chart */
        .ch-bar-wrap:hover .ch-track { background: rgba(255,255,255,0.06) !important; border-color: rgba(255,255,255,0.12) !important; }
        .ch-bar-wrap:hover .ch-bar { transform: scaleY(1.06); filter: brightness(1.25); }

        /* Timeline */
        .ch-node-card:hover { background: rgba(255,255,255,0.025) !important; }
        .ch-day-pill:hover { transform: translateY(-3px) !important; }

        /* Energy beam pulse */
        .ch-energy-beam { animation: ch-energy-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="app-content" style={{ background: '#020202', paddingBottom: 80, overflowX: 'hidden', position: 'relative' }}>

        {/* Ambient light */}
        <div style={{
          position: 'fixed', top: '-20vh', left: '50%', transform: 'translateX(-50%)',
          width: '150vw', height: '70vh', pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${tc.ambientGlow} 0%, transparent 60%)`,
          opacity: 0.45, transition: 'background 0.8s ease, opacity 0.8s ease',
        }} />

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 24px', position: 'relative', zIndex: 10 }} ref={containerRef}>

          {/* ── Header ── */}
          <div className="ch-stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: tc.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4, transition: 'color 0.5s' }}>
                {activeSubtitle}
              </p>
              <h1 style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                The Mat Record
              </h1>
            </div>
            <a href="/#/" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', textDecoration: 'none', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </a>
          </div>

          {/* ── Bento Grid ── */}
          <div className="ch-stagger-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 36 }}>

            {/* Full-width pulse card — border reacts to active theme */}
            <div style={{
              gridColumn: '1 / -1',
              background: `linear-gradient(160deg, ${tc.bg} 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid ${activeNodeIdx !== null ? tc.border : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 24, padding: 24,
              boxShadow: `0 16px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.08), 0 0 40px ${activeNodeIdx !== null ? tc.ambientGlow : 'transparent'}`,
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              transition: 'border-color 0.8s, box-shadow 0.8s, background 0.8s',
            }}>
              {/* Stats header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 0.9, fontVariantNumeric: 'tabular-nums' }}>
                    {loading ? '—' : displayTotal}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Total Classes</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 24, fontWeight: 800, color: tc.color, transition: 'color 0.8s', fontVariantNumeric: 'tabular-nums', textShadow: activeNodeIdx !== null ? `0 0 20px ${tc.glow}` : 'none' }}>
                    {loading ? '—' : `+${displayXP} XP`}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Last 7 Days</div>
                </div>
              </div>

              {/* 7-day Matrix Engine */}
              <div style={{ position: 'relative' }}>
                {/* Bars */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, height: 90, marginBottom: 8 }}>
                  {weekData.map((day, i) => {
                    const color = day.classes.length > 0 ? barColor(day.classes[0]) : 'none';
                    const isRest = day.classes.length === 0;
                    return (
                      <div
                        key={i}
                        className="ch-bar-wrap"
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}
                        onMouseEnter={e => {
                          if (isRest) return;
                          const rect = (e.currentTarget as HTMLElement).closest('[data-matrix]')?.getBoundingClientRect();
                          const thisRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setHudData({ xp: day.xp, label: day.label, x: thisRect.left + thisRect.width / 2, y: thisRect.top - 10 });
                        }}
                        onMouseLeave={() => setHudData(null)}
                      >
                        {/* Track */}
                        <div className="ch-track" style={{
                          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                          width: '100%', height: '100%',
                          background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                          border: '1px dashed rgba(255,255,255,0.05)',
                          transition: 'background 0.3s, border-color 0.3s',
                        }} />
                        {/* Bar */}
                        <div
                          className="ch-bar"
                          style={{
                            width: '100%', borderRadius: 8, zIndex: 2,
                            height: `${day.heightPct}%`,
                            background: isRest ? 'rgba(255,255,255,0.04)' : BAR_GRADIENTS[color as keyof typeof BAR_GRADIENTS],
                            boxShadow: isRest ? 'none' : BAR_SHADOWS[color as keyof typeof BAR_SHADOWS],
                            borderTop: isRest ? 'none' : '1px solid rgba(255,255,255,0.2)',
                            inset: 0,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            transition: 'transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275), filter 0.2s',
                            animation: `ch-bar-in 1.2s cubic-bezier(0.34,1.56,0.64,1) ${0.5 + i * 0.08}s both`,
                          } as React.CSSProperties}
                        >
                          {/* Hatching overlay */}
                          {!isRest && (
                            <div style={{
                              position: 'absolute', inset: 0, opacity: 0.15, mixBlendMode: 'overlay',
                              backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 1px,transparent 1px,transparent 4px)',
                            }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day pills */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }} data-matrix>
                  {weekData.map((day, i) => (
                    <div
                      key={i}
                      className="ch-day-pill"
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        padding: '6px 0', borderRadius: 10,
                        background: day.isToday ? 'rgba(232,175,52,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${day.isToday ? '#e8af34' : 'rgba(255,255,255,0.04)'}`,
                        boxShadow: day.isToday ? '0 4px 12px rgba(232,175,52,0.4)' : 'none',
                        transform: day.isToday ? 'translateY(-2px)' : 'none',
                        transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 800, color: day.isToday ? '#e8af34' : 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{day.letter}</div>
                      <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 11, fontWeight: 900, color: day.isToday ? '#e8af34' : '#fff', opacity: day.xp > 0 ? 1 : 0.3 }}>
                        {day.xp > 0 ? day.xp : '·'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* This Month mini */}
            <div
              className="ch-bento"
              onMouseMove={e => { const r=(e.currentTarget as HTMLElement).getBoundingClientRect(); (e.currentTarget as HTMLElement).style.setProperty('--mx',`${((e.clientX-r.left)/r.width*100)}%`); (e.currentTarget as HTMLElement).style.setProperty('--my',`${((e.clientY-r.top)/r.height*100)}%`); }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 24, padding: 20,
                boxShadow: '0 16px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div className="ch-bento-icon" style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: 12, transition: 'all 0.3s' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {loading ? '—' : displayMonth}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>This Month</div>
              </div>
            </div>

            {/* Leaderboard link */}
            <a
              href="/#/leaderboard"
              className="ch-bento ch-lb"
              onMouseMove={e => { const r=(e.currentTarget as HTMLElement).getBoundingClientRect(); (e.currentTarget as HTMLElement).style.setProperty('--mx',`${((e.clientX-r.left)/r.width*100)}%`); (e.currentTarget as HTMLElement).style.setProperty('--my',`${((e.clientY-r.top)/r.height*100)}%`); }}
              style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 24, padding: 20,
                boxShadow: '0 16px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                cursor: 'pointer', textDecoration: 'none',
              }}
            >
              <div className="ch-bento-icon" style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(232,175,52,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8af34', marginBottom: 12, transition: 'all 0.3s' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                  <path d="M8 21h8M12 17v4M7 4h10M5 4h14v5a7 7 0 0 1-14 0V4z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>Rank</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e8af34' }}>Leaderboard →</div>
              </div>
            </a>
          </div>

          {/* ── Chronicle Timeline ── */}
          {!loading && checkIns.length > 0 && (
            <div className="ch-stagger-3">
              {/* Section label */}
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                Chronicle
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)' }} />
              </div>

              {/* Timeline */}
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                {/* Track */}
                <div style={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />

                {/* Energy beam */}
                <div className={activeNodeIdx !== null ? 'ch-energy-beam' : ''} style={{
                  position: 'absolute', left: -1, top: 20, width: 4,
                  height: activeNodeIdx !== null ? energyHeight : 0,
                  background: `linear-gradient(180deg, transparent, ${tc.color}, ${tc.beamEnd})`,
                  filter: 'blur(1px)', borderRadius: 2,
                  transition: 'height 0.6s cubic-bezier(0.175,0.885,0.32,1.275), background 0.6s',
                  zIndex: 1,
                }} />

                {/* Nodes */}
                {checkIns.map((ci, i) => {
                  const theme = getNodeTheme(ci);
                  const t = THEMES[theme];
                  const isActive = activeNodeIdx === i;
                  const isDimmed = activeNodeIdx !== null && !isActive;
                  const xp = getEntryXP(ci);
                  const date = getEntryDate(ci);
                  const name = ci.className || ci.class || ci.classType || 'Class';
                  const isTournament = theme === 'blue';
                  const isAchievement = theme === 'emerald';
                  const isPromotion = theme === 'purple';

                  return (
                    <div
                      key={i}
                      ref={el => { nodeRefs.current[i] = el; }}
                      style={{
                        position: 'relative', marginBottom: 24,
                        opacity: isDimmed ? 0.2 : 1,
                        filter: isDimmed ? 'grayscale(100%)' : 'none',
                        transition: 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.5s',
                      }}
                    >
                      {/* Dot */}
                      <div
                        ref={el => { dotRefs.current[i] = el; }}
                        onClick={() => toggleNode(i)}
                        style={{
                          position: 'absolute', left: -30, top: 18,
                          width: 14, height: 14, borderRadius: '50%', zIndex: 2,
                          background: isActive ? t.color : '#020202',
                          border: `2px solid ${isActive ? t.color : 'rgba(255,255,255,0.15)'}`,
                          boxShadow: isActive ? `0 0 24px ${t.glow}` : 'none',
                          transform: isActive ? 'scale(1.4)' : 'scale(1)',
                          transition: 'all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                          cursor: 'pointer',
                        }}
                      />

                      {/* Shockwave */}
                      {shockwaveActive === i && (
                        <div style={{
                          position: 'absolute', left: -46, top: 2, width: 46, height: 46,
                          pointerEvents: 'none', zIndex: 1,
                          animation: 'ch-shockwave 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
                          transformOrigin: 'center',
                        }}>
                          <svg viewBox="0 0 100 100" width="46" height="46">
                            <circle cx="50" cy="50" r="40" fill="none" stroke={t.color} strokeWidth="2" />
                          </svg>
                        </div>
                      )}

                      {/* Card */}
                      <div
                        className="ch-node-card"
                        onClick={() => toggleNode(i)}
                        style={{
                          borderRadius: 18, padding: '14px 16px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          cursor: 'pointer',
                          border: `1px solid ${isActive ? t.border : 'transparent'}`,
                          background: isActive ? t.bg : 'transparent',
                          transform: isActive ? 'translateX(12px) scale(1.02)' : 'none',
                          boxShadow: isActive ? `0 20px 40px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.08), 0 0 24px ${t.glow}` : 'none',
                          transition: 'all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                          transformOrigin: 'left center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{
                            fontSize: 16, fontWeight: 800,
                            color: isActive ? t.title : '#fff',
                            textShadow: isActive ? `0 0 12px ${t.glow}` : 'none',
                            transition: 'color 0.4s, text-shadow 0.4s',
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            {name}
                            {/* Icon for special types */}
                            {isTournament && (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            )}
                            {isAchievement && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              </svg>
                            )}
                          </div>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: isActive ? t.title : 'rgba(255,255,255,0.5)',
                            opacity: isActive ? 0.85 : 1,
                            transition: 'color 0.4s',
                          }}>
                            {formatDateLabel(date)}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)",
                          fontSize: isActive ? 20 : 18, fontWeight: 900,
                          color: isActive ? t.color : 'rgba(255,255,255,0.3)',
                          textShadow: isActive ? `0 0 20px ${t.glow}` : 'none',
                          transition: 'all 0.4s', fontVariantNumeric: 'tabular-nums',
                          transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        }}>
                          +{xp} XP
                        </div>
                      </div>

                      {/* Expandable telemetry */}
                      <div style={{
                        height: isActive ? 'auto' : 0,
                        overflow: 'hidden',
                        paddingLeft: 16, paddingRight: 0,
                        transition: 'height 0.5s cubic-bezier(0.34,1.2,0.64,1)',
                      }}>
                        {isActive && (
                          <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
                            background: 'rgba(255,255,255,0.05)', borderRadius: 16,
                            overflow: 'hidden', border: `1px solid ${t.border}`,
                            marginTop: 12, marginBottom: 12,
                            boxShadow: '0 12px 24px rgba(0,0,0,0.5)',
                            animation: 'ch-stagger-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.05s both',
                          }}>
                            <div style={{ background: '#020202', padding: 14 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Date</div>
                              <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{formatFullDate(date)}</div>
                            </div>
                            <div style={{ background: '#020202', padding: 14 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>XP Gained</div>
                              <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 18, fontWeight: 900, color: t.color }}>+{xp} XP</div>
                            </div>
                            {ci.instructor && (
                              <div style={{ background: '#020202', padding: 14 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Instructor</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{ci.instructor}</div>
                              </div>
                            )}
                            <div style={{ background: '#020202', padding: 14 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Class #</div>
                              <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>#{checkIns.length - i} of {checkIns.length}</div>
                            </div>
                            {isTournament && ci.placement && (
                              <div style={{ background: '#020202', padding: 14, gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Result</div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.bg, border: `1px solid ${t.border}`, color: t.title, padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 800 }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                                  {ci.placement}
                                </div>
                              </div>
                            )}
                            {isPromotion && ci.belt && (
                              <div style={{ background: '#020202', padding: 14 }}>
                                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Belt</div>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize' }}>{ci.belt} Belt</div>
                              </div>
                            )}
                            <div style={{ background: '#020202', padding: 14 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</div>
                              <div style={{ display: 'inline-block', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#10b981', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Logged</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ height: 56, background: 'rgba(255,255,255,0.03)', borderRadius: 16, opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && checkIns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>No classes yet</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>Check in to your first class and your chronicle will begin.</p>
              <a href="/#/schedule" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', borderRadius: 12, background: 'rgba(232,175,52,0.1)', border: '1px solid rgba(232,175,52,0.2)', color: '#e8af34', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                View Schedule
              </a>
            </div>
          )}

        </div>
      </div>

      {/* Hover HUD portal */}
      {hudData && createPortal(
        <div style={{
          position: 'fixed', left: hudData.x, top: hudData.y,
          transform: 'translate(-50%, -100%)',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '6px 10px', borderRadius: 8,
          pointerEvents: 'none', zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 15, fontWeight: 900, color: '#fff' }}>+{hudData.xp} XP</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{hudData.label}</div>
        </div>,
        document.body
      )}
    </>
  );
}
