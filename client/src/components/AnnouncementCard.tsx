/**
 * AnnouncementCard — exact React port of labyrinth-bjj-announcement.html
 *
 * States:
 *   unread   → red border + pulse dot + glow bg, chevron collapses body
 *   expanded → body grows open, full text visible
 *   read     → muted palette, badge changes to "Past Update", auto-collapses
 *
 * All animations use CSS transitions + Web Animations API to match the
 * GSAP spring/elastic curves from the source HTML without adding a dep.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { PinnedAnnouncement } from '@/lib/api';

export interface AnnouncementCardProps {
  announcement: PinnedAnnouncement;
}

function spawnParticles(container: HTMLElement, color: string, count = 15) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 4 + 3;
    Object.assign(p.style, {
      position: 'absolute',
      bottom: '40px',
      left: '30%',
      width: `${size}px`,
      height: `${size}px`,
      background: color,
      borderRadius: '50%',
      boxShadow: `0 0 12px ${color}`,
      pointerEvents: 'none',
      zIndex: '20',
    });
    container.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const v = 40 + Math.random() * 60;
    const tx = Math.cos(angle) * v;
    const ty = Math.sin(angle) * v - 20;
    p.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: '1' },
        { transform: `translate(${tx}px,${ty}px) scale(0)`, opacity: '0' },
      ],
      { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(0,0.5,0.5,1)', fill: 'forwards' }
    ).onfinish = () => p.remove();
  }
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [ackDone, setAckDone] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const particleRef = useRef<HTMLDivElement>(null);

  // Track mouse position for spotlight effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / el.offsetWidth) * 100}%`);
    el.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / el.offsetHeight) * 100}%`);
  };

  // Measure inner content height for smooth expand
  useEffect(() => {
    if (!innerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (innerRef.current) setBodyHeight(innerRef.current.getBoundingClientRect().height);
    });
    observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleExpand = () => {
    setIsExpanded(v => !v);
  };

  const markAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRead || ackDone) return;
    setAckDone(true);

    // Particle burst
    if (particleRef.current) spawnParticles(particleRef.current, '#10b981');

    // Card bounce via Web Animations
    cardRef.current?.animate(
      [{ transform: 'scale(0.98)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }],
      { duration: 500, easing: 'cubic-bezier(0.175,0.885,0.32,1.275)', fill: 'forwards' }
    );

    // Transition to read state after bounce
    setTimeout(() => {
      setIsRead(true);
      // Auto-collapse
      setTimeout(() => setIsExpanded(false), 1500);
    }, 300);
  };

  const title = announcement.title || 'New Announcement';
  const badge = announcement.badge || 'Priority Update';
  const message = announcement.message || '';
  const link = announcement.link || '';
  const linkLabel = announcement.linkLabel || 'Learn More';
  const dateStr = announcement.ts
    ? new Date(announcement.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  // Split message: first ~120 chars as preview, rest as full
  const previewText = message.length > 120 ? message.slice(0, 120).trim() + '…' : message;

  return (
    <>
      <style>{`
        @keyframes ann-pulse {
          0%  { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.5);  opacity: 0; }
        }
        @keyframes ann-check-in {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .ann-card { --mouse-x: 50%; --mouse-y: 50%; }
        .ann-card::after {
          content: ''; position: absolute; inset: 0; z-index: 5; pointer-events: none;
          background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.08) 0%, transparent 50%);
          opacity: 0; transition: opacity 0.4s; border-radius: inherit;
        }
        .ann-card:hover::after { opacity: 1; }
      `}</style>

      <div
        ref={cardRef}
        className="ann-card"
        onMouseMove={handleMouseMove}
        style={{
          background: isRead ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
          border: isRead
            ? '1px solid rgba(255,255,255,0.05)'
            : '1px solid rgba(239,68,68,0.3)',
          borderRadius: 24,
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isRead
            ? '0 8px 24px rgba(0,0,0,0.3)'
            : '0 16px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'border-color 0.5s, box-shadow 0.5s, background 0.5s',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Radial glow bg — fades when read */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: 'radial-gradient(circle at 0% 0%, rgba(239,68,68,0.3), transparent 70%)',
          opacity: isRead ? 0 : 1,
          transition: 'opacity 0.8s',
        }} />

        {/* Particle container */}
        <div ref={particleRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }} />

        {/* Header — always visible, click to toggle */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 12 }}
          onClick={toggleExpand}>

          {/* Top row: badge + date + chevron */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: isRead ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.1)',
              border: isRead ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239,68,68,0.3)',
              padding: '4px 10px', borderRadius: 20,
              fontSize: 10, fontWeight: 800,
              color: isRead ? '#a8a29e' : '#ef4444',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              boxShadow: isRead ? 'none' : '0 0 12px rgba(239,68,68,0.3)',
              transition: 'all 0.5s',
            }}>
              {!isRead && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                  animation: 'ann-pulse 2s infinite',
                  flexShrink: 0,
                }} />
              )}
              <span>{isRead ? 'Past Update' : badge}</span>
            </div>

            {/* Date + chevron */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#a8a29e' }}>
              {dateStr}
              <svg
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                width="16" height="16"
                style={{
                  color: isExpanded ? '#fff' : '#57534e',
                  transform: isExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275), color 0.3s',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 22, fontWeight: 800,
              color: isRead ? '#a8a29e' : '#fff',
              lineHeight: 1.1, marginBottom: 4,
              transition: 'color 0.5s',
            }}>
              {title}
            </h2>
            {/* Preview text — hidden when expanded */}
            {!isExpanded && (
              <div style={{
                fontSize: 14, fontWeight: 500, color: '#a8a29e', lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              } as React.CSSProperties}>
                {previewText}
              </div>
            )}
          </div>
        </div>

        {/* Expandable body */}
        <div
          ref={bodyRef}
          style={{
            height: isExpanded ? bodyHeight : 0,
            opacity: isExpanded ? 1 : 0,
            overflow: 'hidden',
            transition: isExpanded
              ? 'height 0.5s cubic-bezier(0.175,0.885,0.32,1.1), opacity 0.4s ease'
              : 'height 0.4s cubic-bezier(0.4,0,0.6,1), opacity 0.3s ease',
            position: 'relative', zIndex: 10,
          }}
        >
          <div ref={innerRef}>
            <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Banner graphic */}
              <div style={{
                width: '100%', height: 120, borderRadius: 12, overflow: 'hidden',
                position: 'relative',
                background: isRead
                  ? 'rgba(255,255,255,0.02)'
                  : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(0,0,0,0.5))',
                border: isRead ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(239,68,68,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.5s, border-color 0.5s',
              }}>
                {/* Diagonal stripe overlay */}
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.3, mixBlendMode: 'overlay',
                  backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)',
                }} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    width: 40, height: 40,
                    color: isRead ? '#57534e' : '#ef4444',
                    filter: isRead ? 'none' : 'drop-shadow(0 0 12px rgba(239,68,68,0.5))',
                    transition: 'color 0.5s, filter 0.5s',
                  }}>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              {/* Full message */}
              <p style={{
                fontSize: 14, fontWeight: 500, color: '#f5f5f4', lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}>
                {message}
              </p>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                {/* Acknowledge */}
                <button
                  onClick={markAsRead}
                  style={{
                    padding: '14px', borderRadius: 12,
                    fontFamily: 'var(--font-display, system-ui)',
                    fontSize: 15, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: ackDone ? 'default' : 'pointer',
                    background: ackDone ? '#10b981' : 'rgba(255,255,255,0.05)',
                    border: ackDone ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.12)',
                    color: ackDone ? '#000' : '#fff',
                    boxShadow: ackDone ? '0 8px 24px rgba(16,185,129,0.4)' : 'none',
                    transition: 'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
                  }}
                >
                  {ackDone ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      width="18" height="18"
                      style={{ animation: 'ann-check-in 0.4s cubic-bezier(0.175,0.885,0.32,2) both' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  {ackDone ? 'Read' : 'Acknowledge'}
                </button>

                {/* Link / CTA */}
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      padding: '14px', borderRadius: 12,
                      fontFamily: 'var(--font-display, system-ui)',
                      fontSize: 15, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: isRead ? '#fff' : '#ef4444',
                      border: isRead ? '1px solid #fff' : '1px solid #ef4444',
                      color: isRead ? '#000' : '#fff',
                      boxShadow: isRead ? '0 4px 12px rgba(255,255,255,0.2)' : '0 4px 16px rgba(239,68,68,0.3)',
                      textDecoration: 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    {linkLabel}
                  </a>
                ) : (
                  <button
                    onClick={e => e.stopPropagation()}
                    style={{
                      padding: '14px', borderRadius: 12,
                      fontFamily: 'var(--font-display, system-ui)',
                      fontSize: 15, fontWeight: 800,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isRead ? '#fff' : '#ef4444',
                      border: isRead ? '1px solid #fff' : '1px solid #ef4444',
                      color: isRead ? '#000' : '#fff',
                      boxShadow: isRead ? '0 4px 12px rgba(255,255,255,0.2)' : '0 4px 16px rgba(239,68,68,0.3)',
                      cursor: 'default',
                      transition: 'all 0.3s',
                    }}
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
