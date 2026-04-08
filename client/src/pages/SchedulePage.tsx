import { useState } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CLASS_SCHEDULE, CLASS_TYPE_COLORS, DAYS_ORDER } from "@/lib/constants";
import type { ClassScheduleItem } from "@/lib/constants";
import { Clock, ChevronRight } from "lucide-react";

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
            { key: "all",   label: "All"          },
            { key: "adult", label: "Adults"        },
            { key: "kids",  label: "Kids & Teens"  },
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
              <ClassCard key={`${cls.day}-${cls.time}-${cls.name}`} cls={cls} />
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
      </div>
    </div>
  );
}

function ClassCard({ cls }: { cls: ClassScheduleItem }) {
  const typeStyle = CLASS_TYPE_COLORS[cls.type] ?? CLASS_TYPE_COLORS.gi;
  const [timePart, ampm] = cls.time.split(" ");

  return (
    <div
      className="p-4 rounded-xl transition-all"
      style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}
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
            <span
              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded mt-1"
              style={{ backgroundColor: typeStyle.bg, color: typeStyle.text }}
            >
              {typeStyle.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
