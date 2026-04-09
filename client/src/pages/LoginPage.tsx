import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import logoMaze from "@assets/maze-gold-md.png";
import { gasCall } from "@/lib/api";

type Mode = "login" | "request";

export default function LoginPage() {
  const { login } = useAuth();

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 40); return () => clearTimeout(t); }, []);

  const [mode, setMode] = useState<Mode>("login");

  // Login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loginError, setLoginError]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Request
  const [reqName, setReqName]   = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqNote, setReqNote]   = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError]     = useState("");
  const [reqSent, setReqSent]       = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setLoginError("Please enter email and password"); return; }
    setLoginLoading(true); setLoginError("");
    const result = await login(email, password);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.error || "Invalid email or password");
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqEmail) { setReqError("Name and email are required"); return; }
    setReqLoading(true); setReqError("");
    try {
      const result = await gasCall("requestAccess", { name: reqName, email: reqEmail, note: reqNote });
      if (result?.success) setReqSent(true);
      else setReqError(result?.error || "Could not send request. Try again.");
    } catch { setReqError("Connection error. Please try again."); }
    setReqLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "#0A0A0A",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 20px",
      overflowY: "auto",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }}>

      {/* Ambient glows */}
      <div style={{ position: "fixed", top: -120, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,162,76,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,162,76,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          background: "rgba(200,162,76,0.1)", border: "1px solid rgba(200,162,76,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
          boxShadow: "0 0 32px rgba(200,162,76,0.15)",
        }}>
          <img src={logoMaze} alt="Labyrinth BJJ" style={{ width: 52, height: 52, objectFit: "contain" }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.08em", color: "#F0F0F0", margin: 0, textTransform: "uppercase" }}>
          Labyrinth BJJ
        </h1>
        <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Member Portal
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 380,
        backgroundColor: "#111", border: "1px solid #1A1A1A",
        borderRadius: 20, overflow: "hidden",
      }}>

        {/* Mode toggle */}
        <div style={{ display: "flex", padding: "6px", gap: 4, borderBottom: "1px solid #1A1A1A" }}>
          {(["login", "request"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setLoginError(""); setReqError(""); }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                backgroundColor: mode === m ? "#1A1A1A" : "transparent",
                color: mode === m ? "#C8A24C" : "#555",
              }}
            >
              {m === "login" ? "Sign In" : "Request Access"}
            </button>
          ))}
        </div>

        <div style={{ padding: "20px" }}>

          {/* ── Sign In ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Email">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" autoComplete="email" autoFocus
                  style={inputStyle} data-testid="input-email" />
              </Field>

              <Field label="Password">
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password" autoComplete="current-password"
                    style={{ ...inputStyle, paddingRight: 44 }} data-testid="input-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4 }}>
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>

              {loginError && <p style={{ fontSize: 12, color: "#E05555", margin: "-4px 0 0", padding: "8px 12px", background: "rgba(224,85,85,0.07)", borderRadius: 8 }}>{loginError}</p>}

              <button type="submit" disabled={loginLoading} data-testid="button-login"
                style={{ ...submitStyle, opacity: loginLoading ? 0.7 : 1, marginTop: 4 }}>
                {loginLoading
                  ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Signing in…</>
                  : <><span>Sign In</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
              </button>
            </form>
          )}

          {/* ── Request Access ── */}
          {mode === "request" && !reqSent && (
            <form onSubmit={handleRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px", lineHeight: 1.5 }}>
                Already a member? Submit your info and we'll connect your account — or send you a setup link if your email matches.
              </p>

              <Field label="Full Name">
                <input type="text" value={reqName} onChange={e => setReqName(e.target.value)}
                  placeholder="John Smith" autoFocus style={inputStyle} />
              </Field>

              <Field label="Email">
                <input type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)}
                  placeholder="your@email.com" style={inputStyle} />
              </Field>

              <Field label={<>Note <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></>}>
                <textarea value={reqNote} onChange={e => setReqNote(e.target.value)}
                  placeholder="e.g. I train Tuesday evenings…" rows={2}
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
              </Field>

              {reqError && <p style={{ fontSize: 12, color: "#E05555", margin: "-4px 0 0", padding: "8px 12px", background: "rgba(224,85,85,0.07)", borderRadius: 8 }}>{reqError}</p>}

              <button type="submit" disabled={reqLoading} style={{ ...submitStyle, opacity: reqLoading ? 0.7 : 1, marginTop: 4 }}>
                {reqLoading
                  ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Sending…</>
                  : <><span>Send Request</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
              </button>
            </form>
          )}

          {/* ── Sent ── */}
          {mode === "request" && reqSent && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "8px 0" }}>
              <CheckCircle size={40} style={{ color: "#4CAF80" }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>Request sent!</h3>
              <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
                We'll review it and send a setup link to <strong style={{ color: "#F0F0F0" }}>{reqEmail}</strong>.
                If your email matches a member account it will connect automatically.
              </p>
              <button onClick={() => { setMode("login"); setReqSent(false); setReqName(""); setReqEmail(""); setReqNote(""); }}
                style={{ ...submitStyle, marginTop: 8 }}>
                Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 11, color: "#444", letterSpacing: "0.06em" }}>
        LABYRINTH BJJ · FULSHEAR, TX
      </p>
    </div>
  );
}

// ─── Style helpers ─────────────────────────────────────────────────

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
  backgroundColor: "#0D0D0D", border: "1px solid #222", color: "#F0F0F0",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const submitStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
  backgroundColor: "#C8A24C", color: "#0A0A0A", border: "none",
  cursor: "pointer", width: "100%", transition: "opacity 0.15s",
};
