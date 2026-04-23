/**
 * OnlineBubble — global online members pill with dropdown.
 *
 * Shows: green pulsing dot + online count.
 * Dropdown sections:
 *   ● Active Now   — lastSeen < 5 min
 *   ◑ Recently     — lastSeen 5–60 min
 * Clicking a member navigates to chat.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { dispatchOpenDM } from '@/components/FloatingDMTray';
import { dmGetUnread, chatGetChannelMembers, getRecentUsers, updatePresence, type ChannelMember } from '@/lib/api';
import { getBeltColor } from '@/lib/constants';
import { getActualLevel } from '@/lib/xp';

import { useAuth } from '@/lib/auth-context';

// Navigate to chat and open the profile modal for a member
function openMemberProfile(m: ChannelMember) {
  try {
    localStorage.setItem('lbjj_open_profile_email', m.email || '');
    localStorage.setItem('lbjj_open_profile_name', m.name || '');
  } catch {}
  const alreadyOnChat = window.location.hash.replace(/^#/, '').startsWith('/chat');
  if (alreadyOnChat) {
    // Already on chat — fire event directly, ChatPage listener will catch it
    window.dispatchEvent(new CustomEvent('open-member-profile', { detail: m }));
  } else {
    // Navigate to chat, then fire after a delay for ChatPage to mount
    window.location.hash = '#/chat';
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-member-profile', { detail: m }));
    }, 500);
  }
}

const ONLINE_MS   = 5  * 60 * 1000;  // 5 min  → "Active Now"
const RECENT_MS   = 60 * 60 * 1000;  // 60 min → "Recently Online"

function avatarGrad(belt: string) {
  const map: Record<string, string> = {
    black:  'linear-gradient(135deg,#171717,#ef4444)',
    brown:  'linear-gradient(135deg,#92400e,#451a03)',
    purple: 'linear-gradient(135deg,#a855f7,#3b0764)',
    blue:   'linear-gradient(135deg,#3b82f6,#1e3a8a)',
    white:  'linear-gradient(135deg,#404040,#1a1a1a)',
    grey:   'linear-gradient(135deg,#6b7280,#374151)',
    yellow: 'linear-gradient(135deg,#fde047,#b45309)',
    orange: 'linear-gradient(135deg,#fb923c,#9a3412)',
    green:  'linear-gradient(135deg,#22c55e,#14532d)',
  };
  return map[(belt||'white').toLowerCase()] || map.white;
}

function MemberRow({ m, dimmed, onClick, onProfile }: { m: ChannelMember; dimmed?: boolean; onClick: () => void; onProfile?: () => void }) {
  const level = getActualLevel(m.totalPoints || 0);
  const belt  = (m.belt || 'white').toLowerCase();
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '6px 8px', borderRadius: 11,
        opacity: dimmed ? 0.55 : 1, transition: 'background .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: avatarGrad(belt), overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: '#fff',
        }}>
          {m.profilePic
            ? <img src={m.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (m.name || '?').charAt(0).toUpperCase()
          }
        </div>
        {!dimmed && (
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '1.5px solid #0f0e0d' }} />
        )}
      </div>

      {/* Name + belt */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
          <div style={{ width: 7, height: 7, borderRadius: 2, background: getBeltColor(belt) }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#a8a29e', textTransform: 'capitalize' }}>{belt} belt</span>
        </div>
      </div>

      {/* LV + action buttons inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: '#e8af34', background: 'rgba(232,175,52,.12)', padding: '1px 5px', borderRadius: 5, border: '1px solid rgba(232,175,52,.22)' }}>LV {level}</span>
        {/* Message */}
        <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(232,175,52,.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8af34' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        {/* Profile */}
        {onProfile && (
          <button onClick={e => { e.stopPropagation(); onProfile(); }} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a8a29e' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function OnlineBubble({ compact = false }: { compact?: boolean }) {
  const { member, isAuthenticated } = useAuth();
  const [open, setOpen]       = useState(false);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Build self entry always-online
  const buildSelf = useCallback((): ChannelMember | null => {
    if (!member?.name) return null;
    try {
      const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      return {
        name:        member.name,
        email:       (member as any).email || '',
        belt:        ((member as any).belt || 'white').toLowerCase(),
        role:        (member as any).role || '',
        totalPoints: Math.max(s.xp || 0, s.totalXP || 0, (member as any)?.totalPoints || 0),
        badgeCount:  0,
        profilePic:  localStorage.getItem('lbjj_profile_picture') || undefined,
        lastSeen:    new Date().toISOString(),
      };
    } catch { return null; }
  }, [member]);

  const load = useCallback(async () => {
    try {
      const list = await chatGetChannelMembers('general');
      const self = buildSelf();
      if (self) {
        const without = list.filter(m => (m.email || m.name) !== (self.email || self.name));
        setMembers([self, ...without]);
      } else {
        setMembers(list);
      }
    } catch {}
  }, [buildSelf]);

  // Inject self immediately, then fetch
  useEffect(() => {
    if (!isAuthenticated) return;
    const self = buildSelf();
    if (self) setMembers(prev => {
      const without = prev.filter(m => (m.email || m.name) !== (self.email || self.name));
      return [self, ...without];
    });
    updatePresence().catch(() => {});
    load();
    const t = setInterval(() => { updatePresence().catch(() => {}); load(); }, 60000);
    return () => clearInterval(t);
  }, [isAuthenticated, load, buildSelf]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated || !member) return null;

  const nowMs    = Date.now();
  const active   = members.filter(m => m.lastSeen && (nowMs - new Date(m.lastSeen).getTime()) < ONLINE_MS);
  const offline  = members.filter(m => !m.lastSeen || (nowMs - new Date(m.lastSeen).getTime()) >= ONLINE_MS);

  // Self always counts as 1
  const onlineCount = Math.max(active.length, 1);

  const goToChat = () => { setOpen(false); window.location.hash = '#/chat'; };
  const openMemberDM = (m: ChannelMember) => {
    setOpen(false);
    dispatchOpenDM({ email: m.email || '', name: m.name || '', belt: m.belt || 'white', totalPoints: m.totalPoints || 0, profilePic: m.profilePic });
  };

  const handleToggle = () => {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', zIndex: 200 }}>
      <style>{`@keyframes ob-pulse{0%{transform:scale(1);opacity:.7}50%{transform:scale(1.8);opacity:0}100%{transform:scale(1);opacity:0}}`}</style>
      {/* Pill button */}
      <button
        onClick={handleToggle}
        style={compact ? {
          // Compact: tiny ● N pill, no label
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', padding: '1px 4px',
          cursor: 'pointer', flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        } : {
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,.07)',
          border: '1px solid rgba(16,185,129,.22)',
          padding: '6px 11px', borderRadius: 14,
          cursor: 'pointer', transition: 'all .25s',
          WebkitTapHighlightColor: 'transparent',
        }}
        onMouseEnter={compact ? undefined : e => (e.currentTarget.style.background = 'rgba(16,185,129,.13)')}
        onMouseLeave={compact ? undefined : e => (e.currentTarget.style.background = 'rgba(16,185,129,.07)')}
      >
        {/* Pulsing dot */}
        <div style={{ position: 'relative', width: compact ? 6 : 8, height: compact ? 6 : 8, flexShrink: 0 }}>
          <div style={{
            width: compact ? 6 : 8, height: compact ? 6 : 8, borderRadius: '50%',
            background: '#10b981', boxShadow: '0 0 6px #10b981',
          }} />
          <div style={{
            position: 'absolute', inset: -2, borderRadius: '50%',
            background: 'rgba(16,185,129,.3)',
            animation: 'ob-pulse 2s infinite',
          }} />
        </div>
        <span style={{ fontSize: compact ? 9 : 11, fontWeight: 800, color: '#10b981', letterSpacing: '.05em' }}>
          {onlineCount}
        </span>
        {!compact && (
          <>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', opacity: .8 }}>Online</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" width="12" height="12"
              style={{ transition: 'transform .3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', opacity: .7 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown — always portaled to body to escape any stacking context / overflow clipping */}
      {createPortal(
      <div style={{
        position: 'fixed',
        top: dropPos?.top ?? 60,
        right: dropPos?.right ?? 12,
        width: 272,
        zIndex: 99999,
        background: '#161412', border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 20, padding: 10,
        boxShadow: '0 20px 60px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.04)',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'all .3s cubic-bezier(0.175,0.885,0.32,1.275)',
        maxHeight: '70vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Active Now */}
        {active.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '.15em', textTransform: 'uppercase', padding: '4px 8px 4px' }}>
              ● Active Now
            </div>
            <div>
              {active.map(m => (
                <MemberRow key={m.email || m.name} m={m} onClick={() => openMemberDM(m)} onProfile={() => openMemberProfile(m)} />
              ))}
            </div>
          </>
        )}

        {/* Offline — all non-active members, collapsible */}
        {offline.length > 0 && (
          <>
            {active.length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '6px 0' }} />}
            <RecentSection members={offline} onOpen={(m) => openMemberDM(m)} onProfile={(m) => openMemberProfile(m)} label="Offline" />
          </>
        )}

        {active.length === 0 && offline.length === 0 && (
          <div style={{ fontSize: 12, color: '#57534e', padding: '8px 10px', textAlign: 'center' }}>
            Just you for now
          </div>
        )}

        {/* Footer: go to chat */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '8px 0 4px' }} />
        <button
          onClick={goToChat}
          style={{
            padding: '8px 10px', borderRadius: 10, width: '100%',
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
            fontSize: 12, fontWeight: 700, color: '#a8a29e', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background .2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Open Chat
        </button>
      </div>
      , document.body)}
    </div>
  );
}

function RecentSection({ members, onOpen, onProfile, label = 'Recently' }: { members: ChannelMember[]; onOpen: (m: ChannelMember) => void; onProfile?: (m: ChannelMember) => void; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const fmt = (m: ChannelMember) => {
    if (!m.lastSeen) return 'offline';
    const mins = Math.floor((Date.now() - new Date(m.lastSeen).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return 'offline';
  };
  return (
    <div>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, color: '#57534e', letterSpacing: '.15em', textTransform: 'uppercase' }}>
          ◑ {label} — {members.length}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="#57534e" strokeWidth="2.5" width="12" height="12"
          style={{ transition: 'transform .3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {expanded && (
        <div style={{ maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'none' }}>
          {members.map(m => (
            <MemberRow key={m.email || m.name} m={m} dimmed
              onClick={() => onOpen(m)}
              onProfile={onProfile ? () => onProfile(m) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * OnlineAvatarCluster — compact stacked PFP strip for the HomePage header.
 * Shows up to 3 overlapping avatars of online members (< 5 min) + count badge.
 * Taps to open the same Active Now / Recently dropdown via portal.
 */
export function OnlineAvatarCluster() {
  const { member, isAuthenticated } = useAuth();
  const [open, setOpen]       = useState(false);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const [dmUnread, setDmUnread]       = useState(0);
  const [focusedMember, setFocused]    = useState<ChannelMember | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const buildSelf = useCallback((): ChannelMember | null => {
    if (!member?.name) return null;
    try {
      const s = JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}');
      return {
        name: member.name, email: (member as any).email || '',
        belt: ((member as any).belt || 'white').toLowerCase(),
        role: (member as any).role || '',
        totalPoints: Math.max(s.xp || 0, s.totalXP || 0, (member as any)?.totalPoints || 0),
        badgeCount: 0,
        profilePic: localStorage.getItem('lbjj_profile_picture') || undefined,
        lastSeen: new Date().toISOString(),
      };
    } catch { return null; }
  }, [member]);

  const load = useCallback(async () => {
    try {
      // getRecentUsers scans all pr_* presence keys — shows who opened the app recently (not just chat users)
      const list = await getRecentUsers(3600000);
      const self = buildSelf();
      if (self) {
        const without = list.filter(m => (m.email || m.name) !== (self.email || self.name));
        setMembers([self, ...without]);
      } else {
        setMembers(list);
      }
    } catch {}
  }, [buildSelf]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const self = buildSelf();
    if (self) setMembers(prev => {
      const without = prev.filter(m => (m.email || m.name) !== (self.email || self.name));
      return [self, ...without];
    });
    updatePresence().catch(() => {});
    load();
    const t = setInterval(() => { updatePresence().catch(() => {}); load(); }, 60000);
    return () => clearInterval(t);
  }, [isAuthenticated, load, buildSelf]);

  // Poll DM unread count
  useEffect(() => {
    if (!isAuthenticated) return;
    const poll = async () => { const r = await dmGetUnread(); setDmUnread(r.count); };
    poll();
    const t = setInterval(poll, 30000);
    window.addEventListener('dm-read', poll);
    return () => { clearInterval(t); window.removeEventListener('dm-read', poll); };
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated || !member) return null;

  const nowMs  = Date.now();
  const active  = members.filter(m => m.lastSeen && (nowMs - new Date(m.lastSeen).getTime()) < 5 * 60 * 1000);
  const offline = members.filter(m => !m.lastSeen || (nowMs - new Date(m.lastSeen).getTime()) >= 5 * 60 * 1000);
  const display = active.slice(0, 3);
  const onlineCount = Math.max(active.length, 1);
  const overflow = onlineCount > 3 ? onlineCount - 3 : 0;

  const openDM = (m: ChannelMember) => {
    setOpen(false);
    dispatchOpenDM({ email: m.email||'', name: m.name||'', belt: m.belt||'white', totalPoints: m.totalPoints||0, profilePic: m.profilePic });
  };

  const handleToggle = () => {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  };

  const goToChat = () => { setOpen(false); window.location.hash = '#/chat'; };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <style>{`@keyframes oac-pulse{0%{transform:scale(1);opacity:.7}50%{transform:scale(1.8);opacity:0}100%{transform:scale(1);opacity:0}}`}</style>

      {/* Stacked avatars button */}
      <button
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: '2px 0',
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Stacked PFPs */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {display.map((m, i) => (
            <div key={m.email || m.name} style={{
              width: 26, height: 26, borderRadius: 8,
              border: '2px solid #0f0e0d',
              marginLeft: i === 0 ? 0 : -7,
              background: avatarGrad((m.belt || 'white')),
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff',
              position: 'relative', zIndex: display.length - i,
              flexShrink: 0,
            }}>
              {m.profilePic
                ? <img src={m.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (m.name || '?').charAt(0).toUpperCase()
              }
            </div>
          ))}
          {/* Overflow badge */}
          {overflow > 0 && (
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              border: '2px solid #0f0e0d', marginLeft: -7,
              background: 'rgba(16,185,129,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#10b981',
              flexShrink: 0,
            }}>+{overflow}</div>
          )}
        </div>

        {/* Green dot + count + DM unread badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
          <div style={{ position: 'relative', width: 7, height: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: 'rgba(16,185,129,.3)', animation: 'oac-pulse 2s infinite' }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{onlineCount}</span>
          {/* DM unread badge */}
          {dmUnread > 0 && (
            <div style={{
              position: 'absolute', top: -8, right: -10,
              minWidth: 16, height: 16, borderRadius: 8,
              background: '#ef4444', border: '2px solid #0f0e0d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 900, color: '#fff', padding: '0 3px',
            }}>{dmUnread}</div>
          )}
        </div>
      </button>

      {/* Dropdown — portaled to body */}
      {createPortal(
        <div style={{
          position: 'fixed',
          top: dropPos?.top ?? 70,
          right: dropPos?.right ?? 12,
          width: 272, zIndex: 99999,
          background: '#161412', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 20, padding: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,.9)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(.97)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'all .3s cubic-bezier(0.175,0.885,0.32,1.275)',
          maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        }}>
          {active.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '.15em', textTransform: 'uppercase', padding: '4px 8px 6px' }}>● Active Now</div>
              {active.map(m => <MemberRow key={m.email||m.name} m={m}
                onClick={() => openDM(m)}
                onProfile={() => openMemberProfile(m)} />)}
            </>
          )}
          {offline.length > 0 && (
            <>
              {active.length > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '6px 0' }} />}
              <RecentSection members={offline} onOpen={(m) => openDM(m)} onProfile={(m) => openMemberProfile(m)} label="Recently Online" />
            </>
          )}
          {active.length === 0 && offline.length === 0 && (
            <div style={{ fontSize: 12, color: '#57534e', padding: '8px 10px', textAlign: 'center' }}>Just you for now</div>
          )}
          <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '8px 0 4px' }} />
          <button onClick={goToChat} style={{
            padding: '8px 10px', borderRadius: 10, width: '100%',
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)',
            fontSize: 12, fontWeight: 700, color: '#a8a29e', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Open Chat
          </button>
        </div>
      , document.body)}
    </div>
  );
}

