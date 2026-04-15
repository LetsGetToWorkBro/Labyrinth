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
import { ListSkeleton } from "@/components/LoadingSkeleton";
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
  { belt: 'white',  title: 'Beginner',    beltColor: '#E5E5E5', tier: 'Foundation', smallLabel: 'Adult I' },
  { belt: 'blue',   title: 'Warrior',     beltColor: '#1A5DAB', tier: 'Student',    smallLabel: 'Adult II' },
  { belt: 'purple', title: 'Elite',       beltColor: '#7E3AF2', tier: 'Skilled',    smallLabel: 'Adult III' },
  { belt: 'brown',  title: 'Master',      beltColor: '#92400E', tier: 'Advanced',   smallLabel: 'Adult IV' },
  { belt: 'black',  title: 'Grandmaster', beltColor: '#1A1A1A', tier: 'Legend',     smallLabel: 'Adult V', border: '#C8A24C' },
  // Kids belts
  { belt: 'grey',   title: 'Initiate',    beltColor: '#6B6B6B', tier: 'Kids I',     smallLabel: 'Kids I' },
  { belt: 'yellow', title: 'Striker',     beltColor: '#C49B1A', tier: 'Kids II',    smallLabel: 'Kids II' },
  { belt: 'orange', title: 'Challenger',  beltColor: '#C4641A', tier: 'Kids III',   smallLabel: 'Kids III' },
  { belt: 'green',  title: 'Champion',    beltColor: '#2D8040', tier: 'Kids IV',    smallLabel: 'Kids IV' },
] as const;

// ── RankOrb: celestial orb/gemstone SVG per belt ──
const RankOrb = ({ belt, size = 32 }: { belt: string; size?: number }) => {
  const id = `orb-${belt}-${size}`;
  const orbs: Record<string, JSX.Element> = {
    white: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#AAAAAA"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`} opacity="0.9"/>
        <circle cx="11" cy="11" r="3" fill="white" opacity="0.6"/>
      </svg>
    ),
    blue: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#1A5DAB"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="11" cy="11" r="3" fill="white" opacity="0.4"/>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#3B82F6" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    purple: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#C084FC"/><stop offset="100%" stopColor="#7E3AF2"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="11" cy="11" r="3" fill="white" opacity="0.35"/>
        <ellipse cx="16" cy="16" rx="13" ry="13" fill="none" stroke="#A855F7" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6"/>
      </svg>
    ),
    brown: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#D4845A"/><stop offset="100%" stopColor="#7C3D0D"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="11" cy="11" r="2.5" fill="white" opacity="0.3"/>
        <path d="M16 4 L24 12 L24 20 L16 28 L8 20 L8 12 Z" fill="none" stroke="#C4894A" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    black: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#555"/><stop offset="100%" stopColor="#111"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="16" cy="16" r="13" fill="none" stroke="#C8A24C" strokeWidth="1.5"/>
        <circle cx="11" cy="11" r="2" fill="#C8A24C" opacity="0.5"/>
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <line key={i} x1="16" y1="16" x2={16 + Math.cos(deg*Math.PI/180)*11} y2={16 + Math.sin(deg*Math.PI/180)*11} stroke="#C8A24C" strokeWidth="0.5" opacity="0.3"/>
        ))}
      </svg>
    ),
    grey: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#CCCCCC"/><stop offset="100%" stopColor="#555"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`} opacity="0.8"/>
        <polygon points="16,5 20,13 29,13 22,19 25,28 16,22 7,28 10,19 3,13 12,13" fill="none" stroke="#AAA" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    yellow: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#FDE68A"/><stop offset="100%" stopColor="#C49B1A"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="11" cy="11" r="2.5" fill="white" opacity="0.4"/>
        {[0,60,120,180,240,300].map((deg,i)=>(
          <circle key={i} cx={16+Math.cos(deg*Math.PI/180)*9} cy={16+Math.sin(deg*Math.PI/180)*9} r="1.5" fill="#FDE68A" opacity="0.6"/>
        ))}
      </svg>
    ),
    orange: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#FDBA74"/><stop offset="100%" stopColor="#C4641A"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="11" cy="11" r="2.5" fill="white" opacity="0.35"/>
        <path d="M16 5 Q22 11 22 16 Q22 24 16 27 Q10 24 10 16 Q10 11 16 5Z" fill="none" stroke="#FDBA74" strokeWidth="1" opacity="0.5"/>
      </svg>
    ),
    green: (
      <svg width={size} height={size} viewBox="0 0 32 32">
        <defs><radialGradient id={`${id}-g`} cx="40%" cy="35%"><stop offset="0%" stopColor="#6EE7B7"/><stop offset="100%" stopColor="#2D8040"/></radialGradient></defs>
        <circle cx="16" cy="16" r="13" fill={`url(#${id}-g)`}/>
        <circle cx="11" cy="11" r="2.5" fill="white" opacity="0.35"/>
        <path d="M16 4 L28 16 L16 28 L4 16 Z" fill="none" stroke="#6EE7B7" strokeWidth="1.2" opacity="0.5"/>
      </svg>
    ),
  };
  return orbs[belt] || orbs.white;
};

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
  const [isTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevMsgCountRef = useRef(0);
  const initialLoadRef = useRef(true);
  const initialMsgCountRef = useRef(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const notifPermRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // ── GAS timeout messaging for channel list ─────────────────────
  const [channelLoadSlow, setChannelLoadSlow] = useState(false);

  useEffect(() => {
    if (!loadingChannels) { setChannelLoadSlow(false); return; }
    const t = setTimeout(() => setChannelLoadSlow(true), 8000);
    return () => clearTimeout(t);
  }, [loadingChannels]);

  // 6a: Inject chat motion styles once
  useEffect(() => {
    const id = 'chat-motion-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      @keyframes chat-msg-enter {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes reaction-pop {
        from { transform: scale(0); opacity: 0; }
        60%  { transform: scale(1.15); opacity: 1; }
        to   { transform: scale(1); opacity: 1; }
      }
      .reaction-new { animation: reaction-pop 140ms cubic-bezier(0.34,1.56,0.64,1) both; }
    `;
    document.head.appendChild(style);
  }, []);

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
    // After first load, record how many messages were in the initial batch
    if (initialLoadRef.current) {
      initialMsgCountRef.current = msgs.length;
      initialLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!activeChannelId) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    initialLoadRef.current = true;
    loadMessages(activeChannelId);
    inputRef.current?.focus();
    // Poll for new messages
    pollRef.current = setInterval(() => loadMessages(activeChannelId), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannelId, loadMessages]);

  // Auto-scroll to bottom (only if near bottom or initial load)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom || initialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // ── Send ──────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeChannelId) return;
    if (!navigator.onLine) { setSendError("No internet connection. Please connect and try again."); return; }
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
  const triggerColor = myBelt === 'black' ? '#C8A24C' : getBeltColor(myBelt);

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
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px 5px 6px',
                  borderRadius: 20,
                  background: `${triggerColor}18`,
                  border: `1.5px solid ${triggerColor}50`,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
              >
                <BeltIcon belt={myBelt} width={28} style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: triggerColor,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}>
                  {userRank.title}
                </span>
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
                paddingBottom: "max(100px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
                maxHeight: 'calc(85vh - 80px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2A2A", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>BJJ Rank Hierarchy</h3>
                <button onClick={() => setShowRankLegend(false)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                  <X size={18} style={{ color: "#555" }} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RANK_LEGEND.map((r) => {
                  const nameColor = r.belt === 'black' ? '#C8A24C' : (r.beltColor as string) === '#1A1A1A' ? '#BBBBBB' : r.beltColor;
                  const pillColor = r.belt === 'black' ? '#C8A24C' : r.beltColor;
                  return (
                    <div key={r.belt}>
                      {r.belt === 'grey' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                          <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                          <span style={{ fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kids Program</span>
                          <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#0D0D0D', border: '1px solid #1A1A1A', borderLeft: `3px solid ${r.belt === 'black' ? '#C8A24C' : r.beltColor}` }}>
                        <div style={{ flexShrink: 0 }}>
                          <BeltIcon belt={r.belt} width={36} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: nameColor, textTransform: 'capitalize' }}>{r.belt} Belt</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${pillColor}20`, color: r.belt === 'black' ? '#C8A24C' : nameColor, border: `1px solid ${pillColor}40`, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{r.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div ref={messagesContainerRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {loadingMsgs && messages.length === 0 ? (
            <ListSkeleton count={6} />
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
            messages.map((msg, idx) => {
              const isNew = !initialLoadRef.current && idx >= initialMsgCountRef.current;
              return (
                <div
                  key={msg.id}
                  className="chat-message-entry"
                  style={isNew ? {
                    animation: 'chat-msg-enter 160ms cubic-bezier(0.16, 1, 0.3, 1) both',
                  } : undefined}
                >
                  <MessageBubble msg={msg} myName={member?.name || ""} />
                </div>
              );
            })
          )}
          {isTyping && (
            <div style={{ display: 'flex', gap: 4, padding: '8px 12px', alignItems: 'center' }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {canPost ? (
          <div style={{ padding: "8px 12px", borderTop: "1px solid #1A1A1A", backgroundColor: "#0A0A0A", flexShrink: 0, paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
            {sendError && <p style={{ fontSize: 12, color: "#E05555", margin: "0 0 6px 4px" }}>{sendError}</p>}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {member && (
                <BeltIcon belt={myBelt} width={18} style={{ flexShrink: 0 }} />
              )}
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
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px 5px 6px',
                borderRadius: 20,
                background: `${triggerColor}18`,
                border: `1.5px solid ${triggerColor}50`,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
            >
              <BeltIcon belt={myBelt} width={28} style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: triggerColor,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
              }}>
                {userRank.title}
              </span>
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        {loadingChannels ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 60, borderRadius: 14, backgroundColor: "#111", border: "1px solid #1A1A1A", opacity: 1 - i * 0.15 }} />)}
            {channelLoadSlow && (
              <p style={{ textAlign: 'center', color: '#666', fontSize: 12, padding: 16 }}>
                Taking longer than usual…
              </p>
            )}
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
              paddingBottom: "max(100px, calc(env(safe-area-inset-bottom, 0px) + 100px))",
              maxHeight: 'calc(85vh - 80px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2A2A2A", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#F0F0F0", margin: 0 }}>BJJ Rank Hierarchy</h3>
              <button onClick={() => setShowRankLegend(false)} style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}>
                <X size={18} style={{ color: "#555" }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {RANK_LEGEND.map((r) => {
                const nameColor = r.belt === 'black' ? '#C8A24C' : (r.beltColor as string) === '#1A1A1A' ? '#BBBBBB' : r.beltColor;
                const pillColor = r.belt === 'black' ? '#C8A24C' : r.beltColor;
                return (
                  <div key={r.belt}>
                    {r.belt === 'grey' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' }}>
                        <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                        <span style={{ fontSize: 10, color: '#444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kids Program</span>
                        <div style={{ flex: 1, height: 1, background: '#1A1A1A' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: '#0D0D0D', border: '1px solid #1A1A1A', borderLeft: `3px solid ${r.belt === 'black' ? '#C8A24C' : r.beltColor}` }}>
                      <div style={{ flexShrink: 0 }}>
                        <BeltIcon belt={r.belt} width={36} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: nameColor, textTransform: 'capitalize' }}>{r.belt} Belt</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${pillColor}20`, color: r.belt === 'black' ? '#C8A24C' : nameColor, border: `1px solid ${pillColor}40`, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>{r.title}</span>
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
        <div style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <RankOrb belt={beltKey} size={40} />
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
          {(channel as any).unreadCount > 0 ? (
            <span className="unread-badge-new" style={{
              background: '#C8A24C', color: '#000',
              borderRadius: 999, fontSize: 10, fontWeight: 700,
              padding: '2px 6px', minWidth: 18, textAlign: 'center' as const,
            }}>
              {(channel as any).unreadCount}
            </span>
          ) : (
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: GOLD }} />
          )}
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
