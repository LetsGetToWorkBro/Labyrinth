import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ParticleBurst } from './LevelUpOverlay';
import type { Achievement } from '@/lib/achievements';

interface AchievementCeremonyProps {
  achievement: Achievement;
  onDismiss: () => void;
  onShare: () => void;
}

export function AchievementCeremony({ achievement, onDismiss, onShare }: AchievementCeremonyProps) {
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const [showParticles, setShowParticles] = useState(false);
  const accentColor = (achievement as any).color || '#C8A24C';

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 50);
    const t2 = setTimeout(() => setShowParticles(true), 400);
    const t3 = setTimeout(() => setPhase('exiting'), 4000);
    const t4 = setTimeout(onDismiss, 4350);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Haptic
  useEffect(() => {
    const trigger = async () => {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch { navigator.vibrate?.([30]); }
    };
    trigger();
  }, []);

  const content = (
    <div
      onClick={() => { setPhase('exiting'); setTimeout(onDismiss, 350); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(8px)',
        opacity: phase === 'exiting' ? 0 : 1,
        transition: 'opacity 300ms ease',
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
        animation: 'badge-ceremony-glow 2s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }}/>

      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', textAlign: 'center', padding: '40px 32px', maxWidth: 340, width: '100%' }}>
        {/* Header */}
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: '#666', marginBottom: 24,
          animation: phase !== 'entering' ? 'badge-ceremony-text-in 400ms ease 300ms both' : 'none',
          opacity: phase === 'entering' ? 0 : undefined,
        }}>
          Achievement Unlocked
        </div>

        {/* Badge icon — large, rotating */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24, position: 'relative',
          animation: phase !== 'entering' ? 'badge-ceremony-badge-in 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms both' : 'none',
        }}>
          {/* Light rays */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 160, height: 160, borderRadius: '50%',
            background: `conic-gradient(${accentColor}18 0deg, transparent 20deg, ${accentColor}18 40deg, transparent 60deg, ${accentColor}18 80deg, transparent 100deg, ${accentColor}18 120deg, transparent 140deg, ${accentColor}18 160deg, transparent 180deg, ${accentColor}18 200deg, transparent 220deg, ${accentColor}18 240deg, transparent 260deg, ${accentColor}18 280deg, transparent 300deg, ${accentColor}18 320deg, transparent 340deg)`,
            animation: 'badge-ceremony-rays 4s linear infinite',
            zIndex: 0,
          }}/>
          <div style={{ animation: 'badge-ceremony-rotate 8s linear infinite', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 72, lineHeight: 1 }}>
              {(achievement as any).icon || '🏆'}
            </div>
          </div>
        </div>

        {/* Name */}
        <div style={{
          fontSize: 22, fontWeight: 900, color: '#F0F0F0', marginBottom: 8,
          animation: phase !== 'entering' ? 'badge-ceremony-text-in 400ms ease 450ms both' : 'none',
          opacity: phase === 'entering' ? 0 : undefined,
        }}>
          {achievement.label}
        </div>

        {/* Description */}
        <div style={{
          fontSize: 13, color: '#888', lineHeight: 1.6, maxWidth: 240, margin: '0 auto 12px',
          animation: phase !== 'entering' ? 'badge-ceremony-text-in 400ms ease 550ms both' : 'none',
          opacity: phase === 'entering' ? 0 : undefined,
        }}>
          {achievement.desc}
        </div>

        {/* Category chip */}
        <div style={{
          display: 'inline-block', marginBottom: 28,
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
          padding: '3px 12px', borderRadius: 999,
          background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}35`,
          animation: phase !== 'entering' ? 'badge-ceremony-text-in 400ms ease 600ms both' : 'none',
          opacity: phase === 'entering' ? 0 : undefined,
        }}>
          {achievement.category}
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'center',
          animation: phase !== 'entering' ? 'badge-ceremony-text-in 400ms ease 700ms both' : 'none',
          opacity: phase === 'entering' ? 0 : undefined,
        }}>
          <button onClick={onShare} style={{
            padding: '11px 24px', borderRadius: 12,
            background: accentColor, color: '#000',
            fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          }}>
            Share to Chat
          </button>
          <button onClick={() => { setPhase('exiting'); setTimeout(onDismiss, 350); }} style={{
            padding: '11px 20px', borderRadius: 12,
            background: 'transparent', color: '#666',
            fontSize: 13, fontWeight: 600, border: '1px solid #222', cursor: 'pointer',
          }}>
            Dismiss
          </button>
        </div>
      </div>

      {showParticles && (
        <ParticleBurst
          x={window.innerWidth / 2}
          y={window.innerHeight / 2}
          colors={[accentColor, '#FFD700', '#ffffff']}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
