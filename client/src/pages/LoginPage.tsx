import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import logoKanji from "@assets/logo-kanji-framed.webp";
import { gasCall } from "@/lib/api-internal";

type Mode = "login" | "request";

export default function LoginPage() {
  const { login } = useAuth();

  // Animate in on mount
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  const [mode, setMode] = useState<Mode>("login");

  // Login state
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Request access state
  const [reqName, setReqName]       = useState("");
  const [reqEmail, setReqEmail]     = useState("");
  const [reqNote, setReqNote]       = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError]     = useState("");
  const [reqSent, setReqSent]       = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setLoginError("Please enter email and password"); return; }
    setLoginLoading(true);
    setLoginError("");
    const result = await login(email, password);
    setLoginLoading(false);
    if (!result.success) setLoginError(result.error || "Invalid email or password");
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqEmail) { setReqError("Name and email are required"); return; }
    setReqLoading(true);
    setReqError("");
    try {
      const result = await gasCall("requestAccess", { name: reqName, email: reqEmail, note: reqNote });
      if (result && result.success) {
        setReqSent(true);
      } else {
        setReqError(result?.error || "Could not send request. Try again.");
      }
    } catch {
      setReqError("Connection error. Please try again.");
    }
    setReqLoading(false);
  };

  return (
    <div
      className="login-screen"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Ambient background glow */}
      <div className="login-glow-1" />
      <div className="login-glow-2" />

      {/* Logo */}
      <div className="login-logo-wrap">
        <div className="login-logo-ring">
          <img src={logoKanji} alt="Labyrinth BJJ" className="login-logo-img" />
        </div>
        <h1 className="login-title">LABYRINTH BJJ</h1>
        <p className="login-subtitle">Member Portal</p>
      </div>

      {/* Mode toggle */}
      <div className="login-toggle">
        <button
          className={`login-toggle-btn ${mode === "login" ? "active" : ""}`}
          onClick={() => { setMode("login"); setLoginError(""); setReqError(""); }}
        >
          Sign In
        </button>
        <button
          className={`login-toggle-btn ${mode === "request" ? "active" : ""}`}
          onClick={() => { setMode("request"); setLoginError(""); setReqError(""); }}
        >
          Request Access
        </button>
      </div>

      {/* ── Sign In ── */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="login-form" style={{ animation: "loginSlideIn 0.25s ease" }}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              data-testid="input-email"
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <div className="login-pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                data-testid="input-password"
              />
              <button type="button" className="login-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {loginError && <div className="login-error">{loginError}</div>}

          <button type="submit" disabled={loginLoading} className="login-submit" data-testid="button-login">
            {loginLoading
              ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              : <><span>Sign In</span><ArrowRight size={16} /></>
            }
          </button>

          <p className="login-hint">
            Don't have an account?{" "}
            <button type="button" className="login-link" onClick={() => setMode("request")}>
              Request access
            </button>
          </p>
        </form>
      )}

      {/* ── Request Access ── */}
      {mode === "request" && !reqSent && (
        <form onSubmit={handleRequest} className="login-form" style={{ animation: "loginSlideIn 0.25s ease" }}>
          <p className="login-request-desc">
            Already a Labyrinth BJJ member? Submit your info and you'll be connected to your account.
          </p>

          <div className="login-field">
            <label>Full Name</label>
            <input
              type="text"
              value={reqName}
              onChange={e => setReqName(e.target.value)}
              placeholder="John Smith"
              autoFocus
            />
          </div>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={reqEmail}
              onChange={e => setReqEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label>Note <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={reqNote}
              onChange={e => setReqNote(e.target.value)}
              placeholder="e.g. I train on Tuesday evenings…"
              rows={2}
            />
          </div>

          {reqError && <div className="login-error">{reqError}</div>}

          <button type="submit" disabled={reqLoading} className="login-submit">
            {reqLoading
              ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
              : <><span>Send Request</span><ArrowRight size={16} /></>
            }
          </button>

          <p className="login-hint">
            Already have an account?{" "}
            <button type="button" className="login-link" onClick={() => setMode("login")}>
              Sign in
            </button>
          </p>
        </form>
      )}

      {/* ── Request sent confirmation ── */}
      {mode === "request" && reqSent && (
        <div className="login-form login-success" style={{ animation: "loginSlideIn 0.25s ease" }}>
          <CheckCircle size={40} style={{ color: "#4CAF80", marginBottom: 12 }} />
          <h3>Request sent!</h3>
          <p>
            We'll review your request and send you a setup link at <strong>{reqEmail}</strong>.
            If your email matches an existing member account it will be connected automatically.
          </p>
          <button className="login-submit" style={{ marginTop: 20 }} onClick={() => { setMode("login"); setReqSent(false); setReqEmail(""); setReqName(""); setReqNote(""); }}>
            Back to Sign In
          </button>
        </div>
      )}

      <p className="login-footer">Labyrinth BJJ · Fulshear, TX</p>
    </div>
  );
}
