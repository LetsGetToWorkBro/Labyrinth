import { useState, useEffect, useMemo } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BeltDot } from "@/components/BeltBadge";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { fetchCSV, parseCSV, CSV_ENDPOINTS, gasCall } from "@/lib/api";
import type { TournamentEvent, Registration } from "@/lib/api";
import { getOrgColor } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { ChevronLeft, ChevronRight, Star, ExternalLink, Users, MapPin, Calendar, Trophy, Loader2 } from "lucide-react";

export default function CalendarPage() {
  const { member } = useAuth();
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<TournamentEvent | null>(null);

  // Tournament results logging state
  const [logResultEvent, setLogResultEvent] = useState<TournamentEvent | null>(null);
  const [resultDivision, setResultDivision] = useState("");
  const [resultPlace, setResultPlace] = useState<"Gold" | "Silver" | "Bronze" | "Competed">("Gold");
  const [resultNotes, setResultNotes] = useState("");
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [celebration, setCelebration] = useState<{ emoji: string; place: string; name: string; tournament: string } | null>(null);

  const [offline, setOffline] = useState(false);

  const CACHE_KEY_EVENTS = "lbjj_calendar_events_v1";
  const CACHE_KEY_REGS   = "lbjj_calendar_regs_v1";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Always try live first
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

      // Save to localStorage cache for offline use
      try {
        localStorage.setItem(CACHE_KEY_EVENTS, JSON.stringify(parsedEvents));
        localStorage.setItem(CACHE_KEY_REGS, JSON.stringify(parsedRegs));
      } catch { /* storage full */ }

      setEvents(parsedEvents);
      setRegistrations(parsedRegs);
      setOffline(false);
    } catch (err) {
      console.warn("Calendar fetch failed, trying cache:", err);
      // Fall back to cached data
      try {
        const cachedEvents = localStorage.getItem(CACHE_KEY_EVENTS);
        const cachedRegs   = localStorage.getItem(CACHE_KEY_REGS);
        if (cachedEvents) setEvents(JSON.parse(cachedEvents));
        if (cachedRegs)   setRegistrations(JSON.parse(cachedRegs));
        if (cachedEvents || cachedRegs) setOffline(true);
      } catch { /* cache corrupted */ }
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
      // @ts-ignore subNames added by combinedEvents mapping
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

  function isEventPast(event: TournamentEvent): boolean {
    try {
      const endDate = event.endDate ? new Date(event.endDate) : new Date(event.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return endDate < today;
    } catch { return false; }
  }

  // GAS stub: logTournamentResult action — backend needs this action added
  async function submitTournamentResult() {
    if (!logResultEvent || !member) return;
    setResultSubmitting(true);
    try {
      await gasCall("logTournamentResult", {
        memberEmail: member.email,
        tournamentId: logResultEvent.name,
        division: resultDivision,
        result: resultPlace,
        notes: resultNotes,
      });
    } catch {
      // Graceful fail — GAS action may not exist yet
    }
    // Show celebration for podium finishes
    if (resultPlace !== "Competed") {
      const emojiMap: Record<string, string> = { Gold: "🥇", Silver: "🥈", Bronze: "🥉" };
      setCelebration({
        emoji: emojiMap[resultPlace] || "🏆",
        place: resultPlace.toUpperCase(),
        name: member.name?.split(" ")[0] || "You",
        tournament: logResultEvent.name,
      });
      setTimeout(() => setCelebration(null), 2500);
    }
    setResultSubmitting(false);
    setLogResultEvent(null);
    setResultDivision("");
    setResultNotes("");
  }

  if (loading) return <div className="app-content"><ScreenHeader title="Calendar" /><ListSkeleton count={5} /></div>;

  return (
    <div className="app-content">
      <ScreenHeader title="Calendar" subtitle="Tournament Schedule" />

      {/* Offline banner */}
      {offline && (
        <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(224,130,40,0.08)", border: "1px solid rgba(224,130,40,0.2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E08228" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M1 6s4-4 11-4 11 4 11 4"/><path d="M5 10s2.5-2.5 7-2.5 7 2.5 7 2.5"/><path d="M9 14s1-1 3-1 3 1 3 1"/><circle cx="12" cy="18" r="1" fill="#E08228"/></svg>
          <p className="text-xs" style={{ color: "#E08228" }}>No connection — showing cached data</p>
          <button onClick={loadData} className="ml-auto text-xs font-semibold" style={{ color: "#E08228", background: "none", border: "none", cursor: "pointer" }}>Retry</button>
        </div>
      )}

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
              {daysUntil(nextHouston.date)} {daysUntil(nextHouston.date) === 1 ? 'day' : 'days'} away
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
                      <span key={j} className="event-dot" style={{ backgroundColor: getOrgColor(e.org), width: 6, height: 6, borderRadius: 3 }} />
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
                      {/* Log Results button for past tournaments */}
                      {isEventPast(event) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLogResultEvent(event); setResultPlace("Gold"); }}
                          className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.97]"
                          style={{ backgroundColor: "rgba(200,162,76,0.12)", color: "#C8A24C", border: "1px solid rgba(200,162,76,0.2)" }}
                        >
                          <Trophy size={11} /> Log Results
                        </button>
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

            {/* Log Results button in detail modal for past events */}
            {isEventPast(selectedEvent) && (
              <button
                onClick={() => { setLogResultEvent(selectedEvent); setSelectedEvent(null); setResultPlace("Gold"); }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mt-4 transition-all active:scale-[0.98]"
                style={{ backgroundColor: "rgba(200,162,76,0.12)", color: "#C8A24C", border: "1px solid rgba(200,162,76,0.2)" }}
              >
                <Trophy size={14} /> Log Results
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Log Results Modal ── */}
      {logResultEvent && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" }}
          onClick={() => setLogResultEvent(null)}
        >
          <div
            style={{
              width: "100%", alignSelf: "center", maxWidth: 480,
              backgroundColor: "#111", borderRadius: "20px 20px 0 0",
              padding: "20px 20px max(32px, env(safe-area-inset-bottom, 32px))",
              maxHeight: "85vh", overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: "0 0 4px" }}>Log Results</h3>
            <p style={{ fontSize: 13, color: "#999", margin: "0 0 20px" }}>{logResultEvent.name}</p>

            {/* Competitor name (pre-filled) */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 6 }}>Competitor</label>
            <div style={{ padding: "10px 12px", backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 10, fontSize: 13, color: "#F0F0F0", marginBottom: 16 }}>
              {member?.name || "—"}
            </div>

            {/* Division */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 6 }}>Division</label>
            <input
              type="text"
              value={resultDivision}
              onChange={e => setResultDivision(e.target.value)}
              placeholder="e.g. Adult Blue Belt Medium Heavy"
              style={{ width: "100%", backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F0F0F0", outline: "none", boxSizing: "border-box", marginBottom: 16, fontFamily: "inherit" }}
            />

            {/* Result */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Result</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {([
                { value: "Gold", emoji: "🥇" },
                { value: "Silver", emoji: "🥈" },
                { value: "Bronze", emoji: "🥉" },
                { value: "Competed", emoji: "💪" },
              ] as const).map(r => (
                <button
                  key={r.value}
                  onClick={() => setResultPlace(r.value)}
                  style={{
                    flex: "1 1 0",
                    padding: "10px 8px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: resultPlace === r.value ? "2px solid #C8A24C" : "2px solid #222",
                    backgroundColor: resultPlace === r.value ? "rgba(200,162,76,0.12)" : "#0D0D0D",
                    color: resultPlace === r.value ? "#C8A24C" : "#666",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{r.emoji}</span>
                  {r.value}
                </button>
              ))}
            </div>

            {/* Notes */}
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 6 }}>Notes <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={resultNotes}
              onChange={e => setResultNotes(e.target.value)}
              placeholder="How did it go?"
              rows={2}
              style={{ width: "100%", backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F0F0F0", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }}
            />

            <p style={{ fontSize: 12, color: "#555", margin: "0 0 20px", lineHeight: 1.5 }}>
              Stats on jits.gg update automatically — this logs your result for the gym's records.
            </p>

            <button
              onClick={submitTournamentResult}
              disabled={resultSubmitting}
              style={{
                width: "100%", padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700,
                backgroundColor: "#C8A24C", color: "#0A0A0A", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: resultSubmitting ? 0.7 : 1,
              }}
            >
              {resultSubmitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : "Submit Result"}
            </button>
          </div>
        </div>
      )}

      {/* ── Celebration Overlay ── */}
      {celebration && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(10,10,10,0.95)",
          animation: "fadeIn 0.3s ease-out",
        }}>
          <style>{`
            @keyframes celebratePulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
            @keyframes celebrateDot {
              0% { opacity: 0; transform: translate(0, 0) scale(0); }
              50% { opacity: 1; }
              100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1); }
            }
          `}</style>
          {/* Confetti dots */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * 360;
            const dist = 80 + Math.random() * 120;
            return (
              <div key={i} style={{
                position: "absolute",
                width: 6 + Math.random() * 6,
                height: 6 + Math.random() * 6,
                borderRadius: i % 3 === 0 ? "50%" : "2px",
                backgroundColor: ["#C8A24C", "#FFD700", "#FFA500", "#FF6347", "#4CAF80"][i % 5],
                top: "50%", left: "50%",
                "--dx": `${Math.cos(angle * Math.PI / 180) * dist}px`,
                "--dy": `${Math.sin(angle * Math.PI / 180) * dist}px`,
                animation: `celebrateDot 2s ease-out ${Math.random() * 0.5}s infinite`,
              } as any} />
            );
          })}
          <span style={{ fontSize: 72, animation: "celebratePulse 1s ease-in-out infinite" }}>{celebration.emoji}</span>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#C8A24C", margin: "16px 0 8px", textAlign: "center" }}>
            {celebration.name} won {celebration.place}!
          </h2>
          <p style={{ fontSize: 14, color: "#999", textAlign: "center" }}>at {celebration.tournament}</p>
        </div>
      )}
    </div>
  );
}
