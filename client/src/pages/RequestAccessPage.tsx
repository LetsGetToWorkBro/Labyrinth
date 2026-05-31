/**
 * RequestAccessPage — "The Gateway" request form
 *
 * Shown when an unauthenticated user lands on a protected route.
 * After submission they see a "pending approval" screen.
 *
 * P1 fix (BUG-06/07): reverted to GAS-only submission path.
 * Supabase access_requests table is not the source of truth — GAS sheet is.
 * The Supabase submitAccessRequest() path is disabled until admin visibility
 * is wired end-to-end.
 */

import { useState } from "react";
import { gasCall } from "@/lib/api";
import logoGold from "@assets/labyrinth-logo-gold.png";

const GOLD = "#D4AF37";

type Step = "form" | "pending";

export default function RequestAccessPage() {
  const [step, setStep]     = useState<Step>("form");
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await gasCall("memberRequestAccess", {
        name: name.trim(),
        email: email.trim(),
        phone: "",
      });
      setStep("pending");
    } catch {
      setError("Submission failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#05060a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Atmosphere */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 80% 40% at 50% -10%, rgba(212,175,55,0.14), transparent 60%)`,
        zIndex: 0,
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 400,
        background: "rgba(13,15,22,0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 32,
        backdropFilter: "blur(16px)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src={logoGold} alt="Labyrinth BJJ" style={{ height: 56, marginBottom: 12 }} />
          <h1 style={{ color: GOLD, fontSize: 20, fontWeight: 800, margin: 0 }}>
            {step === "form" ? "Request Access" : "Request Submitted"}
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6, margin: "6px 0 0" }}>
            {step === "form"
              ? "Members of Labyrinth BJJ can request portal access below."
              : "Your request is pending approval by an instructor."}
          </p>
        </div>

        {step === "pending" ? (
          <div style={{ textAlign: "center" }}>
            {/* Pending icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(212,175,55,0.12)",
              border: `2px solid ${GOLD}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p style={{ color: "#eaecf2", fontSize: 14, lineHeight: 1.6 }}>
              We received your request for <strong style={{ color: GOLD }}>{email}</strong>.
              You'll receive an email invite once an instructor approves your access.
            </p>
            <p style={{ color: "#6b7280", fontSize: 12, marginTop: 16 }}>
              Already have an account?{" "}
              <a href="/" style={{ color: GOLD, textDecoration: "none", fontWeight: 600 }}>
                Sign in
              </a>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10, padding: "10px 14px",
                color: "#ef4444", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Anthony Curry"
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@labyrinthbjj.com"
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                Why do you need access? (optional)
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="I'm a current member at Labyrinth BJJ Houston..."
                rows={3}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "rgba(212,175,55,0.3)" : `rgba(212,175,55,0.15)`,
                border: `1px solid ${GOLD}50`,
                borderRadius: 12,
                padding: "14px 20px",
                color: GOLD,
                fontWeight: 800,
                fontSize: 15,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                marginTop: 4,
                transition: "all 0.2s",
              }}
            >
              {loading ? "Submitting…" : "Request Access"}
            </button>

            <p style={{ textAlign: "center", color: "#6b7280", fontSize: 12 }}>
              Already have an account?{" "}
              <a href="/" style={{ color: GOLD, textDecoration: "none", fontWeight: 600 }}>
                Sign in
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#eaecf2",
  fontSize: 15,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
