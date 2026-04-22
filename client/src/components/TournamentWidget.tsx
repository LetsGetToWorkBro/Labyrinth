/**
 * TournamentWidget — exact port of labyrinth-bjj-tournament-today.html
 *
 * Three automatic states driven by daysUntil:
 *   > 1 day  → default (gold badge, countdown number, Directions + Bracket buttons)
 *   1 day    → urgent (red border pulse, red badge "Tournament Tomorrow", 1 Day Out)
 *   0 days   → today/battle (gold border pulse, scanline, "NOW" / "On The Mat",
 *               particle burst on first render, "Open Live Brackets" CTA)
 *
 * No GSAP — all CSS keyframes + Web Animations API for the particle burst.
 */

import React, { useEffect, useRef, useState } from 'react';

export interface TournamentWidgetProps {
  name: string;
  date: string;           // ISO date string e.g. "2026-05-01"
  location?: string;
  link?: string;          // bracket / registration URL
}

function spawnParticles(container: HTMLElement) {
  const colors = ['#fef08a', '#ffffff', '#e8af34'];
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 5 + 2;
    Object.assign(p.style, {
      position: 'absolute',
      top: '20%',
      right: '10%',
      width: `${size}px`,
      height: `${size}px`,
      background: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: '50%',
      boxShadow: `0 0 12px #fef08a`,
      pointerEvents: 'none',
      zIndex: '20',
    });
    container.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const v = 50 + Math.random() * 80;
    p.animate(
      [
        { transform: 'translate(0,0)', opacity: '1' },
        { transform: `translate(${Math.cos(angle) * v}px,${Math.sin(angle) * v}px)`, opacity: '0' },
      ],
      { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(0,0.5,0.5,1)', fill: 'forwards' }
    ).onfinish = () => p.remove();
  }
}

export function TournamentWidget({ name, date, location, link }: TournamentWidgetProps) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const particleRef = useRef<HTMLDivElement>(null);
  const particlesFired = useRef(false);

  // Compute days until tournament (calendar days, same as existing logic)
  const daysUntil = Math.max(
    0,
    Math.ceil((new Date(date).setHours(23, 59, 59, 999) - Date.now()) / 86400000)
  );

  const isToday   = daysUntil === 0;
  const isTomorrow = daysUntil === 1;

  // Format display date
  const displayDate = (() => {
    const d = new Date(date);
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const base = d.toLocaleDateString('en-US', opts);
    if (isToday)     return `Today, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    if (isTomorrow)  return `Tomorrow, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    return base;
  })();

  // Badge text
  const badgeText = isToday ? 'Competition Day' : isTomorrow ? 'Tournament Tomorrow' : 'Upcoming Tournament';

  // Intro animation (fade+slide in on mount)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.animate(
      [
        { transform: 'translateY(20px) scale(0.95)', opacity: '0' },
        { transform: 'translateY(0) scale(1)',       opacity: '1' },
      ],
      { duration: 800, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' }
    );
  }, []);

  // Particle burst when entering today state for the first time
  useEffect(() => {
    if (isToday && particleRef.current && !particlesFired.current) {
      particlesFired.current = true;
      // Slight delay so card is visible first
      setTimeout(() => {
        if (particleRef.current) spawnParticles(particleRef.current);
        // Card bounce
        cardRef.current?.animate(
          [
            { transform: 'scale(0.92)' },
            { transform: 'scale(1.03)' },
            { transform: 'scale(1)' },
          ],
          { duration: 800, easing: 'cubic-bezier(0.175,0.885,0.32,1.275)', fill: 'forwards' }
        );
      }, 400);
    }
  }, [isToday]);

  // Mouse spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${((e.clientX - r.left) / el.offsetWidth) * 100}%`);
    el.style.setProperty('--mouse-y', `${((e.clientY - r.top) / el.offsetHeight) * 100}%`);
  };

  // ── Derived theme values ─────────────────────────────────────────────
  const borderColor = isToday
    ? '#e8af34'
    : isTomorrow
    ? 'rgba(239,68,68,0.3)'
    : 'rgba(255,255,255,0.05)';

  const cardGlow = isToday
    ? 'rgba(232,175,52,0.2)'
    : isTomorrow
    ? 'rgba(239,68,68,0.15)'
    : 'rgba(232,175,52,0.1)';

  const boxShadow = isToday
    ? '0 16px 48px rgba(232,175,52,0.3), inset 0 1px 4px rgba(232,175,52,0.4)'
    : isTomorrow
    ? '0 16px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(239,68,68,0.2)'
    : '0 16px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)';

  const cdColor = isToday
    ? '#fff'
    : isTomorrow
    ? '#ef4444'
    : '#e8af34';

  const cdGlow = isToday
    ? 'rgba(255,255,255,0.6)'
    : isTomorrow
    ? 'rgba(239,68,68,0.5)'
    : 'rgba(232,175,52,0.3)';

  const cdLblColor = isToday
    ? '#fef08a'
    : isTomorrow
    ? 'rgba(239,68,68,0.8)'
    : '#57534e';

  const animClass = isToday ? 'tw-pulse-battle' : isTomorrow ? 'tw-pulse-urgent' : '';

  return (
    <>
      <style>{`
        @keyframes tw-pulse-urgent {
          0%   { box-shadow: 0 16px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(239,68,68,0.2); }
          50%  { box-shadow: 0 16px 40px rgba(239,68,68,0.1), inset 0 1px 4px rgba(239,68,68,0.4); }
          100% { box-shadow: 0 16px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(239,68,68,0.2); }
        }
        @keyframes tw-pulse-battle {
          0%   { box-shadow: 0 16px 48px rgba(232,175,52,0.3), inset 0 1px 4px rgba(232,175,52,0.4); }
          50%  { box-shadow: 0 16px 64px rgba(254,240,138,0.4), inset 0 1px 12px rgba(254,240,138,0.6); }
          100% { box-shadow: 0 16px 48px rgba(232,175,52,0.3), inset 0 1px 4px rgba(232,175,52,0.4); }
        }
        @keyframes tw-scanline {
          0%   { left: -100%; }
          20%  { left: 200%; }
          100% { left: 200%; }
        }
        @keyframes tw-pulse-dot {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0.5; transform: scale(1.3); }
        }
        .tw-card { --mouse-x: 50%; --mouse-y: 50%; }
        .tw-card::after {
          content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none;
          background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06) 0%, transparent 50%);
          opacity: 0; transition: opacity 0.4s; border-radius: inherit;
        }
        .tw-card:hover::after { opacity: 1; }
        .tw-scanline {
          position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-20deg);
          animation: tw-scanline 3s infinite linear;
          z-index: 2; pointer-events: none;
        }
      `}</style>

      <div
        ref={cardRef}
        className={`tw-card ${animClass}`}
        onMouseMove={handleMouseMove}
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${borderColor}`,
          borderRadius: 24,
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'border-color 0.5s, transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          cursor: 'pointer',
          animationName: animClass,
          animationDuration: isToday ? '2s' : isTomorrow ? '4s' : undefined,
          animationIterationCount: animClass ? 'infinite' : undefined,
          animationTimingFunction: 'ease-in-out',
        }}
      >
        {/* Inner card glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 100% 0%, ${cardGlow}, transparent 60%)`,
          opacity: 0.8, transition: 'all 0.8s',
        }} />

        {/* Scanline — today only */}
        {isToday && <div className="tw-scanline" />}

        {/* Particle container */}
        <div ref={particleRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }} />

        {/* ── Content ─────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>

          {/* Header row: badge + countdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: isToday
                ? '#fff'
                : isTomorrow
                ? '#ef4444'
                : 'rgba(232,175,52,0.1)',
              border: `1px solid ${isToday ? '#fff' : isTomorrow ? '#ef4444' : 'rgba(232,175,52,0.3)'}`,
              padding: '6px 12px', borderRadius: 12,
              fontSize: 11, fontWeight: 800,
              color: isToday ? '#000' : isTomorrow ? '#fff' : '#e8af34',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              boxShadow: isToday
                ? '0 0 24px rgba(255,255,255,0.6)'
                : isTomorrow
                ? '0 0 16px rgba(239,68,68,0.5)'
                : '0 0 16px rgba(232,175,52,0.3)',
              transition: 'all 0.5s',
            }}>
              {/* Trophy icon — hidden on today */}
              {!isToday && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ width: 14, height: 14, color: isTomorrow ? '#fff' : '#e8af34', transition: 'all 0.5s' }}>
                  <path d="M8 21h8M12 17v4M7 4h10M5 4h14v5a7 7 0 0 1-14 0V4z" />
                </svg>
              )}
              {/* Pulse dot — today only */}
              {isToday && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#000',
                  animation: 'tw-pulse-dot 1s infinite alternate',
                  flexShrink: 0,
                }} />
              )}
              {badgeText}
            </div>

            {/* Countdown */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div style={{
                fontFamily: 'var(--font-display, system-ui)',
                fontSize: isToday ? 42 : 48,
                fontWeight: 900,
                color: cdColor,
                lineHeight: 0.8,
                letterSpacing: '-0.02em',
                textShadow: `0 0 24px ${cdGlow}`,
                transition: 'all 0.5s',
              }}>
                {isToday ? 'NOW' : daysUntil}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 800,
                color: cdLblColor,
                textTransform: 'uppercase', letterSpacing: '0.15em',
                marginTop: 6,
                textShadow: isToday ? `0 0 12px rgba(254,240,138,0.5)` : 'none',
                transition: 'all 0.5s',
              }}>
                {isToday ? 'On The Mat' : isTomorrow ? 'Day Out' : 'Days Out'}
              </div>
            </div>
          </div>

          {/* Main info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, paddingRight: 20 }}>
            <div style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.01em',
            }}>
              {name}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#a8a29e', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {displayDate}
              {location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#57534e', fontSize: 13 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {location}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            {!isToday ? (
              <>
                {/* Directions */}
                {location && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(location)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={btnStyle}
                    onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, btnHover)}
                    onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, btnStyle)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Directions
                  </a>
                )}
                {/* Bracket */}
                {link && (
                  <a
                    href={link}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={btnStyle}
                    onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, btnHover)}
                    onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, btnStyle)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Bracket
                  </a>
                )}
              </>
            ) : (
              /* Today — "Open Live Brackets" full-width CTA */
              link && (
                <a
                  href={link}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    flex: 1,
                    padding: 12, borderRadius: 12,
                    fontFamily: 'var(--font-display, system-ui)',
                    fontSize: 15, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #fef08a, #e8af34)',
                    border: 'none',
                    color: '#000',
                    boxShadow: '0 8px 24px rgba(232,175,52,0.3)',
                    textDecoration: 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Open Live Brackets
                </a>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Shared button style
const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: 12, borderRadius: 12,
  fontFamily: 'var(--font-display, system-ui)',
  fontSize: 15, fontWeight: 800,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#f5f5f4',
  textDecoration: 'none',
  transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
  cursor: 'pointer',
};

const btnHover: React.CSSProperties = {
  ...btnStyle,
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  borderColor: 'rgba(255,255,255,0.2)',
  transform: 'translateY(-2px)',
};
