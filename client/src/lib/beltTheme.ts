/**
 * beltTheme.ts — Global Belt Theme System
 *
 * Reads the member's belt from localStorage/auth and applies
 * CSS custom properties to <html> for a living ambient atmosphere.
 *
 * Layers (z-index):
 *   0 = body::before / body::after (atmosphere)
 *   1 = grain overlay
 *   2+ = all page content
 */

export interface BeltTheme {
  color: string;
  rgb: string;
  name: string;
  adult: boolean;
}

export const BELT_THEMES: Record<string, BeltTheme> = {
  // ── Adult ──────────────────────────────────────────────────
  white:        { color:'#e5e7eb', rgb:'229,231,235', name:'Iron Forge',     adult: true  },
  blue:         { color:'#3b82f6', rgb:'59,130,246',  name:'Frozen Aura',    adult: true  },
  purple:       { color:'#a855f7', rgb:'168,85,247',  name:'Void Star',      adult: true  },
  brown:        { color:'#ea580c', rgb:'234,88,12',   name:'Blood Flame',    adult: true  },
  black:        { color:'#eab308', rgb:'234,179,8',   name:'Grandmaster',    adult: true  },

  // ── Kids Grey Series ───────────────────────────────────────
  grey_white:   { color:'#9ca3af', rgb:'156,163,175', name:'Grey Series I',  adult: false },
  grey:         { color:'#6b7280', rgb:'107,114,128', name:'Grey Series II', adult: false },
  gray:         { color:'#6b7280', rgb:'107,114,128', name:'Grey Series II', adult: false },
  grey_black:   { color:'#4b5563', rgb:'75,85,99',    name:'Grey Series III',adult: false },

  // ── Kids Yellow Series ─────────────────────────────────────
  yellow_white: { color:'#fde047', rgb:'253,224,71',  name:'Solar I',        adult: false },
  yellow:       { color:'#eab308', rgb:'234,179,8',   name:'Solar II',       adult: false },
  yellow_black: { color:'#ca8a04', rgb:'202,138,4',   name:'Solar III',      adult: false },

  // ── Kids Orange Series ─────────────────────────────────────
  orange_white: { color:'#fb923c', rgb:'251,146,60',  name:'Ember I',        adult: false },
  orange:       { color:'#f97316', rgb:'249,115,22',  name:'Ember II',       adult: false },
  orange_black: { color:'#ea580c', rgb:'234,88,12',   name:'Ember III',      adult: false },

  // ── Kids Green Series ──────────────────────────────────────
  green_white:  { color:'#4ade80', rgb:'74,222,128',  name:'Forest I',       adult: false },
  green:        { color:'#22c55e', rgb:'34,197,94',   name:'Forest II',      adult: false },
  green_black:  { color:'#15803d', rgb:'21,128,61',   name:'Forest III',     adult: false },
};

/**
 * Build the theme key from belt + bar fields stored on the member object.
 * Adult belts: just use belt name.
 * Kids belts: combine belt + bar (e.g. 'grey' + 'white' → 'grey_white').
 */
export function getBeltThemeKey(belt: string, bar?: string): string {
  const b = (belt || 'white').toLowerCase().replace(/\s+/g, '_');
  const isKids = ['grey','gray','yellow','orange','green'].includes(b.split('_')[0]);
  if (!isKids) return b;
  if (bar === 'white') return `${b}_white`;
  if (bar === 'black') return `${b}_black`;
  return b;
}

/** Apply theme to <html> element via CSS custom properties */
export function applyBeltTheme(belt: string, bar?: string): void {
  if (typeof document === 'undefined') return;
  const key = getBeltThemeKey(belt, bar);
  const theme = BELT_THEMES[key] || BELT_THEMES.white;
  const root = document.documentElement;
  root.style.setProperty('--th', theme.color);
  root.style.setProperty('--th-rgb', theme.rgb);
  root.style.setProperty('--th-glow', `rgba(${theme.rgb},0.35)`);
  root.setAttribute('data-belt', key);
  try { localStorage.setItem('lbjj_belt', key); } catch {}
}

/** Read from localStorage and apply — call immediately on boot (zero flash) */
export function initBeltTheme(): void {
  if (typeof document === 'undefined') return;
  const cached = localStorage.getItem('lbjj_belt') || 'white';
  applyBeltTheme(cached);
}

/** Get theme object for a belt key (used by components for color values) */
export function getBeltTheme(belt: string, bar?: string): BeltTheme {
  const key = getBeltThemeKey(belt, bar);
  return BELT_THEMES[key] || BELT_THEMES.white;
}
