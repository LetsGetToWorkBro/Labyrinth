import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { setActiveLocation, gasCall } from "@/lib/api";
import { LOCATIONS, getSavedLocationId, type Location } from "@/lib/locations";
import { Loader2, Eye, EyeOff, ArrowRight, CheckCircle, MapPin, ChevronRight } from "lucide-react";
import logoMaze from "@assets/maze-gold-md.png";

type Screen = "location" | "login" | "request";

const GOLD = "#C8A24C";

// Rate-limit tracking for Request Access submissions (module-level, persists across re-renders)
const requestAccessAttempts: number[] = [];

const SUSPICIOUS_NAMES = ['test', 'audit', 'demo', 'fake', 'sample', 'trial user', 'test user'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Face ID / WebAuthn helpers ────────────────────────────────────

async function registerPasskey(email: string): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const userId = new TextEncoder().encode(email);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Labyrinth BJJ', id: window.location.hostname },
        user: { id: userId, name: email, displayName: email },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' as const }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform' as const,
          userVerification: 'required' as const,
        },
        timeout: 60000,
      }
    }) as PublicKeyCredential;
    const rawId = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(credential.rawId))));
    localStorage.setItem('lbjj_passkey_id', rawId);
    localStorage.setItem('lbjj_passkey_email', email);
    localStorage.setItem('lbjj_passkey_registered', 'true');
    return true;
  } catch {
    return false;
  }
}

async function authenticateWithPasskey(): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        userVerification: 'required' as const,
        timeout: 60000,
      }
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export default function LoginPage() {
  const { login } = useAuth();

  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 40); return () => clearTimeout(t); }, []);

  // Location selection — default to saved, or show picker if only Fulshear is active
  const [selectedLocationId, setSelectedLocationId] = useState(getSavedLocationId);
  const activeLocations = LOCATIONS.filter(l => l.status === "active" && l.gasUrl);
  // Show location picker first if there's more than one active location
  const [screen, setScreen] = useState<Screen>(
    activeLocations.length > 1 ? "location" : "login"
  );

  const selectedLocation = LOCATIONS.find(l => l.id === selectedLocationId) || LOCATIONS[0];

  // Login state
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loginError, setLoginError]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot]     = useState(false);
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotSent, setForgotSent]     = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Request state
  const [reqName, setReqName]   = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqNote, setReqNote]   = useState("");
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError]     = useState("");
  const [reqSent, setReqSent]       = useState(false);
  const [honeypot, setHoneypot]     = useState("");

  // Face ID / Passkey state
  const supportsPasskey = typeof window !== 'undefined' && !!window.PublicKeyCredential;
  const [hasPasskey] = useState(() => localStorage.getItem('lbjj_passkey_registered') === 'true');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setLoginError("");
    const ok = await authenticateWithPasskey();
    if (ok) {
      const savedEmail = localStorage.getItem('lbjj_passkey_email') || '';
      if (savedEmail) {
        const result = await login(savedEmail, '__passkey__');
        if (!result.success) {
          // Passkey verified but session expired — ask for password
          setEmail(savedEmail);
          setLoginError("Session expired. Please enter your password.");
        }
      }
    } else {
      setLoginError("Face ID authentication failed. Try again or use password.");
    }
    setPasskeyLoading(false);
  };

  const handlePasskeyRegister = async (memberEmail: string) => {
    setPasskeyRegistering(true);
    const ok = await registerPasskey(memberEmail);
    setPasskeyRegistering(false);
    setShowPasskeyPrompt(false);
    if (!ok) {
      // Silently ignore — Face ID is optional
    }
  };

  const selectLocation = (loc: Location) => {
    setSelectedLocationId(loc.id);
    setActiveLocation(loc.id);
    setScreen("login");
    setLoginError("");
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await gasCall('memberRequestReset', { email: forgotEmail.trim() });
    } catch (_) {}
    setForgotSent(true);
    setForgotLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setLoginError("Please enter email and password"); return; }
    // Make sure the location is set before logging in
    setActiveLocation(selectedLocationId);
    setLoginLoading(true);
    setLoginError("");
    const result = await login(email, password);
    setLoginLoading(false);
    if (!result.success) {
      setLoginError(result.error || "Invalid email or password");
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check — bots fill hidden fields, silently "succeed"
    if (honeypot) {
      setReqName(''); setReqEmail(''); setReqNote('');
      setReqSent(true);
      return;
    }

    // Input validation
    if (!reqName || reqName.trim().length < 2) { setReqError("Name must be at least 2 characters"); return; }
    if (!reqEmail || !EMAIL_REGEX.test(reqEmail.trim())) { setReqError("Please enter a valid email address"); return; }

    // Suspicious name filter — silently "succeed"
    if (SUSPICIOUS_NAMES.some(s => reqName.toLowerCase().includes(s))) {
      setReqName(''); setReqEmail(''); setReqNote('');
      setReqSent(true);
      return;
    }

    // Client-side rate limit — max 2 submissions per 5 minutes
    const now = Date.now();
    const recentAttempts = requestAccessAttempts.filter(t => now - t < 5 * 60 * 1000);
    if (recentAttempts.length >= 2) {
      setReqError("Too many requests. Please wait a few minutes before trying again.");
      return;
    }
    requestAccessAttempts.push(now);

    setReqLoading(true);
    setReqError("");
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
      justifyContent: "center", padding: "24px 20px", overflowY: "auto",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }}>
      {/* Ambient glows */}
      <div style={{ position: "fixed", top: -120, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,162,76,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,162,76,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
        <div style={{
          width: 76, height: 76, borderRadius: 20,
          background: "rgba(200,162,76,0.1)", border: "1px solid rgba(200,162,76,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14, boxShadow: "0 0 32px rgba(200,162,76,0.15)",
        }}>
          <img src={logoMaze} alt="Labyrinth BJJ" style={{ width: 50, height: 50, objectFit: "contain" }} />
        </div>
        <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "0.08em", color: "#F0F0F0", margin: 0, textTransform: "uppercase" }}>
          Labyrinth BJJ
        </h1>
        <p style={{ fontSize: 12, color: "#555", margin: "4px 0 0", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Member Portal
        </p>
        {screen === "location" && (
          <p style={{ fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 260, margin: '0 auto 24px', lineHeight: 1.5, marginTop: 10 }}>
            Track your journey, book classes, connect with your team.
          </p>
        )}
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 20, overflow: "hidden" }}>

        {/* ── Location Picker ── */}
        {screen === "location" && (
          <div style={{ padding: "20px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F0F0", margin: "0 0 4px" }}>
              Select Your Location
            </p>
            <p style={{ fontSize: 12, color: "#666", margin: "0 0 16px" }}>
              Which Labyrinth BJJ are you a member of?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LOCATIONS.map(loc => {
                const isActive = loc.status === "active" && loc.gasUrl;
                const isSelected = loc.id === selectedLocationId;
                return (
                  <button key={loc.id} onClick={() => isActive ? selectLocation(loc) : undefined}
                    disabled={!isActive}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 14,
                      border: isSelected ? `1.5px solid ${loc.color}` : "1.5px solid #1A1A1A",
                      backgroundColor: isSelected ? `${loc.color}0D` : "#0D0D0D",
                      cursor: isActive ? "pointer" : "not-allowed",
                      opacity: isActive ? 1 : 0.4,
                      transition: "all 0.15s", textAlign: "left",
                    }}
                  >
                    {/* Color dot */}
                    <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: loc.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>
                        {loc.short}
                      </p>
                      <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>
                        {loc.city}, {loc.state}
                        {!isActive && <span style={{ color: "#444" }}> · Coming soon</span>}
                      </p>
                    </div>
                    {isActive && <ChevronRight size={15} style={{ color: "#444", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sign In / Request Access ── */}
        {(screen === "login" || screen === "request") && (
          <>
            {/* Location indicator — tap to change */}
            {activeLocations.length > 1 && (
              <button
                onClick={() => setScreen("location")}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px", background: "none", border: "none", borderBottom: "1px solid #1A1A1A", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: selectedLocation.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#888", flex: 1 }}>{selectedLocation.name}</span>
                <span style={{ fontSize: 12, color: "#555" }}>Change</span>
              </button>
            )}

            {/* Mode toggle */}
            <div style={{ display: "flex", padding: "6px", gap: 4, borderBottom: "1px solid #1A1A1A" }}>
              {(["login", "request"] as Screen[]).map(s => s !== "location" && (
                <button key={s} onClick={() => { setScreen(s as Screen); setLoginError(""); setReqError(""); }}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
                    border: "none", cursor: "pointer", transition: "all 0.15s",
                    backgroundColor: screen === s ? "#1A1A1A" : "transparent",
                    color: screen === s ? GOLD : "#555",
                  }}
                >
                  {s === "login" ? "Sign In" : "Request Access"}
                </button>
              ))}
            </div>

            <div style={{ padding: "20px" }}>
              {/* ── Sign In ── */}
              {screen === "login" && !showForgot && (
                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <p style={{
                    fontSize: 13,
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: 24,
                    lineHeight: 1.5,
                    margin: '-4px 0 8px',
                  }}>
                    Track your belt journey. Stay connected with your gym.
                  </p>
                  <Field label="Email" htmlFor="login-email">
                    <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com" autoComplete="email" autoFocus
                      style={inputStyle} data-testid="input-email" />
                  </Field>
                  <Field label="Password" htmlFor="login-password">
                    <div style={{ position: "relative" }}>
                      <input id="login-password" type={showPw ? "text" : "password"} value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter password" autoComplete="current-password"
                        style={{ ...inputStyle, paddingRight: 44 }} data-testid="input-password" />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4 }}>
                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </Field>
                  <div style={{ textAlign: "right", marginTop: -6 }}>
                    <button type="button" onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); }}
                      style={{ background: "none", border: "none", color: "#777", fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                      Forgot password?
                    </button>
                  </div>
                  {loginError && <p style={{ fontSize: 12, color: "#E05555", margin: "-4px 0 0", padding: "8px 12px", background: "rgba(224,85,85,0.07)", borderRadius: 8 }}>{loginError}</p>}
                  <button type="submit" disabled={loginLoading} data-testid="button-login"
                    style={{ ...submitStyle(selectedLocation.color), opacity: loginLoading ? 0.7 : 1, marginTop: 4 }}>
                    {loginLoading
                      ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Signing in…</>
                      : <><span>Sign In</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
                  </button>
                  {/* Face ID button */}
                  {supportsPasskey && hasPasskey && (
                    <button
                      type="button"
                      onClick={handlePasskeyLogin}
                      disabled={passkeyLoading}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: 10, padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 600,
                        backgroundColor: "transparent", color: GOLD, border: `1px solid ${GOLD}44`,
                        cursor: "pointer", width: "100%", transition: "opacity 0.15s",
                        opacity: passkeyLoading ? 0.6 : 1, marginTop: 4,
                      }}
                    >
                      {passkeyLoading
                        ? <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                        : <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="8" r="5"/>
                              <path d="M3 21v-2a7 7 0 0 1 7-7h0"/>
                              <path d="M16 18l2 2 4-4"/>
                            </svg>
                            Sign in with Face ID
                          </>
                      }
                    </button>
                  )}
                </form>
              )}

              {/* ── Forgot Password ── */}
              {screen === "login" && showForgot && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {forgotSent ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "8px 0" }}>
                      <CheckCircle size={40} style={{ color: "#4CAF80" }} />
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>Check your email</h3>
                      <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
                        If an account exists for <strong style={{ color: "#F0F0F0" }}>{forgotEmail}</strong>, we sent a reset link.
                      </p>
                      <button onClick={() => { setShowForgot(false); setForgotSent(false); }}
                        style={{ ...submitStyle(selectedLocation.color), marginTop: 8 }}>
                        Back to Sign In
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px", lineHeight: 1.5 }}>
                        Enter your email and we'll send a password reset link.
                      </p>
                      <Field label="Email" htmlFor="forgot-email">
                        <input id="forgot-email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                          placeholder="your@email.com" autoFocus style={inputStyle} />
                      </Field>
                      <button onClick={handleForgotPassword} disabled={forgotLoading}
                        style={{ ...submitStyle(selectedLocation.color), opacity: forgotLoading ? 0.7 : 1 }}>
                        {forgotLoading
                          ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Sending…</>
                          : <><span>Send Reset Link</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
                      </button>
                      <div style={{ textAlign: "center" }}>
                        <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); }}
                          style={{ background: "none", border: "none", color: "#666", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                          Back to sign in
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── Request Access ── */}
              {screen === "request" && !reqSent && (
                <form onSubmit={handleRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Honeypot — hidden from humans, bots fill it */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={e => setHoneypot(e.target.value)}
                    style={{ opacity: 0, position: 'absolute', top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  <p style={{ fontSize: 13, color: "#888", margin: "0 0 4px", lineHeight: 1.5 }}>
                    Already a member at {selectedLocation.short}? Submit your info and we'll connect your account.
                  </p>
                  <Field label="Full Name" htmlFor="req-name">
                    <input id="req-name" type="text" value={reqName} onChange={e => setReqName(e.target.value)}
                      placeholder="John Smith" autoFocus style={inputStyle} />
                  </Field>
                  <Field label="Email" htmlFor="req-email">
                    <input id="req-email" type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)}
                      placeholder="your@email.com" style={inputStyle} />
                  </Field>
                  <Field label={<>Note <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></>} htmlFor="req-note">
                    <textarea id="req-note" value={reqNote} onChange={e => setReqNote(e.target.value)}
                      placeholder="e.g. I train Tuesday evenings…" rows={2}
                      style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
                  </Field>
                  {reqError && <p style={{ fontSize: 12, color: "#E05555", margin: "-4px 0 0", padding: "8px 12px", background: "rgba(224,85,85,0.07)", borderRadius: 8 }}>{reqError}</p>}
                  <button type="submit" disabled={reqLoading}
                    style={{ ...submitStyle(selectedLocation.color), opacity: reqLoading ? 0.7 : 1, marginTop: 4 }}>
                    {reqLoading
                      ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Sending…</>
                      : <><span>Send Request</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
                  </button>
                </form>
              )}

              {/* ── Request sent ── */}
              {screen === "request" && reqSent && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "8px 0" }}>
                  <CheckCircle size={40} style={{ color: "#4CAF80" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>Request sent!</h3>
                  <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
                    We'll review it and send a setup link to <strong style={{ color: "#F0F0F0" }}>{reqEmail}</strong>.
                    If your email matches a member account it will connect automatically.
                  </p>
                  <button onClick={() => { setScreen("login"); setReqSent(false); setReqName(""); setReqEmail(""); setReqNote(""); }}
                    style={{ ...submitStyle(selectedLocation.color), marginTop: 8 }}>
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Location footer */}
      <p style={{ marginTop: 20, fontSize: 12, color: "#444", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
        <MapPin size={10} style={{ color: "#555" }} />
        {screen !== "location" ? `${selectedLocation.city}, TX` : "LABYRINTH BJJ"}
      </p>

    </div>
  );
}

function Field({ label, htmlFor, children }: { label: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={htmlFor} style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
  backgroundColor: "#0D0D0D", border: "1px solid #222", color: "#F0F0F0",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const submitStyle = (color: string = GOLD): React.CSSProperties => ({
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: "13px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
  backgroundColor: color, color: "#0A0A0A", border: "none",
  cursor: "pointer", width: "100%", transition: "opacity 0.15s",
});
