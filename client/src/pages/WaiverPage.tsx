import { useState, useRef, useEffect } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/lib/auth-context";
import { memberSaveWaiver, memberSaveAgreement } from "@/lib/api";
import { CheckCircle, Eraser, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

const WAIVER_TEXT = `LABYRINTH BJJ — LIABILITY WAIVER AND RELEASE

I hereby acknowledge that I am voluntarily participating in martial arts training activities, including but not limited to Brazilian Jiu-Jitsu, grappling, wrestling, and related fitness activities at Labyrinth BJJ.

I understand that these activities involve physical contact and carry inherent risks of injury, including but not limited to: sprains, strains, fractures, dislocations, concussions, and other bodily injuries.

I assume all risks associated with participation in these activities and release Labyrinth BJJ, its owners, instructors, employees, and agents from any and all liability for injuries or damages that may occur during training, classes, open mats, competitions, or any other activities conducted at or organized by Labyrinth BJJ.

I confirm that I am in good physical condition and have no medical conditions that would prevent safe participation. I agree to follow all rules and instructions provided by coaches and staff.

By signing below, I acknowledge that I have read and understand this waiver and voluntarily agree to its terms.`;

const AGREEMENT_TEXT = `LABYRINTH BJJ — MEMBERSHIP AGREEMENT

This Membership Agreement is entered into between the undersigned member and Labyrinth BJJ, located in Fulshear, TX.

1. MEMBERSHIP TERMS
Your membership begins on the date of this agreement and continues on a month-to-month basis unless otherwise specified. Membership fees are due on the same date each month as your initial enrollment.

2. BILLING & PAYMENT
• Membership fees are charged automatically to the payment method on file.
• If a payment fails, you will be notified and given 7 days to update your payment method.
• After 14 days of non-payment, your membership may be suspended.

3. CANCELLATION POLICY
• You may cancel your membership at any time by notifying the front desk.
• Cancellations take effect at the end of the current billing period.
• No refunds will be issued for partial months.

4. FREEZE / PAUSE POLICY
• You may freeze your membership for up to 30 days per year.
• Freezes must be requested at least 3 days before your next billing date.

5. GYM RULES & CONDUCT
• Proper training attire required (clean gi or no-gi gear).
• Maintain personal hygiene — nails trimmed, clean gear each session.
• Respect all training partners regardless of rank or experience.
• Report any injuries to the instructor immediately.

6. ACKNOWLEDGMENT
By signing below, I acknowledge that I have read, understand, and agree to the terms of this Membership Agreement and that my membership will auto-renew each month until cancelled.`;

const GOLD = "#C8A24C";

export default function WaiverPage() {
  const { member, refreshProfile } = useAuth();

  // Read initial tab from URL hash: /#/waiver?tab=agreement
  const initialTab = (): "waiver" | "agreement" => {
    try {
      const search = window.location.hash.split("?")[1] || "";
      return new URLSearchParams(search).get("tab") === "agreement" ? "agreement" : "waiver";
    } catch { return "waiver"; }
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const [tab, setTab]               = useState<"waiver" | "agreement">(initialTab);
  const [signerName, setSignerName] = useState(member?.name || "");
  const [hasDrawn, setHasDrawn]     = useState(false);
  const [confirmed, setConfirmed]   = useState(false); // explicit "I agree" checkbox
  const [signing, setSigning]       = useState(false);
  const [signError, setSignError]   = useState("");

  // Per-tab signed state — set immediately on success so UI responds instantly
  const [waiverJustSigned,    setWaiverJustSigned]    = useState(false);
  const [agreementJustSigned, setAgreementJustSigned] = useState(false);

  const waiverAlreadySigned    = !!member?.waiverSigned    || waiverJustSigned;
  const agreementAlreadySigned = !!member?.agreementSigned || agreementJustSigned;
  const currentlySigned = tab === "waiver" ? waiverAlreadySigned : agreementAlreadySigned;

  // Reset canvas + confirmation state when switching tabs
  useEffect(() => {
    setHasDrawn(false);
    setConfirmed(false);
    setSignError("");
    clearCanvas();
  }, [tab]);

  // Bind canvas drawing events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = canvas.offsetWidth  * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";

    const getPos = (e: any) => {
      const rect  = canvas.getBoundingClientRect();
      const touch = e.touches?.[0] || e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };
    const start = (e: any) => { isDrawing.current = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move  = (e: any) => { if (!isDrawing.current) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasDrawn(true); e.preventDefault(); };
    const end   = () => { isDrawing.current = false; };

    canvas.addEventListener("mousedown",  start);
    canvas.addEventListener("mousemove",  move);
    canvas.addEventListener("mouseup",    end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove",  move,  { passive: false });
    canvas.addEventListener("touchend",   end);
    return () => {
      canvas.removeEventListener("mousedown",  start);
      canvas.removeEventListener("mousemove",  move);
      canvas.removeEventListener("mouseup",    end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove",  move);
      canvas.removeEventListener("touchend",   end);
    };
  }, [tab]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSign = async () => {
    // All three conditions must be met
    if (!confirmed || !hasDrawn || !signerName || signing) return;
    setSigning(true);
    setSignError("");
    try {
      const canvas = canvasRef.current;
      if (!canvas) { setSigning(false); return; }
      const signatureData = canvas.toDataURL("image/png");
      const result = tab === "waiver"
        ? await memberSaveWaiver(signerName, signatureData, "adult")
        : await memberSaveAgreement(signerName, signatureData, member?.plan || member?.membership || "");

      if (!result?.success) {
        setSignError(result?.error || "Something went wrong. Please try again.");
        setSigning(false);
        return;
      }
      if (tab === "waiver") setWaiverJustSigned(true);
      else                  setAgreementJustSigned(true);
      clearCanvas();
      setConfirmed(false);
      refreshProfile().catch(() => {});
    } catch (err: any) {
      setSignError("Connection error. Please check your internet and try again.");
    }
    setSigning(false);
  };

  const canSign = confirmed && hasDrawn && !!signerName && !signing;

  return (
    <div className="app-content">
      <ScreenHeader title="Documents" subtitle="Waiver & Agreement" />

      {/* Tab toggle */}
      <div className="mx-5 mb-4 flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
        {(["waiver", "agreement"] as const).map(t => {
          const isSigned = t === "waiver" ? waiverAlreadySigned : agreementAlreadySigned;
          return (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ backgroundColor: tab === t ? "#1A1A1A" : "transparent", color: tab === t ? GOLD : "#666" }}
            >
              {isSigned && <CheckCircle size={13} style={{ color: "#4CAF80" }} />}
              {t === "waiver" ? "Liability Waiver" : "Membership Agreement"}
            </button>
          );
        })}
      </div>

      {/* ── Already signed ── */}
      {currentlySigned ? (
        <div className="mx-5 space-y-4">
          <div className="flex flex-col items-center text-center p-8 rounded-2xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
            <CheckCircle size={52} style={{ color: "#4CAF80", marginBottom: 14 }} />
            <h2 className="text-lg font-bold mb-1" style={{ color: "#F0F0F0" }}>
              {tab === "waiver" ? "Waiver Signed" : "Agreement Signed"}
            </h2>
            <p className="text-sm" style={{ color: "#999", lineHeight: 1.5 }}>
              Your {tab === "waiver" ? "liability waiver" : "membership agreement"} is on file.
              A copy was emailed to {member?.email}.
            </p>

            {/* Prompt for the other doc if still unsigned */}
            {tab === "waiver" && !agreementAlreadySigned && (
              <button onClick={() => setTab("agreement")} className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}>
                Sign Membership Agreement →
              </button>
            )}
            {tab === "agreement" && !waiverAlreadySigned && (
              <button onClick={() => setTab("waiver")} className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}>
                Sign Liability Waiver →
              </button>
            )}
          </div>

          {/* Back to home */}
          <a href="/#/" className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", color: "#999", textDecoration: "none" }}>
            <ArrowLeft size={15} /> Back to Home
          </a>
        </div>

      ) : (
        /* ── Signing form ── */
        <>
          {/* Document text */}
          <div className="mx-5 mb-4 p-4 rounded-xl text-xs leading-relaxed"
            style={{ backgroundColor: "#0D0D0D", border: "1px solid #1A1A1A", color: "#999", maxHeight: 200, overflowY: "auto", whiteSpace: "pre-line" }}>
            {tab === "waiver" ? WAIVER_TEXT : AGREEMENT_TEXT}
          </div>

          {/* I agree checkbox — must check before signature activates */}
          <div className="mx-5 mb-4">
            <label className="flex items-start gap-3 cursor-pointer" style={{ userSelect: "none" }}>
              <div
                onClick={() => setConfirmed(!confirmed)}
                style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  border: confirmed ? `2px solid ${GOLD}` : "2px solid #333",
                  backgroundColor: confirmed ? `${GOLD}20` : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {confirmed && <CheckCircle size={13} style={{ color: GOLD }} />}
              </div>
              <span className="text-xs leading-relaxed" style={{ color: "#999" }}>
                I have read and understand the full {tab === "waiver" ? "liability waiver" : "membership agreement"} above
                and voluntarily agree to its terms.
              </span>
            </label>
          </div>

          {/* Signer name */}
          <div className="mx-5 mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Full Name</label>
            <input type="text" value={signerName} onChange={e => setSignerName(e.target.value)}
              placeholder="Your full legal name"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
              data-testid="input-signer-name"
            />
          </div>

          {/* Signature pad — grayed out until checkbox is checked */}
          <div className="mx-5 mb-4" style={{ opacity: confirmed ? 1 : 0.4, transition: "opacity 0.2s", pointerEvents: confirmed ? "auto" : "none" }}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: "#999" }}>
                Signature {!confirmed && <span style={{ color: "#555" }}>— check the box above first</span>}
              </label>
              <button onClick={clearCanvas} className="flex items-center gap-1 text-xs" style={{ color: "#666" }} data-testid="button-clear-signature">
                <Eraser size={12} /> Clear
              </button>
            </div>
            <canvas ref={canvasRef} className="signature-canvas w-full" style={{ height: 130, cursor: "crosshair" }} />
          </div>

          {/* Error + submit */}
          <div className="mx-5 pb-8">
            {signError && (
              <div className="flex items-start gap-2 mb-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(224,85,85,0.08)", border: "1px solid rgba(224,85,85,0.2)" }}>
                <AlertCircle size={15} style={{ color: "#E05555", flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: "#E05555" }}>{signError}</p>
              </div>
            )}
            <button onClick={handleSign} disabled={!canSign}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: canSign ? GOLD : "#1A1A1A",
                color:           canSign ? "#0A0A0A" : "#444",
                opacity: signing ? 0.7 : 1,
                cursor: canSign ? "pointer" : "default",
              }}
              data-testid="button-sign-waiver"
            >
              {signing
                ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
                : `Sign ${tab === "waiver" ? "Liability Waiver" : "Membership Agreement"}`}
            </button>

            {/* Back link */}
            <a href="/#/" className="flex items-center justify-center gap-2 mt-3 py-2.5 text-sm"
              style={{ color: "#555", textDecoration: "none" }}>
              <ArrowLeft size={14} /> Back to Home
            </a>
          </div>
        </>
      )}
    </div>
  );
}
