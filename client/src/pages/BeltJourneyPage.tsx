import { useState, useEffect, useRef } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { BeltIcon, ADULT_BELT_OPTIONS, KIDS_BELT_OPTIONS, BELT_DISPLAY_NAMES } from "@/components/BeltIcon";
import { getBeltColor, getBeltTextColor } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { beltGetPromotions, beltSavePromotion } from "@/lib/api";
import { Plus, X, Trophy, Clock, ChevronDown, Sparkles, Calendar, Edit3, Check, Trash2, Loader2 } from "lucide-react";

interface BeltPromotion {
  id: string;
  belt: string;
  stripes: number;
  date: string;
  note: string;
  status: "pending" | "approved" | "rejected";
}

const BELT_ORDER = ADULT_BELT_OPTIONS;
const YOUTH_BELT_ORDER = KIDS_BELT_OPTIONS;

const BELT_LABELS: Record<string, string> = {
  white: "White Belt",
  blue: "Blue Belt",
  purple: "Purple Belt",
  brown: "Brown Belt",
  black: "Black Belt",
  grey: "Grey Belt",
  yellow: "Yellow Belt",
  orange: "Orange Belt",
  green: "Green Belt",
};

// Spec belt accent colors for card borders
const BELT_ACCENT_COLORS: Record<string, string> = {
  white: "#E5E5E5",
  blue: "#1A56DB",
  purple: "#7E3AF2",
  brown: "#92400E",
  black: "#C8A24C", // gold fallback for black belt
  grey: "#9CA3AF",
  yellow: "#EAB308",
  orange: "#F97316",
  green: "#22C55E",
};

const MOTIVATIONAL_QUOTES = [
  "A black belt is a white belt who never quit.",
  "The ground is my ocean, I'm the shark.",
  "Every tap is a lesson, every roll is growth.",
  "Jiu-jitsu is the gentle art of folding clothes while people are still in them.",
  "Trust the process. The belt will come.",
  "It's not about the belt. It's about what you became to earn it.",
  "Fall seven times, stand up eight.",
  "The best time to start was yesterday. The second best time is now.",
];

function getTimeBetween(date1: string, date2: string): string {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const months = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (remaining === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years}y ${remaining}m`;
}

function getTotalTime(promotions: BeltPromotion[]): string {
  if (promotions.length < 2) return "";
  return getTimeBetween(promotions[0].date, promotions[promotions.length - 1].date);
}

function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

// Confetti burst
function ConfettiBurst({ color }: { color: string }) {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: -(Math.random() * 150 + 50),
    rotation: Math.random() * 360,
    scale: Math.random() * 0.5 + 0.5,
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: 8,
            height: 8,
            backgroundColor: color,
            borderRadius: p.id % 3 === 0 ? "50%" : "1px",
            opacity: 0,
            transform: `translate(-50%, -50%)`,
            animation: `confetti-burst 1s ease-out ${p.delay}s forwards`,
            // @ts-ignore
            "--tx": `${p.x}px`,
            "--ty": `${p.y}px`,
            "--rot": `${p.rotation}deg`,
          } as any}
        />
      ))}
      <style>{`
        @keyframes confetti-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function BeltJourneyPage() {
  const { member, isAuthenticated } = useAuth();
  const [promotions, setPromotions] = useState<BeltPromotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBelt, setNewBelt] = useState("white");
  const [newStripes, setNewStripes] = useState(0);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newNote, setNewNote] = useState("");
  const [showYouth, setShowYouth] = useState(false);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [quote] = useState(getRandomQuote);
  const timelineRef = useRef<HTMLDivElement>(null);

  const beltOptions = showYouth ? YOUTH_BELT_ORDER : BELT_ORDER;

  // Load existing promotions from GAS on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    setLoadingPromotions(true);
    beltGetPromotions().then(list => {
      const sorted = list
        .map(p => ({
          id: p.id,
          belt: p.belt,
          stripes: p.stripes,
          date: typeof p.date === "string" ? p.date.split("T")[0] : String(p.date),
          note: p.note || "",
          status: (p.status || "pending") as "pending" | "approved" | "rejected",
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setPromotions(sorted);
      setLoadingPromotions(false);
    });
  }, [isAuthenticated]);

  // Submit to GAS + notify admin via CRM dashboard widget
  const addPromotion = async () => {
    if (!newDate) return;
    setSubmitting(true);
    setSubmitError("");

    const result = await beltSavePromotion({ belt: newBelt, stripes: newStripes, date: newDate, note: newNote });

    if (!result.success) {
      setSubmitError("Could not submit. Please try again.");
      setSubmitting(false);
      return;
    }

    // Add optimistically with the server-assigned ID
    const promo: BeltPromotion = {
      id: result.promotionId || Date.now().toString(),
      belt: newBelt,
      stripes: newStripes,
      date: newDate,
      note: newNote,
      status: "pending",
    };
    setPromotions(prev => [...prev, promo].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setCelebrateId(promo.id);
    setTimeout(() => setCelebrateId(null), 1500);
    setSubmitting(false);
    resetForm();
  };

  // Edit + delete remain local-only (no GAS edit/delete endpoint exists yet)
  const updatePromotion = (id: string) => {
    const updated = promotions.map(p =>
      p.id === id ? { ...p, belt: newBelt, stripes: newStripes, date: newDate, note: newNote } : p
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setPromotions(updated);
    setEditingId(null);
    resetForm();
  };

  const deletePromotion = (id: string) => {
    setPromotions(promotions.filter(p => p.id !== id));
    setEditingId(null);
  };

  const startEdit = (p: BeltPromotion) => {
    setEditingId(p.id);
    setNewBelt(p.belt);
    setNewStripes(p.stripes);
    setNewDate(p.date);
    setNewNote(p.note);
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setNewBelt("white");
    setNewStripes(0);
    setNewDate(new Date().toISOString().split("T")[0]);
    setNewNote("");
    setSubmitError("");
  };

  const currentBelt = promotions.length > 0 ? promotions[promotions.length - 1] : null;
  const totalTime = getTotalTime(promotions);

  return (
    <div className="app-content" style={{ paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom, 0px) + 80px))' }}>
      <ScreenHeader
        title="Belt Journey"
        subtitle="Track your progression"
      />

      {/* Current Status */}
      {currentBelt ? (
        <div className="mx-5 mb-4 p-5 rounded-2xl relative overflow-hidden" style={{
          background: `linear-gradient(135deg, ${getBeltColor(currentBelt.belt)}15, ${getBeltColor(currentBelt.belt)}05)`,
          border: `1px solid ${getBeltColor(currentBelt.belt)}30`,
          boxShadow: `0 0 0 0 ${getBeltColor(currentBelt.belt)}30`,
          animation: 'belt-pulse 3s ease-in-out infinite',
        }}>
        <style>{`
          @keyframes belt-pulse {
            0%, 100% { box-shadow: 0 0 0 0 ${getBeltColor(currentBelt.belt)}30; }
            50% { box-shadow: 0 0 0 6px ${getBeltColor(currentBelt.belt)}00; }
          }
        `}</style>
          <div className="flex items-center gap-4">
            {/* Belt visual */}
            <div className="relative flex flex-col items-center gap-1">
              <BeltIcon belt={currentBelt.belt} stripes={currentBelt.stripes} width={90} style={{ filter: `drop-shadow(0 2px 12px ${getBeltColor(currentBelt.belt)}50)` }} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold" style={{ color: "#F0F0F0" }}>
                {BELT_LABELS[currentBelt.belt] || currentBelt.belt}
                {currentBelt.stripes > 0 && (
                  <span className="text-sm font-normal ml-1" style={{ color: "#C8A24C" }}>
                    {currentBelt.stripes} stripe{currentBelt.stripes !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
              {totalTime && (
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "#999" }}>
                  <Clock size={10} /> {totalTime} on the mats
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "#666" }}>
                Since {new Date(currentBelt.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Pending Coach Verification Banner */}
      {currentBelt && currentBelt.status === "pending" && (
        <div className="mx-5 mb-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ backgroundColor: 'rgba(224, 130, 40, 0.1)', border: '1px solid rgba(224, 130, 40, 0.15)' }}>
          <Clock size={12} style={{ color: '#E08228' }} />
          <span className="text-xs" style={{ color: '#E08228' }}>This promotion is pending coach verification</span>
        </div>
      )}

      {!currentBelt && (
        <div className="mx-5 mb-4 p-6 rounded-2xl text-center" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#1A1A1A" }}>
            <Trophy size={28} style={{ color: "#C8A24C" }} />
          </div>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#F0F0F0" }}>Your Belt Journey Starts Here</h3>
          <p className="text-xs mb-4" style={{ color: "#666" }}>Add your first promotion to begin tracking your progression</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#C8A24C", color: "#0A0A0A" }}
          >
            <Plus size={16} /> Add Promotion
          </button>
        </div>
      )}

      {/* Motivational Quote */}
      <div className="mx-5 mb-4 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(200, 162, 76, 0.05)", borderLeft: "3px solid #C8A24C" }}>
        <p className="text-xs italic" style={{ color: "#999" }}>"{quote}"</p>
      </div>

      {/* Timeline */}
      {promotions.length > 0 && (
        <div className="mx-5 mb-4" ref={timelineRef}>
          <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#666" }}>Timeline</h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-4 bottom-4 w-0.5" style={{ backgroundColor: "#222" }} />

            <div className="space-y-0">
              {promotions.map((promo, i) => {
                const nextPromo = promotions[i + 1];
                const timeTo = nextPromo ? getTimeBetween(promo.date, nextPromo.date) : null;
                const isCelebrating = celebrateId === promo.id;
                const isEditing = editingId === promo.id;

                return (
                  <div key={promo.id}>
                    <div className="relative flex items-start gap-3 py-2">
                      {/* Belt icon */}
                      <div className="relative z-10 flex flex-col items-center flex-shrink-0 transition-all"
                        style={{
                          transform: isCelebrating ? "scale(1.15)" : "scale(1)",
                          filter: isCelebrating ? `drop-shadow(0 0 12px ${getBeltColor(promo.belt)}80)` : "none",
                          width: 52,
                        }}>
                        {isCelebrating && <ConfettiBurst color={getBeltColor(promo.belt)} />}
                        <BeltIcon belt={promo.belt} stripes={promo.stripes} width={52} />
                      </div>

                      {/* Content */}
                      {isEditing ? (
                        <div className="flex-1 p-3 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #333" }}>
                          <EditForm
                            beltOptions={beltOptions}
                            belt={newBelt}
                            setBelt={setNewBelt}
                            stripes={newStripes}
                            setStripes={setNewStripes}
                            date={newDate}
                            setDate={setNewDate}
                            note={newNote}
                            setNote={setNewNote}
                            onSave={() => updatePromotion(promo.id)}
                            onCancel={() => setEditingId(null)}
                            onDelete={() => deletePromotion(promo.id)}
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(promo)}
                          className="flex-1 text-left p-3 rounded-xl transition-all active:scale-[0.98]"
                          style={{
                            backgroundColor: "#111",
                            border: "1px solid #1A1A1A",
                            borderLeft: `4px solid ${BELT_ACCENT_COLORS[promo.belt] || getBeltColor(promo.belt || 'white')}`,
                            borderTop: `2px solid ${BELT_ACCENT_COLORS[promo.belt] || getBeltColor(promo.belt || 'white')}`,
                            background: `linear-gradient(135deg, ${getBeltColor(promo.belt || 'white')}0F 0%, #111 60%)`,
                          }}
                          data-testid={`promo-card-${i}`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>
                              {BELT_LABELS[promo.belt] || promo.belt}
                              {promo.stripes > 0 && (
                                <span className="text-xs font-normal ml-1" style={{ color: "#C8A24C" }}>
                                  +{promo.stripes}
                                </span>
                              )}
                            </span>
                            <Edit3 size={12} style={{ color: "#444" }} />
                          </div>
                          <p className="text-xs" style={{ color: "#999" }}>
                            {new Date(promo.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </p>
                          {promo.status === "pending" && (
                            <div className="flex items-center gap-1 mt-1">
                              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#E08228' }} />
                              <span className="text-[10px]" style={{ color: '#E08228' }}>Awaiting Coach Approval</span>
                            </div>
                          )}
                          {promo.status === "approved" && (
                            <div className="flex items-center gap-1 mt-1">
                              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4CAF80' }} />
                              <span className="text-[10px]" style={{ color: '#4CAF80' }}>Verified by Coach</span>
                            </div>
                          )}
                          {promo.status === "rejected" && (
                            <div className="flex items-center gap-1 mt-1">
                              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#E05555' }} />
                              <span className="text-[10px]" style={{ color: '#E05555' }}>Not Verified</span>
                            </div>
                          )}
                          {promo.note && (
                            <div className="mt-2 pl-3" style={{ borderLeft: '2px solid #C8A24C40' }}>
                              <p className="text-xs italic" style={{ color: '#999', lineHeight: 1.5 }}>
                                "{promo.note}"
                              </p>
                              <p className="text-[10px] mt-0.5" style={{ color: '#555' }}>Coach's Note</p>
                            </div>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Time between promotions — shows duration at previous belt */}
                    {timeTo && (
                      <div className="flex items-center gap-3 py-1 pl-10">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-px" style={{ backgroundColor: "#333" }} />
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#1A1A1A", color: "#666" }}>
                            {timeTo} at {BELT_LABELS[promo.belt]?.toLowerCase() || promo.belt}
                          </span>
                          <div className="w-4 h-px" style={{ backgroundColor: "#333" }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Promotion */}
      {showAdd ? (
        <div className="mx-5 mb-6 p-4 rounded-2xl" style={{ backgroundColor: "#111", border: "1px solid #333" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Add Promotion</h3>
            <button onClick={resetForm} className="p-1" style={{ color: "#666" }}><X size={18} /></button>
          </div>

          {/* Youth toggle */}
          <div className="flex items-center justify-between mb-4 p-2 rounded-lg" style={{ backgroundColor: "#1A1A1A" }}>
            <span className="text-xs" style={{ color: "#999" }}>Belt system</span>
            <div className="flex gap-1">
              <button
                onClick={() => { setShowYouth(false); setNewBelt("white"); }}
                className="px-3 py-1 text-xs font-medium rounded-md transition-all"
                style={{
                  backgroundColor: !showYouth ? "#C8A24C" : "transparent",
                  color: !showYouth ? "#0A0A0A" : "#666",
                }}
              >
                Adult
              </button>
              <button
                onClick={() => { setShowYouth(true); setNewBelt("white"); }}
                className="px-3 py-1 text-xs font-medium rounded-md transition-all"
                style={{
                  backgroundColor: showYouth ? "#C8A24C" : "transparent",
                  color: showYouth ? "#0A0A0A" : "#666",
                }}
              >
                Youth
              </button>
            </div>
          </div>

          <EditForm
            beltOptions={beltOptions}
            belt={newBelt}
            setBelt={setNewBelt}
            stripes={newStripes}
            setStripes={setNewStripes}
            date={newDate}
            setDate={setNewDate}
            note={newNote}
            setNote={setNewNote}
            onSave={addPromotion}
            onCancel={resetForm}
          />
        </div>
      ) : (
        <div className="mx-5 mb-6">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#C8A24C", color: "#0A0A0A" }}
            data-testid="button-add-promotion"
          >
            <Plus size={18} />
            Add Promotion
          </button>
        </div>
      )}

      {/* Stats if multiple promotions */}
      {promotions.length >= 2 && (
        <div className="mx-5 mb-6">
          <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#666" }}>Journey Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Promotions" value={String(promotions.length)} />
            <StatBox label="Total Time" value={totalTime} />
            <StatBox label="Current" value={currentBelt ? (BELT_LABELS[currentBelt.belt]?.split(" ")[0] || "—") : "—"} />
          </div>
        </div>
      )}
    </div>
  );
}

function EditForm({
  beltOptions, belt, setBelt, stripes, setStripes, date, setDate, note, setNote, onSave, onCancel, onDelete,
}: {
  beltOptions: string[];
  belt: string; setBelt: (b: string) => void;
  stripes: number; setStripes: (s: number) => void;
  date: string; setDate: (d: string) => void;
  note: string; setNote: (n: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Belt Selector — shows actual belt icons */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Belt</label>
        <div className="grid grid-cols-3 gap-2">
          {beltOptions.map(b => (
            <button
              key={b}
              onClick={() => setBelt(b)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
              style={{
                backgroundColor: belt === b ? "rgba(200,162,76,0.12)" : "#1A1A1A",
                border: belt === b ? "1px solid rgba(200,162,76,0.3)" : "1px solid #222",
                transform: belt === b ? "scale(1.03)" : "scale(1)",
              }}
            >
              <BeltIcon belt={b} width={54} />
              <span className="text-[9px]" style={{ color: belt === b ? "#C8A24C" : "#666" }}>
                {BELT_DISPLAY_NAMES[b] || BELT_LABELS[b]?.split(" ")[0] || b}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stripes */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Stripes</label>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(s => (
            <button
              key={s}
              onClick={() => setStripes(s)}
              className="w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center"
              style={{
                backgroundColor: stripes === s ? "#C8A24C" : "#1A1A1A",
                color: stripes === s ? "#0A0A0A" : "#666",
                border: stripes === s ? "none" : "1px solid #222",
              }}
            >
              {s === 0 ? "—" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Promotion Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ backgroundColor: "#1A1A1A", border: "1px solid #222", color: "#F0F0F0", colorScheme: "dark" }}
          data-testid="input-promo-date"
        />
      </div>

      {/* Coach's Note */}
      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Coach's Note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Promoted by Coach Anthony — great performance at Houston Open"
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
          style={{ backgroundColor: "#1A1A1A", border: "1px solid #222", color: "#F0F0F0", fontFamily: "inherit", lineHeight: 1.5 }}
          data-testid="input-promo-note"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
            style={{ backgroundColor: "rgba(224, 85, 85, 0.1)", color: "#E05555" }}
            data-testid="button-delete-promo"
          >
            <Trash2 size={14} />
          </button>
        )}
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all"
          style={{ backgroundColor: "#1A1A1A", color: "#999" }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
          style={{ backgroundColor: "#C8A24C", color: "#0A0A0A" }}
          data-testid="button-save-promo"
        >
          <span className="flex items-center justify-center gap-1">
            <Check size={14} /> Save
          </span>
        </button>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
      <p className="text-base font-bold" style={{ color: "#F0F0F0" }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: "#666" }}>{label}</p>
    </div>
  );
}
