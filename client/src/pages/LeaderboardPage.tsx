import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { RefreshCw } from 'lucide-react';
import { getActualLevel } from '@/lib/xp';

const GOLD = '#C8A24C';

type Tab = 'classes' | 'games';
type SortBy = 'classes' | 'level';
type Period = 'weekly' | 'monthly' | 'allTime';

const BELT_DOT_COLORS: Record<string, string> = {
  white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6',
  brown: '#92400E', black: '#1A1A1A', grey: '#9CA3AF',
  yellow: '#EAB308', orange: '#F97316', green: '#22C55E',
};

export default function LeaderboardPage() {
  const { member } = useAuth();
  const [tab, setTab] = useState<Tab>('classes');
  const [period, setPeriod] = useState<Period>('weekly');
  const [classEntries, setClassEntries] = useState<LeaderboardEntry[]>([]);
  const [gameEntries, setGameEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBelt, setSelectedBelt] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('classes');
  const [prevPositions, setPrevPositions] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('lbjj_lb_positions_v1') || '{}'); } catch { return {}; }
  });

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLeaderboard();
      // Split entries: those with classCount go to classes, others to games
      const classes: LeaderboardEntry[] = [];
      const games: LeaderboardEntry[] = [];
      for (const entry of data) {
        if (entry.classCount && entry.classCount > 0) {
          classes.push(entry);
        }
        if (entry.wins > 0 || entry.score || entry.bestStreak > 0) {
          games.push(entry);
        }
        // If entry has both, it appears in both tabs
        // If entry has neither classCount nor game stats, put in classes as default
        if (!(entry.classCount && entry.classCount > 0) && !(entry.wins > 0 || entry.score || entry.bestStreak > 0)) {
          classes.push(entry);
        }
      }
      setClassEntries(classes);
      setGameEntries(games);
      // Save current positions for rank delta tracking
      const newPositions: Record<string, number> = {};
      classes.forEach((e, i) => { if (e.name) newPositions[e.name] = i + 1; });
      localStorage.setItem('lbjj_lb_positions_v1', JSON.stringify(newPositions));
      setPrevPositions(prev => ({ ...prev })); // trigger re-read
    } catch (err) {
      console.error('[Leaderboard] Failed to load leaderboard:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load, period]);

  const entries = tab === 'classes' ? classEntries : gameEntries;

  const BELT_GROUPS: Record<string, string[]> = {
    white:  ['white'],
    blue:   ['blue'],
    purple: ['purple'],
    brown:  ['brown'],
    black:  ['black'],
    grey:   ['grey', 'gray'],
    yellow: ['yellow'],
    orange: ['orange'],
    green:  ['green'],
  };

  const filteredEntries = (() => {
    let result = selectedBelt
      ? entries.filter(e => {
          const b = (e.belt || 'white').toLowerCase();
          return (BELT_GROUPS[selectedBelt] || [selectedBelt]).includes(b);
        })
      : entries;
    if (sortBy === 'level') {
      result = [...result].sort((a, b) =>
        getActualLevel(b.totalPoints || 0) - getActualLevel(a.totalPoints || 0)
      );
    }
    return result;
  })();

  const beltDotColor = (belt?: string) => {
    if (!belt) return '#666';
    return BELT_DOT_COLORS[belt.toLowerCase()] || '#666';
  };

  return (
    <div className="app-content">
      <ScreenHeader
        title="Leaderboard"
        right={
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* Classes / Games tabs */}
      <div style={{ display: 'flex', margin: '0 20px 12px', gap: 4, padding: 4, backgroundColor: '#111', borderRadius: 12, border: '1px solid #1A1A1A', alignItems: 'center' }}>
        {([
          { key: 'classes' as Tab, label: 'Classes', icon: '📅' },
          { key: 'games' as Tab, label: 'Games', icon: '🎮' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: tab === t.key ? '#1A1A1A' : 'transparent',
              color: tab === t.key ? GOLD : '#666',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Sort by toggle */}
      <div style={{ margin: '0 20px 8px', display: 'flex', gap: 6 }}>
        {([{ key: 'classes', label: '# Classes' }, { key: 'level', label: '⚡ Level' }] as { key: SortBy; label: string }[]).map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            style={{ padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: sortBy === s.key ? GOLD : '#1A1A1A',
              color: sortBy === s.key ? '#000' : '#666',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Belt filter pills */}
      <div style={{ margin: '0 20px 12px', display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' as any }}>
        {([
          { key: null,     label: 'All',    color: '#888' },
          { key: 'white',  label: 'White',  color: '#E5E5E5' },
          { key: 'blue',   label: 'Blue',   color: '#1A5DAB' },
          { key: 'purple', label: 'Purple', color: '#7E3AF2' },
          { key: 'brown',  label: 'Brown',  color: '#92400E' },
          { key: 'black',  label: 'Black',  color: '#C8A24C' },
          { key: 'grey',   label: 'Grey',   color: '#6B6B6B' },
          { key: 'yellow', label: 'Yellow', color: '#C49B1A' },
          { key: 'orange', label: 'Orange', color: '#C4641A' },
          { key: 'green',  label: 'Green',  color: '#2D8040' },
        ] as { key: string | null; label: string; color: string }[]).map(pill => {
          const isActive = selectedBelt === pill.key;
          return (
            <button
              key={String(pill.key)}
              onClick={() => setSelectedBelt(pill.key)}
              style={{
                flexShrink: 0,
                padding: '5px 12px', borderRadius: 20,
                background: isActive ? `${pill.color}22` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? pill.color + '60' : '#1A1A1A'}`,
                color: isActive ? pill.color : '#555',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Period tabs */}
      <div style={{ display: 'flex', margin: '0 20px 16px', gap: 4, padding: 4, backgroundColor: '#111', borderRadius: 12, border: '1px solid #1A1A1A' }}>
        {([
          { key: 'weekly' as Period, label: 'This Week' },
          { key: 'monthly' as Period, label: 'This Month' },
          { key: 'allTime' as Period, label: 'All Time' },
        ]).map(t => (
          <button key={t.key} onClick={() => setPeriod(t.key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: period === t.key ? '#1A1A1A' : 'transparent',
              color: period === t.key ? GOLD : '#666',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 60, borderRadius: 12, backgroundColor: '#111', border: '1px solid #1A1A1A', opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ background: '#111', borderRadius: 12, padding: '40px 20px', textAlign: 'center', border: '1px solid #1A1A1A' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'classes' ? '📅' : '🎮'}</div>
            <div style={{ color: '#888', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No entries yet</div>
            <div style={{ color: '#555', fontSize: 13 }}>
              {tab === 'classes'
                ? 'Check in to classes to appear on the leaderboard!'
                : 'Play games and win to appear here!'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredEntries.map((entry, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              const isTop3 = i < 3;
              const isMe = entry.isMe || (member && entry.name === member.name);
              const hasClassCount = entry.classCount && entry.classCount > 0;
              const currentPos = i + 1;
              const prevPos = entry.name ? prevPositions[entry.name] : undefined;
              const rankDelta = prevPos !== undefined && prevPos !== currentPos ? prevPos - currentPos : null;
              return (
                <div key={i} style={{
                  background: isMe ? `${GOLD}14` : isTop3 ? `${GOLD}0A` : '#111',
                  borderRadius: 12, padding: '12px 14px',
                  border: `1px solid ${isMe ? GOLD + '40' : isTop3 ? GOLD + '20' : '#1A1A1A'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                    {medal
                      ? <span style={{ fontSize: 18 }}>{medal}</span>
                      : <span style={{ color: '#555', fontSize: 13, fontWeight: 700 }}>#{currentPos}</span>}
                    {rankDelta !== null && (
                      <div style={{ fontSize: 9, fontWeight: 700, color: rankDelta > 0 ? '#4CAF80' : '#E05555', lineHeight: 1, marginTop: 1 }}>
                        {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {entry.belt && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: beltDotColor(entry.belt),
                        border: entry.belt.toLowerCase() === 'black' ? '1px solid #C8A24C' : '1px solid transparent',
                      }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: isTop3 ? '#F0F0F0' : '#DDD', fontSize: 13, fontWeight: isMe ? 700 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.name}{isMe ? ' (You)' : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0, textAlign: 'right' }}>
                    <div>
                      <div style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>
                        {tab === 'classes'
                          ? (entry.classCount || entry.score || 0)
                          : (entry.score || entry.wins || 0)
                        }
                      </div>
                      <div style={{ color: '#555', fontSize: 10 }}>
                        {tab === 'classes' ? 'classes' : 'pts'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}
