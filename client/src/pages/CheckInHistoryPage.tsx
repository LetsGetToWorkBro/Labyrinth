import { useState, useEffect } from 'react';
import { getMemberCheckIns } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Loader2, CalendarDays } from 'lucide-react';

const GOLD = '#C8A24C';

const VISIBLE_COUNT = 20;

export default function CheckInHistoryPage() {
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getMemberCheckIns().then(data => {
      // Deduplicate: same className + same date = keep first occurrence
      const seen = new Set<string>();
      const deduped = data.filter((ci: any) => {
        const dateStr = (ci.timestamp || ci.date || ci.checkInDate || ci.classDate || '').toString();
        const day = dateStr.split('T')[0] || dateStr.split(' ')[0] || '';
        const key = (ci.className || ci.class || ci.classType || '') + '|' + day;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Sort most recent first
      const sorted = [...deduped].sort((a, b) => {
        const da = new Date(a.timestamp || a.date || a.checkInDate || a.classDate || 0).getTime();
        const db = new Date(b.timestamp || b.date || b.checkInDate || b.classDate || 0).getTime();
        return db - da;
      });
      setCheckIns(sorted);
      setLoading(false);
    }).catch(err => {
      console.error('[CheckInHistory] Failed to load check-ins:', err);
      setLoading(false);
    });
  }, []);

  // Stats
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = checkIns.filter(c => {
    const d = new Date(c.timestamp || c.date || c.checkInDate || c.classDate || 0);
    return d >= thisWeekStart;
  }).length;

  const thisMonth = checkIns.filter(c => {
    const d = new Date(c.timestamp || c.date || c.checkInDate || c.classDate || 0);
    return d >= thisMonthStart;
  }).length;

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return dateStr; }
  }

  return (
    <div className="app-content">
      <ScreenHeader
        title="Class History"
        right={
          <div style={{
            background: `${GOLD}20`, border: `1px solid ${GOLD}30`, borderRadius: 20,
            padding: '4px 12px', fontSize: 13, fontWeight: 700, color: GOLD,
          }}>
            {checkIns.length}
          </div>
        }
      />

      {/* Stats summary */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px' }}>
        {[
          { label: 'Total', value: checkIns.length },
          { label: 'This Month', value: thisMonth },
          { label: 'This Week', value: thisWeek },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, background: '#111', borderRadius: 12, padding: '14px 12px',
            border: '1px solid #1A1A1A', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#666', fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard link */}
      <div style={{ padding: '0 20px 12px' }}>
        <a href="/#/leaderboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#111', borderRadius: 12, border: '1px solid #1A1A1A', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🏆</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0' }}>View Class Leaderboard</span>
          </div>
          <span style={{ fontSize: 11, color: '#C8A24C', fontWeight: 600 }}>See rankings →</span>
        </a>
      </div>

      {/* List */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#555' }} />
          </div>
        ) : checkIns.length === 0 ? (
          <div style={{
            background: '#111', borderRadius: 14, padding: '48px 24px',
            textAlign: 'center', border: '1px solid #1A1A1A',
          }}>
            <CalendarDays size={36} style={{ color: '#333', marginBottom: 12 }} />
            <div style={{ color: '#888', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              No classes recorded yet
            </div>
            <div style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>
              Check in to your first class!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(showAll ? checkIns : checkIns.slice(0, VISIBLE_COUNT)).map((ci, i) => (
              <div key={i} style={{
                background: '#111', borderRadius: 12, padding: '12px 14px',
                border: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: `${GOLD}12`,
                  border: `1px solid ${GOLD}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <CalendarDays size={18} style={{ color: GOLD }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#F0F0F0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ci.className || ci.class || ci.classType || 'Class'}
                  </div>
                  <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                    {formatDate(ci.timestamp || ci.date || ci.checkInDate || ci.classDate)}
                    {(ci.instructor || ci.coach) && ` · ${ci.instructor || ci.coach}`}
                  </div>
                </div>
              </div>
            ))}
            {!showAll && checkIns.length > VISIBLE_COUNT && (
              <button
                onClick={() => setShowAll(true)}
                style={{
                  display: 'block', width: '100%', padding: '12px',
                  textAlign: 'center', color: '#C8A24C', fontSize: 13,
                  fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer'
                }}
              >
                Show all {checkIns.length} check-ins
              </button>
            )}
          </div>
        )}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}
