/**
 * XpEventBanner — shows a prominent banner when a 2× XP event is active.
 *
 * Matches the dark glass aesthetic of the rest of the app. Live countdown
 * re-renders every 30s so "Ends 2h 14m" stays accurate without a prop churn.
 */
import React, { useEffect, useState } from 'react';

export type XpEvent = {
  active: boolean;
  label: string;
  endsAt: string;   // ISO string
  multiplier: number;
};

function formatEndsAt(iso: string): string {
  if (!iso) return '';
  const end = new Date(iso);
  if (isNaN(end.getTime())) return '';
  const now = Date.now();
  const diffMs = end.getTime() - now;
  if (diffMs <= 0) return 'Ending now';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `Ends in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `Ends in ${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  return `Ends in ${days}d ${hrs % 24}h`;
}

export function XpEventBanner({ event }: { event: XpEvent | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!event?.active) return;
    const iv = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => window.clearInterval(iv);
  }, [event?.active]);

  if (!event?.active) return null;

  const endsLabel = formatEndsAt(event.endsAt);
  const mult = event.multiplier || 2;

  return (
    <div className="mx-5 mb-4 stagger-child">
      <div
        className="xp-event-banner"
        style={{
          background: 'linear-gradient(135deg, rgba(200,162,76,0.2), rgba(255,215,0,0.1))',
          border: '1px solid rgba(200,162,76,0.5)',
          borderRadius: 16,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.08)',
        }}
      >
        <span style={{ fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.6))' }} aria-hidden="true">⚡</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#FFD700', fontWeight: 800, fontSize: 14, letterSpacing: '0.05em' }}>
            {mult}× XP EVENT ACTIVE
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.label}{event.label && endsLabel ? ' · ' : ''}{endsLabel}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(200,162,76,0.2)',
            border: '1px solid rgba(200,162,76,0.4)',
            borderRadius: 8,
            padding: '4px 10px',
            color: '#FFD700',
            fontWeight: 900,
            fontSize: 18,
            flexShrink: 0,
          }}
          aria-label={`${mult}x multiplier`}
        >
          {mult}×
        </div>

        {/* Subtle shimmer sweep across the banner */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0, left: '-40%',
            width: '40%', height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.12), transparent)',
            animation: 'xpEventSweep 3.5s linear infinite',
            pointerEvents: 'none',
          }}
        />
      </div>
      <style>{`
        @keyframes xpEventSweep {
          0%   { transform: translateX(0); }
          100% { transform: translateX(350%); }
        }
      `}</style>
    </div>
  );
}
