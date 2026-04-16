import { useState, useEffect } from "react";
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

export default function OnboardingPage() {
  const { member } = useAuth();
  const [step, setStep] = useState(0);
  const [xpAnimated, setXpAnimated] = useState(0);
  const [tabsVisible, setTabsVisible] = useState<boolean[]>([false, false, false, false, false]);

  // Already completed — render nothing
  if (localStorage.getItem(ONBOARDING_KEY)) return null;

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    window.location.hash = "#/schedule";
  };

  const skip = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    window.location.hash = "#/";
  };

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const firstName = member?.name?.split(" ")[0] || "Warrior";
  const belt = member?.belt || "white";

  // XP animation for step 3
  useEffect(() => {
    if (step === 3) {
      setXpAnimated(0);
      const timeout = setTimeout(() => {
        let val = 0;
        const interval = setInterval(() => {
          val += 3;
          if (val >= 50) { val = 50; clearInterval(interval); }
          setXpAnimated(val);
        }, 30);
      }, 400);
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
        }, 200 + i * 150);
      });
    }
  }, [step]);

  const TOTAL_STEPS = 6;

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
        overflow: "hidden",
      }}
    >
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === step ? "#C8A24C" : i < step ? "#5A4A2A" : "#222",
              transition: "all 0.3s ease",
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
          animation: "onboardSlide 0.3s ease-out",
          textAlign: "center",
          gap: 20,
        }}
      >
        {/* Step 0: Welcome + Name */}
        {step === 0 && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🥋</div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "#C8A24C" }}>
              LABYRINTH BJJ
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
              Welcome, {firstName}
            </h1>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              Track your training, earn achievements, and stay connected with your team.
            </p>
            <button onClick={next} style={goldButtonStyle}>
              Begin Journey
            </button>
          </>
        )}

        {/* Step 1: Logo Materialize */}
        {step === 1 && (
          <>
            <div style={{
              width: 120, height: 120,
              borderRadius: "50%",
              background: "radial-gradient(circle, #1A1510, #0A0A0A)",
              border: "2px solid #C8A24C30",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 60px rgba(200,162,76,0.2)",
              animation: "ring-pulse 2s ease-in-out infinite",
            }}>
              <img
                src={logoMaze}
                alt="Labyrinth"
                style={{
                  width: 80, height: 80, objectFit: "contain",
                  filter: "sepia(1) saturate(2) hue-rotate(5deg) brightness(1.1)",
                  animation: "badge-appear 600ms cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              />
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#F0F0F0", letterSpacing: "0.15em", margin: 0 }}>
              LABYRINTH
            </div>
            <div style={{ fontSize: 13, color: "#C8A24C", letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase" }}>
              The Way of the Fighter
            </div>
            <p style={{ fontSize: 13, color: "#666", maxWidth: 260, lineHeight: 1.6, margin: 0 }}>
              Every champion started somewhere. Your journey begins now.
            </p>
            <button onClick={next} style={goldButtonStyle}>Continue</button>
          </>
        )}

        {/* Step 2: Belt-tying moment */}
        {step === 2 && (
          <>
            <div style={{ animation: "badge-appear 500ms cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <BeltIcon belt="white" stripes={0} width={180} style={{ filter: "drop-shadow(0 2px 20px rgba(229,229,229,0.3))" }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
              Your journey begins<br />with a white belt
            </h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              Every champion started here. The belt doesn't make the fighter — the fighter makes the belt.
            </p>
            <div style={{
              padding: "10px 20px", borderRadius: 12,
              background: "rgba(229,229,229,0.05)",
              border: "1px solid rgba(229,229,229,0.1)",
              fontSize: 13, color: "#999", fontStyle: "italic",
            }}>
              "A black belt is a white belt who never quit."
            </div>
            <button onClick={next} style={goldButtonStyle}>I'm ready</button>
          </>
        )}

        {/* Step 3: XP arc demonstration */}
        {step === 3 && (
          <>
            <div style={{ animation: "badge-appear 500ms cubic-bezier(0.34,1.56,0.64,1) both" }}>
              <LevelWidget
                xp={xpAnimated}
                memberName={firstName}
                memberBelt={belt}
                size={100}
                interactive={false}
              />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
              Earn XP every time<br />you train
            </h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
              Every class earns XP. Level up. Unlock rings. Rise through the ranks of Labyrinth.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#C8A24C" }}>+10</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>per class</div>
              </div>
              <div style={{ width: 1, background: "#222" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#FFD700" }}>∞</div>
                <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>levels</div>
              </div>
            </div>
            <button onClick={next} style={goldButtonStyle}>Next</button>
          </>
        )}

        {/* Step 4: Achievement unlock */}
        {step === 4 && (
          <>
            <div style={{
              position: "relative",
              animation: "badge-ceremony-badge-in 600ms cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
              <AchievementBadge achievementKey={firstStepAchievement.key} size={100} unlocked={true} />
              <div style={{
                position: "absolute", inset: -20,
                background: `radial-gradient(circle, ${firstStepAchievement.color}20 0%, transparent 70%)`,
                animation: "ring-pulse 2s ease-in-out infinite",
                borderRadius: "50%",
              }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
              Achievements mark<br />your milestones
            </h2>
            <div style={{ padding: "12px 20px", background: "#111", borderRadius: 14, border: `1px solid ${firstStepAchievement.color}30` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: firstStepAchievement.color }}>{firstStepAchievement.label}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{firstStepAchievement.desc}</div>
            </div>
            <p style={{ fontSize: 13, color: "#888", maxWidth: 260, lineHeight: 1.6, margin: 0 }}>
              Every class, every stripe, every win — immortalized.
            </p>
            <button onClick={next} style={goldButtonStyle}>Last step</button>
          </>
        )}

        {/* Step 5: Nav map reveal */}
        {step === 5 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
              The Labyrinth<br />awaits
            </h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 260, margin: 0 }}>
              Five doors. Infinite paths. Your journey starts now.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", width: "100%" }}>
              {NAV_TABS.map((tab, i) => {
                const Icon = tab.Icon;
                return (
                  <div
                    key={tab.label}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "16px 12px", borderRadius: 16, minWidth: 64,
                      background: "#111", border: "1px solid #1A1A1A",
                      opacity: tabsVisible[i] ? 1 : 0,
                      transform: tabsVisible[i] ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
                      transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  >
                    <Icon size={24} color="#C8A24C" strokeWidth={1.5} />
                    <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>{tab.label}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={complete} style={{ ...goldButtonStyle, marginTop: 8 }}>
              Enter the Labyrinth
            </button>
          </>
        )}
      </div>

      {/* Bottom nav: back button + skip */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {step > 0 && step < 5 && (
            <button
              onClick={back}
              style={{
                background: "none", border: "1px solid #222",
                color: "#666", fontSize: 13, cursor: "pointer",
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
                color: "#444", fontSize: 13, cursor: "pointer",
                padding: "8px 16px",
              }}
            >
              Skip
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes onboardSlide {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const goldButtonStyle: React.CSSProperties = {
  padding: "14px 40px",
  borderRadius: 12,
  background: "#C8A24C",
  color: "#0A0A0A",
  fontWeight: 700,
  fontSize: 15,
  border: "none",
  cursor: "pointer",
  minWidth: 180,
};
