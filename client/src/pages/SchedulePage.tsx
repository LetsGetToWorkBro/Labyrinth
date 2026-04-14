import { useState, useEffect, useRef, useCallback } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CLASS_SCHEDULE, CLASS_TYPE_COLORS, DAYS_ORDER } from "@/lib/constants";
import type { ClassScheduleItem } from "@/lib/constants";
import { getScheduleClasses, gasCall, getMemberData } from "@/lib/api";
import { Clock, ChevronRight, X, User, CheckCircle } from "lucide-react";
import { checkAndUnlockAchievements, ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { getStreamStatus, getLiveBadgeStyle } from "@/lib/streaming";
import type { StreamStatus } from "@/lib/streaming";

// Shared check-in dedup state for SchedulePage class cards
const getScheduleTodayKey = (email?: string) =>
  'lbjj_checkins_' + new Date().toISOString().split('T')[0] + (email ? '_' + email : '');

// ── Gamification animations ─────────────────────────────────────

function triggerConfetti() {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  const colors = ['#C8A24C', '#E8C86C', '#FFD700', '#FFF8DC', '#ffffff'];

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
      position:absolute; bottom:30%; left:${x}%;
      width:${size}px; height:${size}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      background:${color};
      animation: confettiFly_${i} ${duration}ms ${delay}ms ease-out forwards;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiFly_${i} {
        0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
        100% { transform: translate(${endX}vw, ${endY}vh) rotate(${Math.random() * 720}deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    container.appendChild(dot);
  }

  setTimeout(() => { container.remove(); }, 2000);
}

function showPointsToast(points: number) {
  const el = document.createElement('div');
  el.textContent = `+${points} pts`;
  el.style.cssText = `
    position: fixed;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(200, 162, 76, 0.95);
    color: #000;
    font-weight: 700;
    font-size: 18px;
    padding: 8px 20px;
    border-radius: 20px;
    z-index: 9999;
    pointer-events: none;
    animation: pointsFloat 1.5s ease-out forwards;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes pointsFloat {
      0% { transform: translateX(-50%) translateY(0); opacity: 1; }
      100% { transform: translateX(-50%) translateY(-60px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); style.remove(); }, 1600);
}

function showBadgeUnlock(badge: { key: string; label: string; icon: string; desc: string; color?: string }) {
  const color = badge.color || '#C8A24C';
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; animation: fadeInOverlay 0.3s ease-out forwards;
  `;
  overlay.innerHTML = `
    <div style="text-align:center;padding:40px;max-width:300px;animation:slideUpCard 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;">
      <div style="font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:16px;">New Badge Unlocked</div>
      <div style="width:100px;height:100px;border-radius:50%;background:${color}22;border:3px solid ${color};
        display:flex;align-items:center;justify-content:center;margin:0 auto 20px;
        font-size:48px;box-shadow:0 0 30px ${color}66;animation:badgePulse 1s ease-in-out infinite alternate;">
        ${badge.icon}
      </div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">${badge.label}</div>
      <div style="font-size:14px;color:#888;line-height:1.5;">${badge.desc}</div>
      <div style="margin-top:24px;font-size:12px;color:#555;">Tap to dismiss</div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUpCard { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes badgePulse { from { box-shadow: 0 0 20px ${color}44; } to { box-shadow: 0 0 50px ${color}99; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  const dismiss = () => { overlay.remove(); style.remove(); };
  overlay.onclick = dismiss;
  setTimeout(dismiss, 4000);
}

const CLASS_DURATIONS: Record<string, string> = {
  default: "1 hour",
  "Kids BJJ (3–6)": "30 min",
  "Kids BJJ Comp": "1 hour",
  "Kids BJJ (7–12)": "1 hour",
  "Adult Comp": "1.5 hours",
  "Open Mat": "1.5 hours",
};

function getDuration(name: string): string {
  return CLASS_DURATIONS[name] || CLASS_DURATIONS.default;
}

const CLASS_DURATION_MINUTES: Record<string, number> = {
  default: 60,
  "Kids BJJ (3–6)": 30,
  "Kids BJJ Comp": 60,
  "Kids BJJ (7–12)": 60,
  "Adult Comp": 90,
  "Open Mat": 90,
};

function getDurationMinutes(name: string): number {
  return CLASS_DURATION_MINUTES[name] || CLASS_DURATION_MINUTES.default;
}

function formatClassTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  }
  return timeStr;
}

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return DAYS_ORDER.includes(today) ? today : "Monday";
  });
  const [category, setCategory] = useState<"all" | "adult" | "kids">("all");
  const [classes, setClasses] = useState<ClassScheduleItem[]>(CLASS_SCHEDULE);
  const [stream, setStream] = useState<StreamStatus | null>(null);

  // Dedup: track which classes have been checked into today (per-user, per-day)
  const dedupEmail = getMemberData()?.email || '';
  const [checkedInClasses, setCheckedInClasses] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(getScheduleTodayKey(dedupEmail)) || '[]'); } catch { return []; }
  });

  // Persist to localStorage on change
  useEffect(() => {
    const email = getMemberData()?.email || '';
    try { localStorage.setItem(getScheduleTodayKey(email), JSON.stringify(checkedInClasses)); } catch {}
  }, [checkedInClasses]);

  // Pre-populate from GAS on mount
  useEffect(() => {
    const memberEmail = getMemberData()?.email || '';
    if (memberEmail) {
      gasCall('getMemberCheckIns', { email: memberEmail }).then((res: any) => {
        const today = new Date().toISOString().split('T')[0];
        const todayNames = (res?.checkIns || [])
          .filter((c: any) => (c.date || c.timestamp || '').startsWith(today))
          .map((c: any) => c.className);
        if (todayNames.length > 0) setCheckedInClasses(prev => [...new Set([...prev, ...todayNames])]);
      }).catch(() => {});
    }
  }, []);

  const markClassCheckedIn = useCallback((className: string) => {
    setCheckedInClasses(prev => [...new Set([...prev, className])]);
  }, []);

  // 5a: Day pill indicator slide
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    getStreamStatus().then(setStream);
  }, []);

  useEffect(() => {
    getScheduleClasses().then((gasClasses) => {
      if (!gasClasses.length) return;
      const merged = CLASS_SCHEDULE.map((cls) => {
        const match = gasClasses.find(
          (g: any) =>
            (g.classId && g.classId === `${cls.day}-${cls.time}-${cls.name}`) ||
            (g.day === cls.day && g.time === cls.time && g.title === cls.name)
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

  // 5a: Slide indicator to active day
  useEffect(() => {
    const el = dayRefs.current[selectedDay];
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [selectedDay]);

  const dayClasses = classes.filter(c => {
    if (c.day !== selectedDay) return false;
    if (category !== "all" && c.category !== category) return false;
    return true;
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const emptyCategoryLabel =
    category === "adult" ? "adults" : category === "kids" ? "kids" : "";

  return (
    <div className="app-content">
      <ScreenHeader title="Schedule" subtitle="Class Timetable" />

      {/* Category Toggle */}
      <div className="px-5 mb-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#111" }}>
          {[
            { key: "all",   label: "All"         },
            { key: "adult", label: "Adults"       },
            { key: "kids",  label: "Kids & Teens" },
          ].map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key as "all" | "adult" | "kids")}
              className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
              style={{
                backgroundColor: category === cat.key ? "#C8A24C" : "transparent",
                color: category === cat.key ? "#0A0A0A" : "#666",
              }}
              data-testid={`button-category-${cat.key}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day Selector */}
      <div className="px-5 mb-4 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch", display: 'flex', justifyContent: 'center' }}>
        <div className="flex gap-2" style={{ minWidth: 'max-content', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            height: 2,
            background: '#C8A24C',
            borderRadius: 999,
            transition: 'left 220ms cubic-bezier(0.4, 0, 0.2, 1), width 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          {DAYS_ORDER.map(day => {
            const isSelected = selectedDay === day;
            const isToday = day === today;
            const short = day.slice(0, 3);
            return (
              <button
                key={day}
                ref={el => { dayRefs.current[day] = el; }}
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center px-3 py-2 rounded-xl transition-all min-w-[52px]"
                style={{
                  backgroundColor: isSelected ? "rgba(200, 162, 76, 0.12)" : "#111",
                  border: `1px solid ${isSelected ? "rgba(200, 162, 76, 0.3)" : "#1A1A1A"}`,
                }}
                data-testid={`button-day-${day}`}
              >
                <span className="text-[10px] font-medium" style={{ color: isSelected ? "#C8A24C" : "#666" }}>
                  {short}
                </span>
                {isToday && (
                  <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: "#C8A24C" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes List */}
      <div className="px-5 pb-6">
        {dayClasses.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} style={{ color: "#333", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: "#666" }}>
              No classes{emptyCategoryLabel ? ` for ${emptyCategoryLabel}` : ""} on {selectedDay}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayClasses.map((cls, index) => (
              <div key={`${selectedDay}-${cls.day}-${cls.time}-${cls.name}`}
                className="stagger-child"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ClassCard cls={cls} isToday={selectedDay === today} stream={stream} checkedInClasses={checkedInClasses} markClassCheckedIn={markClassCheckedIn} />
              </div>
            ))}
          </div>
        )}

        {/* Book Trial CTA */}
        <a
          href="/#/book"
          className="flex items-center justify-center gap-2 mt-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ backgroundColor: "rgba(200, 162, 76, 0.1)", color: "#C8A24C", border: "1px solid rgba(200, 162, 76, 0.2)" }}
          data-testid="button-book-trial"
        >
          Book a Trial Class <ChevronRight size={14} />
        </a>

        {/* Tournament link */}
        <div style={{
          margin: "20px 0",
          padding: "14px 16px",
          background: "rgba(200,162,76,0.06)",
          border: "1px solid rgba(200,162,76,0.15)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#E0E0E0", margin: 0 }}>Compete at a Tournament</p>
            <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>View upcoming events and registration links</p>
          </div>
          <a href="/#/calendar" style={{ fontSize: 12, fontWeight: 700, color: "#C8A24C", textDecoration: "none", flexShrink: 0 }}>
            View →
          </a>
        </div>
      </div>
    </div>
  );
}

function ClassCard({ cls, isToday, stream, checkedInClasses, markClassCheckedIn }: { cls: ClassScheduleItem; isToday: boolean; stream: StreamStatus | null; checkedInClasses: string[]; markClassCheckedIn: (name: string) => void }) {
  const isClassLive = stream?.isLive && (stream.className === cls.name || stream.className === (cls as any).title);
  const typeStyle = CLASS_TYPE_COLORS[cls.type] ?? CLASS_TYPE_COLORS.gi;
  const displayTime = formatClassTime(cls.time);
  const [timePart, ampm] = displayTime.split(" ");
  const [showDetail, setShowDetail] = useState(false);
  const [checkInDone, setCheckInDone] = useState(false);
  const duration = getDuration(cls.name);
  const alreadyCheckedIn = checkedInClasses.includes(cls.name || '');

  const handleCheckIn = () => {
    // Dedup: prevent double check-ins
    if (alreadyCheckedIn || checkInDone) return;
    // Increment local attendance
    try {
      const raw = localStorage.getItem('lbjj_game_stats_v2');
      const stats = raw ? JSON.parse(raw) : {};
      stats.classesAttended = (stats.classesAttended || 0) + 1;
      localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
    } catch (_) {}

    // Update today's check-in count for immediate display on HomePage
    const today = new Date().toISOString().split('T')[0];
    const todayData = (() => { try { return JSON.parse(localStorage.getItem('lbjj_checkins_today') || '{}'); } catch { return {}; } })();
    const newCount = (todayData.date === today ? (todayData.count || 0) : 0) + 1;
    localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: newCount }));

    // Track weekly training days for the home screen dots
    const weekly: string[] = (() => { try { return JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]'); } catch { return []; } })();
    if (!weekly.includes(today)) {
      weekly.push(today);
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      localStorage.setItem('lbjj_weekly_training', JSON.stringify(weekly.filter((d: string) => d >= cutoff)));
    }

    // Check and unlock local achievements after check-in
    const member = getMemberData();
    const gameStats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    const newlyEarned = checkAndUnlockAchievements(member || {}, gameStats);
    if (newlyEarned.length > 0) {
      const first = ALL_ACHIEVEMENTS.find(a => a.key === newlyEarned[0]);
      if (first) {
        showBadgeUnlock({ key: first.key, label: first.label, icon: first.icon, desc: first.desc, color: first.color });
        setTimeout(() => { window.location.hash = '#/achievements'; }, 3000);
      }
    }

    // Fire-and-forget GAS gamification call
    const memberEmail = member?.email || '';
    const memberName = member?.name || '';
    if (memberEmail) {
      gasCall('recordCheckIn', {
        email: memberEmail,
        name: memberName,
        className: cls.name || '',
        day: cls.day || '',
        time: cls.time || '',
      }).then((result: any) => {
        if (result?.alreadyCheckedIn) {
          // Already checked in server-side — just update local state
          markClassCheckedIn(cls.name || '');
          return;
        }
        if (result?.pointsAwarded) {
          showPointsToast(result.pointsAwarded);
        }
        if (result?.newBadges && result.newBadges.length > 0) {
          showBadgeUnlock(result.newBadges[0]);
        }
        if (result?.streakMilestone) {
          showBadgeUnlock({ key: 'streak', label: `${result.streakMilestone}-Week Streak!`, icon: '\u{1F525}', desc: `${result.streakMilestone} consecutive weeks of training. Consistency is everything.`, color: '#F97316' });
        }
        // Save successful check-in to dedup state
        markClassCheckedIn(cls.name || '');
      }).catch(() => {});
    }

    markClassCheckedIn(cls.name || '');
    setCheckInDone(true);
    triggerConfetti();
    setTimeout(() => {
      setShowDetail(false);
      setCheckInDone(false);
      window.location.hash = '#/';
    }, 1500);
  };

  // Check if this class has already ended today
  const isPast = (() => {
    if (!isToday) return false;
    const now = new Date();
    const [hm, period] = displayTime.split(" ");
    const [hStr, mStr] = hm.split(":");
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr || "0", 10);
    if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
    const classEnd = new Date();
    const durationMins = getDurationMinutes(cls.name);
    const endTotalMins = hours * 60 + minutes + durationMins;
    classEnd.setHours(Math.floor(endTotalMins / 60), endTotalMins % 60, 0, 0);
    return now > classEnd;
  })();

  return (
    <>
      <button
        onClick={() => setShowDetail(true)}
        className="w-full p-4 rounded-xl transition-all active:scale-[0.98] text-left"
        style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", cursor: "pointer", opacity: isPast ? 0.5 : 1 }}
        data-testid={`button-class-${cls.name}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 text-center">
              <p className="text-sm font-bold" style={{ color: "#F0F0F0" }}>{timePart}</p>
              <p className="text-[10px]" style={{ color: "#666" }}>{ampm ?? ""}</p>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: "#222" }} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium" style={{ color: "#F0F0F0" }}>{cls.name}</p>
                {isClassLive && (
                  <span style={{ ...getLiveBadgeStyle(), fontSize: 9 }}>● LIVE</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span
                  className="inline-block text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
                >
                  {typeStyle.label}
                </span>
                {/* Coach name */}
                {cls.instructor && (
                  <span className="text-[10px]" style={{ color: "#888" }}>
                    w/ Coach {cls.instructor}
                  </span>
                )}
              </div>
              {/* Capacity indicator */}
              <div className="mt-1">
                {cls.capacity != null && cls.enrolled != null ? (
                  <span className="text-[10px] font-medium" style={{
                    color: cls.enrolled >= cls.capacity
                      ? "#E05555"
                      : cls.enrolled >= cls.capacity * 0.8
                        ? "#E08228"
                        : "#666",
                  }}>
                    {cls.enrolled >= cls.capacity
                      ? "Full"
                      : `${cls.enrolled}/${cls.capacity} spots`}
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: "#444" }}>—</span>
                )}
              </div>
            </div>
          </div>
          {isPast ? (
            <span style={{ fontSize: 11, color: "#4CAF80", fontWeight: 600, flexShrink: 0 }}>&#10003; Ended</span>
          ) : (
            <ChevronRight size={16} style={{ color: "#444", flexShrink: 0 }} />
          )}
        </div>
      </button>

      {showDetail && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowDetail(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative", width: "100%",
              background: "#111", borderRadius: "20px 20px 0 0",
              padding: "24px 20px 0", borderTop: "1px solid #1A1A1A",
              maxHeight: "80vh",
              overflowY: "auto",
              paddingBottom: "max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))",
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2A2A", margin: "0 auto 20px" }} />

            {checkInDone ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4CAF50' }}>Checked In!</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 6 }}>{cls.name}</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>{cls.name}</h3>
                    <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, backgroundColor: typeStyle.bg, color: typeStyle.text }}>
                      {typeStyle.label}
                    </span>
                  </div>
                  <button onClick={() => setShowDetail(false)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                    <X size={20} style={{ color: "#555" }} />
                  </button>
                </div>

                {/* Detail rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Clock size={16} style={{ color: "#C8A24C", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 14, color: "#F0F0F0", margin: 0, fontWeight: 600 }}>{displayTime}</p>
                      <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>{duration}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <User size={16} style={{ color: "#666", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, color: "#999", margin: 0 }}>
                        {cls.category === "kids" ? "Kids & Teens" : "Adults"} · {typeStyle.label}
                        {cls.instructor && <span style={{ color: "#C8A24C" }}> · w/ Coach {cls.instructor}</span>}
                      </p>
                      {cls.capacity != null && cls.enrolled != null ? (
                        <p style={{
                          fontSize: 12, margin: "4px 0 0",
                          color: cls.enrolled >= cls.capacity ? "#E05555"
                            : cls.enrolled >= cls.capacity * 0.8 ? "#E08228"
                            : "#666",
                          fontWeight: 600,
                        }}>
                          {cls.enrolled >= cls.capacity ? "Class Full" : `${cls.enrolled}/${cls.capacity} spots`}
                        </p>
                      ) : (
                        <p style={{ fontSize: 12, margin: "4px 0 0", color: "#444" }}>Capacity: —</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Watch Live button */}
                {isClassLive && (
                  <a href="/#/live" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '14px', borderRadius: 12, width: '100%',
                    background: 'linear-gradient(135deg, #1A0A0A, #1A1010)',
                    border: '1px solid #EF444430',
                    color: '#EF4444', fontWeight: 700, fontSize: 15,
                    textDecoration: 'none', marginBottom: 10,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite' }} />
                    Watch Live
                  </a>
                )}

                {/* CTA */}
                {isPast ? (
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 8, padding: "14px", borderRadius: 12,
                      background: "rgba(74, 175, 128, 0.1)", color: "#4CAF80",
                      fontWeight: 600, fontSize: 15, border: "1px solid rgba(74, 175, 128, 0.2)",
                    }}
                  >
                    <CheckCircle size={16} /> Class has ended
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={alreadyCheckedIn || checkInDone}
                    data-checkin-btn=""
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 8, padding: "14px", borderRadius: 12, width: "100%",
                      background: alreadyCheckedIn ? 'rgba(200,162,76,0.15)' : "#C8A24C",
                      color: alreadyCheckedIn ? '#C8A24C' : "#0A0A0A",
                      fontWeight: 700, fontSize: 15, border: "none",
                      cursor: alreadyCheckedIn ? "default" : "pointer",
                      opacity: alreadyCheckedIn ? 0.7 : 1,
                      transition: 'transform 80ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {alreadyCheckedIn ? '✓ Checked In' : 'Check In to Class'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
