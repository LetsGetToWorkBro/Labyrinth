/**
 * FloatingDMTray — persistent floating DM system that follows you across all pages.
 *
 * Architecture:
 * - Global context (`DMContext`) stores open conversation stacks
 * - Each open DM = a compact tray anchored bottom-right, stacked left for multiple
 * - Tapping a member anywhere (OnlineAvatarCluster, chat) dispatches 'open-dm' event
 * - Same visual language as ChatPage: ParagonRing, belt pills, gold bubbles for self
 * - Portal-rendered to document.body — never clipped by any parent
 */

import React, {
  useState, useEffect, useRef, useCallback, createContext, useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/lib/auth-context';
import { ParagonRing } from '@/components/ParagonRing';
import { getActualLevel } from '@/lib/xp';
import { getBeltColor } from '@/lib/constants';
import { dmSend, dmGetThread, dmMarkRead, dmGetUnread, dmGetConversations, type DmMessage, type DmConversation } from '@/lib/api';

// ─── Unread tracking ──────────────────────────────────────────────────────────

const DM_READ_IDS_KEY = 'lbjj_dm_read_ids';
const DM_SEEN_THREADS_KEY = 'lbjj_dm_seen_threads';

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DM_READ_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Cap size at 500 to avoid unbounded growth
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(DM_READ_IDS_KEY, JSON.stringify(arr));
  } catch {}
}

export function markDmRead(messageIds: string[]) {
  if (!messageIds.length) return;
  const ids = loadReadIds();
  messageIds.forEach(id => id && ids.add(id));
  saveReadIds(ids);
  window.dispatchEvent(new CustomEvent('dm-read'));
}

// ─── Relative time formatter ──────────────────────────────────────────────────

function fmtRelative(ts: string): string {
  if (!ts) return '';
  const then = new Date(ts).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Date.now() - then;
  if (diff < 60_000) return 'now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return 'Yesterday';
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ─── DM Context ───────────────────────────────────────────────────────────────

export interface DMPeer {
  email: string;
  name: string;
  belt: string;
  totalPoints: number;
  profilePic?: string;
  minimized?: boolean;
}

interface DMContextValue {
  openDM: (peer: DMPeer) => void;
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

const DMContext = createContext<DMContextValue>({
  openDM: () => {},
  unreadCount: 0,
  setUnreadCount: () => {},
});

export function useDM() { return useContext(DMContext); }

// Global event to open a DM from anywhere
export function dispatchOpenDM(peer: DMPeer) {
  window.dispatchEvent(new CustomEvent('open-dm', { detail: peer }));
}

// Open the conversations inbox (list of all threads) from anywhere
export function dispatchOpenDMInbox() {
  window.dispatchEvent(new CustomEvent('open-dm-inbox'));
}

// ─── Belt pill style (matches ChatPage) ───────────────────────────────────────

function beltPill(belt: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    black:  { bg:'rgba(255,255,255,.08)',  color:'#fff',    border:'1px solid rgba(255,255,255,.2)' },
    brown:  { bg:'rgba(146,64,14,.2)',     color:'#d97706', border:'1px solid rgba(146,64,14,.4)'  },
    purple: { bg:'rgba(168,85,247,.15)',   color:'#c084fc', border:'1px solid rgba(168,85,247,.3)' },
    blue:   { bg:'rgba(59,130,246,.15)',   color:'#60a5fa', border:'1px solid rgba(59,130,246,.3)' },
    white:  { bg:'rgba(245,245,244,.12)',  color:'#f5f5f4', border:'1px solid rgba(245,245,244,.25)'},
  };
  const s = map[(belt||'white').toLowerCase()] || map.white;
  return { fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4,
    textTransform:'uppercase', letterSpacing:'.08em',
    background:s.bg, color:s.color, border:s.border, flexShrink:0 };
}

function avatarGrad(belt: string) {
  const m: Record<string,string> = {
    black:'linear-gradient(135deg,#171717,#ef4444)', brown:'linear-gradient(135deg,#92400e,#451a03)',
    purple:'linear-gradient(135deg,#a855f7,#3b0764)', blue:'linear-gradient(135deg,#3b82f6,#1e3a8a)',
    white:'linear-gradient(135deg,#404040,#1a1a1a)', grey:'linear-gradient(135deg,#6b7280,#374151)',
    yellow:'linear-gradient(135deg,#fde047,#b45309)', orange:'linear-gradient(135deg,#fb923c,#9a3412)',
    green:'linear-gradient(135deg,#22c55e,#14532d)',
  };
  return m[(belt||'white').toLowerCase()] || m.white;
}

function fmtTime(ts: string) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const TRAY_W = 320;
const TRAY_H = 420;
const TRAY_GAP = 12;
// Above the tab bar (~64-72px) + safe-area inset + breathing room.
// Use string so we can compose with env(safe-area-inset-bottom).
const BOTTOM_OFFSET = 'calc(80px + env(safe-area-inset-bottom, 0px))';
// Minimized bubble collapses to a compact pill aligned to the right edge.
const MIN_W = 220;

// ─── Single DM Tray ───────────────────────────────────────────────────────────

function DMTray({
  peer,
  stackIndex,
  totalOpen,
  onClose,
  onToggleMinimize,
  myName,
  myBelt,
  myXP,
  myPfp,
}: {
  peer: DMPeer;
  stackIndex: number;
  totalOpen: number;
  onClose: () => void;
  onToggleMinimize: (next: boolean) => void;
  myName: string;
  myBelt: string;
  myXP: number;
  myPfp?: string;
}) {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  // Minimized state is owned by the provider (so it survives remounts) — mirror peer.minimized
  const minimized = !!peer.minimized;
  const setMinimized = (next: boolean | ((v: boolean) => boolean)) => {
    const val = typeof next === 'function' ? (next as any)(minimized) : next;
    onToggleMinimize(!!val);
  };
  const [unread, setUnread]     = useState(0);
  const feedRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const myLevel   = getActualLevel(myXP);
  const peerLevel = getActualLevel(peer.totalPoints);

  // Stack position: rightmost = stackIndex 0, each subsequent shifts left
  const effectiveW = minimized ? MIN_W : TRAY_W;
  const rightOffset = 16 + stackIndex * ((minimized ? MIN_W : TRAY_W) + TRAY_GAP);

  const loadMessages = useCallback(async () => {
    const msgs = await dmGetThread(peer.email, 60);
    setMessages(msgs);
    // Mark as read when tray is open and not minimized
    if (!minimized && msgs.some(m => !m.isMe && !m.read)) {
      dmMarkRead(peer.email).catch(() => {}).finally(() => window.dispatchEvent(new CustomEvent('dm-read')));
      setUnread(0);
    } else {
      const newUnread = msgs.filter(m => !m.isMe && !m.read).length;
      setUnread(newUnread);
    }
  }, [peer.email, minimized]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadMessages]);

  // Auto-scroll
  useEffect(() => {
    if (!minimized) {
      setTimeout(() => { feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' }); }, 60);
    }
  }, [messages.length, minimized]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');
    // Optimistic
    const optimistic: DmMessage = {
      id: `tmp-${Date.now()}`,
      sender: myName, senderEmail: '',
      senderBelt: myBelt, senderTotalPoints: myXP,
      text, timestamp: new Date().toISOString(),
      read: false, isMe: true,
    };
    setMessages(prev => [...prev, optimistic]);
    await dmSend(peer.email, text);
    setSending(false);
    loadMessages();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: BOTTOM_OFFSET,
      right: rightOffset,
      width: effectiveW,
      height: minimized ? 52 : TRAY_H,
      background: '#030303',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: minimized ? 26 : 20,
      boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'height 0.35s cubic-bezier(0.175,0.885,0.32,1.1), width 0.35s cubic-bezier(0.175,0.885,0.32,1.1), right 0.3s cubic-bezier(0.16,1,0.3,1), border-radius 0.3s',
      zIndex: 9000 + (10 - stackIndex),
    }}>

      {/* Header */}
      <div
        onClick={() => { setMinimized(v => !v); if (minimized) { setUnread(0); dmMarkRead(peer.email).catch(()=>{}).finally(() => window.dispatchEvent(new CustomEvent('dm-read'))); } }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10,
          padding: minimized ? '8px 12px' : '12px 14px',
          height: minimized ? 52 : 'auto',
          boxSizing: 'border-box',
          flexShrink: 0, cursor: 'pointer',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ParagonRing level={peerLevel} size={32} showOrbit={false}>
            {peer.profilePic
              ? <img src={peer.profilePic} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', display: 'block' }} />
              : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: avatarGrad(peer.belt), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                  {(peer.name||'?').charAt(0).toUpperCase()}
                </div>
            }
          </ParagonRing>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {peer.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: getBeltColor(peer.belt), flexShrink: 0 }} />
            <span style={{ fontSize: minimized ? 10 : 9, fontWeight: 700, color: '#a8a29e', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {peer.belt} belt
            </span>
            {!minimized && (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#e8af34', background:'rgba(232,175,52,.12)', padding:'1px 4px', borderRadius:4, border:'1px solid rgba(232,175,52,.22)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                LV {peerLevel}
              </span>
            )}
          </div>
        </div>

        {/* Unread badge */}
        {minimized && unread > 0 && (
          <div style={{ width:18, height:18, borderRadius:'50%', background:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {unread}
          </div>
        )}

        {/* Minimize / close */}
        <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
          <div style={{ width:20, height:20, borderRadius:6, background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'#57534e' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"
              style={{ transform: minimized ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform .3s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          <div
            onClick={e => { e.stopPropagation(); onClose(); }}
            style={{ width:20, height:20, borderRadius:6, background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', color:'#57534e', cursor:'pointer' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Message feed */}
      {!minimized && (
        <>
          <div
            ref={feedRef}
            style={{
              flex: 1, overflowY: 'auto', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 14,
              scrollbarWidth: 'none',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign:'center', color:'#57534e', fontSize:12, margin:'auto' }}>
                No messages yet. Say hi 👋
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.isMe;
                const senderLevel = getActualLevel(isMe ? myXP : (msg.senderTotalPoints || peer.totalPoints));
                const senderBelt  = isMe ? myBelt : (msg.senderBelt || peer.belt);
                const senderPfp   = isMe ? myPfp  : peer.profilePic;
                const senderName  = isMe ? myName : msg.sender;
                const pillBelt    = ['black','brown','purple','blue','white'].includes(senderBelt.toLowerCase()) ? senderBelt.toLowerCase() : 'white';

                return (
                  <div key={msg.id} style={{ display:'flex', gap:8, alignItems:'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    {/* Avatar */}
                    <div style={{ flexShrink:0 }}>
                      <ParagonRing level={senderLevel} size={28} showOrbit={false}>
                        {senderPfp
                          ? <img src={senderPfp} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                          : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: avatarGrad(senderBelt), display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff' }}>
                              {(senderName||'?').charAt(0).toUpperCase()}
                            </div>
                        }
                      </ParagonRing>
                    </div>

                    {/* Content */}
                    <div style={{ display:'flex', flexDirection:'column', gap:4, maxWidth:'78%', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {/* Meta */}
                      <div style={{ display:'flex', alignItems:'center', gap:5, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <span style={{ fontSize:11, fontWeight:700, color:'#e7e5e4' }}>{isMe ? 'You' : senderName}</span>
                        <span style={{ fontSize:9, fontWeight:900, color:'#e8af34', background:'rgba(232,175,52,.12)', border:'1px solid rgba(232,175,52,.25)', padding:'1px 4px', borderRadius:4 }}>LV {senderLevel}</span>
                        <span style={beltPill(pillBelt)}>{pillBelt.charAt(0).toUpperCase()+pillBelt.slice(1)}</span>
                        <span style={{ fontSize:9, fontWeight:600, color:'#57534e' }}>{fmtTime(msg.timestamp)}</span>
                      </div>
                      {/* Bubble */}
                      <div style={isMe ? {
                        background:'linear-gradient(135deg,rgba(232,175,52,.15),rgba(232,175,52,.06))',
                        border:'1px solid rgba(232,175,52,.28)',
                        padding:'9px 13px', borderRadius:14, borderBottomRightRadius:3,
                        fontSize:13, fontWeight:500, color:'#fff', lineHeight:1.5,
                        boxShadow:'0 3px 16px rgba(232,175,52,.25)',
                      } : {
                        background:'#0f0e0d', border:'1px solid rgba(255,255,255,.06)',
                        padding:'9px 13px', borderRadius:14, borderBottomLeftRadius:3,
                        fontSize:13, fontWeight:500, color:'#fff', lineHeight:1.5,
                        boxShadow:'0 3px 10px rgba(0,0,0,.35)',
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input bar */}
          <div style={{
            padding:'10px 12px',
            background:'linear-gradient(to top, #030303 70%, transparent)',
            flexShrink:0,
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)',
              padding:'7px 8px 7px 14px', borderRadius:18,
              transition:'border-color .3s',
            }}
              onFocus={() => {}}
            >
              {/* Self paragon ring */}
              <div style={{ flexShrink:0 }}>
                <ParagonRing level={myLevel} size={24} showOrbit={false}>
                  {myPfp
                    ? <img src={myPfp} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: avatarGrad(myBelt), display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800, color:'#fff' }}>
                        {(myName||'?').charAt(0).toUpperCase()}
                      </div>
                  }
                </ParagonRing>
              </div>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Message ${peer.name.split(' ')[0]}…`}
                style={{
                  flex:1, background:'transparent', border:'none', outline:'none',
                  fontSize:13, color:'#fff', fontFamily:'inherit',
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  background: input.trim() ? '#e8af34' : 'rgba(255,255,255,.05)',
                  border:'none', cursor: input.trim() ? 'pointer' : 'default',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'#000',
                  boxShadow: input.trim() ? '0 4px 12px rgba(232,175,52,.4)' : 'none',
                  transition:'all .25s cubic-bezier(0.175,0.885,0.32,1.275)',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#000' : '#555'} strokeWidth="2.5" width="13" height="13"
                  style={{ transform:'translateX(-1px)' }}>
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Provider + Manager ───────────────────────────────────────────────────────

// ─── Incoming toast ───────────────────────────────────────────────────────────

interface IncomingToast {
  key: string;
  peer: DMPeer;
  text: string;
}

function DMToastCard({ toast, onDismiss }: { toast: IncomingToast; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const level = getActualLevel(toast.peer.totalPoints || 0);
  const preview = toast.text.length > 80 ? toast.text.slice(0, 80) + '…' : toast.text;
  const belt = (toast.peer.belt || 'white').toLowerCase();
  const pillBelt = ['black','brown','purple','blue','white'].includes(belt) ? belt : 'white';

  const handleOpen = () => {
    dispatchOpenDM({ ...toast.peer, minimized: false });
    onDismiss();
  };

  return (
    <div
      onClick={handleOpen}
      style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'stretch', gap: 0,
        background: 'rgba(10,10,12,0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: '3px solid #C8A24C',
        boxShadow: '0 14px 40px rgba(0,0,0,0.75), 0 0 0 1px rgba(200,162,76,0.12)',
        borderRadius: 16,
        padding: '12px 14px 12px 12px',
        minWidth: 280, maxWidth: 380,
        cursor: 'pointer',
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-24px) scale(0.96)',
        opacity: mounted ? 1 : 0,
        transition: 'transform .45s cubic-bezier(0.175,0.885,0.32,1.275), opacity .3s',
      }}
    >
      <div style={{ flexShrink: 0, marginRight: 11, display:'flex', alignItems:'center', justifyContent: 'center' }}>
        <ParagonRing level={level} size={40} showOrbit={false}>
          {toast.peer.profilePic
            ? <img src={toast.peer.profilePic} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: avatarGrad(toast.peer.belt), display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff' }}>
                {(toast.peer.name||'?').charAt(0).toUpperCase()}
              </div>
          }
        </ParagonRing>
      </div>
      <div style={{ flex: 1, minWidth: 0, display:'flex', flexDirection:'column', gap:3 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>
            {toast.peer.name}
          </div>
          <span style={beltPill(pillBelt)}>{pillBelt.charAt(0).toUpperCase()+pillBelt.slice(1)}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#d6d3d1', overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:1.35 }}>
          {preview}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#57534e', textTransform:'uppercase', letterSpacing:'.08em', marginTop:2 }}>
          Tap to reply
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        aria-label="Dismiss"
        style={{ flexShrink:0, width:22, height:22, borderRadius:6, background:'rgba(255,255,255,0.06)', border:'none', color:'#a8a29e', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', alignSelf:'flex-start', marginLeft:8 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

function DMToastStack({ toasts, onDismiss }: { toasts: IncomingToast[]; onDismiss: (key: string) => void }) {
  return createPortal(
    <div style={{
      position: 'fixed',
      top: 'calc(12px + env(safe-area-inset-top, 0px))',
      left: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      zIndex: 10000,
      pointerEvents: 'none',
      padding: '0 12px',
    }}>
      {toasts.map(t => (
        <DMToastCard key={t.key} toast={t} onDismiss={() => onDismiss(t.key)} />
      ))}
    </div>,
    document.body
  );
}

// ─── Conversations Inbox Tray ─────────────────────────────────────────────────

function DMInboxTray({ onClose }: { onClose: () => void }) {
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await dmGetConversations();
      list.sort((a, b) => new Date(b.lastTs || 0).getTime() - new Date(a.lastTs || 0).getTime());
      setConversations(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    const readHandler = () => load();
    window.addEventListener('dm-read', readHandler);
    return () => { clearInterval(t); window.removeEventListener('dm-read', readHandler); };
  }, [load]);

  return (
    <div style={{
      position: 'fixed',
      bottom: BOTTOM_OFFSET,
      right: 16,
      width: TRAY_W,
      height: TRAY_H,
      background: '#030303',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 9500,
    }}>
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'12px 14px', flexShrink:0,
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        background:'rgba(255,255,255,0.02)',
      }}>
        <div style={{ width:32, height:32, borderRadius:10, background:'rgba(232,175,52,.14)', border:'1px solid rgba(232,175,52,.28)', display:'flex', alignItems:'center', justifyContent:'center', color:'#e8af34', flexShrink:0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="16" height="16">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>Messages</div>
          <div style={{ fontSize:10, fontWeight:600, color:'#a8a29e', marginTop:1 }}>
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ width:22, height:22, borderRadius:6, background:'rgba(255,255,255,.05)', border:'none', color:'#a8a29e', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
        {loading && conversations.length === 0 ? (
          <div style={{ textAlign:'center', color:'#57534e', fontSize:12, padding:'24px' }}>Loading…</div>
        ) : conversations.length === 0 ? (
          <div style={{ textAlign:'center', color:'#57534e', fontSize:12, padding:'32px 20px' }}>
            No conversations yet.<br/>Tap a member to start a chat.
          </div>
        ) : (
          conversations.map(c => {
            const level = getActualLevel(0);
            const belt  = (c.partnerBelt || 'white').toLowerCase();
            const preview = (c.lastText || '').length > 40 ? (c.lastText || '').slice(0, 40) + '…' : (c.lastText || '');
            const pillBelt = ['black','brown','purple','blue','white'].includes(belt) ? belt : 'white';
            return (
              <button
                key={c.partnerEmail || c.partnerName}
                onClick={() => {
                  dispatchOpenDM({
                    email: c.partnerEmail || '',
                    name: c.partnerName || '',
                    belt: belt,
                    totalPoints: 0,
                    profilePic: c.partnerProfilePic,
                  });
                  onClose();
                }}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px', background:'transparent', border:'none',
                  borderBottom:'1px solid rgba(255,255,255,.04)',
                  cursor:'pointer', textAlign:'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flexShrink:0 }}>
                  <ParagonRing level={level} size={32} showOrbit={false}>
                    {c.partnerProfilePic
                      ? <img src={c.partnerProfilePic} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                      : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: avatarGrad(belt), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                          {(c.partnerName||'?').charAt(0).toUpperCase()}
                        </div>
                    }
                  </ParagonRing>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {c.partnerName}
                    </span>
                    <span style={beltPill(pillBelt)}>{pillBelt.charAt(0).toUpperCase()+pillBelt.slice(1)}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#a8a29e', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {preview || 'No messages yet'}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <span style={{ fontSize:10, color:'#57534e', fontWeight:600 }}>{fmtRelative(c.lastTs)}</span>
                  {c.unread && (
                    <div style={{ minWidth:16, height:16, borderRadius:8, background:'#C8A24C', color:'#000', fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 5px' }}>
                      •
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Provider + Manager ───────────────────────────────────────────────────────

const DM_ACTIVE_KEY = 'lbjj_dm_active';
const DM_STATE_KEY  = 'lbjj_dm_state';

function loadActivePeers(): DMPeer[] {
  try {
    const raw = sessionStorage.getItem(DM_ACTIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Legacy single-peer shape: { name, email, belt, profilePic }
      if (parsed && (parsed.email || parsed.name)) {
        return [{
          email: parsed.email || '',
          name: parsed.name || '',
          belt: parsed.belt || 'white',
          totalPoints: parsed.totalPoints || 0,
          profilePic: parsed.profilePic,
          minimized: true,
        }];
      }
      return [];
    }
    return parsed.filter(p => p && (p.email || p.name));
  } catch { return []; }
}

function saveActivePeers(peers: DMPeer[]) {
  try {
    if (!peers.length) sessionStorage.removeItem(DM_ACTIVE_KEY);
    else sessionStorage.setItem(DM_ACTIVE_KEY, JSON.stringify(peers));
  } catch {}
}

function loadTrayState(): 'open' | 'minimized' | 'closed' {
  try {
    const v = sessionStorage.getItem(DM_STATE_KEY);
    if (v === 'open' || v === 'minimized' || v === 'closed') return v;
  } catch {}
  return 'closed';
}

function saveTrayState(state: 'open' | 'minimized' | 'closed') {
  try { sessionStorage.setItem(DM_STATE_KEY, state); } catch {}
}

export function DMProvider({ children }: { children: React.ReactNode }) {
  const { member, isAuthenticated } = useAuth();
  // Restore active peers from sessionStorage so conversations survive navigation/remount.
  // Only rehydrate on initial mount; the `isAuthenticated` gate below prevents rendering if logged out.
  const [openPeers, setOpenPeers] = useState<DMPeer[]>(() => loadActivePeers());

  // Clear persisted state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setOpenPeers([]);
      try { sessionStorage.removeItem(DM_ACTIVE_KEY); sessionStorage.removeItem(DM_STATE_KEY); } catch {}
    }
  }, [isAuthenticated]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<IncomingToast[]>([]);
  const [inboxOpen, setInboxOpen] = useState(false);
  const firstPollRef = useRef(true);
  const seenThreadRef = useRef<Record<string, string>>({}); // fromEmail -> last seen lastTs

  // Persist openPeers to sessionStorage whenever they change
  useEffect(() => { saveActivePeers(openPeers); }, [openPeers]);

  // Keep the coarse tray state in sync for consumers that want a quick check
  useEffect(() => {
    if (openPeers.length === 0) saveTrayState('closed');
    else if (openPeers.every(p => p.minimized)) saveTrayState('minimized');
    else saveTrayState('open');
  }, [openPeers]);

  // Listen for open-dm events from anywhere
  useEffect(() => {
    const handler = (e: Event) => {
      const peer = (e as CustomEvent<DMPeer>).detail;
      if (!peer?.email && !peer?.name) return; // need at least a name
      setInboxOpen(false);
      setOpenPeers(prev => {
        const peerEmail = (peer.email || '').toLowerCase().trim();
        const existing = prev.find(p => (p.email && p.email.toLowerCase().trim() === peerEmail) || (!peerEmail && p.name === peer.name));
        if (existing) {
          // If already open, preserve current minimized state unless caller explicitly passed one
          const merged: DMPeer = {
            ...existing,
            ...peer,
            minimized: peer.minimized !== undefined ? peer.minimized : existing.minimized,
          };
          return [merged, ...prev.filter(p => p !== existing)];
        }
        // New peer — default to minimized unless caller explicitly opens expanded
        const next: DMPeer = { ...peer, minimized: peer.minimized !== undefined ? peer.minimized : true };
        return [next, ...prev].slice(0, 3);
      });
    };
    window.addEventListener('open-dm', handler);
    return () => window.removeEventListener('open-dm', handler);
  }, [member]);

  // Listen for inbox open events
  useEffect(() => {
    const handler = () => setInboxOpen(v => !v);
    window.addEventListener('open-dm-inbox', handler);
    return () => window.removeEventListener('open-dm-inbox', handler);
  }, []);

  // Poll unread + detect new incoming messages for toast
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const poll = async () => {
      const res = await dmGetUnread();
      if (cancelled) return;
      setUnreadCount(res.count);

      const isFirst = firstPollRef.current;
      firstPollRef.current = false;

      // Detect new messages per thread
      const newToasts: IncomingToast[] = [];
      for (const t of (res.threads || [])) {
        const lastKey = seenThreadRef.current[t.fromEmail || t.fromName];
        const currKey = `${t.lastTs}|${t.count}`;
        if (lastKey !== currKey) {
          seenThreadRef.current[t.fromEmail || t.fromName] = currKey;
          // Skip toast on very first poll so we don't bombard on page load
          if (!isFirst && t.count > 0) {
            const peer: DMPeer = {
              email: t.fromEmail || '',
              name: t.fromName || 'Someone',
              belt: (t as any).fromBelt || 'white',
              totalPoints: (t as any).fromTotalPoints || 0,
              profilePic: (t as any).fromProfilePic,
            };
            newToasts.push({
              key: `${t.fromEmail || t.fromName}-${t.lastTs}-${Date.now()}`,
              peer,
              text: t.lastText || '',
            });
            // Auto-open the DM tray in minimized state so user can expand & reply
            dispatchOpenDM({ ...peer, minimized: true });
          }
        }
      }
      if (newToasts.length) {
        setToasts(prev => [...prev, ...newToasts]);
        newToasts.forEach(nt => {
          setTimeout(() => {
            setToasts(prev => prev.filter(x => x.key !== nt.key));
          }, 4000);
        });
      }
    };
    poll();
    const t = setInterval(poll, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [isAuthenticated]);

  const dismissToast = useCallback((key: string) => {
    setToasts(prev => prev.filter(t => t.key !== key));
  }, []);

  const myName = member?.name || '';
  const myBelt = ((member as any)?.belt || 'white').toLowerCase();
  const myXP   = (() => { try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp||0, s.totalXP||0, (member as any)?.totalPoints||0); } catch { return 0; } })();
  const myPfp  = (() => { try { return localStorage.getItem('lbjj_profile_picture') || undefined; } catch { return undefined; } })();

  const closePeer = (email: string) => setOpenPeers(prev => prev.filter(p => p.email !== email));

  const toggleMinimize = (email: string, minimized: boolean) => {
    setOpenPeers(prev => prev.map(p => (p.email === email ? { ...p, minimized } : p)));
  };

  return (
    <DMContext.Provider value={{ openDM: (peer) => dispatchOpenDM(peer), unreadCount, setUnreadCount }}>
      {children}
      {isAuthenticated && toasts.length > 0 && (
        <DMToastStack toasts={toasts} onDismiss={dismissToast} />
      )}
      {isAuthenticated && inboxOpen && createPortal(
        <DMInboxTray onClose={() => setInboxOpen(false)} />,
        document.body
      )}
      {isAuthenticated && openPeers.length > 0 && createPortal(
        <>
          {openPeers.map((peer, i) => (
            <DMTray
              key={peer.email || peer.name}
              peer={peer}
              stackIndex={i}
              totalOpen={openPeers.length}
              onClose={() => closePeer(peer.email)}
              onToggleMinimize={(next) => toggleMinimize(peer.email, next)}
              myName={myName}
              myBelt={myBelt}
              myXP={myXP}
              myPfp={myPfp}
            />
          ))}
        </>,
        document.body
      )}
    </DMContext.Provider>
  );
}
