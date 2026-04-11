import { Switch, Route, Router, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { GuestProfileProvider } from "@/lib/guest-profile";
import { GameRecordProvider } from "@/lib/game-records";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import CalendarPage from "@/pages/CalendarPage";
import StatsPage from "@/pages/StatsPage";
import SchedulePage from "@/pages/SchedulePage";
import SaunaPage from "@/pages/SaunaPage";
import WaiverPage from "@/pages/WaiverPage";
import BookingPage from "@/pages/BookingPage";
import BeltJourneyPage from "@/pages/BeltJourneyPage";
import ChatPage from "@/pages/ChatPage";
import GamesPage from "@/pages/GamesPage";
import AdminPage from "@/pages/AdminPage";
import MessagesPage from "@/pages/MessagesPage";

import NotFound from "@/pages/not-found";
import {
  Home, MessageCircle, CalendarDays, MoreHorizontal, Award,
  Gamepad2, BarChart2, Trophy, Thermometer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { useHashLocation as useHashLoc } from "wouter/use-hash-location";
import { Redirect } from "wouter";

// ─── Nav config ───────────────────────────────────────────────────

const NAV_STORAGE_KEY = 'lbjj_nav_config_v1';

// Each option maps to a Lucide icon (or null = use emoji fallback)
type NavOption = {
  path: string;
  label: string;
  Icon: LucideIcon | null;
  emoji: string; // fallback when no Lucide icon
};

const ALL_NAV_OPTIONS: NavOption[] = [
  { path: '/',         label: 'Home',     Icon: Home,           emoji: '🏠' },
  { path: '/chat',     label: 'Chat',     Icon: MessageCircle,  emoji: '💬' },
  { path: '/belt',     label: 'Belts',    Icon: Award,          emoji: '🥋' },
  { path: '/schedule', label: 'Schedule', Icon: CalendarDays,   emoji: '📅' },
  { path: '/more',     label: 'More',     Icon: MoreHorizontal, emoji: '⋯'  },
  { path: '/games',    label: 'Games',    Icon: Gamepad2,       emoji: '🎮' },
  { path: '/stats',    label: 'Stats',    Icon: BarChart2,      emoji: '📊' },
  { path: '/calendar', label: 'Events',   Icon: Trophy,         emoji: '🏆' },
  { path: '/sauna',    label: 'Sauna',    Icon: Thermometer,    emoji: '🧖' },
];

const DEFAULT_NAV_PATHS = ['/', '/chat', '/belt', '/schedule', '/more'];

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
        <span className="text-xl">🔧</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium" style={{ color: '#F0F0F0' }}>Customize Nav</p>
          <p className="text-xs" style={{ color: '#666' }}>Choose what appears in the bottom bar</p>
        </div>
      </button>

      {open && (
        <div style={{ backgroundColor: '#111', border: '1px solid #1A1A1A', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px 16px' }}>
          {slots.map((path, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#555', fontSize: 12, width: 16, flexShrink: 0 }}>#{i + 1}</span>
              <select
                value={path}
                onChange={e => { const n = [...slots]; n[i] = e.target.value; setSlots(n); }}
                style={{ flex: 1, backgroundColor: '#0D0D0D', border: '1px solid #222', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#F0F0F0', outline: 'none' }}
              >
                {ALL_NAV_OPTIONS.map(o => (
                  <option key={o.path + o.label} value={o.path}>{o.emoji} {o.label}</option>
                ))}
              </select>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setSlots([...DEFAULT_NAV_PATHS])} style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #333', borderRadius: 8, color: '#666', fontSize: 12, cursor: 'pointer' }}>Reset</button>
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useHashLoc();

  // Profile picture state
  const [profilePic, setProfilePic] = useState<string | null>(() => {
    try { return localStorage.getItem("lbjj_profile_picture"); } catch { return null; }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const save = async () => {
    setSaving(true); setSaved(false); setError("");
    try {
      const { gasCall } = await import("@/lib/api");
      // GAS stub: updateMemberProfile action — backend needs this action
      await gasCall("updateMemberProfile", { memberEmail: member?.email, name: editName, phone });
      // Update localStorage profile
      const stored = localStorage.getItem("lbjj_member_profile");
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          profile.Name = editName;
          profile.Phone = phone;
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
            style={{
              width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
              background: profilePic ? "none" : beltColor,
              color: ["white","yellow","grey"].includes((member?.belt||"").toLowerCase()) ? "#0A0A0A" : "#fff",
              fontSize: 30, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 4px ${beltColor}30, 0 0 30px ${beltColor}20`,
              position: "relative",
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
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555", margin: "0 0 4px" }}>Email <span style={{ color: "#444", fontSize: 9, fontWeight: 400 }}>(cannot be changed)</span></p>
              <p style={{ fontSize: 15, color: "#999", margin: 0 }}>{member?.email || "\u2014"}</p>
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
            {/* Read-only fields */}
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
  const { logout, isAdmin } = useAuth();

  const sections = [
    {
      label: 'Train',
      items: [
        { href: '/#/games',    icon: '🎮', label: 'Games',               desc: 'Challenge your teammates'       },
        { href: '/#/schedule', icon: '📅', label: 'Class Schedule',       desc: 'View and bookmark classes'      },
      ]
    },
    {
      label: 'Manage',
      items: [
        { href: '/#/sauna',    icon: '🧖', label: 'Sauna Dashboard',     desc: 'Check in/out, active sessions'  },
        { href: '/#/stats',    icon: '📊', label: 'Academy Stats',       desc: 'Rankings, athletes, jits.gg'    },
        { href: '/#/calendar', icon: '🏆', label: 'Tournament Calendar', desc: 'Events and registrations'       },
      ]
    },
    {
      label: 'Account',
      items: [
        { href: '/#/account',  icon: '👤', label: 'My Account',         desc: 'Edit your phone number and info'  },
      ]
    },
    {
      label: 'Documents',
      items: [
        { href: '/#/book',     icon: '📅', label: 'Book Trial Class',    desc: 'Schedule a free trial'          },
        { href: '/#/waiver',   icon: '📝', label: 'Waiver & Agreement',  desc: 'Sign or review documents'       },
      ]
    },
    ...(isAdmin ? [{
      label: 'Admin',
      items: [
        { href: '/#/messages', icon: '📨', label: 'Message Blast',       desc: 'Email or text all members'      },
        { href: '/#/admin',    icon: '🛡️', label: 'Admin Panel',         desc: 'Member management & stats'      },
      ]
    }] : []),
  ];

  return (
    <div className="app-content">
      <div className="px-5 pt-4 pb-3" style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>More</h1>
      </div>
      <div className="px-5 pb-6">
        {sections.map((section, si) => (
          <div key={section.label}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', padding: '20px 0 8px', paddingTop: si === 0 ? '4px' : '20px' }}>
              {section.label}
            </div>
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <a key={i} href={item.href}
                  className="flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "#F0F0F0" }}>{item.label}</p>
                    <p className="text-xs" style={{ color: "#666" }}>{item.desc}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#F0F0F0" }}>Labyrinth BJJ</h3>
          <div className="space-y-1.5 text-xs" style={{ color: "#999" }}>
            <p>Fulshear, TX</p>
            <a href="https://labyrinth.vision" target="_blank" rel="noopener noreferrer" style={{ color: "#C8A24C" }}>labyrinth.vision</a>
          </div>
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
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!token) { setError('Invalid reset link'); return; }
    setLoading(true); setError('');
    try {
      const GAS_URL = 'https://script.google.com/macros/s/AKfycbwkxkV6XlqKy3DDot_MTfb40WeAfd6KMgBwgcrCNStEFM5vcAQNYG9eR2OOFpCwJ3AJ/exec';
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
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"
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
              <a href="/#/" style={{ color: '#666', fontSize: 12 }}>Back to sign in</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Admin wrappers ───────────────────────────────────────────────

function AdminPageWrapper() {
  const [, navigate] = useHashLoc();
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

function AppShell() {
  const { isAuthenticated } = useAuth();
  const [location] = useHashLoc();

  // Reset password page is public — show without auth check
  if (location.startsWith('/reset')) {
    return (
      <div className="app-shell">
        <ResetPasswordPage />
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

  return (
    <div className="app-shell">
      <AdminShortcut />
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
        <Route path="/more"      component={MorePage} />
        <Route path="/account"    component={AccountPage} />
        <Route path="/messages"  component={MessagesPage} />
        <Route path="/admin"     component={AdminPageWrapper} />
        <Route path="/reset"     component={ResetPasswordPage} />
        <Route path="/academy-stats"><Redirect to="/stats" /></Route>
        <Route component={NotFound} />
      </Switch>
      <TabBar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
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
  );
}

export default App;
