import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getBeltColor } from '@/lib/constants';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Loader2, RefreshCw } from 'lucide-react';

const GOLD = '#C8A24C';

type Period = 'weekly' | 'monthly' | 'allTime';

export default function LeaderboardPage() {
  const { member } = useAuth();
  const [period, setPeriod] = useState<Period>('weekly');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch {
      // silent
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load, period]);

  const beltDotColor = (belt?: string) => {
    if (!belt) return '#666';
    const colors: Record<string, string> = {
      white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6',
      brown: '#92400E', black: '#1A1A1A',
    };
    return colors[belt.toLowerCase()] || '#666';
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
        ) : entries.length === 0 ? (
          <div style={{ background: '#111', borderRadius: 12, padding: '40px 20px', textAlign: 'center', border: '1px solid #1A1A1A' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <div style={{ color: '#888', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No entries yet</div>
            <div style={{ color: '#555', fontSize: 13 }}>Check in to classes to appear on the leaderboard!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {entries.map((entry, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              const isTop3 = i < 3;
              const isMe = entry.isMe || (member && entry.name === member.name);
              return (
                <div key={i} style={{
                  background: isMe ? `${GOLD}14` : isTop3 ? `${GOLD}0A` : '#111',
                  borderRadius: 12, padding: '12px 14px',
                  border: `1px solid ${isMe ? GOLD + '40' : isTop3 ? GOLD + '20' : '#1A1A1A'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                    {medal
                      ? <span style={{ fontSize: 18 }}>{medal}</span>
                      : <span style={{ color: '#555', fontSize: 13, fontWeight: 700 }}>#{entry.rank || i + 1}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {entry.belt && (
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
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
                        {entry.classCount || entry.score || entry.wins}{entry.classCount ? '' : 'W'}
                      </div>
                      <div style={{ color: '#555', fontSize: 10 }}>
                        {entry.classCount ? 'classes' : 'wins'}
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
