/**
 * CheckInWidget — the main dashboard next-class card
 *
 * Matches the HTML design exactly:
 *   - Dark card with dot-grid map overlay
 *   - Animated check-in button (shimmer sweep + breathe glow)
 *   - 3 intensity states tied to classesToday (0→1 green, 1→2 blue, 2→3 red/savage)
 *   - Particle burst + card shake on check-in
 *   - Floating countdown, daily tracker fraction, eyebrow label
 *   - State persists via props from HomePage (classesToday, checkinPhase)
 */

import React, { useEffect, useRef } from 'react';

interface CheckInWidgetProps {
  nextClass: {
    name: string;
    time: string;
    day: string;
    dayLabel?: string;
    type?: string;
    category?: string;
    isToday?: boolean;
    instructor?: string;
  } | null;
  classesToday: number;           // 0, 1, 2, 3
  timeUntilClass: string;         // e.g. "15m" or ""
  checkinPhase: 'idle' | 'pressing' | 'success' | 'done';
  alreadyCheckedIn: boolean;
  isGameDay: boolean;
  onCheckIn: () => void;
  onOpenSchedule: () => void;
}

// State definitions matching HTML
const STATES = [
  { // not checked in yet
    checkinState: null,
    eyebrow: 'Next Up',
    trackerLabel: 'Daily Training',
    fraction: (n: number) => `${n}/1`,
    btnText: 'Check In',
    btnStyle: { background: 'linear-gradient(135deg, #e8af34, #ca8a04)', borderColor: '#fef08a', color: '#000' },
  },
  { // 1 class done
    checkinState: 'state-1',
    eyebrow: 'YOU ARE SET',
    trackerLabel: 'Daily Training',
    fraction: () => '1/1',
    btnText: 'CHECKED IN',
    btnStyle: { background: 'linear-gradient(135deg, #22c55e, #15803d)', borderColor: '#4ade80', color: '#fff' },
  },
  { // 2 classes done
    checkinState: 'state-2',
    eyebrow: 'DOUBLE HEADER',
    trackerLabel: 'Double Header',
    fraction: () => '2/2',
    btnText: 'CHECKED IN',
    btnStyle: { background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', borderColor: '#38bdf8', color: '#fff' },
  },
  { // 3 classes — savage
    checkinState: 'state-3',
    eyebrow: 'UNSTOPPABLE',
    trackerLabel: 'Savage Mode',
    fraction: () => 'SAVAGE',
    btnText: 'SAVAGE COMPLETE',
    btnStyle: { background: 'linear-gradient(135deg, #ef4444, #991b1b)', borderColor: '#f87171', color: '#fff' },
  },
];

const TYPE_TAG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  gi:        { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: 'rgba(14,165,233,0.2)', label: 'Gi' },
  nogi:      { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.2)',  label: 'No-Gi' },
  comp:      { bg: 'rgba(232,175,52,0.1)', color: '#e8af34', border: 'rgba(232,175,52,0.2)', label: 'Comp' },
  open:      { bg: 'rgba(200,162,76,0.08)',color: '#999',    border: 'rgba(200,162,76,0.15)',label: 'Open Mat' },
  wrestling: { bg: 'rgba(234,130,50,0.1)', color: '#ea8232', border: 'rgba(234,130,50,0.2)', label: 'Wrestling' },
};

export function CheckInWidget({
  nextClass, classesToday, timeUntilClass,
  checkinPhase, alreadyCheckedIn, isGameDay,
  onCheckIn, onOpenSchedule,
}: CheckInWidgetProps) {
  // collapsible removed — widget is always fully expanded
  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isCheckedIn = alreadyCheckedIn || checkinPhase === 'success' || checkinPhase === 'done';
  const stateIdx = Math.min(classesToday, 3);
  const state = STATES[isCheckedIn ? stateIdx : 0];

  // Card shake animation on check-in
  useEffect(() => {
    if (checkinPhase === 'success' && cardRef.current) {
      const card = cardRef.current;
      const isSavage = classesToday >= 3;
      let frame = 0;
      const maxFrames = isSavage ? 16 : 6;
      const amp = isSavage ? 10 : 4;
      const interval = setInterval(() => {
        frame++;
        card.style.transform = `translateX(${frame % 2 === 0 ? amp : -amp}px) translateY(${frame % 3 === 0 ? 3 : -1}px)`;
        if (frame >= maxFrames) {
          clearInterval(interval);
          card.style.transform = '';
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [checkinPhase]);

  // Particle burst
  const spawnParticles = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const color = stateIdx >= 2 ? '#ef4444' : stateIdx === 1 ? '#0ea5e9' : '#22c55e';
    const count = stateIdx >= 2 ? 50 : 20;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = stateIdx >= 2 ? Math.random() * 8 + 4 : Math.random() * 6 + 3;
      p.style.cssText = `
        position:fixed; width:${size}px; height:${size}px; border-radius:50%;
        background:${color}; box-shadow:0 0 12px ${color};
        pointer-events:none; z-index:9999;
        left:${cx}px; top:${cy}px; transform:translate(-50%,-50%);
      `;
      document.body.appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const v = (stateIdx >= 2 ? 120 : 60) + Math.random() * 100;
      const tx = cx + Math.cos(angle) * v;
      const ty = cy + Math.sin(angle) * v;
      p.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(${tx - cx}px - 50%), calc(${ty - cy}px - 50%)) scale(0)`, opacity: 0 },
      ], { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(0,0.5,0.5,1)', fill: 'forwards' })
        .onfinish = () => p.remove();
    }
  };

  if (!nextClass) return null;

  const typeTag = TYPE_TAG[nextClass.type || 'gi'] || TYPE_TAG.gi;
  const [timePart, ampm] = (nextClass.time || '').split(' ');

  // State-based card styling
  const cardStyles: React.CSSProperties = {
    background: 'linear-gradient(145deg, #0a0908 0%, #000 100%)',
    borderRadius: 24,
    padding: 24,
    border: isCheckedIn
      ? stateIdx >= 3 ? '1px solid rgba(239,68,68,0.8)'
        : stateIdx === 2 ? '1px solid rgba(14,165,233,0.5)'
        : '1px solid rgba(34,197,94,0.4)'
      : '1px solid rgba(255,255,255,0.06)',
    boxShadow: isCheckedIn
      ? stateIdx >= 3 ? '0 32px 64px -16px rgba(0,0,0,1), 0 0 80px rgba(239,68,68,0.3)'
        : stateIdx === 2 ? '0 32px 64px -16px rgba(0,0,0,1), 0 0 50px rgba(14,165,233,0.2)'
        : '0 32px 64px -16px rgba(0,0,0,1), 0 0 40px rgba(34,197,94,0.1)'
      : '0 32px 64px -16px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 0.5s, box-shadow 0.5s',
    animation: isCheckedIn && stateIdx >= 3 ? 'ciw-savage-pulse 1s infinite alternate' : undefined,
  };

  const glowColor = isCheckedIn
    ? stateIdx >= 3 ? 'rgba(239,68,68,0.3)' : stateIdx === 2 ? 'rgba(14,165,233,0.2)' : 'rgba(34,197,94,0.15)'
    : 'rgba(232,175,52,0.15)';

  const trackerBg = isCheckedIn
    ? stateIdx >= 3 ? 'linear-gradient(90deg, rgba(239,68,68,0.1), rgba(185,28,28,0.2))'
      : stateIdx === 2 ? 'rgba(14,165,233,0.05)'
      : 'rgba(34,197,94,0.05)'
    : 'rgba(255,255,255,0.03)';

  const trackerBorder = isCheckedIn
    ? stateIdx >= 3 ? 'rgba(239,68,68,0.5)' : stateIdx === 2 ? 'rgba(14,165,233,0.3)' : 'rgba(34,197,94,0.2)'
    : 'rgba(255,255,255,0.05)';

  const fractionColor = isCheckedIn
    ? stateIdx >= 3 ? '#ef4444' : stateIdx === 2 ? '#0ea5e9' : '#22c55e'
    : '#e8af34';

  const eyebrowColor = isCheckedIn
    ? stateIdx >= 3 ? '#ef4444' : stateIdx === 2 ? '#0ea5e9' : '#22c55e'
    : '#e8af34';

  const fractionText = isCheckedIn ? state.fraction(classesToday) : `${classesToday}/1`;
  const trackerLabel = isCheckedIn ? state.trackerLabel : STATES[0].trackerLabel;

  return (
    <>
      <style>{`
        @keyframes ciw-btn-breathe {
          0%   { box-shadow: 0 4px 16px rgba(232,175,52,0.3), inset 0 2px 2px rgba(255,255,255,0.6); }
          100% { box-shadow: 0 8px 24px rgba(232,175,52,0.6), inset 0 2px 2px rgba(255,255,255,0.8); }
        }
        @keyframes ciw-sweep {
          0%   { left: -100%; }
          20%  { left: 200%; }
          100% { left: 200%; }
        }
        @keyframes ciw-savage-pulse {
          0%   { box-shadow: 0 32px 64px -16px rgba(0,0,0,1), 0 0 60px rgba(239,68,68,0.2); }
          100% { box-shadow: 0 32px 64px -16px rgba(0,0,0,1), 0 0 100px rgba(239,68,68,0.4); }
        }
      `}</style>

      <div
        ref={cardRef}
        style={{ ...cardStyles, margin: '0 20px 16px' }}
        onClick={onOpenSchedule}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 0% 0%, ${glowColor} 0%, transparent 60%)`,
          opacity: isCheckedIn ? 1 : 0.5,
          pointerEvents: 'none',
          transition: 'background 1s, opacity 0.5s',
        }} />

        {/* Dot grid map overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 80%)',
        }} />


        {/* Header: eyebrow + time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-display, system-ui)', fontSize: 10, fontWeight: 800, color: eyebrowColor, letterSpacing: '0.2em', textTransform: 'uppercase', transition: 'color 0.5s' }}>
            {isCheckedIn
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
            }
            {isCheckedIn ? state.eyebrow : (isGameDay ? 'GAME DAY' : 'Next Up')}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {timePart}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#57534e', marginLeft: 2 }}>{ampm}</span>
          </div>
        </div>

        {/* Class title */}
        <div style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 8, position: 'relative', zIndex: 2, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
          {nextClass.name}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, position: 'relative', zIndex: 2, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: typeTag.bg, color: typeTag.color, border: `1px solid ${typeTag.border}` }}>
            {typeTag.label}
          </span>
          {nextClass.category === 'kids' && (
            <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
              Kids
            </span>
          )}
          {nextClass.instructor && (
            <span style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.04)', color: '#a8a29e', border: '1px solid rgba(255,255,255,0.08)' }}>
              w/ {nextClass.instructor}
            </span>
          )}
        </div>

        {/* Daily tracker bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 15px',
          background: trackerBg,
          border: `1px solid ${trackerBorder}`,
          borderRadius: 12, marginBottom: 14,
          transition: 'all 0.5s', position: 'relative', zIndex: 2,
        }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: isCheckedIn && stateIdx >= 3 ? '#fca5a5' : '#a8a29e',
            textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.5s',
            ...(isCheckedIn && stateIdx >= 3 ? { fontSize: 13, textShadow: '0 0 8px rgba(239,68,68,0.5)' } : {}),
          }}>
            {trackerLabel}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isCheckedIn ? fractionColor : 'transparent',
              border: `2px solid ${isCheckedIn ? fractionColor : '#57534e'}`,
              boxShadow: isCheckedIn ? `0 0 12px ${fractionColor}` : 'none',
              transition: 'all 0.5s',
            }} />
            <span style={{
              fontFamily: 'var(--font-display, system-ui)', fontWeight: 900,
              color: fractionColor,
              fontSize: isCheckedIn && stateIdx >= 3 ? 18 : 15,
              letterSpacing: isCheckedIn && stateIdx >= 3 ? '0.05em' : 0,
              textShadow: isCheckedIn ? `0 0 ${stateIdx >= 3 ? 12 : 8}px ${fractionColor}60` : 'none',
              transition: 'color 0.5s, text-shadow 0.5s, font-size 0.3s',
            }}>
              {fractionText}
            </span>
          </div>
        </div>

        {/* Action area: countdown + check-in button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative', zIndex: 2 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Countdown — always show for today's class */}
          {!isCheckedIn && nextClass.isToday && timeUntilClass && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#a8a29e', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Starts in <span style={{ color: '#e8af34', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{timeUntilClass}</span>
            </div>
          )}

          {/* Check-in button — show for today's class OR always show so user can check in to any class */}
          {(nextClass.isToday || true) && (
            <button
              ref={btnRef}
              onClick={(e) => {
                if (isCheckedIn) return;
                // Visual press-down: scale down briefly, then call onCheckIn
                // onCheckIn handles window check — if too early it shows the error
                // The particles only fire on actual success (CheckInWidget spawnParticles
                // is called from HomePage after the window check passes)
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.transform = 'scale(0.93)';
                btn.style.transition = 'transform 0.08s ease';
                setTimeout(() => {
                  btn.style.transform = '';
                  btn.style.transition = 'transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275)';
                  setTimeout(() => { btn.style.transition = ''; }, 220);
                }, 80);
                onCheckIn();
              }}
              style={{
                ...(isCheckedIn ? state.btnStyle : {
                  background: 'linear-gradient(135deg, #e8af34, #ca8a04)',
                  borderColor: '#fef08a',
                  color: '#000',
                }),
                border: '1px solid',
                borderRadius: 12,
                padding: '13px 24px',
                fontFamily: 'var(--font-display, system-ui)',
                fontSize: 15, fontWeight: 900,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: isCheckedIn ? 'default' : 'pointer',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
                flex: isCheckedIn || !timeUntilClass ? 1 : undefined,
                animation: !isCheckedIn ? 'ciw-btn-breathe 2s infinite alternate ease-in-out' : 'none',
                pointerEvents: isCheckedIn ? 'none' : 'auto',
                boxShadow: isCheckedIn && stateIdx >= 3
                  ? '0 4px 24px rgba(239,68,68,0.5)'
                  : isCheckedIn && stateIdx === 2
                    ? '0 4px 20px rgba(14,165,233,0.4)'
                    : isCheckedIn
                      ? '0 4px 16px rgba(34,197,94,0.4)'
                      : '0 4px 16px rgba(232,175,52,0.3), inset 0 2px 2px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {/* Sweep shimmer — only when idle */}
              {!isCheckedIn && (
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                  transform: 'skewX(-20deg)',
                  animation: 'ciw-sweep 3s infinite',
                }} />
              )}
              {/* Icon */}
              {isCheckedIn
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              }
              {isCheckedIn ? state.btnText : 'Check In'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
