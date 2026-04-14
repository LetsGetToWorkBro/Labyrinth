import { useAuth } from "@/lib/auth-context";
import type { FamilyMember, PaymentCard } from "@/lib/api";
import { beltSavePromotion, gasCall } from "@/lib/api";
import { BeltIcon } from "@/components/BeltIcon";
import { ADULT_BELT_OPTIONS } from "@/components/BeltIcon";
import { getBeltColor, CLASS_SCHEDULE } from "@/lib/constants";
import { chatGetChannels, fetchCSV, parseCSV, CSV_ENDPOINTS } from "@/lib/api";
import { ALL_ACHIEVEMENTS, checkAndUnlockAchievements } from "@/lib/achievements";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  CreditCard, FileText, ChevronRight, ChevronDown, LogOut,
  Users, Check, Loader2, Plus, Trash2, Star, CheckCircle,
} from "lucide-react";
import {
  memberGetCards, memberSetDefaultCard, memberRemoveCard,
  memberAddCard, memberCreateSetupLink,
} from "@/lib/api";
import { useState, useEffect, useCallback, useRef } from "react";
import { getStreamStatus, clearStreamCache } from "@/lib/streaming";
import type { StreamStatus } from "@/lib/streaming";

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

function BeltVisual({ belt, size = 'sm' }: { belt: string; size?: 'sm' | 'md' }) {
  const beltColors: Record<string, string> = {
    white: '#EEEEEE', blue: '#1A5DAB', purple: '#6A1B9A',
    brown: '#6D4C2A', black: '#111111',
    grey: '#6B6B6B', gray: '#6B6B6B', yellow: '#C49B1A',
    orange: '#C4641A', green: '#2D8040'
  };
  const patchColors: Record<string, string> = {
    black: '#CC0000',
    white: 'transparent',
  };
  const beltLower = belt.toLowerCase();
  const color = beltColors[beltLower] || '#C8A24C';
  const patchColor = patchColors[beltLower] || '#000';
  const showPatch = beltLower !== 'white';
  const h = size === 'sm' ? 9 : 13;
  const patchW = size === 'sm' ? 7 : 10;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: h, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ flex: 1, height: h, background: color }} />
      {showPatch && <div style={{ width: patchW, height: h, background: patchColor, flexShrink: 0 }} />}
      <div style={{ flex: 1, height: h, background: color }} />
    </div>
  );
}

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

  // ─── Streak count-up animation ────────────────────────────────
  const [displayStreak, setDisplayStreak] = useState(0);
  const streakAnimated = useRef(false);

  useEffect(() => {
    const streak = member?.currentStreak || 0;
    if (streakAnimated.current || streak === 0) {
      setDisplayStreak(streak);
      return;
    }
    streakAnimated.current = true;
    const duration = 400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayStreak(Math.round(eased * streak));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [member?.currentStreak]);

  // ─── Today's check-in count (immediate, localStorage-based) ────
  const [classesToday, setClassesToday] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);

  // ─── Total classes count-up animation ─────────────────────────
  const [displayTotalClasses, setDisplayTotalClasses] = useState(0);
  const totalClassesAnimated = useRef(false);
  const readClassesToday = useCallback(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('lbjj_checkins_today') || '{}');
      const today = new Date().toISOString().split('T')[0];
      setClassesToday(raw.date === today ? (raw.count || 0) : 0);
    } catch { setClassesToday(0); }
    try {
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      setTotalClasses(stats.classesAttended || 0);
    } catch { setTotalClasses(0); }
  }, []);
  useEffect(() => {
    readClassesToday();
    const onFocus = () => readClassesToday();
    window.addEventListener('focus', onFocus);
    const onVisibility = () => { if (!document.hidden) readClassesToday(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [readClassesToday]);

  // ─── Total classes count-up animation effect ──────────────────────
  useEffect(() => {
    if (totalClassesAnimated.current || totalClasses === 0) {
      setDisplayTotalClasses(totalClasses);
      return;
    }
    totalClassesAnimated.current = true;
    const duration = 400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayTotalClasses(Math.round(eased * totalClasses));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [totalClasses]);

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

  const [nextClass, setNextClass] = useState<ReturnType<typeof getNextClass>>(getNextClass);

  const getTodayKey = () => `lbjj_checkins_${new Date().toISOString().split('T')[0]}`;
  const [checkedInClasses, setCheckedInClasses] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(getTodayKey()) || '[]'); } catch { return []; }
  });

  // Persist checked-in classes to sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(getTodayKey(), JSON.stringify(checkedInClasses)); } catch {}
  }, [checkedInClasses]);

  // Fetch today's check-ins from GAS on mount
  useEffect(() => {
    if (member?.email) {
      gasCall('getMemberCheckIns', { email: member.email }).then((res: any) => {
        const today = new Date().toISOString().split('T')[0];
        const todayClasses = (res?.checkIns || [])
          .filter((c: any) => (c.date || c.timestamp || '').startsWith(today))
          .map((c: any) => c.className);
        if (todayClasses.length > 0) {
          setCheckedInClasses(prev => [...new Set([...prev, ...todayClasses])]);
        }
      }).catch(() => {});
    }
  }, [member?.email]);

  const handleHomeCheckIn = useCallback(async (cls: any) => {
    // GAS call first to check for dedup
    const profile = (() => { try { return JSON.parse(localStorage.getItem('lbjj_member_profile') || '{}'); } catch { return {}; } })();
    if (profile.Email) {
      try {
        const res = await gasCall('recordCheckIn', { email: profile.Email, name: profile.Name || '', className: cls.name || '' });
        if (res?.alreadyCheckedIn) {
          // Show "already checked in" toast instead of confetti
          const el = document.createElement('div');
          el.textContent = 'Already checked in today';
          el.style.cssText = `
            position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%);
            background: rgba(100,100,100,0.95); color: #fff; font-weight: 600; font-size: 14px;
            padding: 8px 20px; border-radius: 20px; z-index: 9999; pointer-events: none;
            animation: pointsFloat 2s ease-out forwards;
          `;
          document.body.appendChild(el);
          setTimeout(() => el.remove(), 2100);
          setCheckedInClasses(prev => [...prev, cls.name || '']);
          return;
        }
      } catch {}
    }

    // Same logic as SchedulePage handleCheckIn
    try {
      const raw = localStorage.getItem('lbjj_game_stats_v2');
      const stats = raw ? JSON.parse(raw) : {};
      stats.classesAttended = (stats.classesAttended || 0) + 1;
      localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
    } catch {}

    // Update today's check-in count
    const today = new Date().toISOString().split('T')[0];
    const todayData = (() => { try { return JSON.parse(localStorage.getItem('lbjj_checkins_today') || '{}'); } catch { return {}; } })();
    const newCount = (todayData.date === today ? (todayData.count || 0) : 0) + 1;
    localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: newCount }));

    // Update weekly training
    const weekly = (() => { try { return JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]'); } catch { return []; } })();
    if (!weekly.includes(today)) {
      weekly.push(today);
      localStorage.setItem('lbjj_weekly_training', JSON.stringify(weekly.filter((d: string) => d >= new Date(Date.now() - 14*24*60*60*1000).toISOString().split('T')[0])));
    }

    // Trigger confetti
    triggerConfetti();

    // Show success toast
    showPointsToast(10);

    // Ring pulse on check-in button
    const btn = document.querySelector('[data-checkin-btn]');
    if (btn) {
      const ring = document.createElement('span');
      ring.className = 'checkin-ring';
      btn.parentElement!.style.position = 'relative';
      btn.parentElement!.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove(), { once: true });
    }

    // Flame flicker on streak icon
    setTimeout(() => {
      const flame = document.querySelector('.streak-icon');
      if (flame) {
        flame.classList.add('streak-icon-flicker');
        flame.addEventListener('animationend', () => flame.classList.remove('streak-icon-flicker'), { once: true });
      }
    }, 150);

    // Mark class as checked in
    setCheckedInClasses(prev => [...prev, cls.name || '']);

    // Optimistically update capacity
    setNextClass(prev => prev ? { ...prev, currentCapacity: ((prev as any).currentCapacity || 0) + 1 } as any : prev);

    // Check achievements
    const gameStats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    checkAndUnlockAchievements(profile, gameStats);
  }, []);

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
  const [nextTournament, setNextTournament] = useState<{ name: string; date: string; location?: string; link?: string } | null>(null);
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
          location: e.Location || e.location || '',
          link: e.Link || e.link || '',
        }));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: events, ts: Date.now() })); } catch {}
        findNext(events);
      } catch {}
    }

    function findNext(events: { date: string; name: string; location?: string; link?: string }[]) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      let best: { name: string; date: string; days: number; location?: string; link?: string } | null = null;
      for (const ev of events) {
        if (!ev.date) continue;
        const d = new Date(ev.date);
        if (isNaN(d.getTime())) continue;
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 60 && (!best || diff < best.days)) {
          best = { name: ev.name, date: ev.date, days: diff, location: ev.location, link: ev.link };
        }
      }
      if (best) {
        setNextTournament({ name: best.name, date: best.date, location: best.location, link: best.link });
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

  // ─── Live stream status (poll every 30s) ───────────────────────────
  const [stream, setStream] = useState<StreamStatus | null>(null);
  useEffect(() => {
    clearStreamCache();
    getStreamStatus().then(setStream);
    const interval = setInterval(() => {
      getStreamStatus().then(setStream);
    }, 30_000);
    return () => clearInterval(interval);
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
      <div className="mx-5 mb-4 stagger-child">
        <h1 className="text-xl font-bold" style={{ color: "#F0F0F0" }} data-testid="text-greeting">
          {getGreeting()}
        </h1>
      </div>

      {/* LIVE banner */}
      {stream?.isLive && (
        <a href="/#/live" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1A0A0A, #1A1010)',
            border: '1px solid #EF444430',
            borderRadius: 14, padding: '12px 16px',
            margin: '0 20px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', flexShrink: 0, display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite', boxShadow: '0 0 8px #EF4444' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Now</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F0', marginTop: 2 }}>{stream.className}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </a>
      )}

      {/* Profile card — collapsible */}
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarPhoto}
        style={{ display: 'none' }}
      />
      <div className="mx-5 mb-3 stagger-child" style={{ transition: 'all 0.2s ease' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <BeltVisual belt={member?.belt || 'white'} />
              <span style={{ fontSize: 12, color: getBeltColor(member?.belt || 'white'), fontWeight: 600, textTransform: 'capitalize' }}>{member?.belt || 'White'} Belt</span>
            </div>
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
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative", overflow: "visible" }}
                title="Tap to request a rank update"
              >
                <BeltIcon
                  belt={member.belt || "white"}
                  stripes={0}
                  width={72}
                  style={{ filter: `drop-shadow(0 1px 6px ${getBeltColor(member.belt)}40)` }}
                />
                <span style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#C8A24C", border: "2px solid #141414", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
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

      {/* Warning banners */}
      {hasWarnings && (
        <div className="mx-5 mb-4 space-y-2">
          {!member.waiverSigned && <WarningBanner text="Liability waiver not signed" action="Sign Now" href="/#/waiver" />}
          {!member.agreementSigned && <WarningBanner text="Membership agreement not signed" action="Sign Now" href="/#/waiver?tab=agreement" />}
        </div>
      )}

      {/* Announcements Preview */}
      {announcementPreview && (
        <div className="mx-5 mb-3 stagger-child">
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

      {/* Next Class Card */}
      {nextClass && (
        <div className="mx-5 mb-3 stagger-child">
          <div style={{
            background: '#141414', border: '1px solid #1A1A1A',
            borderLeft: '3px solid #C8A24C', borderRadius: 14,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12
          }}>
            {/* Left: class info — taps to schedule */}
            <a href="/#/schedule" style={{ textDecoration: 'none', flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#C8A24C', textTransform: 'uppercase' as const, marginBottom: 4 }}>Next Class</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 2 }}>{nextClass.name}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{nextClass.dayLabel} · {formatClassTime(nextClass.time)}</div>
              {nextClass.instructor && <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>w/ {nextClass.instructor}</div>}
            </a>

            {/* Right: Check In button */}
            {nextClass.isToday && (() => {
              const alreadyCheckedIn = checkedInClasses.includes(nextClass.name || '');
              return (
                <button
                  data-checkin-btn
                  onClick={() => !alreadyCheckedIn && handleHomeCheckIn(nextClass)}
                  disabled={alreadyCheckedIn}
                  style={{
                    flexShrink: 0, padding: '10px 14px', borderRadius: 10,
                    background: alreadyCheckedIn ? '#333' : '#C8A24C',
                    border: 'none',
                    color: alreadyCheckedIn ? '#666' : '#000',
                    fontWeight: 700, fontSize: 13,
                    cursor: alreadyCheckedIn ? 'default' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    opacity: alreadyCheckedIn ? 0.6 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: 10 }}>{alreadyCheckedIn ? 'Done' : 'Check In'}</span>
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* Weekly Training Progress */}
      <div className="mx-5 mb-3 stagger-child">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {weekDots.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div className={d.isToday ? 'weekly-dot-active' : ''} style={{
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

      {/* Attendance streak widget */}
      <div className="stagger-child" style={{
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
          <span className="streak-icon" style={{
            fontSize: 24,
            display: 'inline-block',
            ...(streakCount > 0 ? { animation: 'flamePulse 2s ease-in-out infinite' } : {}),
          }}>🔥</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#C8A24C', lineHeight: 1 }}>
              {displayStreak}
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
              {displayTotalClasses}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Total classes{classesToday > 0 ? ` · ${classesToday} today` : ''}</div>
          </div>
        </div>
      </div>

      {/* Tournament Countdown (conditional) */}
      {nextTournament && tournamentDaysUntil <= 60 && (
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

              {/* Location row */}
              {nextTournament.location && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(nextTournament.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: 12, color: '#C8A24C', fontWeight: 500 }}>{nextTournament.location}</span>
                </a>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {nextTournament.location && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(nextTournament.location)}`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 0', borderRadius: 9, background: 'rgba(200,162,76,0.12)',
                      border: '1px solid rgba(200,162,76,0.25)', textDecoration: 'none',
                      fontSize: 12, fontWeight: 600, color: '#C8A24C',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    Map
                  </a>
                )}
                {nextTournament.link && (
                  <a
                    href={nextTournament.link}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '9px 0', borderRadius: 9, background: 'rgba(200,162,76,0.12)',
                      border: '1px solid rgba(200,162,76,0.25)', textDecoration: 'none',
                      fontSize: 12, fontWeight: 600, color: '#C8A24C',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </a>
        </div>
      )}

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

