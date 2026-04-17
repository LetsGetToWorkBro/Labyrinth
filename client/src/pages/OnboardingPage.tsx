import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { BeltIcon } from "@/components/BeltIcon";
import { LevelWidget } from "@/components/LevelWidget";
import { AchievementBadge } from "@/lib/achievement-icons";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { Home, MessageCircle, CalendarDays, Trophy, MoreHorizontal } from "lucide-react";
import logoMaze from "@/assets/logo-maze.webp";

const ONBOARDING_KEY = "lbjj_onboarding_done";

const NAV_TABS = [
  { label: 'Home', Icon: Home },
  { label: 'Chat', Icon: MessageCircle },
  { label: 'Progress', Icon: Trophy },
  { label: 'Schedule', Icon: CalendarDays },
  { label: 'More', Icon: MoreHorizontal },
];

const firstStepAchievement = ALL_ACHIEVEMENTS.find(a => a.key === 'first_class') || ALL_ACHIEVEMENTS[0];

// ── Belt SVG that draws itself via stroke-dashoffset ──────────────
function AnimatedBelt({ belt = 'white' }: { belt: string }) {
  const pathRef = useRef<SVGPathElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDrawn(true), 200);
    return () => clearTimeout(t);
  }, []);

  const beltColors: Record<string, string> = {
    white: '#E5E5E5', blue: '#1A5DAB', purple: '#7E3AF2',
    brown: '#92400E', black: '#1A1A1A',
  };
  const color = beltColors[belt] || beltColors.white;

  return (
    <div style={{ position: 'relative', animation: 'badge-appear 400ms cubic-bezier(0.34,1.56,0.64,1) both' }}>
      {/* Glow aura */}
      <div style={{
        position: 'absolute', inset: -24,
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        borderRadius: '50%',
        animation: 'ring-pulse 2.5s ease-in-out infinite',
      }}/>
      {/* Belt body */}
      <svg width={220} height={64} viewBox="0 0 220 64">
        <defs>
          <filter id="belt-glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Belt track */}
        <rect x={4} y={20} width={212} height={24} rx={4} fill={color} opacity={0.15}/>
        {/* Belt body — draws left to right */}
        <rect x={4} y={20} width={212} height={24} rx={4} fill="none"
          stroke={color} strokeWidth={2} opacity={0.4}
          style={{
            strokeDasharray: 512,
            strokeDashoffset: drawn ? 0 : 512,
            transition: 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
        {/* Belt center block */}
        <rect
          x={88} y={14} width={44} height={36} rx={3}
          fill={color}
          style={{
            opacity: drawn ? 1 : 0,
            transition: 'opacity 400ms ease 900ms',
          }}
          filter="url(#belt-glow)"
        />
        {/* Stitching lines — draw sequentially */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={4 + i * 42} y1={26} x2={4 + i * 42} y2={38}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1}
            style={{
              strokeDasharray: 12,
              strokeDashoffset: drawn ? 0 : 12,
              transition: `stroke-dashoffset 300ms ease ${600 + i * 80}ms`,
            }}
          />
        ))}
        {/* Belt label text */}
        <text
          x={110} y={37} textAnchor="middle"
          fill="#000" fontSize={11} fontWeight={800} fontFamily="sans-serif"
          letterSpacing={1} opacity={0.7}
          style={{ opacity: drawn ? 0.7 : 0, transition: 'opacity 300ms ease 1100ms' }}
        >
          {belt.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

// ── Achievement tile that flips from locked → unlocked ─────────────
function FlipAchievementTile({ achievement, delay = 0 }: { achievement: typeof firstStepAchievement; delay?: number }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      width: 100, height: 100,
      perspective: 600,
      cursor: 'default',
    }}>
      <div style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        transition: 'transform 700ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Front — locked */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#111', borderRadius: 16,
          border: '1px solid #1A1A1A',
        }}>
          <AchievementBadge achievementKey={achievement.key} size={60} unlocked={false} />
        </div>
        {/* Back — unlocked */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${achievement.color}12`,
          borderRadius: 16,
          border: `1px solid ${achievement.color}40`,
          boxShadow: flipped ? `0 0 20px ${achievement.color}30` : 'none',
        }}>
          <AchievementBadge achievementKey={achievement.key} size={60} unlocked={true} />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const { member } = useAuth();
  const [step, setStep] = useState(0);
  const [xpAnimated, setXpAnimated] = useState(0);
  const [tabsVisible, setTabsVisible] = useState<boolean[]>([false, false, false, false, false]);
  const [ctaTapped, setCtaTapped] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Already completed — render nothing (but not mid-completion)
  if (!completing && localStorage.getItem(ONBOARDING_KEY)) return null;

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setCompleting(true);
    // Use replace() for reliability on iOS PWA, with reload() fallback
    setTimeout(() => {
      try {
        window.location.replace(window.location.origin + window.location.pathname + '#/');
      } catch {
        window.location.reload();
      }
    }, 50);
  };

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setCompleting(true);
    setTimeout(() => {
      try {
        window.location.replace(window.location.origin + window.location.pathname + '#/');
      } catch {
        window.location.reload();
      }
    }, 50);
  };

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const firstName = member?.name?.split(" ")[0] || "Warrior";
  const belt = member?.belt || "white";

  // XP animation for step 3 (XP arc)
  useEffect(() => {
    if (step === 3) {
      setXpAnimated(0);
      const timeout = setTimeout(() => {
        let val = 0;
        const interval = setInterval(() => {
          val += 2;
          if (val >= 65) { val = 65; clearInterval(interval); }
          setXpAnimated(val);
        }, 25);
        return () => clearInterval(interval);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [step]);

  // Staggered tab reveal for step 5
  useEffect(() => {
    if (step === 5) {
      setTabsVisible([false, false, false, false, false]);
      NAV_TABS.forEach((_, i) => {
        setTimeout(() => {
          setTabsVisible(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, 300 + i * 130);
      });
    }
  }, [step]);

  const TOTAL_STEPS = 6;

  const handleFinalCTA = () => {
    setCtaTapped(true);
    // Haptic — single strong pulse
    try { navigator.vibrate?.(80); } catch {}
    try {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Heavy });
      });
    } catch {}
    setTimeout(() => { complete(); }, 400);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px",
        paddingTop: "max(40px, env(safe-area-inset-top, 40px))",
        paddingBottom: "max(40px, env(safe-area-inset-bottom, 40px))",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: i === step ? "#C8A24C" : i < step ? "#5A4A2A" : "#1A1A1A",
              transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div
        key={step}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 400,
          animation: "onboardSlide 0.3s cubic-bezier(0.16,1,0.3,1)",
          textAlign: "center",
          gap: 20,
        }}
      >

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <>
            <div style={{
              width: 100, height: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'badge-appear 600ms cubic-bezier(0.34,1.56,0.64,1) both',
            }}>
              <img
                src={logoMaze}
                alt="Labyrinth"
                style={{
                  width: 90, height: 90, objectFit: "contain",
                  filter: "drop-shadow(0 0 16px rgba(200,162,76,0.5))",
                }}
              />
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.35em', fontWeight: 700, color: '#C8A24C', textTransform: 'uppercase' }}>
              LABYRINTH BJJ
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#F0F0F0", margin: 0, letterSpacing: '-0.02em' }}>
              Welcome, {firstName}.
            </h1>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
              Your training, your ranks, your journey — all in one place. Ready to begin?
            </p>
            <button onClick={next} style={goldButtonStyle}>
              Begin My Journey
            </button>
          </>
        )}

        {/* ── Step 1: Belt ties itself ── */}
        {step === 1 && (
          <>
            <div style={{ marginBottom: 8 }}>
              <AnimatedBelt belt={belt} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#F0F0F0", margin: 0, letterSpacing: '-0.02em' }}>
              Your belt. Your identity.
            </h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
              Every stripe earned. Every class attended. The belt remembers it all.
            </p>
            <div style={{
              padding: "12px 20px", borderRadius: 12,
              background: "#111", border: "1px solid #222",
              fontSize: 13, color: "#666", fontStyle: "italic", maxWidth: 280,
            }}>
              "A black belt is a white belt who never quit."
            </div>
            <button onClick={next} style={goldButtonStyle}>I'm ready</button>
          </>
        )}

        {/* ── Step 2: XP arc fills from zero ── */}
        {step === 2 && (
          <>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Radial glow that pulses behind the widget */}
              <div style={{
                position: 'absolute', width: 160, height: 160,
                background: 'radial-gradient(circle, rgba(200,162,76,0.12) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'ring-pulse 2s ease-in-out infinite',
              }}/>
              <LevelWidget
                xp={xpAnimated}
                memberName={firstName}
                memberBelt={belt}
                size={96}
                interactive={false}
              />
              {/* Floating +10 XP hint */}
              {xpAnimated > 20 && (
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  background: 'rgba(200,162,76,0.95)', color: '#000',
                  fontSize: 11, fontWeight: 900, padding: '3px 10px',
                  borderRadius: 20, animation: 'xp-pulse 2s ease-in-out infinite',
                }}>
                  +10 XP per class
                </div>
              )}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#F0F0F0", margin: 0, letterSpacing: '-0.02em' }}>
              Every class fills this arc.
            </h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
              Check into class → earn 10 XP → level up → unlock rings. You're watching the system live right now.
            </p>
            <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
              {[
                { val: '+10', label: 'per class' },
                { val: '+50', label: 'tournament' },
                { val: '+500', label: 'belt promo' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#C8A24C" }}>{item.val}</div>
                  <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>{item.label}</div>
                </div>
              ))}
            </div>
            <button onClick={next} style={goldButtonStyle}>Next</button>
          </>
        )}

        {/* ── Step 3: Achievement tile flips locked → unlocked ── */}
        {step === 3 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <FlipAchievementTile achievement={firstStepAchievement} delay={500} />
              </div>
              {/* "UNLOCKED" label fades in after flip */}
              <div style={{
                marginTop: 10, fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: firstStepAchievement.color,
                animation: 'badge-ceremony-text-in 400ms ease 1300ms both',
                opacity: 0, textAlign: 'center', width: '100%',
              }}>
                Achievement Unlocked
              </div>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#F0F0F0", margin: 0, letterSpacing: '-0.02em' }}>
              Achievements mark your milestones.
            </h2>
            <div style={{
              padding: "12px 20px", background: "#111", borderRadius: 14,
              border: `1px solid ${firstStepAchievement.color}30`, maxWidth: 280,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: firstStepAchievement.color }}>{firstStepAchievement.label}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{firstStepAchievement.desc}</div>
            </div>
            <p style={{ fontSize: 13, color: "#666", maxWidth: 260, lineHeight: 1.7, margin: 0 }}>
              Every class, every stripe, every win — immortalized as a badge you can flex in chat.
            </p>
            <button onClick={next} style={goldButtonStyle}>One more thing</button>
          </>
        )}

        {/* ── Step 4: Nav reveal ── */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#F0F0F0", margin: 0, letterSpacing: '-0.02em' }}>
              Five doors.<br />Infinite paths.
            </h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
              Your gym lives inside. Chat, compete, train, watch, and rise.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", width: "100%", maxWidth: 320 }}>
              {NAV_TABS.map((tab, i) => {
                const Icon = tab.Icon;
                return (
                  <div
                    key={tab.label}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "16px 14px", borderRadius: 16, minWidth: 62,
                      background: "#111", border: "1px solid #1A1A1A",
                      opacity: tabsVisible[i] ? 1 : 0,
                      transform: tabsVisible[i] ? "translateY(0) scale(1)" : "translateY(24px) scale(0.85)",
                      transition: "all 0.45s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  >
                    <Icon size={24} color="#C8A24C" strokeWidth={1.5} />
                    <span style={{ fontSize: 10, color: "#777", fontWeight: 600 }}>{tab.label}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={complete} style={goldButtonStyle}>Enter the Labyrinth</button>
          </>
        )}

        {/* ── Step 5: Final CTA — Check In to Your First Class ── */}
        {step === 5 && (
          <>
            {/* Big gold burst radial */}
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(200,162,76,0.2) 0%, rgba(200,162,76,0.05) 50%, transparent 70%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'ring-pulse 2s ease-in-out infinite',
              marginBottom: 8,
            }}>
              <img
                src={logoMaze}
                alt="Labyrinth"
                style={{
                  width: 80, height: 80, objectFit: "contain",
                  filter: "brightness(1.2) drop-shadow(0 0 16px rgba(200,162,76,0.5))",
                  animation: 'badge-appear 500ms cubic-bezier(0.34,1.56,0.64,1) both',
                }}
              />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#F0F0F0", margin: 0, letterSpacing: '-0.02em' }}>
              The mat is waiting,<br />{firstName}.
            </h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
              Check into your first class to unlock your first achievement and start climbing the ranks.
            </p>
            {/* Giant gold CTA with pulse animation */}
            <button
              onClick={handleFinalCTA}
              style={{
                ...goldButtonStyle,
                fontSize: 17,
                padding: '18px 48px',
                borderRadius: 16,
                marginTop: 8,
                animation: ctaTapped
                  ? 'victoryBurst 400ms ease forwards'
                  : 'xp-pulse 2s ease-in-out infinite',
                boxShadow: '0 0 30px rgba(200,162,76,0.5), 0 4px 20px rgba(0,0,0,0.4)',
                transform: ctaTapped ? 'scale(0.95)' : undefined,
                transition: 'transform 100ms ease',
              }}
            >
              {ctaTapped ? 'Let\'s Go!' : 'Check In to First Class'}
            </button>
            <p style={{ fontSize: 11, color: '#333', margin: 0 }}>
              You can explore everything else from the home screen
            </p>
          </>
        )}
      </div>

      {/* Bottom nav: back + skip */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {step > 0 && step < 5 && (
            <button
              onClick={back}
              style={{
                background: "none", border: "1px solid #222",
                color: "#555", fontSize: 13, cursor: "pointer",
                padding: "8px 20px", borderRadius: 10,
              }}
            >
              ← Back
            </button>
          )}
          {step < 5 && (
            <button
              onClick={skip}
              style={{
                background: "none", border: "none",
                color: "#555", fontSize: 13, cursor: "pointer",
                padding: "12px 20px", minHeight: 44, minWidth: 80,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes onboardSlide {
          from { opacity: 0; transform: translateX(28px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const goldButtonStyle: React.CSSProperties = {
  padding: "14px 40px",
  borderRadius: 14,
  background: "#C8A24C",
  color: "#0A0A0A",
  fontWeight: 800,
  fontSize: 15,
  border: "none",
  cursor: "pointer",
  minWidth: 200,
  letterSpacing: '0.02em',
  touchAction: 'manipulation' as any,
  WebkitTapHighlightColor: 'transparent',
};
