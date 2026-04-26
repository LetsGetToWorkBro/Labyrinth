/**
 * WeeklyChallenges — dark glass widget with 3 rotating weekly challenges.
 *
 * Progress sources:
 *   - lbjj_checkin_history (YYYY-MM-DD[]) for classes + streak_days
 *   - lbjj_checkin_times ({date,time,className}[]) for morning/evening buckets
 *
 * Persistence:
 *   - lbjj_weekly_challenges_claimed_{YYYY-WW} = '1' when the bonus is claimed
 *
 * The challenge *progress* is derived on the fly from history — we don't store
 * it separately, so data can't drift out of sync with the actual check-ins.
 */
import React, { useMemo, useEffect, useState } from 'react';
import { Dumbbell, Sunrise, Calendar, Trophy, Moon, Flame, Shield } from 'lucide-react';
import { gasCall } from '@/lib/api';

export type WeeklyChallengeType =
  | 'classes'
  | 'streak_days'
  | 'morning_classes'
  | 'evening_classes'
  | 'checkin_streak';

export type WeeklyChallenge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  bonusXP: number;
  type: WeeklyChallengeType;
  completed: boolean;
};

type ChallengeSeed = Omit<WeeklyChallenge, 'current' | 'completed'>;

const CHALLENGE_SETS: ChallengeSeed[][] = [
  [
    { id: 'attend_3',  title: 'Mat Time',      description: 'Attend 3 classes this week',               icon: 'Dumbbell', target: 3, type: 'classes',         bonusXP: 150 },
    { id: 'morning_2', title: 'Early Riser',   description: 'Attend 2 morning classes (before noon)',   icon: 'Sunrise',  target: 2, type: 'morning_classes', bonusXP: 100 },
    { id: 'streak_3',  title: 'Consistency',   description: 'Train on 3 different days this week',      icon: 'Calendar', target: 3, type: 'streak_days',     bonusXP: 100 },
  ],
  [
    { id: 'attend_5',  title: 'Full Week',     description: 'Attend 5 classes this week',               icon: 'Trophy',   target: 5, type: 'classes',         bonusXP: 300 },
    { id: 'evening_2', title: 'Night Owl',     description: 'Attend 2 evening classes (after 5pm)',     icon: 'Moon',     target: 2, type: 'evening_classes', bonusXP: 100 },
    { id: 'streak_4',  title: 'Dedicated',     description: 'Train on 4 different days this week',      icon: 'Flame',    target: 4, type: 'streak_days',     bonusXP: 150 },
  ],
  [
    { id: 'attend_4',  title: 'Strong Week',   description: 'Attend 4 classes this week',               icon: 'Shield',   target: 4, type: 'classes',         bonusXP: 200 },
    { id: 'morning_3', title: 'Dawn Warrior',  description: 'Attend 3 morning classes',                 icon: 'Sunrise',  target: 3, type: 'morning_classes', bonusXP: 150 },
    { id: 'evening_3', title: 'Night Grind',   description: 'Attend 3 evening classes',                 icon: 'Moon',     target: 3, type: 'evening_classes', bonusXP: 150 },
  ],
];

const ICONS: Record<string, React.ComponentType<any>> = {
  Dumbbell, Sunrise, Calendar, Trophy, Moon, Flame, Shield,
};

// ─── Week math ──────────────────────────────────────────────────────
function startOfWeekSunday(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay()); // Sunday = 0
  return copy;
}
function endOfWeekSaturday(d: Date): Date {
  const start = startOfWeekSunday(d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
function ymd(d: Date): string { return d.toISOString().split('T')[0]; }
function weekKey(d: Date): string {
  // ISO-ish: YYYY-WW based on the Sunday of this week
  const sun = startOfWeekSunday(d);
  const jan1 = new Date(sun.getFullYear(), 0, 1);
  const days = Math.floor((sun.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.floor(days / 7) + 1;
  return `${sun.getFullYear()}-${String(week).padStart(2, '0')}`;
}
function weekNumber(d: Date): number {
  return Math.floor(d.getTime() / (7 * 24 * 60 * 60 * 1000));
}

type CheckInTimeEntry = { date: string; time: string; className?: string };

function parseTimeToMinutes(s: string): number {
  if (!s) return -1;
  // Accept "HH:MM AM/PM", "HH:MM", or ISO.
  const ampm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s.trim());
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const pm = /PM/i.test(ampm[3]);
    if (h === 12) h = 0;
    if (pm) h += 12;
    return h * 60 + m;
  }
  const iso = /T(\d{2}):(\d{2})/.exec(s);
  if (iso) return parseInt(iso[1], 10) * 60 + parseInt(iso[2], 10);
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (hhmm) return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  return -1;
}

function readThisWeeksHistory(): { dates: string[]; times: CheckInTimeEntry[] } {
  const now = new Date();
  const start = startOfWeekSunday(now);
  const end = endOfWeekSaturday(now);
  const startStr = ymd(start);
  const endStr = ymd(end);
  let history: string[] = [];
  let times: CheckInTimeEntry[] = [];
  try { history = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]'); } catch {}
  try { times   = JSON.parse(localStorage.getItem('lbjj_checkin_times')   || '[]'); } catch {}
  return {
    dates: (history || []).filter(d => d >= startStr && d <= endStr),
    times: (times   || []).filter(t => t?.date >= startStr && t?.date <= endStr),
  };
}

function computeProgress(seed: ChallengeSeed, dates: string[], times: CheckInTimeEntry[]): number {
  switch (seed.type) {
    case 'classes':
    case 'checkin_streak':
      // Each check-in counts as a class.
      return dates.length;
    case 'streak_days': {
      const unique = new Set(dates);
      return unique.size;
    }
    case 'morning_classes':
      return times.filter(t => {
        const m = parseTimeToMinutes(t.time || '');
        return m >= 0 && m < 12 * 60;
      }).length;
    case 'evening_classes':
      return times.filter(t => {
        const m = parseTimeToMinutes(t.time || '');
        return m >= 17 * 60;
      }).length;
    default:
      return 0;
  }
}

// ─── Public helper: append a check-in time to lbjj_checkin_times ─────
// Called by HomePage.handleHomeCheckIn on successful check-in so the
// morning/evening challenges work.
export function recordCheckInTime(date: string, time: string, className?: string): void {
  try {
    const arr: CheckInTimeEntry[] = JSON.parse(localStorage.getItem('lbjj_checkin_times') || '[]');
    // Keep at most 60 days of history.
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const trimmed = arr.filter(t => t?.date && t.date >= cutoff);
    trimmed.push({ date, time, className });
    localStorage.setItem('lbjj_checkin_times', JSON.stringify(trimmed));
  } catch {}
}

// ─── Main widget ────────────────────────────────────────────────────
export function WeeklyChallengesWidget({
  xpMultiplier = 1,
  onClaim,
}: {
  xpMultiplier?: number;
  onClaim?: (totalBonus: number) => void;
}) {
  const now = new Date();
  const seeds = CHALLENGE_SETS[weekNumber(now) % CHALLENGE_SETS.length];
  const wk = weekKey(now);
  const claimedKey = `lbjj_weekly_challenges_claimed_${wk}`;

  const [tick, setTick] = useState(0); // bump to recompute from storage
  const [claimed, setClaimed] = useState<boolean>(() => {
    try { return localStorage.getItem(claimedKey) === '1'; } catch { return false; }
  });
  const [claiming, setClaiming] = useState(false);

  // On mount: load claimed state from GAS to restore across devices/sign-outs.
  useEffect(() => {
    const token = localStorage.getItem('lbjj_session_token') || '';
    if (!token || claimed) return; // already claimed locally — no need to fetch
    gasCall('getWeeklyClaim', { token, week: wk }).then((res: any) => {
      if (res?.claimed) {
        try { localStorage.setItem(claimedKey, '1'); } catch {}
        setClaimed(true);
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wk]);

  // Recompute when localStorage changes (e.g. after a check-in).
  useEffect(() => {
    const onXp = () => setTick(t => t + 1);
    window.addEventListener('xp-updated', onXp);
    window.addEventListener('storage', onXp);
    const iv = window.setInterval(() => setTick(t => t + 1), 30_000);
    return () => {
      window.removeEventListener('xp-updated', onXp);
      window.removeEventListener('storage', onXp);
      window.clearInterval(iv);
    };
  }, []);

  const { challenges, totalBonus, allComplete, daysLeft } = useMemo(() => {
    const { dates, times } = readThisWeeksHistory();
    const list: WeeklyChallenge[] = seeds.map(s => {
      const current = Math.min(s.target, computeProgress(s, dates, times));
      return { ...s, current, completed: current >= s.target };
    });
    const bonus = list.reduce((n, c) => n + (c.completed ? c.bonusXP : 0), 0);
    const all = list.every(c => c.completed);
    const end = endOfWeekSaturday(now);
    const ms = end.getTime() - Date.now();
    const days = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
    return { challenges: list, totalBonus: bonus, allComplete: all, daysLeft: days };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, wk]);

  const handleClaim = () => {
    if (!allComplete || claimed || claiming) return;
    setClaiming(true);
    const gained = totalBonus * (xpMultiplier || 1);

    // Persist locally first for instant feedback
    try { localStorage.setItem(claimedKey, '1'); } catch {}
    setClaimed(true);

    // Award XP via onClaim (HomePage handles localStorage + GAS saveMemberStats)
    try { onClaim?.(gained); } catch {}

    // Also persist claim to GAS so it survives sign-out / other devices
    const token = localStorage.getItem('lbjj_session_token') || '';
    if (token) {
      gasCall('saveWeeklyClaim', {
        token,
        week: wk,
        xpAwarded: gained,
        challenges: seeds.map(s => s.id),
      }).catch(() => {});
    }

    // Nuclear VFX — gold burst overlay.
    playChallengeClaimVFX(gained);
    setTimeout(() => setClaiming(false), 600);
  };

  const GOLD = '#C8A24C';
  const GOLD_BRIGHT = '#FFD700';
  const EMERALD = '#22C55E';

  return (
    <div className="mx-5 mb-4 stagger-child">
      <div
        className={`weekly-challenges-card${allComplete && !claimed ? ' weekly-challenges-card--ready' : ''}`}
        style={{
          background: 'rgba(10,10,12,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '18px 18px 14px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }} aria-hidden="true">⚔️</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.02em' }}>
              Weekly Challenges
            </span>
          </div>
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '3px 8px',
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {challenges.filter(c => c.completed).length}/{challenges.length}
          </span>
        </div>

        {/* Challenge rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {challenges.map(ch => {
            const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));
            const Icon = ICONS[ch.icon] || Dumbbell;
            const done = ch.completed;
            return (
              <div
                key={ch.id}
                style={{
                  background: done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${done ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 14,
                  padding: '10px 12px',
                  transition: 'background 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: done ? 'rgba(34,197,94,0.15)' : 'rgba(200,162,76,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={done ? EMERALD : GOLD} strokeWidth={2.2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                      {ch.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2, lineHeight: 1.3 }}>
                      {ch.description}
                    </div>
                  </div>
                  {done ? (
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        color: EMERALD, fontWeight: 800, fontSize: 10, letterSpacing: '0.08em',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={EMERALD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>DONE</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        color: GOLD_BRIGHT, fontWeight: 800, fontSize: 11,
                        background: 'rgba(200,162,76,0.1)',
                        border: '1px solid rgba(200,162,76,0.25)',
                        borderRadius: 6, padding: '2px 6px',
                      }}
                    >
                      +{ch.bonusXP}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: done
                        ? `linear-gradient(90deg, ${EMERALD}, #4ade80)`
                        : `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`,
                      borderRadius: 999,
                      transition: 'width 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: done
                        ? '0 0 8px rgba(34,197,94,0.35)'
                        : '0 0 8px rgba(200,162,76,0.35)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    {ch.current} / {ch.target} {ch.type === 'streak_days' ? 'days' : 'classes'}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — claim bonus or reset countdown */}
        {allComplete && !claimed ? (
          <button
            onClick={handleClaim}
            disabled={claiming}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(200,162,76,0.5)',
              background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
              color: '#000',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: '0.04em',
              cursor: claiming ? 'default' : 'pointer',
              boxShadow: '0 8px 24px rgba(200,162,76,0.3), 0 0 20px rgba(255,215,0,0.15)',
              transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            aria-label={`Claim ${totalBonus * (xpMultiplier || 1)} XP bonus`}
          >
            ⚡ CLAIM +{totalBonus * (xpMultiplier || 1)} XP BONUS
          </button>
        ) : (
          <div
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              fontWeight: 600,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <span>
              {claimed
                ? `✓ Bonus claimed — resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
                : `Resets in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
            </span>
            {!claimed && (
              <span style={{ color: GOLD_BRIGHT }}>
                +{totalBonus} / {challenges.reduce((n, c) => n + c.bonusXP, 0)} XP
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scoped animation: gold shimmer border when all complete */}
      <style>{`
        .weekly-challenges-card--ready::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 20px;
          padding: 1px;
          background: linear-gradient(
            120deg,
            rgba(200,162,76,0.1) 0%,
            rgba(255,215,0,0.8) 45%,
            rgba(200,162,76,0.1) 55%,
            rgba(255,215,0,0.8) 100%
          );
          background-size: 200% 100%;
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          animation: weeklyChallengeShimmer 2.4s linear infinite;
          pointer-events: none;
        }
        @keyframes weeklyChallengeShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Nuclear gold burst overlay on claim ────────────────────────────
function playChallengeClaimVFX(xpGained: number) {
  try {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 10001; pointer-events: none;
      display: flex; align-items: center; justify-content: center;
      background: radial-gradient(ellipse at center, rgba(255,215,0,0.25) 0%, rgba(0,0,0,0) 60%);
      animation: wcFlash 1.2s cubic-bezier(0.16,1,0.3,1) forwards;
    `;

    const burst = document.createElement('div');
    burst.style.cssText = `
      text-align: center;
      animation: wcBurst 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards;
    `;

    const label = document.createElement('div');
    label.style.cssText = `
      font-size: 14px; letter-spacing: 4px; text-transform: uppercase;
      color: #C8A24C; font-weight: 800; margin-bottom: 12px;
      text-shadow: 0 0 20px rgba(255,215,0,0.6);
    `;
    label.textContent = 'Weekly Bonus';

    const xp = document.createElement('div');
    xp.style.cssText = `
      font-size: 72px; font-weight: 900;
      background: linear-gradient(135deg, #C8A24C, #FFD700, #FFF8DC);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; color: transparent;
      text-shadow: 0 0 60px rgba(255,215,0,0.6);
      filter: drop-shadow(0 0 20px rgba(255,215,0,0.4));
    `;
    xp.textContent = `+${xpGained} XP`;

    burst.appendChild(label);
    burst.appendChild(xp);
    overlay.appendChild(burst);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes wcFlash {
        0%   { opacity: 0; }
        15%  { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes wcBurst {
        0%   { transform: scale(0.4); opacity: 0; }
        25%  { transform: scale(1.08); opacity: 1; }
        55%  { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.1); opacity: 0; }
      }
    `;
    overlay.appendChild(style);

    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 1300);
  } catch {}
}
