import { useState, useEffect } from 'react';
import { useHashLocation } from 'wouter/use-hash-location';
import { ALL_ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES, checkAndUnlockAchievements } from '@/lib/achievements';
import type { Achievement } from '@/lib/achievements';
import { gasCall } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function AchievementsPage() {
  const [, navigate] = useHashLocation();
  const { member } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [earnedKeys, setEarnedKeys] = useState<string[]>([]);

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

  const filtered = activeCategory === 'all'
    ? ALL_ACHIEVEMENTS
    : ALL_ACHIEVEMENTS.filter(a => a.category === activeCategory);

  const earnedCount = earnedKeys.length;

  return (
    <div className="app-content" style={{ background: '#0A0A0A', minHeight: '100dvh' }}>
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
            {earnedCount} / {ALL_ACHIEVEMENTS.length}
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
        }}>
          <button
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
        {filtered.map(a => {
          const isEarned = earnedKeys.includes(a.key);
          const isSecret = !!a.secret && !isEarned;
          return isEarned
            ? <UnlockedCard key={a.key} achievement={a} />
            : <LockedCard key={a.key} achievement={a} isSecret={isSecret} />;
        })}
      </div>
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
      <div style={{ fontSize: 32, marginBottom: 8 }}>{achievement.icon}</div>
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
      opacity: 0.5,
      filter: 'grayscale(1)',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{isSecret ? '🔒' : achievement.icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#444', lineHeight: 1.3 }}>{isSecret ? '???' : achievement.label}</div>
      <div style={{ fontSize: 10, color: '#333', marginTop: 4, lineHeight: 1.4 }}>
        {isSecret ? 'Keep training to discover this achievement.' : achievement.desc}
      </div>
    </div>
  );
}
