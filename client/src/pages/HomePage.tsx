import { useAuth } from "@/lib/auth-context";
import type { FamilyMember, PaymentCard } from "@/lib/api";
import { beltSavePromotion } from "@/lib/api";
import { BeltIcon } from "@/components/BeltIcon";
import { ADULT_BELT_OPTIONS } from "@/components/BeltIcon";
import { getBeltColor, CLASS_SCHEDULE } from "@/lib/constants";
import { chatGetChannels, fetchCSV, parseCSV, CSV_ENDPOINTS } from "@/lib/api";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  CreditCard, FileText, ChevronRight, ChevronDown, LogOut,
  Users, Check, Loader2, Plus, Trash2, Star, CheckCircle, Shield,
} from "lucide-react";
import {
  memberGetCards, memberSetDefaultCard, memberRemoveCard,
  memberAddCard, memberCreateSetupLink,
} from "@/lib/api";
import { useState, useEffect, useCallback, useRef } from "react";

// ── Badge unlock overlay (shared with SchedulePage pattern) ────
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

const haptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

function parseClassMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    const d = new Date(timeStr);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
  const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function formatClassTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('T') && timeStr.includes('Z')) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
    });
  }
  return timeStr;
}

const beltColorMap: Record<string, string> = {
  white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6',
  brown: '#92400E', black: '#1A1A1A', grey: '#9CA3AF',
  yellow: '#EAB308', orange: '#F97316', green: '#22C55E',
};

export default function HomePage() {
  const { member, familyMembers, isAuthenticated, logout, switchProfile } = useAuth();

  const avatarBg = beltColorMap[(member?.belt || 'white').toLowerCase()] || '#C8A24C';
  const avatarFg = ['white', 'yellow', 'grey'].includes((member?.belt || '').toLowerCase()) ? '#0A0A0A' : '#FFFFFF';
  const [switchingRow, setSwitchingRow] = useState<number | null>(null);
  const [showFamilySwitcher, setShowFamilySwitcher] = useState(false);
  const [switchError, setSwitchError] = useState("");
  const [showRankRequest, setShowRankRequest] = useState(false);
  const [rankBelt, setRankBelt] = useState("");
  const [rankStripes, setRankStripes] = useState(0);
  const [rankNote, setRankNote] = useState("");
  const [rankSubmitting, setRankSubmitting] = useState(false);
  const [rankSent, setRankSent] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  // Profile photo state
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try { return localStorage.getItem('lbjj_profile_picture'); } catch { return null; }
  });
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const handleAvatarPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setProfilePic(base64);
      try { localStorage.setItem('lbjj_profile_picture', base64); } catch {}
    };
    img.src = URL.createObjectURL(file);
  };

  // Card management state
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState("");
  const [cardActionId, setCardActionId] = useState<string | null>(null); // which card is acting
  const [addingCard, setAddingCard] = useState(false);

  // Detect ?cardAdded=1 query param after Stripe redirect
  useEffect(() => {
    if (window.location.search.includes("cardAdded=1")) {
      // Strip the param without reload
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
      if (isAuthenticated) loadCards();
    }
  }, [isAuthenticated]);

  const loadCards = useCallback(async () => {
    setCardsLoading(true);
    setCardsError("");
    const result = await memberGetCards();
    setCards(result);
    setCardsLoading(false);
  }, []);

  // Load cards once authenticated
  useEffect(() => {
    if (isAuthenticated && member) loadCards();
  }, [isAuthenticated, member?.row]);

  const handleSetDefault = async (pmId: string) => {
    setCardActionId(pmId);
    const result = await memberSetDefaultCard(pmId);
    if (result.success) {
      await loadCards();
    } else {
      setCardsError(result.error || "Failed to update default card");
    }
    setCardActionId(null);
  };

  const handleRemove = async (pmId: string, last4: string) => {
    if (!confirm(`Remove card ending ${last4}?`)) return;
    setCardActionId(pmId);
    const result = await memberRemoveCard(pmId);
    if (result.success) {
      setCards(prev => prev.filter(c => c.id !== pmId));
    } else {
      setCardsError(result.error || "Failed to remove card");
    }
    setCardActionId(null);
  };

  const handleAddCard = async () => {
    setAddingCard(true);
    const result = await memberAddCard();
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      // Fallback to old setup link
      try {
        const setup = await memberCreateSetupLink();
        if (setup.url) window.open(setup.url, "_blank");
      } catch {
        setCardsError("Could not open card setup. Try again.");
      }
      setAddingCard(false);
    }
  };

  const handleSwitchProfile = async (fm: FamilyMember) => {
    if (fm.row === member?.row) { setShowFamilySwitcher(false); return; }
    setSwitchingRow(fm.row);
    setSwitchError("");
    const result = await switchProfile(fm.row);
    setSwitchingRow(null);
    if (result.success) setShowFamilySwitcher(false);
    else setSwitchError(result.error || "Failed to switch profile");
  };

  // ─── Personalized greeting ─────────────────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeOfDay: string;
    if (hour >= 5 && hour < 12) timeOfDay = "Good morning";
    else if (hour >= 12 && hour < 18) timeOfDay = "Good afternoon";
    else if (hour >= 18 && hour < 24) timeOfDay = "Good evening";
    else timeOfDay = "Good night";
    const firstName = member?.name?.split(" ")[0] || "Warrior";
    return `${timeOfDay}, ${firstName} 👋`;
  };

  const streakCount = (member as any)?.currentStreak || 0;

  // ─── Today's check-in count (immediate, localStorage-based) ────
  const [classesToday, setClassesToday] = useState(0);
  const readClassesToday = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('lbjj_checkins_today') || '{}');
      const today = new Date().toISOString().split('T')[0];
      setClassesToday(raw.date === today ? (raw.count || 0) : 0);
    } catch { setClassesToday(0); }
  }, []);
  useEffect(() => {
    readClassesToday();
    const onFocus = () => readClassesToday();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [readClassesToday]);

  // ─── Streak milestone celebration ──────────────────────────────────
  useEffect(() => {
    if (!streakCount) return;
    const lastMilestone = parseInt(localStorage.getItem('lbjj_last_streak_milestone') || '0');
    const milestones = [7, 14, 21, 30, 52];
    const newMilestone = milestones.find(m => streakCount >= m && m > lastMilestone);
    if (newMilestone) {
      localStorage.setItem('lbjj_last_streak_milestone', String(newMilestone));
      showBadgeUnlock({ key: 'streak', label: `${newMilestone}-Week Streak!`, icon: '\u{1F525}', desc: `${newMilestone} consecutive weeks of training. Consistency is everything.`, color: '#F97316' });
    }
  }, [streakCount]);

  // ─── Next Class widget ─────────────────────────────────────────────
  const getNextClass = useCallback(() => {
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const today = days[now.getDay()];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
      const checkDay = days[(now.getDay() + dayOffset) % 7];
      const dayClasses = CLASS_SCHEDULE
        .filter(c => c.day === checkDay)
        .sort((a, b) => parseClassMinutes(a.time) - parseClassMinutes(b.time));
      for (const cls of dayClasses) {
        const clsMins = parseClassMinutes(cls.time);
        if (dayOffset > 0 || clsMins > currentMins + 15) {
          return { ...cls, isToday: dayOffset === 0, dayLabel: dayOffset === 0 ? 'Today' : 'Tomorrow' };
        }
      }
    }
    return null;
  }, []);

  const nextClass = getNextClass();

  // ─── Weekly training dots ─────────────────────────────────────────
  const weeklyTraining = useCallback(() => {
    const DAYS = ['M','T','W','T','F','S','S'];
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7; // Mon=0
    // Get the Monday of this week
    const monday = new Date(now);
    monday.setDate(now.getDate() - todayIdx);
    monday.setHours(0, 0, 0, 0);

    let weekly: string[] = [];
    try { weekly = JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]'); } catch {}

    return DAYS.map((d, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      return {
        label: d,
        trained: weekly.includes(dateStr),
        isToday: i === todayIdx,
      };
    });
  }, []);

  const weekDots = weeklyTraining();

  // ─── Tournament countdown ─────────────────────────────────────────
  const [nextTournament, setNextTournament] = useState<{ name: string; date: string } | null>(null);
  const [tournamentDaysUntil, setTournamentDaysUntil] = useState(0);

  useEffect(() => {
    const CACHE_KEY = 'lbjj_tournaments_cache';
    const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

    async function loadTournaments() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            findNext(data);
            return;
          }
        }
      } catch {}

      try {
        const csv = await fetchCSV(CSV_ENDPOINTS.events);
        const events = parseCSV<any>(csv).map((e: any) => ({
          date: e.Date || e.date || '',
          name: e.Name || e.name || '',
        }));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: events, ts: Date.now() })); } catch {}
        findNext(events);
      } catch {}
    }

    function findNext(events: { date: string; name: string }[]) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      let best: { name: string; date: string; days: number } | null = null;
      for (const ev of events) {
        if (!ev.date) continue;
        const d = new Date(ev.date);
        if (isNaN(d.getTime())) continue;
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 30 && (!best || diff < best.days)) {
          best = { name: ev.name, date: ev.date, days: diff };
        }
      }
      if (best) {
        setNextTournament({ name: best.name, date: best.date });
        setTournamentDaysUntil(best.days);
      }
    }

    loadTournaments();
  }, []);

  // ─── Announcement preview ─────────────────────────────────────────
  const [announcementPreview, setAnnouncementPreview] = useState<string | null>(null);

  useEffect(() => {
    chatGetChannels().then(channels => {
      const ann = channels.find(ch => ch.id === 'announcements');
      if (ann?.lastMessage) {
        setAnnouncementPreview(ann.lastMessage);
      }
    }).catch(() => {});
  }, []);

  // ─── Logged-in home ───────────────────────────────────────────────
  const hasWarnings = !member.waiverSigned || !member.agreementSigned;
  const hasFamily = familyMembers.length > 1;
  const joinDate = (() => {
    const d = member.joinDate || (member as any)?.startDate || (member as any)?.StartDate || (member as any)?.memberSince || (member as any)?.['Start Date'] || (member as any)?.CreatedAt;
    if (!d) return 'Charter Member';
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch { return 'Charter Member'; }
  })();

  const defaultCard = cards.find(c => c.isDefault) || cards[0];

  return (
    <div className="app-content">
      <ScreenHeader
        title="Home"
        right={
          <button onClick={logout} className="p-2 rounded-lg transition-colors" style={{ color: "#666" }} data-testid="button-logout">
            <LogOut size={18} />
          </button>
        }
      />

      {/* Personalized greeting */}
      <div className="mx-5 mb-4">
        <h1 className="text-xl font-bold" style={{ color: "#F0F0F0" }} data-testid="text-greeting">
          {getGreeting()}
        </h1>
      </div>

      {/* Profile card — collapsible */}
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarPhoto}
        style={{ display: 'none' }}
      />
      <div className="mx-5 mb-3" style={{ transition: 'all 0.2s ease' }}>
        {/* Collapsed header row — always visible */}
        <div
          onClick={() => setProfileExpanded(p => !p)}
          style={{
            background: '#141414', border: '1px solid #1A1A1A',
            borderRadius: profileExpanded ? '16px 16px 0 0' : 16,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer',
            transition: 'border-radius 0.2s ease',
          }}
        >
          {/* Avatar */}
          <div
            onClick={(e) => { e.stopPropagation(); avatarFileRef.current?.click(); }}
            style={{
              position: 'relative', display: 'inline-block',
              flexShrink: 0, cursor: 'pointer',
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: profilePic ? 'none' : avatarBg, color: avatarFg,
              fontSize: 16, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textTransform: 'uppercase', letterSpacing: '-0.5px',
              boxShadow: `0 0 0 2px ${avatarBg}30`,
              overflow: 'hidden',
            }}>
              {profilePic ? (
                <img src={profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitials(member?.name || 'M')
              )}
            </div>
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              background: '#1A1A1A', border: '1px solid #2A2A2A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          {/* Name + belt */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0' }} data-testid="text-member-name">{member?.name}</div>
            <div style={{ fontSize: 12, color: getBeltColor(member?.belt || 'white'), fontWeight: 600, textTransform: 'capitalize' }}>{member?.belt || 'White'} Belt</div>
          </div>

          {/* Chevron */}
          <ChevronDown size={16} style={{ color: '#444', transform: profileExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>

        {/* Expanded details */}
        {profileExpanded && (
          <div style={{
            background: '#141414', border: '1px solid #1A1A1A', borderTop: 'none',
            borderRadius: '0 0 16px 16px',
            padding: '0 16px 16px',
          }}>
            <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Member since <span style={{ color: '#999' }}>{joinDate}</span></div>
              {member.phone && (
                <div style={{ fontSize: 12, color: '#666' }}>Phone <span style={{ color: '#999' }}>{member.phone}</span></div>
              )}
              {member.email && member.email !== member.name && (
                <div style={{ fontSize: 12, color: '#666' }}>Email <span style={{ color: '#999' }}>{member.email}</span></div>
              )}
            </div>

            {/* Belt + Family row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              {hasFamily && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFamilySwitcher(!showFamilySwitcher); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: showFamilySwitcher ? "rgba(200,162,76,0.15)" : "#1A1A1A",
                    color: showFamilySwitcher ? "#C8A24C" : "#999",
                    border: showFamilySwitcher ? "1px solid rgba(200,162,76,0.3)" : "1px solid #222",
                  }}
                  data-testid="button-family-switcher"
                >
                  <Users size={13} />
                  Family
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); haptic(); setShowRankRequest(true); setRankBelt(member.belt || "white"); setRankStripes(0); setRankNote(""); setRankSent(false); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative" }}
                title="Tap to request a rank update"
              >
                <BeltIcon
                  belt={member.belt || "white"}
                  stripes={0}
                  width={72}
                  style={{ filter: `drop-shadow(0 1px 6px ${getBeltColor(member.belt)}40)` }}
                />
                <span style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#C8A24C", border: "2px solid #141414", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Shield size={7} style={{ color: "#0A0A0A" }} />
                </span>
              </button>
              <div style={{ flex: 1 }} />
              <a href="/#/account" style={{ fontSize: 12, color: '#C8A24C', fontWeight: 600, textDecoration: 'none' }}>Edit Profile →</a>
            </div>

            {/* Family switcher */}
            {hasFamily && showFamilySwitcher && (
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
                <p className="text-[10px] uppercase tracking-wider px-3 pt-2.5 pb-1.5 font-medium" style={{ color: "#555", backgroundColor: "#0D0D0D" }}>
                  Switch Profile
                </p>
                {switchError && <p className="text-xs px-3 py-1.5" style={{ color: "#E05555", backgroundColor: "rgba(224,85,85,0.07)" }}>{switchError}</p>}
                {familyMembers.map((fm) => {
                  const isActive = fm.row === member.row;
                  const isLoading = switchingRow === fm.row;
                  return (
                    <button
                      key={fm.row}
                      onClick={(e) => { e.stopPropagation(); handleSwitchProfile(fm); }}
                      disabled={!!switchingRow}
                      className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                      style={{ backgroundColor: isActive ? "rgba(200,162,76,0.08)" : "#0D0D0D", borderTop: "1px solid #181818", opacity: switchingRow && !isLoading ? 0.5 : 1 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: isActive ? "#C8A24C" : "#E0E0E0" }}>{fm.name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#555" }}>{fm.type} · {fm.belt || "White"} belt{fm.isPrimary ? " · Primary" : ""}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {isLoading ? <Loader2 size={14} className="animate-spin" style={{ color: "#C8A24C" }} />
                          : isActive ? <Check size={14} style={{ color: "#C8A24C" }} />
                          : <ChevronRight size={14} style={{ color: "#333" }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Document status row */}
            <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #1A1A1A" }}>
              <a href="/#/waiver" className="flex items-center gap-1.5 flex-1 text-xs" style={{ textDecoration: "none" }}>
                {member.waiverSigned
                  ? <CheckCircle size={13} style={{ color: "#4CAF80", flexShrink: 0 }} />
                  : <FileText size={13} style={{ color: "#E08228", flexShrink: 0 }} />}
                <span style={{ color: member.waiverSigned ? "#4CAF80" : "#E08228" }}>
                  {member.waiverSigned ? "Waiver signed" : "Sign waiver"}
                </span>
              </a>
              <a href="/#/waiver?tab=agreement" className="flex items-center gap-1.5 flex-1 text-xs" style={{ textDecoration: "none" }}>
                {member.agreementSigned
                  ? <CheckCircle size={13} style={{ color: "#4CAF80", flexShrink: 0 }} />
                  : <FileText size={13} style={{ color: "#E08228", flexShrink: 0 }} />}
                <span style={{ color: member.agreementSigned ? "#4CAF80" : "#E08228" }}>
                  {member.agreementSigned ? "Agreement signed" : "Sign agreement"}
                </span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Animated flame pulse keyframes */}
      <style>{`
        @keyframes flamePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px #C8A24C88); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 10px #C8A24Ccc); }
        }
      `}</style>

      {/* Attendance streak widget */}
      <div style={{
        display: 'flex',
        gap: 10,
        margin: '0 20px 16px',
      }}>
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, rgba(200,162,76,0.12) 0%, rgba(200,162,76,0.04) 100%)',
          border: '1px solid rgba(200,162,76,0.2)',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            fontSize: 24,
            display: 'inline-block',
            ...(streakCount > 0 ? { animation: 'flamePulse 2s ease-in-out infinite' } : {}),
          }}>🔥</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#C8A24C', lineHeight: 1 }}>
              {(member as any)?.currentStreak || 0}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Class streak</div>
          </div>
        </div>
        <div style={{
          flex: 1,
          background: classesToday > 0 ? 'linear-gradient(135deg, rgba(76,175,128,0.12) 0%, rgba(76,175,128,0.04) 100%)' : 'rgba(255,255,255,0.03)',
          border: classesToday > 0 ? '1px solid rgba(76,175,128,0.2)' : '1px solid #1A1A1A',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>{classesToday > 0 ? '✅' : '📅'}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: classesToday > 0 ? '#4CAF80' : '#E0E0E0', lineHeight: 1 }}>
              {classesToday}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Classes today</div>
          </div>
        </div>
      </div>

      {/* Recent Achievements strip */}
      {(() => {
        const earned: string[] = (() => { try { return JSON.parse(localStorage.getItem('lbjj_achievements') || '[]'); } catch { return []; } })();
        if (earned.length === 0) return null;
        const recent = earned.slice(-3).reverse();
        const recentAchievements = recent
          .map(key => ALL_ACHIEVEMENTS.find(a => a.key === key))
          .filter(Boolean) as typeof ALL_ACHIEVEMENTS;
        if (recentAchievements.length === 0) return null;
        return (
          <a href="/#/achievements" style={{ textDecoration: 'none', display: 'block', margin: '0 20px 16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#111', border: '1px solid #1A1A1A', borderRadius: 12,
              padding: '10px 14px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', whiteSpace: 'nowrap' }}>Recent Achievements</div>
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                {recentAchievements.map(a => (
                  <div key={a.key} style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${a.color}18`, border: `1px solid ${a.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {a.icon}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#C8A24C', fontWeight: 600, whiteSpace: 'nowrap' }}>View All →</div>
            </div>
          </a>
        );
      })()}

      {/* Warning banners */}
      {hasWarnings && (
        <div className="mx-5 mb-4 space-y-2">
          {!member.waiverSigned && <WarningBanner text="Liability waiver not signed" action="Sign Now" href="/#/waiver" />}
          {!member.agreementSigned && <WarningBanner text="Membership agreement not signed" action="Sign Now" href="/#/waiver?tab=agreement" />}
        </div>
      )}

      {/* Payment Methods */}
      <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: "#C8A24C" }} />
            <span className="text-sm font-semibold" style={{ color: "#F0F0F0" }}>Payment Methods</span>
          </div>
          <button
            onClick={() => { haptic(); handleAddCard(); }}
            disabled={addingCard}
            className="flex items-center gap-1 text-xs font-medium px-2.5 rounded-lg transition-all active:scale-[0.97]"
            style={{ backgroundColor: "rgba(200,162,76,0.1)", color: "#C8A24C", border: "1px solid rgba(200,162,76,0.15)", minHeight: 44 }}
          >
            {addingCard ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add Card
          </button>
        </div>

        {cardsError && (
          <p className="text-xs px-4 pb-2" style={{ color: "#E05555" }}>{cardsError}</p>
        )}

        {/* Card list */}
        {cardsLoading ? (
          <div className="px-4 pb-4 space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: "#1A1A1A" }} />)}
          </div>
        ) : cards.length === 0 ? (
          <div className="px-4 pb-4">
            <p className="text-sm" style={{ color: "#555" }}>No payment methods on file.</p>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {cards.map(card => {
              const isActing = cardActionId === card.id;
              const expStr = `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`;
              const brandColor = { visa: "#1A1FE0", mastercard: "#EB001B", amex: "#007BC1" }[card.brand?.toLowerCase()] || "#C8A24C";

              return (
                <div
                  key={card.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    backgroundColor: card.isDefault ? "rgba(200,162,76,0.06)" : "#0D0D0D",
                    border: card.isDefault ? "1px solid rgba(200,162,76,0.2)" : "1px solid #1A1A1A",
                  }}
                >
                  {/* Brand pill */}
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${brandColor}18`, color: brandColor, border: `1px solid ${brandColor}30` }}>
                    {card.brand || "Card"}
                  </span>

                  {/* Number + expiry */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium" style={{ color: "#E0E0E0" }}>•••• {card.last4}</span>
                    <span className="text-xs ml-2" style={{ color: "#666" }}>exp {expStr}</span>
                    {card.isDefault && <span className="ml-2 text-[10px] font-semibold uppercase" style={{ color: "#C8A24C" }}>Default</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        disabled={!!cardActionId}
                        className="p-1.5 rounded-lg transition-colors"
                        title="Set as default"
                        style={{ color: "#666" }}
                      >
                        {isActing ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(card.id, card.last4)}
                      disabled={!!cardActionId}
                      className="p-1.5 rounded-lg transition-colors"
                      title="Remove card"
                      style={{ color: "#555" }}
                    >
                      {isActing && !(!card.isDefault) ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Widget 1 — Next Class Card */}
      {nextClass && (
        <div className="mx-5 mb-3">
          <a href="/#/schedule" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: '#141414', border: '1px solid #1A1A1A',
              borderLeft: '3px solid #C8A24C', borderRadius: 14,
              padding: 16, cursor: 'pointer',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#C8A24C', textTransform: 'uppercase' as const, marginBottom: 6 }}>Next Class</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>{nextClass.name}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{nextClass.dayLabel} · {formatClassTime(nextClass.time)}</div>
              {nextClass.instructor && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>w/ {nextClass.instructor}</div>}
            </div>
          </a>
        </div>
      )}

      {/* Widget 2 — Weekly Training Progress */}
      <div className="mx-5 mb-3">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {weekDots.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
                ...(d.trained
                  ? { background: '#C8A24C', color: '#0A0A0A' }
                  : d.isToday
                    ? { background: 'transparent', border: '2px solid #E0E0E0', color: '#E0E0E0' }
                    : { background: 'transparent', border: '2px solid #2A2A2A', color: '#2A2A2A' }
                ),
              }}>
                {d.trained ? '●' : '○'}
              </div>
              <span style={{ fontSize: 9, color: d.isToday ? '#E0E0E0' : '#555', fontWeight: d.isToday ? 700 : 400 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 3 — Tournament Countdown (conditional) */}
      {nextTournament && tournamentDaysUntil <= 30 && (
        <div className="mx-5 mb-3">
          <a href="/#/calendar" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: 'linear-gradient(135deg, #141414, #1A1A0A)',
              border: '1px solid rgba(200,162,76,0.19)', borderRadius: 14, padding: 16,
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#C8A24C', textTransform: 'uppercase' as const, marginBottom: 6 }}>🏆 Upcoming Tournament</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>{nextTournament.name}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{tournamentDaysUntil === 0 ? 'Today!' : tournamentDaysUntil === 1 ? 'Tomorrow' : `${tournamentDaysUntil} days away`}</div>
            </div>
          </a>
        </div>
      )}

      {/* Widget 4 — Announcements Preview (conditional) */}
      {announcementPreview && (
        <div className="mx-5 mb-6">
          <a href="/#/chat" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              background: '#141414', border: '1px solid #1A1A1A',
              borderRadius: 14, padding: '14px 16px',
              cursor: 'pointer',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#666', textTransform: 'uppercase' as const, marginBottom: 6 }}>📢 Announcement</div>
              <div style={{ fontSize: 13, color: '#CCC', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{announcementPreview}</div>
            </div>
          </a>
        </div>
      )}

      {/* ── Rank Request Bottom Sheet ── */}
      {showRankRequest && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowRankRequest(false)}
        >
          <div
            style={{ width: "100%", alignSelf: "center", maxWidth: 480, backgroundColor: "#111", borderRadius: "20px 20px 0 0", paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: "max(88px, calc(env(safe-area-inset-bottom, 0px) + 80px))", maxHeight: "min(88svh, calc(100vh - 48px))", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" as any }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#333", margin: "0 auto 20px" }} />

            {rankSent ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <CheckCircle size={44} style={{ color: "#4CAF80", margin: "0 auto 12px" }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: "0 0 8px" }}>Request Sent!</h3>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>Your coach will review and approve your promotion.</p>
                <button onClick={() => setShowRankRequest(false)}
                  style={{ marginTop: 20, padding: "11px 32px", borderRadius: 12, backgroundColor: "#C8A24C", color: "#0A0A0A", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: "0 0 4px" }}>Request Rank Update</h3>
                <p style={{ fontSize: 12, color: "#666", margin: "0 0 20px" }}>Your coach will review and approve this before it's recorded.</p>

                {/* Belt selector */}
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Belt</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {ADULT_BELT_OPTIONS.map(b => (
                    <button key={b} onClick={() => setRankBelt(b)}
                      style={{
                        padding: "8px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
                        border: rankBelt === b ? `2px solid ${getBeltColor(b)}` : "2px solid #222",
                        backgroundColor: rankBelt === b ? `${getBeltColor(b)}18` : "#0D0D0D",
                        color: rankBelt === b ? getBeltColor(b) : "#666",
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <BeltIcon belt={b} stripes={rankBelt === b ? rankStripes : 0} width={52} />
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Stripes selector */}
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Stripes</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {[0, 1, 2, 3, 4].map(s => (
                    <button key={s} onClick={() => setRankStripes(s)}
                      style={{
                        width: 44, height: 44, borderRadius: 10, fontSize: 13, fontWeight: 700,
                        border: rankStripes === s ? "2px solid #C8A24C" : "2px solid #222",
                        backgroundColor: rankStripes === s ? "rgba(200,162,76,0.12)" : "#0D0D0D",
                        color: rankStripes === s ? "#C8A24C" : "#888",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Note */}
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Note <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></label>
                <textarea
                  value={rankNote}
                  onChange={e => setRankNote(e.target.value)}
                  placeholder="e.g. Competed at Houston Open, won gold…"
                  rows={2}
                  style={{ width: "100%", backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F0F0F0", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 20, fontFamily: "inherit" }}
                />

                <button
                  onClick={async () => {
                    haptic();
                    if (!rankBelt) return;
                    setRankSubmitting(true);
                    const today = new Date().toISOString().split("T")[0];
                    const result = await beltSavePromotion({ belt: rankBelt, stripes: rankStripes, date: today, note: rankNote });
                    setRankSubmitting(false);
                    if (result?.success) setRankSent(true);
                  }}
                  disabled={!rankBelt || rankSubmitting}
                  style={{
                    width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                    backgroundColor: rankBelt ? "#C8A24C" : "#1A1A1A",
                    color: rankBelt ? "#0A0A0A" : "#444",
                    border: "none", cursor: rankBelt ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: rankSubmitting ? 0.7 : 1,
                  }}
                >
                  {rankSubmitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : "Submit for Coach Approval"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function WarningBanner({ text, action, href }: { text: string; action: string; href: string }) {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'rgba(224, 85, 85, 0.1)',
        border: '1px solid rgba(224, 85, 85, 0.25)',
        borderLeft: '3px solid #E05555',
        borderRadius: '0 10px 10px 0',
        marginBottom: 10,
        textDecoration: 'none',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#E05555" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" strokeWidth="2"/>
        <circle cx="12" cy="17" r="1" fill="#fff"/>
      </svg>
      <span style={{ fontSize: 13, color: '#E05555', flex: 1, fontWeight: 500 }}>{text}</span>
      <span
        style={{
          minHeight: 44,
          padding: '10px 16px',
          background: 'rgba(224,85,85,0.15)',
          border: '1px solid rgba(224,85,85,0.4)',
          borderRadius: 8,
          color: '#E05555',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {action}
      </span>
    </a>
  );
}

