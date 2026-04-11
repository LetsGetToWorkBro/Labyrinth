/**
 * ChatPage.tsx — Live chat backed by Google Apps Script (ChatMessages sheet)
 *
 * - Channels and messages are fetched from / sent to GAS via chatGetChannels,
 *   chatGetMessages, chatSendMessage (defined in AppBackend.gs)
 * - Falls back to a lightweight skeleton UI while loading
 * - Polls for new messages every 20 seconds when a channel is open
 * - Unauthenticated users can read public channels (no token) but must log in to send
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { getBeltColor } from "@/lib/constants";
import { BeltIcon } from "@/components/BeltIcon";
import { useAuth } from "@/lib/auth-context";
import { chatGetMessages, chatSendMessage, chatGetChannels, type ChatMessage, type ChatChannel } from "@/lib/api";
import { getRankProfile } from "@/lib/chat-data";
import logoMaze from "@assets/maze-gold-md.png";
import {
  Send, ArrowLeft, Lock, Users, Hash, ChevronRight, X,
  Shield, Crown, MessageCircle, Megaphone, Loader2, RefreshCw,
} from "lucide-react";

const GOLD = "#C8A24C";
const POLL_INTERVAL_MS = 20_000; // refresh messages every 20 s

const RANK_LEGEND = [
  // Adult belts
  { belt: 'white',  title: 'Beginner',    color: '#E5E5E5', emoji: '⚪', tier: 'Foundation', desc: 'The journey begins. Every legend started here.' },
  { belt: 'blue',   title: 'Warrior',     color: '#1A5DAB', emoji: '🔵', tier: 'Student',    desc: 'Building the fundamentals. The hardest belt to earn.' },
  { belt: 'purple', title: 'Elite',       color: '#7E3AF2', emoji: '🟣', tier: 'Skilled',    desc: 'Deep understanding of position and submission.' },
  { belt: 'brown',  title: 'Master',      color: '#92400E', emoji: '🟤', tier: 'Advanced',   desc: 'Refining every detail. Black belt is within reach.' },
  { belt: 'black',  title: 'Grandmaster', color: '#1A1A1A', emoji: '⬛', tier: 'Legend',     desc: 'A lifetime of dedication. The art lives in you.', border: '#C8A24C' },
  // Kids belts
  { belt: 'grey',   title: 'Initiate',    color: '#6B6B6B', emoji: '🛡️', tier: 'Kids I',    desc: 'First steps on the mat. Every champion starts here.' },
  { belt: 'yellow', title: 'Striker',     color: '#C49B1A', emoji: '⭐', tier: 'Kids II',   desc: 'Developing technique and heart.' },
  { belt: 'orange', title: 'Challenger',  color: '#C4641A', emoji: '🔥', tier: 'Kids III',  desc: 'Pushing limits and competing with confidence.' },
  { belt: 'green',  title: 'Champion',    color: '#2D8040', emoji: '🏆', tier: 'Kids IV',   desc: 'Top of the kids program. Just as hard as any adult belt.' },
] as const;

// ─── Root ──────────────────────────────────────────────────────────

export default function ChatPage() {
  const { member, isAuthenticated } = useAuth();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ 'Kids Ranks': true });
  const [showRankLegend, setShowRankLegend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMsgCountRef = useRef(0);
  const notifPermRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // ── Load channel list ─────────────────────────────────────────
  const loadChannels = useCallback(async () => {
    setLoadingChannels(true);
    const list = await chatGetChannels();
    setChannels(list);
    setLoadingChannels(false);
  }, []);

  useEffect(() => { loadChannels(); }, [loadChannels]);

  // ── Load messages for active channel ─────────────────────────
  const loadMessages = useCallback(async (channelId: string) => {
    setLoadingMsgs(true);
    const msgs = await chatGetMessages(channelId, 60);
    setMessages(msgs);
    setLoadingMsgs(false);
    // Check for new messages and notify if app is in background
    if (msgs.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
      if (document.hidden && notifPermRef.current === 'granted') {
        const latest = msgs[msgs.length - 1];
        try {
          new Notification('💬 ' + latest.sender, {
            body: latest.text.substring(0, 80),
            icon: '/maze-gold-md.png',
            tag: 'lbjj-chat',
          });
        } catch {}
      }
    }
    prevMsgCountRef.current = msgs.length;
  }, []);

  useEffect(() => {
    if (!activeChannelId) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    loadMessages(activeChannelId);
    inputRef.current?.focus();
    // Poll for new messages
    pollRef.current = setInterval(() => loadMessages(activeChannelId), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannelId, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeChannelId) return;
    if (!isAuthenticated) { setSendError("Sign in to send messages."); return; }
    setSending(true); setSendError("");
    const result = await chatSendMessage(activeChannelId, inputText.trim());
    setSending(false);
    if (result.success) {
      setInputText("");
      // Optimistic local append
      const optimistic: ChatMessage = {
        id: result.messageId || `tmp-${Date.now()}`,
        sender: member?.name || "You",
        senderBelt: (member?.belt || "white").toLowerCase(),
        senderRole: member?.role || "",
        text: inputText.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      // Refresh channel list so preview text updates
      loadChannels();
    } else {
      setSendError("Failed to send. Try again.");
    }
  }, [inputText, activeChannelId, isAuthenticated, member]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─── Shared rank info ──────────────────────────────────────────
  const myBelt = (member?.belt || "white").toLowerCase();
  const userRank = getRankProfile(myBelt);

  // ─── Channel Room ─────────────────────────────────────────────
  const activeChannel = channels.find(c => c.id === activeChannelId);

  if (activeChannel) {
    const canPost = activeChannel.canPost;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#0A0A0A" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", flexShrink: 0 }}>
          <button onClick={() => setActiveChannelId(null)} style={{ color: "#999", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ color: "#F0F0F0", fontSize: 16, fontWeight: 700, margin: 0 }}>{activeChannel.name}</h2>
            {member && (
              <button
                onClick={() => setShowRankLegend(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px 2px 4px", borderRadius: 12,
                  backgroundColor: `${getBeltColor(myBelt)}15`,
                  border: `1px solid ${getBeltColor(myBelt)}30`,
                  cursor: "pointer", fontSize: 10, fontWeight: 600,
                  color: getBeltColor(myBelt),
                }}
              >
                <BeltIcon belt={myBelt} width={18} />
                {(myBelt === 'black' ? 'GRANDMASTER' : userRank.title).toUpperCase()}
              </button>
            )}
          </div>
          <button onClick={() => loadMessages(activeChannel.id)} style={{ color: "#555", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <RefreshCw size={15} />
          </button>
          {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
            <button
              onClick={() => Notification.requestPermission().then(p => { notifPermRef.current = p; })}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(200,162,76,0.1)', border: '1px solid rgba(200,162,76,0.2)', color: '#C8A24C', cursor: 'pointer', flexShrink: 0 }}
            >
              🔔 Notify
            </button>
          )}
        </div>

        {/* Rank Legend Bottom Sheet */}
        {showRankLegend && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}
            onClick={() => setShowRankLegend(false)}
          >
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: "relative", width: "100%",
                background: "#111", borderRadius: "20px 20px 0 0",
                padding: "24px 20px", borderTop: "1px solid #1A1A1A",
                paddingBottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
                maxHeight: '80vh', overflowY: 'auto',
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2A2A", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>BJJ Rank Hierarchy</h3>
                <button onClick={() => setShowRankLegend(false)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                  <X size={18} style={{ color: "#555" }} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {RANK_LEGEND.map((r, i) => {
                  const titleColor = r.belt === 'black' ? '#C8A24C'
                    : r.belt === 'grey' || r.belt === 'gray' ? '#AAAAAA'
                    : r.belt === 'white' ? '#BBBBBB'
                    : r.color;
                  const patchColor = r.belt === 'black' ? '#CC0000' : '#000';
                  const showPatch = r.belt !== 'white';
                  return (
                    <div key={r.belt}>
                      {r.belt === 'grey' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 14px' }}>
                          <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                          <span style={{ fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kids Program</span>
                          <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', borderRadius: 10, background: '#0D0D0D', border: '1px solid #1A1A1A', borderLeft: `3px solid ${r.color}` }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 1, height: 10 }}>
                            <div style={{ width: 20, height: 10, background: r.color, borderRadius: '2px 0 0 2px' }} />
                            {showPatch && <div style={{ width: r.belt === 'black' ? 10 : 6, height: 10, background: patchColor, borderRadius: 1 }} />}
                            <div style={{ width: 20, height: 10, background: r.color, borderRadius: '0 2px 2px 0' }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 16 }}>{r.emoji}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: titleColor }}>{r.title}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: `${r.color}20`, color: titleColor, border: `1px solid ${r.color}30`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.tier}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#555', textTransform: 'capitalize' }}>{r.belt} Belt</div>
                          <div style={{ fontSize: 11, color: '#444', marginTop: 3, lineHeight: 1.4 }}>{r.desc}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {loadingMsgs && messages.length === 0 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#555" }}>
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              gap: 12,
              textAlign: 'center',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(200,162,76,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginBottom: 4,
              }}>
                💬
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0', margin: 0 }}>
                No messages yet
              </p>
              <p style={{ fontSize: 13, color: '#666', margin: 0, maxWidth: 240, lineHeight: 1.5 }}>
                Your coaches will post updates, announcements, and class notes here.
              </p>
            </div>
          ) : (
            messages.map(msg => <MessageBubble key={msg.id} msg={msg} myName={member?.name || ""} />)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {canPost ? (
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", flexShrink: 0, paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
            {sendError && <p style={{ fontSize: 12, color: "#E05555", margin: "0 0 6px 4px" }}>{sendError}</p>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAuthenticated ? "Type a message..." : "Sign in to send messages"}
                disabled={!isAuthenticated}
                style={{ flex: 1, backgroundColor: "#111", border: "1px solid #222", borderRadius: 20, padding: "10px 16px", fontSize: 14, color: "#F0F0F0", outline: "none" }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || sending || !isAuthenticated}
                style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: (inputText.trim() && isAuthenticated) ? GOLD : "#1A1A1A", color: (inputText.trim() && isAuthenticated) ? "#0A0A0A" : "#444", border: "none", cursor: (inputText.trim() && isAuthenticated) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", textAlign: "center", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#666", fontSize: 12 }}>
              <Shield size={14} />
              Only coaches can post here
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Channel list ─────────────────────────────────────────────
  // Announcements pinned to top
  const announcementChannel = channels.find(c => c.type === "announcements");
  const mainChannels = channels.filter(c => ["general", "kids", "coaches"].includes(c.type));
  const adultRankChannels = channels.filter(c => c.type === "rank");
  const kidsRankChannels = channels.filter(c => c.type === "kids-rank");

  const toggleSection = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="app-content">
      <div style={{ padding: "16px 20px 12px", paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#F0F0F0", margin: 0 }}>Chat</h1>
            <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>Gym channels</p>
          </div>
          {member && (
            <button
              onClick={() => setShowRankLegend(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px 5px 8px", borderRadius: 20, backgroundColor: `${getBeltColor(myBelt)}10`, border: `1px solid ${getBeltColor(myBelt)}25`, cursor: "pointer" }}
            >
              <BeltIcon belt={myBelt} width={22} />
              <span style={{ fontSize: 11, fontWeight: 700, color: getBeltColor(myBelt), letterSpacing: '0.05em' }}>
                {(myBelt === 'black' ? 'GRANDMASTER' : userRank.title).toUpperCase()}
              </span>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {loadingChannels ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 60, borderRadius: 14, backgroundColor: "#111", border: "1px solid #1A1A1A", opacity: 1 - i * 0.15 }} />)}
          </div>
        ) : channels.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#666' }}>No channels yet — check back soon.</p>
          </div>
        ) : (
          <>
            {/* Announcements pinned to top */}
            {announcementChannel && (
              <ChannelRow key={announcementChannel.id} channel={announcementChannel} onOpen={() => setActiveChannelId(announcementChannel.id)} />
            )}

            {/* Main section (not collapsible) */}
            {mainChannels.length > 0 && (
              <>
                <SectionLabel>Main</SectionLabel>
                {mainChannels.map(ch => <ChannelRow key={ch.id} channel={ch} onOpen={() => setActiveChannelId(ch.id)} />)}
              </>
            )}

            {/* Adult Ranks (collapsible, default open) */}
            {adultRankChannels.length > 0 && (
              <>
                <CollapsibleSectionLabel
                  label="Adult Ranks"
                  collapsed={!!collapsed['Adult Ranks']}
                  onToggle={() => toggleSection('Adult Ranks')}
                />
                {!collapsed['Adult Ranks'] && adultRankChannels.map(ch => (
                  <ChannelRow key={ch.id} channel={ch} isRank onOpen={() => setActiveChannelId(ch.id)} />
                ))}
              </>
            )}

            {/* Kids Ranks (collapsible, default closed) — show all, greyed if not accessible */}
            {kidsRankChannels.length > 0 && (
              <>
                <CollapsibleSectionLabel
                  label="Kids Ranks"
                  collapsed={!!collapsed['Kids Ranks']}
                  onToggle={() => toggleSection('Kids Ranks')}
                />
                {!collapsed['Kids Ranks'] && kidsRankChannels.map(ch => (
                  <ChannelRow key={ch.id} channel={ch} isRank onOpen={() => setActiveChannelId(ch.id)} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Rank Legend Bottom Sheet (from channel list view) */}
      {showRankLegend && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowRankLegend(false)}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative", width: "100%",
              background: "#111", borderRadius: "20px 20px 0 0",
              padding: "24px 20px", borderTop: "1px solid #1A1A1A",
              paddingBottom: "max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))",
              maxHeight: '80vh', overflowY: 'auto',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2A2A", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>BJJ Rank Hierarchy</h3>
              <button onClick={() => setShowRankLegend(false)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                <X size={18} style={{ color: "#555" }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RANK_LEGEND.map((r, i) => {
                const titleColor = r.belt === 'black' ? '#C8A24C'
                  : r.belt === 'grey' || r.belt === 'gray' ? '#AAAAAA'
                  : r.belt === 'white' ? '#BBBBBB'
                  : r.color;
                const patchColor = r.belt === 'black' ? '#CC0000' : '#000';
                const showPatch = r.belt !== 'white';
                return (
                  <div key={r.belt}>
                    {r.belt === 'grey' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 14px' }}>
                        <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                        <span style={{ fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kids Program</span>
                        <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', borderRadius: 10, background: '#0D0D0D', border: '1px solid #1A1A1A', borderLeft: `3px solid ${r.color}` }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, paddingTop: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 1, height: 10 }}>
                          <div style={{ width: 20, height: 10, background: r.color, borderRadius: '2px 0 0 2px' }} />
                          {showPatch && <div style={{ width: r.belt === 'black' ? 10 : 6, height: 10, background: patchColor, borderRadius: 1 }} />}
                          <div style={{ width: 20, height: 10, background: r.color, borderRadius: '0 2px 2px 0' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontSize: 16 }}>{r.emoji}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: titleColor }}>{r.title}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: `${r.color}20`, color: titleColor, border: `1px solid ${r.color}30`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.tier}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#555', textTransform: 'capitalize' }}>{r.belt} Belt</div>
                        <div style={{ fontSize: 11, color: '#444', marginTop: 3, lineHeight: 1.4 }}>{r.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────

function MessageBubble({ msg, myName }: { msg: ChatMessage; myName: string }) {
  const isMe = msg.sender === myName && !!myName;
  const rank = getRankProfile(msg.senderBelt || "white");
  const isHighRank = rank.tier >= 3;
  const isCoachMsg = (msg.senderRole || "").toLowerCase().includes("coach") || (msg.senderRole || "").toLowerCase().includes("instructor");
  const isOwnerMsg = (msg.senderRole || "").toLowerCase().includes("owner");
  const rankTitle = (isOwnerMsg || (msg.senderBelt || "").toLowerCase() === "black") ? "GRANDMASTER" : rank.title;

  function fmt(ts: string) {
    try { return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
    catch { return ""; }
  }

  // System message (e.g. Labyrinth BJJ announcements stored with senderRole='system')
  if (msg.senderRole === "system") {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", marginBottom: 4 }}>
        <img src={logoMaze} alt="" style={{ width: 28, height: 28, borderRadius: "50%", filter: "invert(0.75) sepia(1) hue-rotate(5deg) saturate(3)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Labyrinth BJJ</span>
            <span style={{ fontSize: 12, color: "#666" }}>{fmt(msg.timestamp)}</span>
          </div>
          <p style={{ fontSize: 13, color: "#CCC", margin: "3px 0 0", lineHeight: 1.4 }}>{msg.text}</p>
        </div>
      </div>
    );
  }

  if (isMe) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 2, marginTop: 8 }}>
        <div style={{ maxWidth: "80%" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <span style={{ fontSize: 12, color: "#666" }}>{fmt(msg.timestamp)}</span>
          </div>
          <div style={{ backgroundColor: GOLD, color: "#0A0A0A", padding: "8px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 2, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, marginLeft: 2 }}>
        <BeltIcon belt={msg.senderBelt || "white"} width={isHighRank ? 28 : 22} style={{ flexShrink: 0, filter: isHighRank ? `drop-shadow(${rank.glow})` : "none" }} />
        <span style={{ fontSize: 12, fontWeight: isHighRank ? 800 : 600, color: isHighRank ? rank.color : "#BBB", letterSpacing: isHighRank ? "0.02em" : "0", textShadow: isHighRank ? rank.glow : "none" }}>
          {msg.sender}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '2px 7px', borderRadius: 5,
          backgroundColor: `${rank.color}20`, color: rank.color,
          border: `1px solid ${rank.color}35`,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          {rank.badge && <span style={{ fontSize: 11 }}>{rank.badge}</span>}
          {rankTitle.toUpperCase()}
        </span>
        {isCoachMsg && (
          <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "1px 5px", borderRadius: 4, backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", gap: 2 }}>
            <Crown size={8} /> Coach
          </span>
        )}
        <span style={{ fontSize: 12, color: "#555" }}>{fmt(msg.timestamp)}</span>
      </div>
      <div style={{ maxWidth: "85%", backgroundColor: "#1A1A1A", padding: "8px 14px", borderRadius: "4px 16px 16px 16px", fontSize: 13, color: "#E0E0E0", lineHeight: 1.4, borderLeft: isHighRank ? `2px solid ${rank.color}40` : "none" }}>
        {msg.text}
      </div>
    </div>
  );
}

// ─── Channel descriptions ─────────────────────────────────────────

const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  'announcements': 'Gym news & updates',
  'adults': 'Adult members',
  'coaches': 'Coaching staff only',
  'kids-parents': 'Kids & parent community',
  'white-belts': 'White belt members',
  'blue-belts': 'Blue belt members',
  'purple-belts': 'Purple belt members',
  'brown-belts': 'Brown belt members',
  'black-belts': 'Black belt members',
  'kids-white': 'Kids white belts',
  'kids-grey': 'Kids grey belts',
  'kids-yellow': 'Kids yellow belts',
  'kids-orange': 'Kids orange belts',
  'kids-green': 'Kids green belts',
};

// ─── Channel row ───────────────────────────────────────────────────

function ChannelRow({ channel, isRank, onOpen }: { channel: ChatChannel; isRank?: boolean; onOpen: () => void }) {
  const beltKey = channel.id.replace("-belts", "").replace("kids-", "");
  const beltColor = isRank ? getBeltColor(beltKey) : GOLD;

  const iconMap: Record<string, React.ReactNode> = {
    general: <Hash size={16} style={{ color: GOLD }} />,
    kids: <Users size={16} style={{ color: "#999" }} />,
    coaches: <Shield size={16} style={{ color: "#999" }} />,
    announcements: <Megaphone size={16} style={{ color: GOLD }} />,
  };

  function relTime(ts: string) {
    if (!ts) return "";
    try {
      const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
      if (mins < 1) return "now";
      if (mins < 60) return `${mins}m`;
      const h = Math.floor(mins / 60);
      if (h < 24) return `${h}h`;
      return `${Math.floor(h / 24)}d`;
    } catch { return ""; }
  }

  return (
    <button
      onClick={channel.accessible ? onOpen : undefined}
      disabled={!channel.accessible}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: channel.accessible ? "12px 14px" : "10px 14px",
        borderRadius: 14,
        backgroundColor: channel.accessible ? "#111" : "transparent",
        border: channel.accessible ? "1px solid #1A1A1A" : "none",
        cursor: channel.accessible ? "pointer" : "default",
        opacity: channel.accessible ? 1 : 0.4,
        width: "100%", textAlign: "left", transition: "all 0.15s",
        marginBottom: 6,
      }}
    >
      {isRank ? (
        <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: `${beltColor}18`, border: `1.5px solid ${beltColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: beltColor }} />
        </div>
      ) : (
        <div style={{ width: 42, height: 42, borderRadius: 11, backgroundColor: channel.accessible ? "#1A1A1A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {iconMap[channel.type] || <MessageCircle size={16} style={{ color: "#666" }} />}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: channel.accessible ? "#F0F0F0" : "#666" }}>{channel.name}</span>
          {!channel.accessible && <Lock size={12} style={{ color: "#555" }} />}
        </div>
        {channel.accessible && (
          <p style={{ fontSize: 12, color: channel.lastMessage ? "#666" : "#555", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: channel.lastMessage ? "normal" : "italic" }}>
            {channel.lastMessage || CHANNEL_DESCRIPTIONS[channel.id] || "No messages yet"}
          </p>
        )}
      </div>
      {channel.accessible && channel.lastTimestamp && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "#555" }}>{relTime(channel.lastTimestamp)}</span>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: GOLD }} />
        </div>
      )}
      {channel.accessible && !channel.lastTimestamp && <ChevronRight size={16} style={{ color: "#333", flexShrink: 0 }} />}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", margin: "16px 0 10px" }}>{children}</p>;
}

function CollapsibleSectionLabel({ label, collapsed, onToggle }: { label: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%",
        background: "none", border: "none", cursor: "pointer", padding: 0,
        margin: "16px 0 10px",
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", margin: 0 }}>{label}</p>
      <ChevronRight size={14} style={{ color: "#555", transition: "transform 0.2s", transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }} />
    </button>
  );
}
