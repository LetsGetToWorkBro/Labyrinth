/**
 * SeasonPage — "April Season" full-page bounty board
 *
 * Ported from labyrinth-bjj-season-bounties.html:
 *   - Speedometer arc gauge (half-circle) tracking monthly class count
 *   - 5 bounty caches with 4 states: locked → focus (progress bar) → ready (claim) → claimed
 *   - Flying XP particle on claim → XP bank counter
 *   - Shockwave + physical bounce on claim
 *   - All state derived from real check-in data
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMemberCheckIns, gasCall, saveMemberStats } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { X } from 'lucide-react';

// ─── Bounty tiers ─────────────────────────────────────────────────

const TIERS = [
  { id: 0, req: 4,  title: 'Active',     xp: 50  },
  { id: 1, req: 8,  title: 'Consistent', xp: 150 },
  { id: 2, req: 12, title: 'Dedicated',  xp: 300 },
  { id: 3, req: 16, title: 'Elite',      xp: 500 },
  { id: 4, req: 20, title: 'Warrior',    xp: 800 },
];
const MAX_CLASSES = 20;

function getMonthName() {
  return new Date().toLocaleString('en-US', { month: 'long' });
}
function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Flying XP particle ────────────────────────────────────────────

function spawnFlyXP(fromEl: HTMLElement, toEl: HTMLElement, amount: number) {
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  const p = document.createElement('div');
  p.textContent = `+${amount}`;
  p.style.cssText = `
    position:fixed; left:${fromRect.left + fromRect.width / 2}px; top:${fromRect.top + fromRect.height / 2}px;
    transform:translate(-50%,-50%);
    font-family:var(--font-display,'Cabinet Grotesk',system-ui);
    font-size:24px; font-weight:900; color:#e8af34;
    text-shadow:0 0 16px rgba(232,175,52,0.6);
    pointer-events:none; z-index:9999; opacity:0;
  `;
  document.body.appendChild(p);
  p.animate([
    { opacity: 0, transform: 'translate(-50%,-50%) scale(0.8)' },
    { opacity: 1, transform: 'translate(-50%,-80%) scale(1.1)', offset: 0.25 },
    { opacity: 0, transform: `translate(calc(${toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2)}px - 50%), calc(${toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2)}px - 50%)) scale(0.5)` },
  ], { duration: 900, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' }).onfinish = () => p.remove();
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function SeasonPage() {
  const { member } = useAuth();
  const [monthClasses, setMonthClasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('lbjj_season_claimed') || '{}'); } catch { return {}; }
  });
  const [xpBank, setXpBank] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return s.xp || 0; } catch { return 0; }
  });
  const [shockwave, setShockwave] = useState<number | null>(null);
  const [arcAnimate, setArcAnimate] = useState(false);
  const xpBankRef = useRef<HTMLDivElement>(null);
  const cacheRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('lbjj_session_token') || '';
    const ym = getCurrentYearMonth();

    // Load check-ins AND server-side season claim state in parallel
    Promise.all([
      getMemberCheckIns(),
      token ? gasCall('getSeasonClaims', { token, month: ym }) : Promise.resolve(null),
    ]).then(([checkInData, claimRes]) => {
      // Check-ins for this month
      const thisMonth = (checkInData as any[]).filter(c => {
        const dateStr = (c.timestamp || c.date || c.checkInDate || c.classDate || '').toString();
        return dateStr.startsWith(ym);
      }).length;
      setMonthClasses(thisMonth);

      // Merge server claimed state with local — server is source of truth,
      // but never remove a locally-claimed tier (offline resilience).
      if (claimRes?.claimed && typeof claimRes.claimed === 'object') {
        setClaimed(prev => {
          const merged = { ...prev, ...claimRes.claimed };
          try { localStorage.setItem('lbjj_season_claimed', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }

      setLoading(false);
      setTimeout(() => setArcAnimate(true), 100);
    }).catch(() => setLoading(false));
  }, []);

  // Keep xpBank in sync with xp-updated events (checkins, achievement claims, etc.)
  useEffect(() => {
    const sync = () => {
      try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); setXpBank(s.xp || 0); } catch {}
    };
    window.addEventListener('xp-updated', sync);
    return () => window.removeEventListener('xp-updated', sync);
  }, []);

  const pct = Math.min(monthClasses / MAX_CLASSES, 1);
  // Half-circle arc: r=60, circumference=376.99, half=188.5
  const arcOffset = 377 - (arcAnimate ? pct * 188.5 : 0);

  const handleClaim = useCallback((tierIdx: number) => {
    if (claimed[tierIdx]) return;
    const tier = TIERS[tierIdx];
    if (monthClasses < tier.req) return;

    const newClaimed = { ...claimed, [tierIdx]: true };
    setClaimed(newClaimed);
    try { localStorage.setItem('lbjj_season_claimed', JSON.stringify(newClaimed)); } catch {}

    // Shockwave
    setShockwave(tierIdx);
    setTimeout(() => setShockwave(null), 900);

    // Update XP locally first for instant feedback
    const s = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    const newXP = (s.xp || 0) + tier.xp;
    s.xp = newXP; s.totalXP = Math.max(s.totalXP || 0, newXP);
    try { localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(s)); } catch {}
    setXpBank(newXP);
    window.dispatchEvent(new CustomEvent('xp-updated'));

    // Persist claim + XP to GAS (fire-and-forget)
    const token = localStorage.getItem('lbjj_session_token') || '';
    if (token) {
      const ym = getCurrentYearMonth();
      gasCall('saveSeasonClaim', {
        token,
        month: ym,
        tierIdx,
        xpAwarded: tier.xp,
        tierTitle: tier.title,
      }).catch(() => {});
      // Also push new XP total to Members sheet so leaderboard stays in sync
      saveMemberStats({
        xp: newXP,
        streak: s.currentStreak || 0,
        maxStreak: s.maxStreak || 0,
      }).catch(() => {});
    }

    // Flying XP
    const cacheEl = cacheRefs.current[tierIdx];
    if (cacheEl && xpBankRef.current) spawnFlyXP(cacheEl, xpBankRef.current, tier.xp);
  }, [claimed, monthClasses]);

  return (
    <>
      <style>{`
        @keyframes sp-stagger { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-shockwave { from{transform:translate(-50%,-50%) scale(0.1);opacity:1} to{transform:translate(-50%,-50%) scale(4);opacity:0} }
        @keyframes sp-float-cache { 0%{transform:scale(1.03) translateY(0)} 50%{transform:scale(1.03) translateY(-4px)} 100%{transform:scale(1.03) translateY(0)} }
        @keyframes sp-arc-tick { from{stroke-dashoffset:377} }
        .sp-s1 { animation: sp-stagger 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
        .sp-s2 { animation: sp-stagger 0.9s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
        .sp-s3 { animation: sp-stagger 0.9s cubic-bezier(0.16,1,0.3,1) 0.20s both; }
        .sp-s4 { animation: sp-stagger 0.9s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
      `}</style>

      <div className="app-content" style={{ background: '#020202', paddingBottom: 80, position: 'relative' }}>
        {/* Ambient gold glow */}
        <div style={{ position: 'fixed', top: '-15vh', left: '50%', transform: 'translateX(-50%)', width: '150vw', height: '60vh', pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(232,175,52,0.25) 0%, transparent 60%)', opacity: 0.6 }} />

        {/* Noise texture */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        {/* Hidden SVG gradients */}
        <svg style={{ width: 0, height: 0, position: 'absolute' }} aria-hidden="true">
          <defs>
            <linearGradient id="sp-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8af34" /><stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
          </defs>
        </svg>

        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 24px', position: 'relative', zIndex: 10 }}>

          {/* ── Header ── */}
          <div className="sp-s1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44 }} />
            <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {getMonthName()} Season
            </div>
            {/* XP Bank */}
            <div ref={xpBankRef} style={{ background: 'rgba(232,175,52,0.1)', border: '1px solid rgba(232,175,52,0.3)', padding: '8px 16px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(232,175,52,0.2)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#e8af34" strokeWidth="2.5" width="16" height="16"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 18, fontWeight: 900, color: '#e8af34', fontVariantNumeric: 'tabular-nums' }}>{xpBank.toLocaleString()}</span>
            </div>
          </div>

          {/* Close link */}
          <a href="/#/" style={{ position: 'absolute', top: 26, left: 20, width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'all 0.2s', zIndex: 20 }}>
            <X size={20} />
          </a>

          {/* ── Arc Gauge ── */}
          <div className="sp-s2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, position: 'relative' }}>
            <div style={{ width: 280, height: 160, position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 160 160" style={{ width: '100%', height: 280, transform: 'rotate(180deg)' }}>
                {/* Background arc */}
                <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" strokeLinecap="round" />
                {/* Fill arc */}
                <circle
                  cx="80" cy="80" r="60" fill="none"
                  stroke="url(#sp-gold-grad)" strokeWidth="16" strokeLinecap="round"
                  strokeDasharray="377"
                  strokeDashoffset={arcOffset}
                  style={{ filter: 'drop-shadow(0 0 16px rgba(232,175,52,0.5))', transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                />
              </svg>
            </div>
            {/* Center data */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
              <div style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 0.9, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {loading ? '—' : monthClasses}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e8af34', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 8 }}>
                Classes Logged
              </div>
            </div>
          </div>

          {/* ── Section label ── */}
          <div className="sp-s3" style={{ fontSize: 12, fontWeight: 800, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            Bounty Caches
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.15), transparent)' }} />
          </div>

          {/* ── Bounty Board ── */}
          <div className="sp-s4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {TIERS.map((tier, i) => {
              const prevReq = i === 0 ? 0 : TIERS[i - 1].req;
              const isClaimed = !!claimed[i];
              const isReady = !isClaimed && monthClasses >= tier.req;
              const isFocus = !isClaimed && !isReady && (monthClasses > prevReq || i === 0);
              const isLocked = !isClaimed && !isReady && !isFocus;

              const classesInTier = Math.max(0, monthClasses - prevReq);
              const tierTotal = tier.req - prevReq;
              const progressPct = Math.min((classesInTier / tierTotal) * 100, 100);

              const borderColor = isClaimed ? 'rgba(16,185,129,0.3)'
                : isReady ? '#e8af34'
                : isFocus ? 'rgba(255,255,255,0.14)'
                : 'rgba(255,255,255,0.05)';

              const bg = isClaimed ? 'rgba(16,185,129,0.02)'
                : isReady ? 'radial-gradient(circle at 50% 0%, rgba(232,175,52,0.1), transparent 70%)'
                : 'rgba(255,255,255,0.03)';

              const shadow = isClaimed ? '0 16px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.04)'
                : isReady ? '0 16px 48px rgba(232,175,52,0.2), inset 0 1px 4px rgba(232,175,52,0.15)'
                : isFocus ? '0 16px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)'
                : '0 16px 32px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.04)';

              return (
                <div
                  key={tier.id}
                  ref={el => { cacheRefs.current[i] = el; }}
                  style={{
                    background: bg, border: `1px solid ${borderColor}`,
                    borderRadius: 24, padding: 20,
                    boxShadow: shadow,
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex', flexDirection: 'column', gap: 16,
                    position: 'relative', overflow: 'hidden',
                    opacity: isLocked ? 0.5 : 1,
                    filter: isLocked ? 'grayscale(70%)' : 'none',
                    transform: isReady ? 'scale(1.02)' : isFocus ? 'scale(1.01)' : 'scale(1)',
                    transition: 'all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                    animation: isReady ? 'sp-float-cache 3s ease-in-out infinite' : undefined,
                    zIndex: isReady ? 30 : isFocus ? 20 : 1,
                  }}
                >
                  {/* Shockwave */}
                  {shockwave === i && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 200, height: 200, pointerEvents: 'none', zIndex: 0, animation: 'sp-shockwave 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                      <svg viewBox="0 0 100 100" width="200" height="200">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="2" />
                      </svg>
                    </div>
                  )}

                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 10 }}>
                    {/* Icon box */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                      background: isClaimed ? 'rgba(16,185,129,0.1)' : isReady ? '#e8af34' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isClaimed ? 'rgba(16,185,129,0.4)' : isReady ? '#fef08a' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isClaimed ? '#10b981' : isReady ? '#000' : 'rgba(255,255,255,0.3)',
                      boxShadow: isReady ? '0 0 24px rgba(232,175,52,0.4)' : isClaimed ? '0 0 16px rgba(16,185,129,0.2)' : 'none',
                      transition: 'all 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                      fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 22, fontWeight: 900,
                    }}>
                      {tier.req === 20
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        : isClaimed
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="22" height="22"><polyline points="20 6 9 17 4 12"/></svg>
                          : tier.req
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: isClaimed ? '#10b981' : isReady ? '#fef08a' : isFocus ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'color 0.3s' }}>
                        {tier.title}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                        Requires {tier.req} Classes
                      </div>
                    </div>

                    {/* Reward pill */}
                    {!isClaimed && (
                      <div style={{ background: isReady ? 'transparent' : 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 12, fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 15, fontWeight: 900, color: isReady ? '#e8af34' : 'rgba(255,255,255,0.5)', border: `1px solid ${isReady ? 'transparent' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s', flexShrink: 0 }}>
                        +{tier.xp} XP
                      </div>
                    )}
                  </div>

                  {/* Bottom: progress bar / claim button / claimed badge */}
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    {isFocus && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                          {Math.max(0, monthClasses - prevReq)} / {tierTotal} Classes
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }}>
                          <div style={{ height: '100%', background: '#fff', width: `${progressPct}%`, borderRadius: 3, transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
                        </div>
                      </div>
                    )}
                    {isReady && (
                      <button
                        onClick={() => handleClaim(i)}
                        style={{
                          width: '100%', padding: 14, borderRadius: 12,
                          background: 'linear-gradient(135deg, #fef08a, #e8af34)',
                          border: 'none', fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)",
                          fontSize: 16, fontWeight: 900, color: '#000',
                          textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                          boxShadow: '0 8px 24px rgba(232,175,52,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          transition: 'transform 0.15s, filter 0.15s',
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Claim {tier.xp} XP
                      </button>
                    )}
                    {isClaimed && (
                      <div style={{ width: '100%', padding: 12, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 14, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
                        Loot Claimed
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
