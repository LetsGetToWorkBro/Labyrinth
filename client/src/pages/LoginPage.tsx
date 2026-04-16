import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { setActiveLocation, gasCall } from "@/lib/api";
import { LOCATIONS, getSavedLocationId, type Location } from "@/lib/locations";
import { Loader2, Eye, EyeOff, ArrowRight, CheckCircle, MapPin, ChevronRight, Fingerprint } from "lucide-react";
import logoMaze from "@assets/maze-gold-md.png";

type Screen = "location" | "login" | "request";

const GOLD = "#C8A24C";

// Rate-limit tracking for Request Access submissions (module-level, persists across re-renders)
const requestAccessAttempts: number[] = [];

const SUSPICIOUS_NAMES = ['test', 'demo', 'fake', 'sample', 'trial user', 'test user'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Biometric / WebAuthn helpers ──────────────────────────────────

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
          residentKey: 'preferred' as const,
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
  const { login, loginWithPasskey } = useAuth();

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

  // Remember me state
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('lbjj_remember') === 'true');

  // Login state
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loginError, setLoginError]     = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginSlow, setLoginSlow]       = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil]   = useState<number | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

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

  // Biometric / Passkey state
  const supportsPasskey = typeof window !== 'undefined' && !!window.PublicKeyCredential;
  const [hasPasskey] = useState(() => localStorage.getItem('lbjj_passkey_registered') === 'true');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(!hasPasskey);

  const [biometricLabel, setBiometricLabel] = useState('Sign in with Biometrics');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setBiometricLabel('Sign in with Face ID / Touch ID');
    else if (/Android/.test(ua)) setBiometricLabel('Sign in with Fingerprint / Face');
    else setBiometricLabel('Sign in with Biometrics');
  }, []);

  // Detect slow login (> 8s)
  useEffect(() => {
    if (!loginLoading) { setLoginSlow(false); return; }
    const t = setTimeout(() => setLoginSlow(true), 8000);
    return () => clearTimeout(t);
  }, [loginLoading]);

  // Countdown re-render while locked out
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      if (Date.now() >= lockedUntil) {
        setLockedUntil(null);
        setLoginError("");
      }
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // Pre-fill saved email on mount
  useEffect(() => {
    if (localStorage.getItem('lbjj_remember') === 'true') {
      const savedEmail = localStorage.getItem('lbjj_saved_email') || '';
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setLoginError("");
    const ok = await authenticateWithPasskey();
    if (ok) {
      const biometricBtn = document.querySelector('[data-testid="button-biometric"]') as HTMLElement;
      if (biometricBtn) {
        biometricBtn.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.03)' },
          { transform: 'scale(1)' }
        ], { duration: 120, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
      const savedEmail = localStorage.getItem('lbjj_passkey_email') || '';
      if (savedEmail) {
        const result = await loginWithPasskey(savedEmail);
        if (!result.success) {
          setEmail(savedEmail);
          setShowPasswordForm(true);
          if (result.error) {
            setLoginError(result.error);
          } else {
            setLoginError("Couldn't sign in. Please enter your password.");
          }
        }
      } else {
        setShowPasswordForm(true);
        setLoginError("No saved account found. Please sign in with your password first.");
      }
    } else {
      setLoginError("Biometric authentication failed. Try again or use password.");
    }
    setPasskeyLoading(false);
  };

  const handlePasskeyRegister = async (memberEmail: string) => {
    setPasskeyRegistering(true);
    const ok = await registerPasskey(memberEmail);
    setPasskeyRegistering(false);
    setShowPasskeyPrompt(false);
    if (!ok) {
      // Silently ignore — biometrics is optional
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

  const triggerForgotPassword = () => {
    setShowForgot(true);
    setForgotEmail(email);
    setForgotSent(false);
    setLoginError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Brute-force lockout check
    if (lockedUntil && Date.now() < lockedUntil) {
      const secsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
      setLoginError(`Too many failed attempts. Try again in ${secsLeft}s`);
      return;
    }
    if (!email && !password) { setLoginError("Please enter your email and password."); emailRef.current?.focus(); return; }
    if (!email) { setLoginError("Please enter your email address."); emailRef.current?.focus(); return; }
    if (!password) { setLoginError("Please enter your password."); return; }
    // Make sure the location is set before logging in
    setActiveLocation(selectedLocationId);
    setLoginLoading(true);
    setLoginError("");
    const result = await login(email, password);
    setLoginLoading(false);
    if (result.success) {
      // Reset throttle on success
      setLoginAttempts(0);
      setLockedUntil(null);
      // Button confirmation flash
      const btn = document.querySelector('[data-testid="button-login"]') as HTMLElement;
      if (btn) {
        btn.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.03)' },
          { transform: 'scale(1)' }
        ], { duration: 120, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      }
      // Fade out login card before transition
      const card = document.querySelector('.login-card') as HTMLElement;
      if (card) {
        card.animate([
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-8px)' }
        ], { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
        await new Promise(r => setTimeout(r, 180));
      }
      if (rememberMe) {
        localStorage.setItem('lbjj_remember', 'true');
        localStorage.setItem('lbjj_saved_email', email);
      } else {
        localStorage.removeItem('lbjj_remember');
        localStorage.removeItem('lbjj_saved_email');
      }
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 30_000);
        setLoginAttempts(0);
        setLoginError('Too many failed attempts. Please wait 30 seconds before trying again.');
      } else {
        setLoginError("__CREDENTIAL_ERROR__");
      }
      emailRef.current?.focus();
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

  const hasError = !!loginError;

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "#0A0A0A",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start",
      padding: "24px 20px", paddingTop: "max(60px, env(safe-area-inset-top, 60px))", overflowY: "auto",
      opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)",
      transition: "opacity 0.35s ease, transform 0.35s ease",
    }}>
      {/* Ambient glows */}
      <div style={{ position: "fixed", top: -120, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,162,76,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,162,76,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo + brand ABOVE the card */}
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
      <div className="login-card" style={{ width: "100%", maxWidth: 380, backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 20, overflow: "hidden" }}>

        {/* ── Location Picker ── */}
        {screen === "location" && (
          <div style={{ padding: "20px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F0F0", margin: "0 0 4px" }}>
              Select Your Location
            </p>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>
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
                      <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>
                        {loc.city}, {loc.state}
                        {!isActive && <span style={{ color: "#666" }}> · Coming soon</span>}
                      </p>
                    </div>
                    {isActive && <ChevronRight size={15} style={{ color: "#444", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sign In (no tabs — clean card) ── */}
        {screen === "login" && (
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

            <div style={{ padding: "20px" }}>
              {/* ── Sign In form ── */}
              {!showForgot && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Biometric button — shown prominently ABOVE email for returning passkey users */}
                  {supportsPasskey && hasPasskey && !showPasswordForm && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <button
                        type="button"
                        onClick={handlePasskeyLogin}
                        disabled={passkeyLoading}
                        data-testid="button-biometric"
                        style={{ ...submitStyle(selectedLocation.color), opacity: passkeyLoading ? 0.7 : 1, gap: 10 }}
                      >
                        {passkeyLoading
                          ? <><Loader2 size={18} className="animate-spin" /> Verifying…</>
                          : <><Fingerprint size={22} /> {biometricLabel}</>
                        }
                      </button>

                      {/* Divider */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                        <div style={{ flex: 1, height: 1, backgroundColor: "#222" }} />
                        <span style={{ fontSize: 12, color: "#555", whiteSpace: "nowrap" }}>or sign in with password</span>
                        <div style={{ flex: 1, height: 1, backgroundColor: "#222" }} />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(true)}
                        style={{
                          background: "none", border: "none", color: "#888", fontSize: 13,
                          cursor: "pointer", padding: "4px 0", textDecoration: "underline",
                          textAlign: "center",
                        }}
                      >
                        Use email & password instead
                      </button>
                    </div>
                  )}

                  {/* Password form — shown by default when no passkey, or when user clicks through */}
                  {(showPasswordForm || !hasPasskey || !supportsPasskey) && (
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <Field label="Email" htmlFor="login-email">
                        <input id="login-email" ref={emailRef} type="email" name="email" value={email}
                          onChange={e => { setEmail(e.target.value); if (loginError) setLoginError(""); }}
                          placeholder="your@email.com" autoComplete="email" autoFocus
                          autoCapitalize="none" autoCorrect="off" inputMode="email" spellCheck={false}
                          enterKeyHint="next" readOnly={loginLoading}
                          aria-invalid={hasError || undefined}
                          aria-describedby={loginError ? 'login-error' : undefined}
                          style={{ ...inputStyle, ...(hasError ? { borderColor: 'rgba(224,85,85,0.5)' } : {}) }}
                          data-testid="input-email" />
                      </Field>
                      <Field label="Password" htmlFor="login-password">
                        <div style={{ position: "relative" }}>
                          <input id="login-password" type="password" name="password" value={password}
                            onChange={e => { setPassword(e.target.value); if (loginError) setLoginError(""); }}
                            placeholder="Your password" autoComplete="current-password"
                            enterKeyHint="go" readOnly={loginLoading}
                            aria-invalid={hasError || undefined}
                            aria-describedby={loginError ? 'login-error' : undefined}
                            style={{ ...inputStyle, paddingRight: 44, WebkitTextSecurity: showPw ? 'none' : undefined, ...(hasError ? { borderColor: 'rgba(224,85,85,0.5)' } : {}) } as React.CSSProperties}
                            data-testid="input-password" />
                          <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}
                            style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </Field>

                      {/* Forgot password — directly below password field, left-aligned */}
                      <button type="button" onClick={triggerForgotPassword}
                        style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", padding: '10px 0', textDecoration: "underline", textAlign: 'left', minHeight: 44, marginTop: -8 }}>
                        Forgot password?
                      </button>

                      {/* Remember Me — custom toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <label htmlFor="remember-me" style={{ fontSize: 13, color: '#888', cursor: 'pointer', userSelect: 'none' }}>
                          Remember me
                        </label>
                        <button
                          id="remember-me"
                          type="button"
                          role="checkbox"
                          aria-checked={rememberMe}
                          onClick={() => setRememberMe(v => !v)}
                          style={{
                            width: 40, height: 22, borderRadius: 11, border: 'none',
                            background: rememberMe ? '#C8A24C' : '#2A2A2A',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.2s ease', flexShrink: 0,
                            padding: 0,
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: '#FFF', position: 'absolute',
                            top: 3, left: rememberMe ? 21 : 3,
                            transition: 'left 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}/>
                        </button>
                      </div>

                      {/* Lockout countdown */}
                      {lockedUntil && Date.now() < lockedUntil && (
                        <p role="alert" aria-live="polite" style={{ color: '#E05555', fontSize: 12, textAlign: 'center', margin: 0 }}>
                          Too many attempts — try again in {Math.ceil((lockedUntil - Date.now()) / 1000)}s
                        </p>
                      )}

                      {/* Sign In button — gold, full width, 48px+ */}
                      <button type="submit" disabled={loginLoading || (lockedUntil !== null && Date.now() < lockedUntil)} data-testid="button-login"
                        style={{ ...submitStyle(selectedLocation.color), opacity: (loginLoading || (lockedUntil !== null && Date.now() < lockedUntil)) ? 0.7 : 1, marginTop: 4 }}>
                        {loginLoading
                          ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Signing in…</>
                          : <><span>Sign In</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
                      </button>

                      {loginLoading && loginSlow && (
                        <p style={{ fontSize: 11, color: '#888', textAlign: 'center', margin: '8px 0 0' }}>
                          This is taking longer than usual. Still trying…
                        </p>
                      )}

                      {/* Error banner — below Sign In button */}
                      {loginError && (
                        <div id="login-error" role="alert" aria-live="polite" data-testid="login-error"
                          style={{ fontSize: 12, color: "#E05555", margin: 0, padding: "10px 12px", background: "rgba(224,85,85,0.07)", borderRadius: 8, lineHeight: 1.5 }}>
                          {loginError === '__CREDENTIAL_ERROR__' ? (
                            <>Incorrect email or password. Try again or{' '}
                              <button type="button" onClick={triggerForgotPassword}
                                style={{ background: 'none', border: 'none', color: '#E05555', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0, fontFamily: 'inherit' }}>
                                reset your password
                              </button>.
                            </>
                          ) : loginError}
                        </div>
                      )}
                    </form>
                  )}

                  {/* Trust signals: location + privacy at bottom of card */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 8, paddingTop: 12, borderTop: "1px solid #1A1A1A" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} style={{ color: "#555" }} />
                      <span style={{ fontSize: 11, color: "#666", letterSpacing: "0.06em" }}>{selectedLocation.city}, TX</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#666', textAlign: 'center', margin: 0 }}>
                      <a href="https://app.labyrinth.vision/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>Privacy Policy</a>
                      {' · '}
                      <a href="https://app.labyrinth.vision/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#555', textDecoration: 'underline' }}>Terms of Service</a>
                    </p>
                  </div>
                </div>
              )}

              {/* ── Forgot Password (replaces card content) ── */}
              {showForgot && (
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
                      <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }}>
                        <Field label="Email" htmlFor="forgot-email">
                          <input id="forgot-email" type="email" name="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                            placeholder="your@email.com" autoFocus autoCapitalize="none" autoCorrect="off" inputMode="email" spellCheck={false} enterKeyHint="send" style={inputStyle} />
                        </Field>
                        <button type="submit" disabled={forgotLoading}
                          style={{ ...submitStyle(selectedLocation.color), opacity: forgotLoading ? 0.7 : 1, marginTop: 14 }}>
                          {forgotLoading
                            ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Sending…</>
                            : <><span>Send Reset Link</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
                        </button>
                      </form>
                      <div style={{ textAlign: "center" }}>
                        <button type="button" onClick={() => { setShowForgot(false); setForgotSent(false); }}
                          style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", textDecoration: "underline", minHeight: 44, display: 'flex', alignItems: 'center' }}>
                          Back to sign in
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Request Access (shown in card when "New here?" is clicked) ── */}
        {screen === "request" && (
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

            <div style={{ padding: "20px" }}>
              {!reqSent && (
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
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>Request Access</h2>
                  <p style={{ fontSize: 13, color: "#888", margin: "-4px 0 4px", lineHeight: 1.5 }}>
                    Train with us at {selectedLocation.short}? Request portal access and we'll get you set up.
                  </p>
                  <Field label="Full Name" htmlFor="req-name">
                    <input id="req-name" type="text" name="name" value={reqName} onChange={e => setReqName(e.target.value)}
                      placeholder="John Smith" autoFocus enterKeyHint="next"
                      autoCapitalize="words" autoComplete="name" style={inputStyle} />
                  </Field>
                  <Field label="Email" htmlFor="req-email">
                    <input id="req-email" type="email" name="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)}
                      placeholder="your@email.com" enterKeyHint="next"
                      autoCapitalize="none" autoCorrect="off" inputMode="email" spellCheck={false} style={inputStyle} />
                  </Field>
                  <Field label={<>Note <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></>} htmlFor="req-note">
                    <textarea id="req-note" value={reqNote} onChange={e => setReqNote(e.target.value)}
                      placeholder="e.g. I train Tuesday evenings…" rows={2} enterKeyHint="send"
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5, minHeight: 44 }} />
                  </Field>
                  {reqError && (
                    <p role="alert" aria-live="polite" style={{ fontSize: 12, color: "#E05555", margin: "-4px 0 0", padding: "8px 12px", background: "rgba(224,85,85,0.07)", borderRadius: 8 }}>{reqError}</p>
                  )}
                  <button type="submit" disabled={reqLoading}
                    style={{ ...submitStyle(selectedLocation.color), opacity: reqLoading ? 0.7 : 1, marginTop: 4 }}>
                    {reqLoading
                      ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: 8 }} /> Sending…</>
                      : <><span>Send Request</span><ArrowRight size={16} style={{ marginLeft: 8 }} /></>}
                  </button>
                  <div style={{ textAlign: "center" }}>
                    <button type="button" onClick={() => { setScreen("login"); setReqError(""); }}
                      style={{ background: "none", border: "none", color: "#888", fontSize: 12, cursor: "pointer", textDecoration: "underline", minHeight: 44, display: 'flex', alignItems: 'center' }}>
                      Back to sign in
                    </button>
                  </div>
                </form>
              )}

              {/* ── Request sent ── */}
              {reqSent && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "8px 0" }}>
                  <CheckCircle size={40} style={{ color: "#4CAF80" }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>Request sent!</h3>
                  <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
                    We'll review your request within 1–2 business days and send a setup link to{" "}
                    <strong style={{ color: "#F0F0F0" }}>{reqEmail}</strong>.
                    {" "}If your email matches a member account it will connect automatically.
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

      {/* "New here? Request portal access →" link BELOW the card */}
      {screen === "login" && !showForgot && (
        <button
          type="button"
          onClick={() => { setScreen("request"); setLoginError(""); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            marginTop: 20, padding: "10px 16px", minHeight: 44,
            fontSize: 13, color: "#888", fontFamily: "inherit",
          }}
        >
          New here? <span style={{ color: "#888", textDecoration: "underline" }}>Request portal access</span> <span style={{ color: "#888" }}>&rarr;</span>
        </button>
      )}

      {/* Location footer — shown on location picker and request screens */}
      {screen === "location" && (
        <p style={{ marginTop: 20, fontSize: 12, color: "#666", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={10} style={{ color: "#555" }} />
          LABYRINTH BJJ
        </p>
      )}
      {screen === "request" && (
        <p style={{ marginTop: 20, fontSize: 12, color: "#666", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={10} style={{ color: "#555" }} />
          {selectedLocation.city}, TX
        </p>
      )}

    </div>
  );
}

function Field({ label, htmlFor, children }: { label: React.ReactNode; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={htmlFor} style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888" }}>{label}</label>
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
  minHeight: 48,
});
