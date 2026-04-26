/**
 * AdminPage.tsx — Labyrinth BJJ "Academy Controls"
 *
 * Single-page admin panel. Four sections:
 *   1. Broadcast Announcement  → gasCall('pinAnnouncement')
 *   2. Dynamic XP Multiplier   → gasCall('setXpEvent') / getXpEvent
 *   3. Check-In Time Gate      → gasCall('saveGeoConfig') / getGeoConfig
 *   4. Location Geo-Lock       → gasCall('saveGeoConfig') / getGeoConfig
 *
 * Sticky bottom "Save System Config" saves all four geo/time-gate fields at once.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth-context";
import { gasCall, getToken } from "@/lib/api";

type BadgeType = "priority" | "event" | "schedule" | "reminder" | "new";
type ScopeType = "week" | "month" | "always";

const BADGE_LABEL: Record<BadgeType, string> = {
  priority: "Priority Update",
  event: "Event",
  schedule: "Schedule Change",
  reminder: "Reminder",
  new: "New",
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function scopeToHours(scope: ScopeType, validUntil: string): number {
  if (scope === "always") return 8760;
  if (scope === "month") {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.max(1, Math.round((end.getTime() - now.getTime()) / 3_600_000));
  }
  if (scope === "week") {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    const end = new Date(now);
    end.setDate(end.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
    return Math.max(1, Math.round((end.getTime() - now.getTime()) / 3_600_000));
  }
  if (validUntil) {
    const end = new Date(validUntil + "T23:59:59");
    const hrs = Math.round((end.getTime() - Date.now()) / 3_600_000);
    if (hrs > 0) return hrs;
  }
  return 24;
}

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const { member } = useAuth();
  const portalTarget = typeof document !== 'undefined' ? document.body : null;

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // ── Section 1: Announcement ────────────────────────────────────────
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annBadge, setAnnBadge] = useState<BadgeType>("priority");
  const [annCta, setAnnCta] = useState("");
  const [annPin, setAnnPin] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    if (!annTitle.trim() && !annMessage.trim()) {
      showToast("Title or message required", "error");
      return;
    }
    setPublishing(true);
    try {
      const result = await gasCall("pinAnnouncement", {
        token: getToken() || "",
        title: annTitle,
        body: annMessage,
        message: annMessage, // GAS legacy field
        badge: BADGE_LABEL[annBadge],
        ctaUrl: annCta,
        link: annCta,
        pinned: annPin,
      });
      console.log('[AdminPage] pinAnnouncement result:', JSON.stringify(result));
      if (!result || result?.success === false) {
        showToast(`Pin failed: ${result?.error || 'No response'}`, "error");
      } else {
        showToast("✓ Announcement pinned to home screens");
        window.dispatchEvent(new Event('announcement-updated'));
        setAnnTitle("");
        setAnnMessage("");
        setAnnCta("");
      }
    } catch (e) {
      showToast("Failed to publish", "error");
    } finally {
      setPublishing(false);
    }
  };

  // ── Section 2: XP Event ────────────────────────────────────────────
  const [xpEnabled, setXpEnabled] = useState(true);
  const [xpDay, setXpDay] = useState(2); // Wednesday default (matches mock)
  const [xpTime, setXpTime] = useState("06:30");
  const [xpValidUntil, setXpValidUntil] = useState("");
  const [xpScope, setXpScope] = useState<ScopeType>("week");
  const [xpMultiplier, setXpMultiplier] = useState(1.5);
  const [xpSaving, setXpSaving] = useState(false);

  // Pre-populate on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await gasCall("getXpEvent", {});
        if (res && typeof res === "object") {
          setXpEnabled(!!res.active);
          const mult = Number(res.multiplier);
          if (mult === 1.25 || mult === 1.5 || mult === 2) setXpMultiplier(mult);
          const label = String(res.label || "");
          const dayMatch = DAY_NAMES.findIndex((d) => label.toLowerCase().includes(d.toLowerCase()));
          if (dayMatch >= 0) setXpDay(dayMatch);
        }
      } catch {}
      try {
        const geo = await gasCall("getGeoConfig", {});
        if (geo && typeof geo === "object") {
          if (typeof geo.checkinWindowMinutes === "number") setGateWindow(geo.checkinWindowMinutes);
          if (typeof geo.checkinGateEnabled === "boolean") setGateEnabled(geo.checkinGateEnabled);
          if (typeof geo.geoEnabled === "boolean") setGeoEnabled(geo.geoEnabled);
          if (typeof geo.geoLocation === "string" && geo.geoLocation) setGeoLocation(geo.geoLocation);
          if (typeof geo.geoRadiusYards === "number") setGeoRadius(geo.geoRadiusYards);
          if (typeof geo.geoLat === "number") setGeoLat(geo.geoLat);
          if (typeof geo.geoLng === "number") setGeoLng(geo.geoLng);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveXpEvent = async () => {
    setXpSaving(true);
    try {
      if (!xpEnabled) {
        await gasCall("setXpEvent", { token: getToken() || "", active: false });
        showToast("XP event disabled");
      } else {
        await gasCall("setXpEvent", {
          token: getToken() || "",
          active: true,
          label: `${xpMultiplier}× XP — ${DAY_NAMES[xpDay]}s`,
          durationHours: scopeToHours(xpScope, xpValidUntil),
          multiplier: xpMultiplier,
        });
        showToast("XP event saved");
      }
    } catch {
      showToast("Failed to save XP event", "error");
    } finally {
      setXpSaving(false);
    }
  };

  // ── Section 3: Check-In Time Gate ─────────────────────────────────
  const [gateEnabled, setGateEnabled] = useState(true);
  const [gateWindow, setGateWindow] = useState(60); // minutes

  // ── Section 4: Geo-Lock ───────────────────────────────────────────
  const [geoEnabled, setGeoEnabled] = useState(true);
  const [geoLocation, setGeoLocation] = useState("Labyrinth BJJ, Fulshear, TX");
  const [geoRadius, setGeoRadius] = useState(500);
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoSearching, setGeoSearching] = useState(false);
  const [geoSuggestions, setGeoSuggestions] = useState<Array<{display_name: string; lat: string; lon: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const geoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Geocode an address string using Nominatim (OpenStreetMap, free, no key)
  const geocodeAddress = useCallback(async (query: string) => {
    if (!query || query.length < 4) { setGeoSuggestions([]); return; }
    setGeoSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=us`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'LabyrinthBJJ/1.0' } });
      const data = await res.json();
      setGeoSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
    } catch { setGeoSuggestions([]); }
    setGeoSearching(false);
  }, []);

  const handleAddressChange = (val: string) => {
    setGeoLocation(val);
    if (geoDebounceRef.current) clearTimeout(geoDebounceRef.current);
    geoDebounceRef.current = setTimeout(() => geocodeAddress(val), 600);
  };

  const handleSelectSuggestion = (s: {display_name: string; lat: string; lon: string}) => {
    setGeoLocation(s.display_name);
    setGeoLat(parseFloat(s.lat));
    setGeoLng(parseFloat(s.lon));
    setGeoSuggestions([]);
    setShowSuggestions(false);
    showToast(`Pinned: ${parseFloat(s.lat).toFixed(5)}, ${parseFloat(s.lon).toFixed(5)}`);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation not supported", "error");
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLat(pos.coords.latitude);
        setGeoLng(pos.coords.longitude);
        setGeoLocation(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        setGeoLocating(false);
        setGeoSuggestions([]);
        showToast("Location captured — " + pos.coords.latitude.toFixed(5) + ", " + pos.coords.longitude.toFixed(5));
      },
      () => {
        setGeoLocating(false);
        showToast("Failed to get location", "error");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  // ── Save all (sticky bar) ────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      console.log('[AdminPage] saveGeoConfig payload:', { checkinWindowMinutes: gateWindow, checkinGateEnabled: gateEnabled, geoEnabled, geoLocation, geoRadiusYards: geoRadius, geoLat, geoLng });
      const result = await gasCall("saveGeoConfig", {
        token: getToken() || "",
        checkinWindowMinutes: gateWindow,
        checkinGateEnabled: gateEnabled,
        geoEnabled,
        geoLocation,
        geoRadiusYards: geoRadius,
        geoLat,
        geoLng,
      });
      if (result?.success === false) {
        showToast(result.error || "Failed to save", "error");
      } else {
        try {
          sessionStorage.setItem("lbjj_checkin_window", String(gateWindow));
        } catch {}
        showToast("System config saved");
      }
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!member?.isAdmin) {
    return (
      <div style={{ padding: 40, color: "#EAEAEA", fontFamily: "Inter, system-ui, sans-serif", background: "#050505", minHeight: "100vh" }}>
        <button onClick={onBack} style={backBtnStyle} aria-label="Back">←</button>
        <div style={{ marginTop: 80, textAlign: "center", color: "#888891" }}>Admin access required.</div>
      </div>
    );
  }

  const radarScale = Math.max(30, (geoRadius / 2000) * 150);

  return (
    <div style={rootStyle}>
      <StyleBlock />
      <div style={{ maxWidth: 600, margin: "0 auto", position: "relative" }}>
        {/* Header with back button */}
        <div className="lbj-admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onBack} style={backBtnStyle} aria-label="Back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div className="lbj-page-title">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Academy Controls
            </div>
          </div>
          <div className="lbj-status-badge">Live</div>
        </div>

        {/* CARD 1: ANNOUNCEMENT */}
        <div className="lbj-card" style={{ borderColor: "rgba(244, 63, 94, 0.3)" }}>
          <div className="lbj-card-glow ann" />
          <div className="lbj-c-header">
            <div>
              <div className="lbj-c-title ann">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l18-5v12L3 14v-3z" />
                  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                </svg>
                Broadcast Announcement
              </div>
              <div className="lbj-c-desc">Push an alert directly to members' devices and home screens.</div>
            </div>
          </div>

          <div className="lbj-input-group">
            <label>Title</label>
            <input
              type="text"
              className="lbj-input"
              placeholder="e.g., Gym Closed for ADCC"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
            />
          </div>

          <div className="lbj-input-group">
            <label>Message</label>
            <textarea
              className="lbj-input"
              placeholder="Enter your announcement details here..."
              value={annMessage}
              onChange={(e) => setAnnMessage(e.target.value)}
            />
          </div>

          <div className="lbj-input-group">
            <label>Badge Label</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(Object.keys(BADGE_LABEL) as BadgeType[]).map((type) => (
                <div
                  key={type}
                  className={`lbj-badge-pill ${annBadge === type ? "active" : ""}`}
                  data-type={type}
                  onClick={() => setAnnBadge(type)}
                >
                  {BADGE_LABEL[type]}
                </div>
              ))}
            </div>
          </div>

          <div className="lbj-input-group">
            <label>CTA Link (Optional)</label>
            <div className="lbj-input-with-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <input
                type="url"
                className="lbj-input"
                placeholder="https://..."
                value={annCta}
                onChange={(e) => setAnnCta(e.target.value)}
              />
            </div>
          </div>

          <div className="lbj-flex-row-check" style={{ marginBottom: 16 }}>
            <span>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Pin to All Home Screens
            </span>
            <label className="lbj-toggle toggle-danger">
              <input type="checkbox" checked={annPin} onChange={(e) => setAnnPin(e.target.checked)} />
              <span className="lbj-slider" />
            </label>
          </div>

          <button
            className="lbj-btn-secondary btn-announcement"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <Spinner />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            )}
            {publishing ? "Publishing…" : "Publish Announcement"}
          </button>
        </div>

        {/* CARD 2: XP */}
        <div className="lbj-card" style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}>
          <div className="lbj-card-glow xp" />
          <div className="lbj-c-header">
            <div>
              <div className="lbj-c-title xp">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Dynamic XP Multiplier
              </div>
              <div className="lbj-c-desc">Boost class attendance by offering bonus XP.</div>
            </div>
            <label className="lbj-toggle">
              <input type="checkbox" checked={xpEnabled} onChange={(e) => setXpEnabled(e.target.checked)} />
              <span className="lbj-slider" />
            </label>
          </div>

          <div className="lbj-input-group">
            <label>Select Day</label>
            <div className="lbj-day-pills">
              {DAY_LETTERS.map((letter, i) => (
                <div
                  key={i}
                  className={`lbj-day-pill ${xpDay === i ? "active" : ""}`}
                  onClick={() => setXpDay(i)}
                  title={DAY_NAMES[i]}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div className="lbj-input-group" style={{ flex: 1 }}>
              <label>Time Slot</label>
              <div className="lbj-input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <input
                  type="time"
                  className="lbj-input"
                  value={xpTime}
                  onChange={(e) => setXpTime(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
            <div className="lbj-input-group" style={{ flex: 1 }}>
              <label>Valid Until</label>
              <div className="lbj-input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  type="date"
                  className="lbj-input"
                  value={xpValidUntil}
                  onChange={(e) => setXpValidUntil(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>

          <div className="lbj-input-group">
            <label>Duration / Scope</label>
            <div className="lbj-pills-wrap">
              {([
                { k: "week", label: "Just This Week" },
                { k: "month", label: "All Month" },
                { k: "always", label: "Always On" },
              ] as { k: ScopeType; label: string }[]).map((opt) => (
                <div
                  key={opt.k}
                  className={`lbj-pill ${xpScope === opt.k ? "active" : ""}`}
                  onClick={() => setXpScope(opt.k)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="lbj-input-group">
            <label>Multiplier Level</label>
            <div className="lbj-xp-pills">
              {[1.25, 1.5, 2].map((m) => (
                <div
                  key={m}
                  className={`lbj-xp-pill ${xpMultiplier === m ? "active" : ""}`}
                  onClick={() => setXpMultiplier(m)}
                >
                  {m.toFixed(2)}x
                </div>
              ))}
            </div>
          </div>

          <button className="lbj-btn-secondary" onClick={handleSaveXpEvent} disabled={xpSaving}>
            {xpSaving ? <Spinner /> : null}
            {xpSaving ? "Saving…" : (xpEnabled ? "Add Multiplier Event" : "Disable Multiplier")}
          </button>
        </div>

        {/* CARD 3: TIME GATE */}
        <div className="lbj-card">
          <div className="lbj-card-glow" />
          <div className="lbj-c-header">
            <div>
              <div className="lbj-c-title">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Check-In Time Gate
              </div>
              <div className="lbj-c-desc">Block early check-ins outside the window.</div>
            </div>
            <label className="lbj-toggle">
              <input type="checkbox" checked={gateEnabled} onChange={(e) => setGateEnabled(e.target.checked)} />
              <span className="lbj-slider" />
            </label>
          </div>

          <div className="lbj-input-group" style={{ marginBottom: 0 }}>
            <label>Window Opens Before Class</label>
            <div className="lbj-pills-wrap">
              {[
                { m: 15, label: "15 Min" },
                { m: 30, label: "30 Min" },
                { m: 60, label: "1 Hour" },
                { m: 120, label: "2 Hours" },
                { m: 240, label: "4 Hours" },
              ].map((opt) => (
                <div
                  key={opt.m}
                  className={`lbj-pill ${gateWindow === opt.m ? "active" : ""}`}
                  onClick={() => setGateWindow(opt.m)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 4: GEO-LOCK */}
        <div className="lbj-card">
          <div className="lbj-card-glow" />
          <div className="lbj-c-header">
            <div>
              <div className="lbj-c-title">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Location Geo-Lock
              </div>
              <div className="lbj-c-desc">Require members to be physically inside the academy radius.</div>
            </div>
            <label className="lbj-toggle">
              <input type="checkbox" checked={geoEnabled} onChange={(e) => setGeoEnabled(e.target.checked)} />
              <span className="lbj-slider" />
            </label>
          </div>

          <div className="lbj-input-group">
            <label>Academy Address or Coordinates</label>
            <div style={{ position: 'relative' }}>
              <div className="lbj-input-with-icon">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="lbj-input"
                  placeholder="e.g. Labyrinth BJJ, Fulshear, TX"
                  value={geoLocation}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onFocus={() => geoSuggestions.length > 0 && setShowSuggestions(true)}
                />
                {geoSearching && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <Spinner />
                  </div>
                )}
              </div>
              {/* Autocomplete dropdown */}
              {showSuggestions && geoSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: '#111', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, marginTop: 4, overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                }}>
                  {geoSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => handleSelectSuggestion(s)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'transparent',
                        border: 'none', borderBottom: i < geoSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        color: '#e5e5e5', fontSize: 12, cursor: 'pointer',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,162,76,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                        {s.display_name.split(',')[0]}
                      </div>
                      <div style={{ color: '#666', fontSize: 11 }}>
                        {s.display_name.split(',').slice(1).join(',').trim()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Coordinates display */}
            {geoLat !== null && geoLng !== null && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#C8A24C', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C8A24C" strokeWidth="2" width="12" height="12">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {geoLat.toFixed(6)}, {geoLng.toFixed(6)}
              </div>
            )}
          </div>

          <div className="lbj-input-group">
            <button
              className="lbj-btn-secondary"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.15)" }}
              onClick={handleUseCurrentLocation}
              disabled={geoLocating}
            >
              {geoLocating ? <Spinner /> : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
              )}
              {geoLocating ? "Locating…" : "Use My Current Location"}
            </button>
          </div>

          <div className="lbj-input-group" style={{ marginTop: 24 }}>
            <div className="lbj-range-header">
              <label style={{ margin: 0 }}>Allowed Radius</label>
              <div style={{ textAlign: "right" }}>
                <div className="lbj-range-val">{geoRadius} yd</div>
                <div className="lbj-range-sub">~ {(geoRadius / 1760).toFixed(2)} miles</div>
              </div>
            </div>
            <input
              type="range"
              min={50}
              max={2000}
              step={50}
              value={geoRadius}
              onChange={(e) => setGeoRadius(Number(e.target.value))}
            />
          </div>

          {/* Map preview — real OSM iframe when coords are set, radar fallback otherwise */}
          {geoLat !== null && geoLng !== null ? (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', height: 200 }}>
              <iframe
                key={`${geoLat.toFixed(4)}-${geoLng.toFixed(4)}-${geoRadius}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(geoLng - 0.008).toFixed(6)},${(geoLat - 0.005).toFixed(6)},${(geoLng + 0.008).toFixed(6)},${(geoLat + 0.005).toFixed(6)}&layer=mapnik&marker=${geoLat.toFixed(6)},${geoLng.toFixed(6)}`}
                style={{ width: '100%', height: '100%', border: 'none', filter: 'invert(0.9) hue-rotate(180deg) saturate(0.7)' }}
                title="Academy location"
                loading="lazy"
              />
              <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, color: '#C8A24C', fontFamily: 'monospace', background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: 6 }}>
                {geoEnabled ? '● ACTIVE' : '● OFF'} · {geoRadius}yd radius
              </div>
            </div>
          ) : (
            <div className="lbj-radar-box">
              <div className="lbj-radar-grid" />
              <div className="lbj-radar-ring" style={{ width: radarScale, height: radarScale }} />
              <div className="lbj-radar-center" />
              <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 9, color: '#888891', fontFamily: 'monospace' }}>
                GPS: {geoEnabled ? 'ACTIVE' : 'OFF'} — search an address above
              </div>
            </div>
          )}
        </div>

        {/* SAVE BAR */}
        {portalTarget && createPortal(
          <div className="lbj-save-bar">
            <button className="lbj-btn-save" onClick={handleSaveAll} disabled={saving}>
              {saving ? "Saving…" : "Save System Config"}
            </button>
          </div>,
          portalTarget
        )}

        {toast && (
          <div
            className="lbj-toast"
            style={{
              background: toast.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              borderColor: toast.type === "error" ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.5)",
              color: toast.type === "error" ? "#fca5a5" : "#86efac",
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "lbj-spin 1s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

const rootStyle: React.CSSProperties = {
  background: "#050505",
  color: "#f5f5f5",
  fontFamily: "Inter, system-ui, sans-serif",
  minHeight: "100vh",
  padding: "20px 20px",
  paddingBottom: "calc(180px + env(safe-area-inset-bottom, 34px))",
  WebkitFontSmoothing: "antialiased",
};

const backBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#fff",
  width: 36,
  height: 36,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  padding: 0,
};

function StyleBlock() {
  return (
    <style>{`
      @keyframes lbj-spin { to { transform: rotate(360deg); } }
      @keyframes lbj-radar-pulse { 0% { transform: scale(0.5); opacity: 0.8; } 100% { transform: scale(2); opacity: 0; } }
      @keyframes lbj-toast-in { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

      .lbj-admin-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 24px; padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .lbj-page-title {
        font-size: 20px; font-weight: 900; letter-spacing: -0.02em;
        display: flex; align-items: center; gap: 10px; color: #f5f5f5;
      }
      .lbj-page-title svg { stroke: #C8A24C; }
      .lbj-status-badge {
        font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
        background: rgba(34, 197, 94, 0.1); color: #22c55e;
        padding: 4px 10px; border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.2);
      }

      .lbj-card {
        background: linear-gradient(160deg, rgba(20,20,24,0.6) 0%, rgba(10,10,12,0.8) 100%);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 16px; padding: 24px; margin-bottom: 20px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02);
        position: relative; overflow: hidden;
      }
      .lbj-card-glow {
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, #C8A24C, transparent);
        opacity: 0.2;
      }
      .lbj-card-glow.xp { background: linear-gradient(90deg, transparent, #fbbf24, #f59e0b, transparent); opacity: 0.5; }
      .lbj-card-glow.ann { background: linear-gradient(90deg, transparent, #ef4444, #f43f5e, transparent); opacity: 0.5; }

      .lbj-c-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        margin-bottom: 20px; gap: 12px;
      }
      .lbj-c-title { font-size: 16px; font-weight: 800; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; color: #f5f5f5; }
      .lbj-c-title svg { width: 18px; height: 18px; stroke: #888891; }
      .lbj-c-title.xp svg { stroke: #fbbf24; fill: rgba(251, 191, 36, 0.2); }
      .lbj-c-title.ann svg { stroke: #f43f5e; fill: rgba(244, 63, 94, 0.2); }
      .lbj-c-desc { font-size: 13px; color: #888891; line-height: 1.5; max-width: 85%; }

      .lbj-toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
      .lbj-toggle input { opacity: 0; width: 0; height: 0; }
      .lbj-slider {
        position: absolute; cursor: pointer; inset: 0;
        background-color: rgba(255,255,255,0.1);
        border-radius: 24px; transition: 0.3s;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .lbj-slider:before {
        position: absolute; content: "";
        height: 18px; width: 18px; left: 3px; bottom: 2px;
        background-color: #fff; border-radius: 50%; transition: 0.3s;
        box-shadow: 0 2px 5px rgba(0,0,0,0.5);
      }
      .lbj-toggle input:checked + .lbj-slider { background-color: #C8A24C; box-shadow: 0 0 12px rgba(200,162,76,0.3); border-color: #FFD700; }
      .lbj-toggle input:checked + .lbj-slider:before { transform: translateX(19px); }
      .lbj-toggle.toggle-danger input:checked + .lbj-slider { background-color: #ef4444; box-shadow: 0 0 12px rgba(239,68,68,0.3); border-color: #f87171; }

      .lbj-input-group { margin-bottom: 16px; position: relative; }
      .lbj-input-group label {
        display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.1em; color: #888891; margin-bottom: 8px;
      }
      .lbj-input-with-icon { position: relative; }
      .lbj-input-with-icon svg {
        position: absolute; left: 14px; top: 12px;
        width: 16px; height: 16px; stroke: #888891; pointer-events: none;
      }
      .lbj-input {
        width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06);
        color: #fff; font-family: 'Inter', sans-serif; font-size: 14px;
        padding: 12px 14px; border-radius: 10px; transition: all 0.2s;
      }
      .lbj-input-with-icon .lbj-input { padding-left: 40px; }
      .lbj-input:focus { outline: none; border-color: #C8A24C; box-shadow: 0 0 0 3px rgba(200,162,76,0.15); }
      textarea.lbj-input { resize: vertical; min-height: 80px; line-height: 1.5; }

      .lbj-pills-wrap {
        display: flex; gap: 8px; flex-wrap: wrap;
        background: rgba(0,0,0,0.3); padding: 6px; border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.06);
      }
      .lbj-pill {
        flex: 1; min-width: 60px; text-align: center;
        padding: 10px 12px; font-size: 12px; font-weight: 600; color: #888891;
        cursor: pointer; border-radius: 8px; transition: all 0.2s;
        border: 1px solid transparent; white-space: nowrap;
      }
      .lbj-pill:hover { background: rgba(255,255,255,0.05); color: #fff; }
      .lbj-pill.active {
        background: rgba(200,162,76,0.15); color: #FFD700;
        border: 1px solid rgba(200,162,76,0.5); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }

      .lbj-badge-pill { padding: 8px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.06); background: rgba(0,0,0,0.4); color: #888891; cursor: pointer; transition: 0.2s; user-select: none; }
      .lbj-badge-pill:hover { background: rgba(255,255,255,0.05); }
      .lbj-badge-pill.active[data-type="priority"] { background: rgba(239,68,68,0.15); color: #fca5a5; border-color: rgba(239,68,68,0.5); }
      .lbj-badge-pill.active[data-type="event"] { background: rgba(200,162,76,0.15); color: #FFD700; border-color: rgba(200,162,76,0.5); }
      .lbj-badge-pill.active[data-type="schedule"] { background: rgba(59,130,246,0.15); color: #93c5fd; border-color: rgba(59,130,246,0.5); }
      .lbj-badge-pill.active[data-type="reminder"] { background: rgba(168,85,247,0.15); color: #d8b4fe; border-color: rgba(168,85,247,0.5); }
      .lbj-badge-pill.active[data-type="new"] { background: rgba(34,197,94,0.15); color: #86efac; border-color: rgba(34,197,94,0.5); }

      .lbj-day-pills { display: flex; gap: 6px; margin-bottom: 0; }
      .lbj-day-pill {
        width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; font-size: 13px; font-weight: 700;
        background: rgba(255,255,255,0.05); color: #888891; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s;
      }
      .lbj-day-pill.active { background: #fff; color: #000; border-color: #fff; box-shadow: 0 4px 12px rgba(255,255,255,0.2); }

      .lbj-xp-pills { display: flex; gap: 8px; margin-bottom: 0; }
      .lbj-xp-pill {
        flex: 1; padding: 12px 0; border-radius: 12px; text-align: center;
        font-size: 16px; font-weight: 900; font-style: italic; color: #888891;
        background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; transition: all 0.2s;
      }
      .lbj-xp-pill.active {
        background: linear-gradient(135deg, #f59e0b, #d97706); color: #000;
        border-color: #fbbf24; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.4);
        transform: translateY(-2px);
      }

      .lbj-range-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
      .lbj-range-val { font-size: 20px; font-weight: 800; color: #C8A24C; }
      .lbj-range-sub { font-size: 12px; color: #888891; font-weight: 500; }
      .lbj-card input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; }
      .lbj-card input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; height: 24px; width: 24px; border-radius: 50%;
        background: #FFD700; cursor: pointer; margin-top: -10px;
        box-shadow: 0 0 10px rgba(200,162,76,0.5), inset 0 -2px 4px rgba(0,0,0,0.3); border: 2px solid #fff;
      }
      .lbj-card input[type=range]::-webkit-slider-runnable-track { width: 100%; height: 6px; cursor: pointer; background: rgba(255,255,255,0.1); border-radius: 4px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.5); }
      .lbj-card input[type=range]::-moz-range-thumb { height: 24px; width: 24px; border-radius: 50%; background: #FFD700; cursor: pointer; border: 2px solid #fff; }
      .lbj-card input[type=range]::-moz-range-track { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 4px; }

      .lbj-radar-box {
        width: 100%; height: 120px; background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; margin-top: 20px;
        display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
      }
      .lbj-radar-grid {
        position: absolute; inset: 0;
        background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 20px 20px; background-position: center;
      }
      .lbj-radar-center { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; box-shadow: 0 0 8px #ef4444; position: relative; z-index: 2; }
      .lbj-radar-ring { position: absolute; border-radius: 50%; border: 1px solid #C8A24C; background: rgba(200,162,76,0.1); animation: lbj-radar-pulse 3s infinite; }

      .lbj-flex-row-check {
        display: flex; align-items: center; justify-content: space-between;
        background: rgba(255,255,255,0.02); padding: 14px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      }
      .lbj-flex-row-check span { font-size: 14px; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 8px; }
      .lbj-flex-row-check span svg { stroke: #C8A24C; width: 18px; height: 18px; }

      .lbj-btn-secondary {
        background: rgba(255,255,255,0.05); color: #fff; font-size: 13px; font-weight: 700;
        border: 1px solid rgba(255,255,255,0.06); padding: 12px 16px; border-radius: 10px; cursor: pointer;
        display: flex; align-items: center; gap: 8px; transition: all 0.2s; justify-content: center; width: 100%;
        font-family: 'Inter', sans-serif;
      }
      .lbj-btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.1); }
      .lbj-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
      .lbj-btn-secondary.btn-announcement {
        background: rgba(244, 63, 94, 0.1); color: #fecdd3; border: 1px solid rgba(244, 63, 94, 0.3);
      }
      .lbj-btn-secondary.btn-announcement:hover:not(:disabled) { background: rgba(244, 63, 94, 0.2); }

      .lbj-save-bar {
        position: fixed; bottom: calc(72px + env(safe-area-inset-bottom, 34px)); left: 50%; transform: translateX(-50%); z-index: 10;
        width: calc(430px - 40px); max-width: calc(100% - 40px);
        background: rgba(10,10,12,0.9); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(200,162,76,0.5); padding: 16px; border-radius: 16px;
        display: flex; gap: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(200,162,76,0.1);
      }
      .lbj-btn-save {
        flex: 1; background: linear-gradient(135deg, #C8A24C, #FFD700);
        color: #000; font-size: 15px; font-weight: 900; text-transform: uppercase;
        letter-spacing: 0.05em; padding: 16px; border-radius: 10px; border: none;
        cursor: pointer; box-shadow: inset 0 1px 1px rgba(255,255,255,0.5); transition: transform 0.1s;
        font-family: 'Inter', sans-serif;
      }
      .lbj-btn-save:active:not(:disabled) { transform: scale(0.98); }
      .lbj-btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

      .lbj-toast {
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        padding: 12px 18px; border-radius: 10px; border: 1px solid;
        font-size: 13px; font-weight: 700; z-index: 20;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        animation: lbj-toast-in 0.25s ease-out;
      }
    `}</style>
  );
}
