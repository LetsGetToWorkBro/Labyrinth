import React from 'react';
import type { RingTier } from '@/lib/xp';

interface ProfileRingProps {
  tier: RingTier;
  size?: number;
  children: React.ReactNode;
  level?: number;
}

/**
 * ProfileRing — wraps a portrait/avatar with a tier-based decorative ring.
 *
 * Layout:
 *   outer div (size × size, relative) — the full hit area
 *     dark gap ring  — fills entire outer div, provides spacing between image and stroke
 *     image clip div — inset by GAP px on each side, clips the portrait to a circle
 *       children (the portrait/avatar)
 *     ring SVG       — position:absolute inset:0, draws stroke on top of gap
 *     level badge    — bottom-right corner
 *
 * The SVG stroke radius is drawn at (size/2 - STROKE/2) so it sits ON TOP of the
 * dark gap ring without clipping. The image occupies (size - 2*GAP) inside.
 */
export function ProfileRing({ tier, size = 72, children, level }: ProfileRingProps) {
  // No ring at all for tier 'none'
  if (tier === 'none') {
    return (
      <div style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    );
  }

  // Gap between portrait edge and ring stroke, in px
  const GAP = Math.round(size * 0.08); // ~8% of size
  const imgSize = size - GAP * 2;

  const rings: Record<Exclude<RingTier, 'none'>, JSX.Element> = {
    bronze: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5}
          fill="none" stroke="#CD7F32" strokeWidth="3"/>
      </svg>
    ),

    silver: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <defs>
          <linearGradient id={`silv-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8E8E8"/>
            <stop offset="50%" stopColor="#9CA3AF"/>
            <stop offset="100%" stopColor="#E8E8E8"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5}
          fill="none" stroke={`url(#silv-grad-${size})`} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 5}
          fill="none" stroke="#9CA3AF" strokeWidth="0.8" strokeDasharray="3 2" strokeOpacity="0.5"/>
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 1.5) * Math.cos(rad);
          const y = size/2 + (size/2 - 1.5) * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r="3" fill="#C0C0C0" stroke="#888" strokeWidth="0.5"/>;
        })}
      </svg>
    ),

    gold: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <defs>
          <linearGradient id={`gold-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700"/>
            <stop offset="35%" stopColor="#C8A24C"/>
            <stop offset="65%" stopColor="#FFE566"/>
            <stop offset="100%" stopColor="#FFD700"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5}
          fill="none" stroke={`url(#gold-grad-${size})`} strokeWidth="3.5"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 6}
          fill="none" stroke="#C8A24C" strokeWidth="0.8" strokeOpacity="0.4"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 1.5) * Math.cos(rad);
          const y = size/2 + (size/2 - 1.5) * Math.sin(rad);
          const isMain = i % 2 === 0;
          return <circle key={i} cx={x} cy={y} r={isMain ? 3.5 : 2}
            fill={isMain ? "#FFD700" : "#C8A24C"} stroke="#8B6914" strokeWidth="0.5"/>;
        })}
      </svg>
    ),

    platinum: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <defs>
          <linearGradient id={`plat-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0F0F0"/>
            <stop offset="50%" stopColor="#A8A8A8"/>
            <stop offset="100%" stopColor="#F0F0F0"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5}
          fill="none" stroke={`url(#plat-grad-${size})`} strokeWidth="3.5"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 5.5}
          fill="none" stroke="#B0B0B0" strokeWidth="1"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 9}
          fill="none" stroke="#707070" strokeWidth="0.5" strokeDasharray="2 3"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 1.5) * Math.cos(rad);
          const y = size/2 + (size/2 - 1.5) * Math.sin(rad);
          const s = i % 2 === 0 ? 4 : 2.5;
          return (
            <polygon key={i}
              points={`${x},${y-s} ${x+s},${y} ${x},${y+s} ${x-s},${y}`}
              fill={i % 2 === 0 ? "#E8E8E8" : "#A0A0A0"}
              stroke="#666" strokeWidth="0.3"/>
          );
        })}
      </svg>
    ),

    diamond: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
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
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5}
          fill="none" stroke={`url(#dia-ring-${size})`} strokeWidth="3.5"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 6}
          fill="none" stroke="#4FC3F7" strokeWidth="0.8" strokeOpacity="0.6"/>
        {[0, 90, 180, 270].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 1.5) * Math.cos(rad);
          const y = size/2 + (size/2 - 1.5) * Math.sin(rad);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill={`url(#dia-gem-${size})`} stroke="#B9F2FF" strokeWidth="1"/>
              <circle cx={x - 1.5} cy={y - 1.5} r="1.5" fill="white" opacity="0.6"/>
            </g>
          );
        })}
        {[45, 135, 225, 315].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 1.5) * Math.cos(rad);
          const y = size/2 + (size/2 - 1.5) * Math.sin(rad);
          return <circle key={i} cx={x} cy={y} r="3" fill="#4FC3F7" stroke="#B9F2FF" strokeWidth="0.5"/>;
        })}
      </svg>
    ),

    paragon: (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
        <defs>
          <linearGradient id={`par-ring-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFD700"/>
            <stop offset="25%"  stopColor="#FF6B6B"/>
            <stop offset="50%"  stopColor="#C084FC"/>
            <stop offset="75%"  stopColor="#4FC3F7"/>
            <stop offset="100%" stopColor="#FFD700"/>
          </linearGradient>
          <style>{`
            @keyframes paragon-pulse-${size} { 0%,100%{opacity:.35} 50%{opacity:.75} }
            .par-glow-${size}{ animation: paragon-pulse-${size} 2s ease-in-out infinite }
          `}</style>
        </defs>
        {/* Outer pulse glow */}
        <circle className={`par-glow-${size}`}
          cx={size/2} cy={size/2} r={size/2 + 1}
          fill="none" stroke="#C8A24C" strokeWidth="1.5" strokeOpacity="0.35"/>
        {/* Main ring */}
        <circle cx={size/2} cy={size/2} r={size/2 - 1.5}
          fill="none" stroke={`url(#par-ring-${size})`} strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={size/2 - 7}
          fill="none" stroke="rgba(200,162,76,0.25)" strokeWidth="1"/>
        {/* 12 gems */}
        {Array.from({ length: 12 }).map((_, i) => {
          const rad = (i * 30 - 90) * Math.PI / 180;
          const x = size/2 + (size/2 - 1.5) * Math.cos(rad);
          const y = size/2 + (size/2 - 1.5) * Math.sin(rad);
          const colors = ['#FFD700','#FF6B6B','#C084FC','#4FC3F7','#34D399','#FB923C'];
          const c = colors[i % colors.length];
          const big = i % 3 === 0;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={big ? 5.5 : 3.5} fill={c} opacity="0.9"/>
              <circle cx={x - (big?1.8:1.1)} cy={y-(big?1.8:1.1)} r={big?1.8:1.1} fill="white" opacity="0.65"/>
            </g>
          );
        })}
      </svg>
    ),
  };

  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'inline-block',
      flexShrink: 0,
    }}>
      {/* Dark gap layer — sits behind the image, provides visual separation from ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: '#0A0A0A',
        zIndex: 0,
      }}/>

      {/* Portrait clip — inset by GAP to leave visible gap between image edge and ring */}
      <div style={{
        position: 'absolute',
        top: GAP, left: GAP,
        width: imgSize, height: imgSize,
        borderRadius: '50%',
        overflow: 'hidden',
        zIndex: 1,
        // Subtle inner shadow to deepen the gap
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.6)',
      }}>
        {/* Scale children to fill the inset area */}
        <div style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>

      {/* Ring SVG — drawn over everything */}
      {rings[tier]}

      {/* Level badge */}
      {level !== undefined && level > 0 && (
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          background: '#1A1A1A', border: '1px solid #333',
          borderRadius: 10, padding: '1px 5px',
          fontSize: 9, fontWeight: 700, color: '#C8A24C',
          zIndex: 4, lineHeight: 1.4,
          pointerEvents: 'none',
        }}>
          {level}
        </div>
      )}
    </div>
  );
}
