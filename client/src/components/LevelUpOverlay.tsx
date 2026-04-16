import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getLevelFromXP, getRingTier, getActualLevel } from '@/lib/xp';
import { ProfileRing } from './ProfileRing';

// ── Canvas particle burst ─────────────────────────────────────
interface ParticleData {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number;
  color: string; rotation: number; rotationSpeed: number;
  shape: 'circle' | 'diamond';
}

export function ParticleBurst({ x, y, colors }: { x: number; y: number; colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles: ParticleData[] = Array.from({ length: 32 }, () => ({
      x, y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.8) * 14,
      life: 1,
      decay: Math.random() * 0.02 + 0.015,
      size: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? 'circle' : 'diamond',
    }));
    const gravity = 0.4;
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += gravity;
        p.vx *= 0.98; p.life -= p.decay; p.rotation += p.rotationSpeed;
        if (p.life <= 0) continue;
        alive = true;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
        if (p.shape === 'diamond') {
          ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(p.size * 0.6, 0);
          ctx.lineTo(0, p.size); ctx.lineTo(-p.size * 0.6, 0); ctx.closePath(); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (alive) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }} />;
}

// ── Haptic helper ─────────────────────────────────────────────
async function triggerLevelUpHaptic() {
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Heavy });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }), 200);
  } catch {
    navigator.vibrate?.([80, 100, 50]);
  }
}

// ── Main overlay ──────────────────────────────────────────────
interface LevelUpOverlayProps {
  newLevel: number;
  prevLevel: number;
  beltColor?: string;
  memberName?: string;
  onDismiss: () => void;
}

export function LevelUpOverlay({ newLevel, prevLevel, beltColor = '#C8A24C', memberName, onDismiss }: LevelUpOverlayProps) {
  const [phase, setPhase] = useState<'in' | 'visible' | 'out'>('in');
  const [showParticles, setShowParticles] = useState(false);
  const tier = getRingTier(newLevel);
  const { title } = getLevelFromXP(getActualLevel(newLevel) * 100);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), 50);
    const t2 = setTimeout(() => { setShowParticles(true); triggerLevelUpHaptic(); }, 800);
    const t3 = setTimeout(() => setPhase('out'), 3500);
    const t4 = setTimeout(onDismiss, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const content = (
    <div
      onClick={() => { setPhase('out'); setTimeout(onDismiss, 300); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        opacity: phase === 'out' ? 0 : phase === 'visible' ? 1 : 0,
        transition: 'opacity 300ms ease',
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${beltColor}20 0%, transparent 70%)`,
        animation: 'badge-ceremony-glow 2s ease-in-out infinite alternate',
        pointerEvents: 'none',
      }}/>

      <div onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px 32px', position: 'relative' }}>
        {/* "LEVEL UP" slam */}
        <div style={{
          fontSize: 12, fontWeight: 800, letterSpacing: '0.4em',
          textTransform: 'uppercase', color: beltColor,
          marginBottom: 20,
          animation: phase === 'visible' ? 'badge-ceremony-text-in 400ms ease 200ms both' : 'none',
          opacity: 0,
        }}>
          Level Up
        </div>

        {/* Level orb with ProfileRing */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24,
          animation: phase === 'visible' ? 'level-orb-appear 500ms cubic-bezier(0.34,1.56,0.64,1) 100ms both' : 'none',
        }}>
          <ProfileRing tier={tier} size={120} level={newLevel}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #3A3A3A, #0D0D0D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, fontWeight: 900, color: '#FFD700',
              textShadow: '0 0 30px rgba(255,215,0,0.9)',
            }}>
              {newLevel}
            </div>
          </ProfileRing>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 22, fontWeight: 900, color: '#F0F0F0',
          marginBottom: 6, letterSpacing: '-0.01em',
          animation: phase === 'visible' ? 'badge-ceremony-text-in 400ms ease 500ms both' : 'none',
          opacity: 0,
        }}>
          {title}
        </div>

        {/* Member name */}
        {memberName && (
          <div style={{
            fontSize: 13, color: '#666', marginBottom: 24,
            animation: phase === 'visible' ? 'badge-ceremony-text-in 400ms ease 650ms both' : 'none',
            opacity: 0,
          }}>
            {memberName.split(' ')[0]}, you're on a roll.
          </div>
        )}

        <button
          onClick={() => { setPhase('out'); setTimeout(onDismiss, 300); }}
          style={{
            padding: '11px 32px', borderRadius: 12,
            background: beltColor, color: '#000',
            fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
            letterSpacing: '0.05em',
            animation: phase === 'visible' ? 'badge-ceremony-text-in 400ms ease 800ms both' : 'none',
            opacity: 0,
          }}
        >
          OSS
        </button>
      </div>

      {showParticles && (
        <ParticleBurst
          x={window.innerWidth / 2}
          y={window.innerHeight / 2}
          colors={[beltColor, '#FFD700', '#FFF8DC', '#ffffff']}
        />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
