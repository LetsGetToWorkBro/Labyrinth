/**
 * BootOverlay — cinematic boot/matrix sequence shown after login.
 *
 * Reuses the same aesthetic as LoginPage's boot: full-screen black, gold
 * terminal typewriter, cursor blink, final white flash, then fades out
 * revealing the page behind.
 *
 * Usage:
 *   {showBoot && <BootOverlay onDone={() => setShowBoot(false)} />}
 */

import { useEffect, useState } from 'react';
import logoGold from '@assets/labyrinth-logo-gold.png';

const GOLD = '#D4AF37';
const GOLD_GLOW = 'rgba(212,175,55,0.4)';

const BOOT_LINES = [
  '[SYSTEM] ESTABLISHING UPLINK...',
  '[DATA] RETRIEVING ARTIFACT PROGRESS...',
  '[CALC] PARAGON MATRIX ALIGNED...',
  '[AUTH] THE LABYRINTH IS OPEN.',
];

const KF = `
@keyframes lbjj-boot-scaleIn { 0% { opacity: 0; transform: scale(.7); } 100% { opacity: 1; transform: scale(1); } }
@keyframes lbjj-boot-blink { 50% { opacity: 0; } }
@keyframes lbjj-boot-fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
`;

export function BootOverlay({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [flash, setFlash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let li = 0, ci = 0;
    let built: string[] = [];

    const tick = () => {
      if (cancelled) return;
      if (li >= BOOT_LINES.length) {
        setDone(true);
        setTimeout(() => {
          if (cancelled) return;
          setFlash(true);
          setTimeout(() => {
            if (cancelled) return;
            setFadeOut(true);
            setTimeout(() => { if (!cancelled) onDone(); }, 600);
          }, 500);
        }, 400);
        return;
      }
      if (ci === 0) built = [...built, ''];
      const updated = [...built];
      updated[li] = BOOT_LINES[li].slice(0, ci + 1);
      setLines(updated);
      built = updated;
      ci++;
      if (ci >= BOOT_LINES[li].length) { li++; ci = 0; setTimeout(tick, 420); }
      else setTimeout(tick, Math.random() * 24 + 12);
    };

    const startT = setTimeout(tick, 900);
    return () => { cancelled = true; clearTimeout(startT); };
  }, [onDone]);

  return (
    <>
      <style>{KF}</style>
      <div
        style={{
          position: 'fixed', inset: 0, background: '#000', zIndex: 10000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: fadeOut ? 'none' : 'auto',
        }}
      >
        <img
          src={logoGold}
          alt="Labyrinth"
          style={{
            width: 140, height: 140, marginBottom: 44, objectFit: 'contain',
            filter: `drop-shadow(0 0 40px ${GOLD_GLOW})`,
            animation: 'lbjj-boot-scaleIn 1.2s cubic-bezier(0.16,1,0.3,1) both',
          }}
        />
        <div
          style={{
            width: 340, maxWidth: '86vw',
            fontFamily: "'Courier New', monospace", fontSize: 13, fontWeight: 700,
            color: GOLD, lineHeight: 1.9, textShadow: `0 0 8px ${GOLD_GLOW}`,
            textAlign: 'left',
          }}
        >
          {lines.map((line, i) => (
            <div key={i}>
              {line}
              {i === lines.length - 1 && !done && (
                <span
                  style={{
                    display: 'inline-block', width: 8, height: 13, background: GOLD,
                    verticalAlign: 'middle', marginLeft: 4,
                    animation: 'lbjj-boot-blink 1s step-end infinite',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'fixed', inset: 0, background: '#fff', zIndex: 10001,
          opacity: flash && !fadeOut ? 1 : 0, pointerEvents: 'none',
          transition: 'opacity 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
    </>
  );
}

// Boot overlay is shown only on a user's very first successful login ever.
// Once shown, `lbjj_boot_shown` is set in localStorage and never plays again.
const BOOT_SHOWN_KEY = 'lbjj_boot_shown';

export function shouldShowBoot(): boolean {
  try { return localStorage.getItem(BOOT_SHOWN_KEY) !== '1'; } catch { return false; }
}

export function markBootShown() {
  try { localStorage.setItem(BOOT_SHOWN_KEY, '1'); } catch {}
}
