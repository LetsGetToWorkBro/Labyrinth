// v2.1.0 — Apple Wallet integration
import * as Sentry from "@sentry/react";
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

// Eager — needed on first render
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";

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
const NotFound           = lazy(() => import("@/pages/not-found"));
import {
  Home, MessageCircle, CalendarDays, MoreHorizontal,
  Gamepad2, BarChart2, Trophy, Thermometer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { useHashLocation as useHashLoc } from "wouter/use-hash-location";
import { Redirect } from "wouter";
import { gasCall } from "@/lib/api";

// ─── Nav config ───────────────────────────────────────────────────

const NAV_STORAGE_KEY = 'lbjj_nav_config_v1';

// Each option maps to a Lucide icon, custom component, or null = use emoji fallback
type NavOption = {
  path: string;
  label: string;
  Icon: LucideIcon | null;
  emoji: string; // fallback when no Lucide icon
};

const ALL_NAV_OPTIONS: NavOption[] = [
  { path: '/',         label: 'Home',     Icon: Home,           emoji: '🏠' },
  { path: '/chat',     label: 'Chat',     Icon: MessageCircle,  emoji: '💬' },
  { path: '/achievements', label: 'Progress', Icon: Trophy,      emoji: '🏆' },
  { path: '/schedule', label: 'Schedule', Icon: CalendarDays,   emoji: '📅' },
  { path: '/more',     label: 'More',     Icon: MoreHorizontal, emoji: '⋯'  },
  { path: '/games',    label: 'Games',    Icon: Gamepad2,       emoji: '🎮' },
  { path: '/stats',    label: 'Stats',    Icon: BarChart2,      emoji: '📊' },
  { path: '/calendar', label: 'Events',   Icon: Trophy,         emoji: '🏆' },
  { path: '/sauna',    label: 'Sauna',    Icon: Thermometer,    emoji: '🧖' },
];

const DEFAULT_NAV_PATHS = ['/', '/chat', '/achievements', '/schedule', '/more'];

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

function TabBar() {
  const [location] = useLocation();
  const [navPaths, setNavPaths] = useState<string[]>(getNavConfig);

  useEffect(() => {
    const handler = () => setNavPaths(getNavConfig());
    window.addEventListener('navConfigChanged', handler);
    return () => window.removeEventListener('navConfigChanged', handler);
  }, []);

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
    if (!(document as any).startViewTransition) return; // fallback to CSS class
    e.preventDefault();
    document.documentElement.dataset.nav = 'tab';
    (document as any).startViewTransition(() => {
      window.location.hash = `#${path}`;
    });
    setTimeout(() => delete document.documentElement.dataset.nav, 400);
  };

  return (
    <nav className="tab-bar" data-testid="tab-bar">
      {allTabs.map(tab => {
        const isActive = tab.path === '/' ? location === '/' : location.startsWith(tab.path);
        const Icon = tab.Icon;
        return (
          <a
            key={tab.path + tab.label}
            href={`/#${tab.path}`}
            className={`tab-item ${isActive ? 'active' : ''}`}
            data-testid={`tab-${tab.label.toLowerCase()}`}
            onClick={(e) => handleTabClick(e, tab.path)}
          >
            {Icon
              ? <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
              : <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
            }
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
                    {selectedTab.Icon ? <selectedTab.Icon size={16} color="#C8A24C" /> : <span>{selectedTab.emoji}</span>}
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
                          {opt.Icon ? <opt.Icon size={16} color={slots[idx] === opt.path ? '#C8A24C' : '#888'} /> : <span>{opt.emoji}</span>}
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [googleWalletLoading, setGoogleWalletLoading] = useState(false);
  const [, navigate] = useHashLoc();

  // Profile picture state
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try { return localStorage.getItem("lbjj_profile_picture"); } catch { return null; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Badge showcase state
  const [badges, setBadges] = useState<Array<{key: string; label: string; icon: string; color: string; earnedAt: string}>>([]);
  useEffect(() => {
    if (member?.email) {
      gasCall('getMemberBadges', { email: member.email }).then((res: any) => {
        if (res?.badges) setBadges(res.badges);
      }).catch(() => {});
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
    };
    img.src = URL.createObjectURL(file);
  };

  const handleAddToWallet = async () => {
    if (!navigator.onLine) {
      alert('No internet connection. Please connect to generate your pass.');
      return;
    }
    if (walletLoading) return;

    setWalletLoading(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      if (!token) { alert('Please sign in again.'); setWalletLoading(false); return; }
      const passUrl = `https://labyrinth-pass-server-production.up.railway.app/pass/generate?memberToken=${encodeURIComponent(token)}`;
      window.location.href = passUrl;
    } catch (e) {
      alert('Could not generate pass. Please try again.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleAddToGoogleWallet = async () => {
    if (!navigator.onLine) {
      alert('No internet connection. Please connect to generate your pass.');
      return;
    }
    if (googleWalletLoading) return;
    setGoogleWalletLoading(true);
    try {
      const { getToken } = await import("@/lib/api");
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      if (!token) { alert('Please sign in again.'); return; }
      const response = await fetch('https://labyrinth-pass-server-production.up.railway.app/pass/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberToken: token }),
      });
      if (!response.ok) throw new Error('Server error');
      const { saveUrl } = await response.json();
      window.location.href = saveUrl;
    } catch (e) {
      alert('Could not generate Google Wallet pass. Please try again.');
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
      await refreshProfile();
      setSaved(true);
      setEditing(false);
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
        <button onClick={() => navigate("/more")} style={{ background: "none", border: "none", padding: "4px 0", cursor: "pointer", color: "#C8A24C", fontWeight: 600, fontSize: 14 }}>
          &larr; Back
        </button>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0", flex: 1 }}>My Account</h1>
      </div>

      <div className="px-5 pb-6 space-y-4">
        {/* Avatar with photo support */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, paddingBottom: 4 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
              background: profilePic ? "none" : beltColor,
              color: ["white","yellow","grey"].includes((member?.belt||"").toLowerCase()) ? "#0A0A0A" : "#fff",
              fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 4px ${beltColor}30, 0 0 30px ${beltColor}20`,
              position: "relative", cursor: "pointer",
            }}
          >
            {profilePic ? (
              <img src={profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          {/* Change Photo button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "#C8A24C", background: "none", border: "none", cursor: "pointer" }}
          >
            Change Photo
          </button>
          {/* Future enhancement: upload to GAS/Drive */}
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

            {error && <p style={{ fontSize: 13, color: "#E05555", textAlign: "center" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setEditing(false); setEditName(member?.name || ""); setPhone(member?.phone || ""); setError(""); }}
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
              onClick={() => { setEditing(true); setEditName(member?.name || ""); setPhone(member?.phone || ""); }}
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
              onClick={() => { setEditing(true); setEditName(member?.name || ""); setPhone(member?.phone || ""); }}
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
            <div style={{ fontSize: 11, color: '#C8A24C' }}>View All →</div>
          </button>

          {badges.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
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

        <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: 16, marginTop: 8 }}>
          <button
            onClick={logout}
            style={{ width: "100%", padding: 14, borderRadius: 12, background: "rgba(224,85,85,0.08)", color: "#E05555", border: "1px solid rgba(224,85,85,0.15)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}


function MorePage() {
  const { logout, isAdmin, member } = useAuth();
  const morePanelRef = useRef<HTMLDivElement>(null);

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
        { href: '/#/achievements', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>, label: 'Achievements', desc: 'Unlock badges and track your progress' },
        { href: '/#/belt', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M2 8c0 0 4-2 10-2s10 2 10 2"/><path d="M2 16c0 0 4 2 10 2s10-2 10-2"/><rect x="9" y="10" width="6" height="4" rx="1"/></svg>, label: 'Belt Journey', desc: 'Track your progression and submit promotion requests' },
        { href: '/#/history',  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>, label: 'Class History', desc: 'Your attendance record' },
        { href: '/#/games',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M12 12h.01M7 12h.01M17 12h.01M12 8v8"/></svg>, label: 'Games', desc: 'Challenge your teammates' },
        { href: '/#/leaderboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>, label: 'Leaderboard', desc: 'Weekly class attendance rankings' },
        { href: '/#/live', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/><circle cx="19" cy="12" r="2" fill="#C8A24C" stroke="none"/></svg>, label: 'Live & Archive', desc: 'Watch live classes and recordings' },
        { href: '/#/schedule', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: 'Class Schedule', desc: 'View and bookmark classes' },
      ]
    },
    {
      label: 'Manage',
      items: [
        { href: '/#/sauna',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>, label: 'Sauna Dashboard', desc: 'Check in/out, active sessions' },
        { href: '/#/stats',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>, label: 'Academy Stats', desc: 'Rankings, athletes, jits.gg' },
        { href: '/#/calendar', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>, label: 'Tournament Calendar', desc: 'Events and registrations' },
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
        { href: '/#/messages', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>, label: 'Message Blast', desc: 'Email or text all members' },
        { href: '/#/admin',    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: 'Admin Panel', desc: 'Member management & stats' },
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
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: 'transform 80ms cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <path d="M5 3l4 4-4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        ))}
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
        </div>
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #1A1A1A' }}>
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
              background: 'rgba(224,85,85,0.06)',
              border: '1px solid rgba(224,85,85,0.2)',
              borderRadius: 12,
              color: '#E05555',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '11px 16px',
              textAlign: 'center' as const,
              width: '100%',
              display: 'block',
            }}
          >
            Request Account Deletion
          </button>
        </div>
        <button onClick={logout}
          className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
          style={{ backgroundColor: "rgba(224,85,85,0.08)", color: "#E05555", border: "1px solid rgba(224,85,85,0.15)" }}
          data-testid="button-logout-more"
        >
          Sign Out
        </button>
      </div>
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
  const [, navigate] = useHashLoc();

  // Extract token from hash: /#/reset?token=xxx
  const token = new URLSearchParams(window.location.hash.split('?')[1] || '').get('token') || '';

  const submit = async () => {
    if (!password || password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!token) { setError('Invalid reset link'); return; }
    setLoading(true); setError('');
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbwybO9_NBFjSYmpDWVjM0TloiyQl5-oI7UZxgAHDILYHjhez8RUp7ncOgwKLoEHa6kj/exec';
      const payload = JSON.stringify({ action: 'memberConfirmReset', token, newPassword: password });
      const url = GAS_URL + '?action=memberConfirmReset&payload=' + encodeURIComponent(payload);
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
            <p style={{ color: '#4CAF80', marginBottom: 16 }}>✓ Password updated successfully!</p>
            <button onClick={() => navigate('/')} style={{ background: '#C8A24C', color: '#0A0A0A', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}>Sign In</button>
          </div>
        ) : (
          <>
            {error && <p style={{ color: '#E05555', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
                style={{ width: '100%', background: '#0D0D0D', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', color: '#F0F0F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: '#999', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same password again"
                style={{ width: '100%', background: '#0D0D0D', border: '1px solid #222', borderRadius: 10, padding: '12px 14px', color: '#F0F0F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '13px', background: '#C8A24C', color: '#0A0A0A', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Updating…' : 'Set New Password'}
            </button>
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
  const { isAuthenticated, member } = useAuth();
  const [, navigate] = useHashLoc();

  const isAdmin = isAuthenticated && !!(member?.isAdmin ||
    ['owner', 'admin', 'coach', 'instructor'].includes((member?.role || '').toLowerCase()));

  if (!isAuthenticated || !isAdmin) {
    navigate('/');
    return null;
  }

  return <AdminPage onBack={() => navigate("/")} />;
}

function AdminShortcut() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [, navigate] = useHashLoc();
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
async function registerPasskeyGlobal(email: string): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
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
      <button className="bm-dismiss" onClick={onDismiss}>Continue</button>
    </div>
  );
}

function AppShell() {
  const { isAuthenticated, isLoading, member } = useAuth();
  const [location] = useHashLoc();

  // ── Clear game-active attribute on any route change ──────────
  useEffect(() => {
    if (!location.startsWith('/games')) {
      document.body.removeAttribute('data-game-active');
    }
  }, [location]);

  // ── Idle-prefetch top routes ──────────────────────────────────
  useEffect(() => {
    const prefetch = () => {
      import("@/pages/SchedulePage");
      import("@/pages/ChatPage");
      import("@/pages/AchievementsPage");
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 2000 });
    } else {
      setTimeout(prefetch, 1500);
    }
  }, []);

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
  const prevLocation = useRef(location);
  useEffect(() => {
    if (prevLocation.current === location) return;

    // Determine direction
    const tabPaths = ['/', '/chat', '/achievements', '/schedule', '/more', '/games', '/leaderboard', '/live', '/history'];
    const isTab = tabPaths.includes(location) && tabPaths.includes(prevLocation.current);

    const content = document.querySelector('.app-content');
    if (content) {
      const dir = navDirection.current;
      const cls = isTab ? 'page-enter-tab'
        : dir === 'back' ? 'page-enter-back'
        : 'page-enter-forward';
      // Reset direction after use
      navDirection.current = 'forward';
      content.classList.remove('page-enter-forward', 'page-enter-back', 'page-enter-tab');
      content.classList.add(cls);
      const cleanup = () => content.classList.remove(cls);
      content.addEventListener('animationend', cleanup, { once: true });
    }

    prevLocation.current = location;
  }, [location]);

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

  // Reset password page is public — show without auth check
  if (location.startsWith('/reset')) {
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

  if (!isAuthenticated) {
    return (
      <div className="app-shell">
        <LoginPage />
      </div>
    );
  }

  const GOLD = "#C8A24C";

  return (
    <div className="app-shell">
      <AdminShortcut />

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
    </div>
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

        // Background resume — validate session when app comes to foreground
        appStateListener = await CapApp.addListener('appStateChange', async ({ isActive }) => {
          if (isActive) {
            const token = localStorage.getItem('lbjj_session_token');
            if (token) {
              try {
                const { gasCall } = await import('@/lib/api');
                const res = await gasCall('validateSession', { token });
                if (!res?.valid && !res?.success) {
                  localStorage.removeItem('lbjj_session_token');
                  window.location.hash = '#/login';
                }
              } catch {
                // Network error — leave session intact, will retry on next action
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
    <Sentry.ErrorBoundary fallback={
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0A0A0A', padding: 40, textAlign: 'center',
      }}>
        <p style={{ fontSize: 16, color: '#F0F0F0', marginBottom: 8, fontWeight: 600 }}>
          Something went wrong
        </p>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          We've been notified. Try reloading the app.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: '12px 24px', background: '#C8A24C', color: '#0A0A0A', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
        >
          Reload
        </button>
      </div>
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
            <GuestProfileProvider>
              <GameRecordProvider>
                <Router hook={useHashLocation}>
                  <AppShell />
                </Router>
              </GameRecordProvider>
            </GuestProfileProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}

export default App;
// rebuild Tue Apr 14 17:07:30 UTC 2026
