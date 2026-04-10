import { useState, useRef } from "react";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth-context";
import { gasCall } from "@/lib/api";
import { ChevronLeft } from "lucide-react";

const BELT_CHIPS = [
  { value: "white", label: "White", color: "#E5E5E5" },
  { value: "blue", label: "Blue", color: "#1A56DB" },
  { value: "purple", label: "Purple", color: "#7E3AF2" },
  { value: "brown", label: "Brown", color: "#92400E" },
  { value: "black", label: "Black", color: "#111827" },
];

const EXPERIENCE_OPTIONS = [
  "0\u20136 months",
  "6\u201312 months",
  "1\u20132 years",
  "2\u20135 years",
  "5+ years",
];

const DAYS_OPTIONS = ["1", "2", "3", "4", "5+"];

const STYLE_OPTIONS = ["Gi", "No-Gi", "Both"];

const GOAL_OPTIONS = [
  { emoji: "\ud83c\udfc6", label: "Compete" },
  { emoji: "\ud83d\udcaa", label: "Fitness" },
  { emoji: "\ud83e\udde0", label: "Mental focus" },
  { emoji: "\ud83e\udd1d", label: "Community" },
  { emoji: "\ud83e\udd4b", label: "Master the art" },
];

export default function OnboardingPage() {
  const { member } = useAuth();
  const [, navigate] = useHashLocation();
  const [screen, setScreen] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Screen 1 state
  const [belt, setBelt] = useState("white");
  const [experience, setExperience] = useState("");
  const [prevGym, setPrevGym] = useState("");

  // Screen 2 state
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [style, setStyle] = useState("");

  // Screen 3 state
  const [goals, setGoals] = useState<string[]>([]);

  const firstName = member?.name?.split(" ")[0] || "Warrior";

  const toggleGoal = (goal: string) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const goNext = () => {
    if (screen < 2) setScreen(screen + 1);
  };

  const goBack = () => {
    if (screen > 0) setScreen(screen - 1);
  };

  const complete = async () => {
    const data = {
      belt,
      trainingYears: experience,
      prevGym,
      daysPerWeek,
      style,
      goals,
    };
    // Save to localStorage
    localStorage.setItem("lbjj_onboarding_data", JSON.stringify(data));
    localStorage.setItem("lbjj_onboarding_complete", "true");
    // Optionally call GAS — graceful failure ok
    try {
      await gasCall("saveOnboardingData", { ...data, email: member?.email });
    } catch {
      // GAS action may not exist yet — graceful fail
    }
    navigate("/");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "#0A0A0A", zIndex: 500,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Progress dots */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 8,
        paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
        paddingBottom: 12,
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            backgroundColor: i <= screen ? "#C8A24C" : "#333",
            transition: "background-color 0.3s",
          }} />
        ))}
      </div>

      {/* Back button */}
      {screen > 0 && (
        <button
          onClick={goBack}
          style={{
            position: "absolute", top: "max(16px, env(safe-area-inset-top, 16px))", left: 16,
            background: "none", border: "none", color: "#C8A24C", cursor: "pointer",
            padding: 8, zIndex: 10,
          }}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Slides container */}
      <div ref={containerRef} style={{
        flex: 1, overflow: "hidden", width: "100%", position: "relative",
      }}>
        <div style={{
          display: "flex", flexDirection: "row", width: "300%", height: "100%",
          transform: `translateX(-${screen * (100 / 3)}%)`,
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {/* ── Screen 1: BJJ Background ── */}
          <div style={{ width: "33.333%", flexShrink: 0, padding: "0 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: "16px 0 4px" }}>
                Welcome to Labyrinth BJJ, {firstName}!
              </h1>
              <p style={{ fontSize: 14, color: "#999", margin: "0 0 28px" }}>
                Let's set up your profile.
              </p>

              {/* Belt picker */}
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 10 }}>
                Current Belt
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                {BELT_CHIPS.map(b => (
                  <button
                    key={b.value}
                    onClick={() => setBelt(b.value)}
                    style={{
                      padding: "10px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: belt === b.value ? `2px solid ${b.color === "#111827" ? "#C8A24C" : b.color}` : "2px solid #222",
                      backgroundColor: belt === b.value ? `${b.color}18` : "#141414",
                      color: belt === b.value ? (b.color === "#111827" ? "#C8A24C" : b.color) : "#666",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: b.color, border: b.value === "black" ? "1px solid #C8A24C" : "none" }} />
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Experience */}
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 10 }}>
                How long training?
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
                {EXPERIENCE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setExperience(opt)}
                    style={{
                      padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                      border: experience === opt ? "2px solid #C8A24C" : "2px solid #222",
                      backgroundColor: experience === opt ? "rgba(200,162,76,0.12)" : "#141414",
                      color: experience === opt ? "#C8A24C" : "#999",
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Previous gym */}
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>
                Previous Gym <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={prevGym}
                onChange={e => setPrevGym(e.target.value)}
                placeholder="Where did you train before?"
                style={{
                  width: "100%", backgroundColor: "#141414", border: "1px solid #222",
                  borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#F0F0F0",
                  outline: "none", boxSizing: "border-box", marginBottom: 24, fontFamily: "inherit",
                }}
              />
            </div>

            {/* CTA */}
            <div style={{ padding: "16px 0 max(24px, env(safe-area-inset-bottom, 24px))" }}>
              <button
                onClick={goNext}
                disabled={!belt || !experience}
                style={{
                  width: "100%", padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 700,
                  backgroundColor: belt && experience ? "#C8A24C" : "#1A1A1A",
                  color: belt && experience ? "#0A0A0A" : "#444",
                  border: "none", cursor: belt && experience ? "pointer" : "default",
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>

          {/* ── Screen 2: Training Habits ── */}
          <div style={{ width: "33.333%", flexShrink: 0, padding: "0 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: "16px 0 4px" }}>
                How do you like to train?
              </h1>
              <p style={{ fontSize: 14, color: "#999", margin: "0 0 28px" }}>
                Help us personalize your experience.
              </p>

              {/* Days per week */}
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 10 }}>
                Days per week
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                {DAYS_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 700,
                      border: daysPerWeek === d ? "2px solid #C8A24C" : "2px solid #222",
                      backgroundColor: daysPerWeek === d ? "rgba(200,162,76,0.12)" : "#141414",
                      color: daysPerWeek === d ? "#C8A24C" : "#666",
                      cursor: "pointer", textAlign: "center",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Style preference */}
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 10 }}>
                Style preference
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                {STYLE_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    style={{
                      flex: 1, padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 600,
                      border: style === s ? "2px solid #C8A24C" : "2px solid #222",
                      backgroundColor: style === s ? "rgba(200,162,76,0.12)" : "#141414",
                      color: style === s ? "#C8A24C" : "#666",
                      cursor: "pointer", textAlign: "center",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: "16px 0 max(24px, env(safe-area-inset-bottom, 24px))" }}>
              <button
                onClick={goNext}
                disabled={!daysPerWeek || !style}
                style={{
                  width: "100%", padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 700,
                  backgroundColor: daysPerWeek && style ? "#C8A24C" : "#1A1A1A",
                  color: daysPerWeek && style ? "#0A0A0A" : "#444",
                  border: "none", cursor: daysPerWeek && style ? "pointer" : "default",
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>

          {/* ── Screen 3: Goals ── */}
          <div style={{ width: "33.333%", flexShrink: 0, padding: "0 24px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", margin: "16px 0 4px" }}>
                What are you training for?
              </h1>
              <p style={{ fontSize: 14, color: "#999", margin: "0 0 28px" }}>
                Select all that apply.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {GOAL_OPTIONS.map(g => {
                  const selected = goals.includes(g.label);
                  return (
                    <button
                      key={g.label}
                      onClick={() => toggleGoal(g.label)}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "16px 18px", borderRadius: 14, fontSize: 15, fontWeight: 600,
                        border: selected ? "2px solid #C8A24C" : "2px solid #222",
                        backgroundColor: selected ? "rgba(200,162,76,0.12)" : "#141414",
                        color: selected ? "#C8A24C" : "#999",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{g.emoji}</span>
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: "16px 0 max(24px, env(safe-area-inset-bottom, 24px))" }}>
              <button
                onClick={complete}
                disabled={goals.length === 0}
                style={{
                  width: "100%", padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 700,
                  backgroundColor: goals.length > 0 ? "#C8A24C" : "#1A1A1A",
                  color: goals.length > 0 ? "#0A0A0A" : "#444",
                  border: "none", cursor: goals.length > 0 ? "pointer" : "default",
                }}
              >
                Let's Go &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
