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
import NotFound from "@/pages/not-found";
import { Home, Calendar, MessageCircle, Clock, MoreHorizontal, Award, ShieldCheck } from "lucide-react";
import { useEffect, useCallback } from "react";
import { useHashLocation as useHashLoc } from "wouter/use-hash-location";

// ─── Tab bar ──────────────────────────────────────────────────────

function TabBar() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();

  const tabs = [
    { path: "/",        icon: Home,          label: "Home"     },
    { path: "/chat",    icon: MessageCircle, label: "Chat"     },
    { path: "/belt",    icon: Award,         label: "Belts"    },
    { path: "/schedule",icon: Clock,         label: "Schedule" },
    { path: "/more",    icon: MoreHorizontal,label: "More"     },
    // Admin tab — only visible to admin/owner/coach
    ...(isAdmin ? [{ path: "/admin", icon: ShieldCheck, label: "Admin" }] : []),
  ];

  const hiddenPaths = ["/waiver", "/book"];
  if (hiddenPaths.some(p => location.startsWith(p))) return null;

  return (
    <nav className="tab-bar" data-testid="tab-bar">
      {tabs.map(tab => {
        const isActive = tab.path === "/" ? location === "/" : location.startsWith(tab.path);
        const Icon = tab.icon;
        return (
          <a
            key={tab.path}
            href={`/#${tab.path}`}
            className={`tab-item ${isActive ? "active" : ""}`}
            data-testid={`tab-${tab.label.toLowerCase()}`}
            style={tab.path === "/admin" ? { color: isActive ? "#C8A24C" : "#888" } : undefined}
          >
            <Icon size={22} strokeWidth={isActive ? 2.2 : 1.5} />
            <span>{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

// ─── More page ────────────────────────────────────────────────────

function MorePage() {
  const { logout, isAdmin } = useAuth();

  const items = [
    { href: "/#/games",   icon: "🎮", label: "Games",            desc: "Challenge your teammates" },
    { href: "/#/sauna",   icon: "🧖", label: "Sauna Dashboard",  desc: "Check in/out, active sessions" },
    { href: "/#/stats",   icon: "📊", label: "Academy Stats",    desc: "Rankings, athletes, jits.gg" },
    { href: "/#/calendar",icon: "🏆", label: "Tournament Calendar", desc: "Events and registrations" },
    { href: "/#/book",    icon: "📅", label: "Book Trial Class",  desc: "Schedule a free trial" },
    { href: "/#/waiver",  icon: "📝", label: "Waiver & Agreement",desc: "Sign or review documents" },
    ...(isAdmin ? [{ href: "/#/admin", icon: "🛡️", label: "Admin Panel", desc: "Member management, stats, notes" }] : []),
  ];

  return (
    <div className="app-content">
      <div className="px-5 pt-4 pb-3" style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>More</h1>
      </div>
      <div className="px-5 pb-6 space-y-2">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.href}
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

        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: "#F0F0F0" }}>Labyrinth BJJ</h3>
          <div className="space-y-1.5 text-xs" style={{ color: "#999" }}>
            <p>Fulshear, TX</p>
            <a href="https://labyrinth.vision" target="_blank" rel="noopener noreferrer" style={{ color: "#C8A24C" }}>
              labyrinth.vision
            </a>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full mt-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
          style={{ backgroundColor: "rgba(224, 85, 85, 0.08)", color: "#E05555", border: "1px solid rgba(224, 85, 85, 0.15)" }}
          data-testid="button-logout-more"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Admin page wrapper (route → component, back = navigate away) ─

function AdminPageWrapper() {
  const [, navigate] = useHashLoc();
  return <AdminPage onBack={() => navigate("/")} />;
}

// ─── Keyboard shortcut: Ctrl+Shift+A → open admin panel ──────────

function AdminShortcut() {
  const { isAdmin, isAuthenticated } = useAuth();
  const [, navigate] = useHashLoc();

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === "A") {
      e.preventDefault();
      if (isAuthenticated && isAdmin) {
        navigate("/admin");
      } else if (!isAuthenticated) {
        // Trigger a visible hint only in dev; in prod silently ignore
        console.info("[Admin] Not authenticated — sign in first.");
      }
    }
  }, [isAdmin, isAuthenticated, navigate]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return null;
}

// ─── Authenticated app shell ──────────────────────────────────────

function AuthenticatedApp() {
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
                <AuthenticatedApp />
              </Router>
            </GameRecordProvider>
          </GuestProfileProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
