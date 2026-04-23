/**
 * SeasonMilestoneWidgets — two compact half-height widgets
 *
 * Left:  April Season — circular ring progress + linear bar, maxes to emerald on completion
 * Right: Next Milestone — XP-to-unlock display, purple burst on ready-to-claim
 *
 * Ported from labyrinth-bjj-widgets-half.html.
 * No GSAP — all CSS transitions + React state.
 */

import React, { useState, useEffect, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────

interface SeasonData {
  thisMonthClasses: number;
  goalClasses: number;
  progress: number;        // 0–1
  monthName: string;
}

interface MilestoneData {
  label: string;           // "Rookie", "Dedicated Grappler", etc.
  xpNeeded: number;        // XP left to unlock
  ready: boolean;          // xpNeeded <= 0
}

interface SeasonMilestoneWidgetsProps {
  season: SeasonData;
  milestone: MilestoneData;
  onOpenSeason?: () => void;
  onOpenMilestone?: () => void;
}

// ─── Season Widget ─────────────────────────────────────────────────

function SeasonWidget({ season, onClick }: { season: SeasonData; onClick?: () => void }) {
  const maxed = season.thisMonthClasses >= season.goalClasses;
  const [wasMaxed, setWasMaxed] = useState(maxed);
  const [shockwave, setShockwave] = useState(false);
  const [mx, setMx] = useState(50);
  const [my, setMy] = useState(50);

  // Detect transition to maxed
  useEffect(() => {
    if (maxed && !wasMaxed) {
      setShockwave(true);
      setTimeout(() => setShockwave(false), 900);
      setWasMaxed(true);
    }
  }, [maxed]);

  const circ = 2 * Math.PI * 16; // ~100.5
  const offset = circ - (Math.min(season.progress, 1) * circ);
  const pct = Math.round(Math.min(season.progress, 1) * 100);

  const color = maxed ? '#10b981' : '#e8af34';
  const glow  = maxed ? 'rgba(16,185,129,0.4)' : 'rgba(232,175,52,0.3)';

  return (
    <div
      onMouseMove={e => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMx(((e.clientX - r.left) / r.width) * 100);
        setMy(((e.clientY - r.top) / r.height) * 100);
      }}
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20, padding: 16, cursor: 'pointer',
        height: 110,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: maxed
          ? 'radial-gradient(circle at 100% 0%, rgba(16,185,129,0.08), rgba(255,255,255,0.03))'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${maxed ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: maxed
          ? `0 12px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 24px rgba(16,185,129,0.15)`
          : `0 12px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)`,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        transition: 'border-color 0.5s, box-shadow 0.5s, background 0.5s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Mouse spotlight */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 5,
        background: `radial-gradient(circle at ${mx}% ${my}%, rgba(255,255,255,0.08) 0%, transparent 55%)`,
        opacity: 0, transition: 'opacity 0.3s',
      }} className="sw-spotlight" />

      {/* Shockwave */}
      {shockwave && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 150, height: 150, pointerEvents: 'none', zIndex: 0,
          animation: 'smw-shockwave 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        }}>
          <svg viewBox="0 0 100 100" width="150" height="150">
            <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="2" />
          </svg>
        </div>
      )}

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, color: color, transition: 'color 0.5s' }}>
            {season.monthName} Season
          </div>
          <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {maxed ? season.goalClasses : season.thisMonthClasses}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
              {!maxed && `/${season.goalClasses}`}
            </span>
          </div>
        </div>

        {/* Ring */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="smw-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" /><stop offset="100%" stopColor="#e8af34" />
              </linearGradient>
              <linearGradient id="smw-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" /><stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle
              cx="18" cy="18" r="16" fill="none"
              stroke={maxed ? 'url(#smw-emerald)' : 'url(#smw-gold)'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 6px ${glow})`, transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.5s' }}
            />
          </svg>
          {/* Checkmark on complete */}
          {maxed && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: bar or completed badge */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {maxed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Completed
          </div>
        ) : (
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: color,
              width: `${pct}%`,
              boxShadow: `0 0 8px ${glow}`,
              transition: 'width 1s cubic-bezier(0.16,1,0.3,1), background 0.5s',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Milestone Widget — ported from milestone_only_modal.html ──────

function MilestoneWidget({ milestone, onClick }: { milestone: MilestoneData; onClick?: () => void }) {
  const [shockwave, setShockwave] = useState(false);
  const prevReady = useRef(milestone.ready);

  useEffect(() => {
    if (milestone.ready && !prevReady.current) {
      setShockwave(true);
      setTimeout(() => setShockwave(false), 900);
    }
    prevReady.current = milestone.ready;
  }, [milestone.ready]);

  const borderColor = milestone.ready ? 'rgba(168,85,247,0.4)' : 'rgba(232,175,52,0.15)';
  const hoverStyle  = milestone.ready
    ? '0 12px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 24px rgba(168,85,247,0.2)'
    : '0 12px 32px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.06), 0 0 20px rgba(232,175,52,0.1)';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: 20, padding: 15, cursor: 'pointer',
        height: 110,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 12px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        transition: 'border-color .3s, box-shadow .3s, transform .15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = milestone.ready ? 'rgba(168,85,247,0.6)' : 'rgba(232,175,52,0.3)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = hoverStyle;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = borderColor;
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.06)';
      }}
    >
      {/* Shockwave on ready */}
      {shockwave && (
        <div style={{ position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          width:150,height:150,pointerEvents:'none',zIndex:0,
          animation:'smw-shockwave 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}>
          <svg viewBox="0 0 100 100" width="150" height="150">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="2"/>
          </svg>
        </div>
      )}

      {/* Top row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative', zIndex:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:3 }}>
            Next Milestone
          </div>
          {/* 2-line clamped title — no more truncation */}
          <div style={{
            fontSize:15, fontWeight:900, color: milestone.ready ? '#d8b4fe' : '#fff',
            lineHeight:1.15, letterSpacing:'-0.01em',
            display:'-webkit-box', WebkitLineClamp:2,
            WebkitBoxOrient:'vertical' as any, overflow:'hidden',
            transition:'color 0.5s',
          }}>
            {milestone.label}
          </div>
        </div>

        {/* Icon box — lightning bolt SVG */}
        <div style={{
          width:38, height:38, borderRadius:11, flexShrink:0, marginLeft:10,
          background: milestone.ready ? '#a855f7' : 'linear-gradient(135deg, rgba(232,175,52,0.12), rgba(232,175,52,0.03))',
          border: `1px solid ${milestone.ready ? '#a855f7' : 'rgba(232,175,52,0.3)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: milestone.ready ? '#000' : '#e8af34',
          boxShadow: milestone.ready ? '0 0 24px rgba(168,85,247,0.5)' : 'none',
          transition:'all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
          transform: milestone.ready ? 'scale(1.08)' : 'scale(1)',
        }}>
          {milestone.ready ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ display:'flex', alignItems:'center', gap:5, position:'relative', zIndex:10 }}>
        {milestone.ready ? (
          <div style={{
            width:'100%', padding:'6px 0', borderRadius:8,
            background:'#a855f7', color:'#000',
            fontSize:11, fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase',
            display:'flex', alignItems:'center', justifyContent:'center', gap:4,
            boxShadow:'0 4px 16px rgba(168,85,247,0.5)',
            animation:'smw-pulse-btn 2s ease-in-out infinite alternate',
          }}>
            Claim Reward
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </div>
        ) : (
          <>
            <span style={{ fontSize:13, fontWeight:900, color:'#e8af34', fontVariantNumeric:'tabular-nums' }}>
              {milestone.xpNeeded.toLocaleString()}
            </span>
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)' }}>XP to unlock</span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Combined Export ────────────────────────────────────────────────

export function SeasonMilestoneWidgets({ season, milestone, onOpenSeason, onOpenMilestone }: SeasonMilestoneWidgetsProps) {
  return (
    <>
      <style>{`
        @keyframes smw-shockwave {
          from { transform: translate(-50%,-50%) scale(0.1); opacity: 1; }
          to   { transform: translate(-50%,-50%) scale(3.5); opacity: 0; }
        }
        @keyframes smw-pulse-btn {
          0%   { box-shadow: 0 4px 16px rgba(168,85,247,0.4); }
          100% { box-shadow: 0 4px 24px rgba(168,85,247,0.7); }
        }
        .smw-row:hover .sw-spotlight { opacity: 1 !important; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '0 20px 16px' }}>
        <SeasonWidget season={season} onClick={onOpenSeason} />
        <MilestoneWidget milestone={milestone} onClick={onOpenMilestone} />
      </div>
    </>
  );
}
