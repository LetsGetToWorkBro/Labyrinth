import { useState } from "react";
import { useHashLocation } from "wouter/use-hash-location";
import { useAuth } from "@/lib/auth-context";
import { gasCall } from "@/lib/api";

const GOAL_OPTIONS = [
  { emoji: "\ud83c\udfc6", label: "Compete" },
  { emoji: "\ud83d\udcaa", label: "Fitness" },
  { emoji: "\ud83e\udde0", label: "Mental focus" },
  { emoji: "\ud83e\udd1d", label: "Community" },
  { emoji: "\ud83e\udd4b", label: "Master the art" },
];

function getFirstName(member: { name?: string; email?: string } | null): string {
  // Try lbjj_member_profile in localStorage first
  try {
    const raw = localStorage.getItem("lbjj_member_profile");
    if (raw) {
      const profile = JSON.parse(raw);
      const name = profile?.Name;
      if (name && typeof name === "string") {
        const first = name.trim().split(" ")[0];
        if (first) return first;
      }
    }
  } catch {
    // ignore parse errors
  }
  // Fall back to auth context
  if (member?.name) {
    const first = member.name.trim().split(" ")[0];
    if (first) return first;
  }
  return "there";
}

export default function OnboardingPage() {
  const { member } = useAuth();
  const [, navigate] = useHashLocation();
  const [goals, setGoals] = useState<string[]>([]);

  const firstName = getFirstName(member);

  const toggleGoal = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal],
    );
  };

  const complete = () => {
    // 1. Save locally — synchronous, instant
    try {
      localStorage.setItem("lbjj_onboarding_data", JSON.stringify({ goals }));
      localStorage.setItem("lbjj_onboarding_complete", "true");
    } catch (_) {}

    // 2. Navigate immediately — don't wait for anything
    navigate("/");

    // 3. Fire GAS in background — no await, no blocking
    const profile = (() => { try { return JSON.parse(localStorage.getItem("lbjj_member_profile") || "{}"); } catch { return {}; } })();
    if (profile.Email) {
      gasCall("saveOnboardingData", {
        email: profile.Email,
        name: profile.Name || "",
        goals,
      }).catch(() => {});
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "#0A0A0A", zIndex: 500,
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Content */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "0 24px",
        display: "flex", flexDirection: "column",
        paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
      }}>
        {/* Welcome header */}
        <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            backgroundColor: "rgba(200,162,76,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 32,
          }}>
            {"\ud83e\udd4b"}
          </div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: "#F0F0F0",
            margin: "0 0 6px",
          }}>
            Welcome to Labyrinth BJJ, {firstName}!
          </h1>
          <p style={{ fontSize: 15, color: "#999", margin: 0 }}>
            What are you training for?
          </p>
        </div>

        {/* Goal chips */}
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

      {/* Let's Go button — always active */}
      <div style={{
        padding: "16px 24px",
        paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
      }}>
        <button
          onClick={complete}
          style={{
            width: "100%", padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 700,
            backgroundColor: "#C8A24C", color: "#0A0A0A",
            border: "none", cursor: "pointer",
          }}
        >
          Let's Go &rarr;
        </button>
      </div>
    </div>
  );
}
