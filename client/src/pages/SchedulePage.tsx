import { CheckCircleFilledIcon } from "@/components/icons/LbjjIcons";
import { useState, useEffect, useRef, useCallback } from "react";
import { CLASS_SCHEDULE, CLASS_TYPE_COLORS, DAYS_ORDER } from "@/lib/constants";
import type { ClassScheduleItem } from "@/lib/constants";
import { getScheduleClasses, gasCall, getMemberData, saveMemberStats, syncAchievements, getLeaderboardFresh } from "@/lib/api";
import { Clock, X, User, CheckCircle, Trophy, ChevronRight } from "lucide-react";
import { checkAndUnlockAchievements, ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { validateGeoIfRequired } from "@/lib/geo";
import { getStreamStatus, getLiveBadgeStyle } from "@/lib/streaming";
import { LiveStreamBanner } from "@/components/LiveStreamBanner";
import type { StreamStatus } from "@/lib/streaming";

// ── Helpers ─────────────────────────────────────────────────────

const getScheduleTodayKey = (email?: string) =>
  'lbjj_checkins_' + new Date().toISOString().split('T')[0] + (email ? '_' + email : '');

function formatClassTime(timeStr: string): string {
  if (!timeStr) return "";
  const [time, period] = timeStr.trim().split(" ");
  return `${time} ${(period || "AM").toUpperCase()}`;
}

function getDuration(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("3") && n.includes("6")) return "30 min";
  if (n.includes("open mat")) return "90 min";
  return "1 hr";
}
function getDurationMinutes(name: string): number {
  const n = (name || "").toLowerCase();
  if (n.includes("3") && n.includes("6")) return 30;
  if (n.includes("open mat")) return 90;
  return 60;
}

function triggerConfetti() {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);
  const colors = ['#e8af34', '#fde047', '#FFD700', '#FFF8DC', '#ffffff'];
  for (let i = 0; i < 40; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 8 + 4;
    const x = Math.random() * 100;
    const duration = Math.random() * 800 + 600;
    const delay = Math.random() * 300;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const endY = -(Math.random() * 60 + 40);
    const endX = (Math.random() - 0.5) * 40;
    dot.style.cssText = `
      position:absolute;bottom:30%;left:${x}%;
      width:${size}px;height:${size}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      background:${color};
      animation:confettiFly_s${i} ${duration}ms ${delay}ms ease-out forwards;
    `;
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFly_s${i} {
        0%{transform:translate(0,0) rotate(0deg);opacity:1;}
        100%{transform:translate(${endX}vw,${endY}vh) rotate(${Math.random()*720}deg);opacity:0;}
      }`;
    document.head.appendChild(style);
    container.appendChild(dot);
  }
  setTimeout(() => container.remove(), 2000);
}

function spawnParticles(x: number, y: number, color: string, count = 20) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const size = count > 30 ? Math.random() * 8 + 4 : Math.random() * 6 + 3;
    p.style.cssText = `
      position:fixed;width:${size}px;height:${size}px;border-radius:50%;
      background:${color};box-shadow:0 0 12px ${color};
      pointer-events:none;z-index:9999;
      left:${x}px;top:${y}px;transform:translate(-50%,-50%);
    `;
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const v = (count > 30 ? 120 : 60) + Math.random() * 100;
    const tx = x + Math.cos(angle) * v;
    const ty = y + Math.sin(angle) * v;
    p.animate(
      [{ transform: 'translate(-50%,-50%) scale(1)', opacity: '1' },
       { transform: `translate(calc(${tx-x}px - 50%),calc(${ty-y}px - 50%)) scale(0)`, opacity: '0' }],
      { duration: 600 + Math.random() * 400, easing: 'cubic-bezier(0,0.5,0.5,1)', fill: 'forwards' }
    ).onfinish = () => p.remove();
  }
}

// ── Main Page ────────────────────────────────────────────────────

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return DAYS_ORDER.includes(today) ? today : "Monday";
  });
  const [category, setCategory] = useState<"all" | "adult" | "kids">("all");
  const [classes, setClasses] = useState<ClassScheduleItem[]>(CLASS_SCHEDULE);
  const [stream, setStream] = useState<StreamStatus | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const dedupEmail = getMemberData()?.email || '';
  const [checkedInClasses, setCheckedInClasses] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(getScheduleTodayKey(dedupEmail)) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const email = getMemberData()?.email || '';
    try { localStorage.setItem(getScheduleTodayKey(email), JSON.stringify(checkedInClasses)); } catch {}
  }, [checkedInClasses]);

  useEffect(() => {
    const memberEmail = getMemberData()?.email || '';
    if (memberEmail) {
      gasCall('getMemberCheckIns', { email: memberEmail }).then((res: any) => {
        const today = new Date().toISOString().split('T')[0];
        const todayNames = (res?.checkIns || [])
          .filter((c: any) => (c.date || c.timestamp || '').startsWith(today))
          .map((c: any) => c.className);
        if (todayNames.length > 0) setCheckedInClasses(prev => Array.from(new Set([...prev, ...todayNames])));
      }).catch(() => {});
    }
  }, []);

  const markClassCheckedIn = useCallback((className: string) => {
    setCheckedInClasses(prev => Array.from(new Set([...prev, className])));
  }, []);

  useEffect(() => { getStreamStatus().then(setStream); }, []);

  useEffect(() => {
    getScheduleClasses().then((gasClasses) => {
      if (!gasClasses.length) return;
      const norm = (s: string) => (s || '').toLowerCase().replace(/[\u2013\u2014]/g, '-').trim();
      const merged = CLASS_SCHEDULE.map((cls) => {
        const match = gasClasses.find(
          (g: any) =>
            (g.day === cls.day && g.time === cls.time && norm(g.title) === norm(cls.name))
        );
        if (!match) return cls;
        return {
          ...cls,
          instructor: match.instructor || cls.instructor,
          capacity: match.capacity != null ? Number(match.capacity) : cls.capacity,
          enrolled: match.enrolled != null ? Number(match.enrolled) : cls.enrolled,
        };
      });
      setClasses(merged);
    });
  }, []);

  // Scroll selected day into view in timeline
  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const idx = DAYS_ORDER.indexOf(selectedDay);
    const node = timeline.children[idx] as HTMLElement;
    if (node) node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDay]);

  const dayClasses = classes.filter(c => {
    if (c.day !== selectedDay) return false;
    if (category !== "all" && c.category !== category) return false;
    return true;
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const totalCheckedInToday = checkedInClasses.length;
  const floatingTrackState =
    totalCheckedInToday >= 3 ? 3 :
    totalCheckedInToday === 2 ? 2 :
    totalCheckedInToday === 1 ? 1 : 0;

  const ftColors = ['#e8af34', '#22c55e', '#0ea5e9', '#ef4444'];
  const ftLabels = ['Daily Training', 'Daily Training', 'Double Header', 'Savage Mode'];
  const ftFraction = floatingTrackState >= 3 ? 'SAVAGE' : `${floatingTrackState}/3`;
  const ftFillWidths = ['0%', '33.33%', '66.66%', '100%'];
  const ftFillBgs = [
    'linear-gradient(90deg,#6b4a00,#e8af34)',
    'linear-gradient(90deg,#15803d,#22c55e)',
    'linear-gradient(90deg,#0369a1,#0ea5e9)',
    'linear-gradient(90deg,#991b1b,#ef4444)',
  ];

  // Build 7-day timeline with real dates
  const today7 = new Date();
  const todayDayIdx = today7.getDay(); // 0=Sun
  const mondayOffset = (todayDayIdx + 6) % 7;
  const weekStart = new Date(today7);
  weekStart.setDate(today7.getDate() - mondayOffset);

  const dayNodes = DAYS_ORDER.map((dayName, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return { dayName, num: d.getDate(), abbr: dayName.slice(0, 3), isToday: dayName === today };
  });

  return (
    <>
      <style>{`
        @keyframes sch-card-pulse {
          0%   { box-shadow: 0 0 30px rgba(239,68,68,0.15); }
          100% { box-shadow: 0 0 50px rgba(239,68,68,0.3); }
        }
        @keyframes sch-ft-pulse {
          0%   { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(239,68,68,0.2); }
          100% { box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 60px rgba(239,68,68,0.4); }
        }
        @keyframes sch-btn-sweep {
          0%   { left:-100%; }
          20%  { left:200%; }
          100% { left:200%; }
        }
        @keyframes sch-btn-breathe {
          0%   { box-shadow:0 4px 16px rgba(232,175,52,0.3),inset 0 2px 2px rgba(255,255,255,0.6); }
          100% { box-shadow:0 8px 24px rgba(232,175,52,0.6),inset 0 2px 2px rgba(255,255,255,0.8); }
        }
        @keyframes sch-stagger-in {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .sch-stagger { animation: sch-stagger-in 0.5s var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1)) both; }
        .sch-timeline::-webkit-scrollbar { display:none; }
        .sch-list::-webkit-scrollbar { display:none; }
      `}</style>

      {/* Live Stream Banner */}
      <LiveStreamBanner stream={stream} />

      {/* Full-screen overlay */}
      <div className="app-content" style={{
        background: '#030303',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* ── Header ── */}
        <div className="sch-stagger" style={{
          padding: '20px 20px 14px',
          background: 'rgba(3,3,3,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
          animationDelay: '0ms',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Schedule
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a8a29e', marginTop: 4 }}>Select a class to check in.</div>
            </div>
            <a href="/#/" style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#151412', border: '1px solid rgba(255,255,255,0.1)',
              color: '#a8a29e', display: 'flex', alignItems: 'center', justifyContent: 'center',
              textDecoration: 'none', flexShrink: 0,
            }}>
              <X size={18} />
            </a>
          </div>

          {/* Filter row */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            {(['all', 'adult', 'kids'] as const).map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                color: category === cat ? '#000' : '#a8a29e',
                background: category === cat ? 'linear-gradient(135deg, #e8af34, #ca8a04)' : 'transparent',
                border: 'none', cursor: 'pointer',
                boxShadow: category === cat ? '0 4px 12px rgba(232,175,52,0.2)' : 'none',
                transition: 'all 0.2s',
              }}>
                {cat === 'all' ? 'All' : cat === 'adult' ? 'Adults' : 'Kids & Teens'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Day timeline ── */}
        <div
          ref={timelineRef}
          className="sch-timeline sch-stagger"
          style={{
            display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
            padding: '14px 20px', gap: 10,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(180deg, #0a0908 0%, transparent 100%)',
            flexShrink: 0, scrollbarWidth: 'none',
            animationDelay: '60ms',
          }}
        >
          {dayNodes.map(({ dayName, num, abbr, isToday }) => {
            const isSelected = selectedDay === dayName;
            return (
              <button key={dayName} onClick={() => setSelectedDay(dayName)} style={{
                flexShrink: 0, width: 58, height: 72, borderRadius: 14,
                scrollSnapAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                background: isSelected
                  ? 'linear-gradient(180deg, rgba(232,175,52,0.1) 0%, transparent 100%)'
                  : '#151412',
                border: isSelected ? '1px solid rgba(232,175,52,0.3)' : '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Active underline */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, width: '100%', height: 3,
                  background: '#e8af34',
                  transform: isSelected ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 0.3s',
                  transformOrigin: 'left',
                }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? '#e8af34' : '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {abbr}
                </span>
                <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 19, fontWeight: 800, color: isSelected ? '#e8af34' : '#f5f5f4' }}>
                  {num}
                </span>
                {isToday && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#e8af34', position: 'absolute', top: 8, right: 8 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Class list (scrollable) ── */}
        <div className="sch-list" style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', position: 'relative' }}>
          <div style={{ padding: '20px 20px 120px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {dayClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#57534e' }}>
                <Clock size={32} style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No classes on {selectedDay}</p>
              </div>
            ) : (
              dayClasses.map((cls, idx) => (
                <div key={`${selectedDay}-${cls.day}-${cls.time}-${cls.name}`}
                  className="sch-stagger"
                  style={{ animationDelay: `${120 + idx * 50}ms` }}
                >
                  <ClassCard
                    cls={cls}
                    isToday={selectedDay === today}
                    stream={stream}
                    checkedInClasses={checkedInClasses}
                    markClassCheckedIn={markClassCheckedIn}
                    checkInCount={checkedInClasses.length}
                  />
                </div>
              ))
            )}

            {/* Book Trial */}
            <a href="/#/book" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 8, padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 700,
              background: 'rgba(232,175,52,0.08)', color: '#e8af34',
              border: '1px solid rgba(232,175,52,0.15)', textDecoration: 'none',
              transition: 'all 0.2s',
            }}>
              Book a Trial Class <ChevronRight size={14} />
            </a>

            {/* Tournament link */}
            <div style={{
              padding: '14px 16px', background: 'rgba(232,175,52,0.05)',
              border: '1px solid rgba(232,175,52,0.12)', borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Trophy size={20} color="#e8af34" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0', margin: 0 }}>Compete at a Tournament</p>
                <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>View upcoming events and registration links</p>
              </div>
              <a href="/#/calendar" style={{ fontSize: 12, fontWeight: 700, color: '#e8af34', textDecoration: 'none' }}>View →</a>
            </div>
          </div>
        </div>

        {/* ── Floating daily tracker ── */}
        <div style={{
          position: 'absolute', bottom: 24, left: 20, right: 20,
          background: 'rgba(10,9,8,0.88)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: floatingTrackState === 0 ? '1px solid rgba(255,255,255,0.08)'
            : floatingTrackState === 1 ? '1px solid rgba(34,197,94,0.3)'
            : floatingTrackState === 2 ? '1px solid rgba(14,165,233,0.4)'
            : '1px solid rgba(239,68,68,0.6)',
          borderRadius: 18, padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: 10,
          boxShadow: floatingTrackState === 0 ? '0 20px 40px rgba(0,0,0,0.8)'
            : floatingTrackState === 1 ? '0 20px 40px rgba(0,0,0,0.8), 0 0 32px rgba(34,197,94,0.1)'
            : floatingTrackState === 2 ? '0 20px 40px rgba(0,0,0,0.8), 0 0 40px rgba(14,165,233,0.15)'
            : '0 20px 40px rgba(0,0,0,0.8), 0 0 50px rgba(239,68,68,0.25)',
          zIndex: 100, transition: 'all 0.5s',
          animation: floatingTrackState >= 3 ? 'sch-ft-pulse 1.5s infinite alternate' : undefined,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              color: floatingTrackState >= 3 ? '#fca5a5' : '#a8a29e',
              transition: 'color 0.5s',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
              {ftLabels[floatingTrackState]}
            </div>
            <span style={{
              fontFamily: 'var(--font-display, system-ui)', fontSize: floatingTrackState >= 3 ? 20 : 18,
              fontWeight: 900,
              color: ftColors[floatingTrackState],
              textShadow: floatingTrackState > 0 ? `0 0 ${floatingTrackState >= 3 ? 12 : 8}px ${ftColors[floatingTrackState]}60` : 'none',
              transition: 'color 0.5s, text-shadow 0.5s, font-size 0.3s',
            }}>
              {ftFraction}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{
            width: '100%', height: 6, background: '#000', borderRadius: 3,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: ftFillWidths[floatingTrackState],
              background: ftFillBgs[floatingTrackState],
              borderRadius: 3,
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1), background 0.5s',
            }} />
          </div>
        </div>

      </div>
    </>
  );
}

// ── ClassCard ────────────────────────────────────────────────────

function ClassCard({
  cls, isToday, stream, checkedInClasses, markClassCheckedIn, checkInCount,
}: {
  cls: ClassScheduleItem; isToday: boolean; stream: StreamStatus | null;
  checkedInClasses: string[]; markClassCheckedIn: (name: string) => void;
  checkInCount: number;
}) {
  const isClassLive = stream?.isLive && (stream.className === cls.name || stream.className === (cls as any).title);
  const typeStyle = CLASS_TYPE_COLORS[cls.type] ?? CLASS_TYPE_COLORS.gi;
  const displayTime = formatClassTime(cls.time);
  const [timePart, ampm] = displayTime.split(" ");
  const [isExpanded, setIsExpanded] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const checkingInRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const duration = getDuration(cls.name);
  const alreadyCheckedIn = checkedInClasses.includes(cls.name || '');

  // State: which check-in level (1,2,3) applies to THIS card if checked in
  const cardStateLevel = Math.min(checkInCount + 1, 3);

  const stateColors = ['#22c55e', '#0ea5e9', '#ef4444'];
  const stateColor = stateColors[Math.min(cardStateLevel - 1, 2)];

  const isPast = (() => {
    if (!isToday) return false;
    const now = new Date();
    const [hm, period] = displayTime.split(" ");
    const [hStr, mStr] = hm.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr || "0", 10);
    if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
    const endTotalMins = hours * 60 + minutes + getDurationMinutes(cls.name);
    const classEnd = new Date();
    classEnd.setHours(Math.floor(endTotalMins / 60), endTotalMins % 60, 0, 0);
    return now > classEnd;
  })();

  const handleCheckIn = async () => {
    if (!navigator.onLine) { alert('No internet connection.'); return; }
    const geo = await validateGeoIfRequired();
    if (!geo.allowed) { alert(geo.error || 'Location check failed.'); return; }
    if (alreadyCheckedIn || checkInDone || checkingInRef.current) return;
    checkingInRef.current = true;

    // Particle burst
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, stateColor, cardStateLevel >= 3 ? 50 : 20);
    }

    try {
      const raw = localStorage.getItem('lbjj_game_stats_v2');
      const stats = raw ? JSON.parse(raw) : {};
      stats.classesAttended = (stats.classesAttended || 0) + 1;
      const comboMultiplier = (() => {
        try {
          const weekly2: string[] = JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]');
          const t2 = new Date().toISOString().split('T')[0];
          const y2 = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          const d2 = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
          if (weekly2.includes(t2) && weekly2.includes(y2) && weekly2.includes(d2)) return 3;
          if (weekly2.includes(t2) && weekly2.includes(y2)) return 2;
          return 1;
        } catch { return 1; }
      })();
      const xpGain = 10 * comboMultiplier;
      stats.xp = (stats.xp || 0) + xpGain;
      stats.totalXP = (stats.totalXP || 0) + xpGain;
      localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
      try { window.dispatchEvent(new CustomEvent('xp-updated')); } catch {}
    } catch {}

    const today = new Date().toISOString().split('T')[0];
    const todayData = (() => { try { return JSON.parse(localStorage.getItem('lbjj_checkins_today') || '{}'); } catch { return {}; } })();
    const newCount = (todayData.date === today ? (todayData.count || 0) : 0) + 1;
    localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: newCount }));

    const weekly: string[] = (() => { try { return JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]'); } catch { return []; } })();
    if (!weekly.includes(today)) {
      weekly.push(today);
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      localStorage.setItem('lbjj_weekly_training', JSON.stringify(weekly.filter((d: string) => d >= cutoff)));
    }
    try {
      const history: string[] = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
      if (!history.includes(today)) {
        history.push(today);
        const cutoff = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        localStorage.setItem('lbjj_checkin_history', JSON.stringify(history.filter((d: string) => d >= cutoff)));
      }
    } catch {}

    const member = getMemberData();
    const gameStats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    const newlyEarned = checkAndUnlockAchievements(member || {}, gameStats);
    if (newlyEarned.length > 0) {
      const first = ALL_ACHIEVEMENTS.find(a => a.key === newlyEarned[0]);
      if (first && (window as any).__showBadgeUnlock) {
        (window as any).__showBadgeUnlock({ key: first.key, label: first.label, icon: first.icon, desc: first.desc, color: first.color });
      }
    }

    const memberEmail = member?.email || '';
    const memberName = member?.name || '';
    if (memberEmail) {
      gasCall('recordCheckIn', {
        email: memberEmail, name: memberName,
        className: cls.name || '', day: cls.day || '', time: cls.time || '',
      }).then(async (result: any) => {
        if (result?.alreadyCheckedIn) {
          markClassCheckedIn(cls.name || '');
          return;
        }
        if (result?.pointsAwarded || result?.success) {
          try {
            const statsData = await saveMemberStats({
              xp: gameStats.totalXP || gameStats.xp || 0,
              streak: gameStats.currentStreak || 0,
              maxStreak: gameStats.maxStreak || 0,
            });
            if (statsData) {
              const raw2 = localStorage.getItem('lbjj_game_stats_v2');
              const s2 = raw2 ? JSON.parse(raw2) : {};
              s2.currentStreak = result?.currentStreak ?? s2.currentStreak;
              s2.maxStreak = Math.max(s2.maxStreak || 0, s2.currentStreak || 0);
              localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(s2));
              try { localStorage.setItem('lbjj_streak_cache', String(s2.currentStreak || 0)); } catch {}
            }
          } catch {}
          try { await syncAchievements(member || {}, gameStats); } catch {}
          try { await getLeaderboardFresh(); } catch {}
        }
      }).catch(() => {});
    }

    markClassCheckedIn(cls.name || '');
    setCheckInDone(true);
    try { localStorage.removeItem('lbjj_home_leaderboard'); localStorage.removeItem('lbjj_home_cache'); } catch {}
    triggerConfetti();
    setTimeout(() => {
      setIsExpanded(false);
      setCheckInDone(false);
      window.location.hash = '#/';
    }, 1500);
  };

  // Card visual state
  const cardIsCheckedIn = alreadyCheckedIn || checkInDone;
  const stateIdx = cardIsCheckedIn ? Math.min(checkInCount, 3) : 0;

  const cardBorderColor = cardIsCheckedIn
    ? stateIdx >= 3 ? 'rgba(239,68,68,0.8)'
      : stateIdx === 2 ? 'rgba(14,165,233,0.5)'
      : 'rgba(34,197,94,0.4)'
    : isExpanded ? 'rgba(232,175,52,0.2)' : 'rgba(255,255,255,0.04)';

  const cardBg = cardIsCheckedIn
    ? stateIdx >= 3 ? 'linear-gradient(145deg, rgba(239,68,68,0.08) 0%, rgba(0,0,0,0) 100%)'
      : stateIdx === 2 ? 'linear-gradient(145deg, rgba(14,165,233,0.05) 0%, rgba(0,0,0,0) 100%)'
      : 'linear-gradient(145deg, rgba(34,197,94,0.05) 0%, rgba(0,0,0,0) 100%)'
    : 'rgba(255,255,255,0.02)';

  const btnBg = cardIsCheckedIn
    ? stateIdx >= 3 ? 'linear-gradient(135deg, #ef4444, #991b1b)'
      : stateIdx === 2 ? 'linear-gradient(135deg, #0ea5e9, #0369a1)'
      : 'linear-gradient(135deg, #22c55e, #15803d)'
    : 'linear-gradient(135deg, #e8af34, #ca8a04)';

  const btnBorder = cardIsCheckedIn
    ? stateIdx >= 3 ? '#f87171' : stateIdx === 2 ? '#38bdf8' : '#4ade80'
    : '#fef08a';

  const btnColor = cardIsCheckedIn ? '#fff' : '#000';

  return (
    <>
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorderColor}`,
        borderRadius: 18, overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        cursor: 'pointer',
        boxShadow: cardIsCheckedIn
          ? stateIdx >= 3 ? '0 0 40px rgba(239,68,68,0.2)' : stateIdx === 2 ? '0 0 32px rgba(14,165,233,0.15)' : '0 0 24px rgba(34,197,94,0.1)'
          : 'none',
        animation: cardIsCheckedIn && stateIdx >= 3 ? 'sch-card-pulse 1.5s infinite alternate' : undefined,
      }}>
        {/* Card header — always visible, click to expand */}
        <div
          style={{ display: 'flex', gap: 14, padding: '18px 18px', alignItems: 'center', position: 'relative', zIndex: 2 }}
          onClick={() => setIsExpanded(e => !e)}
        >
          {/* Time block */}
          <div style={{
            width: 66, flexShrink: 0, textAlign: 'right',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: 14,
          }}>
            <span style={{
              fontFamily: 'var(--font-display, system-ui)', fontSize: 20, fontWeight: 800,
              color: cardIsCheckedIn ? stateColor : '#fff', lineHeight: 1,
              textShadow: cardIsCheckedIn ? `0 0 12px ${stateColor}` : 'none',
              transition: 'color 0.4s, text-shadow 0.4s',
            }}>{timePart}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#57534e', marginTop: 2 }}>{ampm}</span>
          </div>

          {/* Class info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-display, system-ui)', fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                {cls.name}
              </span>
              {isClassLive && (
                <span style={{ ...getLiveBadgeStyle(), fontSize: 9 }}>● LIVE</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.text}30` }}>
                {typeStyle.label}
              </span>
              {cls.category === 'kids' && (
                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
                  Kids
                </span>
              )}
              {cls.instructor && (
                <span style={{ fontSize: 11, color: '#a8a29e' }}>w/ Coach {cls.instructor}</span>
              )}
            </div>
          </div>

          {/* Chevron */}
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: isExpanded && !cardIsCheckedIn ? '#e8af34' : 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: isExpanded && !cardIsCheckedIn ? '#000' : '#a8a29e',
            transform: isExpanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), background 0.2s, color 0.2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* Expandable details — CSS grid-template-rows for smooth animation */}
        <div style={{
          display: 'grid',
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Meta grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a8a29e', fontWeight: 500 }}>
                  <Clock size={13} style={{ color: '#57534e', flexShrink: 0 }} />
                  {duration}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a8a29e', fontWeight: 500 }}>
                  <User size={13} style={{ color: '#57534e', flexShrink: 0 }} />
                  {cls.capacity != null && cls.enrolled != null
                    ? `${cls.enrolled}/${cls.capacity} spots`
                    : 'Capacity: Open'}
                </div>
              </div>

              {/* Watch Live */}
              {isClassLive && (
                <a href="/#/live" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                  Watch Live
                </a>
              )}

              {/* Check-in button */}
              {checkInDone ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <CheckCircle size={36} style={{ color: '#22c55e', display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>Checked In!</div>
                </div>
              ) : isPast ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, background: 'rgba(74,175,128,0.1)', color: '#4caf80', fontWeight: 600, fontSize: 14, border: '1px solid rgba(74,175,128,0.2)' }}>
                  <CheckCircle size={16} /> Class has ended
                </div>
              ) : (
                <button
                  ref={btnRef}
                  onClick={(e) => { e.stopPropagation(); handleCheckIn(); }}
                  disabled={cardIsCheckedIn}
                  style={{
                    background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor,
                    borderRadius: 12, padding: '13px', width: '100%',
                    fontFamily: 'var(--font-display, system-ui)', fontSize: 15, fontWeight: 900,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: cardIsCheckedIn ? 'default' : 'pointer',
                    pointerEvents: cardIsCheckedIn ? 'none' : 'auto',
                    position: 'relative', overflow: 'hidden',
                    animation: !cardIsCheckedIn ? 'sch-btn-breathe 2s infinite alternate ease-in-out' : 'none',
                    boxShadow: cardIsCheckedIn
                      ? stateIdx >= 3 ? '0 4px 24px rgba(239,68,68,0.5)' : stateIdx === 2 ? '0 4px 20px rgba(14,165,233,0.4)' : '0 4px 16px rgba(34,197,94,0.4)'
                      : '0 4px 16px rgba(232,175,52,0.2), inset 0 1px 1px rgba(255,255,255,0.5)',
                    transition: 'all 0.2s',
                  }}
                >
                  {!cardIsCheckedIn && (
                    <div style={{
                      position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                      transform: 'skewX(-20deg)', animation: 'sch-btn-sweep 3s infinite',
                    }} />
                  )}
                  {cardIsCheckedIn
                    ? <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {stateIdx >= 3 ? 'SAVAGE COMPLETE' : 'CHECKED IN'}</>
                    : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Check In</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
