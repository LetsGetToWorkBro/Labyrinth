import React from 'react';
import type { RingTier } from '@/lib/xp';

interface ProfileRingProps {
  tier: RingTier;
  size?: number;
  children: React.ReactNode;
  level?: number;
}

export function ProfileRing({ tier, size = 72, children, level }: ProfileRingProps) {
  if (tier === 'none') {
    return <div style={{ width: size, height: size, position: 'relative' }}>{children}</div>;
  }

  const rings: Record<Exclude<RingTier, 'none'>, JSX.Element> = {
    // Bronze: simple single ring
    bronze: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke="#CD7F32" strokeWidth="2.5"/>
      </svg>
    ),

    // Silver: double ring with 4 small diamonds at cardinal points
    silver: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke="#9CA3AF" strokeWidth="2"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 5} fill="none" stroke="#9CA3AF" strokeWidth="1" strokeDasharray="3 2"/>
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 2) * Math.cos(rad);
          const y = size/2 + (size/2 - 2) * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r="3" fill="#C0C0C0"/>;
        })}
      </svg>
    ),

    // Gold: double ring with 8 gems, gradient stroke
    gold: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <linearGradient id={`gold-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="50%" stopColor="#C8A24C"/>
            <stop offset="100%" stopColor="#FFD700"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={`url(#gold-grad-${size})`} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 6} fill="none" stroke="#C8A24C" strokeWidth="1" strokeOpacity="0.5"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 2) * Math.cos(rad);
          const y = size/2 + (size/2 - 2) * Math.sin(rad);
          const isMain = i % 2 === 0;
          return <circle key={i} cx={x} cy={y} r={isMain ? 3.5 : 2} fill={isMain ? "#FFD700" : "#C8A24C"}/>;
        })}
      </svg>
    ),

    // Platinum: triple ring with diamond shapes
    platinum: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <linearGradient id={`plat-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5E4E2"/>
            <stop offset="50%" stopColor="#A8A8A8"/>
            <stop offset="100%" stopColor="#E5E4E2"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5} fill="none" stroke={`url(#plat-grad-${size})`} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 5} fill="none" stroke="#B0B0B0" strokeWidth="1"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 8} fill="none" stroke="#808080" strokeWidth="0.5" strokeDasharray="2 3"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const r = size/2 - 2;
          const x = size/2 + r * Math.cos(rad);
          const y = size/2 + r * Math.sin(rad);
          const s = i % 2 === 0 ? 4 : 2.5;
          return (
            <polygon key={i}
              points={`${x},${y-s} ${x+s},${y} ${x},${y+s} ${x-s},${y}`}
              fill={i % 2 === 0 ? "#E5E4E2" : "#A8A8A8"}
            />
          );
        })}
      </svg>
    ),

    // Diamond: complex filigree with blue gems
    diamond: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <radialGradient id={`dia-gem-${size}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor="#A0D8EF"/>
            <stop offset="100%" stopColor="#1E6FBF"/>
          </radialGradient>
          <linearGradient id={`dia-ring-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B9F2FF"/>
            <stop offset="50%" stopColor="#4FC3F7"/>
            <stop offset="100%" stopColor="#B9F2FF"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={`url(#dia-ring-${size})`} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 6} fill="none" stroke="#4FC3F7" strokeWidth="1" strokeOpacity="0.6"/>
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const r = size/2 - 2;
          const x = size/2 + r * Math.cos(rad);
          const y = size/2 + r * Math.sin(rad);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4.5" fill={`url(#dia-gem-${size})`} stroke="#B9F2FF" strokeWidth="1"/>
              <circle cx={x} cy={y} r="1.5" fill="white" opacity="0.6"/>
            </g>
          );
        })}
        {[45, 135, 225, 315].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const r = size/2 - 2;
          const x = size/2 + r * Math.cos(rad);
          const y = size/2 + r * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#4FC3F7" stroke="#B9F2FF" strokeWidth="0.5"/>;
        })}
      </svg>
    ),

    // Paragon: full jewel-encrusted with animated pulse
    paragon: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <defs>
          <radialGradient id={`par-outer-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#C8A24C" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id={`par-ring-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="25%" stopColor="#FF6B6B"/>
            <stop offset="50%" stopColor="#C084FC"/>
            <stop offset="75%" stopColor="#4FC3F7"/>
            <stop offset="100%" stopColor="#FFD700"/>
          </linearGradient>
          <style>{`
            @keyframes paragon-pulse-${size} {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 0.8; }
            }
            .paragon-glow-${size} { animation: paragon-pulse-${size} 2s ease-in-out infinite; }
          `}</style>
        </defs>
        {/* Outer glow pulse */}
        <circle className={`paragon-glow-${size}`} cx={size/2} cy={size/2} r={size/2 + 1} fill="none" stroke="#C8A24C" strokeWidth="1" strokeOpacity="0.4"/>
        {/* Main gradient ring */}
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="none" stroke={`url(#par-ring-${size})`} strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 7} fill="none" stroke="rgba(200,162,76,0.3)" strokeWidth="1"/>
        {/* 12 gems evenly spaced */}
        {Array.from({ length: 12 }).map((_, i) => {
          const deg = i * 30;
          const rad = (deg - 90) * Math.PI / 180;
          const r = size/2 - 2;
          const x = size/2 + r * Math.cos(rad);
          const y = size/2 + r * Math.sin(rad);
          const gemColors = ['#FFD700', '#FF6B6B', '#C084FC', '#4FC3F7', '#34D399', '#FB923C'];
          const color = gemColors[i % gemColors.length];
          const isLarge = i % 3 === 0;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={isLarge ? 5 : 3} fill={color} opacity="0.9"/>
              <circle cx={x - (isLarge ? 1.5 : 1)} cy={y - (isLarge ? 1.5 : 1)} r={isLarge ? 1.5 : 1} fill="white" opacity="0.7"/>
            </g>
          );
        })}
      </svg>
    ),
  };

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-block' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        {children}
      </div>
      {rings[tier]}
      {level && (
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          background: '#1A1A1A', border: '1px solid #333',
          borderRadius: 10, padding: '1px 5px',
          fontSize: 9, fontWeight: 700, color: '#C8A24C',
          zIndex: 2, lineHeight: 1.4,
        }}>
          {level}
        </div>
      )}
    </div>
  );
}
