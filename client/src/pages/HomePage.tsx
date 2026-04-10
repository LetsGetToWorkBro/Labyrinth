import { useAuth } from "@/lib/auth-context";
import type { FamilyMember, PaymentCard } from "@/lib/api";
import { beltSavePromotion } from "@/lib/api";
import { BeltIcon } from "@/components/BeltIcon";
import { ADULT_BELT_OPTIONS } from "@/components/BeltIcon";
import { getBeltColor } from "@/lib/constants";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  CreditCard, FileText, ChevronRight, LogOut,
  Users, Check, Loader2, Plus, Trash2, Star, CheckCircle, Shield,
} from "lucide-react";
import {
  memberGetCards, memberSetDefaultCard, memberRemoveCard,
  memberAddCard, memberCreateSetupLink,
} from "@/lib/api";
import { useState, useEffect, useCallback } from "react";

const haptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const beltColorMap: Record<string, string> = {
  white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6',
  brown: '#92400E', black: '#1A1A1A', grey: '#9CA3AF',
  yellow: '#EAB308', orange: '#F97316', green: '#22C55E',
};

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

  // ─── Logged-in home ───────────────────────────────────────────────
  const hasWarnings = !member.waiverSigned || !member.agreementSigned;
  const hasFamily = familyMembers.length > 1;
  const joinDate = (() => {
    const d = (member as any)?.startDate || member.joinDate || (member as any)?.memberSince;
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch { return d; }
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

      {/* Profile card */}
      <div className="mx-5 rounded-xl p-5 mb-4" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-3">
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: avatarBg, color: avatarFg,
              fontSize: 18, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              textTransform: 'uppercase', letterSpacing: '-0.5px',
              flexShrink: 0, marginBottom: 12,
              boxShadow: `0 0 0 3px ${avatarBg}30, 0 0 20px ${avatarBg}20`
            }}>
              {getInitials(member?.name || 'M')}
            </div>
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
            {/* Belt SVG — tappable to request rank update */}
            <button
              onClick={() => { haptic(); setShowRankRequest(true); setRankBelt(member.belt || "white"); setRankStripes(0); setRankNote(""); setRankSent(false); }}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", position: "relative" }}
              title="Request rank update"
            >
              <BeltIcon
                belt={member.belt || "white"}
                stripes={0}
                width={72}
                style={{ filter: `drop-shadow(0 1px 6px ${getBeltColor(member.belt)}40)` }}
              />
              {/* Tap hint dot */}
              <span style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", backgroundColor: "#C8A24C", border: "2px solid #0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={7} style={{ color: "#0A0A0A" }} />
              </span>
            </button>
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

      {/* Attendance streak widget */}
      <div style={{
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
          <span style={{ fontSize: 24 }}>🔥</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#C8A24C', lineHeight: 1 }}>
              {(member as any)?.currentStreak || 0}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Class streak</div>
          </div>
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #1A1A1A',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>📅</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#E0E0E0', lineHeight: 1 }}>
              {(member as any)?.classesThisMonth || 0}
            </div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>This month</div>
          </div>
        </div>
      </div>

      {/* Warning banners */}
      {hasWarnings && (
        <div className="mx-5 mb-4 space-y-2">
          {!member.waiverSigned && <WarningBanner text="Liability waiver not signed" action="Sign Now" href="/#/waiver" />}
          {!member.agreementSigned && <WarningBanner text="Membership agreement not signed" action="Sign Now" href="/#/waiver?tab=agreement" />}
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
            onClick={() => { haptic(); handleAddCard(); }}
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

      {/* ── Rank Request Bottom Sheet ── */}
      {showRankRequest && (
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
          onClick={() => setShowRankRequest(false)}
        >
          <div
            style={{ width: "100%", alignSelf: "center", maxWidth: 480, backgroundColor: "#111", borderRadius: "20px 20px 0 0", paddingTop: 20, paddingLeft: 20, paddingRight: 20, paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))", maxHeight: "min(88svh, calc(100vh - 48px))", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" as any }}
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

function QuickLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98]" style={{ backgroundColor: "#111" }}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium flex-1" style={{ color: "#F0F0F0" }}>{label}</span>
      <ChevronRight size={16} style={{ color: "#444" }} />
    </a>
  );
}
