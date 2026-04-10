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
  ShieldCheck, Send, Gamepad2, BarChart2, Trophy, Thermometer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { useHashLocation as useHashLoc } from "wouter/use-hash-location";

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
  const { isAdmin } = useAuth();
  const [navPaths, setNavPaths] = useState<string[]>(getNavConfig);

  useEffect(() => {
    const handler = () => setNavPaths(getNavConfig());
    window.addEventListener('navConfigChanged', handler);
    return () => window.removeEventListener('navConfigChanged', handler);
  }, []);

  const hiddenPaths = ["/waiver", "/book"];
  if (hiddenPaths.some(p => location.startsWith(p))) return null;

  // Build tab list from saved paths
  const tabs = navPaths.map(path => {
    const opt = ALL_NAV_OPTIONS.find(o => o.path === path) || ALL_NAV_OPTIONS[0];
    return opt;
  });

  // Admin tabs always appended at end
  const adminExtras: NavOption[] = isAdmin ? [
    { path: '/messages', label: 'Blast', Icon: Send,        emoji: '📨' },
    { path: '/admin',    label: 'Admin', Icon: ShieldCheck, emoji: '🛡️' },
  ] : [];

  const allTabs = [...tabs, ...adminExtras];

  return (
    <nav className="tab-bar" data-testid="tab-bar">
      {allTabs.map(tab => {
        const isActive = tab.path === '/' ? location === '/' : location.startsWith(tab.path);
        const isAdminTab = tab.path === '/admin' || tab.path === '/messages';
        const Icon = tab.Icon;
        return (
          <a
            key={tab.path + tab.label}
            href={`/#${tab.path}`}
            className={`tab-item ${isActive ? 'active' : ''}`}
            data-testid={`tab-${tab.label.toLowerCase()}`}
            style={isAdminTab ? { color: isActive ? '#C8A24C' : '#888' } : undefined}
          >
            {Icon
              ? <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
              : <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
            }
            <span>{tab.label}</span>
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

function MorePage() {
  const { logout, isAdmin } = useAuth();

  const items = [
    { href: "/#/games",    icon: "🎮", label: "Games",               desc: "Challenge your teammates"        },
    { href: "/#/sauna",    icon: "🧖", label: "Sauna Dashboard",     desc: "Check in/out, active sessions"   },
    { href: "/#/stats",    icon: "📊", label: "Academy Stats",       desc: "Rankings, athletes, jits.gg"     },
    { href: "/#/calendar", icon: "🏆", label: "Tournament Calendar", desc: "Events and registrations"        },
    { href: "/#/book",     icon: "📅", label: "Book Trial Class",    desc: "Schedule a free trial"           },
    { href: "/#/waiver",   icon: "📝", label: "Waiver & Agreement",  desc: "Sign or review documents"        },
    ...(isAdmin ? [
      { href: "/#/messages", icon: "📨", label: "Message Blast", desc: "Email or text all members"         },
      { href: "/#/admin",    icon: "🛡️", label: "Admin Panel",   desc: "Member management, stats, notes"  },
    ] : []),
  ];

  return (
    <div className="app-content">
      <div className="px-5 pt-4 pb-3" style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>More</h1>
      </div>
      <div className="px-5 pb-6 space-y-2">
        {items.map((item, i) => (
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
        <NavCustomizer />
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
        <Route path="/messages"  component={MessagesPage} />
        <Route path="/admin"     component={AdminPageWrapper} />
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
