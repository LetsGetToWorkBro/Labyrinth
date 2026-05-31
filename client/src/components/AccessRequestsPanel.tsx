/**
 * AccessRequestsPanel — Admin component for /admin page
 *
 * Renders a list of pending access_requests from Supabase.
 * "Approve" calls the invite-member Edge Function via approveAccessRequest().
 * "Deny" flips status to 'denied'.
 *
 * Drop this inside AdminPage.tsx in the admin tab section.
 */

import { useState, useEffect } from "react";
import {
  getPendingRequests,
  approveAccessRequest,
  denyAccessRequest,
  type AccessRequestRow,
} from "@/lib/supabase";

const GOLD = "#D4AF37";

export function AccessRequestsPanel() {
  const [requests, setRequests]   = useState<AccessRequestRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState<string | null>(null); // request id being processed
  const [toastMsg, setToastMsg]   = useState<string | null>(null);

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    setLoading(true);
    const data = await getPendingRequests();
    setRequests(data);
    setLoading(false);
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleApprove(req: AccessRequestRow) {
    setActing(req.id);
    const result = await approveAccessRequest(req.id, req.email, req.name);
    setActing(null);
    if (result.success) {
      showToast(`✓ Invite sent to ${req.email}`);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } else {
      showToast(`Error: ${result.error}`);
    }
  }

  async function handleDeny(req: AccessRequestRow) {
    setActing(req.id);
    const result = await denyAccessRequest(req.id);
    setActing(null);
    if (result.success) {
      showToast(`Request from ${req.email} denied`);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } else {
      showToast(`Error: ${result.error}`);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#6b7280", fontSize: 14 }}>
        Loading access requests…
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "rgba(22,22,30,0.95)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
          padding: "12px 24px", color: "#eaecf2", fontSize: 14, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {toastMsg}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16 }}>
        <h3 style={{ color: GOLD, fontWeight: 800, fontSize: 16, margin: 0 }}>
          Access Requests
          {requests.length > 0 && (
            <span style={{
              marginLeft: 8, background: "#ef4444", color: "#fff",
              borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 800,
            }}>
              {requests.length}
            </span>
          )}
        </h3>
        <button
          onClick={loadRequests}
          style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "6px 12px",
            color: "#9ca3af", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div style={{
          padding: 32, textAlign: "center",
          background: "rgba(255,255,255,0.03)", borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.08)",
          color: "#6b7280", fontSize: 14,
        }}>
          No pending access requests.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map(req => (
            <div key={req.id} style={{
              background: "rgba(13,15,22,0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "16px 18px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#eaecf2", fontWeight: 700, fontSize: 14,
                    marginBottom: 2 }}>
                    {req.name}
                  </div>
                  <div style={{ color: GOLD, fontSize: 12, fontWeight: 600,
                    marginBottom: req.message ? 8 : 0 }}>
                    {req.email}
                  </div>
                  {req.message && (
                    <div style={{
                      color: "#9ca3af", fontSize: 12, lineHeight: 1.5,
                      background: "rgba(255,255,255,0.03)", borderRadius: 8,
                      padding: "8px 10px",
                    }}>
                      "{req.message}"
                    </div>
                  )}
                  <div style={{ color: "#6b7280", fontSize: 11, marginTop: 6 }}>
                    {new Date(req.created_at).toLocaleDateString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={acting === req.id}
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.3)",
                      borderRadius: 8, padding: "8px 14px",
                      color: "#22c55e", fontSize: 12, fontWeight: 700,
                      fontFamily: "inherit", cursor: acting === req.id ? "not-allowed" : "pointer",
                      opacity: acting === req.id ? 0.6 : 1,
                    }}
                  >
                    {acting === req.id ? "…" : "Approve"}
                  </button>
                  <button
                    onClick={() => handleDeny(req)}
                    disabled={acting === req.id}
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 8, padding: "8px 14px",
                      color: "#ef4444", fontSize: 12, fontWeight: 700,
                      fontFamily: "inherit", cursor: acting === req.id ? "not-allowed" : "pointer",
                      opacity: acting === req.id ? 0.6 : 1,
                    }}
                  >
                    Deny
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
