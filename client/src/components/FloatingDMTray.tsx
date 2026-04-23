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
import { dmSend, dmGetThread, dmMarkRead, dmGetUnread, type DmMessage } from '@/lib/api';

// ─── DM Context ───────────────────────────────────────────────────────────────

export interface DMPeer {
  email: string;
  name: string;
  belt: string;
  totalPoints: number;
  profilePic?: string;
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
const BOTTOM_OFFSET = 72; // above the tab bar

// ─── Single DM Tray ───────────────────────────────────────────────────────────

function DMTray({
  peer,
  stackIndex,
  totalOpen,
  onClose,
  myName,
  myBelt,
  myXP,
  myPfp,
}: {
  peer: DMPeer;
  stackIndex: number;
  totalOpen: number;
  onClose: () => void;
  myName: string;
  myBelt: string;
  myXP: number;
  myPfp?: string;
}) {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [unread, setUnread]     = useState(0);
  const feedRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const myLevel   = getActualLevel(myXP);
  const peerLevel = getActualLevel(peer.totalPoints);

  // Stack position: rightmost = stackIndex 0, each subsequent shifts left
  const rightOffset = TRAY_GAP + stackIndex * (TRAY_W + TRAY_GAP);

  const loadMessages = useCallback(async () => {
    const msgs = await dmGetThread(peer.email, 60);
    setMessages(msgs);
    // Mark as read when tray is open and not minimized
    if (!minimized && msgs.some(m => !m.isMe && !m.read)) {
      dmMarkRead(peer.email).catch(() => {});
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
      width: TRAY_W,
      height: minimized ? 52 : TRAY_H,
      background: '#030303',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      boxShadow: '0 24px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'height 0.35s cubic-bezier(0.175,0.885,0.32,1.1), right 0.3s cubic-bezier(0.16,1,0.3,1)',
      zIndex: 9000 + (10 - stackIndex),
    }}>

      {/* Header */}
      <div
        onClick={() => { setMinimized(v => !v); if (minimized) { setUnread(0); dmMarkRead(peer.email).catch(()=>{}); } }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', flexShrink: 0, cursor: 'pointer',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          userSelect: 'none',
        }}
      >
        <ParagonRing level={peerLevel} size={32} showOrbit={false}>
          {peer.profilePic
            ? <img src={peer.profilePic} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
            : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background: avatarGrad(peer.belt), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#fff' }}>
                {(peer.name||'?').charAt(0).toUpperCase()}
              </div>
          }
        </ParagonRing>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {peer.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: getBeltColor(peer.belt), flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#a8a29e', textTransform: 'capitalize' }}>
              {peer.belt} belt
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#e8af34', background:'rgba(232,175,52,.12)', padding:'1px 4px', borderRadius:4, border:'1px solid rgba(232,175,52,.22)' }}>
              LV {peerLevel}
            </span>
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

export function DMProvider({ children }: { children: React.ReactNode }) {
  const { member, isAuthenticated } = useAuth();
  const [openPeers, setOpenPeers] = useState<DMPeer[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for open-dm events from anywhere
  useEffect(() => {
    const handler = (e: Event) => {
      const peer = (e as CustomEvent<DMPeer>).detail;
      if (!peer?.email && !peer?.name) return; // need at least a name
      setOpenPeers(prev => {
        // Don't open DM with yourself
        if (peer.email === (member as any)?.email) return prev;
        // Already open? Bring to front (move to index 0)
        if (prev.some(p => p.email === peer.email)) {
          return [peer, ...prev.filter(p => p.email !== peer.email)];
        }
        // Max 3 open at once
        const next = [peer, ...prev].slice(0, 3);
        return next;
      });
    };
    window.addEventListener('open-dm', handler);
    return () => window.removeEventListener('open-dm', handler);
  }, [member]);

  // Poll unread count every 30s
  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = async () => {
      const res = await dmGetUnread();
      setUnreadCount(res.count);
    };
    poll();
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, [isAuthenticated]);

  const myName = member?.name || '';
  const myBelt = ((member as any)?.belt || 'white').toLowerCase();
  const myXP   = (() => { try { const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); return Math.max(s.xp||0, s.totalXP||0, (member as any)?.totalPoints||0); } catch { return 0; } })();
  const myPfp  = (() => { try { return localStorage.getItem('lbjj_profile_picture') || undefined; } catch { return undefined; } })();

  const closePeer = (email: string) => setOpenPeers(prev => prev.filter(p => p.email !== email));

  return (
    <DMContext.Provider value={{ openDM: (peer) => dispatchOpenDM(peer), unreadCount, setUnreadCount }}>
      {children}
      {isAuthenticated && openPeers.length > 0 && createPortal(
        <>
          {openPeers.map((peer, i) => (
            <DMTray
              key={peer.email}
              peer={peer}
              stackIndex={i}
              totalOpen={openPeers.length}
              onClose={() => closePeer(peer.email)}
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
