/**
 * AdminPage.tsx — Labyrinth BJJ Admin Panel
 *
 * Injected into the same member portal. Accessible only when
 * member.isAdmin is true (role: owner | admin | coach | instructor).
 *
 * Secondary access: Ctrl+Shift+A keyboard shortcut (see App.tsx).
 *
 * Tabs:
 *   📊 Dashboard  — live KPIs from getDashboard
 *   👥 Members    — searchable table, inline belt/status edit
 *   📅 Trials     — upcoming trial bookings feed
 *   💬 Notes      — per-member comms & notes
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { useAuth } from "@/lib/auth-context";
import {
  adminGetDashboard,
  adminGetMembers,
  adminUpdateMember,
  adminGetMemberComms,
  adminSaveNote,
  adminGetBookings,
  beltSavePromotion,
  gasCall,
  getToken,
  cachedGasCall,
  getPinnedAnnouncement,
  clearPinnedAnnouncement,
  type AdminMember,
  type AdminDashboard,
  type MemberComm,
} from "@/lib/api";
import { getBeltColor } from "@/lib/constants";
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare, Settings,
  RefreshCw, Search, ChevronDown, ChevronRight, Check,
  X, Loader2, Save, AlertCircle, ArrowLeft,
} from "lucide-react";

const GOLD = "#C8A24C";
const BELT_OPTIONS = ["White", "Blue", "Purple", "Brown", "Black", "Grey", "Yellow", "Orange", "Green"];
const STATUS_OPTIONS = ["Active", "Trial", "Paused", "Failed", "Cancelled"];
type AdminTab = "dashboard" | "members" | "trials" | "notes" | "settings";

// ─── Root ──────────────────────────────────────────────────────────

export default function AdminPage({ onBack }: { onBack: () => void }) {
  const { member } = useAuth();
  const [tab, setTab] = useState<AdminTab>("dashboard");

  if (!member?.isAdmin) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#666" }}>
        <AlertCircle size={32} />
        <p style={{ fontSize: 14 }}>Access denied. Admin role required.</p>
        <button onClick={onBack} style={{ fontSize: 13, color: GOLD, background: "none", border: "none", cursor: "pointer" }}>← Back</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0A0A0A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1A1A1A", flexShrink: 0 }}>
        <button onClick={onBack} style={{ color: "#666", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F0F0" }}>Admin Panel</span>
          <span style={{ fontSize: 11, color: "#555", marginLeft: 8 }}>{member.name} · {member.role || "admin"}</span>
        </div>
        {/* Role pill */}
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 6, backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30` }}>
          {(member.role || "admin").toUpperCase()}
        </span>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid #1A1A1A", flexShrink: 0, overflowX: "auto" }}>
        {([
          { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
          { id: "members",   label: "Members",   icon: <Users size={14} /> },
          { id: "trials",    label: "Trials",    icon: <CalendarDays size={14} /> },
          { id: "notes",     label: "Notes",     icon: <MessageSquare size={14} /> },
          { id: "settings",  label: "Settings",  icon: <Settings size={14} /> },
        ] as { id: AdminTab; label: string; icon: React.ReactNode }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "11px 16px", fontSize: 12, fontWeight: 600,
              color: tab === t.id ? GOLD : "#666",
              background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${GOLD}` : "2px solid transparent",
              cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s",
            }}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "dashboard" && <DashboardTab />}
        {tab === "members"   && <MembersTab />}
        {tab === "trials"    && <TrialsTab />}
        {tab === "notes"     && <NotesTab />}
        {tab === "settings"  && <SettingsTab />}
      </div>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const d = await adminGetDashboard();
    if (d) setData(d); else setError("Could not load dashboard. Tap to retry.");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState rows={4} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const beltCounts = { White: 0, Blue: 0, Purple: 0, Brown: 0, Black: 0 };

  return (
    <div style={{ padding: "16px" }}>
      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <KpiCard label="Active Members" value={data.activeMembers} color={GOLD} />
        <KpiCard label="MRR" value={`$${Math.round(data.mrr).toLocaleString()}`} color="#4CAF80" />
        <KpiCard label="Collected (mo.)" value={`$${Math.round(data.monthlyPaid).toLocaleString()}`} color="#4CAF80" />
        <KpiCard label="Failed Payments" value={data.failedPayments} color={data.failedPayments > 0 ? "#E05555" : "#4CAF80"} />
        <KpiCard label="New This Month" value={data.newMembers} color="#3B9EFF" />
        <KpiCard label="Upcoming Trials" value={data.upcomingTrials} color="#E08228" />
      </div>

      {/* Overdue payments */}
      {data.overduePayments?.length > 0 && (
        <Section title={`⚠ Overdue (${data.overduePayments.length})`} accent="#E05555">
          {data.overduePayments.slice(0, 5).map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #111" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>{p.name}</p>
                <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>{p.description} · {new Date(p.date).toLocaleDateString()}</p>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#E05555" }}>${Number(p.amount).toFixed(2)}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Recent payments */}
      {data.recentPayments?.length > 0 && (
        <Section title="Recent Payments">
          {data.recentPayments.slice(0, 6).map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #111" }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#F0F0F0", margin: 0 }}>{p.name || (p as any).MemberName}</p>
                <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0" }}>{p.type || (p as any).Type}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: (p.status || (p as any).Status) === "Succeeded" ? "#4CAF80" : "#E05555", margin: 0 }}>
                  ${Number(p.amount || (p as any).Amount || 0).toFixed(2)}
                </p>
                <p style={{ fontSize: 10, color: "#555", margin: "2px 0 0" }}>{new Date(p.date || (p as any).Date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Belt distribution (from members count estimate) */}
      <Section title="Belt Distribution (All Members)">
        {Object.entries(beltCounts).map(([belt, count]) => (
          <div key={belt} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: getBeltColor(belt.toLowerCase()), flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#999", flex: 1 }}>{belt}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#F0F0F0" }}>{count}</span>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Open Members tab for live distribution.</p>
      </Section>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────

function MembersTab() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AdminMember>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [coachNoteText, setCoachNoteText] = useState('');
  const [coachNoteSaving, setCoachNoteSaving] = useState(false);
  const [coachNoteSaved, setCoachNoteSaved] = useState(false);

  const saveCoachNote = async (memberEmail: string) => {
    if (!coachNoteText.trim()) return;
    setCoachNoteSaving(true);
    try {
      await gasCall('saveCoachNote', {
        token: getToken() || localStorage.getItem('lbjj_session_token') || '',
        memberEmail,
        note: coachNoteText.trim(),
        date: new Date().toISOString().split('T')[0],
      });
      setCoachNoteText('');
      setCoachNoteSaved(true);
      setTimeout(() => setCoachNoteSaved(false), 2000);
    } catch {}
    setCoachNoteSaving(false);
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const list = await adminGetMembers();
    if (list.length > 0) {
      setMembers(list);
    } else {
      setError("Could not load members.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || (m.Name || "").toLowerCase().includes(q) || (m.Email || "").toLowerCase().includes(q) || (m.Phone || "").includes(q);
    const matchStatus = !statusFilter || (m.Status || "").toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Belt distribution derived from filtered list
  const beltDist: Record<string, number> = {};
  members.forEach(m => {
    const b = (m.Belt || "White").trim();
    const normalized = b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
    beltDist[normalized] = (beltDist[normalized] || 0) + 1;
  });

  const startEdit = (m: AdminMember) => {
    setEditingId(m.ID || String(m._row));
    setEditData({ Belt: m.Belt, Status: m.Status, Notes: m.Notes, Plan: m.Plan });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); setSaveMsg(""); };

  const saveEdit = async (m: AdminMember) => {
    setSaving(true); setSaveMsg("");
    const id = m.ID || String(m._row);
    const result = await adminUpdateMember({ ID: id, _row: m._row, ...editData });
    setSaving(false);
    if (result.success) {
      // Auto-write Belt Journey entry when admin changes a member's belt
      if (editData.Belt && editData.Belt !== m.Belt) {
        beltSavePromotion({
          belt: editData.Belt,
          stripes: 0,
          date: new Date().toISOString().split('T')[0],
          note: 'Approved by coach',
        }).catch(() => {});
      }
      setMembers(prev => prev.map(x => (x.ID === m.ID || x._row === m._row) ? { ...x, ...editData } : x));
      setSaveMsg("Saved");
      setTimeout(() => { setEditingId(null); setSaveMsg(""); }, 1000);
    } else {
      setSaveMsg(result.error || "Save failed");
    }
  };

  if (loading) return <ListSkeleton count={8} />;
  if (error && members.length === 0) return <ErrorState message={error} onRetry={load} />;

  const activeCount = members.filter(m => m.StripeSubscriptionID && m.StripeSubscriptionID.trim() !== '').length;
  const trialCount = 0;

  return (
    <div style={{ padding: "16px" }}>
      {/* Summary line */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12, color: "#666" }}>
        <span><strong style={{ color: "#F0F0F0" }}>{members.length}</strong> total</span>
        <span><strong style={{ color: "#4CAF80" }}>{activeCount}</strong> active</span>
        <span><strong style={{ color: "#E08228" }}>{trialCount}</strong> trials</span>
      </div>

      {/* Belt mini-chart */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.entries(beltDist).sort((a, b) => b[1] - a[1]).map(([belt, count]) => (
          <div key={belt} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, backgroundColor: "#111", border: "1px solid #1A1A1A" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: getBeltColor(belt.toLowerCase()) }} />
            <span style={{ fontSize: 11, color: "#999" }}>{belt}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#F0F0F0" }}>{count}</span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, backgroundColor: "#111", borderRadius: 10, padding: "8px 12px", border: "1px solid #1A1A1A" }}>
          <Search size={14} style={{ color: "#555", flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "#F0F0F0" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ color: "#555", background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={14} /></button>}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ backgroundColor: "#111", border: "1px solid #1A1A1A", borderRadius: 10, padding: "8px 10px", fontSize: 12, color: "#F0F0F0", outline: "none" }}
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Member list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#555", fontSize: 13 }}>No members found</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(m => {
            const id = m.ID || String(m._row);
            const isEditing = editingId === id;
            return (
              <div key={id} style={{ backgroundColor: "#111", borderRadius: 12, border: `1px solid ${isEditing ? GOLD + "40" : "#1A1A1A"}`, overflow: "hidden", transition: "border-color 0.2s" }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px" }}>
                  {/* Belt dot */}
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: getBeltColor((m.Belt || "white").toLowerCase()), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#F0F0F0", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.Name}</p>
                    {m.Phone && (
                      <div style={{ fontSize: 11, color: '#666', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.Phone}
                      </div>
                    )}
                    {m.Email && (
                      <div style={{ fontSize: 11, color: '#555', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.Email}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <StatusBadge status={m.Status} />
                    <span style={{ fontSize: 10, color: "#555" }}>{m.Plan}</span>
                  </div>
                  <button
                    onClick={() => isEditing ? cancelEdit() : startEdit(m)}
                    style={{ marginLeft: 4, color: isEditing ? "#E05555" : "#555", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  >
                    {isEditing ? <X size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid #1A1A1A" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                      <LabeledSelect
                        label="Belt"
                        value={editData.Belt || m.Belt || ""}
                        options={BELT_OPTIONS}
                        onChange={v => setEditData(p => ({ ...p, Belt: v }))}
                      />
                      <LabeledSelect
                        label="Status"
                        value={editData.Status || m.Status || ""}
                        options={STATUS_OPTIONS}
                        onChange={v => setEditData(p => ({ ...p, Status: v }))}
                      />
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: 10, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</label>
                      <textarea
                        value={editData.Notes ?? m.Notes ?? ""}
                        onChange={e => setEditData(p => ({ ...p, Notes: e.target.value }))}
                        rows={2}
                        style={{ width: "100%", marginTop: 4, backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#F0F0F0", outline: "none", resize: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    {/* Coach Note */}
                    <div style={{ marginTop: 12, borderTop: '1px solid #1A1A1A', paddingTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Coach Note
                      </div>
                      <textarea
                        value={coachNoteText}
                        onChange={e => setCoachNoteText(e.target.value)}
                        placeholder="e.g. Good guard retention today. Consider entering next local tournament."
                        rows={2}
                        style={{
                          width: '100%', background: '#111', border: '1px solid #222', borderRadius: 8,
                          color: '#F0F0F0', fontSize: 13, padding: '8px 10px', resize: 'none',
                          fontFamily: 'inherit', boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <button
                          onClick={() => saveCoachNote(m.Email)}
                          disabled={coachNoteSaving || !coachNoteText.trim()}
                          style={{
                            padding: '8px 16px', borderRadius: 8,
                            background: '#C8A24C', color: '#000', fontWeight: 700, fontSize: 12,
                            border: 'none', cursor: coachNoteText.trim() ? 'pointer' : 'default',
                            opacity: coachNoteText.trim() ? 1 : 0.4,
                          }}
                        >
                          {coachNoteSaving ? 'Saving…' : 'Save Note'}
                        </button>
                        {coachNoteSaved && <span style={{ fontSize: 12, color: '#4CAF80' }}>Saved</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                      {saveMsg && <span style={{ fontSize: 12, color: saveMsg === "Saved" ? "#4CAF80" : "#E05555" }}>{saveMsg}</span>}
                      <button
                        onClick={() => saveEdit(m)}
                        disabled={saving}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, backgroundColor: GOLD, color: "#0A0A0A", fontSize: 13, fontWeight: 700, border: "none", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Trial status auto-age ────────────────────────────────────────

function getTrialStatus(booking: any): string {
  const raw = booking.status || booking.Status || 'New';
  if (raw.toLowerCase() !== 'new') return raw;

  const dateStr = booking.date || booking.Date || booking.createdAt || booking.timestamp;
  if (!dateStr) return raw;

  const daysOld = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld > 14) return 'Stale';
  if (daysOld > 7) return 'Follow Up';
  return 'New';
}

// ─── Trials Tab ────────────────────────────────────────────────────

function TrialsTab() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const list = await adminGetBookings();
    setBookings(list);
    if (list.length === 0) setError("No upcoming trial bookings.");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState rows={3} />;

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: "#666" }}>{bookings.length} upcoming {bookings.length === 1 ? "trial" : "trials"}</span>
        <button onClick={load} style={{ color: "#555", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <RefreshCw size={14} />
        </button>
      </div>
      {bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#555", fontSize: 13 }}>No trial bookings right now.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {bookings.map((b, i) => (
            <div key={i} style={{ backgroundColor: "#111", borderRadius: 12, border: "1px solid #1A1A1A", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>{b.name}</p>
                  <p style={{ fontSize: 12, color: "#666", margin: "3px 0 0" }}>{b.classType}</p>
                  {b.email && <p style={{ fontSize: 11, color: "#555", margin: "2px 0 0" }}>{b.email}</p>}
                  {b.phone && <p style={{ fontSize: 11, color: "#555", margin: "1px 0 0" }}>{b.phone}</p>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 10 }}>
                  <StatusBadge status={getTrialStatus(b)} />
                  <p style={{ fontSize: 11, color: "#555", margin: "4px 0 0" }}>{b.date ? new Date(b.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notes/Comms Tab ──────────────────────────────────────────────

function NotesTab() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedMember, setSelectedMember] = useState<AdminMember | null>(null);
  const [comms, setComms] = useState<MemberComm[]>([]);
  const [loadingComms, setLoadingComms] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Announcement send state
  const [annText, setAnnText] = useState("");
  const [annSending, setAnnSending] = useState(false);
  const [annSent, setAnnSent] = useState(false);
  const [pinToHome, setPinToHome] = useState(false);

  useEffect(() => {
    adminGetMembers().then(list => { setMembers(list); setLoadingMembers(false); });
  }, []);

  const sendAnnouncement = async () => {
    if (!annText.trim()) return;
    setAnnSending(true);
    try {
      const token = getToken() || localStorage.getItem('lbjj_session_token') || '';
      await gasCall('chatSendMessage', { token, channel: 'announcements', text: annText.trim(), pinToHome });
      setAnnText('');
      setPinToHome(false);
      setAnnSent(true);
      setTimeout(() => setAnnSent(false), 2500);
    } catch {}
    setAnnSending(false);
  };

  const selectMember = useCallback(async (m: AdminMember) => {
    setSelectedMember(m);
    setComms([]);
    setLoadingComms(true);
    const c = await adminGetMemberComms(m.Name, m.Email);
    setComms(c);
    setLoadingComms(false);
  }, []);

  const saveNote = async () => {
    if (!noteText.trim() || !selectedMember) return;
    setSaving(true);
    const res = await adminSaveNote(selectedMember.Name, selectedMember.Email, noteText.trim());
    setSaving(false);
    if (res.success) {
      setNoteText("");
      const c = await adminGetMemberComms(selectedMember.Name, selectedMember.Email);
      setComms(c);
    }
  };

  const filteredMembers = members.filter(m => {
    const q = search.toLowerCase();
    return !q || (m.Name || "").toLowerCase().includes(q) || (m.Email || "").toLowerCase().includes(q);
  });

  if (selectedMember) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Member header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid #1A1A1A", flexShrink: 0 }}>
          <button onClick={() => setSelectedMember(null)} style={{ color: "#666", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#F0F0F0" }}>{selectedMember.Name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666" }}>{selectedMember.Email} · {selectedMember.Plan || "No plan"}</p>
          </div>
        </div>

        {/* Comms list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {loadingComms ? (
            <LoadingState rows={3} />
          ) : comms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#555", fontSize: 13 }}>No notes or messages yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {comms.map((c, i) => (
                <div key={i} style={{ backgroundColor: "#111", borderRadius: 10, border: "1px solid #1A1A1A", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: GOLD }}>{c.type || "Note"}</span>
                    <span style={{ fontSize: 10, color: "#555" }}>{c.date ? new Date(c.date).toLocaleDateString() : ""}</span>
                  </div>
                  {c.subject && <p style={{ fontSize: 12, fontWeight: 600, color: "#DDD", margin: "0 0 3px" }}>{c.subject}</p>}
                  <p style={{ fontSize: 12, color: "#999", margin: 0, lineHeight: 1.5 }}>{c.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add note input */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid #1A1A1A", flexShrink: 0, paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note about this member..."
              rows={2}
              style={{ flex: 1, backgroundColor: "#111", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#F0F0F0", outline: "none", resize: "none" }}
            />
            <button
              onClick={saveNote}
              disabled={!noteText.trim() || saving}
              style={{ alignSelf: "flex-end", width: 40, height: 40, borderRadius: "50%", backgroundColor: noteText.trim() ? GOLD : "#1A1A1A", color: noteText.trim() ? "#0A0A0A" : "#444", border: "none", cursor: noteText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      {/* Send Announcement */}
      <div style={{ backgroundColor: "#111", borderRadius: 12, border: "1px solid #1A1A1A", padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Send Announcement
        </div>
        <textarea
          value={annText}
          onChange={e => setAnnText(e.target.value)}
          placeholder="Type an announcement for all members..."
          rows={3}
          style={{ width: '100%', background: '#0D0D0D', border: '1px solid #222', borderRadius: 8, color: '#F0F0F0', fontSize: 13, padding: '8px 10px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: 10 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F0' }}>Pin to Home Dashboard</div>
            <div style={{ fontSize: 10, color: '#555' }}>Shows this announcement on members' home screens</div>
          </div>
          <button
            type="button"
            onClick={() => setPinToHome(v => !v)}
            style={{
              width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: pinToHome ? '#C8A24C' : '#333',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FFF', position: 'absolute', top: 3, left: pinToHome ? 21 : 3, transition: 'left 0.2s' }}/>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={sendAnnouncement}
            disabled={annSending || !annText.trim()}
            style={{
              padding: '9px 18px', borderRadius: 8,
              background: annText.trim() ? '#C8A24C' : '#1A1A1A',
              color: annText.trim() ? '#000' : '#444',
              fontWeight: 700, fontSize: 12, border: 'none',
              cursor: annText.trim() ? 'pointer' : 'default',
              opacity: annSending ? 0.7 : 1,
            }}
          >
            {annSending ? 'Sending…' : 'Send Announcement'}
          </button>
          {annSent && <span style={{ fontSize: 12, color: '#4CAF80' }}>Sent ✓</span>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#111", borderRadius: 10, padding: "8px 12px", border: "1px solid #1A1A1A", marginBottom: 12 }}>
        <Search size={14} style={{ color: "#555" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Find a member..."
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "#F0F0F0" }}
        />
      </div>
      {loadingMembers ? (
        <LoadingState rows={4} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredMembers.map(m => (
            <button
              key={m.ID || m._row}
              onClick={() => selectMember(m)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", backgroundColor: "#111", borderRadius: 12, border: "1px solid #1A1A1A", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: getBeltColor((m.Belt || "white").toLowerCase()), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#F0F0F0", margin: 0 }}>{m.Name}</p>
                <p style={{ fontSize: 11, color: "#666", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.Email}</p>
              </div>
              <ChevronRight size={14} style={{ color: "#333", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────

function SettingsTab() {
  // Check-in gate settings
  const [checkinWindowMinutes, setCheckinWindowMinutes] = useState(() =>
    parseInt(localStorage.getItem('lbjj_checkin_window_minutes') || '60')
  );
  const [checkinGateEnabled, setCheckinGateEnabled] = useState(() =>
    localStorage.getItem('lbjj_checkin_gate_enabled') !== 'false'
  );
  const [checkinSettingsSaved, setCheckinSettingsSaved] = useState(false);

  const saveCheckinSettings = () => {
    localStorage.setItem('lbjj_checkin_window_minutes', String(checkinWindowMinutes));
    localStorage.setItem('lbjj_checkin_gate_enabled', String(checkinGateEnabled));
    setCheckinSettingsSaved(true);
    setTimeout(() => setCheckinSettingsSaved(false), 2000);
  };

  const [geoEnabled, setGeoEnabled] = useState(false);
  const [gymLat, setGymLat] = useState('');
  const [gymLng, setGymLng] = useState('');
  const [radiusYards, setRadiusYards] = useState('500');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Pinned announcement state
  const [pinnedAnn, setPinnedAnn] = useState<{ message: string; ts: string } | null>(null);
  const [clearingPin, setClearingPin] = useState(false);

  const searchAddress = async () => {
    if (!addressQuery.trim()) return;
    setGeocoding(true);
    let found = false;
    // Primary: Nominatim (OpenStreetMap, no CORS issues, no API key)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressQuery)}&format=json&limit=3&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const r = data[0];
        setGymLat(parseFloat(r.lat).toFixed(6));
        setGymLng(parseFloat(r.lon).toFixed(6));
        setAddressQuery(r.display_name.split(',').slice(0, 3).join(',').trim());
        found = true;
      }
    } catch { /* try fallback */ }
    // Fallback: Photon (Komoot)
    if (!found) {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(addressQuery)}&limit=3&lang=en`
        );
        const data = await res.json();
        const features = data?.features || [];
        if (features.length > 0) {
          const [lng, lat] = features[0].geometry.coordinates;
          setGymLat(parseFloat(lat).toFixed(6));
          setGymLng(parseFloat(lng).toFixed(6));
          const p = features[0].properties;
          const matched = [p.name, p.street, p.city, p.state].filter(Boolean).join(', ');
          setAddressQuery(matched);
          found = true;
        }
      } catch { /* both failed */ }
    }
    if (!found) {
      alert('Address not found. Try: "2500 Main St, Fulshear, TX 77441"');
    }
    setGeocoding(false);
  };

  // Load existing config on mount
  useEffect(() => {
    // TODO: GAS action needed — getGeoConfig
    cachedGasCall('getGeoConfig', {}, 60_000).then((res: any) => {
      if (res?.config) {
        setGeoEnabled(res.config.enabled === true || res.config.enabled === 'true');
        setGymLat(res.config.lat || '');
        setGymLng(res.config.lng || '');
        setRadiusYards(res.config.radiusYards || '500');
      }
    }).catch(() => {});
    // Load pinned announcement
    getPinnedAnnouncement().then(ann => setPinnedAnn(ann)).catch(() => {});
  }, []);

  const detectLocation = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGymLat(pos.coords.latitude.toFixed(6));
        setGymLng(pos.coords.longitude.toFixed(6));
        setDetecting(false);
      },
      () => { setDetecting(false); alert('Could not get location. Enter manually.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async () => {
    setSaving(true);
    const token = localStorage.getItem('lbjj_session_token') || '';
    try {
      // TODO: GAS action needed — saveGeoConfig
      await gasCall('saveGeoConfig', {
        token,
        enabled: geoEnabled,
        lat: parseFloat(gymLat) || 0,
        lng: parseFloat(gymLng) || 0,
        radiusYards: parseInt(radiusYards) || 500,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { alert('Failed to save. Try again.'); }
    setSaving(false);
  };

  return (
    <div style={{ padding: '16px 20px' }}>

      {/* ── Check-In Window Settings ──────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>Check-In Window</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          Control how early members can check into class.
        </div>

        {/* Gate toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#111', borderRadius: 10, border: '1px solid #1A1A1A', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0' }}>Enable Check-In Time Gate</div>
            <div style={{ fontSize: 11, color: '#555' }}>Block early check-ins outside the window</div>
          </div>
          <button
            onClick={() => setCheckinGateEnabled(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: checkinGateEnabled ? '#C8A24C' : '#333',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#FFF',
              position: 'absolute', top: 3,
              left: checkinGateEnabled ? 23 : 3,
              transition: 'left 0.2s',
            }}/>
          </button>
        </div>

        {/* Window slider */}
        <div style={{ opacity: checkinGateEnabled ? 1 : 0.5, transition: 'opacity 0.2s', pointerEvents: checkinGateEnabled ? 'auto' : 'none' }}>
          <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>CHECK-IN OPENS X MINUTES BEFORE CLASS</label>
          <input
            type="range"
            min="15" max="240" step="15"
            value={checkinWindowMinutes}
            onChange={e => setCheckinWindowMinutes(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: '#C8A24C', marginBottom: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#444', marginBottom: 10 }}>
            <span>15 min</span>
            <span style={{ color: '#C8A24C', fontWeight: 600 }}>{checkinWindowMinutes >= 60 ? `${checkinWindowMinutes/60}h` : `${checkinWindowMinutes}min`} before class</span>
            <span>4h</span>
          </div>

          {/* Preset buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[30, 60, 120].map(mins => (
              <button
                key={mins}
                onClick={() => setCheckinWindowMinutes(mins)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid',
                  borderColor: checkinWindowMinutes === mins ? '#C8A24C' : '#222',
                  background: checkinWindowMinutes === mins ? 'rgba(200,162,76,0.12)' : '#111',
                  color: checkinWindowMinutes === mins ? '#C8A24C' : '#666',
                  fontWeight: 600, fontSize: 11, cursor: 'pointer',
                }}
              >
                {mins >= 60 ? `${mins/60}hr` : `${mins}min`}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveCheckinSettings}
          style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#C8A24C', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}
        >
          {checkinSettingsSaved ? 'Saved ✓' : 'Save Check-In Settings'}
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>Check-In Geo Lock</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
          Require members to be physically at the gym to check into class.
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#111', borderRadius: 10, border: '1px solid #1A1A1A', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0' }}>Enable Geo Lock</div>
            <div style={{ fontSize: 11, color: '#555' }}>Members must share location to check in</div>
            {!geoEnabled && <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Geo lock is off until you press Save Settings</div>}
          </div>
          <button
            onClick={() => setGeoEnabled(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: geoEnabled ? '#C8A24C' : '#333',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#FFF',
              position: 'absolute', top: 3,
              left: geoEnabled ? 23 : 3,
              transition: 'left 0.2s',
            }}/>
          </button>
        </div>

        {/* Coordinates */}
        <div style={{ opacity: geoEnabled ? 1 : 0.5, transition: 'opacity 0.2s', pointerEvents: geoEnabled ? 'auto' : 'none' }}>
          {/* Address search */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>SEARCH GYM ADDRESS</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={addressQuery}
                onChange={e => setAddressQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchAddress()}
                placeholder="123 Main St, Fulshear, TX"
                disabled={!geoEnabled}
                style={{ flex: 1, background: '#111', border: '1px solid #222', borderRadius: 8, color: '#F0F0F0', padding: '9px 10px', fontSize: 13, boxSizing: 'border-box' as const }}
              />
              <button
                onClick={searchAddress}
                disabled={!geoEnabled || geocoding || !addressQuery.trim()}
                style={{ padding: '9px 14px', borderRadius: 8, background: '#1A1A1A', color: '#C8A24C', fontWeight: 700, fontSize: 12, border: '1px solid #333', cursor: 'pointer', flexShrink: 0 }}
              >
                {geocoding ? '\u2026' : 'Find'}
              </button>
            </div>
          </div>

          {/* OR detect location */}
          <button onClick={detectLocation} disabled={!geoEnabled || detecting}
            style={{ width: '100%', padding: '8px', borderRadius: 8, marginBottom: 10, background: 'rgba(200,162,76,0.06)', border: '1px solid rgba(200,162,76,0.2)', color: '#C8A24C', fontWeight: 600, fontSize: 11, cursor: 'pointer' }}>
            {detecting ? 'Detecting\u2026' : '\uD83D\uDCCD Use My Current Location'}
          </button>

          {/* Coordinates display (read-only when address found) */}
          {(gymLat && gymLng) && (
            <div style={{ fontSize: 11, color: '#555', marginBottom: 8, padding: '6px 10px', background: '#0D0D0D', borderRadius: 8, border: '1px solid #1A1A1A' }}>
              \uD83D\uDCCC {parseFloat(gymLat).toFixed(4)}, {parseFloat(gymLng).toFixed(4)}
            </div>
          )}

          {/* Map preview with radius circle */}
          {gymLat && gymLng && (
            <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '1px solid #1A1A1A', position: 'relative' }}>
              <img
                src={`https://staticmap.openstreetmap.de/staticmap.php?center=${gymLat},${gymLng}&zoom=15&size=320x160&markers=${gymLat},${gymLng},red-pushpin`}
                alt="Gym location map"
                style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <svg width="320" height="160" viewBox="0 0 320 160" style={{ width: '100%', height: '100%' }}>
                  {(() => {
                    const metersPerPx = 4.8;
                    const radiusMeters = (parseInt(radiusYards) || 500) * 0.9144;
                    const radiusPx = Math.min(Math.max(radiusMeters / metersPerPx, 10), 80);
                    return (
                      <>
                        <circle cx="160" cy="80" r={radiusPx} fill="rgba(200,162,76,0.15)" stroke="#C8A24C" strokeWidth="2" strokeDasharray="6 3"/>
                        <circle cx="160" cy="80" r="6" fill="#C8A24C"/>
                        <circle cx="160" cy="80" r="3" fill="#000"/>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
          )}

          {/* Radius number input */}
          <div>
            <label style={{ fontSize: 10, color: '#666', display: 'block', marginBottom: 4 }}>RADIUS</label>
            <input type="number" value={radiusYards} onChange={e => setRadiusYards(e.target.value)} disabled={!geoEnabled}
              placeholder="500" style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: 8, color: '#F0F0F0', padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' as const }}/>
          </div>

          {/* Radius slider */}
          <input
            type="range"
            min="50" max="2000" step="50"
            value={radiusYards}
            onChange={e => setRadiusYards(e.target.value)}
            disabled={!geoEnabled}
            style={{ width: '100%', marginTop: 6, accentColor: '#C8A24C' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#444', marginTop: 2 }}>
            <span>50 yd</span>
            <span style={{ color: '#C8A24C', fontWeight: 600 }}>{radiusYards} yd &middot; {((parseInt(radiusYards)||0)/1760).toFixed(2)} mi</span>
            <span>2000 yd</span>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 10, background: '#C8A24C', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
          {saving ? 'Saving\u2026' : saved ? 'Saved \u2713' : 'Save Settings'}
        </button>
      </div>

      {/* Pinned Announcement Management */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>Pinned Announcement</div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          The pinned announcement appears on every member's home screen.
        </div>
        {pinnedAnn ? (
          <div style={{ background: '#111', borderRadius: 10, border: '1px solid #1A1A1A', padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#C8A24C', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Currently Pinned</div>
            <div style={{ fontSize: 13, color: '#CCC', lineHeight: 1.5, marginBottom: 10 }}>{pinnedAnn.message}</div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 10 }}>Pinned {pinnedAnn.ts ? new Date(pinnedAnn.ts).toLocaleDateString() : ''}</div>
            <button
              onClick={async () => {
                setClearingPin(true);
                try {
                  await clearPinnedAnnouncement();
                  setPinnedAnn(null);
                } catch {}
                setClearingPin(false);
              }}
              disabled={clearingPin}
              style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(224,85,85,0.12)', color: '#E05555', fontWeight: 700, fontSize: 12, border: '1px solid rgba(224,85,85,0.3)', cursor: 'pointer' }}
            >
              {clearingPin ? 'Clearing…' : 'Clear Pinned Announcement'}
            </button>
          </div>
        ) : (
          <div style={{ background: '#111', borderRadius: 10, border: '1px solid #1A1A1A', padding: '14px', fontSize: 13, color: '#555' }}>
            No announcement pinned. Send one from the Notes tab with "Pin to Home Dashboard" enabled.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div style={{ backgroundColor: "#111", borderRadius: 12, border: "1px solid #1A1A1A", padding: "14px 14px 12px" }}>
      <p style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, margin: "0 0 6px" }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ backgroundColor: "#111", borderRadius: 12, border: `1px solid ${accent ? accent + "25" : "#1A1A1A"}`, padding: "14px", marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: accent || "#666", margin: "0 0 10px" }}>{title}</p>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "#4CAF80", Trial: "#E08228", Paused: "#3B9EFF",
    Failed: "#E05555", Cancelled: "#666", New: "#E08228", Confirmed: "#4CAF80",
    'Follow Up': "#E08228", Stale: "#555",
  };
  const c = colors[status] || "#888";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, backgroundColor: `${c}18`, color: c, border: `1px solid ${c}30` }}>
      {status}
    </span>
  );
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, color: "#666", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: "100%", backgroundColor: "#0D0D0D", border: "1px solid #222", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#F0F0F0", outline: "none" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function LoadingState({ rows }: { rows: number }) {
  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: 56, borderRadius: 12, backgroundColor: "#111", border: "1px solid #1A1A1A", animation: "pulse 1.5s ease-in-out infinite", opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: "32px 16px", textAlign: "center" }}>
      <AlertCircle size={28} style={{ color: "#E05555", margin: "0 auto 12px" }} />
      <p style={{ fontSize: 13, color: "#E05555", marginBottom: 12 }}>{message}</p>
      <button onClick={onRetry} style={{ fontSize: 13, color: GOLD, background: "none", border: "none", cursor: "pointer" }}>Retry</button>
    </div>
  );
}
