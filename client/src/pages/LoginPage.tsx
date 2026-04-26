/**
 * LoginPage — "The Gateway"
 * Full rewrite: proper logo, biometrics always shown, password reveal,
 * no auto-capitalize, location styled as glass cards, gateway-quality
 * request access, biometric agreement modal in same style as bio vault.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { setActiveLocation, gasCall, memberCompleteSetup } from "@/lib/api";
import { LOCATIONS, getSavedLocationId, type Location } from "@/lib/locations";
import logoGold from "@assets/labyrinth-logo-gold.png";
import { NativeBiometric } from "capacitor-native-biometric";

// ─── Constants ─────────────────────────────────────────────────────
const GOLD      = "#D4AF37";
const GOLD_L    = "#FFDF73";
const GOLD_GLOW = "rgba(212,175,55,0.4)";

const BOOT_LINES = [
  "[SYSTEM] ESTABLISHING UPLINK...",
  "[DATA] RETRIEVING ARTIFACT PROGRESS...",
  "[CALC] PARAGON MATRIX ALIGNED...",
  "[AUTH] THE LABYRINTH IS OPEN.",
];

const SUSPICIOUS_NAMES = ["test","demo","fake","sample","trial user","test user"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestAccessAttempts: number[] = [];

// ─── Biometric trigger ──────────────────────────────────────────────
async function registerWebAuthnPasskey(email: string): Promise<boolean> {
  if (!navigator.credentials || !window.PublicKeyCredential) {
    return false;
  }
  try {
    const { gasCall } = await import('@/lib/api');
    const challengeRes = await gasCall('getWebAuthnChallenge', { email });
    if (!challengeRes?.success || !challengeRes?.challenge) return false;

    const challengeBytes = Uint8Array.from(atob(challengeRes.challenge), c => c.charCodeAt(0));

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challengeBytes,
        rp: { name: 'Labyrinth BJJ', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
    localStorage.setItem('lbjj_passkey_credential_id', credId);
    localStorage.setItem('lbjj_passkey_registered', 'true');
    localStorage.setItem('lbjj_passkey_email', email);

    const response = credential.response as AuthenticatorAttestationResponse;
    let pubKeyB64 = '';
    try {
      const pubKeyBuf = response.getPublicKey?.();
      if (pubKeyBuf) pubKeyB64 = btoa(String.fromCharCode(...new Uint8Array(pubKeyBuf)));
    } catch {}

    await gasCall('registerPasskey', {
      email,
      credentialId: credId,
      challenge: challengeRes.challenge,
      publicKey: pubKeyB64,
    });

    return true;
  } catch (err: any) {
    const msg = (err?.message || err?.name || '').toString().toLowerCase();
    if (msg.includes('cancel') || msg.includes('abort') || msg.includes('not allowed')) return false;
    console.error('[WebAuthn register]', err);
    return false;
  }
}

async function triggerBiometricPrompt(): Promise<"native"|"webauthn"|"failed"> {
  const isNative = typeof (window as any).Capacitor !== "undefined"
    && (window as any).Capacitor?.isNativePlatform?.();

  if (isNative) {
    try {
      const { isAvailable } = await NativeBiometric.isAvailable({ useFallback: true });
      if (isAvailable) {
        await NativeBiometric.verifyIdentity({
          reason: "Sign in to Labyrinth BJJ",
          title: "Biometric Sign In",
          useFallback: true,
        });
        return "native";
      }
    } catch (e: any) {
      const msg = (e?.message || e?.code || "").toString().toLowerCase();
      if (msg.includes("cancel")||msg.includes("dismiss")||msg.includes("user_cancel")
        ||msg.includes("authentication_failed")||msg.includes("lockout")) return "failed";
    }
  }

  // WebAuthn
  try {
    const saved = localStorage.getItem("lbjj_passkey_credential_id")
                || localStorage.getItem("lbjj_passkey_id");
    if (!saved) return "failed";

    // Get server-issued challenge
    const { gasCall: _gasCall } = await import('@/lib/api');
    const emailForChallenge = localStorage.getItem('lbjj_passkey_email') || '';
    const challengeRes = await _gasCall('getWebAuthnChallenge', { email: emailForChallenge });
    if (!challengeRes?.success || !challengeRes?.challenge) return "failed";

    const challengeBytes = Uint8Array.from(atob(challengeRes.challenge), c => c.charCodeAt(0));
    const credBytes = Uint8Array.from(atob(saved), c => c.charCodeAt(0));

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challengeBytes,
        allowCredentials: [{ id: credBytes, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return "failed";

    // Store challenge and credential ID for verifyPasskey call in openBioVault
    localStorage.setItem('lbjj_pending_challenge', challengeRes.challenge);
    localStorage.setItem('lbjj_pending_credid', saved);
    return "webauthn";
  } catch { return "failed"; }
}

// ─── Password strength ─────────────────────────────────────────────
function calcPwStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 12) score++;
  if (pw.length >= 16) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

// ─── Greeting ──────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning. Prepare to Train.";
  if (h < 18) return "Good Afternoon. The Mats Await.";
  return "Good Evening. Forge Your Legacy.";
}

// ─── Main component ─────────────────────────────────────────────────
type Screen = "gateway" | "request" | "setup";

export default function LoginPage() {
  const { login, loginWithPasskey } = useAuth();

  // Screen
  const [screen, setScreen] = useState<Screen>("gateway");

  // Form
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Location
  const [location, setLocation] = useState<Location | null>(() => {
    const id = getSavedLocationId();
    return LOCATIONS.find(l => l.id === id) || null;
  });
  const [showLocModal, setShowLocModal] = useState(false);

  // Bio vault
  const [bioOpen,  setBioOpen]  = useState(false);
  const [bioPhase, setBioPhase] = useState<"idle"|"scanning"|"success"|"fail">("idle");
  const [bioTitle, setBioTitle] = useState("Biometric Uplink");
  const [bioDesc,  setBioDesc]  = useState("Awaiting physiological signature.");

  // Bio agreement modal
  const [showBioAgreement, setShowBioAgreement] = useState(false);

  // Boot sequence
  const [bootActive,    setBootActive]    = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalDone,  setTerminalDone]  = useState(false);
  const [flashActive,   setFlashActive]   = useState(false);

  // Request access
  const [reqName,      setReqName]      = useState("");
  const [reqEmail,     setReqEmail]     = useState("");
  const [reqPhone,     setReqPhone]     = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);
  const [reqError,     setReqError]     = useState("");
  const [reqLoading,   setReqLoading]   = useState(false);

  // Setup account (new-member password flow, triggered by #setup?token=...&email=...)
  const [setupToken,    setSetupToken]    = useState("");
  const [setupEmail,    setSetupEmail]    = useState("");
  const [setupPw,       setSetupPw]       = useState("");
  const [setupPw2,      setSetupPw2]      = useState("");
  const [setupShowPw,   setSetupShowPw]   = useState(false);
  const [setupError,    setSetupError]    = useState("");
  const [setupLoading,  setSetupLoading]  = useState(false);
  const [pwStrength,    setPwStrength]    = useState(0); // 0-4

  // Forgot password / cold-start UX state
  const [forgotSent,    setForgotSent]    = useState(false);
  const [slowWarning,   setSlowWarning]   = useState(false);

  // Disable 3D parallax while an input is focused (keyboard would tilt the card)
  const [inputFocused,  setInputFocused]  = useState(false);

  // Parse #setup?token=...&email=... (or ?token=...&email=...) on mount.
  // If present, switch to the setup screen pre-filled. Strip the params from
  // the URL after capture so a refresh doesn't re-trigger.
  useEffect(() => {
    try {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      let token = "";
      let emailFromUrl = "";

      // Hash form: "#setup?token=...&email=..." or "#/setup?token=..."
      const hashMatch = hash.match(/#\/?setup\?(.+)$/i);
      if (hashMatch) {
        const hp = new URLSearchParams(hashMatch[1]);
        token = hp.get("token") || "";
        emailFromUrl = hp.get("email") || "";
      } else if (search) {
        // Query-string form: "?token=...&email=..."
        const sp = new URLSearchParams(search);
        token = sp.get("token") || "";
        emailFromUrl = sp.get("email") || "";
      }

      if (token) {
        setSetupToken(token);
        setSetupEmail(decodeURIComponent(emailFromUrl));
        setScreen("setup");
        // Clean the URL so the token isn't persisted in history / bookmarks.
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, "", cleanUrl);
        } catch {}
      }
    } catch {}
  }, []);

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError("");
    const MIN_PW = 12;
    const BLOCKED_PASSWORDS = ['password123','12345678901','labyrinthbjj','qwerty12345','iloveyou123'];
    if (!setupPw || setupPw.length < MIN_PW) {
      setSetupError(`Password must be at least ${MIN_PW} characters.`);
      return;
    }
    if (BLOCKED_PASSWORDS.includes(setupPw.toLowerCase())) {
      setSetupError('This password is too common. Please choose a stronger one.');
      return;
    }
    if (setupPw !== setupPw2) {
      setSetupError("Passwords do not match.");
      return;
    }
    if (!setupToken || !setupEmail) {
      setSetupError("Setup link is invalid or expired. Request a new one.");
      return;
    }
    setSetupLoading(true);
    try {
      const res: any = await memberCompleteSetup(setupToken, setupEmail.trim(), setupPw);
      if (!res || res.success === false) {
        setSetupError(res?.error || "Could not complete setup. The link may be expired.");
        setSetupLoading(false);
        return;
      }
      // Auto-login with the password we just set.
      if (!location) {
        // Location may not be picked yet on a fresh device. Fall back to first known location.
        const first = LOCATIONS[0];
        if (first) {
          setLocation(first);
          setActiveLocation(first.id);
        }
      } else {
        setActiveLocation(location.id);
      }
      const loginRes = await login(setupEmail.trim(), setupPw);
      setSetupLoading(false);
      if (loginRes.success) {
        setScreen("gateway");
        // HomePage will render the boot overlay on mount via the sessionStorage flag.
      } else {
        // Setup succeeded but auto-login failed — prefill email and send to gateway.
        setEmail(setupEmail.trim());
        setScreen("gateway");
        setError("Account set up. Please sign in.");
      }
    } catch {
      setSetupError("Connection failed. Try again.");
      setSetupLoading(false);
    }
  };

  // 3-D parallax card
  const wrapRef = useRef<HTMLDivElement>(null);
  const mxRef   = useRef(0); const myRef = useRef(0);
  const cxRef   = useRef(0); const cyRef = useRef(0);
  const rafRef  = useRef<number>();

  useEffect(() => {
    if (screen !== 'gateway') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onMove = (e: MouseEvent) => {
      mxRef.current = (window.innerWidth  / 2 - e.pageX) / 40;
      myRef.current = (window.innerHeight / 2 - e.pageY) / 40;
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      mxRef.current = (window.innerWidth / 2 - touch.pageX) / 40;
      myRef.current = (window.innerHeight / 2 - touch.pageY) / 40;
    };
    const tick = () => {
      cxRef.current += (mxRef.current - cxRef.current) * 0.1;
      cyRef.current += (myRef.current - cyRef.current) * 0.1;
      if (wrapRef.current)
        wrapRef.current.style.transform = `rotateY(${cxRef.current}deg) rotateX(${cyRef.current}deg)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    if (!prefersReduced) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener('touchmove', onTouchMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screen]);

  // Escape key closes modals
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLocModal(false);
        setBioOpen(false);
        setShowBioAgreement(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Cold-start feedback — show after 8s of loading
  useEffect(() => {
    if (!loading) { setSlowWarning(false); return; }
    const t = setTimeout(() => setSlowWarning(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  // Boot typewriter
  const runBoot = useCallback((onDone: () => void) => {
    setBootActive(true);
    setTerminalLines([]);
    setTerminalDone(false);
    let li = 0, ci = 0;
    let built: string[] = [];
    const tick = () => {
      if (li >= BOOT_LINES.length) {
        setTerminalDone(true);
        setTimeout(() => { setFlashActive(true); setTimeout(onDone, 600); }, 500);
        return;
      }
      if (ci === 0) built = [...built, ""];
      const updated = [...built];
      updated[li] = BOOT_LINES[li].slice(0, ci + 1);
      setTerminalLines(updated); built = updated;
      ci++;
      if (ci >= BOOT_LINES[li].length) { li++; ci = 0; setTimeout(tick, 500); }
      else setTimeout(tick, Math.random() * 28 + 14);
    };
    setTimeout(tick, 1200);
  }, []);

  // Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Enter your email and password."); return; }
    if (!location) { setShowLocModal(true); return; }
    setLoading(true);
    try {
      setActiveLocation(location.id);
      const res: any = await login(email.trim(), password);
      if (!res.success) {
        const ERROR_MESSAGES: Record<string, string> = {
          WRONG_PASSWORD: 'Incorrect password. Try again.',
          EMAIL_NOT_FOUND: 'No account found with that email.',
          SUSPENDED: 'Your membership is currently inactive. Contact the gym.',
          TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait 15 minutes.',
          INVALID_TOKEN: 'Session expired. Please sign in again.',
        };
        const errMsg = (res.code && ERROR_MESSAGES[res.code])
          || res.error
          || 'Unable to sign in. Please try again.';
        setError(errMsg); setLoading(false); return;
      }
      // Play boot sequence first login only, then auth context routes to HomePage.
      const bootShown = localStorage.getItem('lbjj_boot_shown');
      if (!bootShown) {
        runBoot(() => {});
      } else {
        setLoading(false);
      }
    } catch {
      setError("Connection failed. Try again."); setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then tap Forgot Password.');
      return;
    }
    setLoading(true);
    try {
      const res: any = await gasCall('memberRequestPasswordReset', { email: email.trim() });
      if (res?.success) {
        setError(''); // clear errors
        setForgotSent(true);
        // Show success message inline
        setError('Password reset link sent to ' + email + '. Check your email.');
      } else {
        setError(res?.error || 'Could not send reset email. Contact the gym.');
      }
    } catch {
      setError('Could not send reset email. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Bio vault open
  const openBioVault = async () => {
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
      setTimeout(() => { setBioOpen(false); setBioPhase("idle"); }, 2200);
      return;
    }
    if (result === "webauthn") {
      // Verify with GAS using the server-issued challenge
      try {
        const pendingChallenge = localStorage.getItem('lbjj_pending_challenge');
        const pendingCredId = localStorage.getItem('lbjj_pending_credid');
        const emailForVerify = (email || localStorage.getItem('lbjj_passkey_email') || '').trim();

        if (pendingChallenge && pendingCredId && emailForVerify) {
          const { gasCall: _gc } = await import('@/lib/api');
          const verifyRes = await _gc('verifyPasskey', {
            email: emailForVerify,
            credentialId: pendingCredId,
            challenge: pendingChallenge,
          });

          localStorage.removeItem('lbjj_pending_challenge');
          localStorage.removeItem('lbjj_pending_credid');

          if (verifyRes?.success && verifyRes?.token) {
            localStorage.setItem('lbjj_session_token', verifyRes.token);
            localStorage.setItem('lbjj_token_created', Date.now().toString());
          }
        }
      } catch {}
    }
    setBioPhase("success");
    setBioTitle("Signature Verified");
    setBioDesc("Access Granted.");
    await new Promise(r => setTimeout(r, 1800));
    setBioOpen(false); setBioPhase("idle");
    try {
      const passkeyEmail = (email || localStorage.getItem('lbjj_passkey_email') || '').trim();
      if (!passkeyEmail) {
        setError("Enter your email to use biometric sign-in.");
        return;
      }
      const res = await loginWithPasskey(passkeyEmail);
      if (res.success) {
        const bootShown = localStorage.getItem('lbjj_boot_shown');
        if (!bootShown) {
          runBoot(() => {});
        }
      } else setError("Biometric login failed — sign in with email.");
    } catch { setError("Biometric login failed — sign in with email."); }
  };

  // Request access
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError("");
    const now = Date.now();
    requestAccessAttempts.push(now);
    if (requestAccessAttempts.filter(t => now - t < 60000).length > 3) {
      setReqError("Too many requests. Wait a minute."); return;
    }
    if (!reqName.trim() || !reqEmail.trim()) { setReqError("Name and email are required."); return; }
    if (SUSPICIOUS_NAMES.some(n => new RegExp(`\\b${n}\\b`, 'i').test(reqName))) {
      setReqError("Please enter your real name."); return;
    }
    if (!EMAIL_REGEX.test(reqEmail.trim())) { setReqError("Enter a valid email address."); return; }
    setReqLoading(true);
    try {
      await gasCall("memberRequestAccess", { name: reqName.trim(), email: reqEmail.trim(), phone: reqPhone.trim() });
      setReqSubmitted(true);
    } catch { setReqError("Submission failed. Try again."); }
    setReqLoading(false);
  };

  const hasBio = !!(
    localStorage.getItem("lbjj_passkey_registered") ||
    localStorage.getItem("lbjj_passkey_id") ||
    localStorage.getItem("lbjj_passkey_credential_id")
  );

  // ── BOOT SCREEN ───────────────────────────────────────────────────
  if (bootActive) return (
    <>
      <style>{KF}</style>
      <div style={{ position:"fixed",inset:0,background:"#000",zIndex:200,
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
        <img src={logoGold} alt="Labyrinth"
          style={{ width:150,height:150,marginBottom:48,objectFit:"contain",
            filter:`drop-shadow(0 0 40px ${GOLD_GLOW})`,
            animation:"lg-scaleIn 1.5s cubic-bezier(0.16,1,0.3,1) both" }} />
        <div style={{ width:340,fontFamily:"'Courier New',monospace",fontSize:13,
          fontWeight:700,color:GOLD,lineHeight:1.9,textShadow:`0 0 8px ${GOLD_GLOW}`,textAlign:"left" }}>
          {terminalLines.map((line, i) => (
            <div key={i}>{line}
              {i === terminalLines.length-1 && !terminalDone &&
                <span style={{ display:"inline-block",width:8,height:13,background:GOLD,
                  verticalAlign:"middle",marginLeft:4,animation:"lg-blink 1s step-end infinite" }} />}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position:"fixed",inset:0,background:"#fff",zIndex:1000,
        opacity:flashActive?1:0,pointerEvents:"none",
        transition:"opacity 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
    </>
  );

  // ── SETUP ACCOUNT SCREEN (new-member password setup from emailed link) ──
  if (screen === "setup") return (
    <>
      <GatewayBG />
      <style>{KF + STYLES}</style>
      <div className="lg-wrap">
        <div className="lg-card">
          <div className="lg-greeting">Welcome to the Labyrinth</div>
          <img src={logoGold} alt="Labyrinth" className="lg-logo" />
          <div className="lg-title-grp">
            <h1 className="lg-title">Set Up Your Account</h1>
            <div className="lg-sub">Create a password to activate your membership</div>
          </div>

          <form onSubmit={handleCompleteSetup}>
            {setupError && <ErrorBox msg={setupError} />}

            <div style={{
              marginBottom: 18,
              padding: "10px 14px",
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 10,
              fontSize: 12,
              color: "#D4AF37",
              fontWeight: 700,
              letterSpacing: "0.02em",
              wordBreak: "break-all",
            }}>
              {setupEmail}
            </div>

            <div style={{ position: "relative", marginBottom: 22 }}>
              <input
                type={setupShowPw ? "text" : "password"}
                name="password"
                required
                value={setupPw}
                onChange={e => { const v = e.target.value; setSetupPw(v); setPwStrength(calcPwStrength(v)); }}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="new-password"
                enterKeyHint="next"
                className="lg-input"
              />
              <label className="lg-label"
                style={setupPw ? {
                  top: -10, left: 16, fontSize: "9px", fontWeight: 900, color: GOLD,
                  background: "#0c0c0c", padding: "2px 8px", borderRadius: 6,
                  textTransform: "uppercase", letterSpacing: "0.15em",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(212,175,55,0.3)",
                } : {}}>
                New Password
              </label>
              <button
                type="button"
                aria-label={setupShowPw ? "Hide password" : "Show password"}
                onClick={() => setSetupShowPw(v => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#888", cursor: "pointer",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                }}
              >
                {setupShowPw ? "HIDE" : "SHOW"}
              </button>
            </div>

            {setupPw && (
              <div style={{ marginTop: -12, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= pwStrength
                        ? pwStrength <= 1 ? '#ef4444' : pwStrength <= 2 ? '#f59e0b' : pwStrength <= 3 ? '#3b82f6' : '#22c55e'
                        : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 10, color: pwStrength <= 1 ? '#ef4444' : pwStrength <= 2 ? '#f59e0b' : pwStrength <= 3 ? '#3b82f6' : '#22c55e' }}>
                  {['','Weak','Fair','Strong','Very Strong'][pwStrength]}
                </div>
              </div>
            )}

            <div style={{ position: "relative", marginBottom: 22 }}>
              <input
                type={setupShowPw ? "text" : "password"}
                name="password-confirm"
                required
                value={setupPw2}
                onChange={e => setSetupPw2(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="new-password"
                enterKeyHint="done"
                className="lg-input"
              />
              <label className="lg-label"
                style={setupPw2 ? {
                  top: -10, left: 16, fontSize: "9px", fontWeight: 900, color: GOLD,
                  background: "#0c0c0c", padding: "2px 8px", borderRadius: 6,
                  textTransform: "uppercase", letterSpacing: "0.15em",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(212,175,55,0.3)",
                } : {}}>
                Confirm Password
              </label>
            </div>

            <button type="submit" disabled={setupLoading} className="lg-btn-gold">
              {setupLoading ? "Setting Up..." : "Create Account"}
            </button>

            <button type="button" onClick={() => setScreen("gateway")}
              style={{
                display: "block", width: "100%", background: "none", border: "none",
                color: "#555", fontSize: 13, fontWeight: 600, cursor: "pointer",
                marginTop: 14, padding: "8px",
              }}>
              ← Back to Login
            </button>
          </form>
        </div>
      </div>
    </>
  );

  // ── REQUEST ACCESS SCREEN ─────────────────────────────────────────
  if (screen === "request") return (
    <>
      <GatewayBG />
      <style>{KF + STYLES}</style>
      <div className="lg-wrap">
        <div className="lg-card">
          <div className="lg-greeting">New to the Labyrinth</div>
          <img src={logoGold} alt="Labyrinth" className="lg-logo" />
          <div className="lg-title-grp">
            <h1 className="lg-title">Request Access</h1>
            <div className="lg-sub">We'll reach out to get you started</div>
          </div>

          {reqSubmitted ? (
            <div style={{ textAlign:"center",padding:"16px 0" }}>
              <div style={{ fontSize:44,marginBottom:14 }}>✅</div>
              <div style={{ fontSize:16,fontWeight:800,color:"#10b981" }}>Request Sent!</div>
              <div style={{ fontSize:13,color:"#555",marginTop:8,lineHeight:1.6 }}>
                We'll be in touch within 24 hours.
              </div>
              <button onClick={() => setScreen("gateway")} className="lg-btn-gold" style={{ marginTop:24 }}>
                ← Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess}>
              {reqError && <ErrorBox msg={reqError} />}
              <FloatInput label="Full Name"       name="name" autoComplete="name" value={reqName}  onChange={setReqName}
                type="text"  autoCapitalize="words" autoCorrect="off" spellCheck={false} />
              <FloatInput label="Email Address"   name="email" autoComplete="email" value={reqEmail} onChange={setReqEmail}
                type="email" autoCapitalize="none"  autoCorrect="off" />
              <FloatInput label="Phone (optional)" name="phone" autoComplete="tel" value={reqPhone} onChange={setReqPhone}
                type="tel" />
              <button type="submit" disabled={reqLoading} className="lg-btn-gold">
                {reqLoading ? "Sending..." : "Submit Request"}
              </button>
              <button type="button" onClick={() => setScreen("gateway")}
                style={{ display:"block",width:"100%",background:"none",border:"none",
                  color:"#555",fontSize:13,fontWeight:600,cursor:"pointer",
                  marginTop:14,padding:"8px" }}>
                ← Back to Login
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );

  // ── MAIN GATEWAY ──────────────────────────────────────────────────
  return (
    <>
      <GatewayBG />
      <style>{KF + STYLES}</style>

      {/* ── Location modal ── */}
      {showLocModal && (
        <div style={{ position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",
          justifyContent:"center",background:"rgba(0,0,0,0.7)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)" }}
          onClick={() => setShowLocModal(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ width:"90%",maxWidth:360,background:"rgba(12,12,12,0.95)",
              borderRadius:24,padding:"32px 24px",
              border:"1px solid rgba(212,175,55,0.25)",
              boxShadow:`0 40px 80px rgba(0,0,0,0.9), 0 0 40px ${GOLD_GLOW}` }}>
            <div style={{ textAlign:"center",marginBottom:24 }}>
              <div style={{ fontSize:11,fontWeight:900,color:GOLD,
                letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:8 }}>
                Select Location
              </div>
              <div style={{ fontSize:13,color:"#555",fontWeight:500 }}>
                Choose your home gym to continue
              </div>
            </div>
            {LOCATIONS.map((loc, i) => (
              <button key={loc.id}
                onClick={() => { setLocation(loc); setActiveLocation(loc.id); setShowLocModal(false); setError(""); }}
                style={{ width:"100%",marginBottom:i < LOCATIONS.length-1 ? 10 : 0,
                  padding:"16px 20px",borderRadius:14,
                  background:"rgba(255,255,255,0.03)",
                  border:`1px solid rgba(255,255,255,0.07)`,
                  color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",
                  textAlign:"left",display:"flex",justifyContent:"space-between",
                  alignItems:"center",
                  transition:"all 0.2s" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(212,175,55,0.35)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}>
                <span>{loc.name}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" width="16" height="16">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Bio Agreement modal ── */}
      {showBioAgreement && (
        <div style={{ position:"fixed",inset:0,zIndex:500,
          background:"radial-gradient(circle at 50% 50%, rgba(10,10,10,0.97) 0%, #000 100%)",
          backdropFilter:"blur(30px)",WebkitBackdropFilter:"blur(30px)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          padding:24, animation:"lg-fadeIn 0.4s ease both" }}>
          {/* Spinning meshes decorative */}
          <div style={{ position:"relative",width:160,height:160,marginBottom:36 }}>
            {["0","20px","40px"].map((inset, i) => (
              <div key={i} style={{ position:"absolute",inset,borderRadius:"50%",
                border: i===0 ? "2px dashed rgba(212,175,55,0.25)"
                      : i===1 ? "1px solid rgba(255,255,255,0.08)"
                      : "2px dotted rgba(212,175,55,0.45)",
                animation: i===1
                  ? "lg-spinRev 15s linear infinite"
                  : `lg-spinFwd ${i===0?20:10}s linear infinite` }} />
            ))}
            <div style={{ position:"absolute",inset:55,
              backgroundImage:"url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' fill='none' stroke='%23D4AF37' stroke-width='1.2' xmlns='http://www.w3.org/2000/svg'><circle cx='12' cy='8' r='5'/><path d='M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2'/></svg>\")",
              backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundPosition:"center",
              opacity:0.9,filter:`drop-shadow(0 0 12px ${GOLD})` }} />
          </div>

          <div style={{ textAlign:"center",maxWidth:300 }}>
            <div style={{ fontSize:11,fontWeight:900,color:GOLD,
              letterSpacing:"0.25em",textTransform:"uppercase",marginBottom:12 }}>
              Biometric Authorization
            </div>
            <h2 style={{ fontSize:28,fontWeight:900,textTransform:"uppercase",
              letterSpacing:"0.1em",color:"#fff",margin:"0 0 16px",
              textShadow:"0 4px 20px rgba(0,0,0,0.8)" }}>
              Enable Biometrics?
            </h2>
            <p style={{ fontSize:14,color:"#666",lineHeight:1.65,margin:"0 0 32px",fontWeight:500 }}>
              Sign in instantly next time using Face ID, Touch ID, or your device biometric.
              Your credentials remain encrypted on this device.
            </p>
          </div>

          <div style={{ width:"100%",maxWidth:280 }}>
            <button
              onClick={async () => {
                setShowBioAgreement(false);
                const isNative = typeof (window as any).Capacitor !== "undefined"
                  && (window as any).Capacitor?.isNativePlatform?.();

                if (!isNative && window.PublicKeyCredential) {
                  // Web: register passkey FIRST, then open vault for visual feedback
                  const emailForReg = (email || localStorage.getItem('lbjj_passkey_email') || '').trim();
                  if (!emailForReg) {
                    setError('Enter your email first to set up biometrics.');
                    return;
                  }
                  setBioOpen(true);
                  setBioPhase("scanning");
                  setBioTitle("Setting Up Biometrics");
                  setBioDesc("Follow your device's prompt to register.");

                  const ok = await registerWebAuthnPasskey(emailForReg);
                  if (ok) {
                    setBioPhase("success");
                    setBioTitle("Biometrics Registered");
                    setBioDesc("You can now sign in with biometrics.");
                    setTimeout(() => { setBioOpen(false); setBioPhase("idle"); }, 2000);
                  } else {
                    setBioPhase("fail");
                    setBioTitle("Registration Failed");
                    setBioDesc("Biometrics not available. Use email to sign in.");
                    setTimeout(() => { setBioOpen(false); setBioPhase("idle"); }, 2200);
                  }
                } else {
                  // Native: go straight to vault (existing flow)
                  openBioVault();
                }
              }}
              style={{ width:"100%",padding:"18px",borderRadius:16,border:"none",
                fontFamily:"system-ui,sans-serif",fontSize:16,fontWeight:900,
                textTransform:"uppercase",letterSpacing:"0.12em",color:"#000",cursor:"pointer",
                background:`linear-gradient(90deg,${GOLD},${GOLD_L},${GOLD})`,
                backgroundSize:"200% auto",
                boxShadow:`0 10px 30px ${GOLD_GLOW}, inset 0 2px 0 rgba(255,255,255,0.8)`,
                animation:"lg-shine 3s linear infinite",marginBottom:12 }}>
              Activate Biometrics
            </button>
            <button
              onClick={() => setShowBioAgreement(false)}
              style={{ width:"100%",background:"none",border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:14,padding:"14px",color:"#555",fontSize:13,
                fontWeight:600,cursor:"pointer" }}>
              Not Now
            </button>
          </div>
        </div>
      )}

      {/* ── Bio Vault ── */}
      <div className={`lg-bio-vault${bioOpen?" active":""}${bioPhase==="scanning"?" scanning":""}${bioPhase==="success"?" success":""}`}
        onClick={e => { if (e.target===e.currentTarget){setBioOpen(false);setBioPhase("idle");} }}>
        <div className="lg-bio-ring">
          <div className="lg-bio-mesh" />
          <div className="lg-bio-mesh inner" />
          <div className="lg-bio-mesh core" />
          <div className="lg-bio-fp" />
          <div className="lg-bio-laser" />
        </div>
        <div style={{ textAlign:"center" }}>
          <h2 style={{ fontFamily:"system-ui,sans-serif",fontSize:28,fontWeight:900,
            textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:10,
            transition:"color 0.4s",
            color: bioPhase==="success"?"#10b981":bioPhase==="fail"?"#ef4444":"#fff" }}>
            {bioTitle}
          </h2>
          <p style={{ fontSize:15,color:"#666",fontWeight:500,letterSpacing:"0.05em" }}>
            {bioDesc}
          </p>
          {bioPhase !== 'success' && (
            <button
              onClick={() => { setBioOpen(false); setBioPhase('idle'); }}
              style={{
                marginTop: 24, background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '12px 32px', color: 'rgba(255,255,255,0.5)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Card ── */}
      <div className="lg-wrap" ref={wrapRef} style={{ transformStyle: inputFocused ? "flat" : "preserve-3d" }}>
        <div className="lg-card">
          <div className="lg-greeting">{getGreeting()}</div>

          {/* Logo — gold transparent PNG, no background */}
          <img src={logoGold} alt="Labyrinth" className="lg-logo" />

          <div className="lg-title-grp">
            <h1 className="lg-title">Labyrinth</h1>
            <div className="lg-sub">Secure Gateway</div>
          </div>

          {error && <ErrorBox msg={error} />}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <FloatInput
              label="Email Address"
              name="email"
              value={email}
              onChange={setEmail}
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="email"
              spellCheck={false}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />

            {/* Password with reveal toggle */}
            <div style={{ position:"relative",marginBottom:22 }}>
              <input
                type={showPw ? "text" : "password"}
                name="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={(e) => {
                  setInputFocused(true);
                  const target = e.target;
                  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                }}
                onBlur={() => setInputFocused(false)}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="lg-input"
                style={{ paddingRight:50 }}
              />
              <label className="lg-label"
                style={password ? {
                  top:-10,left:16,fontSize:"9px",fontWeight:900,color:GOLD,
                  background:"#0c0c0c",padding:"2px 8px",borderRadius:6,
                  textTransform:"uppercase",letterSpacing:"0.15em",
                  boxShadow:"0 4px 6px rgba(0,0,0,0.5)",
                  border:"1px solid rgba(212,175,55,0.3)",
                } : {}}>
                Access Cipher
              </label>
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",color:"#555",
                  padding:4,display:"flex",alignItems:"center",justifyContent:"center" }}>
                {showPw ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Location chip — inside form, compact row */}
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:20 }}>
              <button type="button"
                onClick={() => setShowLocModal(true)}
                style={{ flex:1,display:"flex",alignItems:"center",gap:8,
                  background:"rgba(255,255,255,0.03)",
                  border:`1px solid ${location?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.07)"}`,
                  borderRadius:12,padding:"11px 16px",cursor:"pointer",
                  color: location?GOLD:"#555",fontSize:12,fontWeight:700,
                  letterSpacing:"0.05em",textAlign:"left",
                  transition:"all 0.2s" }}>
                <svg viewBox="0 0 24 24" fill="none"
                  stroke={location?GOLD:"#555"} strokeWidth="2" width="14" height="14">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {location ? location.name : "Select Location"}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" width="10" height="10" style={{ marginLeft:"auto",color:"#444" }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            </div>

            <button type="submit" disabled={loading} className="lg-btn-gold">
              {loading ? "Authenticating..." : "Enter the Academy"}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8,
                textDecoration: 'underline', width: '100%', textAlign: 'center',
              }}
            >
              Forgot password?
            </button>

            {slowWarning && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 8, animation: 'none' }}>
                Taking longer than usual — server may be warming up...
              </div>
            )}
          </form>

          {/* Biometrics row — always shown, prompts agreement if not yet set up */}
          <button
            className="lg-btn-bio"
            onClick={() => {
              const alreadySetup = !!(
                localStorage.getItem("lbjj_passkey_registered")
                || localStorage.getItem("lbjj_passkey_id")
                || localStorage.getItem("lbjj_passkey_credential_id")
              );
              if (alreadySetup) {
                openBioVault();
              } else {
                setShowBioAgreement(true);
              }
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" width="18" height="18">
              <path d="M12 22v-6"/>
              <path d="M15.5 22v-3.5a3.5 3.5 0 0 0-7 0V22"/>
              <path d="M19 22v-7a7 7 0 0 0-14 0v7"/>
              <path d="M22.5 22v-10.5a10.5 10.5 0 0 0-21 0V22"/>
              <path d="M12 2a10 10 0 0 1 10 10"/>
              <path d="M12 6a6 6 0 0 1 6 6"/>
              <path d="M12 10a2 2 0 0 1 2 2"/>
            </svg>
            {hasBio ? "Sign In with Biometrics" : "Set Up Biometrics"}
          </button>

          {/* Request Access — visible, styled */}
          <div style={{ textAlign:"center",marginTop:20,paddingTop:20,
            borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize:11,color:"#444",marginBottom:10,fontWeight:500 }}>
              Not a member yet?
            </div>
            <button onClick={() => setScreen("request")}
              style={{ background:"rgba(212,175,55,0.06)",
                border:"1px solid rgba(212,175,55,0.25)",
                borderRadius:12,padding:"11px 24px",
                color:GOLD,fontSize:13,fontWeight:800,
                letterSpacing:"0.08em",textTransform:"uppercase",
                cursor:"pointer",width:"100%",
                transition:"all 0.2s" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.14)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(212,175,55,0.06)";
              }}>
              Request Access →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Floating label input ───────────────────────────────────────────
function FloatInput({ label, id: idProp, value, onChange, type = "text", name, autoCapitalize, autoCorrect, spellCheck, autoComplete, onFocus, onBlur }: {
  label: string; id?: string; value: string; onChange: (v: string) => void;
  type?: string; name?: string; autoCapitalize?: string; autoCorrect?: string;
  spellCheck?: boolean; autoComplete?: string;
  onFocus?: () => void; onBlur?: () => void;
}) {
  const inputId = idProp || `fi-${label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
  return (
    <div style={{ position:"relative",marginBottom:22 }}>
      <input
        id={inputId}
        name={name}
        type={type}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={(e) => {
          onFocus?.();
          const target = e.target;
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }}
        onBlur={() => onBlur?.()}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
        autoComplete={autoComplete}
        className="lg-input"
      />
      <label htmlFor={inputId} className="lg-label"
        style={value ? {
          top:-10,left:16,fontSize:"9px",fontWeight:900,color:GOLD,
          background:"#0c0c0c",padding:"2px 8px",borderRadius:6,
          textTransform:"uppercase",letterSpacing:"0.15em",
          boxShadow:"0 4px 6px rgba(0,0,0,0.5)",
          border:"1px solid rgba(212,175,55,0.3)",
        } : {}}>
        {label}
      </label>
    </div>
  );
}

// ─── Error box ──────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div role="alert" style={{ color:"#ef4444",fontSize:13,fontWeight:700,marginBottom:16,
      padding:"10px 14px",background:"rgba(239,68,68,0.08)",borderRadius:10,
      border:"1px solid rgba(239,68,68,0.2)",lineHeight:1.4 }}>
      {msg}
    </div>
  );
}

// ─── Background layers ──────────────────────────────────────────────
function GatewayBG() {
  return (
    <>
      <div style={{ position:"fixed",inset:"-10%",width:"120%",height:"120%",
        background:"url('https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop') center/cover",
        opacity:0.08,filter:"blur(15px) contrast(1.5) grayscale(0.5)",
        zIndex:0,transform:"translateZ(-500px)" }} />
      <div style={{ position:"fixed",inset:0,
        background:"radial-gradient(circle at 50% 50%, transparent 0%, #000 80%)",zIndex:1 }} />
      <svg style={{ position:"fixed",top:"50%",left:"50%",
        width:"150vw",height:"150vw",maxWidth:1200,maxHeight:1200,
        transform:"translate(-50%,-50%) rotateX(40deg) rotateZ(0deg)",
        opacity:0.04,zIndex:1,pointerEvents:"none",
        animation:"lg-slowSpin 120s linear infinite" }} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="lg-gg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFDF73"/>
            <stop offset="50%"  stopColor="#D4AF37"/>
            <stop offset="100%" stopColor="#8B6508"/>
          </linearGradient>
        </defs>
        <g stroke="url(#lg-gg)" strokeWidth="1.5" fill="none" opacity="0.3">
          {[90,75,60,45,30,15].map(r => (
            <circle key={r} cx="100" cy="100" r={r}
              strokeDasharray={r===90?"100 20 50 10":r===75?"80 30 150 15":
                r===60?"200 40 60 20":r===45?"50 10 100 25":r===30?"30 15":undefined}/>
          ))}
        </g>
      </svg>
      <div style={{ position:"fixed",inset:0,zIndex:2,pointerEvents:"none",
        backgroundImage:`radial-gradient(${GOLD} 1px, transparent 1px)`,
        backgroundSize:"150px 150px",opacity:0.04,
        animation:"lg-driftUp 40s linear infinite" }} />
    </>
  );
}

// ─── Keyframes ──────────────────────────────────────────────────────
const KF = `
  @keyframes lg-vaultEnter { 0%{opacity:0;transform:translateY(80px) translateZ(-100px) rotateX(10deg)}100%{opacity:1;transform:translateY(0) translateZ(50px) rotateX(0)} }
  @keyframes lg-scaleIn { 0%{opacity:0;transform:scale(0.5)}100%{opacity:1;transform:scale(1)} }
  @keyframes lg-fadeUp { to{opacity:1;transform:translateY(0)} }
  @keyframes lg-fadeIn { from{opacity:0}to{opacity:1} }
  @keyframes lg-slowSpin { to{transform:translate(-50%,-50%) rotateX(40deg) rotateZ(360deg)} }
  @keyframes lg-driftUp { 0%{background-position:0 150px}100%{background-position:50px -150px} }
  @keyframes lg-laserScan { 0%{top:-10%}100%{top:110%} }
  @keyframes lg-spinFwd { 100%{transform:rotate(360deg)} }
  @keyframes lg-spinRev { 100%{transform:rotate(-360deg)} }
  @keyframes lg-shine { to{background-position:right center} }
  @keyframes lg-blink { 0%,100%{opacity:1}50%{opacity:0} }
  @media (prefers-reduced-motion: reduce) {
    .lg-card, .lg-logo, .lg-greeting { animation: none !important; opacity: 1 !important; transform: none !important; }
    .lg-btn-gold { animation: none !important; }
    .lg-bio-mesh, .lg-bio-ring, .lg-bio-ring2, .lg-bio-laser { animation: none !important; }
    .lg-bg-drift, .lg-bg-ring { animation: none !important; }
  }
`;

// ─── Styles ─────────────────────────────────────────────────────────
const STYLES = `
  .lg-wrap {
    position:relative; z-index:10;
    width:100%; max-width:400px; padding:20px;
  }

  .lg-card {
    background:rgba(10,10,10,0.42);
    border-radius:28px; padding:44px 32px;
    backdrop-filter:blur(40px); -webkit-backdrop-filter:blur(40px);
    box-shadow:0 40px 100px rgba(0,0,0,0.9),
      inset 0 1px 2px rgba(255,255,255,0.1),
      inset 0 -1px 2px rgba(0,0,0,0.8);
    position:relative; transform:translateZ(50px);
    opacity:0; animation:lg-vaultEnter 1.5s cubic-bezier(0.16,1,0.3,1) forwards;
  }
  .lg-card::after {
    content:''; position:absolute; inset:0; border-radius:28px; padding:1px;
    background:linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 40%,rgba(212,175,55,0.25) 100%);
    -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
    -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none;
  }

  .lg-logo {
    width:100px; height:100px; object-fit:contain;
    display:block; margin:0 auto 20px;
    filter:drop-shadow(0 0 18px ${GOLD_GLOW}) drop-shadow(0 0 6px rgba(212,175,55,0.6));
    opacity:0; animation:lg-scaleIn 1s cubic-bezier(0.34,1.56,0.64,1) 0.8s forwards;
    image-rendering:crisp-edges;
  }

  .lg-greeting {
    text-align:center; color:${GOLD};
    font-size:10px; font-weight:900; letter-spacing:0.3em;
    text-transform:uppercase; margin-bottom:20px;
    opacity:0; transform:translateY(10px);
    animation:lg-fadeUp 1s ease 0.5s forwards;
  }

  .lg-title-grp { text-align:center; margin-bottom:28px; }
  .lg-title {
    font-family:system-ui,sans-serif; font-size:32px; font-weight:900;
    text-transform:uppercase; letter-spacing:0.14em; margin:0; line-height:1;
    background:linear-gradient(180deg,#fff 0%,#aaa 100%);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  }
  .lg-sub { font-size:12px; color:#555; font-weight:500; letter-spacing:0.1em; margin-top:7px; }

  .lg-input {
    width:100%; box-sizing:border-box;
    background:rgba(0,0,0,0.6);
    border:1px solid rgba(255,255,255,0.06); border-radius:14px;
    padding:17px 20px; color:#fff;
    font-family:system-ui,sans-serif; font-size:15px; font-weight:700;
    outline:none; transition:all 0.4s cubic-bezier(0.16,1,0.3,1);
    box-shadow:inset 0 4px 10px rgba(0,0,0,0.8);
    -webkit-text-security:inherit;
  }
  .lg-input:focus {
    border-color:rgba(212,175,55,0.5); background:rgba(5,5,5,0.88);
    box-shadow:inset 0 4px 10px rgba(0,0,0,0.9), 0 0 18px rgba(212,175,55,0.12);
  }
  .lg-label {
    position:absolute; left:20px; top:17px;
    color:#555; font-size:14px; font-weight:500; pointer-events:none;
    transition:all 0.35s cubic-bezier(0.16,1,0.3,1);
  }
  .lg-input:focus ~ .lg-label,
  .lg-input:valid ~ .lg-label {
    top:-10px; left:16px;
    font-size:9px; font-weight:900; color:${GOLD};
    background:#0c0c0c; padding:2px 8px; border-radius:6px;
    text-transform:uppercase; letter-spacing:0.15em;
    box-shadow:0 4px 6px rgba(0,0,0,0.5);
    border:1px solid rgba(212,175,55,0.3);
  }

  .lg-btn-gold {
    width:100%; border:none; border-radius:14px;
    padding:17px; margin-top:4px;
    font-family:system-ui,sans-serif; font-size:15px; font-weight:900;
    text-transform:uppercase; letter-spacing:0.14em; color:#000;
    cursor:pointer; position:relative; overflow:hidden;
    background:linear-gradient(90deg,${GOLD},${GOLD_L},${GOLD});
    background-size:200% auto;
    box-shadow:0 10px 28px ${GOLD_GLOW}, inset 0 2px 0 rgba(255,255,255,0.8);
    transition:all 0.4s cubic-bezier(0.16,1,0.3,1);
    animation:lg-shine 4s linear infinite;
  }
  .lg-btn-gold:hover { transform:scale(1.02); box-shadow:0 14px 36px rgba(212,175,55,0.5), inset 0 2px 0 rgba(255,255,255,0.8); }
  .lg-btn-gold:disabled { opacity:0.7; cursor:wait; animation:none; }

  .lg-btn-bio {
    width:100%; background:transparent; border:none;
    color:#555; font-family:system-ui,sans-serif; font-size:13px; font-weight:700;
    letter-spacing:0.05em; margin-top:16px; padding:10px;
    cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
    transition:color 0.3s;
  }
  .lg-btn-bio:hover { color:${GOLD}; }

  /* Bio Vault */
  .lg-bio-vault {
    position:fixed; inset:0; z-index:200;
    background:radial-gradient(circle at 50% 50%, rgba(10,10,10,0.97) 0%, #000 100%);
    backdrop-filter:blur(30px); -webkit-backdrop-filter:blur(30px);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:32px; opacity:0; pointer-events:none;
    transition:opacity 0.5s cubic-bezier(0.16,1,0.3,1);
  }
  .lg-bio-vault.active { opacity:1; pointer-events:all; }
  .lg-bio-ring {
    position:relative; width:200px; height:200px;
    transform:scale(0.8); transition:transform 0.8s cubic-bezier(0.16,1,0.3,1);
  }
  .lg-bio-vault.active .lg-bio-ring { transform:scale(1); }
  .lg-bio-mesh { position:absolute; inset:0; border-radius:50%;
    border:2px dashed rgba(212,175,55,0.2); animation:lg-spinFwd 20s linear infinite; }
  .lg-bio-mesh.inner { inset:20px; border:1px solid rgba(255,255,255,0.1); animation:lg-spinRev 15s linear infinite; }
  .lg-bio-mesh.core { inset:40px; border:3px dotted rgba(212,175,55,0.4); animation:lg-spinFwd 10s linear infinite; }
  .lg-bio-fp {
    position:absolute; inset:58px;
    background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="none" stroke="%23D4AF37" stroke-width="1" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 22v-6"/><path d="M15.5 22v-3.5a3.5 3.5 0 0 0-7 0V22"/><path d="M19 22v-7a7 7 0 0 0-14 0v7"/><path d="M22.5 22v-10.5a10.5 10.5 0 0 0-21 0V22"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6a6 6 0 0 1 6 6"/><path d="M12 10a2 2 0 0 1 2 2"/></svg>') center/contain no-repeat;
    opacity:0.25; filter:drop-shadow(0 0 10px ${GOLD}); transition:all 0.4s;
  }
  .lg-bio-laser {
    position:absolute; top:0; left:-20px; right:-20px; height:3px;
    background:#fff; box-shadow:0 0 20px 5px ${GOLD};
    border-radius:50%; opacity:0;
  }
  .lg-bio-vault.scanning .lg-bio-laser { animation:lg-laserScan 2s ease-in-out infinite alternate; opacity:1; }
  .lg-bio-vault.scanning .lg-bio-fp { opacity:1; }
  .lg-bio-vault.success .lg-bio-mesh { border-color:#10b981; animation-play-state:paused; }
  .lg-bio-vault.success .lg-bio-fp {
    background:url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="none" stroke="%2310B981" stroke-width="1.5" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5"/></svg>') center/contain no-repeat;
    opacity:1; transform:scale(1.2);
  }
`;
