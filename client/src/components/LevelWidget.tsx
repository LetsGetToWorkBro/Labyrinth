import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getLevelFromXP, getActualLevel, getRingTier, XP_LEVELS } from '@/lib/xp';
import { ProfileRing } from './ProfileRing';

interface LevelWidgetProps {
  xp: number;
  memberName?: string;
  memberBelt?: string;
  profilePic?: string;
  size?: number; // diameter of the portrait orb
}

export function LevelWidget({ xp, memberName, memberBelt, profilePic, size = 64 }: LevelWidgetProps) {
  const actualLevel = getActualLevel(xp);
  const tier = getRingTier(actualLevel);
  const { title, progress, xpForNext } = getLevelFromXP(xp);
  const [showModal, setShowModal] = useState(false);
  const [animProg, setAnimProg] = useState(0);
  const prevXP = useRef(xp);
  const [xpFlash, setXpFlash] = useState(false);

  // Animate fill on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimProg(progress), 200);
    return () => clearTimeout(t);
  }, [progress]);

  // Flash on XP gain
  useEffect(() => {
    if (xp > prevXP.current) {
      setXpFlash(true);
      setTimeout(() => setXpFlash(false), 1000);
    }
    prevXP.current = xp;
  }, [xp]);

  // Arc parameters
  const R = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  // Arc from 130° to 410° (going clockwise 280° sweep — bottom open like Diablo)
  const startAngle = 130; // degrees, starting bottom-left
  const sweepDeg = 280;   // degrees of arc
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcStart = toRad(startAngle);
  const arcEnd = toRad(startAngle + sweepDeg);
  const arcFillEnd = toRad(startAngle + sweepDeg * animProg);

  const arcPath = (from: number, to: number) => {
    const x1 = cx + R * Math.cos(from);
    const y1 = cy + R * Math.sin(from);
    const x2 = cx + R * Math.cos(to);
    const y2 = cy + R * Math.sin(to);
    const large = (to - from) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, position: 'relative', display: 'inline-block' }}
      >
        {/* Outer SVG arc */}
        <svg width={size + 16} height={size + 16} style={{ position: 'absolute', top: -8, left: -8, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <linearGradient id="xp-arc-fill" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B6914"/>
              <stop offset="50%" stopColor="#FFD700"/>
              <stop offset="100%" stopColor="#C8A24C"/>
            </linearGradient>
            <filter id="xp-glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <path d={arcPath(arcStart, arcEnd)} fill="none" stroke="#1A1A1A" strokeWidth="5" strokeLinecap="round" transform={`translate(8,8)`}/>
          {/* Fill */}
          {animProg > 0 && (
            <path
              d={arcPath(arcStart, arcFillEnd)}
              fill="none"
              stroke="url(#xp-arc-fill)"
              strokeWidth="5"
              strokeLinecap="round"
              filter={xpFlash ? 'url(#xp-glow)' : undefined}
              transform={`translate(8,8)`}
              style={{ transition: 'stroke-width 0.3s' }}
            />
          )}
        </svg>

        {/* Profile ring + avatar */}
        <div style={{ width: size, height: size, position: 'relative' }}>
          <ProfileRing tier={tier} size={size} level={actualLevel}>
            {/* Avatar — initials or belt-colored circle */}
            <div style={{
              width: size, height: size, borderRadius: '50%',
              background: profilePic ? 'none' : 'radial-gradient(circle at 35% 30%, #2A2A2A, #0D0D0D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: size * 0.28, fontWeight: 800, color: '#F0F0F0',
              userSelect: 'none', overflow: 'hidden',
            }}>
              {profilePic ? (
                <img src={profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (memberName || '?').charAt(0).toUpperCase()
              )}
            </div>
          </ProfileRing>
        </div>

        {/* Level badge — sits below arc gap */}
        <div style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #8B6914, #FFD700)',
          color: '#000', fontSize: 10, fontWeight: 900,
          padding: '2px 7px', borderRadius: 10,
          boxShadow: '0 0 8px rgba(200,162,76,0.6)',
          whiteSpace: 'nowrap', zIndex: 2,
        }}>
          LV {actualLevel}
        </div>
      </button>

      {/* Level Journey Modal — portaled to body to avoid overflow clipping */}
      {showModal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: 'relative', width: '100%', background: '#111',
            borderRadius: '20px 20px 0 0', padding: '24px 20px',
            border: '1px solid #1A1A1A', maxHeight: '80vh', overflowY: 'auto',
            paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom) + 90px))',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '0 auto 20px' }}/>

            {/* Current level header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginBottom: 4 }}>
                Level {actualLevel}
              </div>
              <div style={{ fontSize: 14, color: '#C8A24C', fontWeight: 600, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#555' }}>{xp.toLocaleString()} XP total</div>
              {/* Progress bar */}
              <div style={{ height: 6, borderRadius: 3, background: '#1A1A1A', overflow: 'hidden', margin: '10px 0 6px' }}>
                <div style={{ height: '100%', width: `${progress * 100}%`, background: 'linear-gradient(90deg, #C8A24C, #FFD700)', borderRadius: 3, transition: 'width 1s ease' }}/>
              </div>
              <div style={{ fontSize: 11, color: '#444' }}>{(xpForNext - xp).toLocaleString()} XP to Level {actualLevel + 1}</div>
            </div>

            {/* How to earn XP */}
            <div style={{ background: '#0D0D0D', borderRadius: 12, padding: '12px 14px', marginBottom: 16, border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Earn XP By</div>
              {[
                { action: 'Checking into class', xp: '+10 XP', icon: '\uD83E\uDD4B' },
                { action: 'Entering a tournament', xp: '+50 XP', icon: '\uD83C\uDFDF\uFE0F' },
                { action: 'Winning bronze', xp: '+75 XP', icon: '\uD83E\uDD49' },
                { action: 'Winning silver', xp: '+100 XP', icon: '\uD83E\uDD48' },
                { action: 'Winning gold', xp: '+150 XP', icon: '\uD83E\uDD47' },
                { action: 'Belt promotion', xp: '+500 XP', icon: '\uD83E\uDD4B' },
              ].map(item => (
                <div key={item.action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1A1A1A' }}>
                  <div style={{ fontSize: 13, color: '#D0D0D0' }}>{item.icon} {item.action}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C8A24C' }}>{item.xp}</div>
                </div>
              ))}
            </div>

            {/* Upcoming milestones — next 6 levels */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Upcoming Milestones</div>
            {XP_LEVELS.filter(l => l.level > actualLevel).slice(0, 6).map(l => {
              const xpNeeded = l.xpRequired - xp;
              return (
                <div key={l.level} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', background: '#0D0D0D', borderRadius: 10,
                  border: '1px solid #1A1A1A', marginBottom: 6,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1A1A1A, #2A2A2A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, color: '#C8A24C', flexShrink: 0,
                    border: '1px solid #C8A24C30',
                  }}>{l.level}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0' }}>{l.title}</div>
                    <div style={{ fontSize: 11, color: '#555' }}>+{xpNeeded.toLocaleString()} XP away</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
