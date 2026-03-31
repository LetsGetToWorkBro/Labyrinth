import { useState } from "react";
import { BeltIcon, ADULT_BELT_OPTIONS, KIDS_BELT_OPTIONS, BELT_DISPLAY_NAMES } from "./BeltIcon";

interface GuestProfile {
  name: string;
  belt: string;
  type: "Adult" | "Kid";
}

interface Props {
  onComplete: (profile: GuestProfile) => void;
  onSkip?: () => void;
}

export default function GuestProfileSetup({ onComplete, onSkip }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Adult" | "Kid">("Adult");
  const [belt, setBelt] = useState("white");

  const beltOptions = type === "Adult" ? ADULT_BELT_OPTIONS : KIDS_BELT_OPTIONS;

  return (
    <div style={{ padding: "20px", minHeight: "100%" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#F0F0F0", marginBottom: 4 }}>Set Up Your Profile</h2>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 24 }}>So people know who you are in chat and on the belt journey</p>

      {/* Name */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: 6 }}>Your Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="First name or nickname"
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 10,
            backgroundColor: "#111",
            border: "1px solid #222",
            color: "#F0F0F0",
            fontSize: 14,
            outline: "none",
          }}
          data-testid="input-guest-name"
        />
      </div>

      {/* Type toggle */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: 6 }}>I am a...</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["Adult", "Kid"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); setBelt("white"); }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                backgroundColor: type === t ? "rgba(200,162,76,0.12)" : "#111",
                border: `1px solid ${type === t ? "rgba(200,162,76,0.3)" : "#222"}`,
                color: type === t ? "#C8A24C" : "#666",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t === "Adult" ? "Adult Member" : "Youth Member"}
            </button>
          ))}
        </div>
      </div>

      {/* Belt picker */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: 6 }}>Current Belt</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {beltOptions.map(b => (
            <button
              key={b}
              onClick={() => setBelt(b)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 4px",
                borderRadius: 10,
                backgroundColor: belt === b ? "rgba(200,162,76,0.12)" : "#111",
                border: `1px solid ${belt === b ? "rgba(200,162,76,0.3)" : "#222"}`,
                cursor: "pointer",
              }}
            >
              <BeltIcon belt={b} width={50} />
              <span style={{ fontSize: 9, color: belt === b ? "#C8A24C" : "#666" }}>
                {BELT_DISPLAY_NAMES[b] || b}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={() => name.trim() && onComplete({ name: name.trim(), belt, type })}
        disabled={!name.trim()}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          backgroundColor: name.trim() ? "#C8A24C" : "#1A1A1A",
          color: name.trim() ? "#0A0A0A" : "#666",
          fontSize: 14,
          fontWeight: 700,
          border: "none",
          cursor: name.trim() ? "pointer" : "default",
        }}
        data-testid="button-save-profile"
      >
        Save Profile
      </button>

      {onSkip && (
        <button
          onClick={onSkip}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 8,
            background: "none",
            border: "none",
            color: "#666",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
