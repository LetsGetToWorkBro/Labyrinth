/**
 * StatsCards — Dual gamified action cards
 *
 * Left:  Streak card — 4 tiers (1-2d / 3-4d / 5-6d / 7d)
 *        Tier upgrades swap icon + label + color, show multiplier badge, burst particles
 *
 * Right: Check-in card — 4 lifetime tiers (0-14 / 15-19 / 20-24 / 25+)
 *        Shows today's check-in state (success flash), floating +XP, milestone upgrade
 *        Radar pulse dot always active
 *
 * No GSAP dependency — all CSS transitions + React state with setTimeout chains
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldIcon } from '@/components/icons/LbjjIcons';

// ─── Streak tiers ─────────────────────────────────────────────────

const STREAK_TIERS = [
  {
    min: 1, max: 2, mult: 1, label: 'Building habit',
    color: '#e8af34', glow: 'rgba(232,175,52,0.15)', border: 'rgba(232,175,52,0.3)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
      </svg>
    ),
  },
  {
    min: 3, max: 4, mult: 1.5, label: 'On a roll 🔥',
    color: '#f97316', glow: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.35)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c0 0-4 4-4 8 0 3 2 5 4 8 2-3 4-5 4-8 0-4-4-8-4-8z"/>
        <path d="M12 18c-1.5-2-2-3-2-4.5 0-1.5 1-2.5 2-2.5s2 1 2 2.5c0 1.5-.5 2.5-2 4.5z"/>
      </svg>
    ),
  },
  {
    min: 5, max: 6, mult: 2, label: 'Perfect week 🏆',
    color: '#fde047', glow: 'rgba(253,224,71,0.2)', border: 'rgba(253,224,71,0.4)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M7 4h10M5 4h14v5a7 7 0 0 1-14 0V4z"/>
      </svg>
    ),
  },
  {
    min: 7, max: 7, mult: 3, label: 'Legendary 👑',
    color: '#a855f7', glow: 'rgba(168,85,247,0.25)', border: 'rgba(168,85,247,0.4)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
      </svg>
    ),
  },
];

// ─── Check-in lifetime tiers ──────────────────────────────────────

const CHECKIN_TIERS = [
  {
    min: 0, max: 14, label: 'Total classes', badge: '',
    color: 'rgba(255,255,255,0.92)', glow: 'rgba(255,255,255,0)', border: 'rgba(255,255,255,0.1)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    min: 15, max: 19, label: 'Committed', badge: 'Rank Up',
    color: '#38bdf8', glow: 'rgba(56,189,248,0.25)', border: 'rgba(56,189,248,0.4)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    min: 20, max: 24, label: 'Warrior', badge: 'Veteran',
    color: '#ef4444', glow: 'rgba(239,68,68,0.25)', border: 'rgba(239,68,68,0.4)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    min: 25, max: 9999, label: 'Mat Enforcer', badge: 'Elite',
    color: '#fde047', glow: 'rgba(253,224,71,0.25)', border: 'rgba(253,224,71,0.5)',
    icon: (c: string) => (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
];

function getStreakTier(streak: number) {
  return STREAK_TIERS.find(t => streak >= t.min && streak <= t.max) || STREAK_TIERS[0];
}
function getCheckinTier(classes: number) {
  return CHECKIN_TIERS.find(t => classes >= t.min && classes <= t.max) || CHECKIN_TIERS[0];
}

// ─── Particle burst ───────────────────────────────────────────────

function spawnParticles(container: HTMLElement, color: string, count = 8) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none; z-index:20;
      width:${Math.random() * 4 + 2}px; height:${Math.random() * 4 + 2}px;
      background:${color}; box-shadow:0 0 6px ${color};
      left:30px; top:30px; opacity:0;
    `;
    container.appendChild(p);
    const angle = (Math.PI * 2 / count) * i;
    const dist = Math.random() * 30 + 20;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${tx}px,${ty}px) scale(0)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 200, easing: 'cubic-bezier(0,0.5,0.5,1)', fill: 'forwards' })
      .onfinish = () => p.remove();
  }
}

// ─── Floating +XP ─────────────────────────────────────────────────

function spawnFloatingXP(x: number, y: number, amount: number, color: string, glow: string) {
  const el = document.createElement('div');
  el.textContent = `+${amount} XP`;
  el.style.cssText = `
    position:fixed; left:${x}px; top:${y}px;
    font-family:var(--font-display,'Cabinet Grotesk',system-ui);
    font-weight:900; font-size:26px; color:${color};
    text-shadow:0 4px 16px ${glow}, 0 4px 16px rgba(0,0,0,0.8);
    -webkit-text-stroke:1px rgba(255,255,255,0.1);
    pointer-events:none; z-index:9999; opacity:0;
    transform:translate(-50%,-50%);
  `;
  document.body.appendChild(el);
  el.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(0.7)' },
    { opacity: 1, transform: 'translate(-50%,-80%) scale(1.1)', offset: 0.4 },
    { opacity: 0, transform: 'translate(-50%,-130%) scale(0.9)' },
  ], { duration: 1100, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' })
    .onfinish = () => el.remove();
}

// ─── Props ────────────────────────────────────────────────────────

interface StatsCardsProps {
  streak: number;           // effectiveStreak (week streak count 0-7)
  totalClasses: number;     // all-time class count
  classesToday: number;     // how many check-ins today
  comboMultiplier: number;  // 1 / 1.5 / 2 / 3
  streakFreezeActive: boolean;
  onNavigate?: (path: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────

export function StatsCards({
  streak, totalClasses, classesToday, comboMultiplier, streakFreezeActive, onNavigate,
}: StatsCardsProps) {
  // Streak card state
  const streakTier = getStreakTier(Math.max(0, Math.min(streak, 7)));
  const [prevStreakTier, setPrevStreakTier] = useState(streakTier);
  const [streakIconVisible, setStreakIconVisible] = useState(true);
  const [streakLabelVisible, setStreakLabelVisible] = useState(true);
  const [streakBounce, setStreakBounce] = useState(false);
  const streakParticleRef = useRef<HTMLDivElement>(null);

  // Check-in card state
  const ciTier = getCheckinTier(totalClasses);
  const [prevCiTier, setPrevCiTier] = useState(ciTier);
  const [checkinBounce, setCheckinBounce] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(classesToday > 0);
  const [displayIconSuccess, setDisplayIconSuccess] = useState(false);
  const [ciIconVisible, setCiIconVisible] = useState(true);
  const [ciLabelVisible, setCiLabelVisible] = useState(true);
  const [displayClasses, setDisplayClasses] = useState(totalClasses);
  const ciParticleRef = useRef<HTMLDivElement>(null);

  // Animated class count (counting up on change)
  useEffect(() => {
    if (totalClasses === displayClasses) return;
    const start = displayClasses;
    const end = totalClasses;
    const duration = 500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayClasses(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [totalClasses]);

  // Animate icon swap when streak tier changes
  useEffect(() => {
    if (streakTier === prevStreakTier) return;
    setPrevStreakTier(streakTier);
    // Bounce
    setStreakBounce(true);
    setTimeout(() => setStreakBounce(false), 400);
    // Icon flip
    setStreakIconVisible(false);
    setTimeout(() => setStreakIconVisible(true), 220);
    // Label fade
    setStreakLabelVisible(false);
    setTimeout(() => setStreakLabelVisible(true), 220);
    // Particles
    if (streakParticleRef.current) spawnParticles(streakParticleRef.current, streakTier.color);
  }, [streakTier]);

  // Animate ci tier changes
  useEffect(() => {
    if (ciTier === prevCiTier) return;
    setPrevCiTier(ciTier);
    setCiIconVisible(false);
    setTimeout(() => setCiIconVisible(true), 220);
    setCiLabelVisible(false);
    setTimeout(() => setCiLabelVisible(true), 220);
    if (ciParticleRef.current) spawnParticles(ciParticleRef.current, ciTier.color, 12);
  }, [ciTier]);

  // Flash success state when classesToday changes
  const prevClassesToday = useRef(classesToday);
  useEffect(() => {
    if (classesToday > prevClassesToday.current) {
      // New check-in — flash success
      setIsCheckedIn(true);
      setCheckinBounce(true);
      setDisplayIconSuccess(true);
      setTimeout(() => setCheckinBounce(false), 400);
      // Revert after 1.2s
      setTimeout(() => {
        setDisplayIconSuccess(false);
        setCiIconVisible(false);
        setTimeout(() => setCiIconVisible(true), 220);
      }, 1200);
    }
    prevClassesToday.current = classesToday;
  }, [classesToday]);

  // Keep isCheckedIn in sync
  useEffect(() => {
    setIsCheckedIn(classesToday > 0);
  }, [classesToday]);

  const streakDots = Array.from({ length: 7 }, (_, i) => i < streak);

  return (
    <>
      <style>{`
        @keyframes sc-radar-pulse {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        @keyframes sc-bounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(0.93); }
          70%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes sc-icon-in {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg);  opacity: 1; }
        }
        @keyframes sc-label-in {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-badge-in {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .sc-action-card {
          background: linear-gradient(160deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%);
          border-radius: 18px; padding: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 12px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.4);
          display: flex; flex-direction: row; align-items: center;
          position: relative; overflow: hidden; cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s;
          -webkit-tap-highlight-color: transparent;
        }
        .sc-action-card:active { transform: scale(0.94) !important; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '0 20px 16px' }}>

        {/* ── Streak Card ── */}
        <a
          href="/#/history"
          className="sc-action-card"
          style={{
            borderColor: streakTier.border,
            boxShadow: `0 12px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 20px ${streakTier.glow}`,
            animation: streakBounce ? 'sc-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
            textDecoration: 'none',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 90, height: 90,
            borderRadius: '50%', background: streakTier.glow,
            filter: 'blur(28px)', pointerEvents: 'none', zIndex: 0,
          }} />

          {/* Particle canvas */}
          <div ref={streakParticleRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }} />

          {/* Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginRight: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${streakTier.glow}, rgba(0,0,0,0.2))`,
            border: `1px solid ${streakTier.border}`,
            boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15)`,
            position: 'relative', zIndex: 2, transition: 'background 0.5s, border-color 0.5s',
            animation: streakIconVisible ? 'sc-icon-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
          }}>
            {streakIconVisible && streakTier.icon(streakTier.color)}
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, zIndex: 2 }}>
            {/* Value + multiplier badge */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
              <span style={{
                fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)",
                fontSize: 26, fontWeight: 900,
                color: streakFreezeActive ? '#C8A24C' : '#fff',
                lineHeight: 1, letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
                textShadow: streak >= 3 ? `0 0 16px ${streakTier.color}60` : 'none',
                transition: 'text-shadow 0.5s',
              }}>
                {streak}
              </span>
              {streakFreezeActive && (
                <ShieldIcon size={12} color="#C8A24C" />
              )}
              {streakTier.mult > 1 && (
                <span style={{
                  background: 'rgba(0,0,0,0.4)', border: `1px solid ${streakTier.border}`,
                  color: streakTier.color, fontSize: 11, fontWeight: 900,
                  padding: '2px 6px', borderRadius: 6, letterSpacing: '0.05em',
                  boxShadow: `0 2px 8px ${streakTier.glow}`,
                  animation: 'sc-badge-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                  {streakTier.mult}×
                </span>
              )}
            </div>

            {/* Label */}
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.1, marginBottom: 6,
              animation: streakLabelVisible ? 'sc-label-in 0.3s ease both' : undefined,
              opacity: streakLabelVisible ? 1 : 0,
            }}>
              {streakTier.label}
            </div>

            {/* 7 dots */}
            <div style={{ display: 'flex', gap: 3 }}>
              {streakDots.map((filled, i) => (
                <div key={i} style={{
                  width: 4, height: 4, borderRadius: 2,
                  background: filled ? streakTier.color : 'rgba(255,255,255,0.1)',
                  boxShadow: filled ? `0 0 6px ${streakTier.color}` : 'none',
                  transition: 'background 0.4s, box-shadow 0.4s',
                }} />
              ))}
            </div>
          </div>
        </a>

        {/* ── Check-in Card ── */}
        <a
          href="/#/history"
          className="sc-action-card"
          style={{
            borderColor: isCheckedIn ? 'rgba(34,197,94,0.4)' : ciTier.border,
            background: isCheckedIn
              ? 'linear-gradient(160deg, rgba(34,197,94,0.12) 0%, rgba(255,255,255,0.025) 100%)'
              : 'linear-gradient(160deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.025) 100%)',
            boxShadow: isCheckedIn
              ? `0 12px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1), 0 0 24px rgba(34,197,94,0.15)`
              : `0 12px 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)`,
            animation: checkinBounce ? 'sc-bounce 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
            textDecoration: 'none',
            transition: 'border-color 0.4s, box-shadow 0.4s, background 0.4s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 90, height: 90,
            borderRadius: '50%',
            background: isCheckedIn ? 'rgba(34,197,94,0.2)' : ciTier.glow,
            filter: 'blur(28px)', pointerEvents: 'none', zIndex: 0,
            opacity: isCheckedIn ? 0.8 : 0.6,
            transition: 'background 0.5s, opacity 0.5s',
          }} />

          {/* Particle canvas */}
          <div ref={ciParticleRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 10 }} />

          {/* Icon with radar pulse dot */}
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginRight: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isCheckedIn
              ? 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.1))'
              : `linear-gradient(135deg, ${ciTier.glow}, rgba(0,0,0,0.2))`,
            border: `1px solid ${isCheckedIn ? 'rgba(34,197,94,0.4)' : ciTier.border}`,
            boxShadow: isCheckedIn
              ? '0 6px 16px rgba(34,197,94,0.25)'
              : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15)',
            position: 'relative', zIndex: 2,
            transition: 'background 0.5s, border-color 0.5s, box-shadow 0.5s',
            animation: ciIconVisible ? 'sc-icon-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
          }}>
            {/* Radar pulse dot */}
            {!isCheckedIn && (
              <div style={{
                position: 'absolute', top: -3, right: -3,
                width: 10, height: 10, borderRadius: '50%',
                background: streakTier.color,
                boxShadow: `0 0 8px ${streakTier.color}`,
                zIndex: 5,
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: streakTier.color,
                  animation: 'sc-radar-pulse 2s cubic-bezier(0.16,1,0.3,1) infinite',
                }} />
              </div>
            )}

            {/* Icon — success check or normal */}
            {ciIconVisible && (
              displayIconSuccess ? (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                ciTier.icon(isCheckedIn ? '#22c55e' : ciTier.color)
              )
            )}
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, zIndex: 2 }}>
            {/* Total count */}
            <div style={{
              fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)",
              fontSize: 26, fontWeight: 900,
              color: isCheckedIn ? '#22c55e' : '#fff',
              lineHeight: 1, marginBottom: 2,
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              textShadow: isCheckedIn ? '0 0 20px rgba(34,197,94,0.4)' : 'none',
              transition: 'color 0.4s, text-shadow 0.4s',
            }}>
              {displayClasses}
            </div>

            {/* Label */}
            <div style={{
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.1, marginBottom: ciTier.badge ? 4 : 0,
              animation: ciLabelVisible ? 'sc-label-in 0.3s ease both' : undefined,
              opacity: ciLabelVisible ? 1 : 0,
              transition: 'opacity 0.3s',
            }}>
              {ciTier.label}
            </div>

            {/* Today chip */}
            {classesToday > 0 && !ciTier.badge && (
              <div style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, lineHeight: 1 }}>
                +{classesToday} today
              </div>
            )}

            {/* Milestone badge */}
            {ciTier.badge && (
              <span style={{
                display: 'inline-block', width: 'fit-content',
                background: 'rgba(0,0,0,0.4)', border: `1px solid ${ciTier.border}`,
                color: ciTier.color, fontSize: 10, fontWeight: 800,
                padding: '2px 6px', borderRadius: 4, letterSpacing: '0.05em',
                textTransform: 'uppercase',
                animation: 'sc-badge-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
              }}>
                {ciTier.badge}
              </span>
            )}
          </div>
        </a>

      </div>
    </>
  );
}
