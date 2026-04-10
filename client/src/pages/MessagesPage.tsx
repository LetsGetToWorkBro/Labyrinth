/**
 * MessagesPage — Admin-only mass email + SMS composer
 *
 * Email routes through MailApp (GAS) — Labyrinth BJJ branded template
 * SMS routes through OpenPhone API via GAS
 *
 * Target options match what GAS doSendMassEmail / doSendMassSMS support:
 *   all     — every member with an email / phone
 *   active  — Active status members only
 *   trials  — Trial / FREE members
 *   failed  — Failed payment members
 */

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminSendEmail, adminSendSMS, type MessageTarget } from "@/lib/api";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  Mail, MessageSquare, Send, ChevronDown, ChevronUp,
  Loader2, CheckCircle, AlertCircle, Users,
} from "lucide-react";

const GOLD = "#C8A24C";

const TARGETS: { value: MessageTarget; label: string; desc: string }[] = [
  { value: "all",    label: "All Members",     desc: "Everyone with an email / phone" },
  { value: "active", label: "Active Only",     desc: "Active status members" },
  { value: "trials", label: "Trials",          desc: "FREE TRIAL / Trial members" },
  { value: "failed", label: "Failed Payments", desc: "Members with failed payments" },
];

type Tab = "email" | "sms";
type SendState = "idle" | "sending" | "success" | "error";

export default function MessagesPage() {
  const { member, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("email");

  // Email state
  const [subject, setSubject]       = useState("");
  const [body, setBody]             = useState("");
  const [emailTarget, setEmailTarget] = useState<MessageTarget>("active");
  const [showEmailTargets, setShowEmailTargets] = useState(false);
  const [emailState, setEmailState] = useState<SendState>("idle");
  const [emailResult, setEmailResult] = useState<{ count?: number; error?: string }>({});

  // Scheduling state (shared by email and SMS)
  const [emailScheduleMode, setEmailScheduleMode] = useState<"now" | "later">("now");
  const [emailScheduleTime, setEmailScheduleTime] = useState("");
  const [smsScheduleMode, setSmsScheduleMode] = useState<"now" | "later">("now");
  const [smsScheduleTime, setSmsScheduleTime] = useState("");

  // SMS state
  const [smsBody, setSmsBody]         = useState("");
  const [smsTarget, setSmsTarget]     = useState<MessageTarget>("active");
  const [showSmsTargets, setShowSmsTargets] = useState(false);
  const [smsState, setSmsState]       = useState<SendState>("idle");
  const [smsResult, setSmsResult]     = useState<{ count?: number; error?: string }>({});

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  if (!isAdmin) {
    return (
      <div className="app-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ textAlign: "center", color: "#555" }}>
          <AlertCircle size={32} style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14 }}>Admin access required</p>
        </div>
      </div>
    );
  }

  const emailTargetLabel = TARGETS.find(t => t.value === emailTarget)?.label ?? "Active Only";
  const smsTargetLabel   = TARGETS.find(t => t.value === smsTarget)?.label ?? "Active Only";

  const handleSendEmail = async () => {
    if (!subject.trim() || !body.trim()) return;
    if (emailScheduleMode === "later" && !emailScheduleTime) return;
    setEmailState("sending");
    setEmailResult({});
    // Wrap plain text body in minimal HTML paragraphs
    const htmlBody = body.trim().split("\n\n").map(p =>
      `<p style="margin:0 0 14px;">${p.replace(/\n/g, "<br>")}</p>`
    ).join("");
    // Pass scheduledFor ISO string if scheduling for later
    // Note: GAS needs a scheduleBlast action to handle deferred sending
    const scheduledFor = emailScheduleMode === "later" && emailScheduleTime
      ? new Date(emailScheduleTime).toISOString()
      : undefined;
    const result = await adminSendEmail(subject.trim(), htmlBody, emailTarget, scheduledFor);
    if (result.success) {
      setEmailState("success");
      setEmailResult({ count: result.sentCount });
      setSubject("");
      setBody("");
      setEmailScheduleMode("now");
      setEmailScheduleTime("");
    } else {
      setEmailState("error");
      setEmailResult({ error: result.error || "Failed to send" });
    }
  };

  const handleSendSMS = async () => {
    if (!smsBody.trim()) return;
    if (smsScheduleMode === "later" && !smsScheduleTime) return;
    setSmsState("sending");
    setSmsResult({});
    // Pass scheduledFor ISO string if scheduling for later
    // Note: GAS needs a scheduleBlast action to handle deferred sending
    const scheduledFor = smsScheduleMode === "later" && smsScheduleTime
      ? new Date(smsScheduleTime).toISOString()
      : undefined;
    const result = await adminSendSMS(smsBody.trim(), smsTarget, scheduledFor);
    if (result.success) {
      setSmsState("success");
      setSmsResult({ count: result.sentCount });
      setSmsBody("");
      setSmsScheduleMode("now");
      setSmsScheduleTime("");
    } else {
      setSmsState("error");
      setSmsResult({ error: result.error || "Failed to send" });
    }
  };

  const smsChars   = smsBody.length;
  const smsSegments = Math.ceil(smsChars / 160) || 1;

  return (
    <div className="app-content">
      <ScreenHeader title="Messages" subtitle="Email & SMS blast" />

      {/* Tab switcher */}
      <div className="mx-5 mb-4 flex rounded-xl overflow-hidden" style={{ border: "1px solid #1A1A1A", backgroundColor: "#0D0D0D" }}>
        {(["email", "sms"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all"
            style={{
              backgroundColor: tab === t ? "#1A1A1A" : "transparent",
              color: tab === t ? GOLD : "#666",
              borderRadius: 10,
              margin: 2,
            }}
          >
            {t === "email" ? <Mail size={15} /> : <MessageSquare size={15} />}
            {t === "email" ? "Email" : "SMS"}
          </button>
        ))}
      </div>

      {/* ── EMAIL COMPOSER ── */}
      {tab === "email" && (
        <div className="mx-5 space-y-3">
          {/* Recipient picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>
              Recipients
            </label>
            <button
              onClick={() => setShowEmailTargets(!showEmailTargets)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
            >
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: GOLD }} />
                <span>{emailTargetLabel}</span>
              </div>
              {showEmailTargets ? <ChevronUp size={15} style={{ color: "#555" }} /> : <ChevronDown size={15} style={{ color: "#555" }} />}
            </button>
            {showEmailTargets && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid #222", backgroundColor: "#0D0D0D" }}>
                {TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setEmailTarget(t.value); setShowEmailTargets(false); }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: emailTarget === t.value ? "rgba(200,162,76,0.06)" : "transparent",
                      borderBottom: "1px solid #1A1A1A",
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: emailTarget === t.value ? GOLD : "#E0E0E0" }}>{t.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#555" }}>{t.desc}</p>
                    </div>
                    {emailTarget === t.value && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: GOLD }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Class schedule update"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
              disabled={emailState === "sending"}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Message</label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={"Hi team,\n\nJust a reminder that..."}
              rows={7}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0", lineHeight: 1.6 }}
              disabled={emailState === "sending"}
            />
            <p className="text-xs mt-1" style={{ color: "#555" }}>
              Emails are sent with the Labyrinth BJJ brand template from info@labyrinth.vision
            </p>
          </div>

          {/* Send Now / Schedule Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>
              Delivery
            </label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #222", backgroundColor: "#0D0D0D" }}>
              <button
                onClick={() => setEmailScheduleMode("now")}
                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: emailScheduleMode === "now" ? GOLD : "transparent",
                  color: emailScheduleMode === "now" ? "#0A0A0A" : "#666",
                  borderRadius: 10, margin: 2,
                }}
              >
                Send Now
              </button>
              <button
                onClick={() => setEmailScheduleMode("later")}
                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: emailScheduleMode === "later" ? GOLD : "transparent",
                  color: emailScheduleMode === "later" ? "#0A0A0A" : "#666",
                  borderRadius: 10, margin: 2,
                }}
              >
                Schedule for Later
              </button>
            </div>
            {emailScheduleMode === "later" && (
              <input
                type="datetime-local"
                value={emailScheduleTime}
                onChange={e => setEmailScheduleTime(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0", colorScheme: "dark" }}
              />
            )}
            {/* Note: GAS needs a scheduleBlast action for scheduled delivery */}
          </div>

          {/* Result banner */}
          {emailState === "success" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(76,175,128,0.1)", border: "1px solid rgba(76,175,128,0.2)" }}>
              <CheckCircle size={16} style={{ color: "#4CAF80", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#4CAF80" }}>
                {emailScheduleMode === "later" && emailScheduleTime
                  ? <>Scheduled for <strong>{new Date(emailScheduleTime).toLocaleString()}</strong></>
                  : <>Sent to <strong>{emailResult.count}</strong> member{emailResult.count !== 1 ? "s" : ""}</>}
              </p>
            </div>
          )}
          {emailState === "error" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(224,85,85,0.08)", border: "1px solid rgba(224,85,85,0.2)" }}>
              <AlertCircle size={16} style={{ color: "#E05555", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#E05555" }}>{emailResult.error}</p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={() => { setEmailState("idle"); handleSendEmail(); }}
            disabled={!subject.trim() || !body.trim() || emailState === "sending" || (emailScheduleMode === "later" && !emailScheduleTime)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: subject.trim() && body.trim() ? GOLD : "#1A1A1A",
              color: subject.trim() && body.trim() ? "#0A0A0A" : "#444",
              opacity: emailState === "sending" ? 0.7 : 1,
            }}
          >
            {emailState === "sending"
              ? <><Loader2 size={16} className="animate-spin" /> {emailScheduleMode === "later" ? "Scheduling…" : "Sending…"}</>
              : <><Send size={16} /> {emailScheduleMode === "later" ? "Schedule Email" : `Send Email to ${emailTargetLabel}`}</>
            }
          </button>
          <div style={{ height: 8 }} />
        </div>
      )}

      {/* ── SMS COMPOSER ── */}
      {tab === "sms" && (
        <div className="mx-5 space-y-3">
          {/* Sender badge */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
            <MessageSquare size={13} style={{ color: GOLD, flexShrink: 0 }} />
            <p className="text-xs" style={{ color: "#999" }}>
              Sending from <span style={{ color: GOLD, fontWeight: 600 }}>+1 (281) 393-7983</span> via OpenPhone
            </p>
          </div>

          {/* Recipient picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Recipients</label>
            <button
              onClick={() => setShowSmsTargets(!showSmsTargets)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0" }}
            >
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: GOLD }} />
                <span>{smsTargetLabel}</span>
              </div>
              {showSmsTargets ? <ChevronUp size={15} style={{ color: "#555" }} /> : <ChevronDown size={15} style={{ color: "#555" }} />}
            </button>
            {showSmsTargets && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ border: "1px solid #222", backgroundColor: "#0D0D0D" }}>
                {TARGETS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setSmsTarget(t.value); setShowSmsTargets(false); }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: smsTarget === t.value ? "rgba(200,162,76,0.06)" : "transparent",
                      borderBottom: "1px solid #1A1A1A",
                    }}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: smsTarget === t.value ? GOLD : "#E0E0E0" }}>{t.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#555" }}>{t.desc}</p>
                    </div>
                    {smsTarget === t.value && <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: GOLD }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>Message</label>
            <textarea
              value={smsBody}
              onChange={e => setSmsBody(e.target.value)}
              placeholder="Hi! Reminder: class tomorrow at 6pm. See you on the mat!"
              rows={5}
              maxLength={480}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0", lineHeight: 1.6 }}
              disabled={smsState === "sending"}
            />
            {/* Char counter */}
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs" style={{ color: "#555" }}>Only members with a phone number on file receive SMS</p>
              <p className="text-xs font-mono" style={{ color: smsChars > 320 ? "#E08228" : "#555", flexShrink: 0, marginLeft: 8 }}>
                {smsChars}/160 · {smsSegments} seg
              </p>
            </div>
          </div>

          {/* Send Now / Schedule Toggle */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#666" }}>
              Delivery
            </label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #222", backgroundColor: "#0D0D0D" }}>
              <button
                onClick={() => setSmsScheduleMode("now")}
                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: smsScheduleMode === "now" ? GOLD : "transparent",
                  color: smsScheduleMode === "now" ? "#0A0A0A" : "#666",
                  borderRadius: 10, margin: 2,
                }}
              >
                Send Now
              </button>
              <button
                onClick={() => setSmsScheduleMode("later")}
                className="flex-1 py-2.5 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: smsScheduleMode === "later" ? GOLD : "transparent",
                  color: smsScheduleMode === "later" ? "#0A0A0A" : "#666",
                  borderRadius: 10, margin: 2,
                }}
              >
                Schedule for Later
              </button>
            </div>
            {smsScheduleMode === "later" && (
              <input
                type="datetime-local"
                value={smsScheduleTime}
                onChange={e => setSmsScheduleTime(e.target.value)}
                className="w-full mt-2 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: "#111", border: "1px solid #222", color: "#F0F0F0", colorScheme: "dark" }}
              />
            )}
            {/* Note: GAS needs a scheduleBlast action for scheduled delivery */}
          </div>

          {/* Result banner */}
          {smsState === "success" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(76,175,128,0.1)", border: "1px solid rgba(76,175,128,0.2)" }}>
              <CheckCircle size={16} style={{ color: "#4CAF80", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#4CAF80" }}>
                {smsScheduleMode === "later" && smsScheduleTime
                  ? <>Scheduled for <strong>{new Date(smsScheduleTime).toLocaleString()}</strong></>
                  : <>Sent to <strong>{smsResult.count}</strong> member{smsResult.count !== 1 ? "s" : ""}</>}
              </p>
            </div>
          )}
          {smsState === "error" && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(224,85,85,0.08)", border: "1px solid rgba(224,85,85,0.2)" }}>
              <AlertCircle size={16} style={{ color: "#E05555", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "#E05555" }}>{smsResult.error}</p>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={() => { setSmsState("idle"); handleSendSMS(); }}
            disabled={!smsBody.trim() || smsState === "sending" || (smsScheduleMode === "later" && !smsScheduleTime)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: smsBody.trim() ? GOLD : "#1A1A1A",
              color: smsBody.trim() ? "#0A0A0A" : "#444",
              opacity: smsState === "sending" ? 0.7 : 1,
            }}
          >
            {smsState === "sending"
              ? <><Loader2 size={16} className="animate-spin" /> {smsScheduleMode === "later" ? "Scheduling…" : "Sending…"}</>
              : <><Send size={16} /> {smsScheduleMode === "later" ? "Schedule SMS" : `Send SMS to ${smsTargetLabel}`}</>
            }
          </button>
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  );
}
