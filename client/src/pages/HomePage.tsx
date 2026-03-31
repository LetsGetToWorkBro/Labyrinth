import { useAuth } from "@/lib/auth-context";
import logoMazeGold from "@assets/maze-gold-md.png";
import { BeltBadge } from "@/components/BeltBadge";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CreditCard, FileText, ChevronRight, LogOut, LogIn } from "lucide-react";
import { memberCreateSetupLink } from "@/lib/api";
import { useState } from "react";
import LoginPage from "./LoginPage";

export default function HomePage() {
  const { member, isAuthenticated, logout } = useAuth();
  const [cardLoading, setCardLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Show login modal
  if (showLogin && !isAuthenticated) {
    return (
      <div className="app-content">
        <LoginPage onBack={() => setShowLogin(false)} />
      </div>
    );
  }

  // Not logged in — show guest home with quick links
  if (!member) {
    return (
      <div className="app-content">
        <ScreenHeader title="Labyrinth BJJ" />

        {/* Logo */}
        <div className="mx-5 mb-4 flex items-center gap-4 p-5 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
          <img src={logoMazeGold} alt="Labyrinth BJJ" style={{ width: 48, height: 48 }} className="flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold" style={{ color: "#F0F0F0" }}>Welcome to Labyrinth BJJ</h2>
            <p className="text-xs mt-0.5" style={{ color: "#666" }}>Fulshear, TX</p>
          </div>
        </div>

        {/* Member Login CTA */}
        <div className="mx-5 mb-4">
          <button
            onClick={() => setShowLogin(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: "rgba(200, 162, 76, 0.1)", color: "#C8A24C", border: "1px solid rgba(200, 162, 76, 0.2)" }}
            data-testid="button-member-login"
          >
            <LogIn size={16} />
            Member Sign In
          </button>
        </div>

        {/* Quick Links */}
        <div className="mx-5 mb-6">
          <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#666" }}>Explore</h3>
          <div className="space-y-1">
            <QuickLink href="/#/belt" icon="🥋" label="Belt Journey" />
            <QuickLink href="/#/schedule" icon="📅" label="Class Schedule" />
            <QuickLink href="/#/calendar" icon="🏆" label="Tournament Calendar" />
            <QuickLink href="/#/stats" icon="📊" label="Academy Stats" />
            <QuickLink href="/#/sauna" icon="🧖" label="Sauna Dashboard" />
            <QuickLink href="/#/book" icon="📆" label="Book a Trial Class" />
            <QuickLink href="/#/games" icon="🎮" label="Games" />
          </div>
        </div>
      </div>
    );
  }

  // Logged in — full member profile
  const hasWarnings = !member.waiverSigned || !member.agreementSigned;

  const handleSetupCard = async () => {
    setCardLoading(true);
    try {
      const result = await memberCreateSetupLink();
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err) {
      console.error(err);
    }
    setCardLoading(false);
  };

  const joinDate = member.joinDate ? new Date(member.joinDate).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  }) : "—";

  return (
    <div className="app-content">
      <ScreenHeader
        title="Home"
        right={
          <button
            onClick={logout}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "#666" }}
            data-testid="button-logout"
          >
            <LogOut size={18} />
          </button>
        }
      />

      {/* Profile Card */}
      <div className="mx-5 rounded-xl p-5 mb-4" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "#F0F0F0" }} data-testid="text-member-name">
              {member.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#666" }}>Member since {joinDate}</p>
          </div>
          <BeltBadge belt={member.belt} size="md" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Plan" value={member.plan || "—"} />
          <InfoItem label="Status" value={member.status || member.membership || "Active"} isStatus />
          <InfoItem label="Email" value={member.email} />
          <InfoItem label="Phone" value={member.phone || "Not set"} />
        </div>
      </div>

      {/* Warning Banners */}
      {hasWarnings && (
        <div className="mx-5 mb-4 space-y-2">
          {!member.waiverSigned && (
            <WarningBanner
              icon={<FileText size={16} />}
              text="Liability waiver not signed"
              action="Sign Now"
              href="/#/waiver"
            />
          )}
          {!member.agreementSigned && (
            <WarningBanner
              icon={<FileText size={16} />}
              text="Membership agreement not signed"
              action="Sign Now"
              href="/#/waiver"
            />
          )}
        </div>
      )}

      {/* Card on File */}
      <div className="mx-5 rounded-xl p-4 mb-4" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1A1A1A" }}>
              <CreditCard size={16} style={{ color: "#C8A24C" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#F0F0F0" }}>
                {member.cardLast4 ? `${member.cardBrand || "Card"} •••• ${member.cardLast4}` : "No card on file"}
              </p>
              {member.cardExpiration && (
                <p className="text-xs" style={{ color: "#666" }}>Exp {member.cardExpiration}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleSetupCard}
            disabled={cardLoading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: "#1A1A1A", color: "#C8A24C" }}
            data-testid="button-update-card"
          >
            {cardLoading ? "..." : member.cardLast4 ? "Update" : "Add Card"}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mx-5 mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#666" }}>Quick Links</h3>
        <div className="space-y-1">
          <QuickLink href="/#/belt" icon="🥋" label="Belt Journey" />
          <QuickLink href="/#/schedule" icon="📅" label="Class Schedule" />
          <QuickLink href="/#/calendar" icon="🏆" label="Tournament Calendar" />
          <QuickLink href="/#/stats" icon="📊" label="Academy Stats" />
          <QuickLink href="/#/sauna" icon="🧖" label="Sauna Dashboard" />
          <QuickLink href="/#/book" icon="📆" label="Book a Trial Class" />
          <QuickLink href="/#/games" icon="🎮" label="Games" />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, isStatus }: { label: string; value: string; isStatus?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#666" }}>{label}</p>
      <p className="text-sm font-medium truncate" style={{
        color: isStatus ? (value === "Active" ? "#4CAF80" : "#E08228") : "#F0F0F0"
      }}>
        {value}
      </p>
    </div>
  );
}

function WarningBanner({ icon, text, action, href }: { icon: React.ReactNode; text: string; action: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
      style={{ backgroundColor: "rgba(224, 130, 40, 0.1)", border: "1px solid rgba(224, 130, 40, 0.2)" }}
    >
      <span style={{ color: "#E08228" }}>{icon}</span>
      <span className="text-sm flex-1" style={{ color: "#E08228" }}>{text}</span>
      <span className="text-xs font-medium" style={{ color: "#E08228" }}>{action}</span>
      <ChevronRight size={14} style={{ color: "#E08228" }} />
    </a>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]"
      style={{ backgroundColor: "#111" }}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium flex-1" style={{ color: "#F0F0F0" }}>{label}</span>
      <ChevronRight size={16} style={{ color: "#444" }} />
    </a>
  );
}
