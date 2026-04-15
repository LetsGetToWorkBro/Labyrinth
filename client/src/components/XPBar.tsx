import { getLevelFromXP, getActualLevel } from '@/lib/xp';

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

export function XPBar({ xp, compact = false }: XPBarProps) {
  const { title, xpForNext, progress } = getLevelFromXP(xp);
  const actualLevel = getActualLevel(xp);

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A24C', minWidth: 32 }}>Lv{actualLevel}</div>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#1A1A1A', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #C8A24C, #FFD700)',
            borderRadius: 2,
            transition: 'width 0.6s ease',
          }}/>
        </div>
        <div style={{ fontSize: 9, color: '#555', minWidth: 40, textAlign: 'right' }}>
          {xp}/{xpForNext} XP
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#0D0D0D', borderRadius: 14, padding: '12px 16px', border: '1px solid #1A1A1A' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#C8A24C' }}>Level {actualLevel}</span>
          <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{title}</span>
        </div>
        <span style={{ fontSize: 11, color: '#555' }}>{xp.toLocaleString()} XP</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#1A1A1A', overflow: 'hidden', marginBottom: 6 }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #C8A24C 0%, #FFD700 50%, #C8A24C 100%)',
          backgroundSize: '200% 100%',
          borderRadius: 4,
          transition: 'width 0.8s ease',
        }}/>
      </div>
      <div style={{ fontSize: 10, color: '#444', textAlign: 'right' }}>
        {(xpForNext - xp).toLocaleString()} XP to Level {actualLevel + 1}
      </div>
    </div>
  );
}
