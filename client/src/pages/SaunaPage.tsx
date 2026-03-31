import { useState, useEffect, useCallback } from "react";
import { getSaunaMembers, getSaunaStatus, saunaCheckin, saunaCheckout } from "@/lib/api";
import type { SaunaMember, SaunaStatus } from "@/lib/api";

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ minutes, max = 25 }: { minutes: number; max?: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(minutes / max, 1);
  const offset = circumference - progress * circumference;
  const color = minutes >= 20 ? "#E05555" : minutes >= 15 ? "#E08228" : "#4CAF80";

  return (
    <svg width={64} height={64} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={32} cy={32} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={3.5} />
      <circle
        cx={32} cy={32} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text
        x={32} y={32}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={13}
        fontWeight={700}
        style={{ transform: "rotate(90deg)", transformOrigin: "32px 32px" }}
      >
        {minutes}m
      </text>
    </svg>
  );
}

// ── House Rules ───────────────────────────────────────────────────────────────

const HOUSE_RULES = [
  { emoji: "📝", text: "Sign in & out on this tablet before entering and when leaving" },
  { emoji: "🧶", text: "Shower first if coming off the mats" },
  { emoji: "🚫", text: "No shoes or dirty clothes inside the sauna room" },
  { emoji: "💎", text: "Use only clean towels — sit/lie on a towel at all times" },
  { emoji: "📱", text: "No phone calls or loud music inside the sauna" },
  { emoji: "💧", text: "Stay hydrated — drink water before and after your session" },
  { emoji: "🛀", text: "Wipe down your spot when you're done" },
  { emoji: "⚠️", text: "If you feel dizzy or unwell, exit immediately" },
  { emoji: "🔇", text: "Keep conversation low — respect others' quiet time" },
  { emoji: "⏰", text: "Limit sessions during peak hours so everyone gets a turn" },
  { emoji: "🔥", text: "Recommended session: 15–20 minutes" },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function SaunaPage() {
  const [members, setMembers] = useState<SaunaMember[]>([]);
  const [status, setStatus] = useState<SaunaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [membersData, statusData] = await Promise.all([
        getSaunaMembers().catch(() => []),
        getSaunaStatus().catch(() => ({ active: [], todayCount: 0 })),
      ]);
      setMembers(membersData);
      setStatus(statusData);
      setError(false);
    } catch {
      setError(true);
      setStatus({ active: [], todayCount: 0 });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCheckin = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      await saunaCheckin(selectedMember);
      setSelectedMember("");
      setSearch("");
      await loadData();
    } catch (err) {
      console.error("Checkin failed:", err);
    }
    setActionLoading(false);
  };

  const handleCheckout = async (name: string) => {
    setActionLoading(true);
    try {
      await saunaCheckout(name);
      await loadData();
    } catch (err) {
      console.error("Checkout failed:", err);
    }
    setActionLoading(false);
  };

  const filteredMembers = members.filter(
    m => m.name.toLowerCase().includes(search.toLowerCase()) && m.type === "Adult"
  );

  const activeSessions = status?.active || [];
  const todayCount = status?.todayCount || 0;
  const isSelectedCheckedIn = activeSessions.some(s => s.name === selectedMember);

  return (
    <div className="app-content" style={{ maxWidth: 430, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ padding: "max(16px, env(safe-area-inset-top, 16px)) 20px 6px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0F0", letterSpacing: -0.3, margin: 0 }}>
              Sauna
            </h1>
          </div>
          <div style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 8,
            background: "rgba(76,175,128,0.1)", border: "1px solid rgba(76,175,128,0.15)",
          }}>
            <span style={{ fontSize: 12 }}>🧖</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4CAF80" }}>Ready</span>
          </div>
        </div>
        {error && (
          <div style={{ fontSize: 11, color: "#E08228", marginTop: 4, marginBottom: 4 }}>
            ⚠️ Unable to connect — showing cached data
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 10, padding: "10px 20px 14px" }}>
        <div style={{
          flex: 1, padding: "16px 14px", borderRadius: 12,
          background: "#111", border: "1px solid #1A1A1A",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 10, color: "#666", fontWeight: 600, letterSpacing: 0.5 }}>CURRENTLY IN</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: activeSessions.length > 0 ? "#C8A24C" : "#F0F0F0" }}>
            {loading ? "—" : activeSessions.length}
          </div>
        </div>
        <div style={{
          flex: 1, padding: "16px 14px", borderRadius: 12,
          background: "#111", border: "1px solid #1A1A1A",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 14 }}>✅</span>
            <span style={{ fontSize: 10, color: "#666", fontWeight: 600, letterSpacing: 0.5 }}>SESSIONS TODAY</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#F0F0F0" }}>
            {loading ? "—" : todayCount}
          </div>
        </div>
      </div>

      {/* Check In / Out Section */}
      <div style={{ padding: "0 20px 14px" }}>
        <div style={{ fontSize: 10, color: "#666", fontWeight: 600, letterSpacing: 1.5, marginBottom: 8 }}>
          CHECK IN / OUT
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <div style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "#555", fontSize: 14, pointerEvents: "none",
          }}>
            🔍
          </div>
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => search && setShowDropdown(true)}
            placeholder="Search members..."
            style={{
              width: "100%", padding: "11px 14px 11px 36px",
              borderRadius: 10, border: "1px solid #222",
              background: "#111", color: "#F0F0F0", fontSize: 14,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Dropdown results */}
        {search && showDropdown && (
          <div style={{
            maxHeight: 180, overflowY: "auto", marginBottom: 10,
            borderRadius: 10, background: "#111", border: "1px solid #1A1A1A",
          }}>
            {filteredMembers.slice(0, 8).map((m, i) => {
              const isCheckedIn = activeSessions.some(s => s.name === m.name);
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedMember(m.name);
                    setSearch("");
                    setShowDropdown(false);
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", textAlign: "left",
                    padding: "10px 14px", fontSize: 14,
                    color: selectedMember === m.name ? "#C8A24C" : "#F0F0F0",
                    background: selectedMember === m.name ? "rgba(200,162,76,0.06)" : "transparent",
                    borderBottom: i < Math.min(filteredMembers.length, 8) - 1 ? "1px solid #1A1A1A" : "none",
                    border: "none", cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span>{m.name}</span>
                  {isCheckedIn && (
                    <span style={{ fontSize: 9, color: "#4CAF80", fontWeight: 700 }}>IN SAUNA</span>
                  )}
                </button>
              );
            })}
            {filteredMembers.length === 0 && (
              <div style={{ padding: "12px 14px", fontSize: 13, color: "#666" }}>
                No members found
              </div>
            )}
          </div>
        )}

        {/* Selected member */}
        {selectedMember && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 10, marginBottom: 10,
            background: isSelectedCheckedIn ? "rgba(224,85,85,0.05)" : "rgba(200,162,76,0.05)",
            border: isSelectedCheckedIn ? "1px solid rgba(224,85,85,0.15)" : "1px solid rgba(200,162,76,0.15)",
          }}>
            <span style={{ fontSize: 14 }}>👤</span>
            <span style={{ flex: 1, fontSize: 14, color: "#F0F0F0", fontWeight: 500 }}>
              {selectedMember}
            </span>
            {isSelectedCheckedIn && (
              <span style={{ fontSize: 9, color: "#4CAF80", fontWeight: 700, marginRight: 4 }}>IN SAUNA</span>
            )}
            <button
              onClick={() => setSelectedMember("")}
              style={{
                background: "none", border: "none", color: "#666",
                fontSize: 12, cursor: "pointer", padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Check In / Out Button */}
        {isSelectedCheckedIn ? (
          <button
            onClick={() => handleCheckout(selectedMember)}
            disabled={!selectedMember || actionLoading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px", borderRadius: 12, border: "none",
              background: "#E05555", color: "#fff",
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              opacity: actionLoading ? 0.7 : 1,
            }}
          >
            {actionLoading ? "Checking out..." : "🚪 Check Out"}
          </button>
        ) : (
          <button
            onClick={handleCheckin}
            disabled={!selectedMember || actionLoading}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px", borderRadius: 12, border: "none",
              background: selectedMember ? "#C8A24C" : "#1A1A1A",
              color: selectedMember ? "#0A0A0A" : "#666",
              fontSize: 15, fontWeight: 700, cursor: selectedMember ? "pointer" : "default",
              opacity: actionLoading ? 0.7 : 1,
            }}
          >
            {actionLoading ? "Checking in..." : "🔥 Check In"}
          </button>
        )}
      </div>

      {/* Active Sessions */}
      <div style={{ padding: "0 20px 14px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>🔥</span>
            <span style={{ fontSize: 10, color: "#666", fontWeight: 600, letterSpacing: 1.5 }}>
              IN THE SAUNA
            </span>
          </div>
          {activeSessions.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
              background: "rgba(200,162,76,0.1)", color: "#C8A24C",
            }}>
              {activeSessions.length} active
            </span>
          )}
        </div>

        {activeSessions.length === 0 ? (
          <div style={{
            padding: "24px 16px", borderRadius: 12, textAlign: "center",
            background: "#111", border: "1px solid #1A1A1A",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🧖</div>
            <div style={{ fontSize: 13, color: "#666" }}>Sauna is empty</div>
            <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
              {loading ? "Loading..." : "Check someone in above"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {activeSessions.map((session, i) => {
              const mins = session.minutes || session.duration || 0;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px", borderRadius: 12,
                  background: "#111", border: "1px solid #1A1A1A",
                }}>
                  <ProgressRing minutes={mins} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, color: "#F0F0F0",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {session.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      Since {new Date(session.checkIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </div>
                    {mins >= 20 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <span style={{ fontSize: 10 }}>⚠️</span>
                        <span style={{ fontSize: 10, color: "#E05555", fontWeight: 600 }}>Over recommended time</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleCheckout(session.name)}
                    disabled={actionLoading}
                    style={{
                      padding: "8px 12px", borderRadius: 8, border: "none",
                      background: "rgba(224,85,85,0.1)", color: "#E05555",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Check Out
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* House Rules */}
      <div style={{ padding: "0 20px 32px" }}>
        <button
          onClick={() => setShowRules(!showRules)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", borderRadius: showRules ? "12px 12px 0 0" : 12,
            background: "#111", border: "1px solid #1A1A1A",
            borderBottom: showRules ? "none" : "1px solid #1A1A1A",
            cursor: "pointer", WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📜</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#F0F0F0" }}>House Rules</span>
          </div>
          <span style={{
            fontSize: 12, color: "#666",
            transform: showRules ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
          }}>
            ▼
          </span>
        </button>

        {showRules && (
          <div style={{
            padding: "4px 16px 16px",
            borderRadius: "0 0 12px 12px",
            background: "#111", border: "1px solid #1A1A1A",
            borderTop: "none",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HOUSE_RULES.map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1.6 }}>{rule.emoji}</span>
                  <span style={{ fontSize: 12, color: "#999", lineHeight: 1.6 }}>{rule.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
