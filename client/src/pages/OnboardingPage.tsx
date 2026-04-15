import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { BeltIcon } from "@/components/BeltIcon";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";

const ONBOARDING_KEY = "lbjj_onboarding_done";

const SAMPLE_ACHIEVEMENTS = ["first_class", "streak_4", "blue_belt"]
  .map((key) => ALL_ACHIEVEMENTS.find((a) => a.key === key))
  .filter(Boolean) as typeof ALL_ACHIEVEMENTS;

export default function OnboardingPage() {
  const { member } = useAuth();
  const [step, setStep] = useState(0);

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

  const next = () => setStep((s) => Math.min(s + 1, 3));

  const firstName = member?.name?.split(" ")[0] || "Warrior";
  const belt = member?.belt || "white";

  const steps = [
    // Step 0 — Welcome
    <div key="welcome" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", color: "#C8A24C" }}>
        LABYRINTH BJJ
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
        Welcome to the Labyrinth
      </h1>
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 280 }}>
        Track your training, earn achievements, and stay connected with your team.
      </p>
      <button onClick={next} style={goldButtonStyle}>
        Get Started
      </button>
    </div>,

    // Step 1 — Your Profile
    <div key="profile" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
        Your Profile
      </h2>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#F0F0F0" }}>{member?.name || "Member"}</div>
      <BeltIcon belt={belt} stripes={0} width={160} />
      <div style={{ fontSize: 14, color: "#C8A24C", fontWeight: 600, textTransform: "capitalize" }}>
        {belt} Belt
      </div>
      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, maxWidth: 260 }}>
        This is your identity on the mat and in the app.
      </p>
      <button onClick={next} style={goldButtonStyle}>
        Next
      </button>
    </div>,

    // Step 2 — Achievements
    <div key="achievements" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
        Achievements
      </h2>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {SAMPLE_ACHIEVEMENTS.map((a) => (
          <div
            key={a.key}
            style={{
              width: 100,
              background: "#141414",
              border: `1px solid ${a.color}44`,
              borderRadius: 14,
              padding: "18px 10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: a.color, lineHeight: 1.3 }}>{a.label}</div>
            <div style={{ fontSize: 10, color: "#666", marginTop: 4, lineHeight: 1.4 }}>{a.desc}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, maxWidth: 280 }}>
        Every class, every stripe, every win — tracked here.
      </p>
      <button onClick={next} style={goldButtonStyle}>
        Next
      </button>
    </div>,

    // Step 3 — You're Ready
    <div key="ready" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
      <div style={{ fontSize: 48 }}>🥋</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>
        You're Ready!
      </h2>
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, maxWidth: 280 }}>
        Check the schedule and check in to your first class.
      </p>
      <button onClick={complete} style={goldButtonStyle}>
        Go to Schedule
      </button>
    </div>,
  ];

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
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Step content with slide transition */}
      <div
        key={step}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: 400,
          animation: "onboardSlide 0.3s ease-out",
        }}
      >
        {steps[step]}
      </div>

      {/* Bottom: progress dots + skip */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingBottom: 40 }}>
        {/* Progress dots */}
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? "#C8A24C" : "#333",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Skip link — steps 0-2 */}
        {step < 3 && (
          <button
            onClick={skip}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              fontSize: 13,
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            Skip
          </button>
        )}
      </div>

      {/* Slide animation keyframes */}
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
