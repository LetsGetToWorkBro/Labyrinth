import { useState, useRef, useEffect } from "react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/lib/auth-context";
import { memberSaveWaiver, memberSaveAgreement } from "@/lib/api";
import { CheckCircle, ArrowLeft, Eraser } from "lucide-react";

const WAIVER_TEXT = `LABYRINTH BJJ — LIABILITY WAIVER AND RELEASE

I hereby acknowledge that I am voluntarily participating in martial arts training activities, including but not limited to Brazilian Jiu-Jitsu, grappling, wrestling, and related fitness activities at Labyrinth BJJ.

I understand that these activities involve physical contact and carry inherent risks of injury, including but not limited to: sprains, strains, fractures, dislocations, concussions, and other bodily injuries.

I assume all risks associated with participation in these activities and release Labyrinth BJJ, its owners, instructors, employees, and agents from any and all liability for injuries or damages that may occur during training, classes, open mats, competitions, or any other activities conducted at or organized by Labyrinth BJJ.

I confirm that I am in good physical condition and have no medical conditions that would prevent safe participation. I agree to follow all rules and instructions provided by coaches and staff.

By signing below, I acknowledge that I have read and understand this waiver and voluntarily agree to its terms.`;

export default function WaiverPage() {
  const { member, refreshProfile } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signerName, setSignerName] = useState(member?.name || "");
  const [signed, setSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [tab, setTab] = useState<"waiver" | "agreement">("waiver");
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#C8A24C";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches?.[0] || e;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const start = (e: any) => {
      isDrawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };

    const move = (e: any) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasDrawn(true);
    };

    const end = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
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
    if (!hasDrawn || !signerName) return;
    setSigning(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const signatureData = canvas.toDataURL("image/png");
      if (tab === "waiver") {
        await memberSaveWaiver(signerName, signatureData, "adult");
      } else {
        await memberSaveAgreement(signerName, signatureData, member?.plan || member?.membership || "");
      }
      setSigned(true);
      await refreshProfile();
    } catch (err) {
      console.error("Waiver sign failed:", err);
    }
    setSigning(false);
  };

  if (signed) {
    return (
      <div className="app-content flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: "60vh" }}>
        <CheckCircle size={64} style={{ color: "#4CAF80", marginBottom: 16 }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "#F0F0F0" }}>Waiver Signed</h2>
        <p className="text-sm mb-6" style={{ color: "#999" }}>
          Signed by {signerName} on {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
        <a
          href="/#/"
          className="px-6 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{ backgroundColor: "#C8A24C", color: "#0A0A0A" }}
        >
          Back to Home
        </a>
      </div>
    );
  }

  const alreadySigned = tab === "waiver" ? member?.waiverSigned : member?.agreementSigned;
  const signedDate = tab === "waiver" ? member?.waiverDate : member?.agreementDate;

  return (
    <div className="app-content">
      <ScreenHeader
        title="Documents"
        right={
          <a href="/#/" className="p-2 rounded-lg" style={{ color: "#666" }}>
            <ArrowLeft size={18} />
          </a>
        }
      />

      {/* Tab */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "#111" }}>
          <button
            onClick={() => setTab("waiver")}
            className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: tab === "waiver" ? "#C8A24C" : "transparent",
              color: tab === "waiver" ? "#0A0A0A" : "#666",
            }}
          >
            Liability Waiver
          </button>
          <button
            onClick={() => setTab("agreement")}
            className="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            style={{
              backgroundColor: tab === "agreement" ? "#C8A24C" : "transparent",
              color: tab === "agreement" ? "#0A0A0A" : "#666",
            }}
          >
            Agreement
          </button>
        </div>
      </div>

      {alreadySigned ? (
        <div className="mx-5 p-4 rounded-xl text-center" style={{ backgroundColor: "rgba(76, 175, 128, 0.08)", border: "1px solid rgba(76, 175, 128, 0.2)" }}>
          <CheckCircle size={24} style={{ color: "#4CAF80", margin: "0 auto 8px" }} />
          <p className="text-sm font-medium" style={{ color: "#4CAF80" }}>
            {tab === "waiver" ? "Waiver" : "Agreement"} Signed
          </p>
          {signedDate && (
            <p className="text-xs mt-1" style={{ color: "#999" }}>
              Signed on {new Date(signedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Document Text */}
          <div className="mx-5 mb-4 p-4 rounded-xl max-h-48 overflow-y-auto" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
            <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "#999" }}>
              {WAIVER_TEXT}
            </p>
          </div>

          {/* Signer Name */}
          <div className="px-5 mb-3">
            <label className="block text-xs font-medium mb-1.5" style={{ color: "#999" }}>Full Legal Name</label>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
              data-testid="input-signer-name"
            />
          </div>

          {/* Signature Pad */}
          <div className="px-5 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: "#999" }}>Signature</label>
              <button onClick={clearCanvas} className="flex items-center gap-1 text-xs" style={{ color: "#666" }} data-testid="button-clear-signature">
                <Eraser size={12} /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              className="signature-canvas w-full"
              style={{ height: 140, cursor: "crosshair" }}
            />
          </div>

          {/* Sign Button */}
          <div className="px-5 pb-6">
            <button
              onClick={handleSign}
              disabled={!hasDrawn || !signerName || signing}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                backgroundColor: hasDrawn && signerName ? "#C8A24C" : "#1A1A1A",
                color: hasDrawn && signerName ? "#0A0A0A" : "#666",
                opacity: signing ? 0.7 : 1,
              }}
              data-testid="button-sign-waiver"
            >
              {signing ? "Submitting..." : "Sign & Submit"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
