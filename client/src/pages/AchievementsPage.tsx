import { useState, useEffect, useRef } from 'react';
import { useHashLocation } from 'wouter/use-hash-location';
import { ALL_ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, checkAndUnlockAchievements } from '@/lib/achievements';
import type { Achievement } from '@/lib/achievements';
import { gasCall } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AchievementBadge } from '@/lib/achievement-icons';

export default function AchievementsPage() {
  const [, navigate] = useHashLocation();
  const { member } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [earnedKeys, setEarnedKeys] = useState<string[]>([]);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isSelectedEarned, setIsSelectedEarned] = useState(false);
  const [newBadgeKeys, setNewBadgeKeys] = useState<string[]>([]);

  // 4a: Progress bar animated fill
  const progressRef = useRef<HTMLDivElement>(null);

  // 4e: Filter tab indicator slide
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Run local achievement checks
    const profile = (() => { try { return JSON.parse(localStorage.getItem('lbjj_member_profile') || '{}'); } catch { return {}; } })();
    const stats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    checkAndUnlockAchievements(profile, stats);

    // Merge from localStorage
    const local: string[] = (() => { try { return JSON.parse(localStorage.getItem('lbjj_achievements') || '[]'); } catch { return []; } })();
    setEarnedKeys(local);

    // Also fetch from GAS and merge
    if (member?.email) {
      gasCall('getMemberBadges', { email: member.email }).then((res: any) => {
        if (res?.badges && Array.isArray(res.badges)) {
          const serverKeys = res.badges.map((b: any) => b.key);
          const merged = Array.from(new Set([...local, ...serverKeys]));
          setEarnedKeys(merged);
          localStorage.setItem('lbjj_achievements', JSON.stringify(merged));
        }
      }).catch(() => {});
    }
  }, [member?.email]);

  // 4a: Animate progress bar fill on mount/change
  useEffect(() => {
    if (!progressRef.current) return;
    const total = ALL_ACHIEVEMENTS.length;
    const earned = earnedKeys.length;
    const pct = (earned / total * 100).toFixed(1) + '%';
    progressRef.current.style.setProperty('--progress', pct);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressRef.current?.classList.add('animate');
      });
    });
  }, [earnedKeys]);

  // 4d: Check for newly unlocked badges this session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lbjj_new_badges');
      if (raw) {
        const keys = JSON.parse(raw);
        if (Array.isArray(keys)) setNewBadgeKeys(keys);
      }
    } catch {}
  }, []);

  // 4e: Move indicator on tab change
  useEffect(() => {
    const activeEl = tabRefs.current[activeCategory];
    const indicator = indicatorRef.current;
    if (!activeEl || !indicator) return;
    indicator.style.transform = `translateX(${activeEl.offsetLeft}px)`;
    indicator.style.width = `${activeEl.offsetWidth}px`;
  }, [activeCategory]);

  const filtered = activeCategory === 'all'
    ? ALL_ACHIEVEMENTS
    : ALL_ACHIEVEMENTS.filter(a => a.category === activeCategory);

  const earnedCount = earnedKeys.length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  const getEarnedDate = (key: string): string | null => {
    try {
      const dates = JSON.parse(localStorage.getItem('lbjj_achievement_dates') || '{}');
      return dates[key] || null;
    } catch { return null; }
  };

  return (
    <div className="app-content achievements-page" style={{ background: '#0A0A0A', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ padding: '0 20px', paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => navigate('/more')}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', color: '#C8A24C', fontWeight: 600, fontSize: 14 }}
          >
            &larr; Back
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F0F0F0', flex: 1, margin: 0 }}>Achievements</h1>
          <div style={{
            background: 'rgba(200,162,76,0.15)',
            border: '1px solid rgba(200,162,76,0.3)',
            borderRadius: 20,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: '#C8A24C',
          }}>
            {earnedCount} / {totalCount}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ margin: '0 0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0' }}>Progress</span>
            <span style={{ fontSize: 13, color: '#C8A24C', fontWeight: 700 }}>{earnedCount} / {totalCount}</span>
          </div>
          <div className="achievement-progress-bar" ref={progressRef} style={{ height: 6, background: '#1A1A1A', borderRadius: 3, overflow: 'hidden' }}>
            <div className="achievement-progress-fill" style={{
              height: '100%',
              width: `${totalCount > 0 ? Math.round(earnedCount / totalCount * 100) : 0}%`,
              background: 'linear-gradient(90deg, #C8A24C, #E8C86C)',
              borderRadius: 3,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Category filter tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 16,
          WebkitOverflowScrolling: 'touch' as any,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
        }}>
          <div ref={indicatorRef} style={{
            position: 'absolute',
            bottom: 0,
            height: 2,
            background: '#C8A24C',
            borderRadius: 999,
            transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          <button
            ref={el => { tabRefs.current['all'] = el; }}
            onClick={() => setActiveCategory('all')}
            style={{
              flexShrink: 0,
              padding: '7px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              border: activeCategory === 'all' ? '1px solid rgba(200,162,76,0.4)' : '1px solid #222',
              background: activeCategory === 'all' ? 'rgba(200,162,76,0.15)' : '#111',
              color: activeCategory === 'all' ? '#C8A24C' : '#666',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All
          </button>
          {ACHIEVEMENT_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              ref={el => { tabRefs.current[cat.key] = el; }}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: activeCategory === cat.key ? `1px solid ${cat.color}66` : '1px solid #222',
                background: activeCategory === cat.key ? `${cat.color}22` : '#111',
                color: activeCategory === cat.key ? cat.color : '#666',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        padding: '0 20px 120px',
      }}>
        {filtered.map((a, index) => {
          const isEarned = earnedKeys.includes(a.key);
          const isSecret = !!a.secret && !isEarned;
          const justUnlocked = newBadgeKeys.includes(a.key);
          const badgeClass = justUnlocked ? 'badge-unlocking' : isEarned ? 'badge-unlocked' : 'badge-locked';
          return (
            <div
              key={a.key}
              className={`badge-grid-item ${badgeClass}`}
              onClick={() => { setSelectedAchievement(a); setIsSelectedEarned(isEarned); }}
              style={{ cursor: 'pointer', animationDelay: `${index * 40}ms` }}
            >
              {isEarned
                ? <UnlockedCard achievement={a} />
                : <LockedCard achievement={a} isSecret={isSecret} />
              }
            </div>
          );
        })}
      </div>

      {/* Achievement detail modal */}
      {selectedAchievement && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setSelectedAchievement(null)}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%',
              background: '#111', borderRadius: '20px 20px 0 0',
              padding: '24px 20px', borderTop: '1px solid #1A1A1A',
              paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '0 auto 20px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <AchievementBadge
                  achievementKey={(selectedAchievement.secret && !isSelectedEarned) ? 'secret_1' : selectedAchievement.key}
                  size={72}
                  unlocked={isSelectedEarned}
                />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0', marginBottom: 8 }}>
                {(selectedAchievement.secret && !isSelectedEarned) ? '???' : selectedAchievement.label}
              </div>
              <div style={{
                display: 'inline-block',
                fontSize: 11, fontWeight: 600,
                padding: '3px 10px', borderRadius: 12,
                background: isSelectedEarned ? 'rgba(76,175,128,0.15)' : 'rgba(255,255,255,0.05)',
                color: isSelectedEarned ? '#4CAF80' : '#666',
                border: isSelectedEarned ? '1px solid rgba(76,175,128,0.3)' : '1px solid #222',
                marginBottom: 12,
              }}>
                {isSelectedEarned ? '✅ Achieved!' : '🔒 Not yet achieved'}
              </div>
              {isSelectedEarned && (() => {
                const date = getEarnedDate(selectedAchievement.key);
                if (!date) return null;
                return (
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                    Earned {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                );
              })()}
              <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5, marginTop: 4 }}>
                {(selectedAchievement.secret && !isSelectedEarned)
                  ? 'Keep training to discover this achievement.'
                  : selectedAchievement.desc}
              </div>
              {selectedAchievement.category && (
                <div style={{
                  display: 'inline-block', marginTop: 12,
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '3px 10px', borderRadius: 10,
                  background: `${selectedAchievement.color}15`,
                  color: selectedAchievement.color,
                  border: `1px solid ${selectedAchievement.color}30`,
                }}>
                  {ACHIEVEMENT_CATEGORIES.find(c => c.key === selectedAchievement.category)?.label || selectedAchievement.category}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedAchievement(null)}
              style={{
                display: 'block', width: '100%', marginTop: 20,
                padding: '12px', borderRadius: 12,
                background: '#1A1A1A', border: '1px solid #222',
                color: '#999', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UnlockedCard({ achievement }: { achievement: Achievement }) {
  return (
    <div style={{
      background: '#141414',
      border: `1px solid ${achievement.color}40`,
      borderRadius: 14,
      padding: '14px 10px',
      textAlign: 'center',
      boxShadow: `0 0 12px ${achievement.color}15`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <AchievementBadge achievementKey={achievement.key} size={44} unlocked={true} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: achievement.color, lineHeight: 1.3 }}>{achievement.label}</div>
      <div style={{ fontSize: 10, color: '#555', marginTop: 4, lineHeight: 1.4 }}>{achievement.desc}</div>
    </div>
  );
}

function LockedCard({ achievement, isSecret }: { achievement: Achievement; isSecret: boolean }) {
  return (
    <div style={{
      background: '#0D0D0D',
      border: '1px solid #1A1A1A',
      borderRadius: 14,
      padding: '14px 10px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <AchievementBadge achievementKey={isSecret ? 'secret_1' : achievement.key} size={44} unlocked={false} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#444', lineHeight: 1.3 }}>{isSecret ? '???' : achievement.label}</div>
      <div style={{ fontSize: 10, color: '#333', marginTop: 4, lineHeight: 1.4 }}>
        {isSecret ? 'Keep training to discover this achievement.' : achievement.desc}
      </div>
    </div>
  );
}
