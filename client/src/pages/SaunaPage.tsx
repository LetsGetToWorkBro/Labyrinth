import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { gasCall, saunaCheckin, saunaCheckout } from "@/lib/api";

type Session = {
  id: string | number;
  name: string;
  initials: string;
  seconds: number;
  exiting?: boolean;
};

const MAX_CAPACITY = 6;
const MAX_TIME_SEC = 20 * 60;
const POLL_MS = 30_000;

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;800&display=swap');

.sauna-term, .sauna-term * { box-sizing: border-box; user-select: none; }
.sauna-term {
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  padding: 20px;
  padding-bottom: 80px;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  overflow-x: hidden;
  --bg: #000000;
  --panel: rgba(12, 12, 14, 0.7);
  --gold-1: #8B6508;
  --gold-2: #D4AF37;
  --gold-3: #FFDF00;
  --heat-1: #FF4500;
  --heat-2: #FF8C00;
  --text-main: #ffffff;
  --text-muted: #888891;
  --border: rgba(255,255,255,0.08);
  --success: #00FF7F;
  --danger: #FF0000;
}

#sauna-furnace-glow {
  position: fixed; top: -10%; left: 50%; transform: translateX(-50%);
  width: 100vw; height: 70vh;
  background: radial-gradient(ellipse at top, rgba(255, 69, 0, 0.03), transparent 70%);
  pointer-events: none; z-index: 0;
  transition: all 2s cubic-bezier(0.16, 1, 0.3, 1);
}
body.sauna-active #sauna-furnace-glow {
  background: radial-gradient(ellipse at top, rgba(255, 69, 0, 0.25), transparent 80%);
  animation: sauna-breathe 4s infinite alternate ease-in-out;
}
@keyframes sauna-breathe {
  0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  100% { transform: translateX(-50%) scale(1.05); opacity: 1; }
}

.sauna-back {
  position: absolute; top: 20px; left: 20px;
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  display: grid; place-items: center;
  color: #fff; cursor: pointer; z-index: 20;
  transition: all 0.2s;
}
.sauna-back:active { transform: scale(0.92); }

.sauna-term .terminal-wrapper { max-width: 600px; margin: 0 auto; position: relative; padding-top: 40px; }

.sauna-term .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.sauna-term .title-block { display: flex; flex-direction: column; gap: 4px; }
.sauna-term .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: 0.25em; text-transform: uppercase; color: var(--heat-2); transition: color 0.5s; }
body.sauna-active .sauna-term .eyebrow { color: var(--heat-1); text-shadow: 0 0 12px var(--heat-1); }
.sauna-term .page-title { font-size: 32px; font-weight: 900; letter-spacing: -0.03em; }

.sauna-term .status-badge {
  display: flex; align-items: center; gap: 8px;
  background: rgba(0, 255, 127, 0.05); border: 1px solid rgba(0, 255, 127, 0.2);
  padding: 8px 14px; border-radius: 8px;
  font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--success);
  box-shadow: 0 0 20px rgba(0, 255, 127, 0.1);
}
.sauna-term .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 10px var(--success); animation: sauna-pulse-green 2s infinite; }
@keyframes sauna-pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 127, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(0, 255, 127, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 255, 127, 0); }
}

.sauna-term .telemetry {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;
}
.sauna-term .t-card {
  background: rgba(15,15,18,0.8); border: 1px solid var(--border);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-radius: 16px; padding: 24px 16px; text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  transition: all 0.3s;
}
.sauna-term .t-value { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 800; color: #fff; margin-bottom: 6px; transition: color 0.3s, text-shadow 0.3s; }
.sauna-term .t-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }

body.sauna-active .sauna-term .t-card.capacity { border-color: rgba(255, 140, 0, 0.3); box-shadow: 0 20px 40px rgba(255, 140, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.05); }
body.sauna-active .sauna-term .t-card.capacity .t-value { color: var(--heat-2); text-shadow: 0 0 15px rgba(255, 140, 0, 0.4); }

.sauna-term .console {
  background: linear-gradient(180deg, rgba(25,25,30,0.9) 0%, rgba(10,10,12,0.95) 100%);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 20px; margin-bottom: 32px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.05);
  position: relative; z-index: 10;
}
.sauna-term .checkin-row { display: flex; gap: 12px; align-items: stretch; }
.sauna-term .checkin-id {
  flex: 1; min-width: 0;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; padding: 10px 16px;
  display: flex; flex-direction: column; justify-content: center; gap: 2px;
  min-height: 60px;
}
.sauna-term .checkin-id-label { font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); }
.sauna-term .checkin-id-name { font-size: 18px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sauna-term .btn-checkin-out {
  background: linear-gradient(135deg, #00C853, #00FF7F) !important;
  box-shadow: 0 10px 20px rgba(0, 255, 127, 0.25), inset 0 2px 2px rgba(255,255,255,0.3) !important;
  color: #002b14 !important;
}
.sauna-term .btn-checkin-out:active:not(:disabled) {
  box-shadow: 0 5px 10px rgba(0, 255, 127, 0.35), inset 0 2px 2px rgba(255,255,255,0.1) !important;
}

.sauna-term .search-row { display: flex; gap: 12px; position: relative; }
.sauna-term .input-wrap { flex: 1; position: relative; }
.sauna-term .input-wrap svg.search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; stroke: var(--text-muted); z-index: 2; transition: stroke 0.3s; pointer-events: none; }
.sauna-term .input-wrap input:focus ~ svg.search-icon { stroke: var(--gold-2); }
.sauna-term .search-input {
  width: 100%; height: 60px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
  color: #fff; font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600;
  padding: 0 16px 0 50px; border-radius: 14px; transition: all 0.3s;
}
.sauna-term .search-input:focus { outline: none; border-color: var(--gold-2); box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.15); background: rgba(0,0,0,0.9); }

.sauna-term .btn-nfc {
  width: 60px; height: 60px; border-radius: 14px; flex-shrink: 0;
  background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.2);
  display: grid; place-items: center; color: var(--gold-2); cursor: pointer; transition: all 0.2s;
  position: relative; overflow: hidden;
}
.sauna-term .btn-nfc:active { transform: scale(0.9); background: rgba(212, 175, 55, 0.2); }
.sauna-term .btn-nfc.scanning { border-style: solid; border-color: var(--gold-2); background: rgba(212, 175, 55, 0.1); }
.sauna-term .btn-nfc.scanning svg { animation: sauna-scan-wave 1.5s infinite; }
@keyframes sauna-scan-wave { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }

.sauna-term .btn-checkin {
  width: 100%; height: 64px; margin-top: 16px;
  background: linear-gradient(135deg, var(--heat-2), var(--heat-1));
  color: #fff; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;
  border-radius: 14px; border: none; cursor: pointer;
  box-shadow: 0 10px 20px rgba(255, 69, 0, 0.3), inset 0 2px 2px rgba(255,255,255,0.3);
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex; align-items: center; justify-content: center; gap: 12px;
}
.sauna-term .btn-checkin:disabled { opacity: 0.5; cursor: not-allowed; }
.sauna-term .btn-checkin:active:not(:disabled) { transform: scale(0.96); box-shadow: 0 5px 10px rgba(255, 69, 0, 0.4), inset 0 2px 2px rgba(255,255,255,0.1); }
.sauna-term .btn-checkin svg { transition: transform 0.3s; }
.sauna-term .btn-checkin:hover:not(:disabled) svg { transform: translateX(4px); }

.sauna-term .autocomplete {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: rgba(15,15,18,0.98); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.9);
  opacity: 0; pointer-events: none; transform: translateY(-10px); transition: all 0.2s; overflow: hidden;
  max-height: 300px; overflow-y: auto; z-index: 20;
}
.sauna-term .autocomplete.show { opacity: 1; pointer-events: all; transform: translateY(0); }
.sauna-term .ac-item { padding: 16px 20px; display: flex; align-items: center; gap: 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); }
.sauna-term .ac-item:hover, .sauna-term .ac-item.active { background: rgba(255,255,255,0.08); }
.sauna-term .ac-avatar { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.1); display: grid; place-items: center; font-size: 12px; font-weight: 800; color: #fff; }
.sauna-term .ac-name { font-size: 16px; font-weight: 700; color: #fff; }
.sauna-term .ac-empty { padding: 20px; text-align: center; color: var(--text-muted); font-size: 14px; }

.sauna-term .section-lbl { font-size: 12px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.sauna-term .section-lbl::after { content: ''; flex: 1; height: 1px; background: var(--border); }

.sauna-term .empty-state {
  background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 20px; padding: 50px 20px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  transition: all 0.4s; margin-bottom: 32px;
}
.sauna-term .empty-icon { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.05); display: grid; place-items: center; color: var(--text-muted); }
.sauna-term .empty-title { font-size: 16px; font-weight: 800; color: #fff; }
.sauna-term .empty-sub { font-size: 14px; color: var(--text-muted); }

.sauna-term .roster-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

.sauna-term .roster-card {
  background: rgba(20, 20, 24, 0.7); border: 1px solid rgba(255, 69, 0, 0.3);
  border-radius: 16px; padding: 16px 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 0 30px rgba(255, 69, 0, 0.05);
  animation: sauna-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  position: relative; overflow: hidden; display: flex; align-items: center; gap: 16px;
}
@keyframes sauna-slide-in { 0% { opacity: 0; transform: translateY(20px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
.sauna-term .roster-card.exiting { animation: sauna-slide-out 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes sauna-slide-out { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); margin-bottom: -16px; padding: 0; height: 0; border-color: transparent; } }

.sauna-term .r-avatar-wrap { position: relative; width: 52px; height: 52px; flex-shrink: 0; }
.sauna-term .r-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent, var(--heat-2), var(--heat-1), transparent 60%);
  animation: sauna-spin 1.5s linear infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out; mask-composite: exclude; padding: 2px;
}
@keyframes sauna-spin { 100% { transform: rotate(360deg); } }
.sauna-term .r-avatar {
  width: 100%; height: 100%; border-radius: 50%; background: #111; border: 2px solid #000;
  display: grid; place-items: center; font-size: 16px; font-weight: 900; color: #fff; position: relative; z-index: 2;
}

.sauna-term .r-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.sauna-term .r-top-row { display: flex; justify-content: space-between; align-items: center; }
.sauna-term .r-name { font-size: 18px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sauna-term .r-timer { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: var(--heat-2); text-shadow: 0 0 10px rgba(255, 140, 0, 0.5); }
.sauna-term .r-timer.warning { color: var(--gold-3); text-shadow: 0 0 10px rgba(255, 223, 0, 0.5); animation: sauna-pulse-text 2s infinite; }
.sauna-term .r-timer.danger { color: var(--danger); text-shadow: 0 0 10px rgba(255, 0, 0, 0.8); animation: sauna-pulse-fast 1s infinite; }

@keyframes sauna-pulse-text { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes sauna-pulse-fast { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.05); } }

.sauna-term .r-bar-bg { width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 4px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
.sauna-term .r-bar-fill { height: 100%; background: linear-gradient(90deg, var(--heat-2), var(--heat-1)); width: 0%; transition: width 1s linear, background 0.5s; }
.sauna-term .r-bar-fill.warning { background: linear-gradient(90deg, var(--gold-2), var(--gold-3)); }
.sauna-term .r-bar-fill.danger { background: var(--danger); box-shadow: 0 0 10px var(--danger); }

.sauna-term .btn-checkout {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; margin-left: 8px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  display: grid; place-items: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
}
.sauna-term .btn-checkout:active { transform: scale(0.9); }
.sauna-term .btn-checkout.ready { background: rgba(255, 0, 0, 0.1); border-color: rgba(255, 0, 0, 0.4); color: #ff4444; }

.sauna-term .rules-box {
  background: rgba(12,12,14,0.6); border: 1px solid var(--border); border-radius: 16px; padding: 20px;
}
.sauna-term .rules-title { font-size: 14px; font-weight: 800; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.sauna-term .rules-title svg { stroke: var(--gold-2); width: 18px; }
.sauna-term .rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sauna-term .rule-pill {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid rgba(255,255,255,0.03);
}
.sauna-term .rule-pill svg { width: 16px; height: 16px; stroke: var(--gold-2); flex-shrink: 0; }
.sauna-term .rule-pill span { font-size: 11px; font-weight: 600; color: #ccc; line-height: 1.3; }
`;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMMSS(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function injectCSSOnce() {
  if (document.getElementById("sauna-terminal-css")) return;
  const style = document.createElement("style");
  style.id = "sauna-terminal-css";
  style.textContent = CSS;
  document.head.appendChild(style);
}

export default function SaunaPage({ onBack }: { onBack?: () => void } = {}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const memberName = useMemo(() => {
    try {
      const profile = JSON.parse(localStorage.getItem("lbjj_member_profile") || "{}");
      const name = String(profile.name || profile.Name || "").trim();
      return name || "Member";
    } catch {
      return "Member";
    }
  }, []);

  // Inject CSS + set body bg + furnace glow element
  useEffect(() => {
    injectCSSOnce();
    const prevBg = document.body.style.background;
    document.body.style.background = "#000";

    let glow = document.getElementById("sauna-furnace-glow");
    let createdGlow = false;
    if (!glow) {
      glow = document.createElement("div");
      glow.id = "sauna-furnace-glow";
      document.body.appendChild(glow);
      createdGlow = true;
    }

    return () => {
      document.body.style.background = prevBg;
      document.body.classList.remove("sauna-active");
      if (createdGlow && glow && glow.parentNode) glow.parentNode.removeChild(glow);
    };
  }, []);

  // Toggle body.sauna-active based on active sessions count
  useEffect(() => {
    if (sessions.length > 0) document.body.classList.add("sauna-active");
    else document.body.classList.remove("sauna-active");
  }, [sessions.length]);

  // Load active sessions + poll every 30s (pause when hidden)
  const refresh = useCallback(async () => {
    try {
      const res = await gasCall("getActiveSessions", {});
      const raw: any[] = res?.sessions || res?.active || [];
      const daily = typeof res?.dailyTotal === "number"
        ? res.dailyTotal
        : typeof res?.todayCount === "number"
          ? res.todayCount
          : 0;
      setDailyTotal(daily);

      setSessions((prev) => {
        const next: Session[] = raw.map((s: any) => {
          const name = String(s?.name || "").trim();
          const id = s?.id ?? name;
          let seconds = 0;
          if (typeof s?.secondsElapsed === "number") {
            seconds = Math.max(0, Math.floor(s.secondsElapsed));
          } else if (s?.checkedInAt || s?.checkIn) {
            const t = new Date(s.checkedInAt || s.checkIn).getTime();
            if (!isNaN(t)) seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
          }
          // If we already have local session for this id/name, prefer our local tick
          // but reconcile with server if drift > 5s.
          const existing = prev.find((p) => p.id === id || p.name === name);
          if (existing && !existing.exiting) {
            const drift = Math.abs(existing.seconds - seconds);
            return {
              id: existing.id,
              name,
              initials: getInitials(name),
              seconds: drift > 5 ? seconds : existing.seconds,
            };
          }
          return {
            id,
            name,
            initials: getInitials(name),
            seconds,
          };
        });

        // Keep any currently-exiting cards so their animation finishes
        const exiting = prev.filter((p) => p.exiting && !next.find((n) => n.id === p.id));
        return [...next, ...exiting];
      });
    } catch (e) {
      console.warn("getActiveSessions failed", e);
    }
  }, []);

  useEffect(() => {
    refresh();
    let timer: number | null = null;
    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(() => {
        if (!document.hidden) refresh();
      }, POLL_MS);
    };
    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const onVis = () => {
      if (document.hidden) stop();
      else {
        refresh();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  // Tick local timers every 1s for non-exiting sessions
  useEffect(() => {
    const iv = window.setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => (s.exiting ? s : { ...s, seconds: s.seconds + 1 })),
      );
    }, 1000);
    return () => window.clearInterval(iv);
  }, []);

  const simulateNFC = () => {
    setScanning(true);
    window.setTimeout(() => setScanning(false), 1000);
  };

  const mySession = useMemo(
    () =>
      sessions.find(
        (s) => !s.exiting && s.name.toLowerCase() === memberName.toLowerCase(),
      ),
    [sessions, memberName],
  );

  const checkIn = async () => {
    if (submitting) return;
    if (sessions.length >= MAX_CAPACITY) return;
    const name = memberName.trim();
    if (!name || name === "Member") return;
    if (mySession) return;

    setSubmitting(true);
    const optimistic: Session = {
      id: `local-${Date.now()}`,
      name,
      initials: getInitials(name),
      seconds: 0,
    };
    setSessions((prev) => [optimistic, ...prev]);

    try {
      const res = await saunaCheckin(name);
      const serverId = res?.session?.id;
      if (serverId) {
        setSessions((prev) =>
          prev.map((s) => (s.id === optimistic.id ? { ...s, id: serverId } : s)),
        );
      }
      setTimeout(() => refresh(), 500);
    } catch (e) {
      console.error("sauna checkin failed", e);
      setSessions((prev) => prev.filter((s) => s.id !== optimistic.id));
    } finally {
      setSubmitting(false);
    }
  };

  const checkOut = async (id: Session["id"]) => {
    const target = sessions.find((s) => s.id === id);
    if (!target || target.exiting) return;

    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, exiting: true } : s)));
    setDailyTotal((n) => n + 1);

    try {
      await saunaCheckout(target.name);
    } catch (e) {
      console.error("sauna checkout failed", e);
    }

    window.setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      refresh();
    }, 400);
  };

  const checkOutMe = async () => {
    if (mySession) await checkOut(mySession.id);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else window.location.hash = "#/";
  };

  const currentCount = sessions.filter((s) => !s.exiting).length;
  const canCheckIn =
    !submitting &&
    currentCount < MAX_CAPACITY &&
    !mySession &&
    memberName.trim().length > 0 &&
    memberName !== "Member";

  return (
    <div className="sauna-term" ref={wrapRef}>
      <button className="sauna-back" onClick={handleBack} aria-label="Back to home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="terminal-wrapper">
        <div className="header">
          <div className="title-block">
            <div className="eyebrow">Recovery System</div>
            <div className="page-title">Sauna Terminal</div>
          </div>
          <div className="status-badge">
            <div className="dot" /> Linked
          </div>
        </div>

        <div className="telemetry">
          <div className="t-card capacity">
            <div className="t-value">
              <span>{currentCount}</span>
              <span style={{ color: "#666", fontSize: 24 }}>/{MAX_CAPACITY}</span>
            </div>
            <div className="t-label">Capacity</div>
          </div>
          <div className="t-card">
            <div className="t-value">{dailyTotal}</div>
            <div className="t-label">Daily Uses</div>
          </div>
        </div>

        <div className="console">
          <div className="checkin-row">
            <div className="checkin-id">
              <div className="checkin-id-label">Checking in as</div>
              <div className="checkin-id-name">{memberName}</div>
            </div>
            <button
              className={`btn-nfc ${scanning ? "scanning" : ""}`}
              onClick={simulateNFC}
              aria-label="Scan NFC"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 8v8M8 6v12M12 4v16M16 6v12M20 8v8" />
              </svg>
            </button>
          </div>

          {mySession ? (
            <button
              className="btn-checkin btn-checkin-out"
              onClick={checkOutMe}
              disabled={submitting}
              type="button"
            >
              You're In — Check Out
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9 10 4 15 9 20" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
            </button>
          ) : (
            <button
              className="btn-checkin"
              onClick={checkIn}
              disabled={!canCheckIn}
              type="button"
            >
              Check Me In
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>

        <div className="section-lbl">Active Sessions</div>

        {currentCount === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <div className="empty-title">Sauna is empty</div>
              <div className="empty-sub">Awaiting authorization scan.</div>
            </div>
          </div>
        ) : null}

        <div className="roster-list">
          {sessions.map((s) => {
            const warning = s.seconds >= 15 * 60 && s.seconds < MAX_TIME_SEC;
            const danger = s.seconds >= MAX_TIME_SEC;
            const pct = Math.min((s.seconds / MAX_TIME_SEC) * 100, 100);
            const timerCls = danger ? "danger" : warning ? "warning" : "";
            const barCls = danger ? "danger" : warning ? "warning" : "";
            const btnCls = warning || danger ? "ready" : "";
            return (
              <div
                key={String(s.id)}
                className={`roster-card ${s.exiting ? "exiting" : ""}`}
              >
                <div className="r-avatar-wrap">
                  <div className="r-ring" />
                  <div className="r-avatar">{s.initials}</div>
                </div>
                <div className="r-info">
                  <div className="r-top-row">
                    <div className="r-name">{s.name}</div>
                    <div className={`r-timer ${timerCls}`}>{formatMMSS(s.seconds)}</div>
                  </div>
                  <div className="r-bar-bg">
                    <div
                      className={`r-bar-fill ${barCls}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <button
                  className={`btn-checkout ${btnCls}`}
                  onClick={() => checkOut(s.id)}
                  aria-label={`Check out ${s.name}`}
                  type="button"
                  disabled={!!s.exiting}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 10 4 15 9 20" />
                    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        <div className="rules-box">
          <div className="rules-title">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Facility Protocols
          </div>
          <div className="rules-grid">
            <div className="rule-pill">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="M8 17l4 4 4-4" />
              </svg>
              <span>Shower before entry</span>
            </div>
            <div className="rule-pill">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span>No shoes allowed</span>
            </div>
            <div className="rule-pill">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M12 12v.01" />
              </svg>
              <span>Towel required</span>
            </div>
            <div className="rule-pill">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="3" y1="3" x2="21" y2="21" />
              </svg>
              <span>No devices / calls</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
