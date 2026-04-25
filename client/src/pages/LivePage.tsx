import { useState, useEffect, useRef } from "react";
import { getStreamStatus, getStreamArchive, getEmbedUrl, getNextStreams } from "@/lib/streaming";
import type { StreamStatus, ArchiveEntry, NextUpItem } from "@/lib/streaming";
import { gasCall, getToken } from "@/lib/api";
import { SkeletonCard, ErrorState } from "@/components/StateComponents";
import { X, Bell } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
interface FloatingReaction {
  id: number;
  emoji: string;
  lane: number;
  duration: number;
}

// ── Constants ────────────────────────────────────────────────────
const REACTION_EMOJIS = ["🔥", "💪", "🥋", "👏", "⚡", "🤙"];
const CATEGORY_FILTERS = ["All", "Gi", "No-Gi", "Kids", "Comp", "Open Mat"];
const CHAT_EMBED_BASE = "https://www.youtube.com/live_chat";
const STYLE_ID = "lbjj-live-v3-styles";

// ── CSS ──────────────────────────────────────────────────────────
const LIVE_CSS = `
.lv3-root {
  --gold: #D4AF37; --gold2: #E8AF34;
  --surface: rgba(18,18,22,0.65);
  --surface-hover: rgba(25,25,30,0.75);
  --border: rgba(255,255,255,0.05);
  --muted: #888890;
  font-family: system-ui, sans-serif;
  background: #030305;
  color: #F8F8F8;
  min-height: 100vh;
  position: relative;
}
.lv3-root *, .lv3-root *::before, .lv3-root *::after {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

/* Ambient orbs */
.lv3-ambient { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.lv3-orb { position: absolute; border-radius: 50%; filter: blur(90px); mix-blend-mode: screen; }
.lv3-orb1 { width: 60vw; height: 60vw; background: #D4AF37; opacity: 0.12; top: -10%; left: -20%; animation: lv3-drift 20s ease-in-out infinite alternate; }
.lv3-orb2 { width: 50vw; height: 50vw; background: #1A56DB; opacity: 0.12; bottom: 10%; right: -10%; animation: lv3-drift 25s ease-in-out infinite alternate-reverse; }
@keyframes lv3-drift { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(30px,40px) scale(1.1); } }

/* Layout */
.lv3-content { position: relative; z-index: 1; }
.lv3-scroll { overflow-y: auto; scrollbar-width: none; padding: 0 20px max(100px, calc(env(safe-area-inset-bottom,0px) + 90px)); }
.lv3-scroll::-webkit-scrollbar { display: none; }

/* Header */
.lv3-header {
  padding: 20px 20px 14px; display: flex; justify-content: space-between; align-items: center;
  background: rgba(3,3,5,0.75); backdrop-filter: blur(30px) saturate(120%); -webkit-backdrop-filter: blur(30px) saturate(120%);
  border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 40;
}
.lv3-header h1 { font-size: 24px; font-weight: 900; color: #fff; margin: 0; letter-spacing: -0.02em; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.lv3-header p { font-size: 13px; color: var(--muted); margin: 2px 0 0; font-weight: 600; }
.lv3-close-btn {
  width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.03);
  border: 1px solid var(--border); color: var(--muted); display: grid; place-items: center;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1); cursor: pointer; text-decoration: none;
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.05);
}
.lv3-close-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.08); color: #fff; }

/* Section labels */
.lv3-section-label {
  font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 16px; display: flex; align-items: center; gap: 12px;
}
.lv3-section-label::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, var(--border), transparent); }

/* Live glass wrapper */
.lv3-live-wrap {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 28px; padding: 8px; margin-top: 16px;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08);
  position: relative;
}
.lv3-live-wrap::before {
  content: ''; position: absolute; inset: -1px; border-radius: 29px;
  background: linear-gradient(180deg, rgba(239,68,68,0.25), transparent 40%);
  z-index: -1; pointer-events: none;
}
.lv3-live-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px 14px; }
.lv3-live-title { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.lv3-live-inst { font-size: 12px; color: var(--muted); font-weight: 500; margin-top: 2px; }
.lv3-live-badge {
  display: inline-flex; align-items: center; gap: 6px; background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.4); color: #ff5555; font-size: 10px; font-weight: 900;
  letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
  box-shadow: 0 0 15px rgba(239,68,68,0.2);
}
.lv3-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff5555; box-shadow: 0 0 8px #ff5555; animation: lv3-dot-pulse 1.5s ease-in-out infinite; }
@keyframes lv3-dot-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(0.8); } }

/* Video embed */
.lv3-video-wrap { position: relative; width: 100%; padding-top: 56.25%; border-radius: 20px; overflow: hidden; background: #0A0A0C; box-shadow: inset 0 2px 10px rgba(0,0,0,0.8); }
.lv3-video-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }

/* Chat embed */
.lv3-chat-wrap {
  height: 200px; margin-top: 8px; border-radius: 18px;
  background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.04);
  box-shadow: inset 0 4px 15px rgba(0,0,0,0.8);
  overflow: hidden; position: relative;
}
.lv3-chat-wrap iframe { width: 100%; height: 100%; border: none; }
.lv3-chat-header {
  padding: 10px 14px; font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 0.05em;
  text-transform: uppercase; background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex; justify-content: space-between; align-items: center;
}
.lv3-chat-count { color: var(--gold); font-size: 10px; font-weight: 700; }

/* Reactions zone overlaid on chat */
.lv3-reactions-area { position: absolute; bottom: 60px; right: 8px; width: 100px; height: 130px; overflow: visible; pointer-events: none; z-index: 10; }
@keyframes lv3-reaction-float {
  0%   { transform: translateY(20px) scale(0.5) rotate(0deg); opacity: 0; }
  20%  { transform: translateY(0) scale(1.4) rotate(-10deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(-130px) scale(1) rotate(15deg); opacity: 0; }
}
.lv3-floating-reaction { position: absolute; bottom: 0; font-size: 30px; animation: lv3-reaction-float var(--dur, 2.5s) cubic-bezier(0.16,1,0.3,1) forwards; pointer-events: none; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.8)); }

/* Reaction buttons */
.lv3-reaction-row { display: flex; gap: 8px; justify-content: center; margin-top: 8px; padding: 0 4px 4px; }
.lv3-reaction-btn {
  flex: 1; max-width: 56px; font-size: 22px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 12px 0; cursor: pointer; outline: none;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1); box-shadow: inset 0 1px 1px rgba(255,255,255,0.03);
  position: relative; overflow: hidden;
}
.lv3-reaction-btn::after {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(212,175,55,0.4) 0%, transparent 70%);
  opacity: 0; transition: opacity 0.2s; pointer-events: none;
}
.lv3-reaction-btn:active { transform: scale(0.85); background: rgba(212,175,55,0.1); border-color: rgba(212,175,55,0.5); box-shadow: 0 4px 12px rgba(212,175,55,0.2); }
.lv3-reaction-btn:active::after { opacity: 1; }

/* Notifications toggle */
.lv3-notify-glass {
  background: var(--surface); border: 1px solid var(--border); border-radius: 24px;
  padding: 16px 20px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05);
  cursor: pointer; transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  -webkit-user-select: none; user-select: none;
}
.lv3-notify-glass:active { transform: scale(0.97); background: var(--surface-hover); }
.lv3-notify-left { display: flex; align-items: center; gap: 14px; }
.lv3-notify-icon {
  width: 42px; height: 42px; border-radius: 14px;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
  border: 1px solid var(--border); display: grid; place-items: center; color: var(--muted); transition: all 0.3s;
}
.lv3-notify-glass.on .lv3-notify-icon { background: rgba(212,175,55,0.15); border-color: rgba(212,175,55,0.4); color: var(--gold); box-shadow: 0 0 15px rgba(212,175,55,0.2); }
.lv3-notify-title { font-size: 15px; font-weight: 800; color: #fff; letter-spacing: -0.01em; }
.lv3-notify-sub { font-size: 12px; color: var(--muted); margin-top: 2px; font-weight: 500; transition: color 0.3s; }
.lv3-notify-glass.on .lv3-notify-sub { color: rgba(212,175,55,0.8); }
.lv3-switch { width: 50px; height: 30px; border-radius: 15px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); position: relative; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); flex-shrink: 0; }
.lv3-switch-thumb { position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; border-radius: 50%; background: #666; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
.lv3-notify-glass.on .lv3-switch { background: rgba(212,175,55,0.2); border-color: var(--gold); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2), 0 0 10px rgba(212,175,55,0.2); }
.lv3-notify-glass.on .lv3-switch-thumb { left: 22px; background: linear-gradient(135deg, #FFF0B3, #D4AF37); box-shadow: 0 2px 8px rgba(212,175,55,0.5), inset 0 1px 1px rgba(255,255,255,0.8); }

/* Next Up cards */
.lv3-nextup-card {
  display: flex; gap: 16px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 16px; transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); margin-bottom: 10px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.05);
}
.lv3-nextup-card:active { transform: scale(0.97); background: var(--surface-hover); }
.lv3-nextup-time {
  flex-shrink: 0; text-align: center; border-right: 1px solid var(--border);
  padding-right: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 68px;
}
.lv3-nextup-time-label { font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.lv3-nextup-time-num { font-size: 20px; font-weight: 900; color: #fff; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
.lv3-nextup-time-ampm { font-size: 11px; font-weight: 800; color: var(--muted); margin-top: 4px; }
.lv3-nextup-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.lv3-nextup-title { font-size: 16px; font-weight: 800; color: #fff; margin-bottom: 4px; letter-spacing: -0.01em; }
.lv3-nextup-meta { font-size: 13px; color: var(--muted); font-weight: 500; }
.lv3-nextup-pill {
  display: inline-flex; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 800;
  letter-spacing: 0.08em; text-transform: uppercase; background: rgba(212,175,55,0.1); color: var(--gold2);
  border: 1px solid rgba(212,175,55,0.2); margin-top: 8px; align-self: flex-start;
}
.lv3-nextup-pill.nogi { color: #38bdf8; background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.2); }
.lv3-nextup-pill.kids { color: #4ade80; background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.2); }

/* Offline card */
.lv3-offline-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 28px;
  padding: 48px 28px; text-align: center; margin-top: 16px; position: relative; overflow: hidden;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05);
}
.lv3-offline-rings { position: absolute; top: 20%; left: 50%; transform: translate(-50%,-50%); width: 200px; height: 200px; pointer-events: none; }
.lv3-offline-rings::before, .lv3-offline-rings::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(255,255,255,0.05);
  animation: lv3-ping 3s cubic-bezier(0.16,1,0.3,1) infinite;
}
.lv3-offline-rings::after { animation-delay: 1.5s; }
@keyframes lv3-ping { 0% { transform:scale(0.2); opacity:1; } 100% { transform:scale(1.5); opacity:0; } }
.lv3-offline-icon { font-size: 44px; margin-bottom: 16px; position: relative; z-index: 2; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }
.lv3-offline-title { font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 8px; letter-spacing: -0.01em; position: relative; z-index: 2; }
.lv3-offline-sub { font-size: 14px; color: var(--muted); line-height: 1.6; position: relative; z-index: 2; font-weight: 500; }

/* Premium filter track */
.lv3-filter-track {
  display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
  background: rgba(0,0,0,0.5); padding: 6px; border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.04); box-shadow: inset 0 4px 10px rgba(0,0,0,0.6);
  margin-bottom: 16px; align-items: center;
}
.lv3-filter-track::-webkit-scrollbar { display: none; }
.lv3-cat-btn {
  flex-shrink: 0; padding: 10px 18px; border-radius: 14px; outline: none;
  background: transparent; color: var(--muted); font-weight: 700; font-size: 13px;
  border: 1px solid transparent; cursor: pointer; transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
}
.lv3-cat-btn:active { transform: scale(0.92); }
.lv3-cat-btn.active {
  color: #000; font-weight: 800;
  background: linear-gradient(135deg, #FFF0B3, #D4AF37);
  border-color: rgba(255,255,255,0.4);
  box-shadow: 0 4px 12px rgba(212,175,55,0.4), inset 0 1px 1px rgba(255,255,255,0.8);
}

/* Archive rows */
.lv3-archive-row {
  display: flex; gap: 14px; background: rgba(18,18,22,0.5); border-radius: 18px; overflow: hidden;
  text-decoration: none; border: 1px solid var(--border); transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  margin-bottom: 12px; backdrop-filter: blur(10px); box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  align-items: stretch;
}
.lv3-archive-row:active { transform: scale(0.97); border-color: rgba(212,175,55,0.3); }
.lv3-archive-thumb { width: min(130px,32vw); flex-shrink: 0; background: #0A0A0C; position: relative; border-right: 1px solid var(--border); }
.lv3-archive-thumb img { width: 100%; height: 100%; object-fit: cover; }
.lv3-archive-thumb-empty { width: 100%; min-height: 84px; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 28px; opacity: 0.8; }
.lv3-archive-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
.lv3-archive-play-icon { width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: grid; place-items: center; border: 1px solid rgba(255,255,255,0.1); }
.lv3-archive-info { flex: 1; padding: 14px 14px 14px 0; display: flex; flex-direction: column; justify-content: center; }
.lv3-archive-title { font-size: 15px; font-weight: 800; color: #fff; margin-bottom: 6px; line-height: 1.3; letter-spacing: -0.01em; }
.lv3-archive-meta { font-size: 12px; color: var(--muted); font-weight: 500; }
.lv3-archive-instructor { font-size: 11px; color: #555; margin-top: 4px; font-weight: 600; }
.lv3-archive-pill { display: inline-flex; margin-top: 8px; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.05); color: #ccc; border: 1px solid var(--border); align-self: flex-start; }

/* Stagger */
@keyframes lv3-stagger-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
.lv3-stagger { animation: lv3-stagger-in 0.6s cubic-bezier(0.16,1,0.3,1) both; }
`;

function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = LIVE_CSS;
  document.head.appendChild(s);
}

// ── Notify Toggle ─────────────────────────────────────────────────
function NotifyToggle() {
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem("lbjj_stream_notify") === "1"; } catch { return false; }
  });

  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem("lbjj_stream_notify", next ? "1" : "0"); } catch {}
    if (navigator.vibrate) navigator.vibrate(next ? [10, 30, 10] : [10]);
  };

  return (
    <div className={`lv3-notify-glass${on ? " on" : ""}`} onClick={toggle}>
      <div className="lv3-notify-left">
        <div className="lv3-notify-icon"><Bell size={20} /></div>
        <div>
          <div className="lv3-notify-title">Stream Alerts</div>
          <div className="lv3-notify-sub">{on ? "On — We'll alert you" : "Off"}</div>
        </div>
      </div>
      <div className="lv3-switch"><div className="lv3-switch-thumb" /></div>
    </div>
  );
}

// ── Next Up Row ────────────────────────────────────────────────────
function NextUpRow({ item }: { item: NextUpItem }) {
  const [timePart, ampm] = item.time.split(" ");
  const pillClass = item.category === "No-Gi" ? "lv3-nextup-pill nogi" : item.category === "Kids" ? "lv3-nextup-pill kids" : "lv3-nextup-pill";
  return (
    <div className="lv3-nextup-card">
      <div className="lv3-nextup-time">
        <div className="lv3-nextup-time-label">{item.label}</div>
        <div className="lv3-nextup-time-num">{timePart}</div>
        <div className="lv3-nextup-time-ampm">{ampm}</div>
      </div>
      <div className="lv3-nextup-info">
        <div className="lv3-nextup-title">{item.title}</div>
        <div className="lv3-nextup-meta">w/ {item.instructor}</div>
        <div className={pillClass}>{item.category}</div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function LivePage() {
  const [stream, setStream] = useState<StreamStatus>({
    isLive: false, videoId: "", videoUrl: "", className: "",
    instructor: "", startedAt: "", durationMinutes: 0, thumbnail: "",
  });
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [archivesLoading, setArchivesLoading] = useState(true);
  const [archivesError, setArchivesError] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const laneRef = useRef(0);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  const sendReaction = (emoji: string) => {
    laneRef.current = (laneRef.current + 1) % 4;
    const id = Date.now() + Math.random();
    const duration = 2.0 + Math.random() * 0.8;
    setReactions(prev => [...prev, { id, emoji, lane: laneRef.current, duration }]);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000);
  };

  useEffect(() => {
    getStreamStatus().then(setStream).finally(() => setLoading(false));
    const iv = setInterval(() => getStreamStatus().then(setStream), 30_000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setArchivesLoading(true); setArchivesError(false);
    getStreamArchive(activeCategory || undefined)
      .then(d => { setArchives(d); setArchivesLoading(false); })
      .catch(() => { setArchivesError(true); setArchivesLoading(false); });
  }, [activeCategory]);

  const handleCatClick = (cat: string, el: HTMLButtonElement) => {
    setActiveCategory(cat === "All" ? "" : cat);
    const container = filterRef.current;
    if (container && el) {
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  };

  const [nextUp, setNextUp] = useState<NextUpItem[]>([]);
  useEffect(() => {
    getNextStreams().then(setNextUp);
  }, []);

  // ── Tune In XP ──────────────────────────────────────────────────
  const TUNE_IN_KEY = stream.videoId ? `lbjj_tunein_${stream.videoId}` : "";
  const [tunedIn, setTunedIn] = useState(false);
  const [tuningIn, setTuningIn] = useState(false);

  useEffect(() => {
    if (!TUNE_IN_KEY) { setTunedIn(false); return; }
    try { setTunedIn(!!localStorage.getItem(TUNE_IN_KEY)); } catch { setTunedIn(false); }
  }, [TUNE_IN_KEY]);

  const handleTuneIn = async () => {
    if (tunedIn || !stream.isLive || tuningIn || !TUNE_IN_KEY) return;
    setTuningIn(true);
    try {
      const token = getToken();
      if (!token) { setTuningIn(false); return; }
      const currentXP = (() => {
        try {
          const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
          return s.totalXP || s.xp || 0;
        } catch { return 0; }
      })();
      const newXP = currentXP + 15;
      try {
        const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        stats.totalXP = newXP;
        stats.xp = newXP;
        localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
        window.dispatchEvent(new Event('xp-updated'));
      } catch {}
      await gasCall('saveMemberStats', {
        token,
        totalPoints: newXP,
        source: 'stream_watch',
      });
      localStorage.setItem(TUNE_IN_KEY, '1');
      setTunedIn(true);
    } catch (e) {
      console.error('Tune in XP error:', e);
    } finally {
      setTuningIn(false);
    }
  };

  // YouTube live chat URL — only valid when actually embedded on your domain
  const chatUrl = stream.videoId
    ? `${CHAT_EMBED_BASE}?v=${stream.videoId}&embed_domain=${window.location.hostname}`
    : null;

  if (loading) {
    return (
      <div className="lv3-root app-content">
        <div className="lv3-header">
          <div><h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#fff" }}>Live</h1><p style={{ fontSize: 13, color: "#888", margin: "2px 0 0" }}>Class Streaming</p></div>
          <a href="/#/" className="lv3-close-btn"><X size={18} /></a>
        </div>
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📡</div>
          <div style={{ fontSize: 13, color: "#555" }}>Connecting…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lv3-root app-content">
      <div className="lv3-ambient">
        <div className="lv3-orb lv3-orb1" />
        <div className="lv3-orb lv3-orb2" />
      </div>

      <div className="lv3-content">
        {/* Header */}
        <div className="lv3-header">
          <div><h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#fff", letterSpacing: "-0.02em" }}>Live</h1><p style={{ fontSize: 13, color: "var(--muted)", margin: "2px 0 0", fontWeight: 600 }}>Class Streaming</p></div>
          <a href="/#/" className="lv3-close-btn"><X size={18} /></a>
        </div>

        <div className="lv3-scroll">

          {/* ══ LIVE ══ */}
          {stream.isLive && (
            <div className="lv3-stagger" style={{ animationDelay: "50ms" }}>
              <div className="lv3-live-wrap">
                <div className="lv3-live-header">
                  <div>
                    <div className="lv3-live-title">{stream.className}</div>
                    <div className="lv3-live-inst">w/ {stream.instructor}</div>
                  </div>
                  <span className="lv3-live-badge"><span className="lv3-live-dot" />LIVE</span>
                </div>

                {/* Video */}
                <div className="lv3-video-wrap">
                  <iframe
                    src={getEmbedUrl(stream.videoId)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={stream.className}
                  />
                </div>

                {/* Live Chat (YouTube embed — requires domain allowlist in YouTube Studio) */}
                {chatUrl && (
                  <div className="lv3-chat-wrap">
                    <div className="lv3-chat-header">
                      <span>Live Chat</span>
                    </div>
                    <iframe src={chatUrl} title="Live Chat" />
                    {/* Emoji reactions overlay on top of chat */}
                    <div style={{ position: "absolute", bottom: 60, right: 8, width: 100, height: 130, overflow: "visible", pointerEvents: "none", zIndex: 10 }}>
                      {reactions.map(r => (
                        <div key={r.id} className="lv3-floating-reaction"
                          style={{ right: 10 + r.lane * 22, "--dur": `${r.duration}s` } as React.CSSProperties}>
                          {r.emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reaction buttons */}
                <div className="lv3-reaction-row">
                  {REACTION_EMOJIS.map(emoji => (
                    <button key={emoji} className="lv3-reaction-btn" onClick={() => sendReaction(emoji)}>{emoji}</button>
                  ))}
                </div>

                {/* Tune In XP button */}
                <button
                  onClick={handleTuneIn}
                  disabled={tunedIn || tuningIn}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 14,
                    cursor: tunedIn ? 'default' : 'pointer',
                    background: tunedIn
                      ? 'rgba(34,197,94,0.08)'
                      : 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                    border: `1px solid ${tunedIn ? 'rgba(34,197,94,0.3)' : 'rgba(212,175,55,0.25)'}`,
                    color: tunedIn ? '#22c55e' : '#D4AF37',
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    margin: '8px 4px 4px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {tunedIn ? '✓ Tuned In — +15 XP earned' : tuningIn ? 'Checking in…' : '📡 Tune In — Earn 15 XP'}
                </button>
              </div>
            </div>
          )}

          {/* ══ OFFLINE ══ */}
          {!stream.isLive && (
            <div className="lv3-stagger" style={{ animationDelay: "50ms" }}>
              <div className="lv3-offline-card">
                <div className="lv3-offline-rings" />
                <div className="lv3-offline-icon">📡</div>
                <div className="lv3-offline-title">No class live</div>
                <div className="lv3-offline-sub">We'll alert you when a stream begins.</div>
              </div>
            </div>
          )}

          {/* ══ NOTIFY TOGGLE ══ */}
          <div className="lv3-stagger" style={{ animationDelay: "150ms" }}>
            <NotifyToggle />
          </div>

          {/* ══ NEXT UP ══ */}
          <div className="lv3-stagger" style={{ marginTop: 32, animationDelay: "200ms" }}>
            <div className="lv3-section-label">Next Up</div>
            {nextUp.map((item, i) => (
              <div key={item.id} className="lv3-stagger" style={{ animationDelay: `${250 + i * 50}ms` }}>
                <NextUpRow item={item} />
              </div>
            ))}
          </div>

          {/* ══ ARCHIVE ══ */}
          <div className="lv3-stagger" style={{ marginTop: 32, animationDelay: "350ms" }}>
            <div className="lv3-section-label">Class Archive</div>

            <div className="lv3-filter-track" ref={filterRef}>
              {CATEGORY_FILTERS.map(cat => (
                <button
                  key={cat}
                  className={`lv3-cat-btn${activeCategory === (cat === "All" ? "" : cat) ? " active" : ""}`}
                  onClick={e => handleCatClick(cat, e.currentTarget)}
                >{cat}</button>
              ))}
            </div>

            {archivesLoading ? (
              <SkeletonCard rows={3} />
            ) : archivesError ? (
              <ErrorState heading="Couldn't load archives" message="Pull down to retry." onRetry={() => window.location.reload()} compact />
            ) : archives.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#555", fontSize: 13 }}>
                No recordings yet — past streams will appear here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {archives.map((entry, i) => (
                  <a key={entry.archiveId} href={entry.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="lv3-archive-row lv3-stagger" style={{ animationDelay: `${400 + i * 40}ms` }}>
                    <div className="lv3-archive-thumb">
                      {entry.thumbnail
                        ? <img src={entry.thumbnail} alt={entry.title} />
                        : <div className="lv3-archive-thumb-empty">🎥</div>}
                      <div className="lv3-archive-play">
                        <div className="lv3-archive-play-icon">
                          <svg width="10" height="12" viewBox="0 0 10 12" fill="#fff"><polygon points="1,1 9,6 1,11" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="lv3-archive-info">
                      <div className="lv3-archive-title">{entry.title}</div>
                      <div className="lv3-archive-meta">{entry.date} · {entry.duration}</div>
                      <div className="lv3-archive-instructor">w/ {entry.instructor}</div>
                      {entry.category && <span className="lv3-archive-pill">{entry.category}</span>}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
