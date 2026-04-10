import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CLASS_SCHEDULE, CLASS_TYPE_COLORS, DAYS_ORDER } from "@/lib/constants";
import type { ClassScheduleItem } from "@/lib/constants";
import { Clock, ChevronRight, X, User, CheckCircle } from "lucide-react";

const CLASS_DURATIONS: Record<string, string> = {
  default: "1 hour",
  "Kids BJJ (3–6)": "45 min",
  "Kids BJJ Comp": "1 hour",
  "Kids BJJ (7–12)": "1 hour",
  "Adult Comp": "1.5 hours",
  "Open Mat": "1.5 hours",
};

function getDuration(name: string): string {
  return CLASS_DURATIONS[name] || CLASS_DURATIONS.default;
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

  const dayClasses = CLASS_SCHEDULE.filter(c => {
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
      <div className="px-5 mb-4 overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex gap-2 min-w-max">
          {DAYS_ORDER.map(day => {
            const isSelected = selectedDay === day;
            const isToday = day === today;
            const short = day.slice(0, 3);
            return (
              <button
                key={day}
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
            {dayClasses.map((cls) => (
              <ClassCard key={`${cls.day}-${cls.time}-${cls.name}`} cls={cls} isToday={selectedDay === today} />
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

function ClassCard({ cls, isToday }: { cls: ClassScheduleItem; isToday: boolean }) {
  const typeStyle = CLASS_TYPE_COLORS[cls.type] ?? CLASS_TYPE_COLORS.gi;
  const displayTime = formatClassTime(cls.time);
  const [timePart, ampm] = displayTime.split(" ");
  const [showDetail, setShowDetail] = useState(false);
  const duration = getDuration(cls.name);

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
    classEnd.setHours(hours + 1, minutes, 0, 0);
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
              <p className="text-sm font-medium" style={{ color: "#F0F0F0" }}>{cls.name}</p>
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
              padding: "24px 20px 44px", borderTop: "1px solid #1A1A1A",
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2A2A", margin: "0 auto 20px" }} />

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
              <a
                href="/#/sauna"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "14px", borderRadius: 12,
                  background: "#C8A24C", color: "#0A0A0A",
                  fontWeight: 700, fontSize: 15, textDecoration: "none",
                }}
              >
                Check In to Class
              </a>
            )}
          </div>
        </div>
      )}
    </>
  );
}
