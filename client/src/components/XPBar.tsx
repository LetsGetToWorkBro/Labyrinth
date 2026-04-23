import { useState, useEffect, useRef } from 'react';
import { getLevelFromXP, getActualLevel } from '@/lib/xp';
import { getParagonTheme } from '@/components/ParagonRing';

interface XPBarProps {
  xp: number;
  prevXp?: number;
  deltaXp?: number;       // points just earned — triggers float-up
  compact?: boolean;
  onLevelUp?: (newLevel: number, prevLevel: number) => void;
}

export function XPBar({ xp, prevXp, deltaXp, compact = false, onLevelUp }: XPBarProps) {
  const { title, xpForLevel, xpForNext, progress } = getLevelFromXP(xp);
  const actualLevel = getActualLevel(xp);
  const prevLevelRef = useRef(actualLevel);
  const [animProgress, setAnimProgress] = useState(0);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const [floatingDelta, setFloatingDelta] = useState<{ value: number; id: number } | null>(null);
  const isNearLevelUp = progress > 0.85;

  // RAF-driven animation
  const animFrameRef = useRef<number>();
  const startTimeRef = useRef<number | undefined>(undefined);
  const DURATION = 900;
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    const targetProgress = progress;
    const fromProgress = prevXp !== undefined ? getLevelFromXP(prevXp).progress : 0;
    setAnimProgress(fromProgress);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    startTimeRef.current = undefined;
    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const t = Math.min((now - startTimeRef.current) / DURATION, 1);
      setAnimProgress(fromProgress + (targetProgress - fromProgress) * easeOutCubic(t));
      if (t < 1) animFrameRef.current = requestAnimationFrame(tick);
    };
    setTimeout(() => { animFrameRef.current = requestAnimationFrame(tick); }, 16);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [xp]);

  // Level up detection
  useEffect(() => {
    if (prevLevelRef.current > 0 && actualLevel > prevLevelRef.current) {
      setLevelUpFlash(true);
      onLevelUp?.(actualLevel, prevLevelRef.current);
      setTimeout(() => setLevelUpFlash(false), 1500);
    }
    prevLevelRef.current = actualLevel;
  }, [actualLevel]);

  // Floating delta "+N XP"
  useEffect(() => {
    if (deltaXp && deltaXp > 0) {
      setFloatingDelta({ value: deltaXp, id: Date.now() });
      const t = setTimeout(() => setFloatingDelta(null), 1200);
      return () => clearTimeout(t);
    }
  }, [deltaXp]);

  const xpEarned = xp - xpForLevel;
  const xpNeeded = xpForNext - xpForLevel;
  const clampedProg = Math.min(1, Math.max(animProgress <= 0 ? 0.012 : animProgress, 0.012)); // min 1.2% so bar always shows

  // ── Paragon theme colors for XP bar ──────────────────────────────
  const pTheme = getParagonTheme(actualLevel);
  const themeColors: Record<typeof pTheme, { bar: string; glow: string; nearUp: string; glow2: string }> = {
    ember: { bar: 'linear-gradient(90deg,#C8A24C 0%,#FFD700 100%)',  glow: 'rgba(200,162,76,0.4)',  nearUp: 'linear-gradient(90deg,#C8A24C,#FFD700,#FFF,#FFD700,#C8A24C)', glow2:'rgba(200,162,76,0.8)' },
    frost: { bar: 'linear-gradient(90deg,#0ea5e9 0%,#bae6fd 100%)', glow: 'rgba(14,165,233,0.4)', nearUp: 'linear-gradient(90deg,#0ea5e9,#e0f2fe,#fff,#e0f2fe,#0ea5e9)',  glow2:'rgba(14,165,233,0.8)' },
    void:  { bar: 'linear-gradient(90deg,#7e22ce 0%,#d8b4fe 100%)', glow: 'rgba(168,85,247,0.4)', nearUp: 'linear-gradient(90deg,#7e22ce,#d8b4fe,#fff,#d8b4fe,#7e22ce)',  glow2:'rgba(168,85,247,0.8)' },
    blood: { bar: 'linear-gradient(90deg,#7f1d1d 0%,#ef4444 60%,#fca5a5 100%)', glow: 'rgba(239,68,68,0.45)', nearUp: 'linear-gradient(90deg,#7f1d1d,#ef4444,#fca5a5,#ef4444,#7f1d1d)', glow2:'rgba(239,68,68,0.9)' },
    apex:  { bar: 'linear-gradient(90deg,#9ca3af 0%,#fff 50%,#fde047 100%)',   glow: 'rgba(255,255,255,0.5)', nearUp: 'linear-gradient(90deg,#9ca3af,#fff,#fde047,#fff,#9ca3af)', glow2:'rgba(255,255,255,0.9)' },
  };
  const tc = themeColors[pTheme];

  if (compact) {
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
        {/* Bar — scaleX for GPU-composited animation */}
        <div style={{ height: 8, borderRadius: 4, background: '#111', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%', width: '100%',
            transformOrigin: 'left center',
            transform: `scaleX(${clampedProg})`,
            borderRadius: 4,
            background: isNearLevelUp ? tc.nearUp : tc.bar,
            backgroundSize: '300% 100%',
            animation: isNearLevelUp ? 'xp-shimmer 1.5s linear infinite' : undefined,
            boxShadow: `0 0 ${isNearLevelUp ? '8' : '4'}px ${isNearLevelUp ? tc.glow2 : tc.glow}`,
          }}/>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'xp-shine 3s ease-in-out infinite',
            borderRadius: 4,
          }}/>
          {floatingDelta && (
            <div key={floatingDelta.id} style={{
              position: 'absolute', right: 8, top: -28,
              fontSize: 15, fontWeight: 900,
              color: pTheme === 'blood' ? '#fca5a5' : pTheme === 'void' ? '#d8b4fe' : pTheme === 'frost' ? '#7dd3fc' : pTheme === 'apex' ? '#fff' : '#FFD700',
              textShadow: `0 0 12px ${tc.glow2}`,
              pointerEvents: 'none',
              animation: 'xp-float-up 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
            }}>
              +{floatingDelta.value} XP
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full version
  return (
    <div style={{
      background: levelUpFlash ? 'rgba(200,162,76,0.15)' : '#0D0D0D',
      borderRadius: 16, padding: '16px',
      border: `1px solid ${levelUpFlash ? 'rgba(200,162,76,0.5)' : '#1A1A1A'}`,
      transition: 'border-color 0.3s ease, background 0.3s ease',
      boxShadow: levelUpFlash ? '0 0 20px rgba(200,162,76,0.3)' : 'none',
    }}>
      <style>{`
        @keyframes xp-shimmer-full { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes xp-almost-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
        @keyframes xp-almost-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      {levelUpFlash && (
        <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: '#FFD700', marginBottom: 8 }}>
          ⬆️ LEVEL UP! Welcome to Level {actualLevel}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: 'radial-gradient(circle at 35% 35%, #FFD700, #C8A24C 50%, #8B6914)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 900, color: '#000',
          boxShadow: '0 0 20px rgba(200,162,76,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: '2px solid rgba(200,162,76,0.4)',
        }}>
          {actualLevel}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#F0F0F0', marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{xp.toLocaleString()} total XP</div>
        </div>
      </div>

      {/* Bar — scaleX, GPU-composited */}
      <div style={{ height: 12, borderRadius: 6, background: '#111', overflow: 'hidden', position: 'relative', marginBottom: 6, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
        <div style={{
          height: '100%', width: '100%',
          transformOrigin: 'left center',
          transform: `scaleX(${clampedProg})`,
          borderRadius: 6,
          background: isNearLevelUp ? tc.nearUp : tc.bar,
          backgroundSize: '200% 100%',
          animation: isNearLevelUp
            ? 'xp-shimmer-full 2s linear infinite, xp-almost-pulse 1.2s ease-in-out infinite'
            : 'xp-shimmer-full 2s linear infinite',
          boxShadow: `0 0 ${isNearLevelUp ? '14' : '10'}px ${isNearLevelUp ? tc.glow2 : tc.glow}`,
        }}/>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)', borderRadius: '6px 6px 0 0', pointerEvents: 'none' }}/>
        {[0.25, 0.5, 0.75].map(pct => (
          <div key={pct} style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct * 100}%`, width: 1, background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}/>
        ))}
        {/* Floating delta */}
        {floatingDelta && (
          <div key={floatingDelta.id} style={{
            position: 'absolute', right: 8, top: -28,
            fontSize: 15, fontWeight: 900,
            color: pTheme === 'blood' ? '#fca5a5' : pTheme === 'void' ? '#d8b4fe' : pTheme === 'frost' ? '#7dd3fc' : pTheme === 'apex' ? '#fff' : '#FFD700',
            textShadow: `0 0 12px ${tc.glow2}`,
            pointerEvents: 'none',
            animation: 'xp-float-up 1.1s cubic-bezier(0.16,1,0.3,1) forwards',
          }}>
            +{floatingDelta.value} XP
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ color: '#555' }}>{xpEarned.toLocaleString()} / {xpNeeded.toLocaleString()} XP this level</span>
        {isNearLevelUp ? (
          <span style={{ color: '#FFD700', fontWeight: 700, animation: 'xp-almost-blink 1s ease-in-out infinite' }}>
            ⚡ {(xpForNext - xp)} XP to Level {actualLevel + 1}!
          </span>
        ) : (
          <span style={{ color: '#444' }}>{(xpForNext - xp).toLocaleString()} XP to Level {actualLevel + 1}</span>
        )}
      </div>

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
