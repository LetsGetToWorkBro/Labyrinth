// v2.1.1 — SVG audit complete
import * as Sentry from "@sentry/react";
import { NativeBiometric } from 'capacitor-native-biometric';
import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { GuestProfileProvider } from "@/lib/guest-profile";
import { GameRecordProvider } from "@/lib/game-records";
import { lazy, Suspense } from "react";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { DMProvider, dispatchOpenDMInbox } from "@/components/FloatingDMTray";

// Eager — needed on first render
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";

// Lazy-loaded pages
const CalendarPage       = lazy(() => import("@/pages/CalendarPage"));
const StatsPage          = lazy(() => import("@/pages/StatsPage"));
const SchedulePage       = lazy(() => import("@/pages/SchedulePage"));
const SaunaPage          = lazy(() => import("@/pages/SaunaPage"));
const WaiverPage         = lazy(() => import("@/pages/WaiverPage"));
const BookingPage        = lazy(() => import("@/pages/BookingPage"));
const BeltJourneyPage    = lazy(() => import("@/pages/BeltJourneyPage"));
const ChatPage           = lazy(() => import("@/pages/ChatPage"));
const GamesPage          = lazy(() => import("@/pages/GamesPage"));
const LeaderboardPage    = lazy(() => import("@/pages/LeaderboardPage"));
const AdminPage          = lazy(() => import("@/pages/AdminPage"));
const MessagesPage       = lazy(() => import("@/pages/MessagesPage"));
const AchievementsPage   = lazy(() => import("@/pages/AchievementsPage"));
const LivePage           = lazy(() => import("@/pages/LivePage"));
const CheckInHistoryPage = lazy(() => import("@/pages/CheckInHistoryPage"));
const SeasonPage         = lazy(() => import("@/pages/SeasonPage"));
const NotFound           = lazy(() => import("@/pages/not-found"));

// ─── ChunkErrorBoundary — auto-retries lazy-chunk load failures ────────
class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    const msg = error?.message || '';
    const isChunkError = msg.includes('MIME')
      || msg.includes('dynamically imported')
      || msg.includes('Failed to fetch dynamically imported module')
      || msg.includes('ChunkLoadError')
      || msg.includes("'text/html' is not a valid JavaScript");
    if (isChunkError) {
      try {
        if (!sessionStorage.getItem('chunk_retry')) {
          sessionStorage.setItem('chunk_retry', '1');
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch {}
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          height:'100vh', background:'#050505', color:'#fff', gap:16, padding:24, textAlign:'center',
        }}>
          <div style={{ fontSize:32 }}>⚠️</div>
          <div style={{ fontSize:16, color:'#888' }}>Something went wrong</div>
          <button
            onClick={() => { try { sessionStorage.removeItem('chunk_retry'); } catch {} window.location.reload(); }}
            style={{
              marginTop:8, padding:'12px 24px',
              background:'#C8A24C', color:'#000',
              borderRadius:12, fontWeight:800, border:'none', cursor:'pointer',
            }}
          >Tap to reload</button>
        </div>
      );
    }
    return this.props.children as any;
  }
}
import logoMaze from './assets/logo-maze.webp';
import {
  Home, MessageCircle, CalendarDays, MoreHorizontal,
  Gamepad2, BarChart2, Trophy, Thermometer,
  CheckCircle2, Megaphone, ChevronRight, Medal,
  Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CalendarSparkIcon, GamepadIcon, GoldMedalIcon, SaunaIcon, ShieldIcon, GrapplingIcon } from "@/components/icons/LbjjIcons";
import React, { useEffect, useCallback, useState, useRef } from "react";
import { useHashLocation as useHashLoc } from "wouter/use-hash-location";
import { Redirect } from "wouter";
import { gasCall, cachedGasCall, beltSavePromotion, updatePresence, dmGetUnread } from "@/lib/api";
import { getBeltColor } from "@/lib/constants";
import { ProfileRing } from "@/components/ProfileRing";
import { ParagonRing } from "@/components/ParagonRing";
import { TopHeader } from "@/components/TopHeader";
import { LeftDrawer } from "@/components/LeftDrawer";
import { NotificationProvider } from "@/components/NotificationProvider";
import { NotificationTray } from "@/components/NotificationTray";
import { getRingTier, getActualLevel, getLevelFromXP } from "@/lib/xp";
import { XPBar } from "@/components/XPBar";
import { soundSystem } from '@/lib/sounds';
import FamilyProfilePicker, { saveActiveProfileToNamespace, loadNamespaceForProfile } from '@/components/FamilyProfilePicker';

// ─── Nav config ───────────────────────────────────────────────────

const NAV_STORAGE_KEY = 'lbjj_nav_config_v1';

// Each option maps to a Lucide icon, custom component, or null = use emoji fallback
type NavOption = {
  path: string;
  label: string;
  Icon: LucideIcon | null;
  emoji: string; // fallback when no Lucide icon
  customIcon?: string;
};

const ALL_NAV_OPTIONS: NavOption[] = [
  { path: '/',         label: 'Home',     Icon: Home,           emoji: '' },
  { path: '/chat',     label: 'Chat',     Icon: MessageCircle,  emoji: '' },
  { path: '/achievements', label: 'Achievements', Icon: Award,    emoji: '' },
  { path: '/schedule', label: 'Schedule', Icon: CalendarDays,   emoji: '' },
  { path: '/more',     label: 'More',     Icon: MoreHorizontal, emoji: '', customIcon: 'maze'  },
  { path: '/games',       label: 'Games',       Icon: Gamepad2,       emoji: '' },
  { path: '/leaderboard', label: 'Leaderboard', Icon: Medal,          emoji: '' },
  { path: '/stats',       label: 'Stats',       Icon: BarChart2,      emoji: '' },
  { path: '/calendar',   label: 'Events',      Icon: Trophy,         emoji: '' },
  { path: '/sauna',      label: 'Sauna',       Icon: Thermometer,    emoji: '' },
  { path: '/live',       label: 'Live',        Icon: null,           emoji: '🔴' },
  { path: '/history',    label: 'History',     Icon: CalendarDays,   emoji: '' },
  { path: '/belt',       label: 'Belt',        Icon: null,           emoji: '🥋' },
  { path: '/achievements', label: 'Achievements', Icon: Award,        emoji: '' },
];

const DEFAULT_NAV_PATHS = ['/', '/chat', '/schedule', '/achievements', '/leaderboard'];

function getNavConfig(): string[] {
  try {
    const s = localStorage.getItem(NAV_STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length === 5) return p;
    }
  } catch {}
  return [...DEFAULT_NAV_PATHS];
}

function saveNavConfig(paths: string[]) {
  try { localStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(paths)); } catch {}
  window.dispatchEvent(new CustomEvent('navConfigChanged'));
}

// ─── Tab bar ──────────────────────────────────────────────────────

const DM_READ_IDS_KEY = 'lbjj_dm_read_ids';

function loadDmReadIdsLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(DM_READ_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}

function computeClaimableAchievements(): number {
  try {
    const earned: string[] = JSON.parse(localStorage.getItem('lbjj_achievements') || '[]');
    const claimed: string[] = JSON.parse(localStorage.getItem('lbjj_achievement_xp_claimed') || '[]');
    return earned.filter(key => !claimed.includes(key)).length;
  } catch { return 0; }
}

function TabBar() {
  const [location] = useLocation();
  const [navPaths, setNavPaths] = useState<string[]>(getNavConfig);
  const { member, isAuthenticated } = useAuth();
  const [dmUnread, setDmUnread] = useState(0);
  const [claimableCount, setClaimableCount] = useState(() => computeClaimableAchievements());

  useEffect(() => {
    const handler = () => setNavPaths(getNavConfig());
    window.addEventListener('navConfigChanged', handler);
    return () => window.removeEventListener('navConfigChanged', handler);
  }, []);

  // Recompute claimable achievements on event or storage change
  useEffect(() => {
    const handler = () => setClaimableCount(computeClaimableAchievements());
    window.addEventListener('achievements-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('achievements-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // Poll DM unread every 30s; subtract locally-read IDs
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await dmGetUnread();
        if (cancelled) return;
        const readIds = loadDmReadIdsLocal();
        // Server doesn't expose per-message IDs in the threads payload, so use server count
        // but let dm-read events zero-out the badge optimistically
        setDmUnread(res.count || 0);
      } catch {}
    };
    refresh();
    const t = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
    const readHandler = () => refresh();
    window.addEventListener('dm-read', readHandler);
    return () => { cancelled = true; clearInterval(t); window.removeEventListener('dm-read', readHandler); };
  }, [isAuthenticated]);

  const hiddenPaths = ["/waiver", "/book", "/reset", "/account"];
  if (hiddenPaths.some(p => location.startsWith(p))) return null;

  // Build tab list from saved paths
  const tabs = navPaths.map(path => {
    const opt = ALL_NAV_OPTIONS.find(o => o.path === path) || ALL_NAV_OPTIONS[0];
    return opt;
  });

  const allTabs = tabs; // Admin tools are in the More tab

  // Wrap tab navigation with View Transition
  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    // Chat tab with unread DMs → open the inbox sheet instead of navigating.
    if (path === '/chat' && dmUnread > 0) {
      e.preventDefault();
      dispatchOpenDMInbox();
      return;
    }
    if (!(document as any).startViewTransition) return; // fallback to CSS class
    e.preventDefault();
    document.documentElement.dataset.nav = 'tab';
    (document as any).startViewTransition(() => {
      window.location.hash = `#${path}`;
    });
    setTimeout(() => delete document.documentElement.dataset.nav, 400);
  };

  // Map path → data-tab slug for per-tab CSS animations
  const pathToTabSlug = (path: string): string => {
    if (path === '/') return 'home';
    return path.replace(/^\//, '').split('/')[0] || 'home';
  };

  const beltColor = getBeltColor(member?.belt || 'white');

  return (
    <nav className="tab-bar" data-testid="tab-bar">
      {allTabs.map(tab => {
        const isActive = tab.path === '/' ? location === '/' : location.startsWith(tab.path);
        const Icon = tab.Icon;
        if (!Icon && !tab.emoji) return null; // skip if no icon defined
        const tabSlug = pathToTabSlug(tab.path);
        return (
          <a
            key={tab.path + tab.label}
            href={`/#${tab.path}`}
            className={`tab-item ${isActive ? 'active' : ''}`}
            data-tab={tabSlug}
            data-testid={`tab-${tab.label.toLowerCase()}`}
            onClick={(e) => handleTabClick(e, tab.path)}
            style={{ position: 'relative' }}
          >
            {tab.customIcon === 'maze' ? (
              <img
                src={logoMaze}
                alt="More"
                style={{
                  width: 24, height: 24,
                  objectFit: 'contain',
                  // mix-blend-mode: screen makes white pixels transparent on dark bg
                  mixBlendMode: 'screen' as const,
                  filter: isActive
                    ? 'brightness(1.3) sepia(1) saturate(6) hue-rotate(3deg) drop-shadow(0 0 4px rgba(200,162,76,0.6))'
                    : 'invert(1) brightness(0.45)',
                  transition: 'filter 250ms ease',
                }}
              />
            ) : Icon ? (
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
                {tab.path === '/chat' && dmUnread > 0 && (
                  <div
                    aria-label={`${dmUnread} unread message${dmUnread === 1 ? '' : 's'}`}
                    style={{
                      position: 'absolute',
                      top: -4, right: -8,
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: '#ef4444',
                      border: '2px solid #0A0A0A',
                      color: '#fff', fontSize: 9, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', lineHeight: 1,
                      boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                    }}
                  >
                    {dmUnread > 99 ? '99+' : dmUnread}
                  </div>
                )}
                {tab.path === '/achievements' && claimableCount > 0 && (
                  <div
                    aria-label={`${claimableCount} unclaimed achievement${claimableCount === 1 ? '' : 's'}`}
                    style={{
                      position: 'absolute',
                      top: -4, right: -8,
                      minWidth: 16, height: 16, borderRadius: 8,
                      background: '#ef4444',
                      border: '2px solid #0A0A0A',
                      color: '#fff', fontSize: 9, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px', lineHeight: 1,
                      boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                    }}
                  >
                    {claimableCount > 99 ? '99+' : claimableCount}
                  </div>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
            )}
            {/* Mat burn smear — belt-colored painterly blur under active icon */}
            {isActive && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 44,
                  height: 10,
                  background: beltColor,
                  borderRadius: '50%',
                  filter: 'blur(7px)',
                  opacity: 0.55,
                  pointerEvents: 'none',
                  animation: 'matBurnIn 300ms ease-out forwards',
                }}
              />
            )}
            <span style={{ fontSize: 12, lineHeight: '1.2' }}>{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

// ─── Nav customizer ───────────────────────────────────────────────

function NavCustomizer() {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<string[]>(getNavConfig);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setOpenDropdown(null);
    if (openDropdown !== null) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openDropdown]);

  const apply = () => {
    saveNavConfig(slots);
    setOpen(false);
  };

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => { setSlots(getNavConfig()); setOpen(!open); }}
        className="w-full flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98]"
        style={{ backgroundColor: '#111', border: '1px solid #1A1A1A', cursor: 'pointer' }}
      >
        <span className="text-xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
            <circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="8" cy="18" r="2" fill="currentColor"/>
          </svg>
        </span>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium" style={{ color: '#F0F0F0' }}>Customize Nav</p>
          <p className="text-xs" style={{ color: '#888' }}>Choose what appears in the bottom bar</p>
        </div>
      </button>

      {open && (
        <div style={{ backgroundColor: '#111', border: '1px solid #1A1A1A', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px 16px' }}>
          {slots.map((path, idx) => {
            const selectedTab = ALL_NAV_OPTIONS.find(o => o.path === path) || ALL_NAV_OPTIONS[0];
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ color: '#555', fontSize: 12, width: 16, flexShrink: 0 }}>#{idx + 1}</span>
                <div style={{ position: 'relative', flex: 1 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === idx ? null : idx); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#F0F0F0',
                      fontSize: 13, fontWeight: 500,
                    }}
                  >
                    {(() => { const I = selectedTab.Icon; return I ? <I size={16} color="#C8A24C" /> : <span>{selectedTab.emoji}</span>; })()}
                    <span style={{ flex: 1, textAlign: 'left' }}>{selectedTab.label}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                  {openDropdown === idx && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8,
                      marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                    }}>
                      {ALL_NAV_OPTIONS.map(opt => (
                        <button
                          key={opt.path + opt.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = [...slots];
                            updated[idx] = opt.path;
                            setSlots(updated);
                            setOpenDropdown(null);
                          }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
                            color: slots[idx] === opt.path ? '#C8A24C' : '#CCC', fontSize: 13,
                            borderBottom: '1px solid #222',
                          }}
                        >
                          {(() => { const I = opt.Icon; return I ? <I size={16} color={slots[idx] === opt.path ? '#C8A24C' : '#888'} /> : <span>{opt.emoji}</span>; })()}
                          <span>{opt.label}</span>
                          {slots[idx] === opt.path && <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setSlots([...DEFAULT_NAV_PATHS])} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: 12, cursor: 'pointer' }}>Reset</button>
            <button onClick={apply} style={{ flex: 2, padding: '8px', background: '#C8A24C', border: 'none', borderRadius: 8, color: '#0A0A0A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── More page ────────────────────────────────────────────────────

function AccountPage() {
  const { member, logout, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(member?.name || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [secondaryEmail, setSecondaryEmail] = useState(() => {
    try {
      const stored = localStorage.getItem("lbjj_member_profile");
      if (stored) return JSON.parse(stored).SecondaryEmail || "";
    } catch {}
    return "";
  });
  const [beltChangeRequest, setBeltChangeRequest] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [googleWalletLoading, setGoogleWalletLoading] = useState(false);
  const navigate = (path: string) => { window.location.hash = path.startsWith('#') ? path : '#' + path; };

  // Profile picture state
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try { return localStorage.getItem("lbjj_profile_picture"); } catch { return null; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Badge showcase state
  const [badges, setBadges] = useState<Array<{key: string; label: string; icon: string; color: string; earnedAt: string}>>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  useEffect(() => {
    if (member?.email) {
      setBadgesLoading(true);
      cachedGasCall('getMemberBadges', { email: member.email }, 120_000).then((res: any) => {
        if (res?.badges) setBadges(res.badges);
      }).catch(() => {}).finally(() => setBadgesLoading(false));
    }
  }, [member?.email]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      // Center crop to square
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      setProfilePic(base64);
      try { localStorage.setItem("lbjj_profile_picture", base64); } catch { /* storage full */ }
      try { window.dispatchEvent(new CustomEvent('pfp-updated')); } catch {}
    };
    img.src = URL.createObjectURL(file);
  };

  const handleAddToWallet = async () => {
    if (!navigator.onLine) {
      setWalletError('No internet connection. Please connect and try again.');
      return;
    }
    if (walletLoading) return;
    setWalletError('');
    setWalletLoading(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      if (!token) { setWalletError('Session expired. Please sign in again.'); setWalletLoading(false); return; }
      const passUrl = `https://labyrinth-pass-server-production.up.railway.app/pass/generate?memberToken=${encodeURIComponent(token)}`;
      window.location.href = passUrl;
    } catch (e) {
      setWalletError('Could not generate pass. Please try again.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleAddToGoogleWallet = async () => {
    if (!navigator.onLine) {
      setWalletError('No internet connection. Please connect and try again.');
      return;
    }
    if (googleWalletLoading) return;
    setWalletError('');
    setGoogleWalletLoading(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      if (!token) { setWalletError('Session expired. Please sign in again.'); setGoogleWalletLoading(false); return; }
      const response = await fetch('https://labyrinth-pass-server-production.up.railway.app/pass/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberToken: token }),
      });
      if (!response.ok) throw new Error('Server error');
      const { saveUrl } = await response.json();
      window.location.href = saveUrl;
    } catch (e) {
      setWalletError('Could not generate Google Wallet pass. Please try again.');
    } finally {
      setGoogleWalletLoading(false);
    }
  };

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      const { gasCall } = await import("@/lib/api");
      // GAS stub: updateMemberProfile action — backend needs this action
      await gasCall("updateMemberProfileApp", { memberEmail: member?.email, name: editName, phone, secondaryEmail });
      // Update localStorage profile
      const stored = localStorage.getItem("lbjj_member_profile");
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          profile.Name = editName;
          profile.Phone = phone;
          profile.SecondaryEmail = secondaryEmail;
          localStorage.setItem("lbjj_member_profile", JSON.stringify(profile));
        } catch { /* ignore parse error */ }
      }
      // Submit belt change request if selected
      if (beltChangeRequest && beltChangeRequest !== member?.belt) {
        await beltSavePromotion({
          belt: beltChangeRequest,
          stripes: 0,
          date: new Date().toISOString().split('T')[0],
          note: 'Requested via profile edit',
        }).catch(() => {});
      }
      await refreshProfile();
      setSaved(true);
      setEditing(false);
      setBeltChangeRequest('');
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    }
    setSaving(false);
  };

  const beltColorMap: Record<string, string> = {
    white: "#E0E0E0", blue: "#3B82F6", purple: "#8B5CF6",
    brown: "#92400E", black: "#1A1A1A", grey: "#9CA3AF",
    yellow: "#EAB308", orange: "#F97316", green: "#22C55E",
  };
  const beltColor = beltColorMap[(member?.belt || "white").toLowerCase()] || "#C8A24C";
  const initials = (member?.name || "M").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="app-content">
      <div className="px-5 pt-4 pb-3" style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", padding: "4px 0", cursor: "pointer", color: "#C8A24C", fontWeight: 600, fontSize: 14 }}>
          &larr; Back
        </button>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0", flex: 1 }}>My Account</h1>
      </div>

      <div className="px-5 pb-6 space-y-4">
        {/* Identity block — ParagonRing + PFP + LV */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
          {(() => {
            const liveXP = (() => { try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp || 0, s.totalXP || 0, member?.totalPoints || (member as any)?.totalPoints || 0); } catch { return member?.totalPoints || 0; } })();
            const memberLevel = getActualLevel(liveXP);
            return (
              <ParagonRing level={memberLevel} size={120}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
                    background: profilePic ? "#000" : beltColor,
                    color: ["white","yellow","grey"].includes((member?.belt||"").toLowerCase()) ? "#0A0A0A" : "#fff",
                    fontSize: 38, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    initials
                  )}
                </div>
              </ParagonRing>
            );
          })()}
          {/* Level display — LV 20 style, bold prominent */}
          {(() => {
            const liveXP = (() => { try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp || 0, s.totalXP || 0, member?.totalPoints || (member as any)?.totalPoints || 0); } catch { return member?.totalPoints || 0; } })();
            const memberLevel = getActualLevel(liveXP);
            return (
              <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#C8A24C', letterSpacing: '0.14em', textTransform: 'uppercase' }}>LV</span>
                <span style={{ fontSize: 34, fontWeight: 900, color: '#F0F0F0', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{memberLevel}</span>
              </div>
            );
          })()}
          {/* Change Photo button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#C8A24C", background: "none", border: "none", cursor: "pointer" }}
          >
            Change Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            style={{ display: "none" }}
          />
        </div>

        {editing ? (
          <>
            {/* Editable name */}
            <div style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 12, padding: "12px 16px" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", display: "block", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                style={{ width: "100%", background: "none", border: "none", fontSize: 15, color: "#F0F0F0", outline: "none", padding: 0 }}
              />
            </div>

            {/* Editable phone */}
            <div style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 12, padding: "12px 16px" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", display: "block", marginBottom: 6 }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                style={{ width: "100%", background: "none", border: "none", fontSize: 15, color: "#F0F0F0", outline: "none", padding: 0 }}
              />
            </div>

            {/* Email (read-only) */}
            <div style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 12, padding: "12px 16px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", margin: "0 0 4px" }}>Email <span style={{ color: "#666", fontSize: 9, fontWeight: 400 }}>(cannot be changed)</span></p>
              <p style={{ fontSize: 15, color: "#999", margin: 0 }}>{member?.email || "\u2014"}</p>
            </div>

            {/* Secondary Email */}
            <div style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 12, padding: "12px 16px" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", display: "block", marginBottom: 6 }}>
                Secondary Email <span style={{ color: "#666", fontSize: 9, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="email"
                value={secondaryEmail}
                onChange={e => setSecondaryEmail(e.target.value)}
                placeholder="alternate@example.com"
                style={{ width: "100%", background: "none", border: "none", fontSize: 15, color: "#F0F0F0", outline: "none", padding: 0 }}
              />
            </div>

            {/* Belt Change Request */}
            <div style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 12, padding: "12px 16px" }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", display: "block", marginBottom: 6 }}>
                Request Belt Change
              </label>
              <select
                value={beltChangeRequest}
                onChange={e => setBeltChangeRequest(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "#0D0D0D", border: "1px solid #222", color: "#F0F0F0", fontSize: 14 }}
              >
                <option value="">No change</option>
                <option value="white">White Belt</option>
                <option value="blue">Blue Belt</option>
                <option value="purple">Purple Belt</option>
                <option value="brown">Brown Belt</option>
                <option value="black">Black Belt</option>
              </select>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Selecting a belt sends a promotion request to your coach for approval.</p>
            </div>

            {error && <p style={{ fontSize: 13, color: "#E05555", textAlign: "center" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setEditing(false); setEditName(member?.name || ""); setPhone(member?.phone || ""); setBeltChangeRequest(''); setError(""); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, background: "#1A1A1A", color: "#999", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  flex: 2, padding: 14, borderRadius: 12,
                  background: saved ? "#4CAF80" : "#C8A24C",
                  color: "#0A0A0A", fontWeight: 700, fontSize: 15,
                  border: "none", cursor: "pointer", transition: "background 0.2s",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving\u2026" : saved ? "\u2713 Saved" : "Save Changes"}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Read-only fields — tap to edit */}
            <div
              onClick={() => { setEditing(true); setEditName(member?.name || ""); setPhone(member?.phone || ""); setBeltChangeRequest(''); }}
              style={{ cursor: "pointer", position: "relative" }}
            >
              {/* Pencil hint */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
                <span style={{ fontSize: 11, color: "#888" }}>Tap to edit</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Name",       value: member?.name  || "\u2014" },
                  { label: "Email",      value: member?.email || "\u2014" },
                  { label: "Belt",       value: (member?.belt  || "white").charAt(0).toUpperCase() + (member?.belt || "white").slice(1) + " Belt" },
                  { label: "Plan",       value: member?.plan  || member?.membership || "\u2014" },
                  { label: "Phone",      value: member?.phone || "Not set" },
                  { label: "Member Since", value: (() => {
                    const d = member?.joinDate || (member as any)?.startDate || (member as any)?.StartDate || (member as any)?.memberSince || (member as any)?.['Start Date'] || (member as any)?.CreatedAt;
                    if (!d) return 'Charter Member';
                    try { return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); } catch { return 'Charter Member'; }
                  })() },
                ].map(f => (
                  <div key={f.label} style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 12, padding: "12px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", margin: "0 0 4px" }}>{f.label}</p>
                    <p style={{ fontSize: 15, color: "#E0E0E0", margin: 0 }}>{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {saved && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", borderRadius: 10, backgroundColor: "rgba(76,175,128,0.1)" }}>
                <span style={{ color: "#4CAF80", fontSize: 13, fontWeight: 600 }}>\u2713 Profile updated successfully</span>
              </div>
            )}

            <button
              onClick={() => { setEditing(true); setEditName(member?.name || ""); setPhone(member?.phone || ""); setBeltChangeRequest(''); }}
              style={{
                width: "100%", padding: 14, borderRadius: 12,
                background: "#C8A24C", color: "#0A0A0A", fontWeight: 700, fontSize: 15,
                border: "none", cursor: "pointer",
              }}
            >
              Edit Profile
            </button>
          </>
        )}

        {member && (<>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginTop: 24, marginBottom: 8 }}>
            Member Pass
          </div>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={handleAddToWallet}
              disabled={walletLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: 10, padding: '13px 20px', borderRadius: 12,
                background: walletLoading ? '#1A1A1A' : '#000',
                border: '1.5px solid rgba(255,255,255,0.15)',
                cursor: walletLoading ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 6.5c1.1 0 2-.4 2.7-1.1.7-.7 1-1.6.9-2.6-.9.1-2 .6-2.6 1.3-.6.7-1 1.5-.9 2.4zm.7 1.1c-1.5 0-2.7.8-3.4.8-.7 0-1.8-.8-3-.8C4.8 7.6 3 8.8 3 11.4c0 1.6.6 3.3 1.4 4.4.7 1 1.3 1.8 2.2 1.8.9 0 1.3-.6 2.4-.6 1.1 0 1.5.6 2.4.6.9 0 1.6-.8 2.2-1.8.5-.7.8-1.4 1-2.1-2.6-1-2.2-4.7.1-5.5-.7-.7-1.6-1.1-2-1.1z" fill="white"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {walletLoading ? 'Generating...' : 'Add to'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Apple Wallet
                </div>
              </div>
            </button>
          </div>
          {/* Wallet error display */}
          {walletError && (
            <div style={{ margin: '4px 0 8px', padding: '10px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 10, fontSize: 13, color: '#E05252', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {walletError}
            </div>
          )}
          {/* Google Wallet button */}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={handleAddToGoogleWallet}
              disabled={googleWalletLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '13px 20px',
                borderRadius: 12,
                background: googleWalletLoading ? '#1A1A1A' : '#000',
                border: '1.5px solid rgba(255,255,255,0.15)',
                cursor: googleWalletLoading ? 'default' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {googleWalletLoading ? 'Generating...' : 'Add to'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Google Wallet
                </div>
              </div>
            </button>
          </div>
        </>)}

        {/* ── Waiver & Agreement Status ── */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>Documents</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Waiver */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: (member as any)?.waiverSigned ? 'rgba(76,175,128,0.06)' : 'rgba(224,82,82,0.06)', border: `1px solid ${(member as any)?.waiverSigned ? 'rgba(76,175,128,0.25)' : 'rgba(224,82,82,0.25)'}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (member as any)?.waiverSigned ? 'rgba(76,175,128,0.12)' : 'rgba(224,82,82,0.1)' }}>
                {(member as any)?.waiverSigned
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>Liability Waiver</div>
                <div style={{ fontSize: 11, color: (member as any)?.waiverSigned ? '#4CAF80' : '#E05252', fontWeight: 600, marginTop: 2 }}>
                  {(member as any)?.waiverSigned ? '✓ Signed' : 'Not signed'}
                </div>
              </div>
              {!(member as any)?.waiverSigned && (
                <a href="/#/waiver" style={{ padding: '6px 14px', borderRadius: 8, background: '#E05252', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Sign Now</a>
              )}
            </div>
            {/* Membership Agreement */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: (member as any)?.agreementSigned ? 'rgba(76,175,128,0.06)' : 'rgba(224,82,82,0.06)', border: `1px solid ${(member as any)?.agreementSigned ? 'rgba(76,175,128,0.25)' : 'rgba(224,82,82,0.25)'}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (member as any)?.agreementSigned ? 'rgba(76,175,128,0.12)' : 'rgba(224,82,82,0.1)' }}>
                {(member as any)?.agreementSigned
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4CAF80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>Membership Agreement</div>
                <div style={{ fontSize: 11, color: (member as any)?.agreementSigned ? '#4CAF80' : '#E05252', fontWeight: 600, marginTop: 2 }}>
                  {(member as any)?.agreementSigned ? '✓ Signed' : 'Not signed'}
                </div>
              </div>
              {!(member as any)?.agreementSigned && (
                <a href="/#/waiver" style={{ padding: '6px 14px', borderRadius: 8, background: '#E05252', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>Sign Now</a>
              )}
            </div>
          </div>
        </div>

        {/* Class History link */}
        <a href="/#/history" style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 20,
          padding: '14px 16px', borderRadius: 12, background: '#111', border: '1px solid #1A1A1A',
          textDecoration: 'none', cursor: 'pointer',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F0' }}>Class History</div>
            <div style={{ fontSize: 11, color: '#888' }}>View your attendance record</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </a>

        {/* Always show Achievements section */}
        <div style={{ marginTop: 24 }}>
          <button type="button" onClick={() => navigate('/achievements')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666' }}>Achievements</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!badgesLoading && <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A24C', background: 'rgba(200,162,76,0.1)', border: '1px solid rgba(200,162,76,0.2)', borderRadius: 20, padding: '2px 8px' }}>{badges.length} earned</span>}
              <span style={{ fontSize: 11, color: '#555' }}>View All →</span>
            </div>
          </button>

          {badgesLoading ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ width: 48, height: 48, borderRadius: 12, background: '#1A1A1A', animation: 'shimmer 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : badges.length > 0 ? (
            <div className="reveal-stagger" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
              {badges.map(b => (
                <div key={b.key} style={{
                  flexShrink: 0, textAlign: 'center',
                  background: '#0D0D0D',
                  border: '1px solid #C8A24C44',
                  borderRadius: 14, padding: '14px 10px',
                  minWidth: 76, maxWidth: 84,
                  position: 'relative'
                }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>{b.icon}</div>
                  <div style={{ fontSize: 10, color: '#C8A24C', fontWeight: 700, lineHeight: 1.3, letterSpacing: '0.02em' }}>{b.label}</div>
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#C8A24C', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#000'
                  }}>{'\u2713'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 14, padding: '20px 16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {['\uD83E\uDD47', '\uD83D\uDD25', '\u26A1', '\uD83D\uDC51', '\uD83D\uDEE1\uFE0F', '\uD83C\uDFC6'].map(e => (
                  <div key={e} style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: '#141414', border: '1px solid #222',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, opacity: 0.35
                  }}>{e}</div>
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>No achievements yet</div>
              <div style={{ fontSize: 12, color: '#3A3A3A', lineHeight: 1.5 }}>
                Attend classes, hit training streaks, compete in tournaments, and earn belt promotions to unlock achievements.
              </div>
            </div>
          )}
        </div>

        {/* Sauna Sessions */}
        {(() => {
          const saunaStats = (() => {
            try {
              const sessions = JSON.parse(localStorage.getItem('lbjj_sauna_sessions') || '[]');
              return {
                total: sessions.length,
                recent: sessions.slice(-3).reverse(),
              };
            } catch { return { total: 0, recent: [] as any[] }; }
          })();
          return saunaStats.total > 0 ? (
            <div style={{ borderTop: '1px solid #1A1A1A', paddingTop: 16, marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#666', textTransform: 'uppercase', marginBottom: 10 }}>
                Sauna Sessions
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ background: '#0D0D0D', border: '1px solid #1A1A1A', borderRadius: 12, padding: '12px 16px', flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F0' }}>{saunaStats.total}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Total sessions</div>
                </div>
              </div>
              <a href="/#/sauna" style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#C8A24C', textDecoration: 'none' }}>
                View sauna dashboard →
              </a>
            </div>
          ) : null;
        })()}

        <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: 16, marginTop: 8 }}>
          <button
            onClick={logout}
            style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(224,85,85,0.08)", color: "#E05555", border: "1px solid rgba(224,85,85,0.15)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>

        {/* Request Account Deletion — subtle muted red text button, intentionally unprominent */}
        <div style={{ marginTop: 18, paddingTop: 12, display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => {
              const email = member?.email || '';
              window.open(
                `mailto:info@labyrinth.vision?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20associated%20with%3A%20${encodeURIComponent(email)}`,
                '_blank'
              );
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(224,85,85,0.55)',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 10px',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(224,85,85,0.25)',
              textUnderlineOffset: 3,
              letterSpacing: '0.02em',
            }}
            aria-label="Request account deletion"
          >
            Request account deletion
          </button>
        </div>
      </div>
    </div>
  );
}


// ── Sound toggle (used inside MorePage) ───────────────────────
function SoundToggle() {
  const [enabled, setEnabled] = useState(soundSystem.isEnabled);
  const toggle = () => {
    const next = !enabled;
    soundSystem.setEnabled(next);
    setEnabled(next);
    if (next) {
      soundSystem.preload(['checkin', 'xpEarn', 'levelUp', 'achievement', 'streak', 'beltPromo']);
      setTimeout(() => soundSystem.play('xpEarn'), 100);
    }
  };
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderRadius: 14,
        background: '#111', border: '1px solid #1A1A1A',
        marginTop: 12, cursor: 'pointer',
      }}
      onClick={toggle}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {enabled ? (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </>
          ) : (
            <>
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </>
          )}
        </svg>
      </span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0F0', margin: 0 }}>Sound Effects</p>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{enabled ? 'On — check-ins, level-ups & achievements' : 'Off — tap to enable'}</p>
      </div>
      {/* Toggle pill */}
      <div style={{
        width: 44, height: 26, borderRadius: 13,
        background: enabled ? '#C8A24C' : '#2A2A2A',
        position: 'relative', flexShrink: 0,
        transition: 'background 200ms ease',
        boxShadow: enabled ? '0 0 10px rgba(200,162,76,0.4)' : 'none',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: enabled ? 21 : 3,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff',
          transition: 'left 200ms cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}/>
      </div>
    </div>
  );
}

function MorePage() {
  const { logout, isAdmin, member } = useAuth();
  const morePanelRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setTimeout(() => morePanelRef.current?.focus(), 50);
  }, []);

  const sections: { label: string; items: { href: string; icon: React.ReactNode; label: string; desc: string }[] }[] = [
    {
      label: 'Account',
      items: [
        { href: '/#/account',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>, label: 'My Account', desc: 'Edit your phone number and info' },
      ]
    },
    {
      label: 'Train',
      items: [
        { href: '/#/achievements', icon: <Trophy size={20} color="#C8A24C" />, label: 'Achievements', desc: 'Unlock badges and track your progress' },
        { href: '/#/belt', icon: <CheckCircle2 size={20} color="#C8A24C" />, label: 'Belt Journey', desc: 'Track your progression and submit promotion requests' },
        { href: '/#/history',  icon: <CalendarSparkIcon size={20} color="#C8A24C" />, label: 'Class History', desc: 'Your attendance record' },
        { href: '/#/games',    icon: <GamepadIcon size={20} color="#C8A24C" />, label: 'Games', desc: 'Challenge your teammates' },
        { href: '/#/leaderboard', icon: <GoldMedalIcon size={20} />, label: 'Leaderboard', desc: 'Weekly class attendance rankings' },
        { href: '/#/live', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><circle cx="19" cy="12" r="2" fill="#C8A24C" stroke="none"/></svg>, label: 'Live & Archive', desc: 'Watch live classes and recordings' },
        { href: '/#/schedule', icon: <CalendarSparkIcon size={20} color="#C8A24C" />, label: 'Class Schedule', desc: 'View and bookmark classes' },
      ]
    },
    {
      label: 'Manage',
      items: [
        { href: '/#/sauna',    icon: <SaunaIcon size={20} color="#C8A24C" />, label: 'Sauna Dashboard', desc: 'Check in/out, active sessions' },
        { href: '/#/stats',    icon: <BarChart2 size={20} color="#C8A24C" />, label: 'Academy Stats', desc: 'Rankings, athletes, jits.gg' },
        { href: '/#/calendar', icon: <Trophy size={20} color="#C8A24C" />, label: 'Tournament Calendar', desc: 'Events and registrations' },
      ]
    },
    {
      label: 'Documents',
      items: [
        { href: '/#/book',     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>, label: 'Book Trial Class', desc: 'Schedule a free trial' },
        { href: '/#/waiver',   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, label: 'Waiver & Agreement', desc: 'Sign or review documents' },
      ]
    },
    ...(isAdmin ? [{
      label: 'Admin',
      items: [
        { href: '/#/messages', icon: <Megaphone size={20} color="#C8A24C" />, label: 'Message Blast', desc: 'Email or text all members' },
        { href: '/#/admin',    icon: <ShieldIcon size={20} color="#C8A24C" />, label: 'Admin Panel', desc: 'Member management & stats' },
      ]
    }] : []),
  ];

  return (
    <div className="app-content" ref={morePanelRef} tabIndex={-1} role="dialog" aria-label="More options" style={{ outline: 'none' }}>
      <div className="px-5 pt-4 pb-3" style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>More</h1>
      </div>
      <div className="px-5 pb-6">
        {sections.map((section, si) => (
          <div key={section.label}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', padding: '20px 0 8px', paddingTop: si === 0 ? '4px' : '20px' }}>
              {section.label}
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <a key={i} href={item.href}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", transition: 'background-color 120ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                  onMouseDown={e => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    const chevron = el.querySelector('svg:last-child') as HTMLElement;
                    if (chevron) chevron.style.transform = 'translateX(2px)';
                  }}
                  onMouseUp={e => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = '';
                    const chevron = el.querySelector('svg:last-child') as HTMLElement;
                    if (chevron) chevron.style.transform = '';
                  }}
                  onTouchStart={e => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = 'rgba(255,255,255,0.04)';
                    const chevron = el.querySelector('svg:last-child') as HTMLElement;
                    if (chevron) chevron.style.transform = 'translateX(2px)';
                  }}
                  onTouchEnd={e => {
                    const el = e.currentTarget;
                    setTimeout(() => {
                      el.style.backgroundColor = '';
                      const chevron = el.querySelector('svg:last-child') as HTMLElement;
                      if (chevron) chevron.style.transform = '';
                    }, 150);
                  }}
                >
                  <span className="text-xl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#F0F0F0" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#888" }}>{item.desc}</p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', transition: 'transform 80ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <ChevronRight size={16} color="#555" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
        {/* Sound toggle */}
        <SoundToggle />
        <div style={{ marginTop: 20 }}>
          <NavCustomizer />
        </div>
        <div className="mt-6 p-5 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#C8A24C', letterSpacing: '-0.02em', marginBottom: 2 }}>LABYRINTH BJJ</div>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 16, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Fulshear, Texas</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <a href="https://maps.google.com/?q=Labyrinth+BJJ+Fulshear+TX" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 10, background: '#161616', border: '1px solid #222', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Directions</span>
            </a>
            <a href="https://labyrinth.vision" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 10, background: '#161616', border: '1px solid #222', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Website</span>
            </a>
            <a href="tel:+12813937983"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 10, background: '#161616', border: '1px solid #222', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.56C1.56 2.5 2.33 1.56 3.36 1H6.36a2 2 0 0 1 2 1.72c.13 1 .36 1.97.71 2.9a2 2 0 0 1-.45 2.11L7.18 8.72a16 16 0 0 0 6.01 6.01l1.01-1.01a2 2 0 0 1 2.11-.45c.93.35 1.9.58 2.9.71A2 2 0 0 1 21 16.92z"/></svg>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Call</span>
              <span style={{ fontSize: 10, color: '#888', marginTop: -2 }}>281-393-7983</span>
            </a>
            <a href="sms:+12813937983"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 10, background: '#161616', border: '1px solid #222', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Text Us</span>
              <span style={{ fontSize: 10, color: '#888', marginTop: -2 }}>281-393-7983</span>
            </a>
          </div>
          <a href="mailto:info@labyrinth.vision"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: '#161616', border: '1px solid #222', textDecoration: 'none', width: '100%' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>info@labyrinth.vision</span>
          </a>
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#0D0D0D', borderRadius: 10, border: '1px solid #1A1A1A', whiteSpace: 'pre-line' }}>
            <div style={{ fontSize: 10, color: '#555', lineHeight: 1.6 }}>
              <div><span style={{ color: '#888' }}>Billing & memberships:</span> Text or email info@labyrinth.vision</div>
              <div><span style={{ color: '#888' }}>Class questions:</span> Text 281-393-7983</div>
              <div><span style={{ color: '#888' }}>Hours:</span> Check the schedule tab for class times</div>
            </div>
          </div>
        </div>
        <button onClick={() => setShowLogoutConfirm(true)}
          className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
          style={{ backgroundColor: "rgba(224,85,85,0.08)", color: "#E05555", border: "1px solid rgba(224,85,85,0.15)" }}
          data-testid="button-logout-more"
          aria-label="Sign out"
        >
          Sign Out
        </button>
      </div>
      {/* Logout confirmation sheet */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}
             onClick={() => setShowLogoutConfirm(false)}>
          <div style={{ background: '#111', borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, background: '#333', borderRadius: 2, margin: '0 auto 20px' }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: '#F0F0F0', marginBottom: 8, textAlign: 'center' }}>Sign Out?</div>
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 1.5 }}>
              You'll need your password to sign back in.
            </div>
            <button onClick={() => { setShowLogoutConfirm(false); logout(); }}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#E05252', color: '#fff', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 10 }}>
              Sign Out
            </button>
            <button onClick={() => setShowLogoutConfirm(false)}
              style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#1A1A1A', color: '#888', border: '1px solid #2A2A2A', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reset Password Page ──────────────────────────────────────────

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const navigate = (path: string) => { window.location.hash = path.startsWith('#') ? path : '#' + path; };

  // Extract token from hash: /#/reset?token=xxx
  const token = new URLSearchParams(window.location.hash.split('?')[1] || '').get('token') || '';
  // Immediately clear token from URL to prevent it appearing in browser history / Sentry logs
  useEffect(() => {
    if (token && window.location.hash.includes('?token=')) {
      window.history.replaceState(null, '', window.location.pathname + '#/reset');
    }
  }, []);

  const submit = async () => {
    if (!password || password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!token) { setError('Invalid reset link'); return; }
    setLoading(true); setError('');
    try {
      const { getActiveGasUrl, getSavedLocationId } = await import('@/lib/locations');
      const GAS_ENDPOINT = getActiveGasUrl(getSavedLocationId());
      const payload = JSON.stringify({ action: 'memberConfirmReset', token, newPassword: password });
      const url = GAS_ENDPOINT + '?action=memberConfirmReset&payload=' + encodeURIComponent(payload);
      const res = await fetch(url, { redirect: 'follow' });
      const data = await res.json();
      if (data.success) { setDone(true); }
      else { setError(data.error || 'An error occurred'); }
    } catch (e) { setError('Connection error. Try again.'); }
    setLoading(false);
  };

  if (!token) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: 24 }}>
      <div style={{ textAlign: 'center', color: '#E05555' }}>Invalid or expired reset link.<br /><a href="/#/" style={{ color: '#C8A24C' }}>Back to login</a></div>
    </div>
  );

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 360, background: '#111', borderRadius: 16, padding: '32px 24px', border: '1px solid #1A1A1A' }}>
        <h2 style={{ color: '#C8A24C', fontWeight: 700, fontSize: 20, marginBottom: 8, textAlign: 'center' }}>Set New Password</h2>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#4CAF80', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>Password updated successfully!</p>
            <button onClick={() => navigate('/')} style={{ background: '#C8A24C', color: '#0A0A0A', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
          </div>
        ) : (
          <>
            {error && <p style={{ color: '#E05555', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <form onSubmit={e => { e.preventDefault(); submit(); }}>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="reset-pw" style={{ color: '#999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>New Password</label>
              <input id="reset-pw" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
                enterKeyHint="next" autoComplete="new-password"
                style={{ width: '100%', background: '#0D0D0D', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', color: '#F0F0F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label htmlFor="reset-confirm" style={{ color: '#999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input id="reset-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same password again"
                enterKeyHint="go" autoComplete="new-password"
                style={{ width: '100%', background: '#0D0D0D', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', color: '#F0F0F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: '#C8A24C', color: '#0A0A0A', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Updating…' : 'Set New Password'}
            </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <a href="/#/" style={{ color: '#888', fontSize: 12 }}>Back to sign in</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Admin wrappers ───────────────────────────────────────────────

function AdminGuard() {
  const { isAuthenticated, isAdminVerified } = useAuth();
  const navigate = (path: string) => { window.location.hash = path.startsWith('#') ? path : '#' + path; };

  // Only render AdminPage once GAS has confirmed admin role.
  // Cached localStorage isAdmin is not trusted for route gating.
  if (!isAuthenticated || !isAdminVerified) {
    navigate('/');
    return null;
  }

  return <AdminPage onBack={() => navigate("/")} />;
}

function AdminShortcut() {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = (path: string) => { window.location.hash = path.startsWith('#') ? path : '#' + path; };
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === "A") {
      e.preventDefault();
      if (isAuthenticated && isAdmin) navigate("/admin");
    }
  }, [isAdmin, isAuthenticated, navigate]);
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);
  return null;
}

// ─── Auth gate — shows login until authenticated ──────────────────

// ── Biometric / WebAuthn registration helper ──────────────────────
// Strategy: NativeBiometric first (Capacitor iOS/Android), WebAuthn fallback (web)
async function registerPasskeyGlobal(email: string): Promise<boolean> {
  // 1. Try native biometric (Face ID / Touch ID / Fingerprint via Capacitor)
  try {
    const { isAvailable } = await NativeBiometric.isAvailable({ useFallback: false });
    if (isAvailable) {
      // Native confirmed — just mark registered. NativeBiometric uses the OS
      // biometric store; no credential object is needed on our side.
      localStorage.setItem('lbjj_passkey_email', email);
      localStorage.setItem('lbjj_passkey_registered', 'true');
      return true;
    }
  } catch { /* not running in Capacitor — fall through */ }

  // 2. WebAuthn fallback (web browser only)
  try {
    if (!window.PublicKeyCredential) return false;
    const challenge = new Uint8Array(32);
    try { crypto.getRandomValues(challenge); } catch { return false; } // Brave blocks this
    const userId = new TextEncoder().encode(email);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Labyrinth BJJ', id: window.location.hostname },
        user: { id: userId, name: email, displayName: email },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' as const }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform' as const,
          userVerification: 'required' as const,
          residentKey: 'preferred' as const,
        },
        timeout: 60000,
      }
    }) as PublicKeyCredential;
    if (!credential) return false;
    const rawId = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(credential.rawId))));
    localStorage.setItem('lbjj_passkey_id', rawId);
    localStorage.setItem('lbjj_passkey_email', email);
    localStorage.setItem('lbjj_passkey_registered', 'true');
    return true;
  } catch {
    return false;
  }
}

const BELT_MILESTONE_KEYS = ['mat_warrior', 'mat_legend', 'loyal_1yr', 'loyal_2yr', 'streak_30', 'podium', 'century_club'];

function BeltMilestoneOverlay({ badge, onDismiss }: { badge: any; onDismiss: () => void }) {
  const navigate = (path: string) => { window.location.hash = path.startsWith('#') ? path : '#' + path; };
  const overlayRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!sweepRef.current || !badgeRef.current || !nameRef.current) return;

    sweepRef.current.animate([
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)' }
    ], { duration: 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });

    badgeRef.current.animate([
      { transform: 'scale(0.4)', opacity: 0 },
      { transform: 'scale(1.08)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 480, delay: 180, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'forwards' });

    nameRef.current.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 280, delay: 400, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' });
  }, []);

  return (
    <div ref={overlayRef} className="belt-milestone-overlay"
      role="status" aria-live="polite" aria-atomic="true" aria-label={`Achievement unlocked: ${badge.label}`}
      onClick={onDismiss}
    >
      <div ref={sweepRef} className="bm-sweep" style={{ '--belt-color': badge.color } as any} />
      <div ref={badgeRef} className="bm-badge" style={{ fontSize: 72 }}>{badge.icon}</div>
      <h2 ref={nameRef} className="bm-name">{badge.label}</h2>
      <p className="bm-label" style={{ color: '#888', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Achievement Unlocked</p>
      <button
        onClick={() => {
          const msg = `Just unlocked: ${badge.label} ${badge.icon}`;
          localStorage.setItem('lbjj_chat_prefill', msg);
          navigate('/chat');
          onDismiss();
        }}
        style={{
          marginTop: 12, padding: '10px 20px', borderRadius: 20,
          background: 'rgba(200,162,76,0.15)', border: '1px solid rgba(200,162,76,0.3)',
          color: '#C8A24C', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        🎉 Share to Community
      </button>
      <button className="bm-dismiss" onClick={onDismiss}>Continue</button>
    </div>
  );
}

function WaiverRedirect() {
  // Use window.location directly — this renders outside the Router context
  // so wouter hooks (useHashLoc/useLocation) would throw
  useEffect(() => {
    window.location.hash = '#/waiver';
  }, []);
  return null;
}

function AppShell() {
  const { isAuthenticated, isLoading, member, familyMembers } = useAuth();
  // location removed from AppShell — AppShell is outside Router, useHashLoc() crashes
  const [levelUpState, setLevelUpState] = useState<{ newLevel: number; prevLevel: number } | null>(null);
  const [xpModalOpen, setXpModalOpen] = useState(false);

  // Clear chunk-retry flag once the app has successfully mounted — prevents retry-loop.
  useEffect(() => {
    try { sessionStorage.removeItem('chunk_retry'); } catch {}
  }, []);

  // ── Family profile picker ──────────────────────────────────────
  // Show picker after login when the account has sub-members.
  // "picked" persists in sessionStorage so navigation within the session doesn't re-show it.
  const [familyPicked, setFamilyPicked] = useState<boolean>(() => {
    // If already picked this session, skip
    try { return sessionStorage.getItem('lbjj_family_picked') === '1'; } catch { return false; }
  });

  // Only show the family picker when there are genuinely multiple distinct profiles to choose
  // (at least 2 total members, not just the primary alone)
  const isFamilyAccount = familyMembers && familyMembers.length > 1;

  const handleFamilyPicked = () => {
    try { sessionStorage.setItem('lbjj_family_picked', '1'); } catch {}
    setFamilyPicked(true);
  };

  // Listen for Switch Profile event from ProfileTray
  useEffect(() => {
    const handler = () => setFamilyPicked(false);
    window.addEventListener('family-switch-profile', handler);
    return () => window.removeEventListener('family-switch-profile', handler);
  }, []);
  const handleLevelUp = useCallback((newLevel: number, prevLevel: number) => {
    setLevelUpState({ newLevel, prevLevel });
  }, []);

  // ── Clear game-active attribute on any route change ──────────
  useEffect(() => {
    const handler = () => {
      if (!window.location.hash.includes('/games')) {
        document.body.removeAttribute('data-game-active');
      }
    };
    window.addEventListener('hashchange', handler);
    handler(); // run once on mount
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ── Idle-prefetch top routes + preload sounds ────────────────
  useEffect(() => {
    const prefetch = () => {
      import("@/pages/SchedulePage");
      import("@/pages/ChatPage");
      import("@/pages/AchievementsPage");
      // Preload sounds on first idle tick so they're ready for interaction
      soundSystem.preload(['checkin', 'xpEarn', 'levelUp', 'achievement', 'streak', 'beltPromo']);
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 1500);
    }
  }, []);

  // ── Cache geo-lock config on mount ─────────────────────────────
  useEffect(() => {
    // TODO: GAS action needed — getGeoConfig
    gasCall('getGeoConfig', {}).then((res: any) => {
      if (res?.config) {
        try { localStorage.setItem('lbjj_geo_config', JSON.stringify(res.config)); } catch {}
      }
    }).catch(() => {});
  }, []);

  // ── Presence heartbeat — ping GAS every 60s while authenticated ─
  useEffect(() => {
    if (!isAuthenticated) return;
    updatePresence();
    const interval = setInterval(() => {
      if (document.hidden) return;
      updatePresence();
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ── Belt Milestone Overlay ─────────────────────────────────────
  const [milestoneOverlay, setMilestoneOverlay] = useState<any>(null);
  const milestoneShownThisSession = useRef(false);

  useEffect(() => {
    (window as any).__showBeltMilestone = (badge: any) => {
      if (milestoneShownThisSession.current) return;
      milestoneShownThisSession.current = true;
      setMilestoneOverlay(badge);
    };
  }, []);

  // ── Track navigation direction ──────────────────────────────
  const navDirection = useRef<'forward' | 'back' | 'tab'>('forward');

  useEffect(() => {
    const handlePopState = () => {
      navDirection.current = 'back';
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Page transition on route change ──────────────────────────
  const prevHash = useRef(window.location.hash);
  useEffect(() => {
    const handler = () => {
      const location = window.location.hash.replace(/^#/, '') || '/';
      const prev = prevHash.current.replace(/^#/, '') || '/';
      if (prev === location) return;

      // Determine direction
      const tabPaths = ['/', '/chat', '/schedule', '/achievements', '/leaderboard'];
      const isTab = tabPaths.includes(location) && tabPaths.includes(prev);
      const fromIdx = tabPaths.indexOf(prev);
      const toIdx = tabPaths.indexOf(location);
      const direction = isTab ? (toIdx > fromIdx ? 'left' : 'right') : 'up';

      document.body.dataset.navDir = direction;
      prevHash.current = window.location.hash;
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // ── Global Biometric / Passkey setup prompt ───────────────────
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const supportsPasskey = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  useEffect(() => {
    if (isAuthenticated && supportsPasskey && !localStorage.getItem('lbjj_passkey_registered')) {
      const timer = setTimeout(() => setShowPasskeySetup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handlePasskeyRegister = async () => {
    const email = member?.email || '';
    if (!email) return;
    setPasskeyRegistering(true);
    await registerPasskeyGlobal(email);
    setPasskeyRegistering(false);
    setShowPasskeySetup(false);
  };

  // Must be declared before any conditional returns (Rules of Hooks)
  const onboardingDoneRef = useRef<boolean>(!!(() => { try { return localStorage.getItem('lbjj_onboarding_done'); } catch { return null; } })());

  // Reset password page is public — show without auth check
  if (window.location.hash.replace(/^#/, '').startsWith('/reset')) {
    return (
      <div className="app-shell">
        <ResetPasswordPage />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0A0A' }}>
        <div className="w-8 h-8 border-[3px] border-[#1A1A1A] border-t-[#C8A24C] rounded-full animate-spin" />
      </div>
    );
  }

  // ── Setup token gate — intercept #setup?token= regardless of auth state ──
  // If the URL contains a setup token, always show LoginPage (which handles the setup flow)
  // even if the user is already logged in. This handles the case where someone clicks a
  // setup link from email while already authenticated as a different account.
  const hashSetupToken = (() => {
    try {
      const hash = window.location.hash || '';
      const qIdx = hash.indexOf('?');
      if (qIdx === -1) return null;
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      return params.get('token') && hash.includes('setup') ? params.get('token') : null;
    } catch { return null; }
  })();

  if (!isAuthenticated || hashSetupToken) {
    return (
      <div className="app-shell">
        <LoginPage />
      </div>
    );
  }

  // ── Family profile picker gate ────────────────────────────────
  // If this is a family account and no profile has been picked yet this session,
  // show the profile selection screen before entering the app.
  if (isFamilyAccount && !familyPicked) {
    return <FamilyProfilePicker onDone={handleFamilyPicked} />;
  }

  const GOLD = "#C8A24C";
  const onboardingDone = onboardingDoneRef.current;

  // Waiver gate — DISABLED until GAS waiverSigned field is verified reliable.
  // The WaiverPage remains accessible via /#/waiver for members who need to sign.
  // Re-enable once confirmed waiverSigned returns true correctly for signed members.
  const needsWaiver = false;

  return (
    <NotificationProvider>
    <div className="app-shell">
      {!onboardingDone && <OnboardingPage />}
      {needsWaiver && <WaiverRedirect />}
      <AdminShortcut />
      <TopHeader onMenuOpen={() => window.dispatchEvent(new CustomEvent('open-left-drawer'))} onXpOpen={() => setXpModalOpen(true)} />
      <LeftDrawer />
      <NotificationTray />

      {xpModalOpen && (() => {
        const storedXP = (() => { try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp || 0, s.totalXP || 0, (member as any)?.totalPoints || 0); } catch { return (member as any)?.totalPoints || 0; } })();
        const memberXP = storedXP;
        const memberLevel = getActualLevel(memberXP);
        const lvl = getLevelFromXP(memberXP);
        const pfp = (() => { try { return localStorage.getItem('lbjj_profile_picture') || null; } catch { return null; } })();
        const initials = member?.name ? member.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?';
        const belt = ((member as any)?.belt || 'white').toLowerCase();

        type ParagonTheme = 'theme-ember' | 'theme-frost' | 'theme-void' | 'theme-blood' | 'theme-apex';
        const getTheme = (lvl: number): ParagonTheme => {
          if (lvl >= 30) return 'theme-apex';
          if (lvl >= 20) return 'theme-blood';
          if (lvl >= 12) return 'theme-void';
          if (lvl >= 6) return 'theme-frost';
          return 'theme-ember';
        };
        const currentTheme = getTheme(memberLevel);

        const PARAGON_TIERS = [
          { theme: 'theme-ember', name: 'Bronze Forge',       desc: 'The forged bronze ring',        minLevel: 1,  color: '#e8af34', unlocked: memberLevel >= 1  },
          { theme: 'theme-frost', name: 'Frozen Aura',        desc: 'Crystalline etched aura',       minLevel: 6,  color: '#0ea5e9', unlocked: memberLevel >= 6  },
          { theme: 'theme-void',  name: 'Void Star',          desc: 'Pulsing amethyst gem',          minLevel: 12, color: '#a855f7', unlocked: memberLevel >= 12 },
          { theme: 'theme-blood', name: 'Blood Flame',        desc: 'Aggressive crimson flare',      minLevel: 20, color: '#ef4444', unlocked: memberLevel >= 20 },
          { theme: 'theme-apex',  name: 'Grandmaster Crown',  desc: 'Blinding platinum crown',       minLevel: 30, color: '#e2e8f0', unlocked: memberLevel >= 30 },
        ] as const;

        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 24, animation: 'fadeInOverlay 0.25s ease' }}
            onClick={() => setXpModalOpen(false)}
          >
            {/* Paragon CSS injected once */}
            <style>{`
              .prg-ring-base { position:absolute; border-radius:50%; pointer-events:none; z-index:2; -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite:destination-out; mask-composite:exclude; transition:all 1s; }
              .prg-ring-glow { position:absolute; border-radius:50%; pointer-events:none; z-index:3; transition:all 1s; }
              .prg-ornaments { position:absolute; inset:-10px; pointer-events:none; z-index:4; }
              .prg-ornaments div { position:absolute; transition:all 1s; }
              .prg-orbit { position:absolute; inset:-4px; z-index:5; }
              .prg-spark { position:absolute; top:0; left:50%; border-radius:50%; transform:translate(-50%,-50%); }
              @keyframes prg-spin { 100%{ transform:rotate(360deg); } }
              @keyframes prg-spin-r { 100%{ transform:rotate(-360deg); } }
              @keyframes prg-float { 0%{transform:translate(-50%,-50%)} 100%{transform:translate(-50%,-65%)} }
              @keyframes prg-pulse { 0%{opacity:0.7;transform:scale(0.95)} 100%{opacity:1;transform:scale(1.05)} }
              /* EMBER */
              .prg-ember .prg-ring-base { inset:-4px; padding:3px; background:conic-gradient(from 0deg,#854d0e,#fde047,#ca8a04,#854d0e,#fde047,#ca8a04,#854d0e) border-box; animation:prg-spin 10s linear infinite; }
              .prg-ember .prg-ring-glow { inset:-4px; border:1px solid rgba(253,224,71,0.4); box-shadow:inset 0 0 6px #000,0 4px 12px rgba(0,0,0,0.8); }
              .prg-ember .prg-ot,.prg-ember .prg-ob,.prg-ember .prg-ol,.prg-ember .prg-or { width:8px; height:8px; border-radius:50%; background:radial-gradient(circle,#fde047,#ca8a04,#854d0e); box-shadow:0 2px 4px rgba(0,0,0,1),inset 0 1px 1px rgba(255,255,255,0.8); border:1px solid #333; }
              .prg-ember .prg-ot { top:0; left:50%; transform:translate(-50%,-50%); }
              .prg-ember .prg-ob { bottom:0; left:50%; transform:translate(-50%,50%); }
              .prg-ember .prg-ol { left:0; top:50%; transform:translate(-50%,-50%); }
              .prg-ember .prg-or { right:0; top:50%; transform:translate(50%,-50%); }
              /* FROST */
              .prg-frost .prg-ring-base { inset:-6px; padding:4px; background:conic-gradient(from 0deg,#9ca3af,#fff,#e0f2fe,#0ea5e9,#9ca3af,#fff,#e0f2fe,#0ea5e9,#9ca3af) border-box; animation:prg-spin 8s linear infinite; }
              .prg-frost .prg-ring-glow { inset:-6px; border:1px solid #e0f2fe; box-shadow:0 0 16px rgba(14,165,233,0.6),inset 0 0 12px #0284c7; }
              .prg-frost .prg-ot { top:0; left:50%; transform:translate(-50%,-50%) rotate(45deg); width:14px; height:14px; background:linear-gradient(135deg,#fff,#0ea5e9,#0284c7); border:1px solid #fff; box-shadow:0 0 12px #0ea5e9; }
              .prg-frost .prg-ob { bottom:0; left:50%; transform:translate(-50%,50%) rotate(45deg); width:10px; height:10px; background:linear-gradient(135deg,#fff,#0ea5e9,#0284c7); border:1px solid #fff; }
              .prg-frost .prg-orbit { animation:prg-spin 4s linear infinite; }
              .prg-frost .prg-spark { width:4px; height:4px; background:#fff; box-shadow:0 0 8px #fff,0 0 16px #0ea5e9; }
              /* VOID */
              .prg-void .prg-ring-base { inset:-7px; padding:6px; background:conic-gradient(from 0deg,#111,#3b0764,#111,#581c87,#111) border-box; }
              .prg-void .prg-ring-glow { inset:-3px; border:2px dashed #a855f7; animation:prg-spin-r 12s linear infinite; opacity:0.8; box-shadow:0 0 20px #7e22ce,inset 0 0 10px #3b0764; }
              .prg-void .prg-ot { top:0; left:50%; transform:translate(-50%,-50%); width:18px; height:18px; border-radius:50%; background:radial-gradient(circle at 30% 30%,#f3e8ff,#a855f7,#581c87); box-shadow:0 0 24px #a855f7,inset 0 0 8px #000; border:2px solid #3b0764; animation:prg-pulse 2s infinite alternate; }
              .prg-void .prg-ob { bottom:0; left:50%; transform:translate(-50%,50%); width:10px; height:10px; border-radius:50%; background:#a855f7; box-shadow:0 0 12px #a855f7; }
              .prg-void .prg-ol { left:0; top:50%; transform:translate(-50%,-50%); width:4px; height:14px; border-radius:2px; background:#7e22ce; }
              .prg-void .prg-or { right:0; top:50%; transform:translate(50%,-50%); width:4px; height:14px; border-radius:2px; background:#7e22ce; }
              .prg-void .prg-orbit { animation:prg-spin 5s linear infinite; }
              .prg-void .prg-spark { width:6px; height:6px; background:#d8b4fe; box-shadow:0 0 16px #a855f7; animation:prg-pulse 1s infinite alternate; }
              /* BLOOD */
              .prg-blood .prg-ring-base { inset:-8px; padding:7px; background:conic-gradient(from 0deg,#000,#450a0a,#000,#7f1d1d,#000) border-box; }
              .prg-blood .prg-ring-glow { inset:-7px; border:1px solid #fca5a5; box-shadow:0 0 24px #b91c1c,inset 0 0 16px #ef4444; opacity:0.8; }
              .prg-blood .prg-ot { top:-2px; left:50%; transform:translate(-50%,-50%) rotate(45deg); width:22px; height:22px; background:radial-gradient(circle at 30% 30%,#fca5a5,#dc2626,#7f1d1d); border:2px solid #450a0a; box-shadow:0 0 24px #ef4444,inset 0 0 8px #000; }
              .prg-blood .prg-ob { bottom:-2px; left:50%; transform:translate(-50%,50%) rotate(45deg); width:14px; height:14px; background:#dc2626; border:1px solid #fca5a5; box-shadow:0 0 12px #ef4444; }
              .prg-blood .prg-orbit { animation:prg-spin-r 3s linear infinite; }
              .prg-blood .prg-spark { background:#fca5a5; box-shadow:0 0 16px #ef4444,0 0 32px #b91c1c; border-radius:0; width:3px; height:20px; }
              /* APEX */
              .prg-apex .prg-ring-base { inset:-8px; padding:6px; background:conic-gradient(from 0deg,#fff,#fde047,#9ca3af,#fff,#fde047,#9ca3af,#fff) border-box; animation:prg-spin 3s linear infinite; }
              .prg-apex .prg-ring-glow { inset:-8px; border:2px solid rgba(255,255,255,0.8); box-shadow:0 0 32px rgba(255,255,255,0.9),inset 0 0 20px #fde047; }
              .prg-apex .prg-ot { top:-2px; left:50%; transform:translate(-50%,-50%) rotate(45deg); animation:prg-float 2s ease-in-out infinite alternate; width:26px; height:26px; background:radial-gradient(circle at 30% 30%,#fff 0%,#fde047 40%,#ca8a04 100%); border:2px solid #fff; box-shadow:0 0 40px #fff,inset 0 0 12px rgba(255,255,255,1); }
              .prg-apex .prg-ob { bottom:0; left:50%; transform:translate(-50%,50%); width:16px; height:16px; border-radius:50%; background:#fde047; box-shadow:0 0 24px #fff; border:2px solid #fff; }
              .prg-apex .prg-ol { left:0; top:50%; transform:translate(-50%,-50%) rotate(45deg); width:14px; height:14px; background:#fff; box-shadow:0 0 20px #fff,0 0 32px #fde047; }
              .prg-apex .prg-or { right:0; top:50%; transform:translate(50%,-50%) rotate(45deg); width:14px; height:14px; background:#fff; box-shadow:0 0 20px #fff,0 0 32px #fde047; }
              .prg-apex .prg-orbit { animation:prg-spin 6s linear infinite; }
              .prg-apex .prg-spark { width:8px; height:8px; background:#fff; box-shadow:0 0 20px #fff,0 0 40px #fde047; }
            `}</style>

            <div
              style={{
                width: '100%', maxWidth: 480,
                background: 'linear-gradient(180deg,#0a0908 0%,#030303 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 40px 80px -16px rgba(0,0,0,1)',
                display: 'flex', flexDirection: 'column',
                maxHeight: '85vh', overflow: 'hidden',
                animation: 'modalSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div style={{ textAlign: 'center', padding: '12px 24px 8px' }}>
                <div style={{ width: 36, height: 4, background: '#2a2a2a', borderRadius: 2, margin: '0 auto' }} />
              </div>

              {/* Header: portrait + current ring + level */}
              <div style={{ padding: '16px 24px 20px', display: 'flex', alignItems: 'center', gap: 20, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Large portrait with active paragon ring */}
                <div className={`prg-${currentTheme.replace('theme-', '')}`} style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid #000', zIndex: 1 }}>
                    {pfp
                      ? <img src={pfp} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="PFP" />
                      : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%,#2A2A2A,#0D0D0D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>{initials}</div>
                    }
                  </div>
                  <div className="prg-ring-base" />
                  <div className="prg-ring-glow" />
                  <div className="prg-ornaments">
                    <div className="prg-ot" /><div className="prg-ob" /><div className="prg-ol" /><div className="prg-or" />
                    <div className="prg-orbit"><div className="prg-spark" /></div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)", fontSize: 13, fontWeight: 900, color: '#000', background: 'linear-gradient(135deg,#C8A24C,#FFD700)', padding: '2px 8px', borderRadius: 6 }}>
                      LV{memberLevel}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lvl.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>{memberXP.toLocaleString()} XP total · {Math.max(0, lvl.xpForNext - memberXP).toLocaleString()} to next</div>
                  {/* XP bar */}
                  <div style={{ height: 8, borderRadius: 4, background: '#0a0a0a', overflow: 'hidden', border: '1px solid #1a1a1a' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${Math.max(lvl.progress * 100, 1.5)}%`, background: 'linear-gradient(90deg,#6B4A00,#C8A24C 40%,#FFD700 70%,#FFF8DC 85%,#FFD700 100%)', backgroundSize: '300% 100%', animation: 'xp-shimmer 2s linear infinite', boxShadow: '0 0 8px rgba(255,215,0,0.4)', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                </div>
              </div>

              {/* Paragon Portraits list */}
              <div style={{ padding: '16px 0', overflowY: 'auto', flex: 1 }}>
                <div style={{ padding: '0 24px 12px', fontSize: 11, fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Paragon Portraits
                </div>

                {PARAGON_TIERS.map(tier => {
                  const themeKey = tier.theme.replace('theme-', '') as 'ember' | 'frost' | 'void' | 'blood' | 'apex';
                  const isActive = tier.theme === currentTheme;
                  return (
                    <div key={tier.name} style={{
                      display: 'flex', alignItems: 'center', gap: 18, padding: '14px 24px',
                      background: isActive ? `${tier.color}08` : 'transparent',
                      borderTop: isActive ? `1px solid ${tier.color}20` : '1px solid transparent',
                      borderBottom: isActive ? `1px solid ${tier.color}20` : '1px solid transparent',
                      opacity: tier.unlocked ? 1 : 0.35,
                      transition: 'all 0.3s',
                    }}>
                      {/* Mini portrait with ring */}
                      <div className={`prg-${themeKey}`} style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid #000', zIndex: 1 }}>
                          {pfp
                            ? <img src={pfp} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                            : <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at 35% 30%,#2A2A2A,#0D0D0D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{initials}</div>
                          }
                        </div>
                        <div className="prg-ring-base" />
                        <div className="prg-ring-glow" />
                        <div className="prg-ornaments">
                          <div className="prg-ot" /><div className="prg-ob" /><div className="prg-ol" /><div className="prg-or" />
                          {['frost','void','blood','apex'].includes(themeKey) && <div className="prg-orbit"><div className="prg-spark" /></div>}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: tier.unlocked ? '#fff' : '#555', marginBottom: 3 }}>{tier.name}</div>
                        <div style={{ fontSize: 12, color: '#57534e', lineHeight: 1.3 }}>{tier.desc}</div>
                      </div>

                      {/* Status badge */}
                      <div style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        background: isActive ? `${tier.color}20` : tier.unlocked ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? tier.color : tier.unlocked ? '#a8a29e' : '#333',
                        border: isActive ? `1px solid ${tier.color}40` : '1px solid rgba(255,255,255,0.06)',
                        flexShrink: 0,
                      }}>
                        {isActive ? 'Active' : tier.unlocked ? `LV${tier.minLevel}` : `LV${tier.minLevel}`}
                      </div>
                    </div>
                  );
                })}

                {/* XP earn quick ref */}
                <div style={{ margin: '16px 24px 0', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Earn XP</div>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    {[
                      { xp: '+10', label: 'Check-in' },
                      { xp: '+75', label: 'Bronze' },
                      { xp: '+100', label: 'Silver' },
                      { xp: '+150', label: 'Gold' },
                      { xp: '+500', label: 'Win' },
                    ].map(item => (
                      <div key={item.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#e8af34', fontFamily: "var(--font-display,'Cabinet Grotesk',system-ui)" }}>{item.xp}</div>
                        <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Close */}
              <div style={{ padding: '12px 24px 0' }}>
                <button onClick={() => setXpModalOpen(false)} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a8a29e', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Global biometric registration prompt overlay */}
      {showPasskeySetup && supportsPasskey && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10000, padding: 24,
        }} onClick={() => setShowPasskeySetup(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#111", borderRadius: 20, padding: "32px 24px",
            maxWidth: 340, width: "100%", textAlign: "center",
            border: "1px solid #1A1A1A",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 16px", display: "block" }}>
              <circle cx="12" cy="8" r="5"/>
              <path d="M3 21v-2a7 7 0 0 1 7-7h0"/>
              <path d="M16 18l2 2 4-4"/>
            </svg>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#F0F0F0", margin: "0 0 8px" }}>Enable Biometrics?</h3>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 24px", lineHeight: 1.5 }}>
              Sign in instantly next time with biometrics.
            </p>
            <button
              onClick={handlePasskeyRegister}
              disabled={passkeyRegistering}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, width: "100%", padding: "13px", borderRadius: 12,
                background: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 14,
                border: "none", cursor: "pointer", marginBottom: 10,
                opacity: passkeyRegistering ? 0.7 : 1,
              }}
            >
              {passkeyRegistering ? "Setting up\u2026" : "Enable Biometrics"}
            </button>
            <button
              onClick={() => setShowPasskeySetup(false)}
              style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", padding: "8px" }}
            >
              Not now
            </button>
          </div>
        </div>
      )}

      {milestoneOverlay && (
        <BeltMilestoneOverlay
          badge={milestoneOverlay}
          onDismiss={() => setMilestoneOverlay(null)}
        />
      )}

      <div className="app-content">
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen" style={{ background: '#0A0A0A' }}>
            <div className="w-8 h-8 border-[3px] border-[#1A1A1A] border-t-[#C8A24C] rounded-full animate-spin" />
          </div>
        }>
          <Switch>
            <Route path="/"          component={HomePage} />

            <Route path="/calendar"  component={CalendarPage} />
            <Route path="/stats"     component={StatsPage} />
            <Route path="/belt"      component={BeltJourneyPage} />
            <Route path="/chat"      component={ChatPage} />
            <Route path="/schedule"  component={SchedulePage} />
            <Route path="/sauna"     component={SaunaPage} />
            <Route path="/waiver"    component={WaiverPage} />
            <Route path="/book"      component={BookingPage} />
            <Route path="/games"     component={GamesPage} />
            <Route path="/leaderboard" component={LeaderboardPage} />
            <Route path="/achievements" component={AchievementsPage} />
            <Route path="/live"      component={LivePage} />
            <Route path="/history"   component={CheckInHistoryPage} />
            <Route path="/season"    component={SeasonPage} />
            <Route path="/more"      component={MorePage} />
            <Route path="/account"    component={AccountPage} />
            <Route path="/messages"  component={MessagesPage} />
            <Route path="/admin"     component={AdminGuard} />
            <Route path="/reset"     component={ResetPasswordPage} />
            <Route path="/academy-stats"><Redirect to="/stats" /></Route>
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </div>
      <TabBar />
      {/* Global level-up overlay */}
      {levelUpState && (
        <LevelUpOverlay
          newLevel={levelUpState.newLevel}
          prevLevel={levelUpState.prevLevel}
          beltColor={member?.belt === 'black' ? '#C8A24C' : member?.belt === 'blue' ? '#1A5DAB' : member?.belt === 'purple' ? '#7E3AF2' : member?.belt === 'brown' ? '#92400E' : '#C8A24C'}
          memberName={member?.name}
          onDismiss={() => setLevelUpState(null)}
        />
      )}
    </div>
    </NotificationProvider>
  );
}

function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Deep link + background resume handler (Capacitor native only)
  useEffect(() => {
    let appUrlListener: any = null;
    let appStateListener: any = null;

    const setupCapacitorListeners = async () => {
      try {
        const { App: CapApp } = await import('@capacitor/app');

        // Deep link handler — open the app at the correct route
        appUrlListener = await CapApp.addListener('appUrlOpen', ({ url }) => {
          const slug = url.split('labyrinth://').pop() || url.split('vision.labyrinth.app').pop();
          if (slug && slug !== '/') {
            window.location.hash = slug.startsWith('/') ? '#' + slug : '#/' + slug;
          }
        });

        // Background resume — silently refresh profile when app comes to foreground
        // NEVER log out here — network hiccups, GAS cold starts (22s+), or brief
        // validation failures must not boot the user mid-session.
        appStateListener = await CapApp.addListener('appStateChange', async ({ isActive }) => {
          if (isActive) {
            const token = localStorage.getItem('lbjj_session_token');
            if (token) {
              try {
                const { gasCall } = await import('@/lib/api');
                const res = await gasCall('validateSession', { token });
                if (res?.valid || res?.success) {
                  // Session confirmed — optionally refresh profile silently
                  // (non-critical, errors are swallowed)
                } else if (res?.member) {
                  // GAS returned a fresh profile but flagged token stale — just update
                  // profile data, keep the session alive
                }
                // If res is falsy/error: keep session intact, will re-validate on
                // next explicit user action
              } catch {
                // Network error or GAS cold start — leave session intact
              }
            }
          }
        });
      } catch {
        // Not running in Capacitor — ignore
      }
    };

    setupCapacitorListeners();

    return () => {
      appUrlListener?.remove?.();
      appStateListener?.remove?.();
    };
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={(props: any) => (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0A0A0A', padding: 40, textAlign: 'center',
      }}>
        <p style={{ fontSize: 16, color: '#F0F0F0', marginBottom: 8, fontWeight: 600 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 11, color: '#E05252', marginBottom: 8, fontFamily: 'monospace', maxWidth: 320, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {props?.error?.message || props?.error?.toString() || 'Unknown error'}
        </p>
        {props?.componentStack && (
          <p style={{ fontSize: 9, color: '#666', marginBottom: 8, fontFamily: 'monospace', maxWidth: 340, wordBreak: 'break-word', whiteSpace: 'pre-wrap', textAlign: 'left', maxHeight: 120, overflow: 'auto' }}>
            {props.componentStack.slice(0, 500)}
          </p>
        )}
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          Try reloading the app.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 24px', background: '#C8A24C', color: '#0A0A0A', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
        >
          Reload
        </button>
      </div>
    )
    }>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          {isOffline && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
              background: '#1A1A1A', borderBottom: '1px solid #333',
              padding: '8px 16px', textAlign: 'center', fontSize: 13, color: '#888',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
              </svg>
              No internet connection — some features unavailable
            </div>
          )}
          <AuthProvider>
            <DMProvider>
              <GuestProfileProvider>
                <GameRecordProvider>
                  <ChunkErrorBoundary>
                    <Router hook={useHashLocation}>
                      <AppShell />
                    </Router>
                  </ChunkErrorBoundary>
                </GameRecordProvider>
              </GuestProfileProvider>
            </DMProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
const LABYRINTH_APP_BUILD = '2.2.0-stable-no-hash-loc'; export { LABYRINTH_APP_BUILD };
