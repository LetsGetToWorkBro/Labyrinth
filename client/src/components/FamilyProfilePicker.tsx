/**
 * FamilyProfilePicker
 *
 * Shown immediately after login when member.familyMembers.length > 0.
 * Lets the user pick which sub-member profile to enter the app as.
 * Each sub-member gets its own namespaced localStorage so stats, achievements,
 * PFPs, streaks etc. are fully independent.
 */

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { FamilyMember } from '@/lib/api';
import { getActualLevel } from '@/lib/xp';
import { ParagonRing } from '@/components/ParagonRing';

// ─── Belt helpers ─────────────────────────────────────────────────
const BELT_HEX: Record<string, string> = {
  black:  '#111111',
  brown:  '#78350f',
  purple: '#7e22ce',
  blue:   '#1d4ed8',
  white:  '#d1d5db',
  grey:   '#6b7280',
  gray:   '#6b7280',
  yellow: '#ca8a04',
  orange: '#ea580c',
  green:  '#15803d',
};

const BELT_RGB: Record<string, string> = {
  black:  '17,17,17',
  brown:  '120,53,15',
  purple: '126,34,206',
  blue:   '29,78,216',
  white:  '209,213,219',
  grey:   '107,114,128',
  gray:   '107,114,128',
  yellow: '202,138,4',
  orange: '234,88,12',
  green:  '21,128,61',
};

function beltHex(belt: string) { return BELT_HEX[(belt || 'white').toLowerCase()] || '#d1d5db'; }
function beltRGB(belt: string) { return BELT_RGB[(belt || 'white').toLowerCase()] || '209,213,219'; }
function rankBar(belt: string) {
  return (belt || '').toLowerCase() === 'black' ? '#cc0000' : '#111111';
}

// ─── Per-member localStorage namespacing ─────────────────────────
const NAMESPACED_KEYS = [
  'lbjj_game_stats_v2',
  'lbjj_achievements',
  'lbjj_achievement_xp_claimed',
  'lbjj_achievement_dates',
  'lbjj_profile_picture',
  'lbjj_checkin_history',
  'lbjj_weekly_training',
  'lbjj_first_message_sent',
  'lbjj_passkey_registered',
] as const;

// Season count keys need special handling (dynamic month suffix)
function getAllNamespacedKeys() {
  const keys: string[] = [...NAMESPACED_KEYS];
  // Also grab any lbjj_season_count_* keys
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('lbjj_season_count_')) keys.push(k);
  }
  return keys;
}

function nsKey(baseKey: string, row: number) {
  return `${baseKey}__fm${row}`;
}

/** Save current active profile's data into its namespace */
export function saveActiveProfileToNamespace(row: number) {
  if (!row) return;
  getAllNamespacedKeys().forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) {
      localStorage.setItem(nsKey(key, row), val);
    }
  });
}

/** Load a member's namespaced data into the active slots */
export function loadNamespaceForProfile(row: number) {
  if (!row) return;
  getAllNamespacedKeys().forEach(key => {
    const ns = localStorage.getItem(nsKey(key, row));
    if (ns !== null) {
      localStorage.setItem(key, ns);
    } else {
      // New member — clear the slot so we start fresh
      localStorage.removeItem(key);
    }
  });
  // Store which row is currently active so we know where to save on switch
  localStorage.setItem('lbjj_active_family_row', String(row));
}

// ─── Belt strip component ─────────────────────────────────────────
function BeltStrip({ belt, stripes = 0 }: { belt: string; stripes?: number }) {
  const hex = beltHex(belt);
  const bar = rankBar(belt);
  return (
    <div style={{
      width: 110, height: 14, borderRadius: 2, position: 'relative',
      overflow: 'hidden', background: hex,
      boxShadow: '0 4px 8px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.4)',
    }}>
      {/* Weave texture */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(0,0,0,0.12) 2px,rgba(0,0,0,0.12) 4px)',
        zIndex: 1,
      }} />
      {/* Rank bar (black panel) */}
      <div style={{
        position: 'absolute', right: 15, top: 0, bottom: 0, width: 25,
        background: bar, zIndex: 2,
        borderLeft: '2px solid rgba(0,0,0,0.5)', borderRight: '2px solid rgba(0,0,0,0.5)',
      }} />
      {/* Stripes */}
      {stripes > 0 && (
        <div style={{
          position: 'absolute', right: 15, top: 0, bottom: 0, width: 25,
          display: 'flex', justifyContent: 'space-evenly', zIndex: 3, padding: '0 2px',
        }}>
          {Array.from({ length: Math.min(stripes, 4) }).map((_, i) => (
            <div key={i} style={{ width: 3, height: '100%', background: '#fff', boxShadow: '0 0 1px rgba(0,0,0,0.5)' }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single profile card ──────────────────────────────────────────
function ProfileCard({
  fm, index, onSelect, isLoading,
}: {
  fm: FamilyMember & { totalPoints?: number; stripes?: number; profilePic?: string };
  index: number;
  onSelect: () => void;
  isLoading: boolean;
}) {
  const level = getActualLevel(fm.totalPoints || 0);
  const [hovered, setHovered] = useState(false);
  const hex = beltHex(fm.belt);
  const badgeColor = fm.belt?.toLowerCase() === 'black' ? '#cc0000' : hex;

  return (
    <div
      onClick={!isLoading ? onSelect : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: isLoading ? 'wait' : 'pointer',
        opacity: isLoading ? 0.6 : 1,
        transform: hovered ? 'translateY(-14px) scale(1.05)' : 'translateY(0) scale(1)',
        transition: 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275), opacity 0.3s',
        animation: `fpp-slide-up 0.8s cubic-bezier(0.16,1,0.3,1) ${index * 0.12}s both`,
        userSelect: 'none',
      }}
    >
      {/* Avatar with ParagonRing + level badge */}
      {/* ParagonRing owns its CANVAS size — don't constrain it, just let it flex */}
      <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
        <ParagonRing level={level} size={110} showOrbit={true}>
          {fm.profilePic ? (
            <img
              src={fm.profilePic}
              alt={fm.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: `linear-gradient(135deg, ${hex}44, ${hex}22)`,
              border: `3px solid ${hex}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 900, color: hex === '#d1d5db' ? '#888' : hex,
              textShadow: `0 2px 8px rgba(0,0,0,0.8)`,
            }}>
              {(fm.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </ParagonRing>

        {/* Level badge — sits below the ring canvas, centered */}
        <div style={{
          marginTop: -8,
          background: 'linear-gradient(180deg,#1a1a1a,#050505)',
          border: `2px solid ${badgeColor}`,
          borderRadius: 8, padding: '3px 14px', zIndex: 50,
          display: 'flex', alignItems: 'baseline', gap: 3,
          boxShadow: `0 6px 14px rgba(0,0,0,0.9), 0 0 12px ${badgeColor}66`,
          minWidth: 40, justifyContent: 'center',
        }}>
          <span style={{ fontSize: 9, color: badgeColor, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, filter: 'brightness(1.4)' }}>LV</span>
          <span style={{ fontSize: 20, color: '#fff', lineHeight: 1, fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{level}</span>
        </div>
      </div>

      {/* Name */}
      <h2 style={{
        fontSize: 22, fontWeight: 800, margin: '0 0 10px',
        letterSpacing: '0.04em', color: hovered ? badgeColor : '#fff',
        textShadow: '0 4px 12px rgba(0,0,0,1)',
        transition: 'color 0.3s',
      }}>
        {fm.name}
      </h2>

      {/* Belt strip */}
      <BeltStrip belt={fm.belt} stripes={(fm as any).stripes || 0} />

      {/* Role chip */}
      <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: '#111', border: '1px solid #222', borderRadius: 4,
          padding: '3px 8px', color: '#555',
        }}>
          {fm.type === 'Kid' || fm.type === 'kid' ? 'Kids' : 'Adult'}
        </span>
        {fm.membership && (
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
            background: '#111', border: '1px solid #222', borderRadius: 4,
            padding: '3px 8px', color: '#444',
          }}>
            {fm.membership}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main picker ──────────────────────────────────────────────────
export default function FamilyProfilePicker({ onDone }: { onDone: () => void }) {
  const { member, familyMembers, switchProfile } = useAuth();
  const [loadingRow, setLoadingRow] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionColor, setTransitionColor] = useState('#111');

  const handleSelect = async (fm: FamilyMember) => {
    if (loadingRow !== null) return;
    const hex = beltHex(fm.belt);
    const badgeColor = fm.belt?.toLowerCase() === 'black' ? '#cc0000' : hex;
    setLoadingRow(fm.row);
    setTransitionColor(badgeColor);

    // Save current primary member's state to their namespace first
    const primaryRow = (member as any)?.row;
    if (primaryRow) saveActiveProfileToNamespace(primaryRow);

    // If selecting primary member themselves — just load their namespace and proceed
    if (fm.isPrimary) {
      loadNamespaceForProfile(fm.row);
      setTransitioning(true);
      setTimeout(() => { setTransitioning(false); onDone(); }, 800);
      return;
    }

    try {
      // Switch GAS session to sub-member
      await switchProfile(fm.row);
      // Load that member's personal progress namespace
      loadNamespaceForProfile(fm.row);
      setTransitioning(true);
      setTimeout(() => { setTransitioning(false); onDone(); }, 800);
    } catch {
      setLoadingRow(null);
    }
  };

  // Build combined list: primary member first, then sub-members
  // Primary = the logged-in account holder
  const primaryAsFm: FamilyMember = {
    name: member?.name || '',
    belt: (member as any)?.belt || 'white',
    type: (member as any)?.type || 'Adult',
    membership: (member as any)?.plan || (member as any)?.membership || '',
    row: (member as any)?.row || 0,
    isPrimary: true,
  };

  // Read XP from both GAS profile and local game stats — use highest so level is correct
  const localStats = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
  const primaryXP = Math.max(
    (member as any)?.totalPoints || 0,
    localStats.xp || 0,
    localStats.totalXP || 0,
  );

  const enrichedPrimary = {
    ...primaryAsFm,
    totalPoints: primaryXP,
    stripes: (member as any)?.stripes || (member as any)?.Stripes || 0,
    profilePic: (() => { try { return localStorage.getItem('lbjj_profile_picture') || undefined; } catch { return undefined; } })(),
  };

  // Sub-members: family members that are NOT the primary
  const subMembers = familyMembers.filter(f => !f.isPrimary);

  const allProfiles = [enrichedPrimary, ...subMembers.map(f => ({ ...f, totalPoints: (f as any).totalPoints || 0, stripes: (f as any).stripes || 0, profilePic: undefined }))];

  return (
    <>
      <style>{`
        @keyframes fpp-slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fpp-fade-down {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fpp-transition-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Transition color overlay */}
      <div style={{
        position: 'fixed', inset: 0, background: transitionColor,
        zIndex: 9999, mixBlendMode: 'overlay',
        opacity: transitioning ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
      }} />
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        zIndex: 10000,
        opacity: transitioning ? 1 : 0, pointerEvents: 'none',
        transition: 'opacity 0.8s ease 0.2s',
      }} />

      {/* Main screen */}
      <div style={{
        position: 'fixed', inset: 0, background: '#030303',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '150vw', height: '150vh',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center', marginBottom: 56, zIndex: 10,
          animation: 'fpp-fade-down 1s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <h1 style={{
            fontFamily: "system-ui,'Cabinet Grotesk',sans-serif",
            fontSize: 38, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.05em', margin: 0, lineHeight: 1,
            background: 'linear-gradient(180deg,#fff 0%,#888 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
          }}>
            Select Profile
          </h1>
          <div style={{
            fontSize: 13, color: '#555', textTransform: 'uppercase',
            letterSpacing: '0.22em', marginTop: 8, fontWeight: 700,
          }}>
            Labyrinth BJJ · Family Account
          </div>
        </div>

        {/* Profile cards */}
        <div style={{
          display: 'flex', gap: 36, justifyContent: 'center',
          flexWrap: 'wrap', maxWidth: 840,
          padding: '0 24px', zIndex: 10,
        }}>
          {allProfiles.map((fm, i) => (
            <ProfileCard
              key={fm.row || fm.name}
              fm={fm}
              index={i}
              onSelect={() => handleSelect(fm)}
              isLoading={loadingRow !== null}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          position: 'absolute', bottom: 'max(32px,env(safe-area-inset-bottom,32px))',
          textAlign: 'center', zIndex: 10,
          fontSize: 11, color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase',
          fontWeight: 700,
          animation: 'fpp-slide-up 1s cubic-bezier(0.16,1,0.3,1) 0.6s both',
        }}>
          Tap a profile to enter the app
        </div>
      </div>
    </>
  );
}
