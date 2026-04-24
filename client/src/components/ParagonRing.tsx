/**
 * ParagonRing — world-class portrait frame component
 *
 * 5 themes tied to level thresholds (matching XPWidget + toolbar):
 *   ember  (lv 1–5)   — spinning conic gold/bronze ring, 4 spherical jewels
 *   frost  (lv 6–11)  — crystalline ice, spinning orbit spark, diamond ornaments
 *   void   (lv 12–19) — pulsing amethyst gem, dashed spinning ring, orbit sparks
 *   blood  (lv 20–29) — crimson flare, spinning jagged orbit, jeweled top crown
 *   apex   (lv 30+)   — platinum+gold, blazing spin, floating diamond jewel
 *
 * Usage:
 *   <ParagonRing level={level} size={48}>
 *     <img src={pfp} ... />          ← or any child (initials div, etc.)
 *   </ParagonRing>
 *
 * The `level` prop drives the theme automatically.
 * Pass `size` in px — everything scales proportionally.
 */

import React from 'react';
import { getPfp } from '@/lib/pfpCache';

export type ParagonTheme = 'ember' | 'frost' | 'void' | 'blood' | 'apex';

export function getParagonTheme(level: number): ParagonTheme {
  if (level >= 30) return 'apex';
  if (level >= 20) return 'blood';
  if (level >= 12) return 'void';
  if (level >= 6)  return 'frost';
  if (level >= 3)  return 'ember'; // Bronze Forge unlocks at LV3
  return 'ember'; // LV1-2 still show the ring but no unlock reward
}

interface ParagonRingProps {
  level: number;
  size?: number;         // portrait diameter in px (default 48)
  children?: React.ReactNode;
  showOrbit?: boolean;   // show the orbit spark (default true)
  profilePic?: string;   // optional — if provided (or resolvable via email), renders an <img> instead of children
  email?: string;        // optional — fallback lookup in global PFP cache when profilePic is missing
}

export function ParagonRing({ level, size = 48, children, showOrbit = true, profilePic, email }: ParagonRingProps) {
  // Resolve a pic source: explicit prop first, then global PFP cache by email.
  const resolvedPic = profilePic || (email ? getPfp(email) : undefined);
  const renderedChildren = (!children && resolvedPic)
    ? <img src={resolvedPic} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
    : children;
  const theme = getParagonTheme(level);

  // Scale all offsets relative to size
  const PAD = Math.round(size * 0.14);   // inset for rings
  const JEM = Math.round(size * 0.17);   // ornament size
  const ORBIT = Math.round(size * 0.09); // orbit spark size
  const outer = size + PAD * 2;

  // Unique gradient IDs per size+theme to avoid SVG ID collisions
  const uid = `pr-${theme}-${size}`;

  const styles: Record<ParagonTheme, {
    ringBg: string;
    ringAnim: string;
    glowBorder: string;
    glowBoxShadow: string;
    glowAnim?: string;
    ornamentTop: React.CSSProperties;
    ornamentBottom?: React.CSSProperties;
    ornamentLeft?: React.CSSProperties;
    ornamentRight?: React.CSSProperties;
    orbitAnim?: string;
    orbitStyle: React.CSSProperties;
  }> = {
    ember: {
      ringBg: `conic-gradient(from 0deg, #854d0e, #fde047, #ca8a04, #854d0e, #fde047, #ca8a04, #854d0e)`,
      ringAnim: 'pr-spin-slow 10s linear infinite',
      glowBorder: '1px solid rgba(253,224,71,0.4)',
      glowBoxShadow: `inset 0 0 6px #000, 0 4px 12px rgba(0,0,0,0.8)`,
      ornamentTop: {
        width: JEM, height: JEM, borderRadius: '50%',
        background: 'radial-gradient(circle, #fde047, #ca8a04, #854d0e)',
        boxShadow: '0 2px 4px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.8)',
        border: '1px solid #333',
      },
      ornamentBottom: {
        width: JEM, height: JEM, borderRadius: '50%',
        background: 'radial-gradient(circle, #fde047, #ca8a04, #854d0e)',
        boxShadow: '0 2px 4px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.8)',
        border: '1px solid #333',
      },
      ornamentLeft: {
        width: JEM, height: JEM, borderRadius: '50%',
        background: 'radial-gradient(circle, #fde047, #ca8a04, #854d0e)',
        boxShadow: '0 2px 4px rgba(0,0,0,1)', border: '1px solid #333',
      },
      ornamentRight: {
        width: JEM, height: JEM, borderRadius: '50%',
        background: 'radial-gradient(circle, #fde047, #ca8a04, #854d0e)',
        boxShadow: '0 2px 4px rgba(0,0,0,1)', border: '1px solid #333',
      },
      orbitStyle: { background: 'none' }, // no orbit for ember
    },
    frost: {
      ringBg: `conic-gradient(from 0deg, #9ca3af, #fff, #e0f2fe, #0ea5e9, #9ca3af, #fff, #e0f2fe, #0ea5e9, #9ca3af)`,
      ringAnim: 'pr-spin-slow 8s linear infinite',
      glowBorder: '1px solid #e0f2fe',
      glowBoxShadow: `0 0 16px rgba(14,165,233,0.6), inset 0 0 12px #0284c7`,
      ornamentTop: {
        width: JEM + 4, height: JEM + 4,
        background: 'linear-gradient(135deg, #fff, #0ea5e9, #0284c7)',
        border: '1px solid #fff', boxShadow: '0 0 12px #0ea5e9',
        borderRadius: 2, transform: 'rotate(45deg)',
      },
      ornamentBottom: {
        width: JEM - 2, height: JEM - 2,
        background: 'linear-gradient(135deg, #fff, #0ea5e9, #0284c7)',
        border: '1px solid #fff', boxShadow: '0 0 8px #0ea5e9',
        borderRadius: 2, transform: 'rotate(45deg)',
      },
      orbitAnim: 'pr-spin-slow 4s linear infinite',
      orbitStyle: {
        width: ORBIT, height: ORBIT,
        background: '#fff',
        boxShadow: '0 0 8px #fff, 0 0 16px #0ea5e9',
        borderRadius: '50%',
      },
    },
    void: {
      ringBg: `conic-gradient(from 0deg, #111, #3b0764, #111, #581c87, #111)`,
      ringAnim: undefined as any,
      glowBorder: '2px dashed #a855f7',
      glowBoxShadow: `0 0 20px #7e22ce, inset 0 0 10px #3b0764`,
      glowAnim: 'pr-spin-reverse 12s linear infinite',
      ornamentTop: {
        width: JEM + 6, height: JEM + 6, borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #f3e8ff, #a855f7, #581c87)',
        boxShadow: '0 0 24px #a855f7, inset 0 0 8px #000',
        border: '2px solid #3b0764',
        animation: 'pr-pulse-energy 2s infinite alternate',
      },
      ornamentBottom: {
        width: JEM - 2, height: JEM - 2, borderRadius: '50%',
        background: '#a855f7', boxShadow: '0 0 12px #a855f7',
      },
      ornamentLeft: { width: 3, height: JEM - 2, borderRadius: 2, background: '#7e22ce' },
      ornamentRight: { width: 3, height: JEM - 2, borderRadius: 2, background: '#7e22ce' },
      orbitAnim: 'pr-spin-slow 5s linear infinite',
      orbitStyle: {
        width: ORBIT + 2, height: ORBIT + 2,
        background: '#d8b4fe',
        boxShadow: '0 0 16px #a855f7',
        borderRadius: '50%',
        animation: 'pr-pulse-energy 1s infinite alternate',
      },
    },
    blood: {
      ringBg: `conic-gradient(from 0deg, #000, #450a0a, #000, #7f1d1d, #000)`,
      ringAnim: undefined as any,
      glowBorder: '1px solid #fca5a5',
      glowBoxShadow: `0 0 24px #b91c1c, inset 0 0 16px #ef4444`,
      ornamentTop: {
        width: JEM + 8, height: JEM + 8,
        background: 'radial-gradient(circle at 30% 30%, #fca5a5, #dc2626, #7f1d1d)',
        border: '2px solid #450a0a',
        boxShadow: '0 0 24px #ef4444, inset 0 0 8px #000',
        borderRadius: 2, transform: 'rotate(45deg)',
      },
      ornamentBottom: {
        width: JEM, height: JEM,
        background: '#dc2626', border: '1px solid #fca5a5',
        boxShadow: '0 0 12px #ef4444',
        borderRadius: 2, transform: 'rotate(45deg)',
      },
      orbitAnim: 'pr-spin-reverse 3s linear infinite',
      orbitStyle: {
        background: '#fca5a5',
        boxShadow: '0 0 16px #ef4444, 0 0 32px #b91c1c',
        width: 3, height: Math.round(size * 0.35),
        borderRadius: 2,
      },
    },
    apex: {
      ringBg: `conic-gradient(from 0deg, #fff, #fde047, #9ca3af, #fff, #fde047, #9ca3af, #fff)`,
      ringAnim: 'pr-spin-slow 3s linear infinite',
      glowBorder: '2px solid rgba(255,255,255,0.8)',
      glowBoxShadow: `0 0 32px rgba(255,255,255,0.9), inset 0 0 20px #fde047`,
      ornamentTop: {
        width: JEM + 10, height: JEM + 10,
        background: 'radial-gradient(circle at 30% 30%, #fff 0%, #fde047 40%, #ca8a04 100%)',
        border: '2px solid #fff',
        boxShadow: '0 0 40px #fff, inset 0 0 12px rgba(255,255,255,1)',
        borderRadius: 2, transform: 'rotate(45deg)',
        animation: 'pr-float-jewel 2s ease-in-out infinite alternate',
      },
      ornamentBottom: {
        width: JEM + 2, height: JEM + 2, borderRadius: '50%',
        background: '#fde047',
        boxShadow: '0 0 24px #fff',
        border: '2px solid #fff',
      },
      ornamentLeft: {
        width: JEM - 2, height: JEM - 2,
        background: '#fff',
        boxShadow: '0 0 20px #fff, 0 0 32px #fde047',
        borderRadius: 2, transform: 'rotate(45deg)',
      },
      ornamentRight: {
        width: JEM - 2, height: JEM - 2,
        background: '#fff',
        boxShadow: '0 0 20px #fff, 0 0 32px #fde047',
        borderRadius: 2, transform: 'rotate(45deg)',
      },
      orbitAnim: 'pr-spin-slow 6s linear infinite',
      orbitStyle: {
        width: ORBIT + 4, height: ORBIT + 4,
        background: '#fff',
        boxShadow: '0 0 20px #fff, 0 0 40px #fde047',
        borderRadius: '50%',
      },
    },
  };

  const s = styles[theme];
  const PAD_WNEG = -PAD; // negative for inset positioning

  // The outer container must be larger than `size` to accommodate ornaments
  const CANVAS = outer + Math.round(size * 0.25); // extra room for ornaments/orbit
  const OFFSET = Math.round((CANVAS - size) / 2);  // center the portrait

  return (
    <>
      <style>{`
        @keyframes pr-spin-slow    { 100% { transform: rotate(360deg); } }
        @keyframes pr-spin-reverse { 100% { transform: rotate(-360deg); } }
        @keyframes pr-float-jewel  { 0% { transform: rotate(45deg) translateY(0); } 100% { transform: rotate(45deg) translateY(-${Math.round(size * 0.1)}px); } }
        @keyframes pr-pulse-energy { 0% { opacity: 0.7; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1.05); } }
      `}</style>

      <div style={{
        position: 'relative',
        width: CANVAS, height: CANVAS,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {/* Portrait image — centered */}
        <div style={{
          position: 'absolute',
          left: OFFSET, top: OFFSET,
          width: size, height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #000',
          zIndex: 1,
          background: '#000',
        }}>
          {renderedChildren}
        </div>

        {/* Ring base — conic gradient spinning ring */}
        {s.ringBg && (
          <div style={{
            position: 'absolute',
            left: OFFSET - PAD, top: OFFSET - PAD,
            width: size + PAD * 2, height: size + PAD * 2,
            borderRadius: '50%',
            background: s.ringBg,
            animation: s.ringAnim,
            // Mask to show only the border strip
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
            padding: Math.max(2, Math.round(size * 0.06)),
            zIndex: 2,
            transition: 'background 1s ease, animation 0.5s',
          }} />
        )}

        {/* Ring glow overlay */}
        <div style={{
          position: 'absolute',
          left: OFFSET - PAD, top: OFFSET - PAD,
          width: size + PAD * 2, height: size + PAD * 2,
          borderRadius: '50%',
          border: s.glowBorder,
          boxShadow: s.glowBoxShadow,
          animation: s.glowAnim,
          zIndex: 3,
          pointerEvents: 'none',
          transition: 'border 1s ease, box-shadow 1s ease',
        }} />

        {/* Ornament TOP */}
        {s.ornamentTop && (
          <div style={{
            position: 'absolute',
            top: OFFSET - PAD - JEM / 2,
            left: '50%',
            transform: `translateX(-50%) ${(s.ornamentTop as any).transform || ''}`,
            zIndex: 4,
            pointerEvents: 'none',
            transition: 'all 1s',
            ...(s.ornamentTop as any),
            // Override transform to avoid double-apply
            transform: `translateX(-50%)${s.ornamentTop.transform ? ' ' + s.ornamentTop.transform : ''}`,
          }} />
        )}

        {/* Ornament BOTTOM */}
        {s.ornamentBottom && (
          <div style={{
            position: 'absolute',
            bottom: OFFSET - PAD - JEM / 2,
            left: '50%',
            transform: `translateX(-50%)${s.ornamentBottom.transform ? ' ' + s.ornamentBottom.transform : ''}`,
            zIndex: 4,
            pointerEvents: 'none',
            transition: 'all 1s',
            ...s.ornamentBottom,
          }} />
        )}

        {/* Ornament LEFT */}
        {s.ornamentLeft && (
          <div style={{
            position: 'absolute',
            left: OFFSET - PAD - JEM / 2,
            top: '50%',
            transform: `translateY(-50%)`,
            zIndex: 4,
            pointerEvents: 'none',
            transition: 'all 1s',
            ...s.ornamentLeft,
          }} />
        )}

        {/* Ornament RIGHT */}
        {s.ornamentRight && (
          <div style={{
            position: 'absolute',
            right: OFFSET - PAD - JEM / 2,
            top: '50%',
            transform: `translateY(-50%)`,
            zIndex: 4,
            pointerEvents: 'none',
            transition: 'all 1s',
            ...s.ornamentRight,
          }} />
        )}

        {/* Orbit container + spark */}
        {showOrbit && s.orbitAnim && (
          <div style={{
            position: 'absolute',
            left: OFFSET - PAD - 2, top: OFFSET - PAD - 2,
            width: size + PAD * 2 + 4, height: size + PAD * 2 + 4,
            borderRadius: '50%',
            animation: s.orbitAnim,
            zIndex: 5,
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: '50%',
              transform: 'translate(-50%, -50%)',
              ...s.orbitStyle,
            }} />
          </div>
        )}
      </div>
    </>
  );
}
