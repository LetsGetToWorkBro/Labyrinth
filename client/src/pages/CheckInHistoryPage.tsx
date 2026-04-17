import { useState, useEffect } from 'react';
import { getMemberCheckIns } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Loader2, CalendarDays, Zap, Flame, Trophy, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const GOLD = '#C8A24C';
const VISIBLE_COUNT = 25;

// XP per class (mirrors GAS)
const XP_PER_CLASS = 10;

// Belt display helpers
const BELT_COLORS: Record<string, string> = {
  white: '#E5E5E5', blue: '#1A6BC7', purple: '#7B2FBE',
  brown: '#6B3A1F', black: '#1A1A1A', grey: '#555',
};

function getBeltColor(belt?: string) {
  return BELT_COLORS[(belt || 'white').toLowerCase()] || GOLD;
}

// Class-type icon
function classIcon(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('nogi') || n.includes('no-gi')) return '🩱';
  if (n.includes('kids') || n.includes('youth')) return '🌟';
  if (n.includes('comp') || n.includes('advance')) return '⚔️';
  if (n.includes('open') || n.includes('mat')) return '🟡';
  if (n.includes('stripe') || n.includes('promotion')) return '🏅';
  return '🥋';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

function formatFullDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return dateStr; }
}

// Group check-ins by week
function groupByWeek(checkIns: any[]) {
  const groups: Record<string, any[]> = {};
  checkIns.forEach(ci => {
    const d = new Date(ci.timestamp || ci.date || ci.checkInDate || ci.classDate || 0);
    const monday = new Date(d);
    const day = d.getDay();
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(ci);
  });
  return groups;
}

function weekLabel(isoKey: string) {
  try {
    const d = new Date(isoKey);
    const now = new Date();
    const thisMon = new Date(now);
    const day = now.getDay();
    thisMon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    thisMon.setHours(0, 0, 0, 0);
    if (d.getTime() === thisMon.getTime()) return 'This Week';
    const lastMon = new Date(thisMon);
    lastMon.setDate(thisMon.getDate() - 7);
    if (d.getTime() === lastMon.getTime()) return 'Last Week';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' week';
  } catch { return isoKey; }
}

export default function CheckInHistoryPage() {
  const { member } = useAuth();
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getMemberCheckIns().then(data => {
      const seen = new Set<string>();
      const deduped = data.filter((ci: any) => {
        const dateStr = (ci.timestamp || ci.date || ci.checkInDate || ci.classDate || '').toString();
        const day = dateStr.split('T')[0] || dateStr.split(' ')[0] || '';
        const key = (ci.className || ci.class || ci.classType || '') + '|' + day;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const sorted = [...deduped].sort((a, b) => {
        const da = new Date(a.timestamp || a.date || a.checkInDate || a.classDate || 0).getTime();
        const db = new Date(b.timestamp || b.date || b.checkInDate || b.classDate || 0).getTime();
        return db - da;
      });
      setCheckIns(sorted);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Stats
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeekCount = checkIns.filter(c => new Date(c.timestamp || c.date || 0) >= thisWeekStart).length;
  const thisMonthCount = checkIns.filter(c => new Date(c.timestamp || c.date || 0) >= thisMonthStart).length;
  const totalXP = checkIns.length * XP_PER_CLASS;

  // Best week
  const weekGroups = groupByWeek(checkIns);
  const bestWeek = Math.max(0, ...Object.values(weekGroups).map(g => g.length));

  const displayedCheckIns = showAll ? checkIns : checkIns.slice(0, VISIBLE_COUNT);

  const belt = member?.belt || 'white';
  const beltColor = getBeltColor(belt);

  return (
    <div className="app-content" style={{ paddingBottom: 32 }}>
      <ScreenHeader
        title="Class History"
        right={
          <div style={{
            background: `${GOLD}20`, border: `1px solid ${GOLD}30`, borderRadius: 20,
            padding: '4px 12px', fontSize: 13, fontWeight: 700, color: GOLD,
          }}>
            {loading ? '—' : checkIns.length}
          </div>
        }
      />

      {/* ── Hero stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px 16px' }}>
        {/* Total */}
        <div style={{
          gridColumn: '1 / -1',
          background: `linear-gradient(135deg, #141008, #0D0D0D)`,
          border: `1px solid ${GOLD}25`, borderRadius: 16,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: `${GOLD}15`, border: `1px solid ${GOLD}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={24} color={GOLD} />
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#F0F0F0', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {loading ? '—' : checkIns.length}
            </div>
            <div style={{ fontSize: 11, color: '#666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
              Total Classes
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>{loading ? '—' : `+${totalXP.toLocaleString()}`}</div>
            <div style={{ fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>XP Earned</div>
          </div>
        </div>

        {/* This week */}
        <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Flame size={14} color="#E05A2B" />
            <span style={{ fontSize: 10, color: '#666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>This Week</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F0F0' }}>{loading ? '—' : thisWeekCount}</div>
        </div>

        {/* This month */}
        <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Star size={14} color={GOLD} />
            <span style={{ fontSize: 10, color: '#666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>This Month</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F0F0' }}>{loading ? '—' : thisMonthCount}</div>
        </div>

        {/* Best week */}
        <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Trophy size={14} color={GOLD} />
            <span style={{ fontSize: 10, color: '#666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best Week</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F0F0' }}>{loading ? '—' : bestWeek}</div>
        </div>

        {/* XP per class */}
        <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Zap size={14} color="#60A5FA" />
            <span style={{ fontSize: 10, color: '#666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Per Class</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F0F0' }}>+{XP_PER_CLASS} <span style={{ fontSize: 14, color: '#555', fontWeight: 600 }}>XP</span></div>
        </div>
      </div>

      {/* ── Leaderboard link ── */}
      <div style={{ padding: '0 20px 16px' }}>
        <a href="/#/leaderboard" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: '#111', borderRadius: 12,
          border: '1px solid #1A1A1A', textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0' }}>Class Leaderboard</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>See where you rank this week</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>View →</span>
        </a>
      </div>

      {/* ── Check-in list ── */}
      <div style={{ padding: '0 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#555' }} />
          </div>
        ) : checkIns.length === 0 ? (
          <div style={{
            background: '#111', borderRadius: 16, padding: '48px 24px',
            textAlign: 'center', border: '1px solid #1A1A1A',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🥋</div>
            <div style={{ color: '#F0F0F0', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No classes yet</div>
            <div style={{ color: '#555', fontSize: 13, lineHeight: 1.5 }}>
              Check in to your first class and start earning XP.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayedCheckIns.map((ci, i) => {
              const dateKey = (ci.timestamp || ci.date || ci.checkInDate || ci.classDate || '').toString();
              const name = ci.className || ci.class || ci.classType || 'Class';
              const icon = classIcon(name);
              const isExpanded = expandedId === `${i}`;

              return (
                <div
                  key={i}
                  onClick={() => setExpandedId(isExpanded ? null : `${i}`)}
                  style={{
                    background: '#111', borderRadius: 12,
                    border: isExpanded ? `1px solid ${GOLD}30` : '1px solid #1A1A1A',
                    overflow: 'hidden', cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{
                    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: `${GOLD}10`, border: `1px solid ${GOLD}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {icon}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#F0F0F0', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </div>
                      <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>
                        {formatDate(dateKey)}
                        {ci.instructor && <span style={{ color: '#444' }}> · {ci.instructor}</span>}
                      </div>
                    </div>

                    {/* XP chip */}
                    <div style={{
                      flexShrink: 0, padding: '3px 8px', borderRadius: 20,
                      background: `${GOLD}12`, border: `1px solid ${GOLD}25`,
                      fontSize: 10, fontWeight: 800, color: GOLD,
                      letterSpacing: '0.04em',
                    }}>
                      +{XP_PER_CLASS} XP
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      padding: '0 14px 14px', borderTop: '1px solid #1A1A1A',
                      paddingTop: 12,
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ background: '#0D0D0D', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Date</div>
                          <div style={{ fontSize: 12, color: '#F0F0F0', fontWeight: 600 }}>{formatFullDate(dateKey)}</div>
                        </div>
                        <div style={{ background: '#0D0D0D', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>XP Gained</div>
                          <div style={{ fontSize: 12, color: GOLD, fontWeight: 800 }}>+{XP_PER_CLASS} XP</div>
                        </div>
                        {ci.instructor && (
                          <div style={{ background: '#0D0D0D', borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Instructor</div>
                            <div style={{ fontSize: 12, color: '#F0F0F0', fontWeight: 600 }}>{ci.instructor}</div>
                          </div>
                        )}
                        <div style={{ background: '#0D0D0D', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Class #</div>
                          <div style={{ fontSize: 12, color: '#F0F0F0', fontWeight: 600 }}>#{checkIns.length - i} of {checkIns.length}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {!showAll && checkIns.length > VISIBLE_COUNT && (
              <button
                onClick={() => setShowAll(true)}
                style={{
                  width: '100%', padding: '14px', textAlign: 'center',
                  color: GOLD, fontSize: 13, fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                Show all {checkIns.length} sessions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
