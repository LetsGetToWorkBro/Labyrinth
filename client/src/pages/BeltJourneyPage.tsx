import { useState, useEffect, useRef } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SkeletonBeltJourney } from '@/components/StateComponents';
import { BeltIcon, ADULT_BELT_OPTIONS, KIDS_BELT_OPTIONS, BELT_DISPLAY_NAMES } from "@/components/BeltIcon";
import { getBeltColor } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { beltGetPromotions, beltSavePromotion, beltDeletePromotion, beltUpdatePromotion, getCoachNotes } from "@/lib/api";
import { soundSystem } from '@/lib/sounds';
import { Plus, X, Clock, Edit3, Check, Trash2 } from "lucide-react";

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
  white: "White Belt", blue: "Blue Belt", purple: "Purple Belt",
  brown: "Brown Belt", black: "Black Belt", grey: "Grey Belt",
  yellow: "Yellow Belt", orange: "Orange Belt", green: "Green Belt",
};

const BELT_ACCENT_COLORS: Record<string, string> = {
  white: "#E5E5E5", blue: "#1A56DB", purple: "#7E3AF2",
  brown: "#92400E", black: "#C8A24C", grey: "#9CA3AF",
  yellow: "#EAB308", orange: "#F97316", green: "#22C55E",
};

const BJJ_AVERAGE_MONTHS: Record<string, number> = {
  white: 18, blue: 30, purple: 30, brown: 24,
};

const MOTIVATIONAL_QUOTES = [
  "A black belt is a white belt who never quit.",
  "The ground is my ocean, I'm the shark.",
  "Every tap is a lesson, every roll is growth.",
  "Trust the process. The belt will come.",
  "It's not about the belt. It's about what you became to earn it.",
  "Fall seven times, stand up eight.",
];

function getTimeBetween(date1: string, date2: string): string {
  const d1 = new Date(date1), d2 = new Date(date2);
  const months = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 1) return "< 1 month";
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12), rem = months % 12;
  return rem === 0 ? `${years}y` : `${years}y ${rem}m`;
}

function getMonthsHeld(date1: string, date2: string): number {
  return Math.round((new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

function isNearDate(d1: string, d2: string, days: number) {
  return Math.abs(new Date(d1).getTime() - new Date(d2).getTime()) <= days * 86400000;
}

function getTotalTime(promos: BeltPromotion[]) {
  if (promos.length < 2) return "";
  return getTimeBetween(promos[0].date, promos[promos.length - 1].date);
}

// ── Road node connector ─────────────────────────────────────────
function RoadConnector({ fromBelt, toBelt, months, avgMonths }: { fromBelt: string; toBelt: string; months: number; avgMonths: number }) {
  const pct = Math.min(100, (months / avgMonths) * 100);
  const isEarly = months < avgMonths;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '6px 0', position: 'relative' }}>
      {/* Road line */}
      <div style={{ width: 3, height: 48, borderRadius: 2, background: '#1A1A1A', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: `${pct}%`,
          background: `linear-gradient(to bottom, ${BELT_ACCENT_COLORS[fromBelt] || '#C8A24C'}, ${BELT_ACCENT_COLORS[toBelt] || '#C8A24C'})`,
          transition: 'height 1s cubic-bezier(0.4,0,0.2,1)',
        }}/>
      </div>
      {/* Duration badge */}
      <div style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: '50%', marginLeft: 10,
        whiteSpace: 'nowrap',
        fontSize: 9, fontWeight: 700,
        color: isEarly ? '#4CAF80' : '#555',
        letterSpacing: '0.06em',
      }}>
        {months}mo {isEarly ? '· early ⚡' : ''}
      </div>
    </div>
  );
}

// ── Belt node on the road map ───────────────────────────────────
function BeltNode({
  promo, isCurrent, isCelebrating, onTap, coachNotes,
}: {
  promo: BeltPromotion;
  isCurrent: boolean;
  isCelebrating: boolean;
  onTap: () => void;
  coachNotes: Array<{ date: string; note: string; coach: string }>;
}) {
  const beltColor = BELT_ACCENT_COLORS[promo.belt] || getBeltColor(promo.belt);
  const nearNotes = coachNotes.filter(n => isNearDate(n.date, promo.date, 90));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingLeft: 20, paddingRight: 20, position: 'relative' }}>
      {/* Left: Belt icon orb */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={onTap}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            position: 'relative',
            transform: isCelebrating ? 'scale(1.18)' : isCurrent ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
            filter: isCurrent ? `drop-shadow(0 0 14px ${beltColor}70)` : 'none',
          }}
        >
          {/* Pulsing aura on current belt */}
          {isCurrent && (
            <div style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              background: `radial-gradient(circle, ${beltColor}25 0%, transparent 70%)`,
              animation: 'ring-pulse 2.5s ease-in-out infinite',
              pointerEvents: 'none',
            }}/>
          )}
          <BeltIcon
            belt={promo.belt}
            stripes={promo.stripes}
            width={64}
          />
          {isCurrent && (
            <div style={{
              position: 'absolute', top: -6, right: -6,
              width: 18, height: 18, borderRadius: '50%',
              background: '#C8A24C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 900, color: '#000',
              border: '2px solid #0A0A0A',
              boxShadow: '0 0 6px rgba(200,162,76,0.8)',
            }}>
              ★
            </div>
          )}
        </button>
      </div>

      {/* Right: Card */}
      <button
        onClick={onTap}
        style={{
          flex: 1, textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          marginBottom: 4,
        }}
      >
        <div style={{
          background: isCurrent
            ? `linear-gradient(135deg, ${beltColor}15 0%, #111 60%)`
            : 'linear-gradient(135deg, #0F0F0F, #111)',
          border: `1px solid ${isCurrent ? beltColor + '40' : '#1A1A1A'}`,
          borderRadius: 14,
          padding: '12px 14px',
          boxShadow: isCurrent ? `0 0 20px ${beltColor}15` : 'none',
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0' }}>
                {BELT_LABELS[promo.belt] || promo.belt}
              </span>
              {promo.stripes > 0 && (
                <span style={{ fontSize: 11, color: '#C8A24C', marginLeft: 6, fontWeight: 600 }}>
                  {promo.stripes} stripe{promo.stripes !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Edit3 size={11} color="#333" />
          </div>

          <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
            {new Date(promo.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>

          {/* Status pill */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: promo.note ? 8 : 0 }}>
            {promo.status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(224,130,40,0.1)', border: '1px solid rgba(224,130,40,0.2)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E08228' }}/>
                <span style={{ fontSize: 9, color: '#E08228', fontWeight: 700 }}>Awaiting Approval</span>
              </div>
            )}
            {promo.status === 'approved' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(76,175,128,0.1)', border: '1px solid rgba(76,175,128,0.2)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4CAF80' }}/>
                <span style={{ fontSize: 9, color: '#4CAF80', fontWeight: 700 }}>Coach Verified</span>
              </div>
            )}
            {promo.status === 'rejected' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(224,85,85,0.1)', border: '1px solid rgba(224,85,85,0.2)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E05555' }}/>
                <span style={{ fontSize: 9, color: '#E05555', fontWeight: 700 }}>Not Verified</span>
              </div>
            )}
          </div>

          {/* Coach's note as a torn-paper pin card */}
          {nearNotes.map((n, ni) => (
            <div key={ni} style={{
              marginTop: 10, padding: '10px 12px',
              background: '#1A1712',
              border: '1px solid #2A2520',
              borderRadius: 8,
              transform: `rotate(${ni % 2 === 0 ? -1.2 : 1.0}deg)`,
              boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
              position: 'relative',
            }}>
              {/* Pin */}
              <div style={{
                position: 'absolute', top: -5, left: '50%',
                width: 10, height: 10, borderRadius: '50%',
                background: '#C8A24C', transform: 'translateX(-50%)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
              }}/>
              <div style={{ fontSize: 12, color: '#D4C8A0', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{n.note}"
              </div>
              <div style={{ fontSize: 9, color: '#5A5040', marginTop: 6 }}>
                — {n.coach} · {new Date(n.date).toLocaleDateString()}
              </div>
            </div>
          ))}

          {/* Inline note if no coach note */}
          {promo.note && nearNotes.length === 0 && (
            <div style={{ marginTop: 8, paddingLeft: 10, borderLeft: '2px solid #C8A24C30' }}>
              <p style={{ fontSize: 11, color: '#777', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>"{promo.note}"</p>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

// ── Hero header for current belt ────────────────────────────────
function BeltHero({ promo, totalTime, totalClasses }: { promo: BeltPromotion; totalTime: string; totalClasses: number }) {
  const beltColor = BELT_ACCENT_COLORS[promo.belt] || getBeltColor(promo.belt);
  const [animIn, setAnimIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimIn(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      margin: '0 20px 20px',
      borderRadius: 20,
      overflow: 'hidden',
      position: 'relative',
      background: `linear-gradient(160deg, ${beltColor}20 0%, #0D0D0D 50%, #111 100%)`,
      border: `1px solid ${beltColor}35`,
      boxShadow: `0 0 40px ${beltColor}12`,
    }}>
      {/* Background shimmer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 30% 30%, ${beltColor}12 0%, transparent 60%)`,
        pointerEvents: 'none',
      }}/>

      <div style={{ padding: '24px 20px', position: 'relative' }}>
        {/* Current rank label */}
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: beltColor, marginBottom: 14,
          opacity: animIn ? 1 : 0, transition: 'opacity 400ms ease 100ms',
        }}>
          Current Rank
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Belt icon */}
          <div style={{
            opacity: animIn ? 1 : 0,
            transform: animIn ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(10px)',
            transition: 'all 500ms cubic-bezier(0.34,1.56,0.64,1) 150ms',
            filter: `drop-shadow(0 4px 20px ${beltColor}60)`,
            flexShrink: 0,
          }}>
            <BeltIcon belt={promo.belt} stripes={promo.stripes} width={100} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 24, fontWeight: 900, color: '#F0F0F0',
              letterSpacing: '-0.02em',
              opacity: animIn ? 1 : 0, transition: 'opacity 400ms ease 300ms',
            }}>
              {BELT_LABELS[promo.belt] || promo.belt}
            </div>
            {promo.stripes > 0 && (
              <div style={{
                fontSize: 13, color: '#C8A24C', fontWeight: 600, marginBottom: 4,
                opacity: animIn ? 1 : 0, transition: 'opacity 400ms ease 400ms',
              }}>
                {promo.stripes} stripe{promo.stripes !== 1 ? 's' : ''}
              </div>
            )}
            <div style={{
              fontSize: 11, color: '#555',
              opacity: animIn ? 1 : 0, transition: 'opacity 400ms ease 450ms',
            }}>
              Since {new Date(promo.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats row */}
        {(totalTime || totalClasses > 0) && (
          <div style={{
            display: 'flex', gap: 0, marginTop: 18,
            borderTop: `1px solid ${beltColor}20`, paddingTop: 14,
            opacity: animIn ? 1 : 0, transition: 'opacity 500ms ease 500ms',
          }}>
            {totalTime && (
              <div style={{ flex: 1, textAlign: 'center', borderRight: `1px solid ${beltColor}15` }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#F0F0F0' }}>{totalTime}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>On the mats</div>
              </div>
            )}
            {totalClasses > 0 && (
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#C8A24C' }}>{totalClasses}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>Total classes</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state: no belt yet ────────────────────────────────────
function EmptyBeltState({ onAdd }: { onAdd: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 5), 1000);
    return () => clearInterval(t);
  }, []);
  const belts = ['white', 'blue', 'purple', 'brown', 'black'];
  return (
    <div style={{ margin: '0 20px 20px', padding: '32px 24px', borderRadius: 20, background: '#0D0D0D', border: '1px solid #1A1A1A', textAlign: 'center' }}>
      {/* Cycling belt preview */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
        {belts.map((b, i) => (
          <div key={b} style={{
            opacity: i === step ? 1 : 0.15,
            transform: i === step ? 'scale(1.1)' : 'scale(0.9)',
            transition: 'all 400ms cubic-bezier(0.34,1.56,0.64,1)',
            filter: i === step ? `drop-shadow(0 0 8px ${BELT_ACCENT_COLORS[b]}60)` : 'none',
          }}>
            <BeltIcon belt={b} width={40} />
          </div>
        ))}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: '#F0F0F0', marginBottom: 8 }}>
        Your Journey Starts Here
      </div>
      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6, maxWidth: 240, margin: '0 auto 20px' }}>
        Every black belt started with a white belt and a single class. Record yours.
      </div>
      <button onClick={onAdd} style={{
        padding: '13px 32px', borderRadius: 12,
        background: '#C8A24C', color: '#000',
        fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        boxShadow: '0 0 20px rgba(200,162,76,0.3)',
      }}>
        <Plus size={16} /> Log My First Belt
      </button>
    </div>
  );
}

export default function BeltJourneyPage() {
  const { member, isAuthenticated } = useAuth();
  const [promotions, setPromotions] = useState<BeltPromotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [ceremonyBelt, setCeremonyBelt] = useState<string | null>(null);
  const [newBelt, setNewBelt] = useState("white");
  const [newStripes, setNewStripes] = useState(0);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [newNote, setNewNote] = useState("");
  const [showYouth, setShowYouth] = useState(false);
  const [celebrateId, setCelebrateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [coachNotes, setCoachNotes] = useState<Array<{ date: string; note: string; coach: string }>>([]);
  const [quote] = useState(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

  const beltOptions = showYouth ? YOUTH_BELT_ORDER : BELT_ORDER;

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    // Show cached list immediately while fetching (prevents delete flicker)
    try {
      const cached = localStorage.getItem('lbjj_belt_promotions_cache');
      if (cached) setPromotions(JSON.parse(cached));
    } catch {}

    beltGetPromotions().then(list => {
      let deletedIds: string[] = [];
      try { deletedIds = JSON.parse(localStorage.getItem('lbjj_belt_deleted_ids') || '[]'); } catch {}
      const filtered = list
        .filter(p => !deletedIds.includes(p.id))
        .map(p => ({
          id: p.id, belt: p.belt, stripes: p.stripes,
          date: typeof p.date === "string" ? p.date.split("T")[0] : String(p.date),
          note: p.note || "",
          status: (p.status || "pending") as BeltPromotion['status'],
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setPromotions(filtered);
      // Update cache with fresh server data
      try { localStorage.setItem('lbjj_belt_promotions_cache', JSON.stringify(filtered)); } catch {}
      setLoading(false);
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (member?.email) getCoachNotes(member.email).then(setCoachNotes).catch(() => {});
  }, [member?.email]);

  const addPromotion = async () => {
    if (!newDate) return;
    setSubmitting(true); setSubmitError("");
    const result = await beltSavePromotion({ belt: newBelt, stripes: newStripes, date: newDate, note: newNote });
    if (!result.success) { setSubmitError("Could not submit. Try again."); setSubmitting(false); return; }
    const promo: BeltPromotion = { id: result.promotionId || Date.now().toString(), belt: newBelt, stripes: newStripes, date: newDate, note: newNote, status: "pending" };
    setPromotions(prev => [...prev, promo].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setCelebrateId(promo.id);
    setTimeout(() => setCelebrateId(null), 1500);
    soundSystem.play('beltPromo');
    setCeremonyBelt(newBelt);
    (() => { try { navigator.vibrate?.([80, 400, 80, 150, 40, 80, 40]); } catch {} })();
    setSubmitting(false);
    resetForm();
  };

  const updatePromotion = (id: string) => {
    beltUpdatePromotion({ promotionId: id, belt: newBelt, stripes: newStripes, date: newDate, note: newNote }).catch(() => {});
    setPromotions(prev => prev.map(p => p.id === id ? { ...p, belt: newBelt, stripes: newStripes, date: newDate, note: newNote } : p).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setEditingId(null); resetForm();
  };

  const deletePromotion = async (id: string) => {
    setEditingId(null);
    // Optimistically remove and cache remaining list immediately
    setPromotions(prev => {
      const updated = prev.filter(p => p.id !== id);
      try { localStorage.setItem('lbjj_belt_promotions_cache', JSON.stringify(updated)); } catch {}
      return updated;
    });
    // Track in deleted IDs so re-fetch filters it out during GAS sync lag
    try {
      const deletedRaw = localStorage.getItem('lbjj_belt_deleted_ids') || '[]';
      const deleted: string[] = JSON.parse(deletedRaw);
      if (!deleted.includes(id)) deleted.push(id);
      localStorage.setItem('lbjj_belt_deleted_ids', JSON.stringify(deleted));
    } catch {}
    // Fire GAS delete (best-effort — UI already updated)
    try { await beltDeletePromotion(id); } catch {}
  };

  const startEdit = (p: BeltPromotion) => {
    setEditingId(p.id); setNewBelt(p.belt); setNewStripes(p.stripes); setNewDate(p.date); setNewNote(p.note);
  };

  const resetForm = () => {
    setShowAdd(false); setEditingId(null);
    setNewBelt("white"); setNewStripes(0);
    setNewDate(new Date().toISOString().split("T")[0]); setNewNote(""); setSubmitError("");
  };

  const currentBelt = promotions.length > 0 ? promotions[promotions.length - 1] : null;
  const totalTime = getTotalTime(promotions);
  const totalClasses = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}').classesAttended || 0; } catch { return 0; } })();

  return (
    <div className="app-content" style={{ paddingBottom: 'max(100px, calc(env(safe-area-inset-bottom, 0px) + 80px))' }}>
      <ScreenHeader title="Belt Journey" subtitle="Your path to the top" />

      {loading && (
        <SkeletonBeltJourney />
      )}

      {!loading && (
        <>
          {/* Hero or empty state */}
          {currentBelt
            ? <BeltHero promo={currentBelt} totalTime={totalTime} totalClasses={totalClasses} />
            : <EmptyBeltState onAdd={() => setShowAdd(true)} />
          }

          {/* Pending verification banner */}
          {currentBelt?.status === 'pending' && (
            <div style={{
              margin: '0 20px 16px', padding: '10px 14px', borderRadius: 10,
              background: 'rgba(224,130,40,0.08)', border: '1px solid rgba(224,130,40,0.2)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Clock size={12} color="#E08228" />
              <span style={{ fontSize: 12, color: '#E08228' }}>Pending coach verification</span>
            </div>
          )}

          {/* Motivational quote */}
          <div style={{
            margin: '0 20px 20px', padding: '12px 16px', borderRadius: 12,
            background: 'rgba(200,162,76,0.04)', borderLeft: '3px solid #C8A24C30',
          }}>
            <p style={{ fontSize: 12, color: '#666', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>"{quote}"</p>
          </div>

          {/* Road map timeline */}
          {promotions.length > 0 && (
            <div style={{ paddingBottom: 8 }}>
              <div style={{ margin: '0 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555' }}>
                  The Road
                </div>
                <div style={{ fontSize: 10, color: '#333' }}>
                  {promotions.length} promotion{promotions.length !== 1 ? 's' : ''}
                </div>
              </div>

              {promotions.map((promo, i) => {
                const nextPromo = promotions[i + 1];
                const isEditing = editingId === promo.id;
                const isCurrent = i === promotions.length - 1;

                return (
                  <div key={promo.id} className="reveal-item" style={{ transitionDelay: `${i * 60}ms` }}>
                    {/* Swipe container */}
                    <div
                      onTouchStart={e => { (e.currentTarget as any)._sx = e.touches[0].clientX; }}
                      onTouchEnd={e => {
                        const dx = (e.currentTarget as any)._sx - e.changedTouches[0].clientX;
                        if (dx > 60) setSwipedId(swipedId === promo.id ? null : promo.id);
                        else if (dx < -20) setSwipedId(null);
                      }}
                      style={{ position: 'relative' }}
                    >
                      {swipedId === promo.id && (
                        <button
                          onClick={() => { deletePromotion(promo.id); setSwipedId(null); }}
                          style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: '#E05555', border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Trash2 size={13} color="#fff"/>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Delete</span>
                        </button>
                      )}

                      {isEditing ? (
                        <div style={{ margin: '0 20px', padding: '16px', borderRadius: 16, background: '#111', border: '1px solid #222', marginBottom: 4 }}>
                          <EditForm
                            beltOptions={beltOptions}
                            belt={newBelt} setBelt={setNewBelt}
                            stripes={newStripes} setStripes={setNewStripes}
                            date={newDate} setDate={setNewDate}
                            note={newNote} setNote={setNewNote}
                            onSave={() => updatePromotion(promo.id)}
                            onCancel={() => setEditingId(null)}
                            onDelete={() => deletePromotion(promo.id)}
                          />
                        </div>
                      ) : (
                        <BeltNode
                          promo={promo}
                          isCurrent={isCurrent}
                          isCelebrating={celebrateId === promo.id}
                          onTap={() => startEdit(promo)}
                          coachNotes={coachNotes}
                        />
                      )}
                    </div>

                    {/* Road connector between nodes */}
                    {nextPromo && (() => {
                      const months = getMonthsHeld(promo.date, nextPromo.date);
                      const avg = BJJ_AVERAGE_MONTHS[promo.belt] || 24;
                      return (
                        <div style={{ marginLeft: 52, position: 'relative' }}>
                          <RoadConnector fromBelt={promo.belt} toBelt={nextPromo.belt} months={months} avgMonths={avg} />
                        </div>
                      );
                    })()}

                    {/* Current belt: road extends into the future */}
                    {isCurrent && (
                      <div style={{ marginLeft: 52 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingLeft: 20 }}>
                          <div style={{ width: 3, height: 32, borderRadius: 2, background: 'linear-gradient(to bottom, #1A1A1A, transparent)' }}/>
                          <div style={{
                            fontSize: 11, color: '#2A2A2A', fontStyle: 'italic', marginTop: 4,
                            letterSpacing: '0.08em',
                          }}>
                            ···
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add promotion */}
          {showAdd ? (
            <div style={{ margin: '0 20px 24px', padding: '20px', borderRadius: 20, background: '#111', border: '1px solid #222' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0' }}>Log Promotion</div>
                <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Youth toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '8px 12px', borderRadius: 10, background: '#1A1A1A' }}>
                <span style={{ fontSize: 12, color: '#777' }}>Belt system</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['Adult', 'Youth'].map((label, idx) => (
                    <button key={label} onClick={() => { setShowYouth(idx === 1); setNewBelt('white'); }} style={{
                      padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      background: showYouth === (idx === 1) ? '#C8A24C' : 'transparent',
                      color: showYouth === (idx === 1) ? '#000' : '#555',
                      transition: 'all 150ms ease',
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              <EditForm
                beltOptions={beltOptions}
                belt={newBelt} setBelt={setNewBelt}
                stripes={newStripes} setStripes={setNewStripes}
                date={newDate} setDate={setNewDate}
                note={newNote} setNote={setNewNote}
                onSave={addPromotion}
                onCancel={resetForm}
                submitting={submitting}
                error={submitError}
              />
            </div>
          ) : (
            <div style={{ margin: '8px 20px 24px' }}>
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, padding: '14px', borderRadius: 14,
                  background: '#C8A24C', color: '#000',
                  fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(200,162,76,0.2)',
                  transition: 'transform 120ms ease, box-shadow 120ms ease',
                }}
                className="active:scale-[0.97]"
                data-testid="button-add-promotion"
              >
                <Plus size={18} />
                {promotions.length === 0 ? 'Log My First Belt' : 'Add Promotion'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Belt ceremony overlay */}
      {ceremonyBelt && (() => {
        const bColor = getBeltColor(ceremonyBelt);
        return (
          <div
            onClick={() => setCeremonyBelt(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 10001,
              background: 'rgba(0,0,0,0.96)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 24, textAlign: 'center', padding: 40,
              animation: 'modal-enter 400ms cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: bColor }}>New Promotion</div>
            <div style={{ animation: 'badge-ceremony-badge-in 500ms cubic-bezier(0.34,1.56,0.64,1) 200ms both', transform: 'scale(0)' }}>
              <BeltIcon belt={ceremonyBelt} stripes={0} width={180} style={{ filter: `drop-shadow(0 4px 24px ${bColor}80)` }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: bColor, animation: 'badge-ceremony-text-in 400ms ease 500ms both', opacity: 0 }}>
              {BELT_LABELS[ceremonyBelt] || ceremonyBelt}
            </div>
            <div style={{ fontSize: 14, color: '#666', animation: 'badge-ceremony-text-in 400ms ease 650ms both', opacity: 0 }}>
              Submitted for coach approval.
            </div>
            <button
              onClick={e => { e.stopPropagation(); setCeremonyBelt(null); }}
              style={{ padding: '14px 40px', borderRadius: 14, background: bColor, color: '#000', fontWeight: 900, fontSize: 18, border: 'none', cursor: 'pointer', letterSpacing: '0.08em', animation: 'badge-ceremony-text-in 400ms ease 800ms both', opacity: 0, boxShadow: `0 0 30px ${bColor}50` }}
            >
              OSS!
            </button>
          </div>
        );
      })()}
    </div>
  );
}

function EditForm({
  beltOptions, belt, setBelt, stripes, setStripes, date, setDate, note, setNote,
  onSave, onCancel, onDelete, submitting = false, error = "",
}: {
  beltOptions: string[]; belt: string; setBelt: (b: string) => void;
  stripes: number; setStripes: (s: number) => void;
  date: string; setDate: (d: string) => void;
  note: string; setNote: (n: string) => void;
  onSave: () => void; onCancel: () => void;
  onDelete?: () => void; submitting?: boolean; error?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Belt selector */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 10 }}>Belt</div>
        <div className="reveal-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {beltOptions.map(b => (
            <button key={b} onClick={() => setBelt(b)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              padding: '10px 6px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: belt === b ? 'rgba(200,162,76,0.1)' : '#1A1A1A',
              outline: belt === b ? '1px solid rgba(200,162,76,0.35)' : '1px solid #222',
              transform: belt === b ? 'scale(1.03)' : 'scale(1)',
              transition: 'all 150ms ease',
            }}>
              <BeltIcon belt={b} width={52} />
              <span style={{ fontSize: 9, color: belt === b ? '#C8A24C' : '#555', fontWeight: 600 }}>
                {BELT_DISPLAY_NAMES[b] || BELT_LABELS[b]?.split(' ')[0] || b}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stripes */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 8 }}>Stripes</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2, 3, 4].map(s => (
            <button key={s} onClick={() => setStripes(s)} style={{
              width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: stripes === s ? '#C8A24C' : '#1A1A1A',
              color: stripes === s ? '#000' : '#555',
              fontSize: 13, fontWeight: 700,
              outline: stripes === s ? 'none' : '1px solid #222',
              transition: 'all 150ms ease',
            }}>
              {s === 0 ? '—' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 8 }}>Promotion Date</div>
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#1A1A1A', border: '1px solid #222', color: '#F0F0F0', fontSize: 13, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }}
          data-testid="input-promo-date"
        />
      </div>

      {/* Note */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555', marginBottom: 8 }}>Coach's Note (optional)</div>
        <textarea
          value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. Promoted by Coach Anthony — great performance"
          rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#1A1A1A', border: '1px solid #222', color: '#F0F0F0', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          data-testid="input-promo-note"
        />
      </div>

      {error && <div style={{ fontSize: 12, color: '#E05555' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8 }}>
        {onDelete && (
          <button onClick={onDelete} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(224,85,85,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} data-testid="button-delete-promo">
            <Trash2 size={14} color="#E05555" />
          </button>
        )}
        <button onClick={onCancel} style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#1A1A1A', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888', fontWeight: 600 }}>Cancel</button>
        <button onClick={onSave} disabled={submitting} style={{ flex: 2, padding: '12px', borderRadius: 10, background: '#C8A24C', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 800, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: submitting ? 0.7 : 1 }} data-testid="button-save-promo">
          {submitting ? '…' : <><Check size={14} /> Save</>}
        </button>
      </div>
    </div>
  );
}
