/**
 * ChatPage.tsx — v4 design port
 *
 * Three views: Hub (channel list) → Chat (room) → Profile (member card)
 * Slide transitions between views, members dropdown on hub, rank directory.
 * Real data: chatGetChannels, chatGetMessages, chatSendMessage, chatGetChannelMembers, updatePresence.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { getBeltColor } from "@/lib/constants";
import { ParagonRing } from "@/components/ParagonRing";
import { getActualLevel } from "@/lib/xp";
import { useAuth } from "@/lib/auth-context";
import {
  chatGetMessages, chatSendMessage, chatGetChannels, chatGetChannelMembers, updatePresence,
  type ChatMessage, type ChatChannel, type ChannelMember,
} from "@/lib/api";

const GOLD = "#e8af34";
const POLL_INTERVAL_MS = 20_000;

type ViewName = 'hub' | 'chat' | 'profile';
type ChannelTheme = 'gold' | 'red' | 'blue' | 'purple' | 'green' | 'brown' | 'black';

const THEME_LIGHT: Record<ChannelTheme, string> = {
  gold: 'radial-gradient(ellipse at 50% 0%,rgba(232,175,52,.35) 0%,transparent 60%)',
  red: 'radial-gradient(ellipse at 50% 0%,rgba(239,68,68,.35) 0%,transparent 60%)',
  blue: 'radial-gradient(ellipse at 50% 0%,rgba(59,130,246,.35) 0%,transparent 60%)',
  purple: 'radial-gradient(ellipse at 50% 0%,rgba(168,85,247,.35) 0%,transparent 60%)',
  green: 'radial-gradient(ellipse at 50% 0%,rgba(16,185,129,.35) 0%,transparent 60%)',
  brown: 'radial-gradient(ellipse at 50% 0%,rgba(146,64,14,.4) 0%,transparent 60%)',
  black: 'radial-gradient(ellipse at 50% 0%,rgba(239,68,68,.25) 0%,transparent 60%)',
};

const BELT_DOT_COLORS: Record<ChannelTheme, string> = {
  gold: '#e8af34', red: '#ef4444', blue: '#3b82f6', purple: '#a855f7',
  green: '#10b981', brown: '#92400e', black: '#ef4444',
};

const BELT_PILL_CLASS: Record<string, { bg: string; color: string; border: string }> = {
  white:  { bg: 'rgba(245,245,244,.12)', color: '#f5f5f4', border: '1px solid rgba(245,245,244,.25)' },
  blue:   { bg: 'rgba(59,130,246,.15)',  color: '#60a5fa', border: '1px solid rgba(59,130,246,.3)' },
  purple: { bg: 'rgba(168,85,247,.15)',  color: '#c084fc', border: '1px solid rgba(168,85,247,.3)' },
  brown:  { bg: 'rgba(146,64,14,.2)',    color: '#d97706', border: '1px solid rgba(146,64,14,.4)' },
  black:  { bg: 'rgba(255,255,255,.08)', color: '#fff',   border: '1px solid rgba(255,255,255,.2)' },
};

function beltPillStyle(belt: string): React.CSSProperties {
  const key = (belt || 'white').toLowerCase();
  const s = BELT_PILL_CLASS[key] || BELT_PILL_CLASS.white;
  return {
    fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
    textTransform: 'uppercase', letterSpacing: '.08em',
    background: s.bg, color: s.color, border: s.border,
    ...(key === 'black' ? { borderLeft: '3px solid #ef4444' } : {}),
  };
}

function avatarGradient(belt: string): string {
  const key = (belt || 'white').toLowerCase();
  const map: Record<string, string> = {
    white: 'linear-gradient(135deg,#e0e0e0,#888888)',
    blue: 'linear-gradient(135deg,#3b82f6,#1e3a8a)',
    purple: 'linear-gradient(135deg,#a855f7,#3b0764)',
    brown: 'linear-gradient(135deg,#92400e,#451a03)',
    black: 'linear-gradient(135deg,#171717,#ef4444)',
    grey: 'linear-gradient(135deg,#a8a8a8,#555)',
    yellow: 'linear-gradient(135deg,#fde047,#b45309)',
    orange: 'linear-gradient(135deg,#fb923c,#9a3412)',
    green: 'linear-gradient(135deg,#22c55e,#14532d)',
  };
  return map[key] || map.white;
}

function channelTheme(ch: ChatChannel): ChannelTheme {
  if (ch.type === 'announcements') return 'red';
  if (ch.type === 'coaches') return 'purple';
  if (ch.type === 'kids') return 'green';
  if (ch.type === 'rank' || ch.type === 'kids-rank') {
    const beltKey = ch.id.replace('-belts', '').replace('kids-', '').toLowerCase();
    if (beltKey === 'blue') return 'blue';
    if (beltKey === 'purple') return 'purple';
    if (beltKey === 'brown') return 'brown';
    if (beltKey === 'black') return 'black';
    if (beltKey === 'green') return 'green';
  }
  return 'gold';
}

function beltBarColor(belt: string): string {
  const key = (belt || 'white').toLowerCase();
  const map: Record<string, string> = {
    white: 'linear-gradient(90deg,#f5f5f4,#a8a29e)',
    blue: 'linear-gradient(90deg,#3b82f6,#1e3a8a)',
    purple: 'linear-gradient(90deg,#a855f7,#7e22ce)',
    brown: 'linear-gradient(90deg,#92400e,#451a03)',
    black: 'linear-gradient(90deg,#171717,#ef4444)',
    grey: 'linear-gradient(90deg,#a8a8a8,#555)',
    yellow: 'linear-gradient(90deg,#fde047,#b45309)',
    orange: 'linear-gradient(90deg,#fb923c,#9a3412)',
    green: 'linear-gradient(90deg,#22c55e,#14532d)',
  };
  return map[key] || map.white;
}

function relTime(ts: string): string {
  if (!ts) return '';
  try {
    const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  } catch { return ''; }
}

function fmtTime(ts: string): string {
  try { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}

// Belt -> approximate XP for ring tier (for message avatars when we don't have real XP)
function beltToMinXP(belt: string, role: string): number {
  const r = (role || '').toLowerCase();
  if (r.includes('owner') || r.includes('coach') || r.includes('instructor')) return 19000;
  const map: Record<string, number> = {
    black: 8500, brown: 5000, purple: 2700, blue: 1000, white: 0,
    green: 2700, orange: 1350, yellow: 700, grey: 250, gray: 250,
  };
  return map[(belt || 'white').toLowerCase()] ?? 0;
}

// Adult belts only — no kids belts in rank directory
const ADULT_BELTS = ['blue', 'purple', 'brown', 'black']; // white belts use General

// Channel icon SVG
function channelIcon(ch: ChatChannel) {
  const type = ch.type;
  if (type === 'announcements') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  }
  if (type === 'kids') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (type === 'coaches') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  // general / default message icon
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// Inject motion + component-scoped styles once
const STYLE_ID = 'chat-v4-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  @keyframes chatv4-pdot {0%{opacity:1;transform:scale(1);}100%{opacity:.5;transform:scale(1.4);}}
  @keyframes chatv4-msg-enter {from{opacity:0;transform:translateY(15px);}to{opacity:1;transform:translateY(0);}}
  @keyframes chatv4-hub-enter {from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .chatv4-view::-webkit-scrollbar{display:none;}
  .chatv4-msg{display:flex;gap:10px;align-items:flex-end;opacity:0;transform:translateY(15px);transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275);}
  .chatv4-feed.show-msgs .chatv4-msg{opacity:1;transform:translateY(0);}
  .chatv4-msg.me{flex-direction:row-reverse;}
  .chatv4-ch-card{background:#0f0e0d;border:1px solid rgba(255,255,255,0.06);border-radius:18px;padding:14px 16px;display:flex;align-items:center;gap:14px;cursor:pointer;transition:all .4s cubic-bezier(0.175,0.885,0.32,1.275);position:relative;overflow:hidden;-webkit-tap-highlight-color:transparent;}
  .chatv4-ch-card:hover{transform:translateX(5px);border-color:rgba(255,255,255,.11);box-shadow:-4px 8px 28px rgba(0,0,0,.55);}
  .chatv4-ch-card:active{transform:scale(.98);}
  .chatv4-ch-card:hover .chatv4-ch-icon{transform:scale(1.06) rotate(-6deg);background:rgba(255,255,255,.08);color:#fff;}
  .chatv4-ch-card:hover .chatv4-ch-chevron{color:#e7e5e4;transform:translateX(3px);}
  .chatv4-ch-card.urgent{border-color:rgba(239,68,68,.28);background:linear-gradient(100deg,rgba(239,68,68,.05),transparent 60%);}
  .chatv4-ch-card.urgent .chatv4-ch-icon{background:rgba(239,68,68,.15);color:#ef4444;border-color:rgba(239,68,68,.35);box-shadow:0 0 18px rgba(239,68,68,.25);}
  .chatv4-ch-card.urgent .chatv4-ch-unread-dot{background:#ef4444;box-shadow:0 0 10px #ef4444;}
  .chatv4-ch-card.unread .chatv4-ch-icon{background:rgba(232,175,52,.1);color:#e8af34;border-color:rgba(232,175,52,.3);box-shadow:inset 0 0 10px rgba(232,175,52,.35);}
  .chatv4-ch-card.unread .chatv4-ch-name{color:#fff;}
  .chatv4-ch-card.unread .chatv4-ch-time{color:#e8af34;}
  .chatv4-ch-card.locked{opacity:0.45;cursor:default;}
  .chatv4-ch-card.locked:hover{transform:none;box-shadow:none;border-color:rgba(255,255,255,.06);}
  .chatv4-rank-card{background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:11px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .3s;-webkit-tap-highlight-color:transparent;}
  .chatv4-rank-card:hover{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.15);transform:translateY(-2px);box-shadow:0 5px 14px rgba(0,0,0,.45);}
  .chatv4-rank-card:active{transform:scale(.96);}
  .chatv4-rank-card.locked{opacity:0.45;cursor:default;}
  .chatv4-rank-card.locked:hover{transform:none;box-shadow:none;background:rgba(255,255,255,.02);border-color:rgba(255,255,255,0.06);}
  .chatv4-members-btn{display:flex;align-items:center;gap:8px;background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.22);padding:9px 14px;border-radius:16px;cursor:pointer;transition:all .3s;-webkit-tap-highlight-color:transparent;user-select:none;}
  .chatv4-members-btn:hover{background:rgba(16,185,129,.12);border-color:rgba(16,185,129,.4);transform:translateY(-1px);box-shadow:0 6px 20px rgba(16,185,129,.15);}
  .chatv4-members-btn:active{transform:scale(.96);}
  .chatv4-pdot{width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 10px rgba(16,185,129,.35);animation:chatv4-pdot 2s infinite alternate;}
  .chatv4-md-member{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;cursor:pointer;transition:all .2s;-webkit-tap-highlight-color:transparent;}
  .chatv4-md-member:hover{background:rgba(255,255,255,.05);}
  .chatv4-md-member:active{transform:scale(.97);}
  .chatv4-dir-header{padding:14px 10px;display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;color:#57534e;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;transition:color .3s;-webkit-tap-highlight-color:transparent;user-select:none;}
  .chatv4-dir-header:hover{color:#fff;}
  .chatv4-input-bar{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,0.13);padding:8px 8px 8px 16px;border-radius:22px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);transition:all .3s;}
  .chatv4-input-bar:focus-within{border-color:#e8af34;box-shadow:0 0 20px rgba(232,175,52,.35);}
  .chatv4-btn-send{width:35px;height:35px;border-radius:50%;background:#e8af34;display:flex;align-items:center;justify-content:center;color:#000;border:none;cursor:pointer;transition:all .3s cubic-bezier(0.175,0.885,0.32,1.275);box-shadow:0 4px 12px rgba(232,175,52,.35);flex-shrink:0;}
  .chatv4-btn-send:hover{transform:scale(1.1);}
  .chatv4-btn-send:active{transform:scale(.9);}
  .chatv4-btn-send:disabled{opacity:0.45;cursor:default;transform:none;}
  .chatv4-xp-stat-val,.chatv4-achieve-badge{opacity:0;transform:translateY(10px);transition:all 0.5s cubic-bezier(0.175,0.885,0.32,1.275);}
  .vProfile-active .chatv4-xp-stat-val{opacity:1;transform:translateY(0);}
  .vProfile-active .chatv4-achieve-badge{opacity:1;transform:translateY(0);}
  `;
  document.head.appendChild(style);
}

// Small pointer-chevron
const ChevDown = ({ size = 14, color = 'currentColor', style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" width={size} height={size} style={style}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChevRight = ({ size = 16, color = 'currentColor', style }: { size?: number; color?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" width={size} height={size} style={style}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ChevLeft = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const LockIcon = ({ size = 12 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width={size} height={size}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ transform: 'translateX(-1px)' }}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─── Root ────────────────────────────────────────────────────────

export default function ChatPage() {
  const { member, isAuthenticated } = useAuth();

  const [view, setView] = useState<ViewName>('hub');
  const [prevView, setPrevView] = useState<ViewName>('hub');
  const [profileActive, setProfileActive] = useState(false);

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ChannelTheme>('gold');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const [onlineMembers, setOnlineMembers] = useState<ChannelMember[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [channelMembers, setChannelMembers] = useState<ChannelMember[]>([]);
  const [channelMembersOpen, setChannelMembersOpen] = useState(false);

  const [profileMember, setProfileMember] = useState<ChannelMember | null>(null);

  const [dirOpen, setDirOpen] = useState(true);
  const [showFeed, setShowFeed] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const membersWrapRef = useRef<HTMLDivElement>(null);

  // Inject styles and maintain ambient #chat-global-light element
  useEffect(() => {
    injectStyles();
    let light = document.getElementById('chat-global-light') as HTMLDivElement | null;
    if (!light) {
      light = document.createElement('div');
      light.id = 'chat-global-light';
      light.style.position = 'fixed';
      light.style.top = '-10vh';
      light.style.left = '50%';
      light.style.transform = 'translateX(-50%)';
      light.style.width = '150vw';
      light.style.height = '60vh';
      light.style.pointerEvents = 'none';
      light.style.zIndex = '0';
      light.style.opacity = '0.3';
      light.style.transition = 'background 1s, opacity 1s';
      document.body.appendChild(light);
    }
    light.style.background = THEME_LIGHT[activeTheme];
    return () => {
      // Clean up ambient light when leaving the chat page
      const l = document.getElementById('chat-global-light');
      if (l) l.remove();
    };
  }, []); // mount / unmount only

  useEffect(() => {
    const light = document.getElementById('chat-global-light');
    if (light) light.style.background = THEME_LIGHT[activeTheme];
  }, [activeTheme]);

  // Prefill from localStorage
  useEffect(() => {
    const prefill = localStorage.getItem('lbjj_chat_prefill');
    if (prefill) {
      setInputText(prefill);
      localStorage.removeItem('lbjj_chat_prefill');
    }
    // Auto-open profile from OnlineAvatarCluster / OnlineBubble navigation
    const profileEmail = localStorage.getItem('lbjj_open_profile_email');
    if (profileEmail) {
      localStorage.removeItem('lbjj_open_profile_email');
      // Find the member in onlineMembers or load a stub — open their profile
      setTimeout(() => {
        const found = onlineMembers.find(m => m.email === profileEmail || m.name === profileEmail);
        if (found) openProfile(found);
        else {
          // Load from channel members as fallback
          chatGetChannelMembers('general').then(list => {
            const m = list.find(m => m.email === profileEmail);
            if (m) openProfile(m);
          }).catch(() => {});
        }
      }, 600);
    }
  }, []);

  // Close members dropdown on outside click
  useEffect(() => {
    const handler = () => { setChannelMembersOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    if (!membersOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (membersWrapRef.current && !membersWrapRef.current.contains(e.target as Node)) {
        setMembersOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [membersOpen]);

  // Load channels
  const loadChannels = useCallback(async () => {
    setLoadingChannels(true);
    const list = await chatGetChannels();
    setChannels(list);
    setLoadingChannels(false);
  }, []);

  useEffect(() => { loadChannels(); }, [loadChannels]);

  // Load/poll online members — always keeps self at top with fresh lastSeen
  const loadOnlineMembers = useCallback(async (silent = false) => {
    const buildSelf = (): ChannelMember | null => {
      try {
        const m = JSON.parse(localStorage.getItem('lbjj_member_profile') || 'null');
        if (!m?.name) return null;
        const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
        return {
          name: m.name, email: m.email || '',
          belt: (m.belt || 'white').toLowerCase(),
          role: m.role || '',
          totalPoints: Math.max(s.xp || 0, s.totalXP || 0, m.totalPoints || 0),
          badgeCount: 0,
          profilePic: localStorage.getItem('lbjj_profile_picture') || undefined,
          lastSeen: new Date().toISOString(),
        };
      } catch { return null; }
    };

    const mergeSelf = (list: ChannelMember[]) => {
      const self = buildSelf();
      if (!self) return list;
      // Always stamp self as just-seen and put at top
      const without = list.filter(m => (m.email || m.name) !== (self.email || self.name));
      return [self, ...without];
    };

    try {
      const cached = sessionStorage.getItem('lbjj_online_members');
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 2 * 60 * 1000) {
          setOnlineMembers(mergeSelf(data));
          if (silent) return;
        }
      }
    } catch {}
    try {
      const members = await chatGetChannelMembers('general');
      const merged = mergeSelf(members);
      setOnlineMembers(merged);
      try { sessionStorage.setItem('lbjj_online_members', JSON.stringify({ data: members, ts: Date.now() })); } catch {}
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    updatePresence().catch(() => {});
    loadOnlineMembers(true);
    const t = setInterval(() => {
      updatePresence().catch(() => {});
      loadOnlineMembers(true);
    }, 60000);
    return () => clearInterval(t);
  }, [isAuthenticated, loadOnlineMembers]);

  // Inject self immediately on auth (before API call completes)
  useEffect(() => {
    if (!isAuthenticated || !member?.name) return;
    try {
      const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      const self: ChannelMember = {
        name: member.name,
        email: (member as any).email || '',
        belt: ((member as any).belt || 'white').toLowerCase(),
        role: (member as any).role || '',
        totalPoints: Math.max(s.xp || 0, s.totalXP || 0, (member as any)?.totalPoints || 0),
        badgeCount: 0,
        profilePic: localStorage.getItem('lbjj_profile_picture') || undefined,
        lastSeen: new Date().toISOString(),
      };
      setOnlineMembers(prev => {
        const without = prev.filter(m => (m.email || m.name) !== (self.email || self.name));
        return [self, ...without];
      });
    } catch {}
  }, [isAuthenticated, member]);

  // Load messages for a channel
  const loadMessages = useCallback(async (channelId: string) => {
    setLoadingMsgs(true);
    const msgs = await chatGetMessages(channelId, 60);
    setMessages(msgs);
    setLoadingMsgs(false);
  }, []);

  // When a chat opens, load messages + poll + load channel members
  useEffect(() => {
    if (!activeChannelId) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return;
    }
    setShowFeed(false);
    loadMessages(activeChannelId);
    chatGetChannelMembers(activeChannelId).then(setChannelMembers).catch(() => setChannelMembers([]));
    pollRef.current = setInterval(() => loadMessages(activeChannelId), POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannelId, loadMessages]);

  // Trigger feed fade-in once messages arrive
  useEffect(() => {
    if (view !== 'chat') return;
    const t = setTimeout(() => {
      setShowFeed(true);
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, 60);
    return () => clearTimeout(t);
  }, [messages, view]);

  // Navigation helpers
  const openChannel = useCallback((ch: ChatChannel) => {
    if (!ch.accessible) return;
    setMembersOpen(false);
    setActiveChannelId(ch.id);
    setActiveTheme(channelTheme(ch));
    setPrevView('hub');
    setView('chat');
  }, []);

  const backToHub = useCallback(() => {
    setActiveChannelId(null);
    setMessages([]);
    setActiveTheme('gold');
    setView('hub');
  }, []);

  const openProfile = useCallback((m: ChannelMember) => {
    setMembersOpen(false);
    setPrevView(view);
    setProfileMember(m);
    setProfileActive(false);
    setView('profile');
    setTimeout(() => setProfileActive(true), 100);
  }, [view]);

  const backFromProfile = useCallback(() => {
    setProfileActive(false);
    setView(prevView);
  }, [prevView]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeChannelId) return;
    if (!navigator.onLine) { setSendError('No internet connection.'); return; }
    if (!isAuthenticated) { setSendError('Sign in to send messages.'); return; }
    setSending(true);
    setSendError('');
    const result = await chatSendMessage(activeChannelId, inputText.trim(), localStorage.getItem('lbjj_profile_picture') || undefined);
    setSending(false);
    if (result.success) {
      try { localStorage.setItem('lbjj_first_message_sent', '1'); } catch {}
      const optimistic: ChatMessage = {
        id: result.messageId || `tmp-${Date.now()}`,
        sender: member?.name || 'You',
        senderBelt: (member?.belt || 'white').toLowerCase(),
        senderRole: member?.role || '',
        text: inputText.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimistic]);
      setInputText('');
      loadChannels();
    } else {
      setSendError('Failed to send. Try again.');
    }
  }, [inputText, activeChannelId, isAuthenticated, member, loadChannels]);

  // Derived
  const announcementChannel = channels.find(c => c.type === 'announcements');
  const generalChannel = channels.find(c => c.type === 'general');
  const kidsChannel = channels.find(c => c.type === 'kids');
  const coachesChannel = channels.find(c => c.type === 'coaches');
  const adultRankChannels = channels.filter(c => c.type === 'rank');
  const activeChannel = channels.find(c => c.id === activeChannelId);
  const canPost = activeChannel?.canPost ?? false;

  const now = Date.now();
  const onlineNow = onlineMembers.filter(m => m.lastSeen && (now - new Date(m.lastSeen).getTime()) < 5 * 60 * 1000);
  const offlineMems = onlineMembers.filter(m => !onlineNow.includes(m));

  // Current user as ChannelMember (for self-profile tap)
  const myEmail = (member?.email || '').toLowerCase();
  const myXP = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      return Math.max(s.xp || 0, s.totalXP || 0, (member as any)?.totalPoints || 0);
    } catch { return (member as any)?.totalPoints || 0; }
  })();
  const myLevel = getActualLevel(myXP);
  const myPfp = (() => { try { return localStorage.getItem('lbjj_profile_picture') || undefined; } catch { return undefined; } })();

  // ─── View style (slide transitions) ────────────────────────────
  const viewBaseStyle: React.CSSProperties = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',
    transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.45s cubic-bezier(0.16,1,0.3,1)',
  };
  const hubStyle: React.CSSProperties = { ...viewBaseStyle, zIndex: 1, padding: '0 20px 80px', background: '#030303' };
  const chatStyle: React.CSSProperties = { ...viewBaseStyle, zIndex: 2, background: '#030303' };
  const profileStyle: React.CSSProperties = { ...viewBaseStyle, zIndex: 3, background: '#030303' };

  if (view === 'hub') {
    hubStyle.transform = 'translateX(0)';
    hubStyle.pointerEvents = 'auto';
    chatStyle.transform = 'translateX(100%)'; chatStyle.pointerEvents = 'none';
    profileStyle.transform = 'translateX(100%)'; profileStyle.pointerEvents = 'none';
  } else if (view === 'chat') {
    hubStyle.transform = 'translateX(-30%)'; hubStyle.opacity = 0; hubStyle.pointerEvents = 'none';
    chatStyle.transform = 'translateX(0)'; chatStyle.pointerEvents = 'auto';
    profileStyle.transform = 'translateX(100%)'; profileStyle.pointerEvents = 'none';
  } else {
    // profile
    if (prevView === 'chat') {
      chatStyle.transform = 'translateX(-30%)'; chatStyle.opacity = 0; chatStyle.pointerEvents = 'none';
      hubStyle.transform = 'translateX(-30%)'; hubStyle.opacity = 0; hubStyle.pointerEvents = 'none';
    } else {
      hubStyle.transform = 'translateX(-30%)'; hubStyle.opacity = 0; hubStyle.pointerEvents = 'none';
      chatStyle.transform = 'translateX(100%)'; chatStyle.pointerEvents = 'none';
    }
    profileStyle.transform = 'translateX(0)'; profileStyle.pointerEvents = 'auto';
  }

  // Build a synthetic ChannelMember representing self (for profile use)
  const selfMember: ChannelMember = {
    name: member?.name || 'You',
    email: member?.email || '',
    belt: (member?.belt || 'white').toLowerCase(),
    role: member?.role || '',
    totalPoints: myXP,
    badgeCount: 0,
    profilePic: myPfp,
    lastSeen: new Date().toISOString(),
  };

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
      background: '#030303', color: '#e7e5e4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    }}>
      {/* HUB VIEW */}
      <div style={hubStyle} className="chatv4-view">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '52px 0 28px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>Chat</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#57534e' }}>Labyrinth BJJ</div>
          </div>

          <div ref={membersWrapRef} style={{ position: 'relative', zIndex: 600 }}>
            <div
              className="chatv4-members-btn"
              onClick={(e) => { e.stopPropagation(); setMembersOpen(v => !v); }}
              role="button"
              aria-label="Online members"
            >
              <div className="chatv4-pdot" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#10b981', letterSpacing: '.1em', textTransform: 'uppercase' }}>Online</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,.2)', padding: '1px 7px', borderRadius: 8 }}>{onlineNow.length}</span>
              <ChevDown size={14} color="#10b981" style={{ transition: 'transform .35s cubic-bezier(0.175,0.885,0.32,1.275)', transform: membersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>

            {/* Dropdown */}
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 280,
              background: '#161412', border: '1px solid rgba(255,255,255,.13)', borderRadius: 20,
              padding: 12, boxShadow: '0 20px 60px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.04)',
              opacity: membersOpen ? 1 : 0, transform: membersOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)',
              pointerEvents: membersOpen ? 'auto' : 'none',
              transition: 'all .35s cubic-bezier(0.175,0.885,0.32,1.275)', zIndex: 9999,
              maxHeight: '70vh', overflowY: 'auto',
            }}>
              {onlineNow.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '.15em', textTransform: 'uppercase', padding: '6px 8px 4px' }}>● Active Now</div>
                  {onlineNow.map(m => (
                    <MemberDropdownRow key={m.email || m.name} m={m} online onClick={() => openProfile(m)} />
                  ))}
                </>
              )}
              {offlineMems.length > 0 && (
                <>
                  {onlineNow.length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />}
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#57534e', letterSpacing: '.15em', textTransform: 'uppercase', padding: '6px 8px 4px' }}>○ Offline</div>
                  {offlineMems.slice(0, 20).map(m => (
                    <MemberDropdownRow key={m.email || m.name} m={m} online={false} onClick={() => openProfile(m)} />
                  ))}
                </>
              )}
              {onlineMembers.length === 0 && (
                <div style={{ fontSize: 12, color: '#57534e', padding: 12, textAlign: 'center' }}>No members loaded</div>
              )}
            </div>
          </div>
        </div>

        {/* Announcements (urgent) */}
        {announcementChannel && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'chatv4-hub-enter 0.35s cubic-bezier(0.16,1,0.3,1) both' }}>
            <ChannelCard
              channel={announcementChannel}
              variant="urgent"
              onlineCount={onlineNow.length}
              members={onlineMembers}
              onClick={() => openChannel(announcementChannel)}
              onMemberClick={openProfile}
            />
          </div>
        )}

        {/* General section */}
        {(generalChannel || kidsChannel || coachesChannel) && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#57534e', letterSpacing: '.2em', textTransform: 'uppercase', margin: '20px 0 10px 10px' }}>General</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {generalChannel && (
                <ChannelCard
                  channel={generalChannel}
                  variant={generalChannel.lastTimestamp ? 'unread' : 'default'}
                  onlineCount={onlineNow.length}
                  members={onlineMembers}
                  onClick={() => openChannel(generalChannel)}
                  onMemberClick={openProfile}
                />
              )}
              {kidsChannel && (
                <ChannelCard
                  channel={kidsChannel}
                  variant="default"
                  onlineCount={0}
                  members={onlineMembers}
                  onClick={() => openChannel(kidsChannel)}
                  onMemberClick={openProfile}
                />
              )}
              {coachesChannel && (
                <ChannelCard
                  channel={coachesChannel}
                  variant="default"
                  onlineCount={0}
                  members={onlineMembers}
                  onClick={() => openChannel(coachesChannel)}
                  onMemberClick={openProfile}
                />
              )}
            </div>
          </>
        )}

        {/* Rank directory (adult only) */}
        {adultRankChannels.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div className="chatv4-dir-header" onClick={() => setDirOpen(v => !v)} style={{ color: dirOpen ? '#fff' : '#57534e' }}>
              Adult Rank Channels
              <ChevRight size={15} color={dirOpen ? '#e8af34' : 'currentColor'} style={{ transition: 'transform .4s cubic-bezier(0.175,0.885,0.32,1.275)', transform: dirOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 8px',
              maxHeight: dirOpen ? 600 : 0, overflow: 'hidden',
              opacity: dirOpen ? 1 : 0,
              transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.4s',
            }}>
              {ADULT_BELTS.map(beltKey => {
                const ch = adultRankChannels.find(c => {
                  const k = c.id.replace('-belts', '').replace('kids-', '').toLowerCase();
                  return k === beltKey;
                });
                if (!ch) return null;
                const count = onlineMembers.filter(m => (m.belt || '').toLowerCase() === beltKey).length;
                return (
                  <RankCardItem
                    key={beltKey}
                    beltKey={beltKey}
                    name={ch.name}
                    count={count}
                    accessible={ch.accessible}
                    onClick={() => openChannel(ch)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loadingChannels && channels.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 74, borderRadius: 18, background: '#0f0e0d', border: '1px solid rgba(255,255,255,.06)', opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        )}
      </div>

      {/* CHAT VIEW */}
      <div style={chatStyle} className="chatv4-view">
        <div style={{
          position: 'sticky', top: 0, background: 'rgba(3,3,3,.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          padding: '52px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50,
        }}>
          <div
            onClick={backToHub}
            style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#a8a29e', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            <ChevLeft size={20} />
            Hub
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 11, height: 11, borderRadius: '50%',
              background: BELT_DOT_COLORS[activeTheme],
              boxShadow: `0 0 8px ${BELT_DOT_COLORS[activeTheme]}`,
            }} />
            <span>{activeChannel?.name || ''}</span>
          </div>
          {/* Who-strip: click to open channel members dropdown */}
          <div style={{ position: 'relative' }}>
            <div
              onClick={(e) => { e.stopPropagation(); setChannelMembersOpen(v => !v); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                padding: '4px 10px 4px 6px', borderRadius: 10, cursor: 'pointer',
              }}
            >
              {(() => {
                const nowMs = Date.now();
                // Only show members who are actively online (lastSeen < 5 min)
                const activeInChannel = (channelMembers.length > 0 ? channelMembers : onlineMembers)
                  .filter(m => m.lastSeen && (nowMs - new Date(m.lastSeen).getTime()) < 5 * 60 * 1000);
                // Always include self if authenticated
                const selfInList = activeInChannel.find(m => member && (m.email === (member as any).email || m.name === member.name));
                const displayList = selfInList ? activeInChannel : [selfMember, ...activeInChannel].filter(Boolean);
                const activeCount = displayList.length;
                return (
                  <>
                    <div style={{ display: 'flex' }}>
                      {displayList.slice(0, 3).map(m => (
                        <div key={m.email || m.name} style={{
                          width: 20, height: 20, borderRadius: 6, border: '1.5px solid #030303', marginRight: -4,
                          background: avatarGradient(m.belt || 'white'), overflow: 'hidden',
                          fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {m.profilePic ? <img src={m.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (m.name || '?').charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a8a29e', marginLeft: 7 }}>
                      {activeCount === 1 ? '1 active' : activeCount > 1 ? `${activeCount} active` : 'Just you'}
                    </span>
                  </>
                );
              })()}
              <ChevDown size={12} color="#a8a29e" style={{ marginLeft: 2, transition: 'transform .3s', transform: channelMembersOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>

            {/* Channel members dropdown — online pinned, offline collapsible */}
            {(() => {
              const list = channelMembers.length > 0 ? channelMembers : onlineMembers;
              const nowMs = Date.now();
              const chOnline  = list.filter(m => m.lastSeen && (nowMs - new Date(m.lastSeen).getTime()) < 5 * 60 * 1000);
              const chOffline = list.filter(m => !m.lastSeen || (nowMs - new Date(m.lastSeen).getTime()) >= 5 * 60 * 1000);
              return (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 268,
                  background: '#161412', border: '1px solid rgba(255,255,255,.13)', borderRadius: 20,
                  padding: 10, boxShadow: '0 20px 60px rgba(0,0,0,.9)',
                  opacity: channelMembersOpen ? 1 : 0,
                  transform: channelMembersOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)',
                  pointerEvents: channelMembersOpen ? 'auto' : 'none',
                  transition: 'all .35s cubic-bezier(0.175,0.885,0.32,1.275)', zIndex: 9999,
                  maxHeight: '70vh', display: 'flex', flexDirection: 'column',
                }}>
                  {/* Online — always visible, pinned */}
                  {chOnline.length > 0 && (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '.15em', textTransform: 'uppercase', padding: '4px 8px 6px', flexShrink: 0 }}>● Active Now</div>
                      {chOnline.map(m => <ChMemberRow key={m.email||m.name} m={m} online onClick={() => { setChannelMembersOpen(false); openProfile(m); }} />)}
                    </>
                  )}
                  {/* Offline — collapsible scrollable section */}
                  {chOffline.length > 0 && (
                    <ChOfflineSection members={chOffline} onOpen={(m) => { setChannelMembersOpen(false); openProfile(m); }} hasOnline={chOnline.length > 0} />
                  )}
                  {list.length === 0 && (
                    <div style={{ fontSize: 12, color: '#57534e', padding: 12, textAlign: 'center' }}>No members loaded</div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        <div
          ref={feedRef}
          className={`chatv4-feed${showFeed ? ' show-msgs' : ''}`}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18, padding: '20px 20px 120px' }}
        >
          {loadingMsgs && messages.length === 0 ? (
            <div style={{ color: '#57534e', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading messages…</div>
          ) : messages.length === 0 ? (
            <div style={{ color: '#57534e', fontSize: 13, textAlign: 'center', padding: 40 }}>
              No messages yet. Be the first to post.
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = !!member?.name && m.sender === member.name;
              const senderBelt = (m.senderBelt || 'white').toLowerCase();
              // Prefer real totalPoints from message (sent by GAS), then fall back to belt estimate
              const senderXP = isMe
                ? myXP
                : ((m as any).senderTotalPoints || beltToMinXP(senderBelt, m.senderRole || ''));
              const senderLevel = getActualLevel(senderXP);
              const senderPfp = isMe ? myPfp : (m.senderProfilePic || undefined);
              const pillBelt = senderBelt === 'black' || senderBelt === 'brown' || senderBelt === 'purple' || senderBelt === 'blue' || senderBelt === 'white' ? senderBelt : 'white';
              const displayName = isMe ? 'You' : m.sender;
              const handleTapSender = () => {
                const cm: ChannelMember = isMe ? selfMember : {
                  name: m.sender, email: '', belt: senderBelt, role: m.senderRole || '',
                  totalPoints: senderXP, badgeCount: 0, profilePic: senderPfp,
                };
                openProfile(cm);
              };
              return (
                <div key={m.id} className={`chatv4-msg${isMe ? ' me' : ''}`} style={{ transitionDelay: `${Math.min(i, 10) * 0.04}s` }}>
                  <div onClick={handleTapSender} style={{ cursor: 'pointer', flexShrink: 0 }}>
                    <ParagonRing level={senderLevel} size={36} showOrbit={senderLevel >= 6}>
                      {senderPfp ? (
                        <img src={senderPfp} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', borderRadius: '50%',
                          background: avatarGradient(senderBelt),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: '#fff',
                        }}>{(m.sender || '?').charAt(0).toUpperCase()}</div>
                      )}
                    </ParagonRing>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: '82%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e7e5e4' }}>{displayName}</span>
                      {/* LV chip */}
                      <span style={{ fontSize: 9, fontWeight: 900, color: '#e8af34', background: 'rgba(232,175,52,.12)', border: '1px solid rgba(232,175,52,.25)', padding: '1px 5px', borderRadius: 5 }}>LV {senderLevel}</span>
                      <span style={beltPillStyle(pillBelt)}>{pillBelt.charAt(0).toUpperCase() + pillBelt.slice(1)}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#57534e' }}>{fmtTime(m.timestamp)}</span>
                    </div>
                    <div style={isMe ? {
                      background: 'linear-gradient(135deg,rgba(232,175,52,.15),rgba(232,175,52,.06))',
                      border: '1px solid rgba(232,175,52,.28)',
                      padding: '11px 15px', borderRadius: 15, borderBottomRightRadius: 3,
                      fontSize: 14, fontWeight: 500, color: '#fff', lineHeight: 1.55,
                      boxShadow: '0 3px 20px rgba(232,175,52,.35)',
                    } : {
                      background: '#0f0e0d', border: '1px solid rgba(255,255,255,.06)',
                      padding: '11px 15px', borderRadius: 15, borderBottomLeftRadius: 3,
                      fontSize: 14, fontWeight: 500, color: '#fff', lineHeight: 1.55,
                      boxShadow: '0 3px 14px rgba(0,0,0,.35)',
                    }}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Input bar */}
        <div style={{
          position: 'sticky', bottom: 0, padding: '12px 20px 28px',
          background: 'linear-gradient(to top, rgba(3,3,3,1) 60%, transparent)',
          pointerEvents: 'none',
        }}>
          {sendError && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 6px 4px', pointerEvents: 'auto' }}>{sendError}</p>}
          {canPost ? (
            <div className="chatv4-input-bar" style={{ pointerEvents: 'auto' }}>
              <input
                ref={inputRef}
                type="text"
                className="chatv4-input-field"
                placeholder={isAuthenticated ? 'Message the mat…' : 'Sign in to send messages'}
                value={inputText}
                disabled={!isAuthenticated}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                enterKeyHint="send"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 14, color: '#fff',
                }}
              />
              <button
                className="chatv4-btn-send"
                onClick={sendMessage}
                disabled={!inputText.trim() || sending || !isAuthenticated}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          ) : (
            <div style={{
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#57534e', fontSize: 12,
              padding: '12px', borderRadius: 20, background: 'rgba(255,255,255,.03)',
              border: '1px solid rgba(255,255,255,.06)',
            }}>
              <LockIcon size={14} />
              Only coaches can post here
            </div>
          )}
        </div>
      </div>

      {/* PROFILE VIEW */}
      <div style={profileStyle} className={`chatv4-view${profileActive ? ' vProfile-active' : ''}`}>
        <div style={{
          position: 'sticky', top: 0, background: 'rgba(3,3,3,.88)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,.06)',
          padding: '52px 20px 14px', display: 'flex', alignItems: 'center', zIndex: 50,
        }}>
          <div
            onClick={backFromProfile}
            style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#a8a29e', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            <ChevLeft size={20} />
            <span>{prevView === 'chat' ? (activeChannel?.name || 'Chat') : 'Hub'}</span>
          </div>
        </div>
        <div style={{ padding: '24px 20px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {profileMember && <ProfileBody member={profileMember} />}
        </div>
      </div>
    </div>
  );
}

// ─── MemberDropdownRow ────────────────────────────────────────────

// Alias used in channel members dropdown — same as MemberDropdownRow
const ChMemberRow = ({ m, online, onClick }: { m: ChannelMember; online: boolean; onClick: () => void }) =>
  <MemberDropdownRow m={m} online={online} onClick={onClick} />;

// Offline collapsible section for channel members dropdown
function ChOfflineSection({ members, onOpen, hasOnline }: { members: ChannelMember[]; onOpen: (m: ChannelMember) => void; hasOnline: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ flexShrink: 0 }}>
      {hasOnline && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />}
      <div
        onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 4px', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: '#57534e', letterSpacing: '.15em', textTransform: 'uppercase' }}>○ Offline — {members.length}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="2.5" width="13" height="13"
          style={{ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div style={{ maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {members.map(m => <MemberDropdownRow key={m.email||m.name} m={m} online={false} onClick={() => onOpen(m)} />)}
        </div>
      )}
    </div>
  );
}

function MemberDropdownRow({ m, online, onClick }: { m: ChannelMember; online: boolean; onClick: () => void }) {
  const level = getActualLevel(m.totalPoints || 0);
  const beltKey = (m.belt || 'white').toLowerCase();
  const beltColor = getBeltColor(beltKey);
  return (
    <div className="chatv4-md-member" onClick={onClick} style={{ opacity: online ? 1 : 0.55 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: avatarGradient(beltKey), overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: '#fff',
        }}>
          {m.profilePic ? (
            <img src={m.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (m.name || '?').charAt(0).toUpperCase()
          )}
        </div>
        <div style={{
          position: 'absolute', bottom: -1, right: -1, width: 9, height: 9,
          borderRadius: '50%', border: '2px solid #161412',
          background: online ? '#10b981' : '#57534e',
        }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: beltColor }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#a8a29e', textTransform: 'capitalize' }}>{beltKey} Belt</span>
        </div>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 800, color: '#e8af34',
        background: 'rgba(232,175,52,.12)', padding: '1px 6px', borderRadius: 6,
        border: '1px solid rgba(232,175,52,.25)',
      }}>LV {level}</div>
    </div>
  );
}

// ─── ChannelCard ──────────────────────────────────────────────────

function ChannelCard({ channel, variant, members, onClick, onMemberClick }: {
  channel: ChatChannel;
  variant: 'urgent' | 'unread' | 'default';
  onlineCount: number;
  members: ChannelMember[];
  onClick: () => void;
  onMemberClick: (m: ChannelMember) => void;
}) {
  const accessible = channel.accessible !== false;
  const cls = `chatv4-ch-card${variant === 'urgent' ? ' urgent' : variant === 'unread' ? ' unread' : ''}${!accessible ? ' locked' : ''}`;
  const time = relTime(channel.lastTimestamp || '');

  // Preview split — try to find "Name: text"
  let previewAuthor = '';
  let previewText = channel.lastMessage || '';
  if (channel.lastMessage) {
    const m = channel.lastMessage.match(/^([^:]{1,40}):\s(.+)$/);
    if (m) { previewAuthor = m[1]; previewText = m[2]; }
  }

  // Mini avatars — pick up to 3 online members matching channel vibe
  const miniMembers = members.slice(0, 3);

  return (
    <div className={cls} onClick={accessible ? onClick : undefined}>
      <div className="chatv4-ch-icon" style={{
        position: 'relative',
        width: 46, height: 46, borderRadius: 13, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.05)',
        color: '#57534e',
        transition: 'all .4s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        {channelIcon(channel)}
        {(variant === 'urgent' || variant === 'unread') && (
          <div className="chatv4-ch-unread-dot" style={{
            position: 'absolute', top: -2, right: -2, width: 9, height: 9, borderRadius: '50%',
            background: variant === 'urgent' ? '#ef4444' : '#e8af34',
            border: '2px solid #0f0e0d',
            boxShadow: variant === 'urgent' ? '0 0 10px #ef4444' : '0 0 8px rgba(232,175,52,.35)',
          }} />
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="chatv4-ch-name" style={{ fontSize: 17, fontWeight: 800, color: '#e7e5e4', transition: 'color .3s' }}>{channel.name}</div>
          {!accessible ? (
            <span style={{ color: '#57534e', display: 'flex' }}><LockIcon size={12} /></span>
          ) : time ? (
            <div className="chatv4-ch-time" style={{ fontSize: 11, fontWeight: 600, color: '#57534e' }}>{time}</div>
          ) : null}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 500, color: previewText ? '#a8a29e' : '#57534e',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3,
          fontStyle: previewText ? 'normal' : 'italic',
        }}>
          {previewAuthor && <span style={{ color: '#fff', fontWeight: 700 }}>{previewAuthor}: </span>}
          {previewText || 'No messages yet'}
        </div>
        {miniMembers.length > 0 && channel.type !== 'announcements' && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 5 }}>
            {miniMembers.map(m => (
              <div
                key={m.email || m.name}
                onClick={(e) => { e.stopPropagation(); onMemberClick(m); }}
                style={{
                  width: 18, height: 18, borderRadius: 6, border: '1.5px solid #0f0e0d', marginRight: -5,
                  background: avatarGradient(m.belt || 'white'), overflow: 'hidden',
                  fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: '#fff',
                }}
              >
                {m.profilePic ? (
                  <img src={m.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (m.name || '?').charAt(0)
                )}
              </div>
            ))}
            <span style={{ fontSize: 10, fontWeight: 700, color: '#57534e', marginLeft: 10, alignSelf: 'center' }}>
              {miniMembers.length} active
            </span>
          </div>
        )}
      </div>
      {variant === 'default' && accessible && (
        <span className="chatv4-ch-chevron" style={{ color: '#57534e', transition: 'all .3s', flexShrink: 0 }}>
          <ChevRight size={16} />
        </span>
      )}
    </div>
  );
}

// ─── RankCardItem ─────────────────────────────────────────────────

function RankCardItem({ beltKey, name, count, accessible, onClick }: {
  beltKey: string; name: string; count: number; accessible: boolean; onClick: () => void;
}) {
  const beltStyles: Record<string, React.CSSProperties> = {
    white: { background: '#f5f5f4' },
    blue: { background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,.4)' },
    purple: { background: '#a855f7', boxShadow: '0 0 8px rgba(168,85,247,.4)' },
    brown: { background: '#92400e', boxShadow: '0 0 8px rgba(146,64,14,.4)' },
    black: { background: '#111', borderColor: 'rgba(255,255,255,.2)', position: 'relative' },
  };
  return (
    <div
      className={`chatv4-rank-card${!accessible ? ' locked' : ''}`}
      onClick={accessible ? onClick : undefined}
    >
      <div style={{
        width: 11, height: 22, borderRadius: 3, flexShrink: 0,
        border: '1px solid rgba(255,255,255,.1)', position: 'relative',
        ...(beltStyles[beltKey] || beltStyles.white),
      }}>
        {beltKey === 'black' && (
          <div style={{ position: 'absolute', bottom: 3, left: 0, width: '100%', height: 3, background: '#ef4444' }} />
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#e7e5e4' }}>{name}</div>
      {!accessible ? (
        <span style={{ marginLeft: 'auto', color: '#57534e', display: 'flex' }}><LockIcon size={11} /></span>
      ) : (
        <div style={{ fontSize: 10, fontWeight: 700, color: '#57534e', marginLeft: 'auto' }}>{count}</div>
      )}
    </div>
  );
}

// ─── ProfileBody ──────────────────────────────────────────────────

function ProfileBody({ member }: { member: ChannelMember }) {
  const xp = member.totalPoints || 0;
  const level = getActualLevel(xp);
  const beltKey = (member.belt || 'white').toLowerCase();
  const beltColor = getBeltColor(beltKey);
  const xpForCurrent = Math.floor((level - 1) * 250 + (level - 1) * (level - 1) * 50);
  const xpForNext = Math.floor(level * 250 + level * level * 50);
  const denom = Math.max(1, xpForNext - xpForCurrent);
  const progressPct = Math.max(0, Math.min(100, Math.round(((xp - xpForCurrent) / denom) * 100)));

  // Trigger width animation: start at 0, then jump to real pct on mount
  const [fillPct, setFillPct] = useState(0);
  useEffect(() => {
    setFillPct(0);
    const t = setTimeout(() => setFillPct(progressPct), 120);
    return () => clearTimeout(t);
  }, [progressPct]);

  const classes = (member as any).classesAttended || 0;
  const subs = (member as any).submissions || 0;
  const wins = (member as any).eventWins || 0;
  const badgeCount = member.badgeCount || 0;

  return (
    <>
      {/* Hero card */}
      <div style={{
        background: '#0f0e0d',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 24, padding: '28px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        position: 'relative', overflow: 'hidden',
      }}>
        <ParagonRing level={level} size={72} showOrbit={level >= 6}>
          {member.profilePic ? (
            <img src={member.profilePic} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: avatarGradient(beltKey),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#fff',
            }}>{(member.name || '?').charAt(0).toUpperCase()}</div>
          )}
        </ParagonRing>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', textAlign: 'center' }}>{member.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            height: 10, width: 60, borderRadius: 4,
            background: beltBarColor(beltKey),
            boxShadow: `0 0 10px ${beltColor}40`,
          }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#a8a29e', textTransform: 'capitalize' }}>
            {beltKey} Belt{member.role && member.role.toLowerCase().includes('coach') ? ' · Coach' : ''}
          </span>
        </div>
      </div>

      {/* XP card */}
      <div style={{ background: '#0f0e0d', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#57534e', letterSpacing: '.15em', textTransform: 'uppercase' }}>Paragon XP</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>LV {level}</div>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: 'linear-gradient(90deg,#e8af34,#f59e0b)',
            boxShadow: '0 0 12px rgba(232,175,52,.35)',
            width: `${fillPct}%`, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#57534e', marginTop: -8, marginBottom: 12 }}>
          <span>{xp.toLocaleString()} XP</span>
          <span>Next: {xpForNext.toLocaleString()} XP</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { val: classes || '—', label: 'Classes', delay: '0.1s' },
            { val: subs || '—', label: 'Submissions', delay: '0.2s' },
            { val: wins || '—', label: 'Event Wins', delay: '0.3s' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
              <div className="chatv4-xp-stat-val" style={{ fontSize: 18, fontWeight: 900, color: '#fff', transitionDelay: s.delay }}>{String(s.val)}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#57534e', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {badgeCount > 0 && (
        <div style={{ background: '#0f0e0d', border: '1px solid rgba(255,255,255,.06)', borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#57534e', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>Achievements</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Array.from({ length: Math.min(badgeCount, 6) }).map((_, i) => (
              <div
                key={i}
                className="chatv4-achieve-badge"
                style={{
                  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, fontWeight: 700, color: '#e7e5e4',
                  transitionDelay: `${0.4 + i * 0.1}s`,
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ color: '#e8af34', flexShrink: 0 }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Achievement {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last seen */}
      {member.lastSeen && (() => {
        const diff = Date.now() - new Date(member.lastSeen).getTime();
        const isOnline = diff < 5 * 60 * 1000;
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
            background: '#0f0e0d', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#10b981' : '#57534e' }} />
            <span style={{ fontSize: 12, color: isOnline ? '#10b981' : '#57534e' }}>
              {isOnline ? 'Online now' : `Last seen ${Math.floor(diff / 60000)}m ago`}
            </span>
          </div>
        );
      })()}
    </>
  );
}
