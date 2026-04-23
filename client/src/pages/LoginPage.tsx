/**
 * LoginPage — "The Gateway"
 * Ported from labyrinth-login-insane.html
 * Real Labyrinth logo (logo-maze.webp) replaces placeholder SVG maze.
 * Wired to existing auth (email/password login + biometric passkey).
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { setActiveLocation, gasCall } from "@/lib/api";
import { LOCATIONS, getSavedLocationId, type Location } from "@/lib/locations";
import logoMaze from "@assets/logo-maze.webp";
import { NativeBiometric } from "capacitor-native-biometric";

// ─── Types ─────────────────────────────────────────────────────────
type Screen = "gateway" | "request" | "boot";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#FFDF73";
const GOLD_GLOW = "rgba(212,175,55,0.4)";

// ─── Rate limit helpers ─────────────────────────────────────────────
const requestAccessAttempts: number[] = [];
const SUSPICIOUS_NAMES = ["test", "demo", "fake", "sample", "trial user", "test user"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Biometric helpers ──────────────────────────────────────────────
async function triggerBiometricPrompt(): Promise<"native" | "webauthn" | "failed"> {
  const isNative = typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();
  if (isNative) {
    try {
      const { isAvailable } = await NativeBiometric.isAvailable({ useFallback: true });
      if (isAvailable) {
        await NativeBiometric.verifyIdentity({ reason: "Sign in to Labyrinth BJJ", title: "Biometric Sign In", useFallback: true });
        return "native";
      }
    } catch (e: any) {
      const msg = (e?.message || e?.code || "").toString().toLowerCase();
      if (msg.includes("cancel") || msg.includes("dismiss") || msg.includes("user_cancel") || msg.includes("authentication_failed") || msg.includes("lockout")) return "failed";
    }
  }
  try {
    const savedCreds = localStorage.getItem("lbjj_passkey_credential_id");
    if (!savedCreds) return "failed";
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    await navigator.credentials.get({ publicKey: { challenge, allowCredentials: [{ id: Uint8Array.from(atob(savedCreds), c => c.charCodeAt(0)), type: "public-key" }], userVerification: "required", timeout: 60000 } });
    return "webauthn";
  } catch { return "failed"; }
}

// ─── Boot terminal lines ────────────────────────────────────────────
const BOOT_LINES = [
  "[SYSTEM] ESTABLISHING UPLINK...",
  "[DATA] RETRIEVING ARTIFACT PROGRESS...",
  "[CALC] PARAGON MATRIX ALIGNED...",
  "[AUTH] THE LABYRINTH IS OPEN.",
];

// ─── Greeting ──────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning. Prepare to Train.";
  if (h < 18) return "Good Afternoon. The Mats Await.";
  return "Good Evening. Forge Your Legacy.";
}

export default function LoginPage() {
  const { login, loginWithPasskey } = useAuth();
  const [screen, setScreen] = useState<Screen>("gateway");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(() => {
    const id = getSavedLocationId();
    return LOCATIONS.find(l => l.id === id) || null;
  });

  // Bio vault state
  const [bioOpen, setBioOpen] = useState(false);
  const [bioPhase, setBioPhase] = useState<"idle" | "scanning" | "success" | "fail">("idle");
  const [bioTitle, setBioTitle] = useState("Biometric Uplink");
  const [bioDesc, setBioDesc] = useState("Awaiting physiological signature.");

  // Boot sequence state
  const [bootActive, setBootActive] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalDone, setTerminalDone] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // 3D parallax
  const wrapRef = useRef<HTMLDivElement>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const curX = useRef(0);
  const curY = useRef(0);
  const rafRef = useRef<number>();

  // Request access fields
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);
  const [reqError, setReqError] = useState("");
  const [reqLoading, setReqLoading] = useState(false);

  // Parallax RAF
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseX.current = (window.innerWidth / 2 - e.pageX) / 40;
      mouseY.current = (window.innerHeight / 2 - e.pageY) / 40;
    };
    window.addEventListener("mousemove", onMove);
    const animate = () => {
      curX.current += (mouseX.current - curX.current) * 0.1;
      curY.current += (mouseY.current - curY.current) * 0.1;
      if (wrapRef.current) {
        wrapRef.current.style.transform = `rotateY(${curX.current}deg) rotateX(${curY.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Boot terminal typewriter
  const runBoot = useCallback((onDone: () => void) => {
    setBootActive(true);
    setTerminalLines([]);
    setTerminalDone(false);
    let lineIdx = 0;
    let charIdx = 0;
    let built: string[] = [];

    const tick = () => {
      if (lineIdx >= BOOT_LINES.length) {
        setTerminalDone(true);
        setTimeout(() => {
          setFlashActive(true);
          setTimeout(onDone, 600);
        }, 500);
        return;
      }
      if (charIdx === 0) built = [...built, ""];
      const line = BOOT_LINES[lineIdx];
      const updated = [...built];
      updated[lineIdx] = line.slice(0, charIdx + 1);
      setTerminalLines(updated);
      built = updated;
      charIdx++;
      if (charIdx >= line.length) {
        lineIdx++; charIdx = 0;
        setTimeout(tick, 500);
      } else {
        setTimeout(tick, Math.random() * 30 + 15);
      }
    };
    setTimeout(tick, 1200);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Enter your email and password."); return; }
    if (!location) { setError("Please select your location first."); return; }
    setLoading(true);
    try {
      setActiveLocation(location);
      const res = await login(email.trim(), password);
      if (!res.success) { setError(res.error || "Access denied."); setLoading(false); return; }
      runBoot(() => { /* auth-context handles navigation */ });
    } catch { setError("Connection failed. Try again."); setLoading(false); }
  };

  const openBioVault = async () => {
    if (!localStorage.getItem("lbjj_session_token")) {
      setError("Sign in with email first to enable biometrics.");
      return;
    }
    setBioOpen(true);
    setBioPhase("idle");
    setBioTitle("Analyzing Geometry");
    setBioDesc("Position face or finger to authenticate.");
    await new Promise(r => setTimeout(r, 600));
    setBioPhase("scanning");

    const result = await triggerBiometricPrompt();
    if (result === "failed") {
      setBioPhase("fail");
      setBioTitle("Authentication Failed");
      setBioDesc("Could not verify identity.");
      setTimeout(() => { setBioOpen(false); setBioPhase("idle"); }, 2000);
      return;
    }
    setBioPhase("success");
    setBioTitle("Signature Verified");
    setBioDesc("Access Granted.");
    await new Promise(r => setTimeout(r, 1800));
    setBioOpen(false);
    setBioPhase("idle");
    // Attempt passkey/token login
    try {
      const res = await loginWithPasskey();
      if (res.success) runBoot(() => {});
    } catch { setError("Biometric login failed. Sign in with email."); }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError("");
    const now = Date.now();
    requestAccessAttempts.push(now);
    const recent = requestAccessAttempts.filter(t => now - t < 60000);
    if (recent.length > 3) { setReqError("Too many requests. Wait a minute."); return; }
    if (!reqName.trim() || !reqEmail.trim()) { setReqError("Name and email are required."); return; }
    if (SUSPICIOUS_NAMES.some(n => reqName.trim().toLowerCase().includes(n))) { setReqError("Please enter your real name."); return; }
    if (!EMAIL_REGEX.test(reqEmail.trim())) { setReqError("Enter a valid email address."); return; }
    setReqLoading(true);
    try {
      await gasCall("memberRequestAccess", { name: reqName.trim(), email: reqEmail.trim(), phone: reqPhone.trim() });
      setReqSubmitted(true);
    } catch { setReqError("Submission failed. Try again."); }
    setReqLoading(false);
  };

  // ─── Boot sequence screen ─────────────────────────────────────────
  if (bootActive) {
    return (
      <>
        <style>{`
          @keyframes lg-blink { 0%,100%{opacity:1}50%{opacity:0} }
          @keyframes lg-drawMaze { to { stroke-dashoffset: 0; } }
          @keyframes lg-vaultEnter { 0%{opacity:0;transform:translateY(80px) translateZ(-100px) rotateX(10deg)}100%{opacity:1;transform:translateY(0) translateZ(50px) rotateX(0deg)} }
          @keyframes lg-scaleIn { 0%{opacity:0;transform:scale(0.5)}100%{opacity:1;transform:scale(1)} }
          @keyframes lg-fadeUp { to{opacity:1;transform:translateY(0)} }
          @keyframes lg-slowSpin { to{transform:translate(-50%,-50%) rotateX(40deg) rotateZ(360deg)} }
          @keyframes lg-driftUp { 0%{background-position:0 150px}100%{background-position:50px -150px} }
          @keyframes lg-laserScan { 0%{top:-10%}100%{top:110%} }
          @keyframes lg-spinFwd { 100%{transform:rotate(360deg)} }
          @keyframes lg-spinRev { 100%{transform:rotate(-360deg)} }
        `}</style>
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {/* Logo */}
          <img
            src={logoMaze}
            alt="Labyrinth"
            style={{
              width: 160, height: 160, marginBottom: 48,
              filter: `drop-shadow(0 0 40px ${GOLD_GLOW})`,
              animation: "lg-scaleIn 1.5s cubic-bezier(0.16,1,0.3,1) both",
              objectFit: "contain",
            }}
          />
          {/* Terminal */}
          <div style={{ width: 360, fontFamily: "'Courier New',monospace", fontSize: 13, fontWeight: 700, color: GOLD, lineHeight: 1.9, textShadow: `0 0 8px ${GOLD_GLOW}`, textAlign: "left" }}>
            {terminalLines.map((line, i) => (
              <div key={i}>{line}{i === terminalLines.length - 1 && !terminalDone && <span style={{ display: "inline-block", width: 8, height: 13, background: GOLD, verticalAlign: "middle", marginLeft: 4, animation: "lg-blink 1s step-end infinite" }} />}</div>
            ))}
          </div>
        </div>
        {/* Flash */}
        <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 1000, opacity: flashActive ? 1 : 0, pointerEvents: "none", transition: "opacity 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </>
    );
  }

  // ─── Request access screen ────────────────────────────────────────
  if (screen === "request") {
    return (
      <>
        <GatewayBackground />
        <style>{GATEWAY_STYLES}</style>
        <div className="lg-gateway-wrapper">
          <div className="lg-auth-card">
            <div className="lg-personal-greeting">New to the Labyrinth</div>
            <img src={logoMaze} alt="Labyrinth" className="lg-logo-img" />
            <div className="lg-title-group">
              <h1 className="lg-title">Request Access</h1>
              <div className="lg-subtitle">We'll reach out to get you started</div>
            </div>
            {reqSubmitted ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>Request Sent!</div>
                <div style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.5 }}>We'll be in touch within 24 hours.</div>
                <button onClick={() => setScreen("gateway")} className="lg-btn-submit" style={{ marginTop: 24 }}>← Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleRequestAccess}>
                {reqError && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{reqError}</div>}
                <div className="lg-input-group">
                  <input required value={reqName} onChange={e => setReqName(e.target.value)} type="text" className="lg-input-field" />
                  <label className="lg-input-label">Full Name</label>
                </div>
                <div className="lg-input-group">
                  <input required value={reqEmail} onChange={e => setReqEmail(e.target.value)} type="email" className="lg-input-field" />
                  <label className="lg-input-label">Email Address</label>
                </div>
                <div className="lg-input-group">
                  <input value={reqPhone} onChange={e => setReqPhone(e.target.value)} type="tel" className="lg-input-field" />
                  <label className="lg-input-label">Phone (optional)</label>
                </div>
                <button type="submit" disabled={reqLoading} className="lg-btn-submit">{reqLoading ? "Sending..." : "Submit Request"}</button>
                <button type="button" onClick={() => setScreen("gateway")} className="lg-btn-bio" style={{ marginTop: 12 }}>← Back to Login</button>
              </form>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─── Main gateway screen ──────────────────────────────────────────
  const hasSavedToken = !!localStorage.getItem("lbjj_session_token");
  const hasPasskey = !!localStorage.getItem("lbjj_passkey_credential_id");

  return (
    <>
      <GatewayBackground />
      <style>{GATEWAY_STYLES}</style>

      {/* Bio Vault */}
      <div
        className={`lg-bio-vault${bioOpen ? " active" : ""}${bioPhase === "scanning" ? " scanning" : ""}${bioPhase === "success" ? " success" : ""}`}
        onClick={e => { if (e.target === e.currentTarget) { setBioOpen(false); setBioPhase("idle"); } }}
      >
        <div className="lg-bio-scan-ring">
          <div className="lg-bio-mesh" />
          <div className="lg-bio-mesh inner" />
          <div className="lg-bio-mesh core" />
          <div className="lg-bio-fingerprint" />
          <div className="lg-bio-laser" />
        </div>
        <div className="lg-bio-text">
          <h2 className="lg-bio-title" style={{ color: bioPhase === "success" ? "#10b981" : bioPhase === "fail" ? "#ef4444" : "#fff" }}>{bioTitle}</h2>
          <p className="lg-bio-desc">{bioDesc}</p>
        </div>
      </div>

      {/* Gateway Card */}
      <div className="lg-gateway-wrapper" ref={wrapRef} style={{ transformStyle: "preserve-3d" }}>
        <div className="lg-auth-card">
          <div className="lg-personal-greeting">{getGreeting()}</div>

          {/* Real logo */}
          <img src={logoMaze} alt="Labyrinth" className="lg-logo-img" />

          <div className="lg-title-group">
            <h1 className="lg-title">Labyrinth</h1>
            <div className="lg-subtitle">Secure Gateway</div>
          </div>

          {/* Location selector */}
          {!location ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>Select Your Location</div>
              {LOCATIONS.map(loc => (
                <button key={loc.id} onClick={() => { setLocation(loc); setActiveLocation(loc); }} style={{ width: "100%", marginBottom: 8, padding: "14px 20px", borderRadius: 14, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{loc.name}</span>
                  <span style={{ color: "#444", fontSize: 12 }}>→</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              {error && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, marginBottom: 16, padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>{error}</div>}

              <div className="lg-input-group">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="lg-input-field" autoComplete="email" />
                <label className="lg-input-label">Identity Core (Email)</label>
              </div>
              <div className="lg-input-group">
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="lg-input-field" autoComplete="current-password" />
                <label className="lg-input-label">Access Cipher</label>
              </div>

              <button type="submit" disabled={loading} className="lg-btn-submit">{loading ? "Authenticating..." : "Enter the Academy"}</button>
            </form>
          )}

          {/* Biometric button */}
          {(hasSavedToken || hasPasskey) && (
            <button className="lg-btn-bio" onClick={openBioVault}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                <path d="M12 2a10 10 0 0 0-10 10v2a10 10 0 0 0 10 10 10 10 0 0 0 10-10v-2a10 10 0 0 0-10-10z" />
                <path d="M12 6a6 6 0 0 0-6 6v2" />
                <path d="M16 12a4 4 0 0 0-8 0v2" />
                <path d="M12 12v2" />
              </svg>
              Identify via Biometrics
            </button>
          )}

          {/* Location change + request access */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: location ? 20 : 8 }}>
            {location && (
              <button onClick={() => setLocation(null)} style={{ background: "none", border: "none", color: "#444", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                📍 {location.name}
              </button>
            )}
            <button onClick={() => setScreen("request")} style={{ background: "none", border: "none", color: "#444", fontSize: 12, cursor: "pointer", padding: "6px 0", marginLeft: "auto" }}>
              Request Access →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Background layers ────────────────────────────────────────────
function GatewayBackground() {
  return (
    <>
      <div style={{ position: "fixed", inset: "-10%", width: "120%", height: "120%", background: "url('https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop') center/cover", opacity: 0.08, filter: "blur(15px) contrast(1.5) grayscale(0.5)", zIndex: 0, transform: "translateZ(-500px)" }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at 50% 50%, transparent 0%, #000 80%)", zIndex: 1 }} />
      {/* Giant bg maze */}
      <svg style={{ position: "fixed", top: "50%", left: "50%", width: "150vw", height: "150vw", maxWidth: 1200, maxHeight: 1200, transform: "translate(-50%,-50%) rotateX(40deg) rotateZ(0deg)", opacity: 0.04, zIndex: 1, pointerEvents: "none", animation: "lg-slowSpin 120s linear infinite" }} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="lg-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFDF73" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8B6508" />
          </linearGradient>
        </defs>
        <g stroke="url(#lg-gold-grad)" strokeWidth="1.5" fill="none" opacity="0.3">
          <circle cx="100" cy="100" r="90" strokeDasharray="100 20 50 10" />
          <circle cx="100" cy="100" r="75" strokeDasharray="80 30 150 15" />
          <circle cx="100" cy="100" r="60" strokeDasharray="200 40 60 20" />
          <circle cx="100" cy="100" r="45" strokeDasharray="50 10 100 25" />
          <circle cx="100" cy="100" r="30" strokeDasharray="30 15" />
          <circle cx="100" cy="100" r="15" />
        </g>
      </svg>
      {/* Embers */}
      <div style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none", backgroundImage: `radial-gradient(${GOLD} 1px, transparent 1px)`, backgroundSize: "150px 150px", opacity: 0.04, animation: "lg-driftUp 40s linear infinite" }} />
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────
const GOLD_VAR = "#D4AF37";
const GOLD_LIGHT_VAR = "#FFDF73";

const GATEWAY_STYLES = `
  @keyframes lg-vaultEnter { 0%{opacity:0;transform:translateY(80px) translateZ(-100px) rotateX(10deg)}100%{opacity:1;transform:translateY(0) translateZ(50px) rotateX(0deg)} }
  @keyframes lg-scaleIn { 0%{opacity:0;transform:scale(0.5)}100%{opacity:1;transform:scale(1)} }
  @keyframes lg-fadeUp { to{opacity:1;transform:translateY(0)} }
  @keyframes lg-slowSpin { to{transform:translate(-50%,-50%) rotateX(40deg) rotateZ(360deg)} }
  @keyframes lg-driftUp { 0%{background-position:0 150px}100%{background-position:50px -150px} }
  @keyframes lg-laserScan { 0%{top:-10%}100%{top:110%} }
  @keyframes lg-spinFwd { 100%{transform:rotate(360deg)} }
  @keyframes lg-spinRev { 100%{transform:rotate(-360deg)} }
  @keyframes lg-shine { to{background-position:right center} }

  .lg-gateway-wrapper {
    position: relative; z-index: 10;
    width: 100%; max-width: 420px; padding: 24px;
  }

  .lg-auth-card {
    background: rgba(10,10,10,0.4);
    border-radius: 28px;
    padding: 48px 36px;
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.8);
    position: relative;
    transform: translateZ(50px);
    opacity: 0;
    animation: lg-vaultEnter 1.5s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .lg-auth-card::after {
    content:''; position:absolute; inset:0; border-radius:28px; padding:1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, rgba(212,175,55,0.25) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    pointer-events: none;
  }

  .lg-logo-img {
    width: 90px; height: 90px; object-fit: contain;
    display: block; margin: 0 auto 24px;
    filter: drop-shadow(0 0 18px ${GOLD_GLOW});
    opacity: 0;
    animation: lg-scaleIn 1s cubic-bezier(0.34,1.56,0.64,1) 0.8s forwards;
  }

  .lg-personal-greeting {
    text-align: center; color: ${GOLD_VAR};
    font-size: 11px; font-weight: 800;
    letter-spacing: 0.3em; text-transform: uppercase;
    margin-bottom: 24px;
    opacity: 0; transform: translateY(10px);
    animation: lg-fadeUp 1s ease 0.5s forwards;
  }

  .lg-title-group { text-align: center; margin-bottom: 32px; }
  .lg-title {
    font-family: system-ui,sans-serif; font-size: 34px; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.15em;
    background: linear-gradient(180deg,#fff 0%,#aaa 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin: 0; line-height: 1;
  }
  .lg-subtitle { font-size: 13px; color: #555; font-weight: 500; letter-spacing: 0.1em; margin-top: 8px; }

  .lg-input-group { position: relative; margin-bottom: 22px; }
  .lg-input-field {
    width: 100%; background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.05); border-radius: 14px;
    padding: 17px 22px; color: #fff;
    font-family: system-ui,sans-serif; font-size: 15px; font-weight: 700;
    outline: none; transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    box-shadow: inset 0 4px 10px rgba(0,0,0,0.8);
  }
  .lg-input-field:focus {
    border-color: rgba(212,175,55,0.5); background: rgba(5,5,5,0.85);
    box-shadow: inset 0 4px 10px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.12);
  }
  .lg-input-label {
    position: absolute; left: 22px; top: 17px;
    color: #555; font-size: 15px; font-weight: 500; pointer-events: none;
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
  }
  .lg-input-field:focus ~ .lg-input-label,
  .lg-input-field:valid ~ .lg-input-label {
    top: -10px; left: 16px;
    font-size: 9px; font-weight: 900; color: ${GOLD_VAR};
    background: #0c0c0c; padding: 2px 8px; border-radius: 6px;
    text-transform: uppercase; letter-spacing: 0.15em;
    box-shadow: 0 4px 6px rgba(0,0,0,0.5); border: 1px solid rgba(212,175,55,0.3);
  }

  .lg-btn-submit {
    width: 100%; border: none; border-radius: 14px;
    padding: 17px; margin-top: 8px;
    font-family: system-ui,sans-serif; font-size: 16px; font-weight: 900;
    text-transform: uppercase; letter-spacing: 0.15em; color: #000;
    cursor: pointer; position: relative; overflow: hidden;
    background: linear-gradient(90deg,${GOLD_VAR},${GOLD_LIGHT_VAR},${GOLD_VAR});
    background-size: 200% auto;
    box-shadow: 0 10px 30px rgba(212,175,55,0.3), inset 0 2px 0 rgba(255,255,255,0.8);
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    animation: lg-shine 4s linear infinite;
  }
  .lg-btn-submit:hover {
    background-position: right center;
    box-shadow: 0 15px 40px rgba(212,175,55,0.5), inset 0 2px 0 rgba(255,255,255,0.8);
    transform: scale(1.02);
  }
  .lg-btn-submit:disabled { opacity: 0.7; cursor: wait; }

  .lg-btn-bio {
    width: 100%; background: transparent; border: none;
    color: #666; font-family: system-ui,sans-serif;
    font-size: 13px; font-weight: 700; letter-spacing: 0.05em;
    margin-top: 22px; padding: 10px;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: color 0.3s;
  }
  .lg-btn-bio:hover { color: ${GOLD_VAR}; }

  /* Bio Vault */
  .lg-bio-vault {
    position: fixed; inset: 0; z-index: 100;
    background: radial-gradient(circle at 50% 50%, rgba(10,10,10,0.96) 0%, #000 100%);
    backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1);
  }
  .lg-bio-vault.active { opacity: 1; pointer-events: all; }

  .lg-bio-scan-ring {
    position: relative; width: 200px; height: 200px; margin-bottom: 36px;
    transform: scale(0.8); transition: transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .lg-bio-vault.active .lg-bio-scan-ring { transform: scale(1); }

  .lg-bio-mesh {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px dashed rgba(212,175,55,0.2);
    animation: lg-spinFwd 20s linear infinite;
  }
  .lg-bio-mesh.inner { inset: 20px; border: 1px solid rgba(255,255,255,0.1); animation: lg-spinRev 15s linear infinite; }
  .lg-bio-mesh.core { inset: 40px; border: 3px dotted rgba(212,175,55,0.4); animation: lg-spinFwd 10s linear infinite; }

  .lg-bio-fingerprint {
    position: absolute; inset: 58px;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="none" stroke="%23D4AF37" stroke-width="1" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22v-6"/><path d="M15.5 22v-3.5a3.5 3.5 0 0 0-7 0V22"/><path d="M19 22v-7a7 7 0 0 0-14 0v7"/><path d="M22.5 22v-10.5a10.5 10.5 0 0 0-21 0V22"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><path d="M12 10a2 2 0 0 1 2 2"/></svg>') center/contain no-repeat;
    opacity: 0.25; filter: drop-shadow(0 0 10px ${GOLD_VAR});
    transition: all 0.4s;
  }
  .lg-bio-laser {
    position: absolute; top: 0; left: -20px; right: -20px; height: 3px;
    background: #fff; box-shadow: 0 0 20px 5px ${GOLD_VAR};
    border-radius: 50%; opacity: 0;
  }
  .lg-bio-vault.scanning .lg-bio-laser { animation: lg-laserScan 2s ease-in-out infinite alternate; opacity: 1; }
  .lg-bio-vault.scanning .lg-bio-fingerprint { opacity: 1; }
  .lg-bio-vault.success .lg-bio-mesh { border-color: #10b981; animation-play-state: paused; }
  .lg-bio-vault.success .lg-bio-fingerprint {
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="none" stroke="%2310B981" stroke-width="1.5" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5"/></svg>') center/contain no-repeat;
    opacity: 1; filter: drop-shadow(0 0 20px %2310B981); transform: scale(1.2);
  }

  .lg-bio-text { text-align: center; }
  .lg-bio-title { font-family: system-ui,sans-serif; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 10px; transition: color 0.4s; color: #fff; }
  .lg-bio-desc { font-size: 15px; color: #666; font-weight: 500; letter-spacing: 0.05em; }
`;
