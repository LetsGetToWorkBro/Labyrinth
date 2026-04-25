import { CalendarSparkIcon, GamepadIcon, BoltIcon } from "@/components/icons/LbjjIcons";
import { EmptyState } from '@/components/StateComponents';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { RefreshCw } from 'lucide-react';
import { getActualLevel } from '@/lib/xp';
import { ParagonRing } from '@/components/ParagonRing';

// ─── Rank color palette (matches HTML design) ─────────────────────
const RANK_COLORS: Record<number, { name: string; score: string; scoreSz: number; cardBorder: string; cardBg: string; rankColor: string }> = {
  1: { name: '#fde047', score: '#fde047', scoreSz: 28, cardBorder: 'rgba(253,224,71,0.3)',  cardBg: 'linear-gradient(90deg, rgba(253,224,71,0.05), transparent)',  rankColor: '#fde047' },
  2: { name: '#fca5a5', score: '#fca5a5', scoreSz: 26, cardBorder: 'rgba(239,68,68,0.3)',   cardBg: 'linear-gradient(90deg, rgba(239,68,68,0.05), transparent)',   rankColor: '#fca5a5' },
  3: { name: '#d8b4fe', score: '#d8b4fe', scoreSz: 24, cardBorder: 'rgba(168,85,247,0.3)',  cardBg: 'linear-gradient(90deg, rgba(168,85,247,0.05), transparent)',  rankColor: '#d8b4fe' },
  4: { name: '#bae6fd', score: '#bae6fd', scoreSz: 22, cardBorder: 'rgba(14,165,233,0.2)',  cardBg: 'rgba(255,255,255,0.02)',                                       rankColor: '#bae6fd' },
  5: { name: '#e8af34', score: '#e8af34', scoreSz: 20, cardBorder: 'rgba(232,175,52,0.2)',  cardBg: 'rgba(255,255,255,0.02)',                                       rankColor: '#e8af34' },
};
const DEFAULT_RANK = { name: '#f5f5f4', score: '#ffffff', scoreSz: 22, cardBorder: 'rgba(255,255,255,0.04)', cardBg: 'rgba(255,255,255,0.02)', rankColor: '#57534e' };

const BELT_COLORS: Record<string, string> = {
  white: '#f5f5f4', blue: '#1d4ed8', purple: '#6b21a8',
  brown: '#78350f', black: '#171717', grey: '#9ca3af',
  yellow: '#ca8a04', orange: '#c2410c', green: '#15803d',
};
const BELT_TINTS: Record<string, string> = {
  white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6',
  brown: '#92400E', black: '#2A2A2A', grey: '#9CA3AF',
  yellow: '#EAB308', orange: '#F97316', green: '#22C55E',
  gray: '#9CA3AF',  // alias
};

type Tab = 'classes' | 'games';
type SortBy = 'level' | 'classes';
type Period = 'weekly' | 'monthly' | 'allTime';

function cleanDisplayName(name: string): string {
  if (!name) return 'Member';
  if (name.includes('@')) {
    const local = name.split('@')[0];
    return local
      .replace(/[._+\-]/g, ' ')
      .replace(/\d+/g, '')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || 'Member';
  }
  return name;
}

// ─── Mini belt SVG ─────────────────────────────────────────────────
function BeltMini({ belt }: { belt: string }) {
  const b = (belt || 'white').toLowerCase();
  const fill = BELT_COLORS[b] || '#555';
  const isBlack = b === 'black';
  return (
    <svg width="22" height="7" viewBox="0 0 22 7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="22" height="7" rx="2" fill={fill} opacity="0.9" />
      <rect x="16" y="0" width="6" height="7" rx="1" fill={isBlack ? '#C8A24C' : 'rgba(0,0,0,0.45)'} />
    </svg>
  );
}

export default function LeaderboardPage() {
  const { member } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('classes');
  const [period, setPeriod] = useState<Period>('weekly');
  const [classEntries, setClassEntries] = useState<LeaderboardEntry[]>([]);
  const [gameEntries, setGameEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBelt, setSelectedBelt] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('level');
  const [prevPositions, setPrevPositions] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('lbjj_lb_positions_v1') || '{}'); } catch { return {}; }
  });
  // Live local XP for the current user (re-reads on xp-updated)
  const [localXP, setLocalXP] = useState<number>(() => {
    try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp || 0, s.totalXP || 0); } catch { return 0; }
  });

  // Keep local XP fresh
  useEffect(() => {
    const sync = () => {
      try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); setLocalXP(Math.max(s.xp || 0, s.totalXP || 0)); } catch {}
    };
    window.addEventListener('xp-updated', sync);
    window.addEventListener('checkin-complete', sync);
    return () => { window.removeEventListener('xp-updated', sync); window.removeEventListener('checkin-complete', sync); };
  }, []);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLeaderboard();
      const classes: LeaderboardEntry[] = [];
      const games: LeaderboardEntry[] = [];
      for (const entry of data) {
        // Include anyone with classes, points, wins, or any score — covers members
        // who have TotalPoints from the sheet but haven't checked in via app yet
        const hasActivity = (entry.classCount && entry.classCount > 0)
          || (entry.totalPoints && entry.totalPoints > 0)
          || entry.wins > 0 || entry.bestStreak > 0;
        if (hasActivity) classes.push(entry);
        if (entry.wins > 0 || entry.bestStreak > 0) games.push(entry);
      }
      setClassEntries(classes);
      setGameEntries(games);
      const newPositions: Record<string, number> = {};
      classes.forEach((e, i) => {
        const key = (e as any).email || e.name;
        if (key) newPositions[key] = i + 1;
      });
      localStorage.setItem('lbjj_lb_positions_v1', JSON.stringify(newPositions));
      setPrevPositions(p => ({ ...p }));
    } catch (err) { console.error('[Leaderboard] Failed:', err); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load, period]);

  const entries = tab === 'classes' ? classEntries : gameEntries;

  const filteredEntries = (() => {
    const BELT_GROUPS: Record<string, string[]> = {
      white: ['white'], blue: ['blue'], purple: ['purple'],
      brown: ['brown'], black: ['black'], grey: ['grey', 'gray'],
      yellow: ['yellow'], orange: ['orange'], green: ['green'],
    };
    // Inject local XP for the current user so their rank sorts correctly
    let result = (selectedBelt
      ? entries.filter(e => (BELT_GROUPS[selectedBelt] || [selectedBelt]).includes((e.belt || 'white').toLowerCase()))
      : [...entries])
      .map(e => (member && (e.isMe || e.name === member.name) && localXP > (e.totalPoints || 0))
        ? { ...e, totalPoints: localXP, score: localXP }
        : e
      );
    if (sortBy === 'level') {
      result = result.sort((a, b) => {
        const axp = a.totalPoints || ((a.classCount || 0) * 10);
        const bxp = b.totalPoints || ((b.classCount || 0) * 10);
        return bxp - axp;
      });
    } else {
      result = result.sort((a, b) => (b.classCount || 0) - (a.classCount || 0));
    }
    return result;
  })();

  return (
    <div className="app-content" style={{ background: '#030303' }}>
      <style>{`
        @keyframes lb-pulse-glow {
          0%   { box-shadow: 0 0 20px rgba(253,224,71,0.15), inset 0 1px 0 rgba(255,255,255,0.05); }
          100% { box-shadow: 0 0 40px rgba(253,224,71,0.3),  inset 0 1px 0 rgba(255,255,255,0.08); }
        }
        .lb-stagger { animation: lb-stagger-in 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes lb-stagger-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .lb-list-scroll::-webkit-scrollbar { display:none; }
        .lb-filter-scroll::-webkit-scrollbar { display:none; }
      `}</style>

      {/* ── Sticky header ── */}
      <div className="lb-stagger" style={{
        padding: '20px 20px 14px', position: 'sticky', top: 0,
        background: 'rgba(3,3,3,0.85)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        zIndex: 50, borderBottom: '1px solid rgba(255,255,255,0.05)',
        animationDelay: '0ms',
      }}>
        {/* Title + refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Leaderboard
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#a8a29e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Primary toggle: Level / Classes */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12 }}>
          {([
            { key: 'level' as SortBy,   label: 'Level',   icon: <BoltIcon size={13} color="currentColor" /> },
            { key: 'classes' as SortBy, label: 'Classes', icon: <CalendarSparkIcon size={13} color="currentColor" /> },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setSortBy(t.key)} style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              color: sortBy === t.key ? '#fff' : '#a8a29e',
              background: sortBy === t.key ? 'linear-gradient(135deg, #151412, rgba(255,255,255,0.1))' : 'transparent',
              border: sortBy === t.key ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: sortBy === t.key ? '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)' : 'none',
              transition: 'all 0.2s',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Belt filter scroll */}
        <div className="lb-filter-scroll" style={{ display: 'flex', overflowX: 'auto', gap: 8, marginBottom: 12, paddingBottom: 2, scrollbarWidth: 'none' }}>
          {([
            { key: null,     label: 'All Belts', color: '#888' },
            // Adult belts
            { key: 'black',  label: 'Black',    color: '#C8A24C', belt: 'black'  },
            { key: 'brown',  label: 'Brown',    color: '#92400E', belt: 'brown'  },
            { key: 'purple', label: 'Purple',   color: '#8B5CF6', belt: 'purple' },
            { key: 'blue',   label: 'Blue',     color: '#3B82F6', belt: 'blue'   },
            { key: 'white',  label: 'White',    color: '#E0E0E0', belt: 'white'  },
            // Kids belts
            { key: 'grey',   label: 'Grey',     color: '#9CA3AF', belt: 'grey'   },
            { key: 'yellow', label: 'Yellow',   color: '#EAB308', belt: 'yellow' },
            { key: 'orange', label: 'Orange',   color: '#F97316', belt: 'orange' },
            { key: 'green',  label: 'Green',    color: '#22C55E', belt: 'green'  },
          ] as { key: string | null; label: string; color: string; belt?: string }[]).map(chip => {
            const isActive = selectedBelt === chip.key;
            return (
              <button key={String(chip.key)} onClick={() => setSelectedBelt(chip.key)} style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 999,
                fontSize: 12, fontWeight: 700,
                color: isActive ? '#000' : '#a8a29e',
                background: isActive ? '#e8af34' : '#0a0908',
                border: isActive ? '1px solid #fde047' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: isActive ? '0 4px 12px rgba(232,175,52,0.2)' : 'none',
                transition: '0.2s',
              }}>
                {chip.belt && <BeltMini belt={chip.belt} />}
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Time period filter */}
        <div style={{ display: 'flex', background: '#0a0908', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
          {([
            { key: 'allTime' as Period, label: 'All Time' },
            { key: 'monthly' as Period, label: 'This Month' },
            { key: 'weekly' as Period,  label: 'This Week' },
          ]).map(t => (
            <button key={t.key} onClick={() => setPeriod(t.key)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8,
              fontSize: 12, fontWeight: 700,
              color: period === t.key ? '#e8af34' : '#57534e',
              background: period === t.key ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: 'none', cursor: 'pointer', transition: '0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      <div className="lb-list-scroll" style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', scrollbarWidth: 'none' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            illustration="leaderboard"
            heading={tab === 'classes' ? "No rankings yet" : "No game scores yet"}
            description={tab === 'classes' ? "Check in to classes to appear on the leaderboard." : "Play a game and win to get on the board."}
            ctaLabel={tab === 'classes' ? "View Schedule" : "Play Now"}
            ctaHref={tab === 'classes' ? "/#/schedule" : "/#/games"}
          />
        ) : (
          filteredEntries.map((entry, i) => {
            const rank = i + 1;
            const rc = RANK_COLORS[rank] || DEFAULT_RANK;
            const isMe = entry.isMe || (member && entry.name === member.name);
            // For current user: always use local XP (includes unsynced gains); for others use API data
            const entryXP = isMe
              ? Math.max(localXP, entry.totalPoints || 0, (entry.classCount || 0) * 10)
              : (entry.totalPoints || ((entry.classCount || 0) * 10));
            const entryLevel = getActualLevel(entryXP);
            const beltKey = (entry.belt || 'white').toLowerCase();
            const beltTint = BELT_TINTS[beltKey] || '#888';
            const prevKey = (entry as any).email || entry.name;
            const prevPos = prevKey ? prevPositions[prevKey] : undefined;
            const rankDelta = prevPos !== undefined && prevPos !== rank ? prevPos - rank : null;

            const entryEmail = (entry as any).email as string | undefined;
            const onRowTap = () => {
              if (entryEmail) navigate(`/profile/${encodeURIComponent(entryEmail)}`);
            };
            return (
              <div
                key={i}
                className="lb-stagger"
                onClick={entryEmail ? onRowTap : undefined}
                style={{
                  animationDelay: `${Math.min(i, 10) * 60}ms`,
                  background: isMe ? `rgba(232,175,52,0.06)` : rc.cardBg,
                  border: `1px solid ${isMe ? 'rgba(232,175,52,0.3)' : rc.cardBorder}`,
                  borderRadius: 18, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 0,
                  transition: 'all 0.3s',
                  animation: i === 0 ? 'lb-pulse-glow 2s ease-in-out infinite alternate' : `lb-stagger-in ${Math.min(i, 10) * 60}ms cubic-bezier(0.16,1,0.3,1) both`,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: rank <= 3 ? `0 0 ${rank === 1 ? 20 : 12}px ${rc.cardBorder}` : 'none',
                  cursor: entryEmail ? 'pointer' : 'default',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Rank badge */}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: rank <= 3 ? `${rc.rankColor}18` : 'rgba(255,255,255,0.03)',
                  border: rank <= 3 ? `1px solid ${rc.rankColor}40` : '1px solid rgba(255,255,255,0.05)',
                  marginRight: 2,
                }}>
                  <span style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 13, fontWeight: 900, color: rc.rankColor, lineHeight: 1 }}>{rank}</span>
                </div>

                {/* Rank delta */}
                {rankDelta !== null && (
                  <div style={{ position: 'absolute', left: 32, top: 8, fontSize: 8, fontWeight: 700, color: rankDelta > 0 ? '#4CAF80' : '#E05555', lineHeight: 1 }}>
                    {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
                  </div>
                )}

                {/* Paragon avatar */}
                <div style={{ margin: '0 10px', flexShrink: 0 }}>
                  <ParagonRing level={entryLevel} size={42} showOrbit={entryLevel >= 6}>
                    {entry.profilePic
                      ? <img src={entry.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} alt="" />
                      : <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `${beltTint}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: beltTint }}>
                          {(cleanDisplayName(entry.name) || '?')[0].toUpperCase()}
                        </div>
                    }
                  </ParagonRing>
                </div>

                {/* Name + belt */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15, fontWeight: 700,
                    color: isMe ? '#e8af34' : rc.name,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    lineHeight: 1.1, letterSpacing: '-0.01em',
                    textShadow: rank <= 3 ? `0 0 12px ${rc.name}50` : 'none',
                  }}>
                    {cleanDisplayName(entry.name)}{isMe ? ' (You)' : ''}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <BeltMini belt={beltKey} />
                    <span style={{ fontFamily: 'var(--font-display,system-ui)', fontSize: 10, fontWeight: 800, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {beltKey.charAt(0).toUpperCase() + beltKey.slice(1)} Belt
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1, marginBottom: 2 }}>
                    {sortBy === 'level' ? 'LVL' : 'CLS'}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display,system-ui)',
                    fontSize: rc.scoreSz,
                    fontWeight: 900,
                    color: isMe ? '#e8af34' : rc.score,
                    lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: rank <= 3 ? `0 0 12px ${rc.score}50` : 'none',
                  }}>
                    {sortBy === 'level' ? (entryLevel || (entry.classCount || entry.score || 0)) : (entry.classCount || entry.score || 0)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* My sticky row if outside top 10 */}
        {(() => {
          if (!member || loading) return null;
          const userIdx = filteredEntries.findIndex(e => e.isMe || e.name === member.name);
          if (userIdx < 0 || userIdx < 10) return null;
          const userEntry = filteredEntries[userIdx];
          const userRank = userIdx + 1;
          const entryXP = Math.max(localXP, userEntry.totalPoints || 0, (userEntry.classCount || 0) * 10);
          const entryLevel = getActualLevel(entryXP);
          return (
            <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(transparent, #030303 25%)', paddingTop: 16 }}>
              <div style={{ background: 'rgba(232,175,52,0.08)', border: '1px solid rgba(232,175,52,0.25)', borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8af34' }}>#{userRank}</span>
                <ParagonRing level={entryLevel} size={32} showOrbit={false}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(232,175,52,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#e8af34' }}>
                    {(cleanDisplayName(userEntry.name) || '?')[0].toUpperCase()}
                  </div>
                </ParagonRing>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#e8af34' }}>{cleanDisplayName(userEntry.name)} (You)</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#e8af34', fontFamily: 'var(--font-display,system-ui)' }}>
                  {sortBy === 'level' ? (entryLevel || 0) : (userEntry.classCount || 0)}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
