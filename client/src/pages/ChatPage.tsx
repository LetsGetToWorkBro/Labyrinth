/**
 * ChatPage.tsx — Live chat backed by Google Apps Script (ChatMessages sheet)
 *
 * - Channels and messages are fetched from / sent to GAS via chatGetChannels,
 *   chatGetMessages, chatSendMessage (defined in AppBackend.gs)
 * - Falls back to a lightweight skeleton UI while loading
 * - Polls for new messages every 20 seconds when a channel is open
 * - Unauthenticated users can read public channels (no token) but must log in to send
 */

import { BeltDot, TrophyIcon, StarIcon, FireIcon } from "@/components/icons/LbjjIcons";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ListSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState, SkeletonMessages } from '@/components/StateComponents';
import { getBeltColor } from "@/lib/constants";
import { BeltIcon } from "@/components/BeltIcon";
import { LevelWidget } from "@/components/LevelWidget";
import { ProfileRing } from "@/components/ProfileRing";
import { getRingTier, getActualLevel } from "@/lib/xp";
import { useAuth } from "@/lib/auth-context";
import { chatGetMessages, chatSendMessage, chatGetChannels, chatGetChannelMembers, updatePresence, type ChatMessage, type ChatChannel, type ChannelMember } from "@/lib/api";
import { XPBar } from "@/components/XPBar";
import { getRankProfile } from "@/lib/chat-data";
import logoMaze from "@assets/maze-gold-md.png";
import {
  Send, ArrowLeft, Lock, Users, Hash, ChevronRight, ChevronLeft, ChevronDown, X,
  Shield, Crown, MessageCircle, Megaphone, Loader2, RefreshCw, Award,
} from "lucide-react";

const GOLD = "#C8A24C";
const POLL_INTERVAL_MS = 20_000; // refresh messages every 20 s

// Belt rank order for inclusive channel membership display
const ADULT_BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];
const KIDS_BELT_ORDER = ['white', 'grey', 'gray', 'yellow', 'orange', 'green'];

function getBeltRankIndex(belt: string, isKids: boolean): number {
  const order = isKids ? KIDS_BELT_ORDER : ADULT_BELT_ORDER;
  const idx = order.indexOf(belt.toLowerCase());
  return idx === -1 ? 0 : idx;
}

function isKidsBelt(belt: string): boolean {
  return KIDS_BELT_ORDER.includes(belt.toLowerCase()) && belt.toLowerCase() !== 'white';
}

// ── G2: SystemMessage ──
function SystemMessage({ text, icon, color }: { text: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 20px', margin: '6px 0' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 999,
        background: `${color}12`,
        border: `1px solid ${color}25`,
      }}>
        <span style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#888' }}>{text}</span>
      </div>
    </div>
  );
}

// ── G3: MemberMiniProfile Bottom Sheet ──
function MemberMiniProfile({ member, onClose }: { member: ChannelMember; onClose: () => void }) {
  const level = getActualLevel(member.totalPoints || 0);
  const tier = getRingTier(level);
  const beltColor = getBeltColor(member.belt || 'white');

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}/>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%',
        background: '#111',
        borderRadius: '20px 20px 0 0',
        padding: '28px 24px',
        border: '1px solid #1A1A1A',
        animation: 'modal-enter 300ms cubic-bezier(0.16,1,0.3,1) both',
        paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom) + 24px))',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <ProfileRing tier={tier} size={72}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #2A2A2A, #0D0D0D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: '#F0F0F0',
            }}>
              {(member.name || '?').charAt(0)}
            </div>
          </ProfileRing>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#F0F0F0' }}>{member.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: beltColor, fontWeight: 700, textTransform: 'capitalize' }}>
                {member.belt || 'white'} Belt
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFD700' }}>LV {level}</div>
          </div>
        </div>
        <XPBar xp={member.totalPoints || 0} compact />
        {member.lastSeen && (() => {
          const diff = Date.now() - new Date(member.lastSeen).getTime();
          const isOnline = diff < 5 * 60 * 1000;
          return (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: isOnline ? '#34D399' : '#555' }}/>
              <span style={{ fontSize:11, color: isOnline ? '#34D399' : '#666' }}>
                {isOnline ? 'Online now' : `Last seen ${Math.floor(diff/60000)}m ago`}
              </span>
            </div>
          );
        })()}
        {member.badgeCount && member.badgeCount > 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, padding:'8px 12px', background:'rgba(200,162,76,0.06)', border:'1px solid rgba(200,162,76,0.12)', borderRadius:10 }}>
            <TrophyIcon size={14} color="#C8A24C" />
            <span style={{ fontSize:12, color:'#C8A24C', fontWeight:600 }}>{member.badgeCount} achievement{member.badgeCount !== 1 ? 's' : ''} unlocked</span>
          </div>
        ) : null}
        <button onClick={onClose} style={{
          marginTop: 16, width: '100%', padding: 12, borderRadius: 12,
          background: '#1A1A1A', border: '1px solid #222',
          color: '#999', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Close</button>
      </div>
    </div>,
    document.body
  );
}

// ── MemberRow component for Online tab ──
function OnlineMemberRow({ m, status, now, onSelect, isMe }: {
  m: ChannelMember;
  status: 'online' | 'recent' | 'offline';
  now: number;
  onSelect: (m: ChannelMember) => void;
  isMe?: boolean;
}) {
  const statusColor = status === 'online' ? '#4CAF80' : status === 'recent' ? '#C8A24C' : '#444';
  const minsAgo = m.lastSeen ? Math.floor((now - new Date(m.lastSeen).getTime()) / 60000) : null;
  const statusLabel = isMe ? 'You · Online' : status === 'online' ? 'Online' : minsAgo !== null ? (minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`) : 'Offline';
  const memberXP = m.totalPoints || 0;
  const memberLevel = getActualLevel(memberXP);
  const memberTier = getRingTier(memberLevel);

  return (
    <button onClick={() => onSelect(m)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 8px', background: isMe ? 'rgba(200,162,76,0.06)' : 'none', border: 'none', borderRadius: isMe ? 10 : 0, cursor: 'pointer', textAlign: 'left', borderBottom: isMe ? 'none' : '1px solid #0D0D0D', marginBottom: isMe ? 4 : 0 }}>
      {/* Portrait with ring */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ProfileRing tier={memberTier} size={48} level={memberLevel}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #2A2A2A, #0D0D0D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#F0F0F0' }}>
            {m.name.charAt(0)}
          </div>
        </ProfileRing>
        {/* Status dot */}
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: statusColor, border: '2px solid #0A0A0A' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: isMe ? '#C8A24C' : '#F0F0F0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {m.name}{isMe && <span style={{ fontSize: 10, fontWeight: 700, color: '#C8A24C', marginLeft: 6, opacity: 0.8 }}>You</span>}
          </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BeltIcon belt={m.belt || 'white'} width={24} />
          <span style={{ fontSize: 11, color: statusColor }}>{statusLabel}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#C8A24C' }}>Lv {memberLevel}</div>
        {m.badgeCount ? <div style={{ fontSize: 10, color: '#444' }}>{m.badgeCount} badges</div> : null}
      </div>
    </button>
  );
}

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
  const [showMembers, setShowMembers] = useState(false);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [miniProfileMember, setMiniProfileMember] = useState<ChannelMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<ChannelMember | null>(null);
  const [showOnlineTab, setShowOnlineTab] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<ChannelMember[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineExpanded, setOnlineExpanded] = useState(true);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [offlineExpanded, setOfflineExpanded] = useState(false);
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

  // Chat prefill from badge share or other sources
  useEffect(() => {
    const prefill = localStorage.getItem('lbjj_chat_prefill');
    if (prefill) {
      setInputText(prefill);
      localStorage.removeItem('lbjj_chat_prefill');
    }
  }, []);

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

  // ── Load members when panel opens ──────────────────────────────
  const loadChannelMembers = useCallback(async (channelId: string) => {
    setMembersLoading(true);
    const members = await chatGetChannelMembers(channelId);
    setChannelMembers(members);
    setMembersLoading(false);
  }, []);

  // ── Load all members for Online tab (with sessionStorage cache) ──
  const ONLINE_CACHE_KEY = 'lbjj_online_members';
  const ONLINE_CACHE_TTL = 2 * 60 * 1000;

  const loadOnlineMembers = useCallback(async (silent = false) => {
    // Load from cache immediately
    try {
      const cached = sessionStorage.getItem(ONLINE_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < ONLINE_CACHE_TTL) {
          setOnlineMembers(data);
          if (silent) return;
        }
      }
    } catch {}

    if (!silent) setOnlineLoading(true);
    try {
      const members = await chatGetChannelMembers('general');
      setOnlineMembers(members);
      try { sessionStorage.setItem(ONLINE_CACHE_KEY, JSON.stringify({ data: members, ts: Date.now() })); } catch {}
    } catch {}
    setOnlineLoading(false);
  }, []);

  // ── Presence: update on mount + poll every 60s ───────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    // Announce self as online immediately
    updatePresence().catch(() => {});
    // Silently pre-fetch the online list
    loadOnlineMembers(true);
    // Poll presence + online list every 60s
    const interval = setInterval(() => {
      updatePresence().catch(() => {});
      loadOnlineMembers(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, loadOnlineMembers]);

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
          new Notification('New message from ' + latest.sender, {
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
    const result = await chatSendMessage(activeChannelId, inputText.trim(), localStorage.getItem('lbjj_profile_picture') || undefined);
    setSending(false);
    if (result.success) {
      try { localStorage.setItem('lbjj_first_message_sent', '1'); } catch {}
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
            {member && (() => {
              const now = Date.now();
              const onlineCount = onlineMembers.filter(m => m.lastSeen && (now - new Date(m.lastSeen).getTime()) < 300000).length;
              return (
                <button
                  onClick={() => { updatePresence(); setShowOnlineTab(true); loadOnlineMembers(); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px 5px 8px', borderRadius: 20,
                    background: 'rgba(76,175,128,0.12)',
                    border: '1px solid rgba(76,175,128,0.3)',
                    cursor: 'pointer',
                    boxShadow: onlineCount > 0 ? '0 0 8px rgba(76,175,128,0.15)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#4CAF80',
                    boxShadow: '0 0 6px #4CAF80',
                    animation: 'todayDotPulse 2s ease-in-out infinite',
                  }}/>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4CAF80', letterSpacing: '0.04em' }}>
                    {onlineCount > 0 ? `${onlineCount} Online` : 'Members'}
                  </span>
                </button>
              );
            })()}
          </div>
          <button
            onClick={() => { setShowMembers(true); loadChannelMembers(activeChannel.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#666', padding: '4px 8px', borderRadius: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Members</span>
          </button>
          <button onClick={() => loadMessages(activeChannel.id)} style={{ color: "#555", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <RefreshCw size={15} />
          </button>
          {typeof Notification !== 'undefined' && Notification.permission === 'default' && (
            <button
              onClick={() => Notification.requestPermission().then(p => { notifPermRef.current = p; })}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, background: 'rgba(200,162,76,0.1)', border: '1px solid rgba(200,162,76,0.2)', color: '#C8A24C', cursor: 'pointer', flexShrink: 0 }}
            >
              Notify
            </button>
          )}
        </div>

        {/* Members slide-up sheet */}
        {showMembers && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setShowMembers(false)}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}/>
            <div onClick={e => e.stopPropagation()} style={{
              position: 'relative', width: '100%', background: '#111',
              borderRadius: '20px 20px 0 0', padding: '20px 16px',
              borderTop: '1px solid #1A1A1A',
              maxHeight: '75vh', overflowY: 'auto',
              paddingBottom: 'max(20px, calc(env(safe-area-inset-bottom) + 80px))',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#2A2A2A', margin: '0 auto 16px' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F0F0F0', margin: 0 }}>
                  {activeChannel?.name} · {channelMembers.length} members
                </h3>
                <button onClick={() => setShowMembers(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                  <X size={18}/>
                </button>
              </div>

              {membersLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3].map(i => <div key={i} style={{ height: 52, borderRadius: 12, background: '#1A1A1A', animation: 'shimmer 1.5s ease-in-out infinite' }}/>)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {channelMembers.map(m => {
                    const now = Date.now();
                    const lastSeenMs = m.lastSeen ? new Date(m.lastSeen).getTime() : 0;
                    const minsAgo = lastSeenMs ? Math.floor((now - lastSeenMs) / 60000) : null;
                    const isOnline = minsAgo !== null && minsAgo < 5;
                    const isRecent = minsAgo !== null && minsAgo < 30;
                    const statusColor = isOnline ? '#4CAF80' : isRecent ? '#C8A24C' : '#555';
                    const statusLabel = isOnline ? 'Online' : minsAgo !== null ? (minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo/60)}h ago` : `${Math.floor(minsAgo/1440)}d ago`) : 'Offline';

                    return (
                      <button key={m.email} onClick={() => setSelectedMember(m)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 12, background: '#0D0D0D',
                          border: '1px solid #1A1A1A', cursor: 'pointer', textAlign: 'left',
                          width: '100%',
                        }}>
                        {/* Belt icon */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <BeltIcon belt={m.belt || 'white'} width={36}/>
                          <div style={{
                            position: 'absolute', bottom: -2, right: -2,
                            width: 10, height: 10, borderRadius: '50%',
                            background: statusColor, border: '2px solid #0D0D0D',
                          }}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F0F0', marginBottom: 2 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: statusColor }}>{statusLabel}</div>
                        </div>
                        <ChevronRight size={14} color="#333"/>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Member profile modal */}
        {selectedMember && <MemberProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
        {miniProfileMember && <MemberMiniProfile member={miniProfileMember} onClose={() => setMiniProfileMember(null)} />}

        {/* Messages */}
        <div ref={messagesContainerRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          {loadingMsgs && messages.length === 0 ? (
            <SkeletonMessages count={5} />
          ) : messages.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              gap: 16,
              textAlign: 'center',
            }}>
              {activeChannel?.type === 'rank' || activeChannel?.type === 'kids-rank' ? (
                /* Belt channel welcome — animated rank orb + personalized message */
                <>
                  <div style={{
                    position: 'relative',
                    animation: 'badge-appear 500ms cubic-bezier(0.34,1.56,0.64,1) both',
                  }}>
                    <RankOrb belt={activeChannel.id.replace('-belts','').replace('kids-','')} size={72} />
                    <div style={{
                      position: 'absolute', inset: -16, borderRadius: '50%',
                      background: `radial-gradient(circle, ${getBeltColor(activeChannel.id.replace('-belts','').replace('kids-',''))}18 0%, transparent 70%)`,
                      animation: 'ring-pulse 2.5s ease-in-out infinite',
                    }}/>
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#F0F0F0', margin: '0 0 6px' }}>
                      Welcome to {activeChannel.name}
                    </p>
                    <p style={{ fontSize: 13, color: '#666', margin: 0, maxWidth: 240, lineHeight: 1.6 }}>
                      You earned your way in here. Say hi — your teammates are watching.
                    </p>
                  </div>
                  <div style={{
                    padding: '10px 18px', borderRadius: 20,
                    background: `rgba(${activeChannel.id.includes('black') ? '200,162,76' : activeChannel.id.includes('blue') ? '26,93,171' : activeChannel.id.includes('purple') ? '126,58,242' : activeChannel.id.includes('brown') ? '146,64,14' : '200,200,200'},0.12)`,
                    border: `1px solid ${getBeltColor(activeChannel.id.replace('-belts','').replace('kids-',''))}30`,
                    fontSize: 12, color: '#888', fontStyle: 'italic',
                  }}>
                    Be the first to post in this channel
                  </div>
                </>
              ) : (
                /* Generic channel empty state */
                <div style={{ padding: '24px 20px' }}>
                  <EmptyState illustration="chat" heading="Nothing here yet" description="Coaches will post updates, class notes, and announcements here." compact />
                </div>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isNew = !initialLoadRef.current && idx >= initialMsgCountRef.current;
              // G2: System messages get special treatment
              if ((msg as any).sender === 'system' || (msg as any).type === 'system') {
                const txt = msg.text || '';
                const emojiMatch = txt.match(/^(\S{1,2})/);
                const icon: React.ReactNode = emojiMatch && emojiMatch[1].codePointAt(0)! > 127 ? emojiMatch[1] : <TrophyIcon size={14} color="#C8A24C" />;
                const color = '#C8A24C';
                return (
                  <div key={msg.id} className="chat-message-entry" style={isNew ? { animation: 'chat-msg-enter 160ms cubic-bezier(0.16, 1, 0.3, 1) both' } : undefined}>
                    <SystemMessage text={txt} icon={icon} color={color} />
                  </div>
                );
              }
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
              {member && (() => {
                const chatXP = member?.totalPoints || (member as any)?.totalPoints || 0;
                const chatLevel = getActualLevel(chatXP);
                const chatRingTier = getRingTier(chatLevel);
                return (
                  <>
                    {chatXP > 0 ? (
                      <ProfileRing tier={chatRingTier} size={24}>
                        <BeltIcon belt={myBelt} width={18} style={{ flexShrink: 0 }} />
                      </ProfileRing>
                    ) : (
                      <BeltIcon belt={myBelt} width={18} style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 11, fontWeight: 600, color: getBeltColor(myBelt) }}>
                      {myBelt.charAt(0).toUpperCase() + myBelt.slice(1)} Belt
                    </span>
                  </>
                );
              })()}
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

  // ── Online tab full-screen view ──────────────────────────────
  if (showOnlineTab) {
    const now = Date.now();
    const myEmail = member?.email?.toLowerCase() || '';
    const online = onlineMembers.filter(m => m.lastSeen && (now - new Date(m.lastSeen).getTime()) < 300000);
    const recent = onlineMembers.filter(m => m.lastSeen && (now - new Date(m.lastSeen).getTime()) >= 300000 && (now - new Date(m.lastSeen).getTime()) < 1800000);
    const offline = onlineMembers.filter(m => !m.lastSeen || (now - new Date(m.lastSeen).getTime()) >= 1800000);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0A0A0A' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1A1A1A' }}>
          <button onClick={() => setShowOnlineTab(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0' }}>Members</div>
            <div style={{ fontSize: 11, color: '#555' }}>{onlineMembers.length} members</div>
          </div>
        </div>

        {/* Member list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {onlineLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 64, borderRadius: 14, background: '#1A1A1A', animation: 'shimmer 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : (
            <>
              {online.length > 0 && (
                <>
                  <button onClick={() => setOnlineExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#4CAF80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Online — {online.length}</span>
                    <ChevronDown size={14} color="#4CAF80" style={{ transform: onlineExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}/>
                  </button>
                  {onlineExpanded && online.map(m => <OnlineMemberRow key={m.email} m={m} status="online" now={now} onSelect={setSelectedMember} isMe={m.email?.toLowerCase() === myEmail} />)}
                  <div style={{ height: 16 }} />
                </>
              )}
              {recent.length > 0 && (
                <>
                  <button onClick={() => setRecentExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 8px', marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#C8A24C', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recent — {recent.length}</span>
                    <ChevronDown size={14} color="#C8A24C" style={{ transform: recentExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}/>
                  </button>
                  {recentExpanded && recent.map(m => <OnlineMemberRow key={m.email} m={m} status="recent" now={now} onSelect={setSelectedMember} isMe={m.email?.toLowerCase() === myEmail} />)}
                  <div style={{ height: 16 }} />
                </>
              )}
              {offline.length > 0 && (
                <>
                  <button onClick={() => setOfflineExpanded(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 8px', marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Offline — {offline.length}</span>
                    <ChevronDown size={14} color="#444" style={{ transform: offlineExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}/>
                  </button>
                  {offlineExpanded && offline.map(m => <OnlineMemberRow key={m.email} m={m} status="offline" now={now} onSelect={setSelectedMember} isMe={m.email?.toLowerCase() === myEmail} />)}
                </>
              )}
            </>
          )}
        </div>

        {/* Member profile modal (accessible from Online tab) */}
        {selectedMember && <MemberProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
        {miniProfileMember && <MemberMiniProfile member={miniProfileMember} onClose={() => setMiniProfileMember(null)} />}
      </div>
    );
  }

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
              onClick={() => { updatePresence(); setShowOnlineTab(true); loadOnlineMembers(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px 5px 8px', borderRadius: 20,
                background: 'rgba(76,175,128,0.1)',
                border: '1px solid rgba(76,175,128,0.25)',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF80', boxShadow: '0 0 5px #4CAF80' }}/>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4CAF80', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Members Online
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
          <div style={{ padding: '24px 20px' }}>
            <EmptyState illustration="chat" heading="No channels yet" description="Check back soon — channels will appear here." compact />
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

      <div style={{ height: 20 }} />
    </div>
  );
}

// ─── Member Profile Modal (rich version) ──────────────────────────

function MemberProfileModal({ member: sm, onClose }: { member: ChannelMember; onClose: () => void }) {
  const memberXP = sm.totalPoints || 0;
  const memberLevel = getActualLevel(memberXP);
  const memberTier = getRingTier(memberLevel);
  const beltColor = getBeltColor(sm.belt || 'white');
  const rankProfile = getRankProfile(sm.belt || 'white');
  const badgeCount = sm.badgeCount || 0;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 340,
        background: '#111', borderRadius: 20, padding: '24px 20px',
        border: '1px solid #1A1A1A',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
          <X size={18} />
        </button>

        {/* Portrait with ring + name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
          <ProfileRing tier={memberTier} size={80} level={memberLevel}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #2A2A2A, #0D0D0D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#F0F0F0' }}>
              {sm.name.charAt(0)}
            </div>
          </ProfileRing>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#F0F0F0', marginTop: 10, marginBottom: 4 }}>{sm.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BeltIcon belt={sm.belt || 'white'} width={28} />
            <span style={{ fontSize: 12, color: beltColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {rankProfile.title}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Level', value: memberXP > 0 ? memberLevel : '\u2014' },
            { label: 'Rank', value: '\u2014' },
            { label: 'Badges', value: badgeCount || '\u2014' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: '#0D0D0D', borderRadius: 10, padding: '10px', textAlign: 'center', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F0F0' }}>{String(stat.value)}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* XP bar compact */}
        {memberXP > 0 && (
          <div style={{ marginBottom: 16 }}>
            <XPBar xp={memberXP} compact />
          </div>
        )}

        {/* Achievements preview */}
        {badgeCount > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Achievements</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Array.from({ length: Math.min(badgeCount, 6) }).map((_, i) => (
                <div key={i} style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#0D0D0D', border: '1px solid #1A1A1A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Award size={18} color="#C8A24C" opacity={0.6} />
                </div>
              ))}
              {badgeCount > 6 && (
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#0D0D0D', border: '1px solid #1A1A1A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#555',
                }}>
                  +{badgeCount - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Profile info */}
        <div style={{ background: '#0D0D0D', borderRadius: 10, padding: '10px 12px', marginBottom: 10, border: '1px solid #1A1A1A' }}>
          <div style={{ fontSize: 11, color: '#444', marginBottom: 4 }}>Viewing {sm.name.split(' ')[0]}'s profile</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {sm.badgeCount ? <div><span style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>{sm.badgeCount}</span><span style={{ fontSize: 10, color: '#555', marginLeft: 4 }}>badges</span></div> : null}
            <div><span style={{ fontSize: 14, fontWeight: 700, color: '#C8A24C' }}>Lv {getActualLevel(sm.totalPoints || 0)}</span></div>
          </div>
        </div>
        {/* View their achievements (link to their profile via More) */}
        <button
          onClick={() => { onClose(); }}
          style={{
            width: '100%', padding: '12px', borderRadius: 12,
            background: 'rgba(200,162,76,0.1)', border: '1px solid rgba(200,162,76,0.2)',
            color: '#C8A24C', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', textAlign: 'center',
            letterSpacing: '0.04em',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Belt → minimum XP proxy (so message avatars show appropriate ring) ───

function beltToMinXP(belt: string, role: string): number {
  const r = (role || '').toLowerCase();
  if (r.includes('owner') || r.includes('coach') || r.includes('instructor')) return 19000; // paragon
  const map: Record<string, number> = {
    black: 8500, brown: 5000, purple: 2700, blue: 1000, white: 0,
    green: 2700, orange: 1350, yellow: 700, grey: 250, gray: 250,
  };
  return map[(belt || 'white').toLowerCase()] ?? 0;
}

// ─── Message bubble ────────────────────────────────────────────────

function MessageBubble({ msg, myName }: { msg: ChatMessage; myName: string }) {
  const isMe = msg.sender === myName && !!myName;
  const rank = getRankProfile(msg.senderBelt || "white");
  const isHighRank = rank.tier >= 3;
  const isCoachMsg = (msg.senderRole || "").toLowerCase().includes("coach") || (msg.senderRole || "").toLowerCase().includes("instructor");

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
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A24C' }}>You</span>
            <BeltIcon belt={msg.senderBelt || 'white'} width={28} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#666" }}>{fmt(msg.timestamp)}</span>
          </div>
          <div style={{ backgroundColor: GOLD, color: "#0A0A0A", padding: "8px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  const senderXP = beltToMinXP(msg.senderBelt || 'white', msg.senderRole || '');

  return (
    <div style={{ marginBottom: 2, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, marginLeft: 2 }}>
        <LevelWidget
          xp={senderXP}
          memberName={msg.sender}
          memberBelt={msg.senderBelt}
          profilePic={msg.senderProfilePic || undefined}
          size={32}
          interactive={false}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: rank.color }}>
          {msg.sender}
        </span>
        {/* Belt + Level chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '1px 6px', borderRadius: 999,
          background: `${getBeltColor(msg.senderBelt || 'white')}18`,
          border: `1px solid ${getBeltColor(msg.senderBelt || 'white')}35`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: getBeltColor(msg.senderBelt || 'white'), flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: getBeltColor(msg.senderBelt || 'white'), letterSpacing: '0.05em' }}>
            LV{getActualLevel(beltToMinXP(msg.senderBelt || 'white', msg.senderRole || ''))}
          </span>
        </div>
        <BeltIcon belt={msg.senderBelt || 'white'} width={32} style={{ flexShrink: 0 }} />
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
