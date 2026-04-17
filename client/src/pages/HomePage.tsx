import { FireIcon, CheckCircleFilledIcon, CalendarSparkIcon, MegaphoneIcon, TrophyIcon, StarIcon, BoltIcon, GoldMedalIcon, SilverMedalIcon, ShieldIcon, SwordsIcon, AchievedIcon, ChartBarsIcon, GrapplingIcon, SunIcon, MoonIcon, SwordIcon, ClockCountdownIcon, ShieldFreezeIcon, GiIcon } from "@/components/icons/LbjjIcons";
import { useAuth } from "@/lib/auth-context";
import type { FamilyMember, PaymentCard } from "@/lib/api";
import { beltSavePromotion, gasCall, getLeaderboard, getLeaderboardFresh, getMemberData, cachedGasCall, saveMemberStats, syncAchievements } from "@/lib/api";
import { BeltIcon } from "@/components/BeltIcon";
import { ADULT_BELT_OPTIONS } from "@/components/BeltIcon";
import { getBeltColor, CLASS_SCHEDULE } from "@/lib/constants";
import { chatGetChannels, fetchCSV, parseCSV, CSV_ENDPOINTS, getPinnedAnnouncement } from "@/lib/api";
import { ALL_ACHIEVEMENTS, checkAndUnlockAchievements } from "@/lib/achievements";
import { ScreenHeader } from "@/components/ScreenHeader";
import { validateGeoIfRequired } from "@/lib/geo";
import { LevelWidget } from "@/components/LevelWidget";
import { ProfileRing } from "@/components/ProfileRing";
import { getLevelFromXP, getActualLevel, XP_LEVELS } from "@/lib/xp";
import {
  CreditCard, FileText, ChevronRight, ChevronDown, LogOut,
  Users, Check, Loader2, Plus, Trash2, Star, CheckCircle,
} from "lucide-react";
import {
  memberGetCards, memberSetDefaultCard, memberRemoveCard,
  memberAddCard, memberCreateSetupLink,
} from "@/lib/api";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { soundSystem } from '@/lib/sounds';
import { StatSkeleton, ListSkeleton } from "@/components/LoadingSkeleton";
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
  const card = document.createElement('div');
  card.style.cssText = 'text-align:center;padding:40px;max-width:300px;animation:slideUpCard 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;';

  const heading = document.createElement('div');
  heading.style.cssText = 'font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:16px;';
  heading.textContent = 'New Badge Unlocked';

  const iconCircle = document.createElement('div');
  iconCircle.style.cssText = `width:100px;height:100px;border-radius:50%;background:conic-gradient(${color} 0deg,transparent 60deg,${color} 180deg,transparent 240deg,${color} 360deg);padding:3px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:badgePulse 1s ease-in-out infinite alternate,borderSpin 3s linear infinite;box-shadow:0 0 40px ${color}44;`;
  const iconInner = document.createElement('div');
  iconInner.style.cssText = `width:100%;height:100%;border-radius:50%;background:#1A1A1A;display:flex;align-items:center;justify-content:center;font-size:44px;`;
  iconInner.textContent = badge.icon;
  iconCircle.appendChild(iconInner);

  const labelEl = document.createElement('div');
  labelEl.style.cssText = 'font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;';
  labelEl.textContent = badge.label;

  const descEl = document.createElement('div');
  descEl.style.cssText = 'font-size:14px;color:#888;line-height:1.5;';
  descEl.textContent = badge.desc;

  const dismissHint = document.createElement('div');
  dismissHint.style.cssText = 'margin-top:24px;font-size:12px;color:#555;';
  dismissHint.textContent = 'Tap to dismiss';

  card.appendChild(heading);
  card.appendChild(iconCircle);
  card.appendChild(labelEl);
  card.appendChild(descEl);
  card.appendChild(dismissHint);
  overlay.appendChild(card);
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUpCard { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes badgePulse { from { box-shadow: 0 0 20px ${color}44; } to { box-shadow: 0 0 50px ${color}99; } }
    @keyframes borderSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  const dismiss = () => { overlay.remove(); style.remove(); };
  overlay.onclick = dismiss;
  setTimeout(dismiss, 4000);
}

function triggerConfetti() {
  // Burst ring
  const ring = document.createElement('div');
  const ringStyle = document.createElement('style');
  ringStyle.textContent = `@keyframes burstRing{0%{transform:translate(-50%,-50%) scale(0);opacity:1}100%{transform:translate(-50%,-50%) scale(5);opacity:0}}`;
  ring.style.cssText = `position:fixed;bottom:28%;left:50%;width:60px;height:60px;border-radius:50%;border:2px solid rgba(200,162,76,0.9);transform:translate(-50%,-50%) scale(0);pointer-events:none;z-index:9998;animation:burstRing 500ms var(--ease-out) forwards;`;
  document.head.appendChild(ringStyle);
  document.body.appendChild(ring);
  setTimeout(() => { ring.remove(); ringStyle.remove(); }, 600);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  // ONE shared style tag for all confetti dots (uses CSS custom props)
  const sharedStyle = document.createElement('style');
  sharedStyle.textContent = `@keyframes confettiFly{0%{opacity:1}100%{opacity:0;transform:translate(var(--cx),var(--cy)) rotate(var(--cr));}}`;
  document.head.appendChild(sharedStyle);

  const colors = ['#C8A24C', '#E8C86C', '#FFD700', '#FFF8DC', '#ffffff'];
  for (let i = 0; i < 40; i++) {
    const dot = document.createElement('div');
    const size = Math.random() * 8 + 4;
    const color = colors[Math.floor(Math.random() * colors.length)];
    dot.style.cssText = `position:absolute;bottom:30%;left:${Math.random() * 100}%;width:${size}px;height:${size}px;border-radius:${Math.random() > 0.5 ? '50%' : '2px'};background:${color};--cx:${(Math.random() - 0.5) * 40}vw;--cy:${-(Math.random() * 60 + 40)}vh;--cr:${Math.random() * 720}deg;animation:confettiFly ${Math.random() * 800 + 600}ms ${Math.random() * 300}ms ease-out forwards;`;
    container.appendChild(dot);
  }

  setTimeout(() => { container.remove(); sharedStyle.remove(); }, 2000);
}

function showPointsToast(points: number) {
  const el = document.createElement('div');
  el.innerHTML = `<svg viewBox="0 0 16 16" width="14" height="14" fill="rgba(0,0,0,0.5)" style="flex-shrink:0"><path d="M8 1l1.5 3.5 3.5.5-2.5 2.5.6 3.5L8 9.5 4.9 11l.6-3.5L3 5l3.5-.5z"/></svg><span>+${points} pts</span>`;
  const style = document.createElement('style');
  style.textContent = `@keyframes pointsFloat{0%{transform:translateX(-50%) translateY(0);opacity:1}100%{transform:translateX(-50%) translateY(-60px);opacity:0}}`;
  el.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;background:rgba(200,162,76,0.96);color:#000;font-weight:800;font-size:16px;padding:8px 18px;border-radius:24px;z-index:9999;pointer-events:none;box-shadow:0 4px 16px rgba(200,162,76,0.4),0 2px 4px rgba(0,0,0,0.3);animation:pointsFloat 1.5s ease-out forwards;`;
  document.head.appendChild(style);
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); style.remove(); }, 1600);
}

const haptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
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


// J1: Week number helper
function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// M2: Techniques array

export default function HomePage() {
  const { member, familyMembers, isAuthenticated, logout, switchProfile, setMember, refreshProfile } = useAuth();

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
  const [showRankInfo, setShowRankInfo] = useState(false);
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [showMilestoneInfo, setShowMilestoneInfo] = useState(false);
  const [showNarrativeInfo, setShowNarrativeInfo] = useState(false);
  const [showWeekStats, setShowWeekStats] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [showGameDayInfo, setShowGameDayInfo] = useState(false);
  const [techniqueOverride, setTechniqueOverride] = useState<string | null>(() => { try { return localStorage.getItem('lbjj_technique_override'); } catch { return null; } });
  const [showTechniqueEditor, setShowTechniqueEditor] = useState(false);
  const [techniqueCustomName, setTechniqueCustomName] = useState('');
  const [techniqueCustomTip, setTechniqueCustomTip] = useState('');
  const [techniqueCustomCat, setTechniqueCustomCat] = useState('Custom');

  // ─── Home loading skeleton state ─────────────────────────────────
  const [homeLoading, setHomeLoading] = useState(true);
  const [checkinPhase, setCheckinPhase] = useState<'idle' | 'pressing' | 'success' | 'done'>('idle');
  const [earlyCheckInMsg, setEarlyCheckInMsg] = useState('');
  const [homeLoadSlow, setHomeLoadSlow] = useState(false);

  // ─── Stale-while-revalidate home cache ─────────────────────────
  const HOME_CACHE_KEY = 'lbjj_home_cache';
  const HOME_CACHE_TTL = 5 * 60 * 1000;

  useEffect(() => {
    try {
      const cached = localStorage.getItem(HOME_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < HOME_CACHE_TTL) {
          if (data.totalClasses) setTotalClasses(data.totalClasses);
          if (data.classesToday !== undefined) setClassesToday(data.classesToday);
          if (data.weeklyTraining) {
            localStorage.setItem('lbjj_weekly_training', JSON.stringify(data.weeklyTraining));
          }
          if (data.checkedInClasses?.length) setCheckedInClasses(data.checkedInClasses);
          if (data.leaderboard?.length) setLeaderboard(data.leaderboard);
          setHomeLoading(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!homeLoading) return;
    const t = setTimeout(() => setHomeLoadSlow(true), 8000);
    return () => clearTimeout(t);
  }, [homeLoading]);

  // Profile photo state — persisted in two keys for redundancy
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try {
      // Primary key first, fallback to game_stats backup
      const primary = localStorage.getItem('lbjj_profile_picture');
      if (primary) return primary;
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      return stats.profilePic || null;
    } catch { return null; }
  });
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Sync profilePic from GAS profile if localStorage is empty
  useEffect(() => {
    const remote = (member as any)?.profilePicBase64;
    if (remote && !profilePic) {
      try {
        localStorage.setItem('lbjj_profile_picture', remote);
        const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        stats.profilePic = remote;
        localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
      } catch {}
      setProfilePic(remote);
    }
  }, [member, profilePic]);

  // ─── Deduplicated getMemberCheckIns (fires once per mount) ────
  const checkInsCache = useRef<any[] | null>(null);

  const getCheckInsOnce = useCallback(async (email: string): Promise<any[]> => {
    if (checkInsCache.current !== null) return checkInsCache.current;
    const res = await cachedGasCall('getMemberCheckIns', { email }, 120_000); // 2 min TTL
    const checkIns = res?.checkIns || [];
    checkInsCache.current = checkIns;
    return checkIns;
  }, []);

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
      try {
        // Primary key
        localStorage.setItem('lbjj_profile_picture', base64);
        // Backup in game_stats so it survives if primary key gets cleared
        const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        stats.profilePic = base64;
        localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
      } catch {}
      // Sync to GAS so photo persists across devices/sessions
      try {
        const memberEmail = member?.email || '';
        if (memberEmail) {
          gasCall('updateMemberProfileApp', {
            memberEmail,
            profilePicBase64: base64,
          }).catch(() => {});
        }
      } catch {}
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

  // ─── Leaderboard widget ────────────────────────────────────────────
  const LEADERBOARD_CACHE_KEY = 'lbjj_home_leaderboard';
  const LEADERBOARD_TTL = 5 * 60 * 1000;
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Load leaderboard from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LEADERBOARD_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < LEADERBOARD_TTL && data.length > 0) {
          setLeaderboard(data);
        }
      }
    } catch {}
  }, []);

  const cachedStreak = (() => { try { return parseInt(localStorage.getItem('lbjj_streak_cache') || '0'); } catch { return 0; } })();
  const rawStreak = (member as any)?.currentStreak || 0;
  const streakCount = rawStreak > 0 ? rawStreak : cachedStreak;

  // Daily streak — consecutive calendar days trained (drives 7/14/21/30 day powers)
  const dailyStreakCount = (() => {
    try {
      const history: string[] = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
      const sorted = Array.from(new Set(history)).sort().reverse(); // most recent first
      if (sorted.length === 0) return 0;
      let streak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < 60; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sorted.includes(dateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // today not trained yet — still count from yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    } catch { return 0; }
  })();

  // Daily streak tier: 7 = fire, 14 = diamond, 21 = legend, 30 = paragon
  const dailyStreakTier = dailyStreakCount >= 30 ? 'paragon' : dailyStreakCount >= 21 ? 'legend' : dailyStreakCount >= 14 ? 'diamond' : dailyStreakCount >= 7 ? 'fire' : 'none';

  // ─── Streak freeze mechanic ─────────────────────────────────────
  const [freezeAvailable, setFreezeAvailable] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);

  useEffect(() => {
    const lastFreeze = localStorage.getItem('lbjj_streak_freeze_used');
    const thisMonth = new Date().toISOString().slice(0, 7);
    const usedThisMonth = lastFreeze === thisMonth;
    setFreezeAvailable(streakCount >= 4 && !usedThisMonth);
    setFreezeUsed(usedThisMonth);
  }, [streakCount]);

  // ─── Streak freeze protection (client-side): show 1 instead of 0 ──
  const streakFreezeActive = (() => {
    try {
      const lastFreeze = localStorage.getItem('lbjj_streak_freeze_used');
      const thisMonth = new Date().toISOString().slice(0, 7);
      return lastFreeze === thisMonth && streakCount === 0;
    } catch { return false; }
  })();
  const effectiveStreak = streakFreezeActive ? 1 : streakCount;

  // ─── Streak count-up animation ────────────────────────────────
  const [displayStreak, setDisplayStreak] = useState(0);
  const streakAnimated = useRef(false);

  useEffect(() => {
    const streak = streakFreezeActive ? 1 : (member?.currentStreak || 0);
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
  const [memberXP, setMemberXP] = useState<number>(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      const cachedXP = stats.totalXP || 0;
      const profileXP = (member as any)?.totalPoints || 0;
      // Use whichever is larger — GAS profile or local cache
      return Math.max(cachedXP, profileXP);
    } catch { return (member as any)?.totalPoints || 0; }
  });

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

  // Hydrate totalClasses, classesToday, weekly training, AND today's dedup — single GAS call
  useEffect(() => {
    if (!member?.email) return;
    getCheckInsOnce(member.email).then((allCheckIns: any[]) => {
      // Total count
      const realTotal = allCheckIns.length;
      // Always write to game stats, even if 0, so next boot has a valid cache
      const gasXP = (member as any)?.totalPoints || 0;
      const derivedXP = Math.max(gasXP, realTotal * 10);
      const gasStreak = (member as any)?.currentStreak || 0;
      if (realTotal > 0 || gasXP > 0) {
        setTotalClasses(realTotal);
        setMemberXP(derivedXP);
      }
      try {
        const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        stats.classesAttended = realTotal;
        stats.totalXP = derivedXP;
        // BUG 11: write derived XP to stats.xp so check-ins increment from correct base
        if (derivedXP > (stats.xp || 0)) {
          stats.xp = derivedXP;
        }
        // Persist streak so it survives across sessions even if GAS is slow
        if (gasStreak > 0) stats.currentStreak = gasStreak;
        localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
        // Also cache the streak separately for fast reads
        if (gasStreak > 0) localStorage.setItem('lbjj_streak_cache', String(gasStreak));
      } catch {}
      // Today's count + dedup
      const today = new Date().toISOString().split('T')[0];
      const todayCheckIns = allCheckIns.filter((c: any) => (c.date || c.timestamp || '').startsWith(today));
      if (todayCheckIns.length > 0) {
        setClassesToday(todayCheckIns.length);
        localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: todayCheckIns.length }));
      }
      // Today's class dedup for check-in buttons
      const todayClasses = todayCheckIns.map((c: any) => c.className);
      if (todayClasses.length > 0) {
        setCheckedInClasses((prev: string[]) => Array.from(new Set([...prev, ...todayClasses])));
      }
      // Hydrate weekly training days from GAS check-in dates
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recentDays = Array.from(new Set(
        allCheckIns
          .map((c: any) => (c.date || c.timestamp || '').split('T')[0])
          .filter((d: string) => d >= cutoff)
      ));
      if (recentDays.length > 0) {
        localStorage.setItem('lbjj_weekly_training', JSON.stringify(recentDays));
      }
      // Update home SWR cache
      try {
        const cacheData = { totalClasses: realTotal, classesToday: todayClasses.length, weeklyTraining: recentDays, checkedInClasses: todayClasses, leaderboard: leaderboard.length > 0 ? leaderboard : undefined };
        localStorage.setItem(HOME_CACHE_KEY, JSON.stringify({ data: cacheData, ts: Date.now() }));
      } catch {}
      setHomeLoading(false);
    }).catch(() => { setHomeLoading(false); });
  }, [member?.email, getCheckInsOnce]);

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
      soundSystem.play('streak');
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

  // ─── Next class countdown clock ─────────────────────────────────
  const [timeUntilClass, setTimeUntilClass] = useState('');

  useEffect(() => {
    if (!nextClass || !nextClass.isToday) { setTimeUntilClass(''); return; }

    const compute = () => {
      const now = new Date();
      const [time, meridiem] = (nextClass.time || '').split(' ');
      const [hoursStr, minsStr] = (time || '').split(':');
      let hours = parseInt(hoursStr) || 0;
      const mins = parseInt(minsStr) || 0;
      if (meridiem?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (meridiem?.toUpperCase() === 'AM' && hours === 12) hours = 0;

      const classToday = new Date();
      classToday.setHours(hours, mins, 0, 0);

      const diff = classToday.getTime() - now.getTime();
      if (diff <= 0) { setTimeUntilClass(''); return; }

      const diffHours = Math.floor(diff / (1000 * 60 * 60));
      const diffMins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        setTimeUntilClass(`Starts in ${diffHours}h ${diffMins}m`);
      } else if (diffMins > 0) {
        setTimeUntilClass(`Starts in ${diffMins}m`);
      } else {
        setTimeUntilClass('Starting now');
      }
    };

    compute();
    const interval = setInterval(compute, 30_000);
    return () => clearInterval(interval);
  }, [nextClass]);

  const getTodayKey = (email?: string) => `lbjj_checkins_${new Date().toISOString().split('T')[0]}${email ? '_' + email : ''}`;
  const homeDedupEmail = getMemberData()?.email || '';
  const [checkedInClasses, setCheckedInClasses] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(getTodayKey(homeDedupEmail)) || '[]'); } catch { return []; }
  });

  // Persist checked-in classes to localStorage (per-user, per-day)
  useEffect(() => {
    const email = getMemberData()?.email || '';
    try { localStorage.setItem(getTodayKey(email), JSON.stringify(checkedInClasses)); } catch {}
  }, [checkedInClasses]);

  const checkingInRef = useRef(false);

  const handleHomeCheckIn = useCallback(async (cls: any) => {
    if (!navigator.onLine) {
      alert('No internet connection. Please connect and try again.');
      return;
    }
    // Geo-lock validation
    const geo = await validateGeoIfRequired();
    if (!geo.allowed) {
      alert(geo.error || 'Location check failed. Please try again.');
      return;
    }
    // Ref lock: synchronous guard against rapid taps during GAS cold start
    if (checkingInRef.current) return;
    checkingInRef.current = true;
    // GAS call first to check for dedup
    const memberProfile = getMemberData();
    const profileEmail = memberProfile?.email || '';
    const profileName = memberProfile?.name || '';
    let res: any = null;
    if (profileEmail) {
      try {
        res = await gasCall('recordCheckIn', { email: profileEmail, name: profileName, className: cls.name || '' });
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
          checkingInRef.current = false;
          return;
        }
      } catch { checkingInRef.current = false; setCheckinPhase('idle'); }
    }

    // Same logic as SchedulePage handleCheckIn
    try {
      const raw = localStorage.getItem('lbjj_game_stats_v2');
      const stats = raw ? JSON.parse(raw) : {};
      stats.classesAttended = (stats.classesAttended || 0) + 1;
      const xpGain = 10 * (comboMultiplier || 1);
      stats.xp = (stats.xp || 0) + xpGain;
      stats.totalXP = (stats.totalXP || 0) + xpGain;
      localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
      setMemberXP(prev => prev + xpGain);
    } catch {}
    setTotalClasses(prev => prev + 1);

    // Update today's check-in count
    const today = new Date().toISOString().split('T')[0];
    const todayData = (() => { try { return JSON.parse(localStorage.getItem('lbjj_checkins_today') || '{}'); } catch { return {}; } })();
    const newCount = (todayData.date === today ? (todayData.count || 0) : 0) + 1;
    localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: newCount }));
    setClassesToday(newCount);

    // Update weekly training
    const weekly = (() => { try { return JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]'); } catch { return []; } })();
    if (!weekly.includes(today)) {
      weekly.push(today);
      localStorage.setItem('lbjj_weekly_training', JSON.stringify(weekly.filter((d: string) => d >= new Date(Date.now() - 14*24*60*60*1000).toISOString().split('T')[0])));
    }
    // Update season (monthly) check-in history so the April session counter increments
    try {
      const history: string[] = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
      if (!history.includes(today)) {
        history.push(today);
        // Keep last 400 days max to avoid localStorage bloat
        const cutoff = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        localStorage.setItem('lbjj_checkin_history', JSON.stringify(history.filter((d: string) => d >= cutoff)));
      }
    } catch {}

    // Trigger confetti
    triggerConfetti();

    // Morph check-in button to success state
    setCheckinPhase('success');
    const todayEl = document.getElementById('stat-today-value');
    if (todayEl) { todayEl.classList.add('stat-pop'); setTimeout(() => todayEl.classList.remove('stat-pop'), 400); }
    setTimeout(() => setCheckinPhase('done'), 1500);

    // Play sounds
    soundSystem.play('checkin');
    setTimeout(() => soundSystem.play('xpEarn'), 300);

    // Show success toast
    const xpGainForToast = 10 * (comboMultiplier || 1);
    showPointsToast(xpGainForToast);

    // Show XP gain floating toast
    const xpEl = document.createElement('div');
    xpEl.textContent = `+${xpGainForToast} XP`;
    xpEl.style.cssText = `
      position: fixed; bottom: 140px; left: 50%; transform: translateX(-50%);
      background: rgba(200,162,76,0.95); color: #000; font-weight: 800; font-size: 16px;
      padding: 8px 20px; border-radius: 20px; z-index: 9999; pointer-events: none;
      animation: pointsFloat 1.5s ease-out forwards;
    `;
    document.body.appendChild(xpEl);
    setTimeout(() => xpEl.remove(), 1500);

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
    checkAndUnlockAchievements(memberProfile || {}, gameStats);

    // Belt milestone overlay trigger
    const beltMilestoneKeys = ['mat_warrior', 'mat_legend', 'loyal_1yr', 'loyal_2yr', 'streak_30', 'podium', 'century_club'];
    const beltBadge = (res?.newBadges || []).find((b: any) => beltMilestoneKeys.includes(b.key));
    if (beltBadge && (window as any).__showBeltMilestone) {
      setTimeout(() => (window as any).__showBeltMilestone(beltBadge), 600);
    }

    // Update streak from GAS response so the count-up re-renders
    if (res?.currentStreak !== undefined && member) {
      streakAnimated.current = false; // allow re-animation
      setMember({ ...member, currentStreak: res.currentStreak } as any);
      // Persist streak to localStorage so it survives session restores
      try {
        const stored = JSON.parse(localStorage.getItem('lbjj_member_profile') || '{}');
        stored.currentStreak = res.currentStreak;
        localStorage.setItem('lbjj_member_profile', JSON.stringify(stored));
      } catch {}
      try { localStorage.setItem('lbjj_streak_cache', String(res.currentStreak)); } catch {}
    }

    // ── Optimistic leaderboard injection ──────────────────────────────────────
    // Insert/update the current user's entry immediately so the board reflects
    // the check-in without waiting for the GAS cache to refresh.
    setLeaderboard(prev => {
      if (!prev || !memberProfile) return prev;
      const myName = memberProfile.name || '';
      const myBelt = (memberProfile.belt || 'white').toLowerCase();
      const existing = prev.find((e: any) => e.name === myName || e.isMe);
      const newCount = (existing?.classCount || 0) + 1;
      const newScore = newCount * 10;
      const updated = existing
        ? prev.map((e: any) => e.name === myName || e.isMe
            ? { ...e, classCount: newCount, score: newScore, isMe: true }
            : e)
        : [...prev, { name: myName, belt: myBelt, classCount: newCount, score: newScore, isMe: true, rank: prev.length + 1 }];
      // Re-sort by score
      const sorted = [...updated].sort((a: any, b: any) => b.score - a.score || a.name.localeCompare(b.name));
      sorted.forEach((e: any, i) => { e.rank = i + 1; });
      const top5 = sorted.slice(0, 5);
      try { localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ data: top5, ts: Date.now() })); } catch {}
      return top5;
    });

    // ── Persist XP + streak to GAS (fire-and-forget) ──────────────────────────
    // saveMemberStats writes TotalPoints + CurrentStreak + MaxStreak to the
    // Members sheet so data survives across devices and sessions.
    const statsToSync = (() => {
      try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; }
    })();
    const currentStreakVal = (res?.currentStreak ?? dailyStreakCount ?? parseInt(localStorage.getItem('lbjj_streak_cache') || '0')) || 0;
    saveMemberStats({
      xp:        statsToSync.xp        || statsToSync.totalXP || 0,
      streak:    currentStreakVal,
      maxStreak: Math.max(statsToSync.maxStreak || 0, currentStreakVal),
    }).catch(() => {});

    // ── Sync newly-earned achievements to GAS MemberBadges sheet ──────────────
    const allEarned: string[] = (() => {
      try { return JSON.parse(localStorage.getItem('lbjj_achievements') || '[]'); } catch { return []; }
    })();
    if (allEarned.length > 0) {
      // Import ALL_ACHIEVEMENTS is already at top of file
      const achievementsToSync = allEarned.map((key: string) => {
        const def = ALL_ACHIEVEMENTS.find(a => a.key === key);
        return def ? { key, label: def.label, icon: def.icon, earnedAt: new Date().toISOString() } : null;
      }).filter(Boolean) as Array<{ key: string; label: string; icon: string; earnedAt: string }>;
      syncAchievements(achievementsToSync).catch(() => {});
    }

    // Bust leaderboard cache so next full fetch gets fresh GAS data
    try { localStorage.removeItem(LEADERBOARD_CACHE_KEY); } catch {}
    try { localStorage.removeItem('lbjj_home_cache'); } catch {}

    // Trigger a background fresh leaderboard fetch after 3s so GAS has time to write
    setTimeout(() => {
      getLeaderboardFresh().then(data => {
        if (!data || data.length === 0) return;
        const top5 = data.slice(0, 5).map((e: any) => ({
          ...e,
          isMe: e.name === memberProfile?.name || e.isMe,
        }));
        setLeaderboard(top5);
        try { localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ data: top5, ts: Date.now() })); } catch {}
      }).catch(() => {});
    }, 3000);

    checkingInRef.current = false;
  }, [member, setMember]);

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
          priority: e.Priority || e.priority || '',
        }));
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: events, ts: Date.now() })); } catch {}
        findNext(events);
      } catch {}
    }

    function findNext(events: { date: string; name: string; location?: string; link?: string; priority?: string }[]) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      type Candidate = { name: string; date: string; days: number; location?: string; link?: string };

      function findBest(filter: (ev: typeof events[number], diff: number) => boolean): Candidate | null {
        let best: Candidate | null = null;
        for (const ev of events) {
          if (!ev.date) continue;
          const d = new Date(ev.date);
          if (isNaN(d.getTime())) continue;
          d.setHours(0, 0, 0, 0);
          const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && filter(ev, diff) && (!best || diff < best.days)) {
            best = { name: ev.name, date: ev.date, days: diff, location: ev.location, link: ev.link };
          }
        }
        return best;
      }

      // 1. Priority=TRUE + Houston within 90 days
      const best =
        findBest((ev, diff) => diff <= 90 && (ev.priority || '').toUpperCase() === 'TRUE' && (ev.location || '').toLowerCase().includes('houston')) ||
        // 2. Any Priority=TRUE within 60 days
        findBest((ev, diff) => diff <= 60 && (ev.priority || '').toUpperCase() === 'TRUE') ||
        // 3. Any upcoming within 60 days (existing behavior)
        findBest((_ev, diff) => diff <= 60);

      if (best) {
        setNextTournament({ name: best.name, date: best.date, location: best.location, link: best.link });
        setTournamentDaysUntil(best.days);
      }
    }

    loadTournaments();
  }, []);

  // ─── Pinned announcement ─────────────────────────────────────────
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<{ message: string; ts: string } | null>(null);

  useEffect(() => {
    getPinnedAnnouncement().then(ann => setPinnedAnnouncement(ann)).catch(() => {});
  }, []);

  // ─── Deferred non-critical data (leaderboard + announcements) ────
  useEffect(() => {
    const load = () => {
      // Leaderboard: always fetch fresh from GAS on mount/login
      // getLeaderboardFresh clears sessionStorage cache so we never show stale data.
      if (member) {
        getLeaderboardFresh().then(data => {
          if (!data || data.length === 0) return;
          const top5 = data.slice(0, 5).map((e: any) => ({
            ...e,
            isMe: e.name === member.name || e.isMe,
          }));
          setLeaderboard(top5);
          try { localStorage.setItem(LEADERBOARD_CACHE_KEY, JSON.stringify({ data: top5, ts: Date.now() })); } catch {}
        }).catch(() => {
          // Fallback to cached getLeaderboard if fresh call fails
          getLeaderboard().then(data => {
            const top5 = (data || []).slice(0, 5).map((e: any) => ({
              ...e,
              isMe: e.name === member.name || e.isMe,
            }));
            setLeaderboard(top5);
          }).catch(() => {});
        });
      }

      // announcements (pinned announcement now loaded separately)
    };

    if ('requestIdleCallback' in window) {
      const id = (window as any).requestIdleCallback(load, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(id);
    } else {
      const t = setTimeout(load, 1500);
      return () => clearTimeout(t);
    }
  }, [member?.email]);


  // J1: Monday morning weekly report
  useEffect(() => {
    const today = new Date();
    const weekKey = `${today.getFullYear()}-W${getWeekNumber(today)}`;
    if (today.getDay() === 1 && localStorage.getItem('lbjj_week_report_seen') !== weekKey) {
      setShowWeekReport(true);
    }
  }, []);

  // ─── Live stream status (poll every 30s) ───────────────────────────
  const STREAM_CACHE_KEY = 'lbjj_stream_status';
  const STREAM_TTL = 30_000;

  // J1: Weekly report state
  const [showWeekReport, setShowWeekReport] = useState(false);
  const [weekReportDismissed, setWeekReportDismissed] = useState(false);
  const [reportDismissing, setReportDismissing] = useState(false);

  const [stream, setStream] = useState<StreamStatus | null>(() => {
    try {
      const cached = localStorage.getItem(STREAM_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < STREAM_TTL) return data;
      }
    } catch {}
    return null;
  });
  useEffect(() => {
    clearStreamCache();
    getStreamStatus().then(s => {
      setStream(s);
      try { localStorage.setItem(STREAM_CACHE_KEY, JSON.stringify({ data: s, ts: Date.now() })); } catch {}
    });
    const interval = setInterval(() => {
      getStreamStatus().then(s => {
        setStream(s);
        try { localStorage.setItem(STREAM_CACHE_KEY, JSON.stringify({ data: s, ts: Date.now() })); } catch {}
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ─── Logged-in home ───────────────────────────────────────────────
  // member is guaranteed non-null here (checked by auth guard in parent)
  if (!member) return null;
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


  // J1: Dismiss weekly report
  const dismissReport = () => {
    const today = new Date();
    const weekKey = `${today.getFullYear()}-W${getWeekNumber(today)}`;
    localStorage.setItem('lbjj_week_report_seen', weekKey);
    setShowWeekReport(false);
    setWeekReportDismissed(true);
  };

  // J1: Compute last week stats
  const lastWeekStats = (() => {
    try {
      const history = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
      const now = new Date();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - now.getDay() - 6);
      lastMonday.setHours(0,0,0,0);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23,59,59,999);
      const lastWeekCheckins = history.filter((c: any) => {
        const d = new Date(c.date || c.timestamp);
        return d >= lastMonday && d <= lastSunday;
      });
      return {
        classes: lastWeekCheckins.length,
        xpEarned: lastWeekCheckins.length * 10,
        gymRank: leaderboard ? leaderboard.findIndex((e: any) => e.name === member?.name) + 1 : 0,
      };
    } catch { return { classes: 0, xpEarned: 0, gymRank: 0 }; }
  })();

  // M2: Technique of the day (admin-overridable via techniqueOverride state)
  const techniqueOfDay = (() => {
    // If admin set a custom technique, show that instead
    if (techniqueOverride) {
      try {
        const custom = JSON.parse(techniqueOverride);
        if (custom.name) return custom;
      } catch {
        // plain string override
        return { name: techniqueOverride, category: 'Custom', tip: 'Coach-selected technique for today.' };
      }
    }
    const techniques = [
      { name: 'Double Leg Takedown', category: 'Takedowns', tip: 'Level change fast, drive through the hips.' },
      { name: 'Armbar from Guard', category: 'Submissions', tip: 'Hip out, control the arm tight to your chest.' },
      { name: 'Rear Naked Choke', category: 'Submissions', tip: 'Seat belt grip first, sink the hook before the choke.' },
      { name: 'Single Leg X Guard', category: 'Guard', tip: 'Keep the knee shield active until you establish X.' },
      { name: 'Triangle Choke', category: 'Submissions', tip: 'Cut the angle 45 degrees before squeezing.' },
      { name: 'Butterfly Guard Sweep', category: 'Sweeps', tip: 'Break their posture down before the lift.' },
      { name: 'Knee Slice Pass', category: 'Passing', tip: 'Chest heavy, hip switch at the moment of pass.' },
      { name: 'Guillotine Choke', category: 'Submissions', tip: 'Hips in, pull up, not out.' },
      { name: 'Spider Guard Control', category: 'Guard', tip: 'Maintain frames, use legs as pistons.' },
      { name: 'Half Guard Sweep', category: 'Sweeps', tip: 'Get the underhook before you go to your knees.' },
      { name: 'Bow and Arrow Choke', category: 'Submissions', tip: 'Control the collar deep, far leg for the finish.' },
      { name: 'De La Riva Hook', category: 'Guard', tip: 'DLR hook on the outside of the knee, not the ankle.' },
      { name: 'Leg Lock Entry', category: 'Leg Locks', tip: 'Get the outside position before the heel hook.' },
      { name: 'Uchi Mata', category: 'Takedowns', tip: 'Kuzushi first — break their balance before the lift.' },
      { name: 'North South Escape', category: 'Escapes', tip: 'Bridge and shrimp simultaneously, not sequentially.' },
      { name: 'Kimura Trap', category: 'Submissions', tip: 'Control the wrist, shoulder up first.' },
      { name: 'X-Guard Sweep', category: 'Sweeps', tip: 'Extend both legs together to break their base.' },
      { name: 'Clock Choke', category: 'Submissions', tip: 'Walk feet toward their head to tighten the choke.' },
      { name: 'Omoplata', category: 'Submissions', tip: 'Hip escape to prevent roll, sit up to finish.' },
      { name: 'Berimbolo', category: 'Guard', tip: 'Invert tight, get the back before they can react.' },
      { name: 'Torreando Pass', category: 'Passing', tip: 'Control both pants, step around, dont step in.' },
      { name: 'Arm Drag to Back', category: 'Takedowns', tip: 'Pull the arm, step behind in the same motion.' },
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return techniques[dayOfYear % techniques.length];
  })();

  // M6: Combo multiplier (consecutive days this week)
  const comboMultiplier = (() => {
    try {
      const weekly = JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
      if (weekly.includes(today) && weekly.includes(yesterday) && weekly.includes(twoDaysAgo)) return 3;
      if (weekly.includes(today) && weekly.includes(yesterday)) return 2;
      return 1;
    } catch { return 1; }
  })();

  // ── Narrative Arc: Training Season (monthly progress ring) ────────
  const trainingSeasonData = (() => {
    try {
      const now = new Date();
      const yearMonth = now.toISOString().slice(0, 7); // "2026-04"
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      // Count check-ins from lbjj_checkin_history this month
      const history: string[] = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
      const thisMonthClasses = history.filter(d => d.startsWith(yearMonth)).length;
      // Also count from game stats as fallback
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      const goalClasses = 20; // monthly goal
      const progress = Math.min(1, thisMonthClasses / goalClasses);
      const monthName = now.toLocaleString('default', { month: 'long' });
      return { thisMonthClasses, goalClasses, progress, monthName, dayOfMonth, daysInMonth };
    } catch { return null; }
  })();

  // ── Narrative Arc: Next Milestone (XP level OR achievement) ────────
  const nextMilestoneData = (() => {
    try {
      const xp = memberXP;
      const { xpForNext, title: nextTitle } = getLevelFromXP(xp);
      const actualLvl = getActualLevel(xp);
      const xpNeeded = xpForNext - xp;
      // Find next locked achievement that is closest to unlocking
      const earned: string[] = JSON.parse(localStorage.getItem('lbjj_achievements') || '[]');
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      const classes = stats.classesAttended || 0;
      const achMilestones = [
        { key: 'ten_classes', label: 'Mat Initiate', need: Math.max(0, 10 - classes), unit: 'classes', icon: '🥋' },
        { key: 'thirty_classes', label: 'Mat Warrior', need: Math.max(0, 30 - classes), unit: 'classes', icon: <SwordsIcon size={16} color="#C8A24C" /> },
        { key: 'hundred_classes', label: 'Century Club', need: Math.max(0, 100 - classes), unit: 'classes', icon: '💯' },
      ];
      const nearestAch = achMilestones
        .filter(a => !earned.includes(a.key) && a.need > 0)
        .sort((a, b) => a.need - b.need)[0];
      // Pick whichever is closer: XP level or achievement
      const xpClassesEquivalent = Math.ceil(xpNeeded / 10);
      if (nearestAch && nearestAch.need < xpClassesEquivalent) {
        return { type: 'achievement' as const, label: nearestAch.label, need: nearestAch.need, unit: nearestAch.unit, icon: nearestAch.icon, xpToNext: xpNeeded, nextLevel: actualLvl + 1, nextTitle };
      }
      return { type: 'xp' as const, label: nextTitle, need: xpNeeded, unit: 'XP', icon: <BoltIcon size={16} color="#C8A24C" />, xpToNext: xpNeeded, nextLevel: actualLvl + 1, nextTitle };
    } catch { return null; }
  })();

  // ── Narrative Arc: Game Day mode (class starting in ≤2 hours) ──────
  const isGameDay = !!nextClass && nextClass.isToday && (() => {
    try {
      if (!nextClass.time) return false;
      const [time, meridiem] = nextClass.time.split(' ');
      const [hStr, mStr] = time.split(':');
      let h = parseInt(hStr); const m = parseInt(mStr) || 0;
      if (meridiem?.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (meridiem?.toUpperCase() === 'AM' && h === 12) h = 0;
      const classTime = new Date(); classTime.setHours(h, m, 0, 0);
      const diffMs = classTime.getTime() - Date.now();
      return diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000;
    } catch { return false; }
  })();

  // M3: Rival computation
  const myLeaderboardRank = leaderboard ? leaderboard.findIndex((e: any) => e.name === member?.name) + 1 : 0;
  const rival = myLeaderboardRank > 1 && leaderboard ? leaderboard[myLeaderboardRank - 2] : null;
  const myClassCount = leaderboard ? (leaderboard.find((e: any) => e.name === member?.name)?.classCount || 0) : 0;

  // M4: Flow state
  const isFlowState = (() => {
    try {
      const history = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const recentCheckins = history.filter((c: any) => new Date(c.date || c.timestamp).getTime() > threeDaysAgo);
      return recentCheckins.length >= 4;
    } catch { return false; }
  })();

  // M5: Tournament countdown
  const tournamentData = (() => {
    try {
      return JSON.parse(localStorage.getItem('lbjj_next_tournament') || 'null');
    } catch { return null; }
  })();
  const daysUntilTournament = tournamentData ? Math.max(0, Math.ceil((new Date(tournamentData.date).getTime() - Date.now()) / 86400000)) : null;

  // ── Narrative helpers ──────────────────────────────────────────
  const trainedCount = weekDots.filter(d => d.trained).length;
  const isPerfectWeek = trainedCount >= 5;
  const isEliteWeek = trainedCount === 7;

  // Multiplier thresholds per day count
  const getWeekMultiplier = (count: number): { label: string; color: string; mult: string } => {
    if (count >= 7) return { label: 'LEGENDARY', color: '#A855F7', mult: '3×' };
    if (count >= 5) return { label: 'PERFECT WEEK', color: '#FFD700', mult: '2×' };
    if (count >= 3) return { label: 'ON A ROLL', color: '#C8A24C', mult: '1.5×' };
    return { label: 'BUILDING', color: '#555', mult: '1×' };
  };

  // Per-dot XP reward label
  const getDotXP = (dotIndex: number): { xp: string; special?: string; color: string } => {
    // dotIndex = how many trained INCLUDING this dot (1-based position if trained)
    if (dotIndex === 7) return { xp: '+15', special: '3× LEGEND', color: '#A855F7' };
    if (dotIndex === 5) return { xp: '+12', special: '2× PERFECT', color: '#FFD700' };
    if (dotIndex === 3) return { xp: '+11', special: '1.5× COMBO', color: '#F97316' };
    return { xp: '+10', color: '#C8A24C' };
  };

  // Context-aware narrative headline
  const getNarrativeHeadline = (): { line1: string; line2: string; accent?: string } => {
    const name = member?.name?.split(' ')[0] || 'Warrior';
    const belt = member?.belt || 'white';

    if (isGameDay && nextClass) {
      return {
        line1: `Game day, ${name}.`,
        line2: `${nextClass.name} is coming up.`,
        accent: 'GAME DAY',
      };
    }
    if (isEliteWeek) {
      return {
        line1: `Legendary week, ${name}.`,
        line2: `7 days. Most people dream that.`,
        accent: 'LEGENDARY',
      };
    }
    if (isPerfectWeek) {
      return {
        line1: `Perfect week locked in.`,
        line2: `Defend it. Add to it. This is your season.`,
        accent: 'PERFECT WEEK',
      };
    }
    if (comboMultiplier >= 3) {
      return {
        line1: `You're in the zone, ${name}.`,
        line2: `3 days straight. Your XP is on fire.`,
        accent: `${comboMultiplier}× COMBO`,
      };
    }
    if (effectiveStreak > 4) {
      return {
        line1: `Week ${effectiveStreak} of showing up.`,
        line2: `The mat remembers everyone who keeps coming back.`,
      };
    }
    if (trainedCount === 0) {
      return {
        line1: `Your ${trainingSeasonData?.monthName || 'month'} chapter starts now.`,
        line2: `First class of the week = the hardest. Also the most important.`,
      };
    }
    if (trainedCount === 1) {
      return {
        line1: `Day 1 checked. ${name}.`,
        line2: `Momentum takes 3. Come back tomorrow.`,
      };
    }
    return {
      line1: `${trainedCount} down this week, ${name}.`,
      line2: trainedCount >= 4
        ? `One more and you hit Perfect Week. Do it.`
        : `${5 - trainedCount} more = Perfect Week + 2× XP.`,
    };
  };

  const narrative = getNarrativeHeadline();
  const beltColor = getBeltColor(member?.belt || 'white');

  // Weekly multiplier state
  const weekMultiplier = getWeekMultiplier(trainedCount);

  return (
    <div className={`app-content home-page-bg${isGameDay ? ' home-page-bg--gameday' : isFlowState ? ' home-page-bg--flow' : ''}`} style={{ minHeight: '100dvh' }}>
      <ScreenHeader
        title="Home"
        right={
          <button onClick={logout} className="p-2 rounded-lg transition-colors" style={{ color: "#666" }} data-testid="button-logout">
            <LogOut size={18} />
          </button>
        }
      />

      {/* ════════════════════════════════════════════════════
          NARRATIVE HERO — "Where am I right now?"
          ════════════════════════════════════════════════════ */}
      <div style={{ margin: '0 20px 18px', cursor: 'pointer' }} className="stagger-child" onClick={() => { haptic(); setShowNarrativeInfo(true); }}>
        <div style={{
          background: isGameDay
            ? 'linear-gradient(135deg, #141008, #1A1500)'
            : isPerfectWeek
              ? 'linear-gradient(135deg, #0F0E00, #1A1600)'
              : 'linear-gradient(135deg, #0D0D0D, #111)',
          border: `1px solid ${isGameDay ? 'rgba(200,162,76,0.35)' : isPerfectWeek ? 'rgba(255,215,0,0.3)' : '#1A1A1A'}`,
          borderRadius: 18,
          padding: '16px 18px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Belt-color ambient glow strip at top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${beltColor} 40%, ${beltColor} 60%, transparent 100%)`,
            opacity: 0.7,
          }} />

          {/* Accent chip */}
          {narrative.accent && (
            <div
              onClick={isGameDay ? (e) => { e.stopPropagation(); haptic(); setShowGameDayInfo(true); } : undefined}
              style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 9px', borderRadius: 999, marginBottom: 10,
              background: isGameDay ? 'rgba(200,162,76,0.15)' : isPerfectWeek ? 'rgba(255,215,0,0.12)' : 'rgba(200,162,76,0.1)',
              border: `1px solid ${isGameDay ? 'rgba(200,162,76,0.3)' : isPerfectWeek ? 'rgba(255,215,0,0.25)' : 'rgba(200,162,76,0.2)'}`,
              animation: isGameDay || isPerfectWeek ? 'xp-pulse 2s ease-in-out infinite' : undefined,
              cursor: isGameDay ? 'pointer' : 'default',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>{isGameDay ? <SwordsIcon size={9} /> : isPerfectWeek ? <TrophyIcon size={9} color="#FFD700" /> : comboMultiplier >= 3 ? <FireIcon size={9} color="#F97316" /> : <BoltIcon size={9} />}</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: isGameDay ? '#C8A24C' : isPerfectWeek ? '#FFD700' : '#C8A24C' }}>
                {narrative.accent}
              </span>
            </div>
          )}

          {/* Main narrative lines */}
          <div style={{ fontSize: 19, fontWeight: 900, color: '#F0F0F0', lineHeight: 1.15, marginBottom: 6, letterSpacing: '-0.01em' }}>
            {narrative.line1}
          </div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, fontWeight: 500 }}>
            {narrative.line2}
          </div>

          {/* Bottom row: streak + combo inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            {effectiveStreak > 0 && (
              <a href="/#/history" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', animation: 'flame-idle 2.4s ease-in-out infinite' }}><FireIcon size={13} color="#E8660C" /></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#C8A24C' }}>{effectiveStreak}-week streak</span>
                {streakFreezeActive && <span style={{ display: 'inline-flex', alignItems: 'center' }}><ShieldIcon size={11} color="#C8A24C" /></span>}
              </a>
            )}
            {comboMultiplier > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 999,
                background: comboMultiplier >= 3 ? 'rgba(249,115,22,0.15)' : 'rgba(200,162,76,0.1)',
                border: `1px solid ${comboMultiplier >= 3 ? 'rgba(249,115,22,0.3)' : 'rgba(200,162,76,0.2)'}`,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: comboMultiplier >= 3 ? '#F97316' : '#C8A24C' }}>
                  {comboMultiplier}× COMBO
                </span>
              </div>
            )}
            {trainingSeasonData && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{trainingSeasonData.monthName}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#F0F0F0' }}>
                  {trainingSeasonData.thisMonthClasses}<span style={{ fontSize: 9, color: '#555', fontWeight: 400 }}>/{trainingSeasonData.goalClasses}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LIVE banner */}
      {stream?.isLive && (
        <a href="/#/live" style={{ textDecoration: 'none', display: 'block' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1A0A0A, #1A1010)',
            border: '1px solid #EF444430',
            borderRadius: 14, padding: '12px 16px',
            margin: '0 20px 14px', cursor: 'pointer',
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

      {/* ════════════════════════════════════════════════════
          WEEKLY XP MULTIPLIER WIDGET
          Transforms at milestone thresholds.
          ════════════════════════════════════════════════════ */}
      {(() => {
        const anyTrained = weekDots.some(d => d.trained);
        const isMaxed = isEliteWeek;
        // Daily streak overrides weekly card appearance at 7/14/21/30 day milestones
        const dsCardBg = dailyStreakTier === 'paragon'
          ? 'linear-gradient(135deg, #1A0A1A, #250A25)' // deep purple
          : dailyStreakTier === 'legend'
            ? 'linear-gradient(135deg, #0A0A1A, #151530)' // midnight blue
            : dailyStreakTier === 'diamond'
              ? 'linear-gradient(135deg, #0A1A1A, #0A2525)' // teal-black
              : dailyStreakTier === 'fire'
                ? 'linear-gradient(135deg, #1A0A00, #200A00)' // deep ember
                : null;
        const dsCardBorder = dailyStreakTier === 'paragon' ? 'rgba(220,70,220,0.6)'
          : dailyStreakTier === 'legend' ? 'rgba(90,120,255,0.6)'
          : dailyStreakTier === 'diamond' ? 'rgba(60,200,200,0.6)'
          : dailyStreakTier === 'fire' ? 'rgba(255,100,10,0.6)'
          : null;
        const dsHeaderColor = dailyStreakTier === 'paragon' ? '#E060E0'
          : dailyStreakTier === 'legend' ? '#7090FF'
          : dailyStreakTier === 'diamond' ? '#40CCCC'
          : dailyStreakTier === 'fire' ? '#FF6010'
          : null;

        const cardBg = dsCardBg || (isEliteWeek
          ? 'linear-gradient(135deg, #120820, #1A0A2A)'
          : isPerfectWeek
            ? 'linear-gradient(135deg, #141008, #1A1500)'
            : 'linear-gradient(135deg, #0D0D0D, #111)');
        const cardBorder = dsCardBorder || (isEliteWeek
          ? 'rgba(168,85,247,0.45)'
          : isPerfectWeek
            ? 'rgba(255,215,0,0.4)'
            : anyTrained ? 'rgba(200,162,76,0.15)' : 'rgba(200,162,76,0.08)');
        const headerColor = dsHeaderColor || (isEliteWeek ? '#A855F7' : isPerfectWeek ? '#FFD700' : '#C8A24C');

        // Milestones on the journey: day 3 = combo, day 5 = perfect, day 7 = legend
        const milestoneAt = [3, 5, 7];

        return (
          <div className="mx-5 mb-4 stagger-child reveal" onClick={() => { haptic(); setShowStreakInfo(true); }} style={{ cursor: 'pointer' }}>
            <div style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 16,
              padding: '14px 16px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 600ms ease, background 600ms ease',
              ...(isPerfectWeek ? { boxShadow: '0 0 30px rgba(255,215,0,0.08)' } : {}),
              ...(isEliteWeek ? { boxShadow: '0 0 40px rgba(168,85,247,0.12)' } : {}),
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {isEliteWeek ? <TrophyIcon size={12} color="#A855F7" /> : isPerfectWeek ? <TrophyIcon size={12} color="#FFD700" /> : anyTrained ? <CalendarSparkIcon size={12} /> : <AchievedIcon size={12} />}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: headerColor }}>
                    This Week
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); haptic(); setShowWeekStats(true); }}
                    aria-label="Your week stats"
                    style={{
                      width: 18, height: 18, padding: 0, borderRadius: '50%',
                      background: 'rgba(200,162,76,0.08)', border: '1px solid rgba(200,162,76,0.25)',
                      color: '#C8A24C', fontSize: 10, fontWeight: 800, lineHeight: 1,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', marginLeft: 4,
                    }}
                  >i</button>
                  {/* Daily streak power badge */}
                  {dailyStreakTier !== 'none' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      padding: '1px 7px', borderRadius: 999, marginLeft: 4,
                      background: dsCardBorder ? `${dsCardBorder.replace('0.6', '0.15')}` : 'rgba(255,100,10,0.15)',
                      border: `1px solid ${dsCardBorder || 'rgba(255,100,10,0.4)'}`,
                      animation: 'xp-pulse 2s ease-in-out infinite',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {dailyStreakTier === 'paragon' ? <BoltIcon size={10} color="#DC46DC" /> : dailyStreakTier === 'legend' ? <StarIcon size={10} color="#5A78FF" /> : dailyStreakTier === 'diamond' ? <StarIcon size={10} color="#22D3EE" /> : <FireIcon size={10} color="#F97316" />}
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 800, color: dsHeaderColor || '#FF6010', letterSpacing: '0.08em' }}>
                        {dailyStreakCount}D
                      </span>
                    </div>
                  )}
                </div>
                {/* Current multiplier badge — glows when active */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Active multiplier glow badge (only shows when mult > 1×) */}
                  {trainedCount >= 3 && (
                    <div style={{
                      position: 'relative',
                      width: 22, height: 22, borderRadius: '50%',
                      background: isEliteWeek
                        ? 'radial-gradient(circle at 40% 35%, #C084FC, #7C3AED)'
                        : isPerfectWeek
                          ? 'radial-gradient(circle at 40% 35%, #FFE566, #C8A24C)'
                          : 'radial-gradient(circle at 40% 35%, #FFBB55, #C8520A)',
                      boxShadow: isEliteWeek
                        ? '0 0 10px rgba(168,85,247,0.9), 0 0 20px rgba(168,85,247,0.5)'
                        : isPerfectWeek
                          ? '0 0 10px rgba(255,215,0,0.9), 0 0 20px rgba(255,215,0,0.5)'
                          : '0 0 10px rgba(249,115,22,0.9), 0 0 20px rgba(249,115,22,0.4)',
                      animation: 'activeMultiplierPulse 1.8s ease-in-out infinite',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#000', letterSpacing: '-0.02em' }}>
                        {isEliteWeek ? '3×' : isPerfectWeek ? '2×' : '1.5×'}
                      </span>
                      {/* Outer pulse ring */}
                      <div style={{
                        position: 'absolute', inset: -3, borderRadius: '50%',
                        border: `1.5px solid ${isEliteWeek ? 'rgba(168,85,247,0.6)' : isPerfectWeek ? 'rgba(255,215,0,0.6)' : 'rgba(249,115,22,0.6)'}`,
                        animation: 'activeMultiplierRing 1.8s ease-in-out infinite',
                      }}/>
                    </div>
                  )}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 999,
                    background: isEliteWeek ? 'rgba(168,85,247,0.15)' : isPerfectWeek ? 'rgba(255,215,0,0.12)' : 'rgba(200,162,76,0.08)',
                    border: `1px solid ${isEliteWeek ? 'rgba(168,85,247,0.4)' : isPerfectWeek ? 'rgba(255,215,0,0.3)' : 'rgba(200,162,76,0.2)'}`,
                    animation: isPerfectWeek || isEliteWeek ? 'xp-pulse 2s ease-in-out infinite' : undefined,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 900, color: headerColor }}>
                      {weekMultiplier.mult}
                    </span>
                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: headerColor, opacity: 0.8 }}>
                      {weekMultiplier.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* THE DOTS — each with multiplier preview */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 4 }}>
                {weekDots.map((d, i) => {
                  const dotNum = i + 1; // 1-based
                  const isMilestone = milestoneAt.includes(dotNum);
                  const dotXP = getDotXP(dotNum);

                  // For untrained future dots, show what XP they would grant
                  const dotColor = d.trained
                    ? (dotNum === 7 ? '#A855F7' : dotNum === 5 ? '#FFD700' : '#C8A24C')
                    : d.isToday
                      ? '#F0F0F0'
                      : '#2A2A2A';

                  const dotBg = d.trained
                    ? dotColor
                    : d.isToday
                      ? 'transparent'
                      : 'transparent';

                  const dotBorder = d.trained
                    ? 'none'
                    : d.isToday
                      ? `2px solid ${beltColor}`
                      : !anyTrained
                        ? `2px dashed rgba(200,162,76,0.2)` // ghost
                        : `2px solid #222`;

                  const dotGlow = d.trained
                    ? (dotNum === 7 ? '0 0 12px rgba(168,85,247,0.7)' : dotNum === 5 ? '0 0 12px rgba(255,215,0,0.5)' : '0 0 8px rgba(200,162,76,0.4)')
                    : 'none';

                  // Size: milestone dots are slightly larger
                  const dotSize = isMilestone ? 32 : 28;

                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                      {/* XP label above dot — shown for trained or upcoming milestones */}
                      <div style={{
                        fontSize: 8, fontWeight: 800,
                        color: d.trained ? dotXP.color : !anyTrained ? 'rgba(200,162,76,0.3)' : '#2A2A2A',
                        letterSpacing: '0.05em',
                        height: 10, display: 'flex', alignItems: 'center',
                        transition: 'color 400ms ease',
                      }}>
                        {dotXP.xp}
                      </div>

                      {/* The dot itself */}
                      <div style={{
                        width: dotSize, height: dotSize,
                        borderRadius: '50%',
                        background: dotBg,
                        border: dotBorder,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: dotGlow,
                        transition: 'all 300ms cubic-bezier(0.34,1.56,0.64,1)',
                        position: 'relative',
                        flexShrink: 0,
                      }}>
                        {d.trained ? (
                          <svg width={dotSize === 32 ? 14 : 12} height={dotSize === 32 ? 14 : 12} viewBox="0 0 24 24" fill="none" stroke={dotNum >= 5 ? '#000' : '#0A0A0A'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : d.isToday ? (
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: beltColor, animation: 'todayDotPulse 1.4s ease-in-out infinite', boxShadow: `0 0 6px ${beltColor}` }} />
                        ) : (
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2A2A2A', opacity: !anyTrained ? 0.4 : 1 }} />
                        )}

                        {/* Milestone ring — pulsing halo for unlocked milestones */}
                        {d.trained && isMilestone && (
                          <div style={{
                            position: 'absolute', inset: -4,
                            borderRadius: '50%',
                            border: `1.5px solid ${dotColor}`,
                            opacity: 0.4,
                            animation: 'ring-pulse 2s ease-in-out infinite',
                          }} />
                        )}
                      </div>

                      {/* Day label */}
                      <span style={{
                        fontSize: 9,
                        color: d.isToday ? '#E0E0E0' : d.trained ? dotColor : '#3A3A3A',
                        fontWeight: d.isToday ? 700 : 500,
                        transition: 'color 400ms ease',
                      }}>
                        {d.label}
                      </span>

                      {/* Milestone label under day for key days */}
                      <div style={{
                        fontSize: 7, fontWeight: 800, letterSpacing: '0.04em',
                        color: d.trained
                          ? (dotNum === 7 ? '#A855F7' : dotNum === 5 ? '#FFD700' : dotNum === 3 ? '#F97316' : 'transparent')
                          : 'transparent',
                        height: 9,
                        textAlign: 'center',
                        lineHeight: 1,
                      }}>
                        {dotNum === 3 ? '1.5×' : dotNum === 5 ? 'PERF' : dotNum === 7 ? '3×' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar showing path to perfect week */}
              <div style={{ marginTop: 14, height: 3, borderRadius: 2, background: '#111', overflow: 'hidden', position: 'relative' }}>
                {/* Milestone markers */}
                {[3/7, 5/7].map((pct, idx) => (
                  <div key={idx} style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${pct * 100}%`, width: 1,
                    background: idx === 0 ? 'rgba(249,115,22,0.4)' : 'rgba(255,215,0,0.4)',
                  }} />
                ))}
                <div style={{
                  height: '100%',
                  width: `${(trainedCount / 7) * 100}%`,
                  background: isEliteWeek
                    ? 'linear-gradient(90deg, #A855F7, #EC4899)'
                    : isPerfectWeek
                      ? 'linear-gradient(90deg, #C8A24C, #FFD700)'
                      : 'linear-gradient(90deg, #555, #C8A24C)',
                  borderRadius: 2,
                  transition: 'width 800ms cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              {/* Bottom CTA — contextual */}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: '#555' }}>
                  {isEliteWeek
                    ? 'Full week. You are the gym.'
                    : isPerfectWeek
                      ? `Perfect. ${7 - trainedCount} more to go legendary.`
                      : trainedCount > 0
                        ? `${5 - trainedCount > 0 ? `${5 - trainedCount} more → Perfect Week` : 'Perfect. Keep going.'}`
                        : 'First class unlocks the streak.'}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: headerColor }}>
                  {trainedCount}/7
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════
          NEXT CLASS / GAME DAY CARD
          ════════════════════════════════════════════════════ */}
      {nextClass && (
        <div className="mx-5 mb-4 stagger-child" data-card-interactive="true">
          <div style={{
            background: isGameDay ? 'linear-gradient(135deg, #141008, #1A1402)' : '#141414',
            border: isGameDay ? '1px solid rgba(200,162,76,0.4)' : '1px solid #1A1A1A',
            borderLeft: `3px solid ${isGameDay ? '#FFD700' : '#C8A24C'}`,
            borderRadius: 14,
            padding: isGameDay ? '16px 18px' : '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: isGameDay ? '0 0 24px rgba(200,162,76,0.1)' : 'none',
          }}>
            <a href="/#/schedule" style={{ textDecoration: 'none', flex: 1 }}>
              {isGameDay && (
                <span className="gameday-label">
                  <SwordIcon size={12} color="#FFD700" className="gameday-sword" />
                  GAME DAY
                </span>
              )}
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: isGameDay ? '#C8A24C' : '#C8A24C', textTransform: 'uppercase' as const, marginBottom: 4 }}>
                {isGameDay ? nextClass.name : 'Next Class'}
              </div>
              {!isGameDay && <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 2 }}>{nextClass.name}</div>}
              <div style={{ fontSize: 12, color: '#666' }}>{nextClass.dayLabel} · {formatClassTime(nextClass.time)}</div>
              {nextClass.instructor && <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>w/ {nextClass.instructor}</div>}
              {timeUntilClass && (
                <div className="next-class-countdown" style={{ color: isGameDay ? '#FFD700' : 'var(--lbj-gold)' }}>
                  <ClockCountdownIcon size={12} color="currentColor" aria-hidden="true" />
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{timeUntilClass}</span>
                </div>
              )}
            </a>
            {nextClass.isToday && (() => {
              const alreadyCheckedIn = checkedInClasses.includes(nextClass.name || '');
              return (
                <div style={{ position: 'relative' }}>
                  {checkinPhase === 'success' && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 10,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(200,162,76,0.3) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'checkin-shimmer 600ms ease-out 400ms both',
                      pointerEvents: 'none', zIndex: 1,
                    }}/>
                  )}
                  <button
                    data-checkin-btn
                    data-phase={checkinPhase}
                    onMouseDown={() => !alreadyCheckedIn && checkinPhase === 'idle' && setCheckinPhase('pressing')}
                    onTouchStart={() => !alreadyCheckedIn && checkinPhase === 'idle' && setCheckinPhase('pressing')}
                    onClick={() => {
                      if (alreadyCheckedIn || (checkinPhase !== 'idle' && checkinPhase !== 'pressing')) return;

                      // Early gate check
                      const windowMinutes = parseInt(localStorage.getItem('lbjj_checkin_window_minutes') || '60');
                      const gateEnabled = localStorage.getItem('lbjj_checkin_gate_enabled') !== 'false';

                      if (gateEnabled && windowMinutes > 0 && nextClass.time) {
                        const [timePart, meridiem] = (nextClass.time || '').split(' ');
                        const [hourStr, minStr] = timePart.split(':');
                        let hour = parseInt(hourStr);
                        const min = parseInt(minStr || '0');
                        if (meridiem?.toLowerCase() === 'pm' && hour !== 12) hour += 12;
                        if (meridiem?.toLowerCase() === 'am' && hour === 12) hour = 0;
                        const now = new Date();
                        const classTime = new Date(now);
                        classTime.setHours(hour, min, 0, 0);
                        const minutesUntil = (classTime.getTime() - now.getTime()) / 60000;

                        if (minutesUntil > windowMinutes) {
                          const hrs = Math.floor(minutesUntil / 60);
                          const mins = Math.round(minutesUntil % 60);
                          const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins} minutes`;
                          setEarlyCheckInMsg(`Class starts in ${timeStr}. Check-in opens ${windowMinutes >= 60 ? (windowMinutes/60)+'h' : windowMinutes+'min'} before class.`);
                          return;
                        }
                      }

                      setCheckinPhase('pressing');
                      handleHomeCheckIn(nextClass);
                    }}
                    disabled={alreadyCheckedIn || checkinPhase === 'success' || checkinPhase === 'done'}
                    style={{
                      flexShrink: 0,
                      padding: isGameDay ? '14px 20px' : '10px 14px',
                      borderRadius: isGameDay ? 14 : 10,
                      background: alreadyCheckedIn || checkinPhase === 'success' || checkinPhase === 'done' ? '#333' : '#C8A24C',
                      border: 'none',
                      color: alreadyCheckedIn ? '#666' : '#000',
                      fontWeight: 800, fontSize: isGameDay ? 15 : 13,
                      cursor: alreadyCheckedIn ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6,
                      opacity: alreadyCheckedIn ? 0.6 : 1,
                      transform: checkinPhase === 'pressing' ? 'scale(0.95) translateY(1px)' : checkinPhase === 'success' ? 'scale(1.02)' : 'scale(1)',
                      transition: 'transform 120ms ease, background 200ms ease',
                      boxShadow: isGameDay && !alreadyCheckedIn ? '0 0 20px rgba(200,162,76,0.5)' : 'none',
                      animation: nextClass.isToday && !alreadyCheckedIn && checkinPhase === 'idle' ? (isGameDay ? 'checkin-pulse-game 2s ease-in-out infinite' : 'checkin-pulse 2s ease-in-out infinite') : undefined,
                    }}
                  >
                    {checkinPhase === 'success' || checkinPhase === 'done' ? (
                      <svg viewBox="0 0 24 24" width={16} height={16}>
                        <polyline points="3,13 9,19 21,5" fill="none" stroke={alreadyCheckedIn ? '#666' : '#666'} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
                          style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'checkin-draw 350ms ease-out 50ms forwards' }}/>
                      </svg>
                    ) : (
                      <GiIcon size={14} color="currentColor" aria-hidden="true" />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      {alreadyCheckedIn || checkinPhase === 'done' ? 'Done' : checkinPhase === 'success' ? 'OSS!' : 'Check In'}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Early check-in gate message */}
      {earlyCheckInMsg && (
        <div className="early-checkin-msg" role="alert">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
               stroke="var(--lbj-warning)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ flex: 1 }}>{earlyCheckInMsg}</span>
          <button onClick={() => setEarlyCheckInMsg('')} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'var(--lbj-text-faint)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {homeLoading ? (
        <div className="px-5 space-y-3 mt-2">
          <div style={{ display: 'flex', gap: 12 }}>
            <StatSkeleton />
            <StatSkeleton />
          </div>
          <ListSkeleton count={3} />
          {homeLoadSlow && (
            <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginTop: 8 }}>Still loading your dashboard…</p>
          )}
        </div>
      ) : (
      <>

      {/* ════════════════════════════════════════════════════
          STATS ROW — Streak + Total classes
          ════════════════════════════════════════════════════ */}
      <div className="stagger-child" style={{ display: 'flex', gap: 10, margin: '0 20px 16px' }}>
        <a href="/#/history" style={{
          flex: 1, background: 'linear-gradient(135deg, rgba(200,162,76,0.1) 0%, rgba(200,162,76,0.03) 100%)',
          border: '1px solid rgba(200,162,76,0.18)', borderRadius: 12,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', cursor: 'pointer',
        }} className="active:scale-[0.95]">
          <span className="streak-icon" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#C8A24C',
            ...(effectiveStreak > 0 ? { animation: 'flame-idle 2.4s ease-in-out infinite' } : {}),
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#C8A24C" stroke="none">
              <path d="M12 2c0 0-5 5.5-5 10a5 5 0 0 0 10 0C17 7.5 12 2 12 2zm0 15a3 3 0 0 1-3-3c0-2.5 3-6 3-6s3 3.5 3 6a3 3 0 0 1-3 3z"/>
            </svg>
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#C8A24C', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              {displayStreak}
              {streakFreezeActive && <span style={{ display: 'inline-flex', alignItems: 'center' }}><ShieldIcon size={14} color="#C8A24C" /></span>}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Week streak</div>
          </div>
          <ChevronRight size={14} color="#555" strokeWidth={2} />
        </a>
        <a href="/#/history" style={{
          flex: 1,
          background: classesToday > 0 ? 'linear-gradient(135deg, rgba(76,175,128,0.12) 0%, rgba(76,175,128,0.04) 100%)' : 'rgba(255,255,255,0.03)',
          border: classesToday > 0 ? '1px solid rgba(76,175,128,0.2)' : '1px solid #1A1A1A',
          borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          textDecoration: 'none', cursor: 'pointer',
        }} className="active:scale-[0.95]">
          {classesToday > 0 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" fill="rgba(76,175,128,0.15)" stroke="#4CAF80" strokeWidth="1.5"/>
              <polyline points="7 12 10.5 15.5 17 9" stroke="#4CAF80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: classesToday > 0 ? '#4CAF80' : '#E0E0E0', lineHeight: 1 }}>
              {displayTotalClasses}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Total classes</div>
            {classesToday > 0 && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{classesToday} today</div>}
          </div>
          <ChevronRight size={14} color="#555" strokeWidth={2} />
        </a>
      </div>

      {/* ════════════════════════════════════════════════════
          SOCIAL PRESSURE STRIP — Gym activity + Rival
          ════════════════════════════════════════════════════ */}
      {leaderboard.length > 0 && (
        <div className="mx-5 mb-4 stagger-child">
          <div style={{
            background: '#0D0D0D',
            border: '1px solid #1A1A1A',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 8px', borderBottom: '1px solid #141414' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF80', animation: 'ring-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4CAF80' }}>Gym Activity</span>
              </div>
              <a href="/#/leaderboard" style={{ fontSize: 11, color: '#C8A24C', textDecoration: 'none', fontWeight: 600 }}>Full board →</a>
            </div>

            {/* Rival callout — if not #1 */}
            {rival && myLeaderboardRank > 1 && (
              <div className="reveal" style={{ padding: '10px 14px', borderBottom: '1px solid #111', background: 'rgba(224,85,85,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#E05555', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>Your Rival</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#F0F0F0',
                      border: `1.5px solid ${getBeltColor(rival.belt || 'white')}`,
                      flexShrink: 0,
                    }}>
                      {(rival.name || '?').charAt(0)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#CCC', flex: 1 }}>{rival.name}</span>
                    <span style={{ fontSize: 11, color: '#E05555', fontWeight: 600 }}>
                      +{Math.max(0, (rival.classCount || 0) - myClassCount)} classes ahead
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Top 3 compact */}
            {leaderboard.slice(0, 3).map((entry, i) => {
              const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              const isMe = entry.name === member?.name;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                  borderBottom: i < 2 ? '1px solid #111' : 'none',
                  background: isMe ? 'rgba(200,162,76,0.06)' : 'transparent',
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 900, color: medalColors[i],
                    background: `${medalColors[i]}18`,
                  }}>
                    {i + 1}
                  </span>
                  <BeltIcon belt={entry.belt || 'white'} width={18} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: isMe ? 700 : 500, color: isMe ? '#C8A24C' : '#CCC' }}>
                    {isMe ? 'You' : entry.name}
                  </span>
                  <span style={{ fontSize: 12, color: '#555', fontWeight: 600 }}>
                    {entry.classCount || 0}<span style={{ fontSize: 9, color: '#333' }}> cls</span>
                  </span>
                </div>
              );
            })}

            {/* My rank if not in top 3 */}
            {myLeaderboardRank > 3 && (
              <div style={{ padding: '8px 14px', borderTop: '1px solid #111', background: 'rgba(200,162,76,0.04)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em' }}>YOUR RANK</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#C8A24C' }}>#{myLeaderboardRank}</span>
                <span style={{ fontSize: 11, color: '#555' }}>· {myClassCount} classes</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          XP PROGRESS WIDGET
          ════════════════════════════════════════════════════ */}
      {member && (
        <div className="mx-5 mb-4 stagger-child reveal" style={{ position: 'relative' }} onClick={() => { haptic(); setShowRankInfo(true); }}>
          <div style={{
            position: 'absolute', inset: -1, borderRadius: 17,
            background: 'linear-gradient(135deg, rgba(200,162,76,0.25), transparent, rgba(200,162,76,0.08))',
            filter: 'blur(8px)', zIndex: 0,
          }}/>
          <div style={{
            position: 'relative', zIndex: 1,
            background: 'linear-gradient(135deg, #0D0D0D 0%, #141408 100%)',
            borderRadius: 16, padding: '14px 16px',
            border: '1px solid rgba(200,162,76,0.18)',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #FFD700, #C8A24C 50%, #6B4A00)',
                  boxShadow: '0 0 12px rgba(200,162,76,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 900, color: '#000',
                }}>
                  {getActualLevel(memberXP)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#F0F0F0' }}>{getLevelFromXP(memberXP).title}</div>
                  <div style={{ fontSize: 10, color: '#555' }}>{memberXP.toLocaleString()} XP</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#C8A24C', fontWeight: 600 }}>
                +{(getLevelFromXP(memberXP).xpForNext - memberXP).toLocaleString()} to next
              </div>
            </div>
            <div style={{ height: 14, borderRadius: 7, background: '#0A0A0A', overflow: 'hidden', position: 'relative', border: '1px solid #1A1A1A', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
              {(() => {
                const pct = getLevelFromXP(memberXP).progress * 100;
                const visibleWidth = pct < 1 ? 20 : pct; // min 20px-equivalent so bar always shows
                return (
                  <>
                    <div style={{
                      height: '100%', width: `${Math.max(visibleWidth, 4)}%`,
                      background: pct < 1
                        ? 'linear-gradient(90deg, rgba(200,162,76,0.4), rgba(200,162,76,0.15))'
                        : 'linear-gradient(90deg, #6B4A00 0%, #C8A24C 40%, #FFD700 70%, #FFF8DC 85%, #FFD700 100%)',
                      backgroundSize: '300% 100%',
                      animation: pct < 1 ? 'xpBarShimmer 2s ease-in-out infinite alternate' : 'xp-shimmer 2s linear infinite',
                      borderRadius: 7, transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: pct < 1 ? '0 0 8px rgba(200,162,76,0.3)' : '0 0 10px rgba(255,215,0,0.6), 0 0 20px rgba(200,162,76,0.3)',
                    }}/>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)', borderRadius: '7px 7px 0 0', pointerEvents: 'none' }}/>
                    {[25, 50, 75].map(p => (
                      <div key={p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p}%`, width: 1, background: 'rgba(0,0,0,0.3)' }}/>
                    ))}
                  </>
                );
              })()}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 12, justifyContent: 'center' }}>
              {[
                { icon: <GrapplingIcon size={14} />, label: 'Check in', xp: '+10' },
                { icon: <TrophyIcon size={14} color="#C8A24C" />, label: 'Tournament', xp: '+50' },
                { icon: <GoldMedalIcon size={14} />, label: 'Gold', xp: '+150' },
              ].map(item => (
                <div key={item.label} style={{ textAlign: 'center' as const, opacity: 0.7 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>{item.icon}</div>
                  <div style={{ fontSize: 9, color: '#C8A24C', fontWeight: 700 }}>{item.xp} XP</div>
                  <div style={{ fontSize: 8, color: '#444' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flamePulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px #C8A24C88); }
          50% { transform: scale(1.15); filter: drop-shadow(0 0 10px #C8A24Ccc); }
        }
        @keyframes xp-shimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes activeMultiplierPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes activeMultiplierRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes streakBarFill {
          from { width: 0%; }
          to { width: var(--bar-width); }
        }
        @keyframes todayDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        @keyframes xpBarShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

            {/* SEASON + MILESTONE — 2-column square tiles */}
      {(trainingSeasonData || (nextMilestoneData && nextMilestoneData.need > 0)) && (
        <div className="mx-5 mb-4 stagger-child" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

          {/* LEFT: Season tile */}
          {trainingSeasonData ? (
            <div
              onClick={() => { haptic(); setShowSeasonModal(true); }}
              style={{
                background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 16,
                padding: '14px 12px 12px', cursor: 'pointer', display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: 130,
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8A24C', alignSelf: 'flex-start' }}>
                {trainingSeasonData.monthName} Season
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={62} height={62} viewBox="0 0 64 64">
                  <circle cx={32} cy={32} r={26} fill="none" stroke="#1A1A1A" strokeWidth={5}/>
                  <circle cx={32} cy={32} r={26} fill="none"
                    stroke="url(#sg-sq)" strokeWidth={5} strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - trainingSeasonData.progress)}`}
                    transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                  <defs>
                    <linearGradient id="sg-sq" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B6914"/><stop offset="100%" stopColor="#FFD700"/>
                    </linearGradient>
                  </defs>
                  <text x={32} y={37} textAnchor="middle" fill="#F0F0F0" fontSize={16} fontWeight={900} fontFamily="sans-serif">
                    {trainingSeasonData.thisMonthClasses}
                  </text>
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F0F0F0', textAlign: 'center' }}>
                {trainingSeasonData.thisMonthClasses}<span style={{ color: '#444', fontWeight: 400, fontSize: 11 }}> / {trainingSeasonData.goalClasses}</span>
              </div>
              <div style={{ width: '100%', height: 3, borderRadius: 2, background: '#1A1A1A', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, trainingSeasonData.progress * 100)}%`, background: 'linear-gradient(90deg, #8B6914, #FFD700)', borderRadius: 2, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }}/>
              </div>
              <div style={{ fontSize: 9, color: '#555', textAlign: 'center' }}>
                {trainingSeasonData.thisMonthClasses >= trainingSeasonData.goalClasses ? 'Season complete ✓' : `${trainingSeasonData.goalClasses - trainingSeasonData.thisMonthClasses} more to complete`}
              </div>
            </div>
          ) : <div />}

          {/* RIGHT: Next Milestone tile */}
          {nextMilestoneData && nextMilestoneData.need > 0 ? (
            <div
              onClick={() => { haptic(); setShowMilestoneInfo(true); }}
              style={{
                background: '#0D0D0D', border: '1px solid rgba(200,162,76,0.12)', borderRadius: 16,
                padding: '14px 12px 12px', cursor: 'pointer', display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: 130,
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#444', alignSelf: 'flex-start' }}>
                Next Milestone
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 14,
                  background: 'rgba(200,162,76,0.08)', border: '1px solid rgba(200,162,76,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {React.cloneElement(nextMilestoneData.icon as React.ReactElement<any>, { size: 26 })}
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#F0F0F0', textAlign: 'center', lineHeight: 1.25 }}>
                {nextMilestoneData.label}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#C8A24C', textAlign: 'center' }}>
                {nextMilestoneData.type === 'achievement'
                  ? `${nextMilestoneData.need} ${nextMilestoneData.unit} away`
                  : `${nextMilestoneData.need.toLocaleString()} XP away`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#333' }}>
                <span>View all</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          ) : <div />}

        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TECHNIQUE OF THE DAY
          ════════════════════════════════════════════════════ */}
      {techniqueOfDay && (
        <div
          style={{
            margin: '0 20px 14px', padding: '14px 16px',
            background: 'linear-gradient(135deg, #0D0D0D, #0A0A10)',
            border: '1px solid #C8A24C14', borderRadius: 14,
            cursor: member?.isAdmin ? 'pointer' : 'default',
          }}
          className="stagger-child"
          onClick={member?.isAdmin ? () => { haptic(); setShowTechniqueEditor(true); } : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C8A24C', display: 'flex', alignItems: 'center', gap: 6 }}>
              Technique of the Day
              {member?.isAdmin && <span style={{ fontSize: 8, color: '#444', background: '#1A1A1A', padding: '1px 5px', borderRadius: 4, border: '1px solid #2A2A2A' }}>✏️ Edit</span>}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, background: '#111', border: '1px solid #222' }}>
              {techniqueOfDay.category}
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0', marginBottom: 6 }}>{techniqueOfDay.name}</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{techniqueOfDay.tip}</div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FLOW STATE / COMBO (ambient chips — only if notable)
          ════════════════════════════════════════════════════ */}
      {isFlowState && (
        <div style={{ margin: '0 20px 10px', display: 'flex' }} className="stagger-child reveal">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(100,150,255,0.1)', border: '1px solid rgba(100,150,255,0.2)',
            animation: 'pulse 2s ease-in-out infinite',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}><BoltIcon size={12} color="rgba(130,170,255,0.9)" /></span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(130,170,255,0.9)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Flow State</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          WEEKLY REPORT (Monday morning)
          ════════════════════════════════════════════════════ */}
      {showWeekReport && !weekReportDismissed && (
        <div style={{ margin: '0 20px 16px' }} className={`week-report-card stagger-child reveal${reportDismissing ? ' week-report-card--dismissing' : ''}`}>
          <button
            className="week-report-dismiss"
            onClick={() => { setReportDismissing(true); setTimeout(dismissReport, 200); }}
            aria-label="Dismiss weekly report"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#C8A24C', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Last Week</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F0F0' }}>{lastWeekStats.classes}</div>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Classes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#C8A24C' }}>+{lastWeekStats.xpEarned}</div>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>XP</div>
            </div>
            {lastWeekStats.gymRank > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#F0F0F0' }}>#{lastWeekStats.gymRank}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gym Rank</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>
            {lastWeekStats.classes >= 5 ? "Perfect week. That's elite consistency."
              : lastWeekStats.classes >= 3 ? "Strong week. You outpaced most of the gym."
              : lastWeekStats.classes >= 1 ? "You showed up. That's more than most."
              : "The mat is waiting. New week, fresh start."}
          </div>
        </div>
      )}

      {/* Streak freeze controls */}
      {freezeAvailable && (
        <div className="mx-5 mb-3" style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="freeze-btn" onClick={() => {
            const thisMonth = new Date().toISOString().slice(0, 7);
            localStorage.setItem('lbjj_streak_freeze_used', thisMonth);
            setFreezeAvailable(false); setFreezeUsed(true);
          }}>
            <ShieldFreezeIcon size={14} color="#60A5FA" aria-hidden="true" />
            Freeze Streak (1 available this month)
          </button>
        </div>
      )}
      {freezeUsed && <div className="mx-5 mb-2" style={{ textAlign: 'center', fontSize: 10, color: '#555' }}>Streak freeze used this month</div>}

      </>
      )}

      {/* ════════════════════════════════════════════════════
          TOURNAMENT COUNTDOWN
          ════════════════════════════════════════════════════ */}
      {nextTournament && tournamentDaysUntil <= 60 && (
        <div className="mx-5 mb-4 reveal">
          <div style={{ background: 'linear-gradient(135deg, #141414, #1A1A0A)', border: '1px solid rgba(200,162,76,0.19)', borderRadius: 14, padding: 16, position: 'relative' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#C8A24C', textTransform: 'uppercase' as const, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <TrophyIcon size={11} color="#C8A24C" aria-hidden="true" />
                Upcoming Tournament
              </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>{nextTournament.name}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{tournamentDaysUntil === 0 ? 'Today!' : tournamentDaysUntil === 1 ? 'Tomorrow' : `${tournamentDaysUntil} days away`}</div>
                {nextTournament.location && (
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{nextTournament.location}</div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700' }}>{tournamentDaysUntil}</div>
                <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase' }}>Days Out</div>
              </div>
            </div>
            {/* Map + Website buttons tucked in bottom-right corner */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
              {nextTournament.location && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(nextTournament.location)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px', borderRadius: 8,
                    background: 'rgba(200,162,76,0.1)', border: '1px solid rgba(200,162,76,0.25)',
                    color: '#C8A24C', fontSize: 11, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Map
                </a>
              )}
              {nextTournament.link && (
                <a
                  href={nextTournament.link}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px', borderRadius: 8,
                    background: 'rgba(200,162,76,0.1)', border: '1px solid rgba(200,162,76,0.25)',
                    color: '#C8A24C', fontSize: 11, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          PROFILE CARD — collapsible, stays at bottom
          ════════════════════════════════════════════════════ */}
      <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarPhoto} style={{ display: 'none' }} />
      <div className="mx-5 mb-3 stagger-child" style={{ transition: 'all 0.2s ease' }}>
        {/* Collapsed header row */}
        <div onClick={() => setProfileExpanded(p => !p)} style={{
          background: '#141414', border: '1px solid #1A1A1A',
          borderRadius: profileExpanded ? '16px 16px 0 0' : 16,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', transition: 'border-radius 0.2s ease',
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            <LevelWidget xp={memberXP} memberName={member?.name} memberBelt={member?.belt} size={72} profilePic={profilePic || undefined} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0' }} data-testid="text-member-name">{member?.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <BeltVisual belt={member?.belt || 'white'} />
              <span style={{ fontSize: 12, color: getBeltColor(member?.belt || 'white'), fontWeight: 600, textTransform: 'capitalize' }}>{member?.belt || 'White'} Belt</span>
            </div>
            {(() => {
              const xp = (member as any)?.totalPoints || 0;
              const { title } = getLevelFromXP(xp);
              const lvl = getActualLevel(xp);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#000', background: 'linear-gradient(135deg, #C8A24C, #FFD700)', padding: '1px 6px', borderRadius: 8, letterSpacing: '0.03em' }}>Lv {lvl}</div>
                  <span style={{ fontSize: 11, color: '#C8A24C', fontWeight: 600 }}>{title}</span>
                </div>
              );
            })()}
          </div>
          <ChevronDown size={16} style={{ color: '#444', transform: profileExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>

        {/* Expanded details */}
        {profileExpanded && (
          <div style={{ background: '#141414', border: '1px solid #1A1A1A', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '0 16px 16px' }}>
            <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Member since <span style={{ color: '#999' }}>{joinDate}</span></div>
              {member.phone && <div style={{ fontSize: 12, color: '#666' }}>Phone <span style={{ color: '#999' }}>{member.phone}</span></div>}
              {member.email && member.email !== member.name && <div style={{ fontSize: 12, color: '#666' }}>Email <span style={{ color: '#999' }}>{member.email}</span></div>}
              <button onClick={() => avatarFileRef.current?.click()} style={{ fontSize: 11, color: '#C8A24C', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}>Change Photo</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
              {hasFamily && (
                <button onClick={(e) => { e.stopPropagation(); setShowFamilySwitcher(!showFamilySwitcher); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                  style={{ backgroundColor: showFamilySwitcher ? "rgba(200,162,76,0.15)" : "#1A1A1A", color: showFamilySwitcher ? "#C8A24C" : "#999", border: showFamilySwitcher ? "1px solid rgba(200,162,76,0.3)" : "1px solid #222" }}
                  data-testid="button-family-switcher">
                  <Users size={13} /> Family
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); haptic(); setShowRankRequest(true); setRankBelt(member.belt || "white"); setRankStripes(0); setRankNote(""); setRankSent(false); }}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative", overflow: "visible" }} title="Tap to request a rank update">
                <BeltIcon belt={member.belt || "white"} stripes={0} width={72} style={{ filter: `drop-shadow(0 1px 6px ${getBeltColor(member.belt)}40)` }} />
                <span style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#C8A24C", border: "2px solid #141414", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </span>
              </button>
              <div style={{ flex: 1 }} />
              <a href="/#/account" style={{ fontSize: 12, color: '#C8A24C', fontWeight: 600, textDecoration: 'none' }}>Edit Profile →</a>
            </div>
            {hasFamily && showFamilySwitcher && (
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
                <p className="text-[10px] uppercase tracking-wider px-3 pt-2.5 pb-1.5 font-medium" style={{ color: "#555", backgroundColor: "#0D0D0D" }}>Switch Profile</p>
                {switchError && <p className="text-xs px-3 py-1.5" style={{ color: "#E05555", backgroundColor: "rgba(224,85,85,0.07)" }}>{switchError}</p>}
                {familyMembers.map((fm) => {
                  const isActive = fm.row === member.row;
                  const isLoading = switchingRow === fm.row;
                  return (
                    <button key={fm.row} onClick={(e) => { e.stopPropagation(); handleSwitchProfile(fm); }} disabled={!!switchingRow}
                      className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left"
                      style={{ backgroundColor: isActive ? "rgba(200,162,76,0.08)" : "#0D0D0D", borderTop: "1px solid #181818", opacity: switchingRow && !isLoading ? 0.5 : 1 }}>
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
            <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #1A1A1A" }}>
              <a href="/#/waiver" className="flex items-center gap-1.5 flex-1 text-xs" style={{ textDecoration: "none" }}>
                {member.waiverSigned ? <CheckCircle size={13} style={{ color: "#4CAF80", flexShrink: 0 }} /> : <FileText size={13} style={{ color: "#E08228", flexShrink: 0 }} />}
                <span style={{ color: member.waiverSigned ? "#4CAF80" : "#E08228" }}>{member.waiverSigned ? "Waiver signed" : "Sign waiver"}</span>
              </a>
              <a href="/#/waiver" className="flex items-center gap-1.5 flex-1 text-xs" style={{ textDecoration: "none" }}>
                {member.agreementSigned ? <CheckCircle size={13} style={{ color: "#4CAF80", flexShrink: 0 }} /> : <FileText size={13} style={{ color: "#E08228", flexShrink: 0 }} />}
                <span style={{ color: member.agreementSigned ? "#4CAF80" : "#E08228" }}>{member.agreementSigned ? "Agreement signed" : "Sign agreement"}</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Warning banners */}
      {hasWarnings && (
        <div className="mx-5 mb-4 space-y-2">
          {!member.waiverSigned && <WarningBanner text="Liability waiver not signed" action="Sign Now" href="/#/waiver" />}
          {!member.agreementSigned && <WarningBanner text="Membership agreement not signed" action="Sign Now" href="/#/waiver" />}
        </div>
      )}

      {/* Pinned Announcement */}
      {pinnedAnnouncement && (
        <div className="mx-5 mb-4 stagger-child">
          <div style={{ background: '#111', borderRadius: 14, border: '1px solid #1A1A1A', padding: '12px 14px', borderLeft: '3px solid #C8A24C' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#C8A24C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <MegaphoneIcon size={11} color="#C8A24C" aria-hidden="true" />
                Announcement
              </div>
            <div style={{ fontSize: 13, color: '#CCC', lineHeight: 1.5 }}>{pinnedAnnouncement.message}</div>
          </div>
        </div>
      )}

      {/* M5: Tournament Countdown (near-term) */}
      {tournamentData && daysUntilTournament !== null && daysUntilTournament <= 30 && !nextTournament && (
        <div style={{ margin: '0 20px 12px', background: '#0D0D0D', border: '1px solid #C8A24C25', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, color: '#C8A24C', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Next Tournament</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0', marginTop: 2 }}>{tournamentData.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700' }}>{daysUntilTournament}</div>
              <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase' }}>Days Out</div>
            </div>
          </div>
        </div>
      )}

      {/* Rank request modal */}
      {showRankRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeInOverlay 0.25s ease-out', touchAction: 'none' as any }} onTouchMove={e => e.stopPropagation()}>
          <div style={{ width: '100%', maxWidth: 480, background: '#0F0F0F', borderRadius: '24px 24px 0 0', padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto', touchAction: 'pan-y' as any }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F0F0F0', margin: 0 }}>Request Belt Update</h2>
              <button onClick={() => setShowRankRequest(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>✕</button>
            </div>
            {rankSent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><AchievedIcon size={40} color="#C8A24C" /></div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#C8A24C', marginBottom: 8 }}>Request Sent!</div>
                <div style={{ fontSize: 13, color: '#888' }}>Your coach will review and confirm the update.</div>
                <button onClick={() => setShowRankRequest(false)} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, background: '#C8A24C', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Belt</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                  {ADULT_BELT_OPTIONS.map((b) => (
                    <button key={b} onClick={() => setRankBelt(b)}
                      style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${rankBelt === b ? "#C8A24C" : "#222"}`, background: rankBelt === b ? "rgba(200,162,76,0.15)" : "#111", color: rankBelt === b ? "#C8A24C" : "#888", fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>
                      {b}
                    </button>
                  ))}
                </div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Stripes</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[0, 1, 2, 3, 4].map((s) => (
                    <button key={s} onClick={() => setRankStripes(s)}
                      style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${rankStripes === s ? "#C8A24C" : "#222"}`, background: rankStripes === s ? "rgba(200,162,76,0.15)" : "#111", color: rankStripes === s ? "#C8A24C" : "#888", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#666", marginBottom: 8 }}>Note <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span></label>
                <textarea value={rankNote} onChange={e => setRankNote(e.target.value)}
                  placeholder="e.g. Competed at Houston Open, won gold…" rows={2}
                  style={{ width: "100%", backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F0F0F0", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 20, fontFamily: "inherit" }} />
                <button onClick={async () => {
                  haptic();
                  if (!rankBelt) return;
                  setRankSubmitting(true);
                  const today = new Date().toISOString().split("T")[0];
                  const result = await beltSavePromotion({ belt: rankBelt, stripes: rankStripes, date: today, note: rankNote });
                  setRankSubmitting(false);
                  if (result?.success) setRankSent(true);
                }} disabled={!rankBelt || rankSubmitting}
                  style={{ width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700, backgroundColor: rankBelt ? "#C8A24C" : "#1A1A1A", color: rankBelt ? "#0A0A0A" : "#444", border: "none", cursor: rankBelt ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: rankSubmitting ? 0.7 : 1 }}>
                  {rankSubmitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : "Submit for Coach Approval"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          RANK INFO MODAL — tap XP bar to open
          ════════════════════════════════════════════════════ */}
      {showRankInfo && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeInOverlay 0.2s ease-out', touchAction: 'none' as any }}
          onClick={() => setShowRankInfo(false)}
          onTouchMove={e => e.stopPropagation()}
        >
          <div
            style={{ width: '100%', maxWidth: 480, background: 'linear-gradient(180deg, #111108 0%, #0D0D0D 100%)', borderRadius: '24px 24px 0 0', padding: '0 0 max(32px, calc(env(safe-area-inset-bottom) + 32px))', maxHeight: '92vh', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any, animation: 'modalSlideUp 0.32s cubic-bezier(0.34,1.28,0.64,1)', touchAction: 'pan-y' as any }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '12px auto 0' }} />

            {/* Header */}
            <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C8A24C', marginBottom: 4 }}>Experience System</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F0F0F0' }}>Ranks & Levels</div>
              </div>
              <button onClick={() => setShowRankInfo(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #222', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: 16 }}>✕</button>
            </div>

            {/* Your current position */}
            {member && (() => {
              const lvl = getActualLevel(memberXP);
              const { title, progress, xpForNext } = getLevelFromXP(memberXP);
              const toNext = xpForNext - memberXP;
              return (
                <div style={{ margin: '16px 20px', background: 'linear-gradient(135deg, rgba(200,162,76,0.12), rgba(200,162,76,0.04))', border: '1px solid rgba(200,162,76,0.25)', borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFD700, #C8A24C 50%, #6B4A00)', boxShadow: '0 0 16px rgba(200,162,76,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#000', flexShrink: 0 }}>
                      {lvl}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0F0' }}>{title}</div>
                      <div style={{ fontSize: 11, color: '#C8A24C', marginTop: 2 }}>{memberXP.toLocaleString()} XP · {toNext.toLocaleString()} to next level</div>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#0A0A0A', overflow: 'hidden', border: '1px solid #1A1A1A' }}>
                    <div style={{ height: '100%', width: `${progress * 100}%`, background: 'linear-gradient(90deg, #C8A24C, #FFD700)', borderRadius: 4, transition: 'width 1s ease', boxShadow: '0 0 8px rgba(255,215,0,0.5)' }} />
                  </div>
                </div>
              );
            })()}

            {/* How to earn XP */}
            <div style={{ margin: '0 20px 20px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>How to Earn XP</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { icon: <GrapplingIcon size={18} />, label: 'Class Check-in', xp: '+10 XP', note: 'Per class' },
                  { icon: <FireIcon size={18} color="#F97316" />, label: 'Weekly Combo', xp: '+1 XP bonus', note: '3+ classes/week' },
                  { icon: <TrophyIcon size={18} color="#FFD700" />, label: 'Perfect Week', xp: '2× multiplier', note: '5+ classes' },
                  { icon: <TrophyIcon size={18} color="#A855F7" />, label: 'Legend Week', xp: '3× multiplier', note: '7 classes' },
                  { icon: <TrophyIcon size={18} color="#C8A24C" />, label: 'Tournament', xp: '+50 XP', note: 'Per event' },
                  { icon: <GoldMedalIcon size={18} />, label: 'Gold Medal', xp: '+150 XP', note: 'First place' },
                  { icon: <SilverMedalIcon size={18} />, label: 'Silver Medal', xp: '+100 XP', note: 'Second place' },
                  { icon: <AchievedIcon size={18} color="#C8A24C" />, label: 'Achievement', xp: '+25–100 XP', note: 'Varies' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A24C' }}>{item.xp}</div>
                      <div style={{ fontSize: 10, color: '#F0F0F0', fontWeight: 600 }}>{item.label}</div>
                      <div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>{item.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level milestones */}
            <div style={{ margin: '0 20px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>Level Milestones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {XP_LEVELS.map((lvlDef, idx) => {
                  const isCurrentBracket = memberXP >= lvlDef.xpRequired && (idx === XP_LEVELS.length - 1 || memberXP < XP_LEVELS[idx + 1].xpRequired);
                  const isUnlocked = memberXP >= lvlDef.xpRequired;
                  const tierColors: Record<number, string> = { 1: '#888', 5: '#C8A24C', 10: '#FFD700', 15: '#22D3EE', 20: '#60A5FA', 25: '#A78BFA', 30: '#F472B6', 40: '#F97316', 50: '#A855F7' };
                  const color = tierColors[lvlDef.level] || '#555';
                  return (
                    <div key={lvlDef.level} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                      background: isCurrentBracket ? 'rgba(200,162,76,0.1)' : 'transparent',
                      border: isCurrentBracket ? '1px solid rgba(200,162,76,0.25)' : '1px solid transparent',
                      opacity: isUnlocked ? 1 : 0.4,
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isUnlocked ? `radial-gradient(circle at 40% 35%, ${color}CC, ${color}55)` : '#1A1A1A', border: `1.5px solid ${isUnlocked ? color : '#2A2A2A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: isUnlocked ? '#000' : '#333', flexShrink: 0, boxShadow: isUnlocked ? `0 0 8px ${color}55` : 'none' }}>
                        {lvlDef.level}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isCurrentBracket ? '#F0F0F0' : isUnlocked ? '#CCC' : '#444' }}>{lvlDef.title}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>{lvlDef.xpRequired.toLocaleString()} XP required</div>
                      </div>
                      {isCurrentBracket && (
                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: '#C8A24C', background: 'rgba(200,162,76,0.15)', padding: '2px 7px', borderRadius: 999 }}>YOU</div>
                      )}
                      {!isCurrentBracket && isUnlocked && (
                        <div style={{ fontSize: 14, color: '#2A8A2A' }}>✓</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          STREAK & MULTIPLIER INFO MODAL — tap weekly widget
          ════════════════════════════════════════════════════ */}
      {showStreakInfo && (() => {
        const isActive = trainedCount >= 3;
        const streakTiers = [
          { days: 1, label: '1 Class', mult: '1×', desc: 'Base XP per class check-in', color: '#555', icon: <GrapplingIcon size={20} color="#555" /> },
          { days: 3, label: '3 Classes', mult: '1.5×', desc: 'On a Roll — combo bonus kicks in', color: '#F97316', icon: <FireIcon size={20} color="#F97316" /> },
          { days: 5, label: '5 Classes', mult: '2×', desc: 'Perfect Week — double all XP', color: '#FFD700', icon: <TrophyIcon size={20} color="#FFD700" /> },
          { days: 7, label: '7 Classes', mult: '3×', desc: 'Legendary — triple XP for the week', color: '#A855F7', icon: <TrophyIcon size={20} color="#A855F7" /> },
        ];
        return (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeInOverlay 0.2s ease-out', touchAction: 'none' as any }}
            onClick={() => setShowStreakInfo(false)}
            onTouchMove={(e: React.TouchEvent) => e.stopPropagation()}
          >
            <div
              style={{ width: '100%', maxWidth: 480, background: isActive ? (isEliteWeek ? 'linear-gradient(180deg, #120820, #0D0D0D)' : isPerfectWeek ? 'linear-gradient(180deg, #141008, #0D0D0D)' : 'linear-gradient(180deg, #110A04, #0D0D0D)') : 'linear-gradient(180deg, #111, #0D0D0D)', borderRadius: '24px 24px 0 0', padding: '0 0 max(32px, calc(env(safe-area-inset-bottom) + 32px))', maxHeight: '92vh', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' as any, animation: 'modalSlideUp 0.32s cubic-bezier(0.34,1.28,0.64,1)', touchAction: 'pan-y' as any }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '12px auto 0' }} />

              {/* Header */}
              <div style={{ padding: '18px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: isEliteWeek ? '#A855F7' : isPerfectWeek ? '#FFD700' : '#C8A24C', marginBottom: 4 }}>Weekly Training</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#F0F0F0' }}>Streaks & Multipliers</div>
                </div>
                <button onClick={() => setShowStreakInfo(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #222', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#888', fontSize: 16 }}>✕</button>
              </div>

              {/* Active multiplier hero — only when active */}
              {isActive && (
                <div style={{ margin: '16px 20px 0', borderRadius: 16, padding: '16px 18px', background: isEliteWeek ? 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(168,85,247,0.06))' : isPerfectWeek ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.04))' : 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.04))', border: `1px solid ${isEliteWeek ? 'rgba(168,85,247,0.4)' : isPerfectWeek ? 'rgba(255,215,0,0.35)' : 'rgba(249,115,22,0.35)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: isEliteWeek ? 'radial-gradient(circle at 35% 30%, #C084FC, #7C3AED)' : isPerfectWeek ? 'radial-gradient(circle at 35% 30%, #FFE566, #C8A24C)' : 'radial-gradient(circle at 35% 30%, #FFBB55, #C8520A)', boxShadow: isEliteWeek ? '0 0 20px rgba(168,85,247,0.8)' : isPerfectWeek ? '0 0 20px rgba(255,215,0,0.7)' : '0 0 20px rgba(249,115,22,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#000', flexShrink: 0, animation: 'activeMultiplierPulse 2s ease-in-out infinite' }}>
                      {isEliteWeek ? '3×' : isPerfectWeek ? '2×' : '1.5×'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: isEliteWeek ? '#C084FC' : isPerfectWeek ? '#FFD700' : '#F97316', letterSpacing: '0.04em' }}>
                        {isEliteWeek ? 'LEGENDARY WEEK ACTIVE' : isPerfectWeek ? 'PERFECT WEEK ACTIVE' : 'COMBO MULTIPLIER ACTIVE'}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                        {isEliteWeek ? `All XP this week is tripled. ${7 - trainedCount > 0 ? `${7 - trainedCount} more class${7 - trainedCount !== 1 ? 'es' : ''} to keep the streak.` : 'Maximum achieved — legendary week!'}`
                          : isPerfectWeek ? `All XP this week is doubled. ${7 - trainedCount > 0 ? `${7 - trainedCount} more class${7 - trainedCount !== 1 ? 'es' : ''} to hit legendary.` : '5 classes locked in!'}`
                          : `Bonus XP on every class. ${5 - trainedCount} more class${5 - trainedCount !== 1 ? 'es' : ''} for Perfect Week.`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* This week progress */}
              <div style={{ margin: '16px 20px 0' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>This Week — {trainedCount}/7 Classes</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const dotNum = i + 1;
                    const isTrained = i < trainedCount;
                    const isMile = [3, 5, 7].includes(dotNum);
                    const dotCol = dotNum === 7 ? '#A855F7' : dotNum === 5 ? '#FFD700' : '#C8A24C';
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', background: isTrained ? dotCol : '#1A1A1A', border: `2px solid ${isTrained ? dotCol : isMile ? dotCol + '44' : '#222'}`, boxShadow: isTrained ? `0 0 8px ${dotCol}66` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: isTrained ? '#000' : '#333', fontWeight: 800, transition: 'all 0.3s ease' }}>
                          {isTrained ? '✓' : ''}
                        </div>
                        {isMile && <div style={{ fontSize: 7, color: isTrained ? dotCol : dotCol + '55', fontWeight: 800 }}>{dotNum === 7 ? '3×' : dotNum === 5 ? '2×' : '1.5×'}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Multiplier tier cards */}
              <div style={{ margin: '0 20px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>Multiplier Tiers</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {streakTiers.map(tier => {
                    const isCurrentTier = (
                      tier.days === 1 ? trainedCount >= 1 && trainedCount < 3 :
                      tier.days === 3 ? trainedCount >= 3 && trainedCount < 5 :
                      tier.days === 5 ? trainedCount >= 5 && trainedCount < 7 :
                      trainedCount === 7
                    );
                    const isUnlocked = trainedCount >= tier.days;
                    return (
                      <div key={tier.days} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: isCurrentTier ? `rgba(${tier.color === '#F97316' ? '249,115,22' : tier.color === '#FFD700' ? '255,215,0' : tier.color === '#A855F7' ? '168,85,247' : '80,80,80'},0.1)` : '#111', border: `1.5px solid ${isCurrentTier ? tier.color + '55' : '#1A1A1A'}`, opacity: isUnlocked ? 1 : 0.45, transition: 'all 0.3s ease' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: isUnlocked ? `radial-gradient(circle at 35% 30%, ${tier.color}CC, ${tier.color}44)` : '#1A1A1A', border: `2px solid ${isUnlocked ? tier.color : '#2A2A2A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, boxShadow: isCurrentTier ? `0 0 14px ${tier.color}66` : 'none', animation: isCurrentTier ? 'activeMultiplierPulse 2s ease-in-out infinite' : undefined }}>
                          {tier.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: isUnlocked ? '#F0F0F0' : '#444' }}>{tier.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 900, color: tier.color, background: `${tier.color}18`, padding: '1px 7px', borderRadius: 999, border: `1px solid ${tier.color}33` }}>{tier.mult}</span>
                            {isCurrentTier && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', color: tier.color }}>ACTIVE</span>}
                          </div>
                          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{tier.desc}</div>
                        </div>
                        {isUnlocked && !isCurrentTier && <div style={{ fontSize: 14, color: '#2A8A2A' }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly streak context */}
              {streakCount > 0 && (
                <div style={{ margin: '16px 20px 0', padding: '12px 14px', borderRadius: 12, background: 'rgba(200,162,76,0.06)', border: '1px solid rgba(200,162,76,0.12)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#555', marginBottom: 6 }}>Monthly Streak</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#C8A24C', letterSpacing: '-0.02em' }}>{streakCount}</span>
                    <div>
                      <div style={{ fontSize: 12, color: '#F0F0F0', fontWeight: 600 }}>consecutive class months</div>
                      <div style={{ fontSize: 10, color: '#555' }}>Keep training to grow your streak</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Milestone Info Modal ─────────────────────────────────── */}
      {showMilestoneInfo && (
        <div
          onClick={() => setShowMilestoneInfo(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', animation: 'fadeInOverlay 0.2s ease', touchAction: 'none' as any }}
          onTouchMove={e => e.stopPropagation()}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '22px 22px 0 0', borderTop: '1px solid #222',
              maxHeight: '88vh', overflowY: 'auto', overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch' as any,
              touchAction: 'pan-y' as any,
              paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
              animation: 'modalSlideUp 0.28s cubic-bezier(0.32,0,0.12,1)',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '16px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><TrophyIcon size={20} color="#C8A24C" /> Milestones</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
                Milestones mark major moments in your journey. Each one represents real progress — sessions on the mat, consistency, and growth.
              </div>
              {(() => {
                const items: Array<{ icon: React.ReactNode; label: string; desc: string; xp: number; tag?: string }> = [
                  { icon: <GrapplingIcon size={28} />, label: 'First Class', desc: "Show up. That's the hardest part.", xp: 100 },
                  { icon: <FireIcon size={28} color="#F97316" />, label: '10 Classes', desc: "You've found your rhythm on the mat.", xp: 250 },
                  { icon: <BoltIcon size={28} color="#22D3EE" />, label: '25 Classes', desc: "Commitment is becoming habit.", xp: 500 },
                  { icon: <StarIcon size={28} color="#60A5FA" />, label: '50 Classes', desc: "You're building something real.", xp: 1000 },
                  { icon: <StarIcon size={28} color="#FFD700" />, label: '100 Classes', desc: "This is who you are now.", xp: 2500 },
                  { icon: <TrophyIcon size={28} color="#A855F7" />, label: '200 Classes', desc: "Elite. The mat is home.", xp: 5000 },
                  { icon: <TrophyIcon size={28} color="#F472B6" />, label: '365 Classes', desc: "A full year of dedication. Legendary.", xp: 10000 },
                  { icon: <AchievedIcon size={28} color="#C8A24C" />, label: 'First Stripe', desc: "Your coach sees your progress.", xp: 300 },
                  { icon: <GoldMedalIcon size={28} />, label: 'First Belt Promotion', desc: "A new chapter begins.", xp: 1500 },
                  { icon: <FireIcon size={28} color="#F97316" />, label: '7-Day Streak', desc: "Fire mode activated.", xp: 200 },
                  { icon: <BoltIcon size={28} color="#A855F7" />, label: '30-Day Streak', desc: "Paragon-level consistency.", xp: 1000 },
                  { icon: <ProfileRing tier="bronze" size={32}><div style={{ width: 26, height: 26, borderRadius: '50%', background: '#CD7F32' }} /></ProfileRing>, label: 'Bronze Portrait', desc: 'Unlock the bronze ring frame — reach Level 2.', xp: 0, tag: 'RING' },
                  { icon: <ProfileRing tier="silver" size={32}><div style={{ width: 26, height: 26, borderRadius: '50%', background: '#9CA3AF' }} /></ProfileRing>, label: 'Silver Portrait', desc: 'Double-ring silver frame — reach Level 5.', xp: 0, tag: 'RING' },
                  { icon: <ProfileRing tier="gold" size={32}><div style={{ width: 26, height: 26, borderRadius: '50%', background: '#C8A24C' }} /></ProfileRing>, label: 'Gold Portrait', desc: 'Gold crown ring — reach Level 10.', xp: 0, tag: 'RING' },
                  { icon: <ProfileRing tier="paragon" size={32}><div style={{ width: 26, height: 26, borderRadius: '50%', background: '#DC46DC' }} /></ProfileRing>, label: 'Paragon Portrait', desc: 'The animated paragon frame — reach Level 30. Rarest on the mat.', xp: 0, tag: 'RING' },
                ];
                return items.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 0',
                    borderBottom: i < items.length - 1 ? '1px solid #1A1A1A' : 'none',
                  }}>
                    <div style={{ width: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>{m.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{m.desc}</div>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 700,
                      color: m.tag ? '#DC46DC' : '#C8A24C',
                      background: m.tag ? 'rgba(220,70,220,0.1)' : 'rgba(200,162,76,0.1)',
                      border: `1px solid ${m.tag ? 'rgba(220,70,220,0.3)' : 'rgba(200,162,76,0.2)'}`,
                      borderRadius: 8, padding: '3px 8px', whiteSpace: 'nowrap',
                    }}>{m.tag ? m.tag : `+${m.xp.toLocaleString()} XP`}</div>
                  </div>
                ));
              })()}
              <button
                onClick={() => setShowMilestoneInfo(false)}
                style={{
                  marginTop: 20, width: '100%', padding: '13px',
                  borderRadius: 12, background: '#1A1A1A', border: '1px solid #2A2A2A',
                  color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Narrative / Weekly Stats Modal ───────────────────────── */}
      {showNarrativeInfo && (
        <div
          onClick={() => setShowNarrativeInfo(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', animation: 'fadeInOverlay 0.2s ease', touchAction: 'none' as any }}
          onTouchMove={e => e.stopPropagation()}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '22px 22px 0 0', borderTop: '1px solid #222',
              maxHeight: '88vh', overflowY: 'auto', overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch' as any,
              touchAction: 'pan-y' as any,
              paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
              animation: 'modalSlideUp 0.28s cubic-bezier(0.32,0,0.12,1)',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '16px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><ChartBarsIcon size={20} color="#C8A24C" /> Your Week</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>A snapshot of where you stand right now.</div>
              {[
                { label: 'Classes This Week', value: weeklyTraining().filter(Boolean).length, unit: 'classes', icon: <GrapplingIcon size={24} /> },
                { label: 'Current Streak', value: dailyStreakCount, unit: 'days', icon: dailyStreakTier === 'paragon' ? <BoltIcon size={24} color="#DC46DC" /> : dailyStreakTier === 'legend' ? <StarIcon size={24} color="#5A78FF" /> : dailyStreakTier === 'diamond' ? <StarIcon size={24} color="#22D3EE" /> : <FireIcon size={24} color="#F97316" /> },
                { label: 'Streak Tier', value: dailyStreakTier === 'paragon' ? 'Paragon' : dailyStreakTier === 'legend' ? 'Legend' : dailyStreakTier === 'diamond' ? 'Diamond' : dailyStreakTier === 'fire' ? 'Fire' : 'None', unit: '', icon: <TrophyIcon size={24} color="#C8A24C" /> },
                { label: 'XP This Week', value: weeklyTraining().filter(Boolean).length * 50, unit: 'XP', icon: <BoltIcon size={24} color="#C8A24C" /> },
              ].map((stat, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid #1A1A1A',
                  marginBottom: 10,
                }}>
                  <div style={{ width: 36, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{stat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', marginTop: 2 }}>
                      {stat.value}{stat.unit ? <span style={{ fontSize: 13, color: '#666', fontWeight: 500, marginLeft: 4 }}>{stat.unit}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
              {dailyStreakTier !== 'none' && (
                <div style={{
                  marginTop: 8, padding: '14px 16px', borderRadius: 14,
                  background: dailyStreakTier === 'paragon' ? 'rgba(220,70,220,0.08)' : dailyStreakTier === 'legend' ? 'rgba(90,120,255,0.08)' : dailyStreakTier === 'diamond' ? 'rgba(60,200,200,0.08)' : 'rgba(255,100,10,0.08)',
                  border: `1px solid ${dailyStreakTier === 'paragon' ? 'rgba(220,70,220,0.3)' : dailyStreakTier === 'legend' ? 'rgba(90,120,255,0.3)' : dailyStreakTier === 'diamond' ? 'rgba(60,200,200,0.3)' : 'rgba(255,100,10,0.3)'}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F0F0F0', display: 'flex', alignItems: 'center', gap: 6 }}><FireIcon size={13} /> Streak Power-Up Active</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    Your {dailyStreakCount}-day streak unlocks a {dailyStreakTier === 'paragon' ? '3×' : dailyStreakTier === 'legend' ? '2×' : dailyStreakTier === 'diamond' ? '1.75×' : '1.5×'} XP multiplier on all training sessions.
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowNarrativeInfo(false)}
                style={{
                  marginTop: 20, width: '100%', padding: '13px',
                  borderRadius: 12, background: '#1A1A1A', border: '1px solid #2A2A2A',
                  color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Technique Editor Modal ───────────────────────────────── */}
      {showTechniqueEditor && member?.isAdmin && (
        <div
          onClick={() => setShowTechniqueEditor(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', animation: 'fadeInOverlay 0.2s ease', touchAction: 'none' as any }}
          onTouchMove={e => e.stopPropagation()}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '22px 22px 0 0', borderTop: '1px solid #222',
              maxHeight: '90vh', overflowY: 'auto', overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch' as any,
              touchAction: 'pan-y' as any,
              paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
              animation: 'modalSlideUp 0.28s cubic-bezier(0.32,0,0.12,1)',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '16px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4 }}>✏️ Set Technique of the Day</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Choose from the preset list or write your own custom technique.</div>

              {/* Custom entry */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Custom Technique</div>
                <input
                  value={techniqueCustomName}
                  onChange={e => setTechniqueCustomName(e.target.value)}
                  placeholder="Technique name (e.g. Inside Heel Hook)"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: '#1A1A1A', border: '1px solid #2A2A2A',
                    color: '#F0F0F0', fontSize: 14, outline: 'none',
                    marginBottom: 10, boxSizing: 'border-box' as any,
                  }}
                />
                <input
                  value={techniqueCustomTip}
                  onChange={e => setTechniqueCustomTip(e.target.value)}
                  placeholder="Coach tip (e.g. Control the outside first)"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: '#1A1A1A', border: '1px solid #2A2A2A',
                    color: '#F0F0F0', fontSize: 14, outline: 'none',
                    marginBottom: 10, boxSizing: 'border-box' as any,
                  }}
                />
                <select
                  value={techniqueCustomCat}
                  onChange={e => setTechniqueCustomCat(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: '#1A1A1A', border: '1px solid #2A2A2A',
                    color: '#F0F0F0', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box' as any, appearance: 'none' as any,
                  }}
                >
                  {['Submissions', 'Guard', 'Passing', 'Sweeps', 'Takedowns', 'Escapes', 'Leg Locks', 'Custom'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button
                  disabled={!techniqueCustomName.trim()}
                  onClick={() => {
                    if (!techniqueCustomName.trim()) return;
                    const val = JSON.stringify({ name: techniqueCustomName.trim(), tip: techniqueCustomTip.trim() || 'Focus on precision.', category: techniqueCustomCat });
                    try { localStorage.setItem('lbjj_technique_override', val); } catch {}
                    setTechniqueOverride(val);
                    setTechniqueCustomName(''); setTechniqueCustomTip(''); setTechniqueCustomCat('Custom');
                    setShowTechniqueEditor(false);
                  }}
                  style={{
                    marginTop: 10, width: '100%', padding: '13px',
                    borderRadius: 12,
                    background: techniqueCustomName.trim() ? 'rgba(200,162,76,0.15)' : '#1A1A1A',
                    border: `1px solid ${techniqueCustomName.trim() ? 'rgba(200,162,76,0.4)' : '#2A2A2A'}`,
                    color: techniqueCustomName.trim() ? '#C8A24C' : '#555',
                    fontSize: 14, fontWeight: 700, cursor: techniqueCustomName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >Set Custom Technique</button>
              </div>

              {/* Preset picker */}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>— Or Pick a Preset —</div>
              {[
                { name: 'Double Leg Takedown', category: 'Takedowns', tip: 'Level change fast, drive through the hips.' },
                { name: 'Armbar from Guard', category: 'Submissions', tip: 'Hip out, control the arm tight to your chest.' },
                { name: 'Rear Naked Choke', category: 'Submissions', tip: 'Seat belt grip first, sink the hook before the choke.' },
                { name: 'Triangle Choke', category: 'Submissions', tip: 'Cut the angle 45 degrees before squeezing.' },
                { name: 'Butterfly Guard Sweep', category: 'Sweeps', tip: 'Break their posture down before the lift.' },
                { name: 'Knee Slice Pass', category: 'Passing', tip: 'Chest heavy, hip switch at the moment of pass.' },
                { name: 'Guillotine Choke', category: 'Submissions', tip: 'Hips in, pull up, not out.' },
                { name: 'Spider Guard Control', category: 'Guard', tip: 'Maintain frames, use legs as pistons.' },
                { name: 'Half Guard Sweep', category: 'Sweeps', tip: 'Get the underhook before you go to your knees.' },
                { name: 'Bow and Arrow Choke', category: 'Submissions', tip: 'Control the collar deep, far leg for the finish.' },
                { name: 'De La Riva Hook', category: 'Guard', tip: 'DLR hook on the outside of the knee, not the ankle.' },
                { name: 'Leg Lock Entry', category: 'Leg Locks', tip: 'Get the outside position before the heel hook.' },
                { name: 'Kimura Trap', category: 'Submissions', tip: 'Control the wrist, shoulder up first.' },
                { name: 'X-Guard Sweep', category: 'Sweeps', tip: 'Extend both legs together to break their base.' },
                { name: 'Omoplata', category: 'Submissions', tip: 'Hip escape to prevent roll, sit up to finish.' },
                { name: 'Berimbolo', category: 'Guard', tip: 'Invert tight, get the back before they can react.' },
                { name: 'Torreando Pass', category: 'Passing', tip: 'Control both pants, step around, dont step in.' },
                { name: 'Arm Drag to Back', category: 'Takedowns', tip: 'Pull the arm, step behind in the same motion.' },
                { name: 'North South Escape', category: 'Escapes', tip: 'Bridge and shrimp simultaneously, not sequentially.' },
                { name: 'Single Leg X Guard', category: 'Guard', tip: 'Keep the knee shield active until you establish X.' },
                { name: 'Uchi Mata', category: 'Takedowns', tip: 'Kuzushi first — break their balance before the lift.' },
                { name: 'Clock Choke', category: 'Submissions', tip: 'Walk feet toward their head to tighten the choke.' },
              ].map((t, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const val = JSON.stringify(t);
                    try { localStorage.setItem('lbjj_technique_override', val); } catch {}
                    setTechniqueOverride(val);
                    setShowTechniqueEditor(false);
                  }}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A1A',
                    color: '#F0F0F0', fontSize: 13, textAlign: 'left' as any,
                    cursor: 'pointer', marginBottom: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{t.name}</span>
                  <span style={{ fontSize: 10, color: '#555', background: '#1A1A1A', borderRadius: 6, padding: '2px 7px' }}>{t.category}</span>
                </button>
              ))}
              {techniqueOverride && (
                <button
                  onClick={() => {
                    try { localStorage.removeItem('lbjj_technique_override'); } catch {}
                    setTechniqueOverride(null);
                    setShowTechniqueEditor(false);
                  }}
                  style={{
                    marginTop: 8, width: '100%', padding: '13px',
                    borderRadius: 12, background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.2)',
                    color: '#E05555', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >Reset to Daily Auto-Rotation</button>
              )}
              <button
                onClick={() => setShowTechniqueEditor(false)}
                style={{
                  marginTop: 10, width: '100%', padding: '13px',
                  borderRadius: 12, background: '#1A1A1A', border: '1px solid #2A2A2A',
                  color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Week Stats Modal ───────────────────────── */}
      {showWeekStats && (
        <div
          onClick={() => setShowWeekStats(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', animation: 'fadeInOverlay 0.2s ease' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '22px 22px 0 0', borderTop: '1px solid #222',
              maxHeight: '88vh', overflowY: 'auto',
              paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
              animation: 'modalSlideUp 0.28s cubic-bezier(0.32,0,0.12,1)',
              zIndex: 1201,
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '16px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><ChartBarsIcon size={20} color="#C8A24C" /> Your Week</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>A snapshot of where you stand right now.</div>
              {[
                { label: 'Classes This Week', value: weekDots.filter(d => d.trained).length, unit: 'classes', icon: <GrapplingIcon size={24} /> },
                { label: 'Current Streak', value: dailyStreakCount, unit: 'days', icon: <FireIcon size={24} color="#F97316" /> },
                { label: 'XP This Week', value: weekDots.filter(d => d.trained).length * 50, unit: 'XP', icon: <BoltIcon size={24} color="#C8A24C" /> },
                { label: 'Week Multiplier', value: isEliteWeek ? '3×' : isPerfectWeek ? '2×' : trainedCount >= 3 ? '1.5×' : '1×', unit: '', icon: <TrophyIcon size={24} color="#C8A24C" /> },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid #1A1A1A', marginBottom: 10 }}>
                  <div style={{ width: 36, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', marginTop: 2 }}>
                      {s.value}{s.unit ? <span style={{ fontSize: 13, color: '#666', fontWeight: 500, marginLeft: 4 }}>{s.unit}</span> : null}
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setShowWeekStats(false)} style={{ marginTop: 20, width: '100%', padding: '13px', borderRadius: 12, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Game Day Info Modal ───────────────────────── */}
      {showGameDayInfo && (
        <div
          onClick={() => setShowGameDayInfo(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', animation: 'fadeInOverlay 0.2s ease' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '22px 22px 0 0', borderTop: '1px solid #222',
              maxHeight: '80vh', overflowY: 'auto',
              paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
              animation: 'modalSlideUp 0.28s cubic-bezier(0.32,0,0.12,1)',
              zIndex: 1201,
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '16px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F0F0F0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><SwordsIcon size={22} color="#C8A24C" /> Game Day</div>
              <div style={{ fontSize: 14, color: '#888', lineHeight: 1.55, marginBottom: 22 }}>
                Today there's a BJJ chess game session scheduled. Show up, play your positions, earn bonus XP. Win matches to climb the game leaderboard.
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C8A24C', letterSpacing: '0.12em', marginBottom: 10, textTransform: 'uppercase' }}>XP Breakdown</div>
              {[
                { label: 'Check in for a class', xp: '+10 XP' },
                { label: 'Win a match', xp: '+25 XP' },
                { label: 'Win a tournament', xp: '+150 XP' },
              ].map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'rgba(200,162,76,0.06)', border: '1px solid rgba(200,162,76,0.15)', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, color: '#F0F0F0', fontWeight: 600 }}>{b.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#C8A24C' }}>{b.xp}</div>
                </div>
              ))}
              <button onClick={() => setShowGameDayInfo(false)} style={{ marginTop: 18, width: '100%', padding: '13px', borderRadius: 12, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Season Modal ───────────────────────── */}
      {showSeasonModal && trainingSeasonData && (
        <div
          onClick={() => setShowSeasonModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'flex-end', animation: 'fadeInOverlay 0.2s ease' }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '22px 22px 0 0', borderTop: '1px solid #222',
              maxHeight: '85vh', overflowY: 'auto',
              paddingBottom: 'max(32px, calc(env(safe-area-inset-bottom, 0px) + 32px))',
              animation: 'modalSlideUp 0.28s cubic-bezier(0.32,0,0.12,1)',
              zIndex: 1201,
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '16px auto 20px' }} />
            <div style={{ padding: '0 20px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarSparkIcon size={20} color="#C8A24C" /> {trainingSeasonData.monthName} Season
              </div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Monthly class goal progress and tier rewards.</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: '#1A1A1A', borderRadius: 14 }}>
                <svg width={64} height={64} viewBox="0 0 64 64">
                  <circle cx={32} cy={32} r={26} fill="none" stroke="#1E1E1E" strokeWidth={6} />
                  <circle cx={32} cy={32} r={26} fill="none" stroke="#C8A24C" strokeWidth={6}
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - trainingSeasonData.progress)}`}
                    strokeLinecap="round" transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                  <text x={32} y={36} textAnchor="middle" fill="#C8A24C" fontSize={14} fontWeight={800}>{trainingSeasonData.thisMonthClasses}</text>
                </svg>
                <div>
                  <div style={{ fontSize: 13, color: '#888' }}>Classes this month</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#F0F0F0' }}>
                    {trainingSeasonData.thisMonthClasses} <span style={{ fontSize: 14, color: '#444' }}>/ {trainingSeasonData.goalClasses}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#C8A24C', marginTop: 4 }}>{Math.round(trainingSeasonData.progress * 100)}% of monthly goal</div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Season Goals</div>
              {[
                { classes: 4,  label: 'Active',     xp: 50,  color: '#22D3EE' },
                { classes: 8,  label: 'Consistent', xp: 150, color: '#60A5FA' },
                { classes: 12, label: 'Dedicated',  xp: 300, color: '#C8A24C' },
                { classes: 16, label: 'Elite',      xp: 500, color: '#F472B6' },
                { classes: 20, label: 'Warrior',    xp: 800, color: '#A855F7' },
              ].map(t => {
                const done = trainingSeasonData.thisMonthClasses >= t.classes;
                return (
                  <div key={t.classes} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1A1A1A' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: done ? `${t.color}22` : '#1A1A1A',
                      border: `1px solid ${done ? t.color : '#222'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <span style={{ fontSize: 11, fontWeight: 700, color: '#333' }}>{t.classes}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: done ? '#F0F0F0' : '#555' }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: done ? t.color : '#333' }}>{t.classes} classes</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: done ? '#C8A24C' : '#333', background: 'rgba(200,162,76,0.08)', padding: '3px 8px', borderRadius: 8 }}>+{t.xp} XP</div>
                  </div>
                );
              })}
              <button onClick={() => setShowSeasonModal(false)} style={{ marginTop: 20, width: '100%', padding: '13px', borderRadius: 12, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
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

