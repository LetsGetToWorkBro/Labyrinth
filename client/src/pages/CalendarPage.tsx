import { useState, useEffect, useMemo } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BeltDot } from "@/components/BeltBadge";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { fetchCSV, parseCSV, CSV_ENDPOINTS } from "@/lib/api";
import type { TournamentEvent, Registration } from "@/lib/api";
import { getOrgColor } from "@/lib/constants";
import { ChevronLeft, ChevronRight, Star, ExternalLink, Users, MapPin, Calendar } from "lucide-react";

export default function CalendarPage() {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [eventsCSV, regsCSV] = await Promise.all([
        fetchCSV(CSV_ENDPOINTS.events),
        fetchCSV(CSV_ENDPOINTS.registrations),
      ]);

      const rawEvents = parseCSV<any>(eventsCSV);
      const parsedEvents: TournamentEvent[] = rawEvents.map((e: any) => ({
        date: e.Date || e.date || "",
        name: e.Name || e.name || "",
        org: e.Org || e.org || "",
        location: e.Location || e.location || "",
        link: e.Link || e.link || "",
        priority: e.Priority || e.priority || "",
        source: e.Source || e.source || "",
        endDate: e.End_Date || e.end_date || e.EndDate || "",
      }));

      // Parse registrations (headers=0, so we need to handle manually)
      const regsLines = regsCSV.trim().split("\n");
      const parsedRegs: Registration[] = regsLines.map((line: string) => {
        const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
        return {
          eventName: cols[0] || "",
          athleteName: cols[1] || "",
          beltRank: cols[2] || "",
          registeredDate: cols[3] || "",
          division: cols[4] || "",
          weightClass: cols[5] || "",
          sourcePlatform: cols[6] || "",
        };
      });

      setEvents(parsedEvents);
      setRegistrations(parsedRegs);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    }
    setLoading(false);
  }

  // Combine JJWL sub-events
  const combinedEvents = useMemo(() => {
    const map = new Map<string, TournamentEvent & { subNames: string[] }>();
    events.forEach(e => {
      const key = `${e.date}-${e.org}`;
      if (e.org?.toUpperCase() === "JJWL" && map.has(key)) {
        map.get(key)!.subNames.push(e.name);
      } else {
        map.set(e.date + "-" + e.name, { ...e, subNames: [e.name] });
      }
    });
    return Array.from(map.values());
  }, [events]);

  // Get events for a specific day
  function getEventsForDay(dateStr: string) {
    return combinedEvents.filter(e => {
      try {
        const eventDate = new Date(e.date);
        const checkDate = new Date(dateStr);
        return eventDate.toDateString() === checkDate.toDateString();
      } catch { return false; }
    });
  }

  // Get events for current month
  const monthEvents = useMemo(() => {
    return combinedEvents.filter(e => {
      try {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      } catch { return false; }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [combinedEvents, currentMonth]);

  // Next Houston event
  const nextHouston = useMemo(() => {
    const now = new Date();
    return combinedEvents
      .filter(e => {
        const loc = (e.location || "").toLowerCase();
        const name = (e.name || "").toLowerCase();
        return (loc.includes("houston") || name.includes("houston")) && new Date(e.date) >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [combinedEvents]);

  // Get registrations for an event
  function getEventRegistrations(event: TournamentEvent) {
    return registrations.filter(r => {
      const rName = r.eventName.toLowerCase();
      return event.subNames?.some(n => rName.includes(n.toLowerCase())) || rName.includes(event.name.toLowerCase());
    });
  }

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentMonth]);

  function daysUntil(dateStr: string) {
    const now = new Date();
    const target = new Date(dateStr);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) return <div className="app-content"><ScreenHeader title="Calendar" /><ListSkeleton count={5} /></div>;

  return (
    <div className="app-content">
      <ScreenHeader title="Calendar" subtitle="Tournament Schedule" />

      {/* Next Houston Event Countdown */}
      {nextHouston && (
        <div className="mx-5 mb-4 p-4 rounded-xl" style={{ backgroundColor: "rgba(200, 162, 76, 0.08)", border: "1px solid rgba(200, 162, 76, 0.2)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} style={{ color: "#C8A24C" }} fill="#C8A24C" />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#C8A24C" }}>Next Houston Event</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>{nextHouston.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#999" }}>
            {new Date(nextHouston.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {" · "}
            <span style={{ color: "#C8A24C", fontWeight: 600 }}>
              {daysUntil(nextHouston.date)} days away
            </span>
          </p>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-5 mb-3">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2" style={{ color: "#999" }} data-testid="button-prev-month">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>
          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2" style={{ color: "#999" }} data-testid="button-next-month">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mx-5 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium py-1" style={{ color: "#666" }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEvents = getEventsForDay(dateStr);
            const isToday = new Date().toDateString() === new Date(dateStr).toDateString();

            return (
              <button
                key={i}
                onClick={() => dayEvents[0] && setSelectedEvent(dayEvents[0])}
                className="relative flex flex-col items-center py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: isToday ? "rgba(200, 162, 76, 0.1)" : "transparent",
                }}
              >
                <span className="text-xs" style={{
                  color: isToday ? "#C8A24C" : dayEvents.length > 0 ? "#F0F0F0" : "#666",
                  fontWeight: isToday || dayEvents.length > 0 ? 600 : 400,
                }}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, j) => (
                      <span key={j} className="event-dot" style={{ backgroundColor: getOrgColor(e.org), width: 4, height: 4 }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events List for Month */}
      <div className="px-5 pb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#666" }}>
          Events This Month ({monthEvents.length})
        </h3>
        {monthEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={32} style={{ color: "#333", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: "#666" }}>No events this month</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthEvents.map((event, i) => {
              const regs = getEventRegistrations(event);
              const isPriority = event.priority?.toLowerCase() === "true" || event.priority === "1";
              return (
                <button
                  key={i}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left p-4 rounded-xl transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}
                  data-testid={`event-card-${i}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: getOrgColor(event.org) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {isPriority && <Star size={12} fill="#C8A24C" style={{ color: "#C8A24C" }} />}
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{
                          backgroundColor: `${getOrgColor(event.org)}20`,
                          color: getOrgColor(event.org),
                        }}>
                          {event.org}
                        </span>
                      </div>
                      <p className="text-sm font-semibold truncate" style={{ color: "#F0F0F0" }}>{event.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs flex items-center gap-1" style={{ color: "#999" }}>
                          <Calendar size={10} />
                          {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {event.endDate && ` – ${new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </span>
                        {event.location && (
                          <span className="text-xs flex items-center gap-1 truncate" style={{ color: "#999" }}>
                            <MapPin size={10} />
                            {event.location}
                          </span>
                        )}
                      </div>
                      {regs.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Users size={10} style={{ color: "#C8A24C" }} />
                          <span className="text-xs" style={{ color: "#C8A24C" }}>{regs.length} Labyrinth athlete{regs.length !== 1 ? "s" : ""}</span>
                          <div className="flex gap-0.5 ml-1">
                            {regs.slice(0, 5).map((r, j) => (
                              <BeltDot key={j} belt={r.beltRank} size={6} />
                            ))}
                            {regs.length > 5 && <span className="text-[10px]" style={{ color: "#666" }}>+{regs.length - 5}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onClick={() => setSelectedEvent(null)}>
          <div
            className="w-full max-w-md rounded-t-2xl p-5 pb-8"
            style={{ backgroundColor: "#111", maxHeight: "70vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: "#333" }} />

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded" style={{
                backgroundColor: `${getOrgColor(selectedEvent.org)}20`,
                color: getOrgColor(selectedEvent.org),
              }}>
                {selectedEvent.org}
              </span>
              {(selectedEvent.priority?.toLowerCase() === "true" || selectedEvent.priority === "1") && (
                <Star size={14} fill="#C8A24C" style={{ color: "#C8A24C" }} />
              )}
            </div>

            <h2 className="text-lg font-bold mb-1" style={{ color: "#F0F0F0" }}>{selectedEvent.name}</h2>

            <div className="space-y-2 mt-3 mb-4">
              <div className="flex items-center gap-2 text-xs" style={{ color: "#999" }}>
                <Calendar size={12} />
                {new Date(selectedEvent.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                {selectedEvent.endDate && ` – ${new Date(selectedEvent.endDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "#999" }}>
                  <MapPin size={12} />
                  {selectedEvent.location}
                </div>
              )}
            </div>

            {selectedEvent.link && (
              <a
                href={selectedEvent.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold mb-4 transition-all active:scale-[0.98]"
                style={{ backgroundColor: "#C8A24C", color: "#0A0A0A" }}
              >
                Register <ExternalLink size={14} />
              </a>
            )}

            {/* Registered Athletes */}
            {(() => {
              const regs = getEventRegistrations(selectedEvent);
              if (regs.length === 0) return null;
              return (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#666" }}>
                    Labyrinth Athletes ({regs.length})
                  </h3>
                  <div className="space-y-1.5">
                    {regs.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "#1A1A1A" }}>
                        <BeltDot belt={r.beltRank} />
                        <span className="text-sm flex-1" style={{ color: "#F0F0F0" }}>{r.athleteName}</span>
                        {r.division && <span className="text-[10px]" style={{ color: "#666" }}>{r.division}</span>}
                        {r.weightClass && <span className="text-[10px]" style={{ color: "#666" }}>{r.weightClass}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
