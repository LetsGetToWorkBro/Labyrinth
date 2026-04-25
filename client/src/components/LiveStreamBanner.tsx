/**
 * LiveStreamBanner — exact port of labyrinth-bjj-live-stream.html design.
 *
 * States:
 *   hidden   → compact card animates in (elastic drop) when stream goes live
 *   compact  → thumbnail + LIVE badge + class title + instructor + viewer count
 *   expanded → full 16:9 thumbnail area + info + "Enter Theater Mode" button
 *   dismissed → collapses back out (spring up)
 *
 * CSS transitions replace GSAP; same easing curves and timing.
 *
 * NOTE: Currently returns null when stream is offline. Future enhancement: when
 * offline, show next scheduled stream time using getNextStreams() from streaming.ts.
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { StreamStatus } from '@/lib/streaming';
import { getEmbedUrl } from '@/lib/streaming';

export interface LiveStreamBannerProps {
  stream: StreamStatus | null;
}

export function LiveStreamBanner({ stream }: LiveStreamBannerProps) {
  // ── visibility state machine ──────────────────────────────────────
  // 'hidden'   = not rendered / fully collapsed
  // 'entering' = wrapper expanding, card dropping in
  // 'visible'  = compact banner visible
  // 'expanded' = full player expanded
  // 'leaving'  = collapsing out
  const [phase, setPhase] = useState<'hidden' | 'entering' | 'visible' | 'expanded' | 'leaving'>('hidden');
  const [dismissed, setDismissed] = useState<boolean>(() => false);
  const [viewers, setViewers] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [ambientRed, setAmbientRed] = useState(false);
  const [thumbExpanded, setThumbExpanded] = useState(false);

  // Track which videoId we last showed so we re-animate on a new stream
  const lastVideoId = useRef('');
  const viewerTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewerCountRef = useRef(0);

  const isLive = !!(stream?.isLive);

  // ── trigger entrance when stream goes live ─────────────────────────
  useEffect(() => {
    if (!isLive) {
      if (phase !== 'hidden' && phase !== 'leaving') triggerLeave();
      return;
    }

    // Check if this specific stream was dismissed
    const dismissedId = (() => { try { return localStorage.getItem('lbjj_stream_dismissed') || ''; } catch { return ''; } })();
    const wasDismissed = stream?.videoId && dismissedId === stream.videoId;
    if (wasDismissed) return; // user dismissed this specific stream

    if (stream?.videoId && stream.videoId !== lastVideoId.current) {
      lastVideoId.current = stream.videoId;
      triggerEntrance();
    } else if (phase === 'hidden') {
      // Stream was already live when page loaded
      if (stream?.videoId) lastVideoId.current = stream.videoId;
      triggerEntrance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, stream?.videoId]);

  function triggerEntrance() {
    setDismissed(false);
    setThumbExpanded(false);
    viewerCountRef.current = 0;
    setViewers(0);

    // 1. HUD glitch flash
    setGlitch(true);
    setTimeout(() => setGlitch(false), 300);

    // 2. Start expanding after glitch
    setTimeout(() => {
      setPhase('entering');
      setAmbientRed(true);
    }, 150);

    // 3. Card has dropped — mark visible
    setTimeout(() => setPhase('visible'), 750);

    // 4. Tick up viewer count
    if (viewerTimer.current) clearInterval(viewerTimer.current);
    let v = 0;
    viewerTimer.current = setInterval(() => {
      v += Math.floor(Math.random() * 3) + 1;
      viewerCountRef.current = v;
      setViewers(v);
      if (v >= 42) {
        clearInterval(viewerTimer.current!);
        viewerCountRef.current = 42;
        setViewers(42);
      }
    }, 80);
  }

  function triggerLeave() {
    setPhase('leaving');
    if (viewerTimer.current) clearInterval(viewerTimer.current);
    setAmbientRed(false);
    setTimeout(() => {
      setPhase('hidden');
      setThumbExpanded(false);
    }, 500);
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    setDismissed(true);
    if (stream?.videoId) {
      try { localStorage.setItem('lbjj_stream_dismissed', stream.videoId); } catch {}
    }
    triggerLeave();
  }

  function handleExpand() {
    if (phase === 'expanded') return;
    setPhase('expanded');
    // Slight delay so layout switch happens before thumb grows
    setTimeout(() => setThumbExpanded(true), 30);
    setAmbientRed(true);
  }

  function handleTheaterMode(e: React.MouseEvent) {
    e.stopPropagation();
    window.location.hash = '#/live';
  }

  // ── Don't render anything if hidden and fully off ─────────────────
  if (phase === 'hidden' && !isLive) return null;
  if (phase === 'hidden') return null;

  const title = stream?.className || 'Live Class';
  const instructor = stream?.instructor || '';
  const thumbnail = stream?.thumbnail || '';

  // ── Wrapper animation ─────────────────────────────────────────────
  const wrapperVisible = phase === 'entering' || phase === 'visible' || phase === 'expanded';
  const wrapperLeaving = phase === 'leaving';

  const wrapperStyle: React.CSSProperties = {
    overflow: 'hidden',
    marginBottom: wrapperVisible ? 16 : 0,
    // height transitions via maxHeight trick for auto-height
    maxHeight: wrapperLeaving ? 0 : wrapperVisible ? 600 : 0,
    opacity: wrapperLeaving ? 0 : wrapperVisible ? 1 : 0,
    transition: wrapperLeaving
      ? 'max-height 0.4s cubic-bezier(0.4,0,1,1), opacity 0.3s ease, margin-bottom 0.4s'
      : 'max-height 0.6s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.4s ease 0.1s, margin-bottom 0.5s',
  };

  // ── Card animation (drops in) ─────────────────────────────────────
  const cardDropped = phase === 'visible' || phase === 'expanded';
  const cardStyle: React.CSSProperties = {
    background: phase === 'expanded' ? '#0f0e0d' : 'rgba(239,68,68,0.03)',
    border: phase === 'expanded' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(239,68,68,0.2)',
    borderRadius: 20,
    padding: phase === 'expanded' ? 0 : 12,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: phase === 'expanded' ? 'column' : 'row',
    alignItems: phase === 'expanded' ? 'stretch' : 'center',
    gap: phase === 'expanded' ? 0 : 16,
    boxShadow: '0 16px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(239,68,68,0.15)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    cursor: phase === 'expanded' ? 'default' : 'pointer',
    transformOrigin: 'top center',
    transform: cardDropped ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.95)',
    transition: cardDropped
      ? 'transform 0.6s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.4s, background 0.4s, padding 0.3s, flex-direction 0.1s'
      : 'transform 0.3s ease-in, opacity 0.3s ease-in',
    opacity: wrapperLeaving ? 0 : 1,
  };

  // ── Thumbnail block ───────────────────────────────────────────────
  const thumbStyle: React.CSSProperties = {
    width: phase === 'expanded' ? '100%' : 80,
    height: phase === 'expanded' ? (thumbExpanded ? 240 : 80) : 80,
    borderRadius: phase === 'expanded' ? 0 : 12,
    background: '#000',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0,
    border: phase === 'expanded' ? 'none' : '1px solid rgba(255,255,255,0.1)',
    borderBottom: phase === 'expanded' ? '1px solid rgba(255,255,255,0.05)' : undefined,
    boxShadow: phase === 'expanded' ? 'none' : '0 4px 12px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'width 0.5s cubic-bezier(0.175,0.885,0.32,1.1), height 0.6s cubic-bezier(0.175,0.885,0.32,1.1), border-radius 0.3s',
  };

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes lsb-scanline { 0%{left:-100%} 20%{left:200%} 100%{left:200%} }
        @keyframes lsb-blink { 0%{opacity:1} 100%{opacity:0.3} }
        @keyframes lsb-breathe { 0%{opacity:0.5;transform:scale(0.95)} 100%{opacity:1;transform:scale(1.05)} }
        @keyframes lsb-reaction { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(-60px);opacity:0} }
      `}</style>

      {/* HUD glitch overlay */}
      {glitch && createPortal(
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(239,68,68,0.07)',
          pointerEvents: 'none', zIndex: 9998,
          mixBlendMode: 'color-dodge',
          animation: 'none',
        }} />,
        document.body
      )}

      {/* Ambient light shift (red while live) */}
      {createPortal(
        <div style={{
          position: 'fixed', top: '-10vh', left: '50%', transform: 'translateX(-50%)',
          width: '150vw', height: '50vh', pointerEvents: 'none', zIndex: 0,
          background: ambientRed
            ? 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.3) 0%, transparent 60%)'
            : 'transparent',
          opacity: ambientRed ? 0.6 : 0,
          transition: 'opacity 1s ease, background 1s ease',
        }} />,
        document.body
      )}

      {/* Banner wrapper */}
      <div style={wrapperStyle}>
        {/* Card */}
        <div style={cardStyle} onClick={phase !== 'expanded' ? handleExpand : undefined}>

          {/* Radial glow pseudo (inline div) */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
            background: 'radial-gradient(circle at 10% 50%, rgba(239,68,68,0.5), transparent 60%)',
            opacity: 0.5,
          }} />

          {/* Scanline sweep */}
          <div style={{
            position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
            transform: 'skewX(-20deg)',
            animation: 'lsb-scanline 4s infinite linear',
            zIndex: 2, pointerEvents: 'none',
          }} />

          {/* Dismiss button */}
          <div
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: phase === 'expanded' ? 16 : 12,
              right: phase === 'expanded' ? 16 : 12,
              zIndex: 10,
              width: 24, height: 24, borderRadius: '50%',
              background: phase === 'expanded' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: phase === 'expanded' ? '#fff' : '#57534e',
              cursor: 'pointer',
              backdropFilter: phase === 'expanded' ? 'blur(8px)' : 'none',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>

          {/* Thumbnail */}
          <div style={thumbStyle}>
            {/* CRT scanlines overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.3, zIndex: 2, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
            }} />
            {/* Dark red gradient bg */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(45deg, #450a0a, #000)',
              zIndex: 1,
            }} />
            {thumbnail && (
              <img
                src={thumbnail}
                alt={title}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', opacity: 0.6,
                  filter: 'contrast(1.2) saturate(1.2)',
                  zIndex: 1,
                }}
              />
            )}
            {/* Play icon — hidden in expanded mode */}
            {phase !== 'expanded' && (
              <svg
                viewBox="0 0 24 24" fill="currentColor"
                style={{
                  position: 'relative', zIndex: 3,
                  width: 24, height: 24, color: '#fff',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                }}
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </div>

          {/* Info area */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative', zIndex: 5,
            padding: phase === 'expanded' ? '16px 20px 24px' : undefined,
          }}>

            {/* Top row: LIVE badge + viewer count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {/* LIVE badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#ef4444', padding: '2px 6px', borderRadius: 6,
                fontFamily: 'var(--font-display, system-ui)',
                fontSize: 10, fontWeight: 900, color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                boxShadow: '0 0 12px rgba(239,68,68,0.5)',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 4, height: 4, background: '#fff', borderRadius: '50%',
                  animation: 'lsb-blink 1s infinite alternate',
                }} />
                Live
              </div>

              {/* Viewer count */}
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#f87171',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{viewers}</span>
              </div>
            </div>

            {/* Class title */}
            <div style={{
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 2,
            }}>
              {title}
            </div>

            {/* Instructor */}
            {instructor && (
              <div style={{ fontSize: 12, fontWeight: 600, color: '#a8a29e' }}>
                {instructor}
              </div>
            )}

            {/* Theater Mode button — only visible when expanded */}
            <button
              onClick={handleTheaterMode}
              style={{
                display: phase === 'expanded' ? 'flex' : 'none',
                width: '100%', padding: '14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: 'var(--font-display, system-ui)',
                fontSize: 15, fontWeight: 800, color: '#fff',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginTop: 16,
                alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
                transition: 'background 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
              Enter Theater Mode
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
