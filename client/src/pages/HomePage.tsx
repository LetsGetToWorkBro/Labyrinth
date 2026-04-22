import { FireIcon, CheckCircleFilledIcon, CalendarSparkIcon, BoltIcon, GoldMedalIcon, SilverMedalIcon, ShieldIcon, GrapplingIcon, ClockCountdownIcon, ShieldFreezeIcon, GiIcon } from "@/components/icons/LbjjIcons";
import { useAuth } from "@/lib/auth-context";
import type { FamilyMember, PaymentCard } from "@/lib/api";
import { beltSavePromotion, gasCall, getLeaderboard, getLeaderboardFresh, getMemberData, cachedGasCall, saveMemberStats, syncAchievements } from "@/lib/api";
import { BeltIcon } from "@/components/BeltIcon";
import { ADULT_BELT_OPTIONS } from "@/components/BeltIcon";
import { getBeltColor, CLASS_SCHEDULE } from "@/lib/constants";
import { chatGetChannels, fetchCSV, parseCSV, CSV_ENDPOINTS, getPinnedAnnouncement, type PinnedAnnouncement } from "@/lib/api";
import { ALL_ACHIEVEMENTS, checkAndUnlockAchievements } from "@/lib/achievements";
import { ScreenHeader } from "@/components/ScreenHeader";
import { validateGeoIfRequired } from "@/lib/geo";
import { LevelWidget } from "@/components/LevelWidget";
import { ProfileRing } from "@/components/ProfileRing";
import { StreakWidget, StreakInfoPanel } from "@/components/StreakWidget";
import { XPWidget, XPInfoPanel } from "@/components/XPWidget";
import { CheckInWidget } from "@/components/CheckInWidget";
import { ParagonRing } from "@/components/ParagonRing";
import { StatsCards } from "@/components/StatsCards";
import { SeasonMilestoneWidgets } from "@/components/SeasonMilestoneWidgets";
import { LiveStreamBanner } from "@/components/LiveStreamBanner";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { TournamentWidget } from "@/components/TournamentWidget";
import { getLevelFromXP, getActualLevel, XP_LEVELS } from "@/lib/xp";
import {
  CreditCard, FileText, ChevronRight, ChevronDown, LogOut,
  Users, Check, Loader2, Plus, Trash2, Star, CheckCircle,
  Trophy, Swords, Sword, Lock, BarChart2, Megaphone, CheckCircle2, AlertTriangle, Sun, Moon,
} from "lucide-react";
import {
  memberGetCards, memberSetDefaultCard, memberRemoveCard,
  memberAddCard, memberCreateSetupLink,
} from "@/lib/api";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
  const [isPulling, setIsPulling] = useState(false);
  const [pullDone, setPullDone] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
      // Notify TopHeader + other listeners immediately
      try { window.dispatchEvent(new CustomEvent('pfp-updated')); } catch {}
      // Sync to GAS so photo persists across devices/sessions
      try {
        const memberEmail = member?.email || '';
        const token = localStorage.getItem('lbjj_session_token') || '';
        if (memberEmail && token) {
          gasCall('updateMemberProfileApp', {
            token,
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
  const [prevPositions] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('lbjj_lb_positions_v1') || '{}'); } catch { return {}; }
  });

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
  // Increments whenever checkin-complete fires — forces streak/weekDots recompute
  const [checkinTick, setCheckinTick] = useState(0);
  useEffect(() => {
    const handler = () => {
      // Also update lbjj_checkin_history with today
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const hist: string[] = JSON.parse(localStorage.getItem('lbjj_checkin_history') || '[]');
        if (!hist.includes(todayStr)) {
          hist.push(todayStr);
          localStorage.setItem('lbjj_checkin_history', JSON.stringify(hist));
        }
      } catch {}
      setCheckinTick(t => t + 1);
    };
    window.addEventListener('checkin-complete', handler);
    return () => window.removeEventListener('checkin-complete', handler);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  void checkinTick; // consumed to force re-render

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
  // Season (monthly) total check-in count — increments on every check-in, not just unique days
  const [seasonClasses, setSeasonClasses] = useState<number>(() => {
    try {
      const ym = new Date().toISOString().slice(0, 7);
      const key = `lbjj_season_count_${ym}`;
      return parseInt(localStorage.getItem(key) || '0', 10);
    } catch { return 0; }
  });
  const [memberXP, setMemberXP] = useState<number>(() => {
    try {
      const stats = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      // Use highest of all three sources: stats.xp, stats.totalXP, member.totalPoints
      return Math.max(stats.xp || 0, stats.totalXP || 0, (member as any)?.totalPoints || 0);
    } catch { return (member as any)?.totalPoints || 0; }
  });

  // ─── Total classes count-up animation ─────────────────────────
  // Keep memberXP live — re-read from cache whenever xp-updated fires
  useEffect(() => {
    const syncXP = () => {
      try {
        const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        const cached = Math.max(s.xp || 0, s.totalXP || 0, (member as any)?.totalPoints || 0);
        // Ensure both xp and totalXP fields are consistent
        if (s.xp !== cached || s.totalXP !== cached) {
          s.xp = cached; s.totalXP = cached;
          try { localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(s)); } catch {}
        }
        setMemberXP(cached);
        // Also patch the leaderboard widget so the current user's level stays in sync
        if (member?.name) {
          setLeaderboard(prev => {
            const myName = member.name;
            const hasMe = prev.some(e => e.isMe || e.name === myName);
            if (!hasMe) return prev;
            const updated = prev.map(e =>
              (e.isMe || e.name === myName)
                ? { ...e, totalPoints: cached, score: cached }
                : e
            );
            // Re-sort by totalPoints desc
            return [...updated].sort((a: any, b: any) => (b.totalPoints || b.score || 0) - (a.totalPoints || a.score || 0) || a.name.localeCompare(b.name));
          });
        }
      } catch {}
    };
    window.addEventListener('xp-updated', syncXP);
    window.addEventListener('checkin-complete', syncXP);
    return () => { window.removeEventListener('xp-updated', syncXP); window.removeEventListener('checkin-complete', syncXP); };
  }, [member]);

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
      const gasStreak = (member as any)?.currentStreak || 0;
      // Read current local XP — never clobber it if it's higher than GAS data
      const localStats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
      const localXP = Math.max(localStats.xp || 0, localStats.totalXP || 0);
      const derivedXP = Math.max(gasXP, realTotal * 10, localXP);
      if (realTotal > 0 || gasXP > 0 || localXP > 0) {
        setTotalClasses(realTotal);
        setMemberXP(derivedXP);
      }
      // Fire xp-updated so TopHeader, XPWidget etc. re-sync
      try { window.dispatchEvent(new CustomEvent('xp-updated')); } catch {}
      try {
        const stats = { ...localStats };
        stats.classesAttended = realTotal;
        stats.totalXP = derivedXP;
        // Always keep stats.xp up to date with the highest known value
        stats.xp = derivedXP;
        // Persist streak so it survives across sessions even if GAS is slow
        if (gasStreak > 0) stats.currentStreak = gasStreak;
        localStorage.setItem('lbjj_game_stats_v2', JSON.stringify(stats));
        // Also cache the streak separately for fast reads
        if (gasStreak > 0) localStorage.setItem('lbjj_streak_cache', String(gasStreak));
      } catch {}
      // Today's count + dedup — use UNIQUE class names only
      const today = new Date().toISOString().split('T')[0];
      const todayCheckIns = allCheckIns.filter((c: any) => (c.date || c.timestamp || '').startsWith(today));
      // Deduplicate by class name so double-header / savage only counts distinct classes
      const todayClassNames = todayCheckIns.map((c: any) => c.className || c.class || '').filter(Boolean);
      const todayClassesUnique = Array.from(new Set(todayClassNames)) as string[];
      if (todayClassesUnique.length > 0) {
        setClassesToday(todayClassesUnique.length);
        localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: todayClassesUnique.length }));
        setCheckedInClasses((prev: string[]) => Array.from(new Set([...prev, ...todayClassesUnique])));
      } else if (todayCheckIns.length > 0) {
        // Fallback: no className field, count raw records
        setClassesToday(todayCheckIns.length);
        localStorage.setItem('lbjj_checkins_today', JSON.stringify({ date: today, count: todayCheckIns.length }));
      }
      // Backfill season (monthly) count from API check-ins — only if local key is missing/zero
      try {
        const ym = new Date().toISOString().slice(0, 7);
        const seasonKey = `lbjj_season_count_${ym}`;
        const storedSeasonCount = parseInt(localStorage.getItem(seasonKey) || '0', 10);
        const apiSeasonCount = allCheckIns.filter((c: any) => {
          const d = (c.date || c.timestamp || '').split('T')[0];
          return d.startsWith(ym);
        }).length;
        if (apiSeasonCount > storedSeasonCount) {
          localStorage.setItem(seasonKey, String(apiSeasonCount));
          setSeasonClasses(apiSeasonCount);
        }
      } catch {}
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
      // Notify TopHeader and any other listeners of XP change
      try { window.dispatchEvent(new CustomEvent('xp-updated')); } catch {}
    } catch {}
    setTotalClasses(prev => prev + 1);
    // Increment season counter
    setSeasonClasses(prev => {
      const ym = new Date().toISOString().slice(0, 7);
      const key = `lbjj_season_count_${ym}`;
      const next = prev + 1;
      try { localStorage.setItem(key, String(next)); } catch {}
      return next;
    });

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
      // totalPoints = XP from stats (used for level calculation)
      const currentXP = (() => { try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp || 0, s.totalXP || 0, (memberProfile as any)?.totalPoints || 0); } catch { return 0; } })();
      const updated = existing
        ? prev.map((e: any) => e.name === myName || e.isMe
            ? { ...e, classCount: newCount, totalPoints: currentXP, score: currentXP, isMe: true }
            : e)
        : [...prev, { name: myName, belt: myBelt, classCount: newCount, totalPoints: currentXP, score: currentXP, isMe: true, rank: prev.length + 1 }];
      // Re-sort by totalPoints/score desc
      const sorted = [...updated].sort((a: any, b: any) => (b.totalPoints || b.score || 0) - (a.totalPoints || a.score || 0) || a.name.localeCompare(b.name));
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
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<PinnedAnnouncement | null>(null);

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
      const yearMonth = now.toISOString().slice(0, 7);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dayOfMonth = now.getDate();
      // Use reactive seasonClasses state (increments on every check-in)
      const thisMonthClasses = seasonClasses;
      const goalClasses = 20;
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
        { key: 'ten_classes', label: 'Mat Initiate', need: Math.max(0, 10 - classes), unit: 'classes', icon: <GrapplingIcon size={16} color="#C8A24C" /> },
        { key: 'thirty_classes', label: 'Mat Warrior', need: Math.max(0, 30 - classes), unit: 'classes', icon: <Swords size={16} color="#C8A24C" /> },
        { key: 'hundred_classes', label: 'Century Club', need: Math.max(0, 100 - classes), unit: 'classes', icon: <Trophy size={16} color="#C8A24C" /> },
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
    <div
      ref={scrollContainerRef}
      className={`app-content home-page-bg${isGameDay ? ' home-page-bg--gameday' : isFlowState ? ' home-page-bg--flow' : ''}`}
      style={{ minHeight: '100dvh' }}
      onTouchStart={(e) => {
        // Only trigger pull-to-refresh when the scroll container itself is at the top
        const el = scrollContainerRef.current;
        if (el && el.scrollTop === 0) pullStartY.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (pullStartY.current > 0) {
          const delta = e.touches[0].clientY - pullStartY.current;
          if (delta > 0 && delta < 120) setPullY(delta);
        }
      }}
      onTouchEnd={() => {
        if (pullY > 72) {
          setIsPulling(true);
          // Soft refresh: reload data without blowing away the whole page
          Promise.all([
            refreshProfile().catch(() => {}),
          ]).finally(() => {
            setIsPulling(false);
            setPullDone(true);
            setPullY(80);
            setTimeout(() => { setPullY(0); setPullDone(false); }, 800);
          });
        } else {
          setPullY(0);
        }
        pullStartY.current = 0;
      }}
    >
      {(pullY > 0 || isPulling) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: Math.min(pullY, 60),
          background: 'transparent',
          pointerEvents: 'none',
          transition: 'height 300ms ease',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: pullDone ? 'rgba(76,175,128,0.15)' : '#1A1A1A',
            border: `1px solid ${pullDone ? 'rgba(76,175,128,0.5)' : 'rgba(200,162,76,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: isPulling ? 'rotate(360deg)' : pullDone ? 'scale(1.1)' : `rotate(${Math.min(pullY / 72, 1) * 180}deg)`,
            transition: 'transform 400ms ease, background 200ms ease, border-color 200ms ease',
            opacity: Math.min(pullY / 40, 1),
          }}>
            {pullDone
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : isPulling
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            }
          </div>
        </div>
      )}
      <ScreenHeader
        title="Home"
        right={
          <button onClick={logout} className="p-2 rounded-lg transition-colors" style={{ color: "#666" }} data-testid="button-logout" aria-label="Sign out">
            <LogOut size={18} />
          </button>
        }
      />

      {/* Live Stream Banner — slides in from top when a class goes live */}
      <LiveStreamBanner stream={stream} />

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
          <AnnouncementCard announcement={pinnedAnnouncement} />
        </div>
      )}

      {/* M5: Tournament Countdown (near-term, cached) */}
      {tournamentData && daysUntilTournament !== null && daysUntilTournament <= 30 && !nextTournament && (
        <div className="mx-5 mb-3">
          <TournamentWidget
            name={tournamentData.name}
            date={tournamentData.date}
            location={tournamentData.location}
            link={tournamentData.link}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          SEASON + MILESTONE WIDGETS
          ════════════════════════════════════════════════════ */}
      {trainingSeasonData && nextMilestoneData && (
        <SeasonMilestoneWidgets
          season={{
            thisMonthClasses: trainingSeasonData.thisMonthClasses,
            goalClasses: trainingSeasonData.goalClasses,
            progress: trainingSeasonData.progress,
            monthName: trainingSeasonData.monthName,
          }}
          milestone={{
            label: nextMilestoneData.label,
            xpNeeded: Math.max(0, nextMilestoneData.need),
            ready: nextMilestoneData.need <= 0,
          }}
          onOpenSeason={() => { window.location.hash = '#/season'; }}
          onOpenMilestone={() => setShowRankInfo(true)}
        />
      )}

      {/* ════════════════════════════════════════════════════
          NEXT CLASS / GAME DAY CARD
          ════════════════════════════════════════════════════ */}
      {nextClass && (
        <CheckInWidget
          nextClass={nextClass}
          classesToday={classesToday}
          timeUntilClass={timeUntilClass}
          checkinPhase={checkinPhase}
          alreadyCheckedIn={checkedInClasses.includes(nextClass.name || '')}
          isGameDay={isGameDay}
          onCheckIn={() => handleHomeCheckIn(nextClass)}
          onOpenSchedule={() => { window.location.hash = '#/schedule'; }}
        />
      )}

      {/* ════════════════════════════════════════════════════
          STATS ROW — Streak + Total classes
          ════════════════════════════════════════════════════ */}
      <StatsCards
        streak={effectiveStreak}
        totalClasses={totalClasses}
        classesToday={classesToday}
        comboMultiplier={comboMultiplier}
        streakFreezeActive={streakFreezeActive}
      />

      {/* ════════════════════════════════════════════════════
          WEEKLY XP MULTIPLIER WIDGET
          ════════════════════════════════════════════════════ */}
      <StreakWidget
        dailyStreakCount={dailyStreakCount}
        weekDots={weekDots}
        trainedCount={trainedCount}
        comboMultiplier={comboMultiplier}
        onOpenInfo={() => setShowStreakInfo(true)}
        onCheckIn={() => handleHomeCheckIn(nextClass)}
      />

      {/* ════════════════════════════════════════════════════
          XP PROGRESS WIDGET
          ════════════════════════════════════════════════════ */}
      {member && (
        <XPWidget
          xp={memberXP}
          memberName={member.name}
          onOpenInfo={() => setShowRankInfo(true)}
        />
      )}

      {/* ════════════════════════════════════════════════════
          SOCIAL PRESSURE STRIP — Gym activity + Rival
          ════════════════════════════════════════════════════ */}
      {leaderboard.length > 0 && (
        <div className="mx-5 mb-4 stagger-child">
          <div
            style={{
              background: 'linear-gradient(145deg,#0a0908 0%,#000 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 24,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 24px 48px -12px rgba(0,0,0,1)',
              position: 'relative',
            }}
            onClick={() => { window.location.hash = '#/leaderboard'; }}
          >
            {/* Top glow */}
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'100%', height:60, background:'radial-gradient(ellipse at top, rgba(232,175,52,0.1) 0%, transparent 70%)', opacity:0.6, pointerEvents:'none' }} />

            {/* Header */}
            <div style={{ padding:'16px 20px 12px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.04)', position:'relative', zIndex:2 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8af34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontFamily:'var(--font-display,system-ui)', fontSize:13, fontWeight:800, color:'#e8af34', letterSpacing:'0.1em', textTransform:'uppercase' }}>Leaderboard</span>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:'#a8a29e', display:'flex', alignItems:'center', gap:4 }}>
                View All
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </div>
            </div>

            {/* Rows */}
            <div style={{ position:'relative', zIndex:2 }}>
              {leaderboard.slice(0, 3).map((entry, i) => {
                const rank = i + 1;
                const entryXP = (entry.totalPoints || 0) || ((entry.classCount || 0) * 10);
                const entryLevel = getActualLevel(entryXP);
                const isMe = entry.name === member?.name;

                // Rank color system from HTML design
                const rankColors = [
                  { name:'#fde047', score:'#fde047', rank:'#fde047', scoreSz:26 },  // apex gold
                  { name:'#fca5a5', score:'#fca5a5', rank:'#fca5a5', scoreSz:24 },  // blood pink
                  { name:'#d8b4fe', score:'#d8b4fe', rank:'#d8b4fe', scoreSz:22 },  // void purple
                  { name:'#bae6fd', score:'#bae6fd', rank:'#bae6fd', scoreSz:20 },  // frost blue
                  { name:'#e8af34', score:'#e8af34', rank:'#e8af34', scoreSz:20 },  // ember gold
                ];
                const rc = rank <= 5 ? rankColors[i] : { name:'#a8a29e', score:'#f5f5f4', rank:'#57534e', scoreSz:18 };
                const beltKey = (entry.belt || 'white').toLowerCase();
                const beltTints: Record<string, string> = { white:'#E0E0E0', blue:'#3B82F6', purple:'#8B5CF6', brown:'#92400E', black:'#2A2A2A', grey:'#9CA3AF', yellow:'#EAB308', orange:'#F97316', green:'#22C55E' };
                const beltTint = beltTints[beltKey] || '#888';
                const prevPos = entry.name ? prevPositions[entry.name] : undefined;
                const currentPos = i + 1;
                const rankDelta = prevPos !== undefined && prevPos !== currentPos ? prevPos - currentPos : null;

                return (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:0,
                    padding:'16px 20px',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    background: isMe ? 'rgba(232,175,52,0.04)' : 'transparent',
                    transition:'background 0.2s',
                  }}>
                    {/* Rank */}
                    <div style={{ width:24, textAlign:'center', flexShrink:0, marginRight:4 }}>
                      <div style={{ fontFamily:'var(--font-display,system-ui)', fontSize:13, fontWeight:900, color: rc.rank, lineHeight:1 }}>{rank}</div>
                      {rankDelta !== null && (
                        <div style={{ fontSize:8, fontWeight:700, color: rankDelta > 0 ? '#4CAF80' : '#E05555', lineHeight:1, marginTop:2 }}>
                          {rankDelta > 0 ? `▲${rankDelta}` : `▼${Math.abs(rankDelta)}`}
                        </div>
                      )}
                    </div>

                    {/* Paragon avatar */}
                    <div style={{ margin:'0 10px', flexShrink:0 }}>
                      <ParagonRing level={entryLevel} size={40} showOrbit={entryLevel >= 6}>
                        {entry.profilePic
                          ? <img src={entry.profilePic} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%', display:'block' }} alt="" />
                          : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: beltTint+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color: beltTint }}>
                              {(entry.name || '?')[0].toUpperCase()}
                            </div>
                        }
                      </ParagonRing>
                    </div>

                    {/* Name + belt */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:700, color: rc.name, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', lineHeight:1.1, letterSpacing:'-0.01em', textShadow: rank <= 3 ? `0 0 12px ${rc.name}60` : 'none' }}>
                        {entry.name}{isMe ? ' (You)' : ''}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                        <div style={{ width:20, height:6, borderRadius:2, background: beltTint, border:'1px solid rgba(255,255,255,0.1)', flexShrink:0, position:'relative', overflow:'hidden' }}>
                          <div style={{ position:'absolute', right:0, top:0, bottom:0, width:4, background:'rgba(0,0,0,0.5)' }} />
                        </div>
                        <span style={{ fontFamily:'var(--font-display,system-ui)', fontSize:10, fontWeight:800, color:'#57534e', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                          {(entry.belt || 'white').charAt(0).toUpperCase() + (entry.belt || 'white').slice(1)} Belt
                        </span>
                      </div>
                    </div>

                    {/* Level score */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:9, fontWeight:800, color:'#57534e', textTransform:'uppercase', letterSpacing:'0.1em', lineHeight:1, marginBottom:2 }}>LVL</div>
                      <div style={{ fontFamily:'var(--font-display,system-ui)', fontSize:rc.scoreSz, fontWeight:900, color: rc.score, lineHeight:1, fontVariantNumeric:'tabular-nums', textShadow: rank <= 3 ? `0 0 12px ${rc.score}60` : 'none' }}>
                        {entryLevel > 0 ? entryLevel : (entry.classCount || entry.score || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          TOURNAMENT COUNTDOWN
          ════════════════════════════════════════════════════ */}
      {nextTournament && tournamentDaysUntil <= 60 && (
        <div className="mx-5 mb-4 reveal">
          <TournamentWidget
            name={nextTournament.name}
            date={nextTournament.date}
            location={nextTournament.location}
            link={nextTournament.link}
          />
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
          RANK INFO MODAL — tap XP widget to open
          ════════════════════════════════════════════════════ */}
      {showRankInfo && (
        <XPInfoPanel
          onClose={() => setShowRankInfo(false)}
          xp={memberXP}
        />
      )}


      {/* ════════════════════════════════════════════════════
          STREAK & MULTIPLIER INFO MODAL
          ════════════════════════════════════════════════════ */}
      {showStreakInfo && (
        <StreakInfoPanel
          onClose={() => setShowStreakInfo(false)}
          trainedCount={trainedCount}
          isEliteWeek={isEliteWeek}
          isPerfectWeek={isPerfectWeek}
        />
      )}

      {/* ── Milestone Info Modal ─────────────────────────────────── */}
      {showMilestoneInfo && createPortal((
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
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={20} color="#C8A24C" /> Milestones</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
                Milestones mark major moments in your journey. Each one represents real progress — sessions on the mat, consistency, and growth.
              </div>
              {(() => {
                const items: Array<{ icon: React.ReactNode; label: string; desc: string; xp: number; tag?: string }> = [
                  { icon: <GrapplingIcon size={28} />, label: 'First Class', desc: "Show up. That's the hardest part.", xp: 100 },
                  { icon: <FireIcon size={28} color="#F97316" />, label: '10 Classes', desc: "You've found your rhythm on the mat.", xp: 250 },
                  { icon: <BoltIcon size={28} color="#22D3EE" />, label: '25 Classes', desc: "Commitment is becoming habit.", xp: 500 },
                  { icon: <Star size={28} color="#60A5FA" />, label: '50 Classes', desc: "You're building something real.", xp: 1000 },
                  { icon: <Star size={28} color="#FFD700" />, label: '100 Classes', desc: "This is who you are now.", xp: 2500 },
                  { icon: <Trophy size={28} color="#A855F7" />, label: '200 Classes', desc: "Elite. The mat is home.", xp: 5000 },
                  { icon: <Trophy size={28} color="#F472B6" />, label: '365 Classes', desc: "A full year of dedication. Legendary.", xp: 10000 },
                  { icon: <CheckCircle2 size={28} color="#C8A24C" />, label: 'First Stripe', desc: "Your coach sees your progress.", xp: 300 },
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
      ), document.body)}

      {/* ── Narrative / Weekly Stats Modal ───────────────────────── */}
      {showNarrativeInfo && createPortal((
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
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={20} color="#C8A24C" /> Your Week</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>A snapshot of where you stand right now.</div>
              {[
                { label: 'Classes This Week', value: weeklyTraining().filter(Boolean).length, unit: 'classes', icon: <GrapplingIcon size={24} /> },
                { label: 'Current Streak', value: dailyStreakCount, unit: 'days', icon: dailyStreakTier === 'paragon' ? <BoltIcon size={24} color="#DC46DC" /> : dailyStreakTier === 'legend' ? <Star size={24} color="#5A78FF" /> : dailyStreakTier === 'diamond' ? <Star size={24} color="#22D3EE" /> : <FireIcon size={24} color="#F97316" /> },
                { label: 'Streak Tier', value: dailyStreakTier === 'paragon' ? 'Paragon' : dailyStreakTier === 'legend' ? 'Legend' : dailyStreakTier === 'diamond' ? 'Diamond' : dailyStreakTier === 'fire' ? 'Fire' : 'None', unit: '', icon: <Trophy size={24} color="#C8A24C" /> },
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
      ), document.body)}

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
      {showWeekStats && createPortal((
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
              <div style={{ fontSize: 20, fontWeight: 800, color: '#F0F0F0', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart2 size={20} color="#C8A24C" /> Your Week</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>A snapshot of where you stand right now.</div>
              {[
                { label: 'Classes This Week', value: weekDots.filter(d => d.trained).length, unit: 'classes', icon: <GrapplingIcon size={24} /> },
                { label: 'Current Streak', value: dailyStreakCount, unit: 'days', icon: <FireIcon size={24} color="#F97316" /> },
                { label: 'XP This Week', value: weekDots.filter(d => d.trained).length * 50, unit: 'XP', icon: <BoltIcon size={24} color="#C8A24C" /> },
                { label: 'Week Multiplier', value: isEliteWeek ? '3×' : isPerfectWeek ? '2×' : trainedCount >= 3 ? '1.5×' : '1×', unit: '', icon: <Trophy size={24} color="#C8A24C" /> },
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
      ), document.body)}

      {/* ── Game Day Info Modal ───────────────────────── */}
      {showGameDayInfo && createPortal((
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
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F0F0F0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}><Swords size={22} color="#C8A24C" /> Game Day</div>
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
      ), document.body)}

      {/* ── Season Modal ───────────────────────── */}
      {showSeasonModal && trainingSeasonData && createPortal((
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
      ), document.body)}
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

