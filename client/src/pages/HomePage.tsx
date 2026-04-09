import { useAuth } from "@/lib/auth-context";
import type { FamilyMember, PaymentCard } from "@/lib/api";
import logoMazeGold from "@assets/maze-gold-md.png";
import { BeltBadge } from "@/components/BeltBadge";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  CreditCard, FileText, ChevronRight, LogOut, LogIn,
  Users, Check, Loader2, Plus, Trash2, Star,
} from "lucide-react";
import {
  memberGetCards, memberSetDefaultCard, memberRemoveCard,
  memberAddCard, memberCreateSetupLink,
} from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import LoginPage from "./LoginPage";

export default function HomePage() {
  const { member, familyMembers, isAuthenticated, logout, switchProfile } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [switchingRow, setSwitchingRow] = useState<number | null>(null);
  const [showFamilySwitcher, setShowFamilySwitcher] = useState(false);
  const [switchError, setSwitchError] = useState("");

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

  if (showLogin && !isAuthenticated) {
    return <div className="app-content"><LoginPage onBack={() => setShowLogin(false)} /></div>;
  }

  // ─── Guest home ──────────────────────────────────────────────────
  if (!member) {
    return (
      <div className="app-content">
        <ScreenHeader title="Labyrinth BJJ" />
        <div className="mx-5 mb-4 flex items-center gap-4 p-5 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
          <img src={logoMazeGold} alt="Labyrinth BJJ" style={{ width: 48, height: 48 }} className="flex-shrink-0" />
          <div>
            <h2 className="text-base font-bold" style={{ color: "#F0F0F0" }}>Welcome to Labyrinth BJJ</h2>
            <p className="text-xs mt-0.5" style={{ color: "#666" }}>Fulshear, TX</p>
          </div>
        </div>
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

  // ─── Logged-in home ───────────────────────────────────────────────
  const hasWarnings = !member.waiverSigned || !member.agreementSigned;
  const hasFamily = familyMembers.length > 1;
  const joinDate = member.joinDate
    ? new Date(member.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

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

      {/* Profile card */}
      <div className="mx-5 rounded-xl p-5 mb-4" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-3">
            <h2 className="text-lg font-bold" style={{ color: "#F0F0F0" }} data-testid="text-member-name">
              {member.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#666" }}>Member since {joinDate}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasFamily && (
              <button
                onClick={() => setShowFamilySwitcher(!showFamilySwitcher)}
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
            <BeltBadge belt={member.belt} size="md" />
          </div>
        </div>

        {/* Family switcher */}
        {hasFamily && showFamilySwitcher && (
          <div className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
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
                  onClick={() => handleSwitchProfile(fm)}
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

        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Plan" value={member.plan || member.membership || "—"} />
          <InfoItem label="Status" value={member.status || "Active"} isStatus />
          <InfoItem label="Email" value={member.email} />
          <InfoItem label="Phone" value={member.phone || "Not set"} />
        </div>
      </div>

      {/* Warning banners */}
      {hasWarnings && (
        <div className="mx-5 mb-4 space-y-2">
          {!member.waiverSigned && <WarningBanner icon={<FileText size={16} />} text="Liability waiver not signed" action="Sign Now" href="/#/waiver" />}
          {!member.agreementSigned && <WarningBanner icon={<FileText size={16} />} text="Membership agreement not signed" action="Sign Now" href="/#/waiver" />}
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
            onClick={handleAddCard}
            disabled={addingCard}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all active:scale-[0.97]"
            style={{ backgroundColor: "rgba(200,162,76,0.1)", color: "#C8A24C", border: "1px solid rgba(200,162,76,0.15)" }}
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
      <p className="text-sm font-medium truncate" style={{ color: isStatus ? (value === "Active" ? "#4CAF80" : "#E08228") : "#F0F0F0" }}>
        {value}
      </p>
    </div>
  );
}

function WarningBanner({ icon, text, action, href }: { icon: React.ReactNode; text: string; action: string; href: string }) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl transition-colors" style={{ backgroundColor: "rgba(224, 130, 40, 0.1)", border: "1px solid rgba(224, 130, 40, 0.2)" }}>
      <span style={{ color: "#E08228" }}>{icon}</span>
      <span className="text-sm flex-1" style={{ color: "#E08228" }}>{text}</span>
      <span className="text-xs font-medium" style={{ color: "#E08228" }}>{action}</span>
      <ChevronRight size={14} style={{ color: "#E08228" }} />
    </a>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]" style={{ backgroundColor: "#111" }}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium flex-1" style={{ color: "#F0F0F0" }}>{label}</span>
      <ChevronRight size={16} style={{ color: "#444" }} />
    </a>
  );
}
