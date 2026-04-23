/**
 * OnboardingPage — Cinematic Intro
 * Ported from Labyrinth_Intro_Fixed_Background.html
 * Shown once after first login. Marks lbjj_onboarding_done on skip/complete.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import logoMaze from "@assets/logo-maze.webp";

const ONBOARDING_KEY = "lbjj_onboarding_done";

function markDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default function OnboardingPage() {
  const [skipTriggered, setSkipTriggered] = useState(false);
  const skipRef = useRef(false);
  const [flashActive, setFlashActive] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  // Orbs
  const [orbGold, setOrbGold] = useState({ opacity: 0, scale: 0.5 });
  const [orbSilver, setOrbSilver] = useState({ opacity: 0, scale: 0.5 });

  // Scene states
  const [s1, setS1] = useState<"hidden"|"active"|"exit">("hidden");
  const [s1sub, setS1sub] = useState(false);
  const [s1main, setS1main] = useState(false);

  const [s2, setS2] = useState<"hidden"|"active"|"exit">("hidden");
  const [s2main, setS2main] = useState(false);

  const [s3, setS3] = useState<"hidden"|"active"|"exit">("hidden");
  const [s3sub, setS3sub] = useState(false);
  const [s3main, setS3main] = useState(false);
  const [s3tilt, setS3tilt] = useState(false);
  const [s3btnPressed, setS3btnPressed] = useState(false);
  const [s3btnDone, setS3btnDone] = useState(false);
  const [sw1, setSw1] = useState(false);

  const [s4, setS4] = useState<"hidden"|"active"|"exit">("hidden");
  const [s4sub, setS4sub] = useState(false);
  const [s4main, setS4main] = useState(false);
  const [xpNum, setXpNum] = useState(0);
  const [xpFill, setXpFill] = useState(0);
  const [xpHide, setXpHide] = useState(false);
  const [luFire, setLuFire] = useState(false);
  const [sw2, setSw2] = useState(false);

  const [s5, setS5] = useState<"hidden"|"active"|"exit">("hidden");
  const [s5sub, setS5sub] = useState(false);
  const [s5main, setS5main] = useState(false);
  const [s5tilt, setS5tilt] = useState(false);
  const [s5btn, setS5btn] = useState<"idle"|"pressed"|"claimed">("idle");
  const [s5gold, setS5gold] = useState(false);

  const [s6, setS6] = useState<"hidden"|"active"|"exit">("hidden");
  const [s6sub, setS6sub] = useState(false);
  const [s6main, setS6main] = useState(false);
  const [lbGlow, setLbGlow] = useState(false);
  const [lbShift, setLbShift] = useState(false);
  const [lbRank1, setLbRank1] = useState(false);

  const [s7, setS7] = useState<"hidden"|"active"|"exit">("hidden");
  const [s7sub, setS7sub] = useState(false);
  const [s7main, setS7main] = useState(false);
  const [avatarTier, setAvatarTier] = useState<"base"|"bronze"|"silver"|"gold">("base");

  const [s8, setS8] = useState<"hidden"|"active"|"exit">("hidden");
  const [s8main, setS8main] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [skipVisible, setSkipVisible] = useState(true);

  // Particles container ref
  const containerRef = useRef<HTMLDivElement>(null);

  const triggerHandoff = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    setSkipTriggered(true);
    setSkipVisible(false);
    setFlashActive(true);
    setTimeout(() => {
      markDone();
      setShowSpinner(true);
      // Force re-render via storage event so AppShell picks up the key
      window.dispatchEvent(new Event("storage"));
      // Small extra delay, then hard reload to let AppShell re-read
      setTimeout(() => { window.location.reload(); }, 600);
    }, 800);
  }, []);

  const burstParticles = useCallback((x: number, y: number, count = 60) => {
    if (skipRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:absolute;width:6px;height:6px;background:#C8A24C;border-radius:50%;pointer-events:none;box-shadow:0 0 15px #C8A24C;z-index:200;left:${x}px;top:${y}px;`;
      container.appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const v = 200 + Math.random() * 400;
      const tx = Math.cos(angle) * v, ty = Math.sin(angle) * v;
      p.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${tx}px,${ty}px) scale(0)`, opacity: 0 }], { duration: 1000 + Math.random() * 1000, easing: "cubic-bezier(0.19,1,0.22,1)", fill: "forwards" });
      setTimeout(() => p.remove(), 2100);
    }
  }, []);

  const screenShake = useCallback((intensity = 15) => {
    if (skipRef.current) return;
    document.body.animate([{ transform: `translate3d(${intensity}px,${intensity}px,0)` }, { transform: `translate3d(-${intensity}px,-${intensity}px,0)` }, { transform: `translate3d(${intensity/2}px,-${intensity/2}px,0)` }, { transform: "translate3d(0,0,0)" }], { duration: 500, easing: "ease-out" });
  }, []);

  const animateXP = useCallback((end: number, duration: number) => {
    return new Promise<void>(resolve => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (skipRef.current) return resolve();
        if (!start) start = ts;
        const prog = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - prog, 4);
        setXpNum(Math.floor(eased * end));
        setXpFill(Math.floor(eased * 100));
        if (prog < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }, []);

  useEffect(() => {
    const run = async () => {
      const sk = () => skipRef.current;

      // S1
      setS1("active");
      await sleep(500); if(sk()) return; setS1sub(true);
      await sleep(600); if(sk()) return; setS1main(true);
      await sleep(2200); if(sk()) return; setS1("exit");
      await sleep(600); if(sk()) return;

      // S2
      setS2("active");
      setOrbGold({ opacity: 1, scale: 1.5 });
      await sleep(500); if(sk()) return; setS2main(true);
      await sleep(2200); if(sk()) return; setS2("exit");
      await sleep(600); if(sk()) return;

      // S3 — Log training
      setS3("active");
      await sleep(600); if(sk()) return; setS3sub(true); setS3main(true); setS3tilt(true);
      await sleep(800); if(sk()) return;
      setS3btnPressed(true); await sleep(150); if(sk()) return;
      setS3btnPressed(false); setS3btnDone(true); setSw1(true);
      const c3 = containerRef.current?.getBoundingClientRect();
      if (c3) burstParticles(c3.width / 2, c3.height / 2, 60); screenShake(15);
      await sleep(1800); if(sk()) return;
      setS3tilt(false); setS3("exit"); setOrbGold({ opacity: 0, scale: 0.5 });
      await sleep(600); if(sk()) return;

      // S4 — Earn XP
      setS4("active");
      await sleep(500); if(sk()) return; setS4sub(true); setS4main(true);
      await sleep(400); if(sk()) return;
      setOrbGold({ opacity: 0.5, scale: 1 });
      await animateXP(5000, 2500); if(sk()) return;
      setXpHide(true); await sleep(200); if(sk()) return;
      setLuFire(true); setSw2(true); screenShake(20);
      setOrbGold({ opacity: 0.8, scale: 2 });
      await sleep(2000); if(sk()) return; setS4("exit"); setOrbGold({ opacity: 0, scale: 0.5 });
      await sleep(600); if(sk()) return;

      // S5 — Claim badges
      setS5("active");
      await sleep(400); if(sk()) return; setS5sub(true); setS5main(true); setS5tilt(true);
      await sleep(1000); if(sk()) return;
      setS5btn("pressed"); await sleep(200); if(sk()) return;
      setS5btn("claimed"); setS5gold(true);
      const c5 = containerRef.current?.getBoundingClientRect();
      if (c5) burstParticles(c5.width / 2, c5.height * 0.6, 80); screenShake(10);
      await sleep(2000); if(sk()) return; setS5tilt(false); setS5("exit");
      await sleep(600); if(sk()) return;

      // S6 — Leaderboard
      setS6("active");
      await sleep(400); if(sk()) return; setS6sub(true); setS6main(true);
      await sleep(1000); if(sk()) return;
      setLbGlow(true); setOrbGold({ opacity: 0.3, scale: 1.5 });
      await sleep(600); if(sk()) return;
      setLbShift(true);
      await sleep(600); if(sk()) return; setLbRank1(true);
      await sleep(2000); if(sk()) return; setS6("exit"); setOrbGold({ opacity: 0, scale: 0.5 });
      await sleep(600); if(sk()) return;

      // S7 — Portrait tiers
      setS7("active");
      await sleep(400); if(sk()) return; setS7sub(true); setS7main(true);
      await sleep(600); if(sk()) return; setAvatarTier("bronze");
      await sleep(600); if(sk()) return; setAvatarTier("silver"); setOrbSilver({ opacity: 1, scale: 1.5 });
      await sleep(600); if(sk()) return; setAvatarTier("gold"); setOrbSilver({ opacity: 0, scale: 0.5 }); setOrbGold({ opacity: 1, scale: 2.5 });
      await sleep(2500); if(sk()) return; setS7("exit"); setOrbGold({ opacity: 0, scale: 0.5 });
      await sleep(600); if(sk()) return;

      // S8 — Enter
      setS8("active");
      setOrbGold({ opacity: 0.4, scale: 2 });
      await sleep(500); if(sk()) return; setS8main(true);
      await sleep(1000); if(sk()) return;
      setSkipVisible(false);
      setShowEnter(true);
    };
    run();
  }, [animateXP, burstParticles, screenShake]);

  if (showSpinner) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 99999 }}>
        <div style={{ width: 44, height: 44, border: "4px solid #C8A24C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 20 }} />
        <style>{`@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
        <div style={{ color: "#C8A24C", fontWeight: 900, fontSize: 20, letterSpacing: 4, textTransform: "uppercase" }}>Loading</div>
      </div>
    );
  }

  const sceneClass = (state: "hidden"|"active"|"exit") =>
    state === "hidden" ? { opacity: 0, pointerEvents: "none" as const, transform: "scale(1.05) translateZ(-50px)" }
    : state === "active" ? { opacity: 1, pointerEvents: "all" as const, transform: "scale(1) translateZ(0)" }
    : { opacity: 0, pointerEvents: "none" as const, transform: "scale(0.95) translateZ(50px)" };

  const avatarStyle = () => {
    const base: React.CSSProperties = { width: 160, height: 160, borderRadius: "50%", background: "#111", border: "4px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 900, color: "#fff", transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)", position: "relative", zIndex: 10, marginBottom: 36 };
    if (avatarTier === "bronze") return { ...base, borderColor: "#CD7F32", boxShadow: "0 0 40px rgba(205,127,50,0.4)", transform: "scale(1.05)", color: "#CD7F32" };
    if (avatarTier === "silver") return { ...base, borderColor: "#9CA3AF", boxShadow: "0 0 50px rgba(156,163,175,0.5)", transform: "scale(1.1)", color: "#9CA3AF", borderWidth: 5 };
    if (avatarTier === "gold") return { ...base, borderColor: "#FFD700", boxShadow: "0 0 80px rgba(255,215,0,0.6)", transform: "scale(1.2)", background: "rgba(255,215,0,0.1)", color: "#FFD700", borderWidth: 6 };
    return base;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden", perspective: 1200, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9000 }}>
      <style>{INTRO_STYLES}</style>

      {/* Flash */}
      <div style={{ position: "fixed", inset: 0, background: "#fff", opacity: flashActive ? 1 : 0, pointerEvents: "none", zIndex: 20000, transition: "opacity 1s cubic-bezier(0.19,1,0.22,1)" }} />

      {/* Film grain */}
      <div style={{ position: "fixed", top: "-50%", left: "-50%", width: "200%", height: "200%", zIndex: 9000, pointerEvents: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, backgroundRepeat: "repeat", backgroundSize: "200px 200px", opacity: 0.5 }} />

      {/* Logo mark */}
      <div style={{ position: "fixed", top: 36, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 10, opacity: skipTriggered ? 0 : 1, transition: "opacity 0.5s" }}>
        <img src={logoMaze} alt="Labyrinth" style={{ width: 28, height: 28, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(200,162,76,0.6))" }} />
        <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4, color: "#444", textTransform: "uppercase" }}>Labyrinth</span>
      </div>

      {/* Skip */}
      {skipVisible && (
        <button onClick={triggerHandoff} style={{ position: "fixed", bottom: 36, right: 36, zIndex: 9999, background: "transparent", border: "none", color: "rgba(255,255,255,0.35)", fontFamily: "system-ui,sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", transition: "color 0.3s" }}>
          Skip Intro &#10230;
        </button>
      )}

      {/* Ambient orbs */}
      <div style={{ position: "absolute", width: "150vmax", height: "150vmax", background: "radial-gradient(circle,rgba(200,162,76,0.15) 0%,transparent 50%)", top: "50%", left: "50%", transform: `translate(-50%,-50%) scale(${orbGold.scale})`, opacity: orbGold.opacity, transition: "all 2s cubic-bezier(0.16,1,0.3,1)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", width: "150vmax", height: "150vmax", background: "radial-gradient(circle,rgba(156,163,175,0.12) 0%,transparent 50%)", top: "50%", left: "50%", transform: `translate(-50%,-50%) scale(${orbSilver.scale})`, opacity: orbSilver.opacity, transition: "all 2s cubic-bezier(0.16,1,0.3,1)", pointerEvents: "none", zIndex: 1 }} />

      {/* Particle container */}
      <div ref={containerRef} style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }} />

      {/* ── S1: JIU JITSU IS A GRIND ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s1) }}>
        <div className={`intro-sub${s1sub ? " reveal" : ""}`}>The Mat is Unforgiving</div>
        <div className={`intro-hero${s1main ? " reveal" : ""}`}>JIU JITSU IS<br />A GRIND.</div>
      </div>

      {/* ── S2: WE MADE IT A GAME ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s2) }}>
        <div className={`intro-hero text-gold${s2main ? " reveal" : ""}`}>WE MADE IT<br />A GAME.</div>
      </div>

      {/* ── S3: Log Training ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s3) }}>
        <div className={`intro-sub${s3sub ? " reveal" : ""}`}>The Core Engine</div>
        <div className={`intro-hero${s3main ? " reveal" : ""}`} style={{ marginBottom: 36 }}>CHECK INTO CLASSES.</div>
        <div style={{ background: "rgba(20,20,20,0.6)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, padding: 36, display: "flex", flexDirection: "column", alignItems: "center", transition: "all 1.5s cubic-bezier(0.16,1,0.3,1)", transform: s3tilt ? "rotateX(-14deg) rotateY(14deg) translateZ(80px) scale(1.04)" : "rotateX(0) rotateY(0)", boxShadow: s3tilt ? "-16px 36px 70px rgba(200,162,76,0.18)" : "0 30px 60px rgba(0,0,0,0.8)", borderColor: s3tilt ? "rgba(200,162,76,0.25)" : "rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#666", marginBottom: 24, textTransform: "uppercase", letterSpacing: 2 }}>Session Verified</div>
          <button style={{ background: s3btnDone ? "#4CAF50" : "#C8A24C", border: "none", borderRadius: 18, padding: "22px 44px", fontSize: 22, fontWeight: 900, color: s3btnDone ? "#fff" : "#000", boxShadow: "0 14px 28px rgba(200,162,76,0.3)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", transform: s3btnPressed ? "scale(0.9) translateZ(-20px)" : "scale(1)" }}>
            {s3btnDone ? "XP SECURED" : "LOG TRAINING"}
          </button>
        </div>
        {sw1 && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) scale(0)", width: 10, height: 10, borderRadius: "50%", border: "4px solid #C8A24C", animation: "intro-explode 1.5s cubic-bezier(0.19,1,0.22,1) forwards", pointerEvents: "none", zIndex: 100 }} />}
      </div>

      {/* ── S4: Earn XP ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s4) }}>
        <div className={`intro-sub${s4sub ? " reveal" : ""}`}>The Progression</div>
        <div className={`intro-hero${s4main ? " reveal" : ""}`}>EARN EXP.</div>
        <div style={{ marginTop: 44, width: "80%", maxWidth: 480, textAlign: "center", position: "relative" }}>
          <div style={{ opacity: xpHide ? 0 : 1, transform: xpHide ? "scale(0.8)" : "scale(1)", filter: xpHide ? "blur(10px)" : "none", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}>
            <div style={{ fontSize: "clamp(56px,10vw,110px)", fontWeight: 900, color: "#C8A24C", textShadow: "0 0 40px rgba(200,162,76,0.4)", lineHeight: 1, marginBottom: 14 }}>{xpNum.toLocaleString()}</div>
            <div style={{ width: "100%", height: 18, background: "#111", borderRadius: 9, border: "1px solid #222", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${xpFill}%`, background: "linear-gradient(90deg,#b59242,#FFD700)", transition: "width 0.1s", boxShadow: "0 0 18px rgba(255,215,0,0.5)" }} />
            </div>
          </div>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) scale(${luFire ? 1 : 0.5})`, fontSize: "clamp(36px,8vw,90px)", fontWeight: 900, color: "#FFF", textShadow: "0 0 50px #FFD700, 0 0 100px #C8A24C", opacity: luFire ? 1 : 0, whiteSpace: "nowrap", pointerEvents: "none", transition: "all 0.6s cubic-bezier(0.19,1,0.22,1)" }}>LEVEL UP!</div>
        </div>
        {sw2 && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) scale(0)", width: 10, height: 10, borderRadius: "50%", border: "4px solid #C8A24C", animation: "intro-explode 1.5s cubic-bezier(0.19,1,0.22,1) forwards", pointerEvents: "none", zIndex: 100 }} />}
      </div>

      {/* ── S5: Claim Badges ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s5) }}>
        <div className={`intro-sub${s5sub ? " reveal" : ""}`}>Unlock Milestones</div>
        <div className={`intro-hero${s5main ? " reveal" : ""}`} style={{ marginBottom: 36 }}>CLAIM BADGES.</div>
        <div style={{ background: "rgba(20,20,20,0.6)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${s5gold ? "#C8A24C" : "rgba(255,255,255,0.08)"}`, borderRadius: 28, padding: "28px 32px", width: "90%", maxWidth: 560, display: "flex", alignItems: "center", gap: 18, transition: "all 1.5s cubic-bezier(0.16,1,0.3,1)", transform: s5tilt ? "rotateX(-14deg) rotateY(14deg) translateZ(80px) scale(1.04)" : "rotateX(0) rotateY(0)", boxShadow: s5gold ? "0 28px 70px rgba(200,162,76,0.4)" : "0 30px 60px rgba(0,0,0,0.8)" }}>
          <div style={{ width: 58, height: 58, background: s5gold ? "#C8A24C" : "#111", borderRadius: "50%", border: `2px solid ${s5gold ? "#C8A24C" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, transition: "all 0.4s" }}>🏆</div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>Century Club</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#666", marginTop: 4 }}>Attend 100 Classes.</div>
          </div>
          <button style={{ background: s5btn === "claimed" ? "#FFD700" : "#C8A24C", border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, fontWeight: 900, color: "#000", boxShadow: "0 0 18px rgba(200,162,76,0.4)", transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", transform: s5btn === "pressed" ? "scale(0.85)" : "scale(1)" }}>
            {s5btn === "claimed" ? "UNLOCKED" : "CLAIM"}
          </button>
        </div>
      </div>

      {/* ── S6: Leaderboard ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s6) }}>
        <div className={`intro-sub text-gold${s6sub ? " reveal" : ""}`}>Compete with Friends</div>
        <div className={`intro-hero${s6main ? " reveal" : ""}`}>DOMINATE THE RANKS.</div>
        <div style={{ marginTop: 36, width: "90%", maxWidth: 480, position: "relative", height: 280 }}>
          {[
            { id: "lb1", label: "Gordon", score: "15,400", rankNum: lbRank1 ? "2" : "1", delay: "0.1s", top: lbShift ? 100 : 0, borderColor: "#FFD700", isMe: false },
            { id: "lb2", label: "Craig",  score: "14,200", rankNum: lbRank1 ? "3" : "2", delay: "0.2s", top: lbShift ? 200 : 100, borderColor: "#9CA3AF", isMe: false },
            { id: "lbme", label: "You",   score: "12,100", rankNum: lbRank1 ? "1" : "3", delay: "0.3s", top: lbShift ? 0 : 200, borderColor: "#CD7F32", isMe: true },
          ].map(row => (
            <div key={row.id} style={{ position: "absolute", width: "100%", height: 76, background: lbGlow && row.isMe ? "rgba(200,162,76,0.15)" : row.isMe ? "rgba(255,255,255,0.03)" : "rgba(20,20,20,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${lbGlow && row.isMe ? "rgba(200,162,76,0.4)" : "rgba(255,255,255,0.05)"}`, borderRadius: 18, display: "flex", alignItems: "center", padding: "0 22px", transition: "all 1s cubic-bezier(0.16,1,0.3,1)", top: row.top, transitionDelay: row.delay, boxShadow: lbGlow && row.isMe ? "0 18px 44px rgba(200,162,76,0.3)" : "none", transform: lbGlow && row.isMe ? "scale(1.04) translateZ(50px)" : "scale(1)", zIndex: lbGlow && row.isMe ? 10 : 1 }}>
              <div style={{ width: 36, fontSize: 22, fontWeight: 900, color: lbGlow && row.isMe ? "#fff" : "#555" }}>{row.rankNum}</div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${row.borderColor}`, marginRight: 18, background: "#111" }} />
              <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: lbGlow && row.isMe ? "#fff" : "#fff", textShadow: lbGlow && row.isMe ? "0 0 10px rgba(255,255,255,0.5)" : "none" }}>{row.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: lbGlow && row.isMe ? "#fff" : "#555" }}>{row.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── S7: Earn Portrait ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s7) }}>
        <div className={`intro-sub text-gold${s7sub ? " reveal" : ""}`}>Status Symbol</div>
        <div style={avatarStyle()}>You</div>
        <div className={`intro-hero${s7main ? " reveal" : ""}`}>EARN A NEW PORTRAIT.</div>
      </div>

      {/* ── S8: Enter ── */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 10, transition: "opacity 1s, transform 1.5s cubic-bezier(0.16,1,0.3,1)", ...sceneClass(s8) }}>
        <div className={`intro-hero${s8main ? " reveal" : ""}`}>ENTER THE<br /><span className="text-gold">LABYRINTH</span></div>
        <button onClick={triggerHandoff} className={`intro-btn-enter${showEnter ? " reveal" : ""}`}>ENTER DASHBOARD</button>
      </div>
    </div>
  );
}

const INTRO_STYLES = `
  @keyframes intro-explode { 100%{ transform:translate(-50%,-50%) scale(200); opacity:0; border-width:1px; } }
  @keyframes intro-pulseBtn { from{box-shadow:0 0 10px rgba(200,162,76,0.2),inset 0 0 10px rgba(200,162,76,0.1)}to{box-shadow:0 0 30px rgba(200,162,76,0.5),inset 0 0 20px rgba(200,162,76,0.3)} }
  @keyframes intro-goldPulse { from{box-shadow:0 0 40px rgba(255,215,0,0.4)}to{box-shadow:0 0 80px rgba(255,215,0,0.8)} }

  .intro-hero {
    font-size: clamp(30px,5vw,66px); font-weight: 900; letter-spacing: -0.04em;
    text-align: center; line-height: 1.08; opacity: 0; transform: translateY(28px);
    transition: all 1.2s cubic-bezier(0.16,1,0.3,1);
    text-shadow: 0 10px 30px rgba(0,0,0,0.8);
  }
  .intro-hero.reveal { opacity: 1; transform: translateY(0); }
  .text-gold {
    background: linear-gradient(to bottom right,#FFF,#C8A24C);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .intro-sub {
    font-size: clamp(11px,1.4vw,17px); font-weight: 600; color: #666;
    letter-spacing: 0.3em; text-transform: uppercase; margin-bottom: 18px;
    opacity: 0; transform: translateY(18px); transition: all 1.2s cubic-bezier(0.16,1,0.3,1);
  }
  .intro-sub.reveal { opacity: 1; transform: translateY(0); }
  .intro-btn-enter {
    margin-top: 36px; padding: 17px 38px; border-radius: 28px;
    background: transparent; border: 2px solid #C8A24C; color: #C8A24C;
    font-size: 17px; font-weight: 900; letter-spacing: 2px; cursor: pointer;
    transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
    opacity: 0; transform: translateY(18px); pointer-events: none;
    box-shadow: 0 0 18px rgba(200,162,76,0.2), inset 0 0 18px rgba(200,162,76,0.1);
    animation: intro-pulseBtn 2s infinite alternate;
    font-family: system-ui, sans-serif;
  }
  .intro-btn-enter.reveal { opacity: 1; transform: translateY(0); pointer-events: all; }
  .intro-btn-enter:hover { background: #C8A24C; color: #000; box-shadow: 0 0 36px rgba(200,162,76,0.6); transform: scale(1.05); }
`;
