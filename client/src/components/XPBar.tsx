import { useState, useEffect, useRef } from 'react';
import { getLevelFromXP, getActualLevel } from '@/lib/xp';

interface XPBarProps {
  xp: number;
  prevXp?: number; // animate from this value
  compact?: boolean;
  onLevelUp?: (newLevel: number) => void;
}

export function XPBar({ xp, prevXp, compact = false, onLevelUp }: XPBarProps) {
  const { title, xpForLevel, xpForNext, progress } = getLevelFromXP(xp);
  const actualLevel = getActualLevel(xp);
  const prevLevelRef = useRef(actualLevel);
  const [animProgress, setAnimProgress] = useState(0);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const isNearLevelUp = progress > 0.85;

  // Animate bar fill — start from prevXp progress if provided
  useEffect(() => {
    if (prevXp !== undefined && prevXp < xp) {
      const prevProgress = getLevelFromXP(prevXp).progress;
      setAnimProgress(prevProgress);
      const timer = setTimeout(() => setAnimProgress(progress), 150);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setAnimProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress, prevXp, xp]);

  // Level up detection
  useEffect(() => {
    if (prevLevelRef.current > 0 && actualLevel > prevLevelRef.current) {
      setLevelUpFlash(true);
      onLevelUp?.(actualLevel);
      setTimeout(() => setLevelUpFlash(false), 1500);
    }
    prevLevelRef.current = actualLevel;
  }, [actualLevel]);

  const xpEarned = xp - xpForLevel;
  const xpNeeded = xpForNext - xpForLevel;

  if (compact) {
    // Compact version for home screen — still impactful
    return (
      <div style={{ padding: '10px 14px', background: 'rgba(200,162,76,0.06)', borderRadius: 14, border: '1px solid rgba(200,162,76,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #C8A24C, #FFD700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: '#000',
              boxShadow: '0 0 8px rgba(200,162,76,0.5)',
            }}>
              {actualLevel}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F0F0F0', lineHeight: 1.2 }}>{title}</div>
              {isNearLevelUp && (
                <div style={{ fontSize: 10, color: '#FFD700', fontWeight: 600, animation: 'xp-pulse 1s ease-in-out infinite' }}>
                  ⚡ Almost Level {actualLevel + 1}!
                </div>
              )}
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#666' }}>{xpEarned}/{xpNeeded} XP</div>
        </div>
        {/* Bar */}
        <div style={{ height: 8, borderRadius: 4, background: '#111', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%',
            width: `${animProgress * 100}%`,
            borderRadius: 4,
            background: isNearLevelUp
              ? 'linear-gradient(90deg, #C8A24C, #FFD700, #FFFFFF, #FFD700, #C8A24C)'
              : 'linear-gradient(90deg, #C8A24C 0%, #FFD700 100%)',
            backgroundSize: isNearLevelUp ? '300% 100%' : '100% 100%',
            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            animation: isNearLevelUp ? 'xp-shimmer 1.5s linear infinite' : undefined,
            boxShadow: `0 0 ${isNearLevelUp ? '8' : '4'}px rgba(200,162,76,${isNearLevelUp ? '0.8' : '0.4'})`,
          }}/>
          {/* Shine sweep */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'xp-shine 3s ease-in-out infinite',
            borderRadius: 4,
          }}/>
        </div>
      </div>
    );
  }

  // Full version for account page — dramatic Diablo-style design
  return (
    <div style={{
      background: levelUpFlash ? 'rgba(200,162,76,0.15)' : '#0D0D0D',
      borderRadius: 16, padding: '16px', border: `1px solid ${levelUpFlash ? 'rgba(200,162,76,0.5)' : '#1A1A1A'}`,
      transition: 'all 0.3s ease',
      boxShadow: levelUpFlash ? '0 0 20px rgba(200,162,76,0.3)' : 'none',
    }}>
      {/* Shimmer + pulse keyframes */}
      <style>{`
        @keyframes xp-shimmer-full {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes xp-almost-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.4); }
        }
        @keyframes xp-almost-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {levelUpFlash && (
        <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#FFD700', marginBottom: 8, animation: 'xp-pulse 0.5s ease-in-out' }}>
          ⬆️ LEVEL UP! Welcome to Level {actualLevel}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        {/* Level number — large and gold with glow */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'radial-gradient(circle at 35% 35%, #FFD700, #C8A24C 50%, #8B6914)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 900, color: '#000',
          boxShadow: '0 0 20px rgba(200,162,76,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: '2px solid rgba(200,162,76,0.4)',
          textShadow: '0 0 6px rgba(255,215,0,0.5)',
        }}>
          {actualLevel}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#F0F0F0', marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{xp.toLocaleString()} total XP</div>
        </div>
      </div>

      {/* Bar — thick 12px with inner glow and segment markers */}
      <div style={{
        height: 12, borderRadius: 6, background: '#111', overflow: 'hidden', position: 'relative', marginBottom: 6,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
      }}>
        {/* Fill bar — molten gold */}
        <div style={{
          height: '100%',
          width: `${animProgress * 100}%`,
          borderRadius: 6,
          background: 'linear-gradient(90deg, #8B6914 0%, #C8A24C 30%, #FFD700 60%, #FFF8DC 80%, #FFD700 100%)',
          backgroundSize: '200% 100%',
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
          animation: isNearLevelUp
            ? 'xp-shimmer-full 2s linear infinite, xp-almost-pulse 1.2s ease-in-out infinite'
            : 'xp-shimmer-full 2s linear infinite',
          boxShadow: `0 0 ${isNearLevelUp ? '14' : '10'}px rgba(200,162,76,${isNearLevelUp ? '0.9' : '0.5'})`,
        }}/>
        {/* Top shine */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
          borderRadius: '6px 6px 0 0', pointerEvents: 'none',
        }}/>
        {/* Segment markers at 25%, 50%, 75% */}
        {[0.25, 0.5, 0.75].map(pct => (
          <div key={pct} style={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${pct * 100}%`, width: 1,
            background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
          }}/>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ color: '#555' }}>{xpEarned.toLocaleString()} / {xpNeeded.toLocaleString()} XP this level</span>
        {isNearLevelUp ? (
          <span style={{ color: '#FFD700', fontWeight: 700, animation: 'xp-almost-blink 1s ease-in-out infinite' }}>
            ⚡ ALMOST THERE · {(xpForNext - xp)} XP to go!
          </span>
        ) : (
          <span style={{ color: '#444' }}>{(xpForNext - xp).toLocaleString()} XP to Level {actualLevel + 1}</span>
        )}
      </div>

      {/* XP breakdown hint */}
      <div style={{ marginTop: 10, padding: '8px 10px', background: '#111', borderRadius: 10, display: 'flex', gap: 12, justifyContent: 'center' }}>
        {[
          { label: 'Check-in', xp: '10 XP' },
          { label: 'Tournament', xp: '50 XP' },
          { label: 'Gold medal', xp: '150 XP' },
          { label: 'Promotion', xp: '500 XP' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A24C' }}>{item.xp}</div>
            <div style={{ fontSize: 9, color: '#444' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
