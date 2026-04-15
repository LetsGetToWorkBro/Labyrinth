import React from 'react';

interface BadgeIconProps {
  size?: number;
  unlocked?: boolean;
}

// ─── Helper: category frame shapes ──────────────────────────────────────────

function HexFrame({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <polygon points="24,3 43,13.5 43,34.5 24,45 5,34.5 5,13.5" fill={bg} stroke={gold} strokeWidth="1.5" />
      {children}
    </>
  );
}

function FlameShield({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <path d="M24 3C24 3 38 10 40 22C42 34 24 45 24 45C24 45 6 34 8 22C10 10 24 3 24 3Z"
        fill={bg} stroke={gold} strokeWidth="1.5" strokeLinejoin="round" />
      {children}
    </>
  );
}

function LaurelCircle({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <circle cx="24" cy="24" r="20" fill={bg} stroke={gold} strokeWidth="1.5" />
      {/* Left laurel */}
      <path d="M8 36C10 30 10 24 8 18" fill="none" stroke={gold} strokeWidth="1" opacity="0.6" />
      <path d="M8 18C10 19 11 22 10 24" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      <path d="M8 22C10 23 11 26 10 28" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      <path d="M8 27C10 28 11 31 10 33" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      {/* Right laurel */}
      <path d="M40 36C38 30 38 24 40 18" fill="none" stroke={gold} strokeWidth="1" opacity="0.6" />
      <path d="M40 18C38 19 37 22 38 24" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      <path d="M40 22C38 23 37 26 38 28" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      <path d="M40 27C38 28 37 31 38 33" fill="none" stroke={gold} strokeWidth="0.8" opacity="0.5" />
      {children}
    </>
  );
}

function BeltFrame({ beltColor, bg, gold, children }: { beltColor: string; bg: string; gold: string; children: React.ReactNode }) {
  return (
    <>
      <rect x="3" y="14" width="42" height="20" rx="4" fill={bg} stroke={gold} strokeWidth="1" />
      <rect x="6" y="17" width="36" height="14" rx="2" fill={beltColor} opacity="0.85" />
      {/* Belt knot center */}
      <rect x="20" y="14" width="8" height="20" rx="2" fill={bg} stroke={gold} strokeWidth="1" />
      {children}
    </>
  );
}

function DiamondFrame({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <polygon points="24,3 44,24 24,45 4,24" fill={bg} stroke={gold} strokeWidth="1.5" />
      {children}
    </>
  );
}

function AppFrame({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <rect x="5" y="5" width="38" height="38" rx="10" fill={bg} stroke={gold} strokeWidth="1.5" />
      {children}
    </>
  );
}

function StarburstFrame({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  const points: string[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const r = i % 2 === 0 ? 21 : 15;
    points.push(`${24 + r * Math.cos(angle)},${24 + r * Math.sin(angle)}`);
  }
  return (
    <>
      <polygon points={points.join(' ')} fill={bg} stroke={gold} strokeWidth="1.5" strokeLinejoin="round" />
      {children}
    </>
  );
}

// ─── SVG wrapper ────────────────────────────────────────────────────────────

function BadgeSvg({ size, unlocked, children }: { size: number; unlocked: boolean; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={unlocked ? { filter: 'drop-shadow(0 0 8px rgba(200,162,76,0.25))' } : undefined}
    >
      {children}
    </svg>
  );
}

// ─── Color helpers ──────────────────────────────────────────────────────────

function colors(unlocked: boolean) {
  return {
    gold: unlocked ? '#C8A24C' : '#333',
    bg: unlocked ? '#0D0D0D' : '#111',
    dim: unlocked ? '#1A1A1A' : '#161616',
    accent: unlocked ? 0.9 : 0.4,
    sub: unlocked ? 0.7 : 0.3,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDANCE — hexagon frame (10 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_first_class({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Footprint — two ovals + toes */}
        <ellipse cx="19" cy="25" rx="4" ry="5.5" fill={c.gold} opacity={c.accent} />
        <ellipse cx="29" cy="27" rx="4" ry="5.5" fill={c.gold} opacity={c.accent} />
        {[16, 18, 20, 22].map((x, i) => (
          <circle key={i} cx={x} cy="19" r="1.3" fill={c.gold} opacity={c.sub} />
        ))}
        {[26, 28, 30, 32].map((x, i) => (
          <circle key={i} cx={x} cy="21" r="1.3" fill={c.gold} opacity={c.sub} />
        ))}
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_three_in_week({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Three checkmarks stacked */}
        {[18, 24, 30].map((y, i) => (
          <polyline key={i} points={`16,${y} 20,${y + 3} 30,${y - 3}`}
            fill="none" stroke={c.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            opacity={c.accent} />
        ))}
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_ten_classes({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        <text x="24" y="29" textAnchor="middle" fontSize="14" fontWeight="800"
          fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>10</text>
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_thirty_classes({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Calendar with streak lines */}
        <rect x="14" y="15" width="20" height="18" rx="2" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        <line x1="14" y1="20" x2="34" y2="20" stroke={c.gold} strokeWidth="1" opacity={c.sub} />
        <line x1="19" y1="13" x2="19" y2="17" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.accent} />
        <line x1="29" y1="13" x2="29" y2="17" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.accent} />
        {/* Streak lines inside calendar */}
        {[23, 26, 29].map((y, i) => (
          <line key={i} x1="17" y1={y} x2="31" y2={y} stroke={c.gold} strokeWidth="1" opacity={c.sub} />
        ))}
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_hundred_classes({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* "100" with medal ribbon below */}
        <text x="24" y="25" textAnchor="middle" fontSize="12" fontWeight="800"
          fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>100</text>
        {/* Ribbon */}
        <line x1="18" y1="30" x2="22" y2="36" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="30" y1="30" x2="26" y2="36" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_fivehundred_classes({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Temple/pillar (Labyrinth reference) */}
        {/* Pediment */}
        <polygon points="24,13 35,20 13,20" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        {/* Pillars */}
        <rect x="16" y="20" width="3" height="14" fill={c.gold} opacity={c.accent} rx="0.5" />
        <rect x="22.5" y="20" width="3" height="14" fill={c.gold} opacity={c.accent} rx="0.5" />
        <rect x="29" y="20" width="3" height="14" fill={c.gold} opacity={c.accent} rx="0.5" />
        {/* Base */}
        <rect x="13" y="34" width="22" height="2" rx="1" fill={c.gold} opacity={c.sub} />
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_early_bird({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Sun rising over horizon */}
        <line x1="12" y1="28" x2="36" y2="28" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <circle cx="24" cy="28" r="7" fill={c.gold} opacity={c.accent} />
        {/* Rays */}
        {[-60, -40, -20, 0, 20, 40, 60].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          return (
            <line key={i}
              x1={24 + 9 * Math.cos(rad)} y1={28 - 9 * Math.sin(rad)}
              x2={24 + 12 * Math.cos(rad)} y2={28 - 12 * Math.sin(rad)}
              stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
          );
        })}
        {/* Cover bottom half */}
        <rect x="5" y="28" width="38" height="17" fill={c.bg} />
        <line x1="12" y1="28" x2="36" y2="28" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_night_owl({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Crescent moon */}
        <circle cx="22" cy="22" r="9" fill={c.gold} opacity={c.accent} />
        <circle cx="27" cy="19" r="7" fill={c.bg} />
        {/* Star */}
        <polygon points="34,17 35.5,21 39,21 36,23.5 37.5,27 34,25 30.5,27 32,23.5 29,21 32.5,21"
          fill={c.gold} opacity={c.sub} />
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_perfect_week({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* 5 filled dots in a row (M-F) */}
        {[14, 19, 24, 29, 34].map((x, i) => (
          <circle key={i} cx={x} cy="24" r="3" fill={c.gold} opacity={c.accent} />
        ))}
        {/* Line connecting them */}
        <line x1="14" y1="24" x2="34" y2="24" stroke={c.gold} strokeWidth="1" opacity={c.sub} />
      </HexFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_sunrise_session({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <HexFrame gold={c.gold} bg={c.bg}>
        {/* Sun at horizon */}
        <circle cx="24" cy="30" r="6" fill={c.gold} opacity={c.accent} />
        <rect x="5" y="30" width="38" height="15" fill={c.bg} />
        <line x1="10" y1="30" x2="38" y2="30" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        {/* Rays upward */}
        <line x1="24" y1="15" x2="24" y2="21" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="16" y1="18" x2="19" y2="23" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="32" y1="18" x2="29" y2="23" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
      </HexFrame>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAK — flame/shield frame (4 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_streak_4({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <FlameShield gold={c.gold} bg={c.bg}>
        {/* Small flame */}
        <path d="M24 15C24 15 30 22 28 28C26.5 32 24 33 24 33C24 33 21.5 32 20 28C18 22 24 15 24 15Z"
          fill={c.gold} opacity={c.accent} />
        <path d="M24 22C24 22 27 26 26 29C25.5 31 24 31.5 24 31.5C24 31.5 22.5 31 22 29C21 26 24 22 24 22Z"
          fill={c.bg} opacity="0.7" />
      </FlameShield>
    </BadgeSvg>
  );
}

export function AchievementIcon_streak_8({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <FlameShield gold={c.gold} bg={c.bg}>
        {/* Lightning bolt */}
        <polygon points="26,12 19,26 23,26 22,36 29,22 25,22"
          fill={c.gold} opacity={c.accent} />
      </FlameShield>
    </BadgeSvg>
  );
}

export function AchievementIcon_streak_12({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <FlameShield gold={c.gold} bg={c.bg}>
        {/* Crown on flame */}
        <path d="M24 20C24 20 29 26 27 31C25.5 34 24 35 24 35C24 35 22.5 34 21 31C19 26 24 20 24 20Z"
          fill={c.gold} opacity={c.accent * 0.7} />
        {/* Crown */}
        <polygon points="16,17 19,13 22,17 24,11 26,17 29,13 32,17"
          fill="none" stroke={c.gold} strokeWidth="1.5" strokeLinejoin="round" opacity={c.accent} />
        <line x1="16" y1="17" x2="32" y2="17" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
      </FlameShield>
    </BadgeSvg>
  );
}

export function AchievementIcon_streak_52({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <FlameShield gold={c.gold} bg={c.bg}>
        {/* Calendar ring — circle with tick marks */}
        <circle cx="24" cy="24" r="10" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          return (
            <line key={i}
              x1={24 + 8 * Math.cos(rad)} y1={24 + 8 * Math.sin(rad)}
              x2={24 + 10 * Math.cos(rad)} y2={24 + 10 * Math.sin(rad)}
              stroke={c.gold} strokeWidth="1" strokeLinecap="round" opacity={c.sub} />
          );
        })}
        <text x="24" y="27" textAnchor="middle" fontSize="8" fontWeight="700"
          fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>52</text>
      </FlameShield>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPETITION — laurel wreath circle (5 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_first_comp({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <LaurelCircle gold={c.gold} bg={c.bg}>
        {/* Target/bullseye */}
        <circle cx="24" cy="24" r="10" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        <circle cx="24" cy="24" r="6" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.sub} />
        <circle cx="24" cy="24" r="2.5" fill={c.gold} opacity={c.accent} />
      </LaurelCircle>
    </BadgeSvg>
  );
}

export function AchievementIcon_any_medal({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <LaurelCircle gold={c.gold} bg={c.bg}>
        {/* Podium bars 3-2-1 */}
        <rect x="14" y="26" width="6" height="8" rx="1" fill={c.gold} opacity={c.sub} />
        <rect x="21" y="18" width="6" height="16" rx="1" fill={c.gold} opacity={c.accent} />
        <rect x="28" y="23" width="6" height="11" rx="1" fill={c.gold} opacity={c.sub * 1.1} />
      </LaurelCircle>
    </BadgeSvg>
  );
}

export function AchievementIcon_silver_medal({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const silver = unlocked ? '#9CA3AF' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <LaurelCircle gold={c.gold} bg={c.bg}>
        {/* "2" on podium */}
        <rect x="17" y="26" width="14" height="8" rx="1.5" fill={c.gold} opacity={c.sub} />
        <text x="24" y="24" textAnchor="middle" fontSize="14" fontWeight="800"
          fill={silver} fontFamily="system-ui, sans-serif" opacity={c.accent}>2</text>
      </LaurelCircle>
    </BadgeSvg>
  );
}

export function AchievementIcon_gold_medal({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <LaurelCircle gold={c.gold} bg={c.bg}>
        {/* "1" on podium with rays */}
        <rect x="17" y="28" width="14" height="6" rx="1.5" fill={c.gold} opacity={c.sub} />
        <text x="24" y="26" textAnchor="middle" fontSize="14" fontWeight="800"
          fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>1</text>
        {/* Rays */}
        {[-45, 0, 45].map((deg, i) => {
          const rad = (deg - 90) * Math.PI / 180;
          return (
            <line key={i}
              x1={24 + 7 * Math.cos(rad)} y1={22 + 7 * Math.sin(rad)}
              x2={24 + 10 * Math.cos(rad)} y2={22 + 10 * Math.sin(rad)}
              stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
          );
        })}
      </LaurelCircle>
    </BadgeSvg>
  );
}

export function AchievementIcon_double_gold({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <LaurelCircle gold={c.gold} bg={c.bg}>
        {/* Two overlapping medal circles */}
        <circle cx="20" cy="23" r="6" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        <circle cx="28" cy="23" r="6" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        {/* Ribbons */}
        <line x1="18" y1="29" x2="16" y2="34" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="22" y1="29" x2="20" y2="34" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="26" y1="29" x2="28" y2="34" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="30" y1="29" x2="32" y2="34" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
      </LaurelCircle>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BELT — horizontal belt shape (9 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_first_stripe({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#F0F0F0' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        {/* One gold stripe on tip */}
        <rect x="35" y="18" width="2.5" height="12" fill={c.gold} opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_blue_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#3B6FD8' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_purple_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#8B4FBF' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_brown_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#8B5E3C' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_black_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#555555' : '#333';
  const redBar = unlocked ? '#CC2222' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        {/* Red bar on black belt */}
        <rect x="6" y="22" width="36" height="3" fill={redBar} opacity={c.accent} />
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_grey_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#888888' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_yellow_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#D4A843' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_orange_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#D4783C' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_green_belt({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const beltCol = unlocked ? '#3CAF50' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <BeltFrame beltColor={beltCol} bg={c.bg} gold={c.gold}>
        <rect x="21" y="18" width="6" height="12" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.5" opacity={c.accent} />
      </BeltFrame>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GAMES — diamond frame (9 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_game_first({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* Pawn chess piece */}
        <circle cx="24" cy="18" r="4" fill={c.gold} opacity={c.accent} />
        <path d="M20 24C20 22 22 22 24 22C26 22 28 22 28 24L29 32H19L20 24Z"
          fill={c.gold} opacity={c.accent} />
        <rect x="18" y="32" width="12" height="2.5" rx="1" fill={c.gold} opacity={c.sub} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_win_fast({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* Chess piece with lightning */}
        <circle cx="21" cy="18" r="3.5" fill={c.gold} opacity={c.accent} />
        <path d="M18 22C18 21 19.5 21 21 21C22.5 21 24 21 24 22L25 30H17L18 22Z"
          fill={c.gold} opacity={c.accent} />
        <rect x="16" y="30" width="10" height="2" rx="1" fill={c.gold} opacity={c.sub} />
        {/* Lightning bolt */}
        <polygon points="30,13 27,22 29.5,22 28,32 33,20 30.5,20"
          fill={c.gold} opacity={c.accent} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_win_5({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* 5 small pawns in V formation */}
        {[
          [24, 15],
          [19, 21], [29, 21],
          [16, 28], [32, 28],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y as number - 2} r="2" fill={c.gold} opacity={c.accent} />
            <rect x={x as number - 2} y={y} width="4" height="4" rx="1" fill={c.gold} opacity={c.sub} />
          </g>
        ))}
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_streak_3({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* 3 wins streak arrow */}
        <text x="24" y="22" textAnchor="middle" fontSize="10" fontWeight="800"
          fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>3</text>
        {/* Upward arrow */}
        <polyline points="18,30 24,26 30,30" fill="none" stroke={c.gold}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={c.accent} />
        <line x1="24" y1="26" x2="24" y2="34" stroke={c.gold} strokeWidth="2"
          strokeLinecap="round" opacity={c.sub} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_win_10({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* King chess piece — crown + body */}
        <polygon points="18,19 21,14 23,18 24,12 25,18 27,14 30,19"
          fill="none" stroke={c.gold} strokeWidth="1.5" strokeLinejoin="round" opacity={c.accent} />
        <rect x="18" y="19" width="12" height="3" rx="1" fill={c.gold} opacity={c.accent} />
        <path d="M19 22L18 31H30L29 22Z" fill={c.gold} opacity={c.sub} />
        <rect x="17" y="31" width="14" height="2.5" rx="1" fill={c.gold} opacity={c.accent} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_50({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* Controller silhouette */}
        <rect x="15" y="20" width="18" height="10" rx="5" fill={c.gold} opacity={c.accent} />
        {/* D-pad */}
        <rect x="18" y="23.5" width="5" height="1.5" rx="0.5" fill={c.bg} opacity="0.8" />
        <rect x="19.75" y="22" width="1.5" height="5" rx="0.5" fill={c.bg} opacity="0.8" />
        {/* Buttons */}
        <circle cx="30" cy="24" r="1.2" fill={c.bg} opacity="0.8" />
        <circle cx="28" cy="26" r="1.2" fill={c.bg} opacity="0.8" />
        {/* Grips */}
        <rect x="14" y="26" width="4" height="6" rx="2" fill={c.gold} opacity={c.sub} />
        <rect x="30" y="26" width="4" height="6" rx="2" fill={c.gold} opacity={c.sub} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_lb_week({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* Trophy on leaderboard bars */}
        {/* Leaderboard bars */}
        <rect x="15" y="30" width="5" height="6" rx="1" fill={c.gold} opacity={c.sub} />
        <rect x="21.5" y="26" width="5" height="10" rx="1" fill={c.gold} opacity={c.accent} />
        <rect x="28" y="28" width="5" height="8" rx="1" fill={c.gold} opacity={c.sub} />
        {/* Trophy on top */}
        <path d="M21 22C21 19 22 17 24 17C26 17 27 19 27 22H21Z" fill={c.gold} opacity={c.accent} />
        <rect x="23" y="22" width="2" height="3" fill={c.gold} opacity={c.sub} />
        <line x1="20" y1="19" x2="18" y2="18" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
        <line x1="28" y1="19" x2="30" y2="18" stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.sub} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_midnight({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* Moon */}
        <circle cx="19" cy="18" r="5" fill={c.gold} opacity={c.accent} />
        <circle cx="22" cy="16" r="4" fill={c.bg} />
        {/* Chess piece (small pawn) */}
        <circle cx="28" cy="26" r="3" fill={c.gold} opacity={c.accent} />
        <path d="M25 30C25 29 26.5 29 28 29C29.5 29 31 29 31 30L31.5 34H24.5L25 30Z"
          fill={c.gold} opacity={c.sub} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_game_and_class({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <DiamondFrame gold={c.gold} bg={c.bg}>
        {/* Split: chess piece left + belt right */}
        <line x1="24" y1="12" x2="24" y2="36" stroke={c.gold} strokeWidth="0.5" opacity={c.sub * 0.7} />
        {/* Left: pawn */}
        <circle cx="17" cy="19" r="3" fill={c.gold} opacity={c.accent} />
        <rect x="15" y="23" width="4" height="7" rx="1" fill={c.gold} opacity={c.sub} />
        <rect x="14" y="30" width="6" height="2" rx="0.5" fill={c.gold} opacity={c.accent} />
        {/* Right: belt knot */}
        <rect x="27" y="19" width="8" height="3" rx="1" fill={c.gold} opacity={c.accent} />
        <rect x="27" y="24" width="8" height="3" rx="1" fill={c.gold} opacity={c.accent} />
        <rect x="29" y="18" width="4" height="11" rx="1" fill={c.bg} stroke={c.gold} strokeWidth="0.8" opacity={c.accent} />
      </DiamondFrame>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APP — rounded square frame (4 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_app_day1({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <AppFrame gold={c.gold} bg={c.bg}>
        {/* Phone outline with "1" */}
        <rect x="16" y="10" width="16" height="28" rx="3" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        <line x1="16" y1="14" x2="32" y2="14" stroke={c.gold} strokeWidth="0.8" opacity={c.sub} />
        <line x1="16" y1="33" x2="32" y2="33" stroke={c.gold} strokeWidth="0.8" opacity={c.sub} />
        <text x="24" y="27" textAnchor="middle" fontSize="12" fontWeight="800"
          fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>1</text>
      </AppFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_app_week({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <AppFrame gold={c.gold} bg={c.bg}>
        {/* Phone outline with 7 day dots */}
        <rect x="16" y="10" width="16" height="28" rx="3" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        <line x1="16" y1="14" x2="32" y2="14" stroke={c.gold} strokeWidth="0.8" opacity={c.sub} />
        <line x1="16" y1="33" x2="32" y2="33" stroke={c.gold} strokeWidth="0.8" opacity={c.sub} />
        {/* 7 dots in two rows */}
        {[19, 22, 25, 28].map((x, i) => (
          <circle key={i} cx={x} cy="21" r="1.5" fill={c.gold} opacity={c.accent} />
        ))}
        {[20, 24, 28].map((x, i) => (
          <circle key={i} cx={x} cy="27" r="1.5" fill={c.gold} opacity={c.accent} />
        ))}
      </AppFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_first_message({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <AppFrame gold={c.gold} bg={c.bg}>
        {/* Speech bubble */}
        <path d="M12 16C12 13 14 11 17 11H31C34 11 36 13 36 16V26C36 29 34 31 31 31H20L15 36V31H17C14 31 12 29 12 26V16Z"
          fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        {/* Dots in speech bubble */}
        <circle cx="20" cy="21" r="1.5" fill={c.gold} opacity={c.sub} />
        <circle cx="24" cy="21" r="1.5" fill={c.gold} opacity={c.sub} />
        <circle cx="28" cy="21" r="1.5" fill={c.gold} opacity={c.sub} />
      </AppFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_profile_complete({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <AppFrame gold={c.gold} bg={c.bg}>
        {/* Camera circle / profile photo */}
        <circle cx="24" cy="22" r="10" fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        {/* Person silhouette inside */}
        <circle cx="24" cy="19" r="3.5" fill={c.gold} opacity={c.accent} />
        <path d="M16 32C16 27 19.5 24 24 24C28.5 24 32 27 32 32"
          fill={c.gold} opacity={c.sub} />
        {/* Camera icon */}
        <rect x="30" y="28" width="8" height="6" rx="1.5" fill={c.gold} opacity={c.accent} />
        <circle cx="34" cy="31" r="1.5" fill={c.bg} />
      </AppFrame>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SPECIAL — starburst frame (3 icons)
// ═══════════════════════════════════════════════════════════════════════════

export function AchievementIcon_birthday_warrior({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <StarburstFrame gold={c.gold} bg={c.bg}>
        {/* Cake with candle */}
        <rect x="16" y="24" width="16" height="10" rx="2" fill={c.gold} opacity={c.accent} />
        {/* Frosting */}
        <path d="M16 26C18 24 20 27 22 24C24 27 26 24 28 27C30 24 32 26 32 26V24H16V26Z"
          fill={c.gold} opacity={c.sub * 1.2} />
        {/* Candle */}
        <rect x="23" y="18" width="2" height="6" rx="0.5" fill={c.gold} opacity={c.sub} />
        {/* Flame */}
        <ellipse cx="24" cy="16.5" rx="1.5" ry="2.5" fill={c.gold} opacity={c.accent} />
      </StarburstFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_holiday_warrior({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <StarburstFrame gold={c.gold} bg={c.bg}>
        {/* Snowflake/star */}
        {[0, 60, 120].map((deg, i) => {
          const rad = deg * Math.PI / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          return (
            <g key={i}>
              <line
                x1={24 - 9 * cos} y1={24 - 9 * sin}
                x2={24 + 9 * cos} y2={24 + 9 * sin}
                stroke={c.gold} strokeWidth="1.5" strokeLinecap="round" opacity={c.accent} />
              {/* Branches on each arm */}
              <line
                x1={24 + 5 * cos} y1={24 + 5 * sin}
                x2={24 + 5 * cos + 3 * Math.cos(rad + 0.8)} y2={24 + 5 * sin + 3 * Math.sin(rad + 0.8)}
                stroke={c.gold} strokeWidth="1" strokeLinecap="round" opacity={c.sub} />
              <line
                x1={24 + 5 * cos} y1={24 + 5 * sin}
                x2={24 + 5 * cos + 3 * Math.cos(rad - 0.8)} y2={24 + 5 * sin + 3 * Math.sin(rad - 0.8)}
                stroke={c.gold} strokeWidth="1" strokeLinecap="round" opacity={c.sub} />
              <line
                x1={24 - 5 * cos} y1={24 - 5 * sin}
                x2={24 - 5 * cos - 3 * Math.cos(rad + 0.8)} y2={24 - 5 * sin - 3 * Math.sin(rad + 0.8)}
                stroke={c.gold} strokeWidth="1" strokeLinecap="round" opacity={c.sub} />
              <line
                x1={24 - 5 * cos} y1={24 - 5 * sin}
                x2={24 - 5 * cos - 3 * Math.cos(rad - 0.8)} y2={24 - 5 * sin - 3 * Math.sin(rad - 0.8)}
                stroke={c.gold} strokeWidth="1" strokeLinecap="round" opacity={c.sub} />
            </g>
          );
        })}
        <circle cx="24" cy="24" r="2" fill={c.gold} opacity={c.accent} />
      </StarburstFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_secret_1({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <StarburstFrame gold={c.gold} bg={c.bg}>
        {/* Lock icon */}
        <rect x="18" y="23" width="12" height="10" rx="2" fill={c.gold} opacity={c.accent} />
        <path d="M20 23V19C20 16.5 21.8 15 24 15C26.2 15 28 16.5 28 19V23"
          fill="none" stroke={c.gold} strokeWidth="1.5" opacity={c.accent} />
        {/* Keyhole */}
        <circle cx="24" cy="27" r="1.5" fill={c.bg} />
        <rect x="23.25" y="28" width="1.5" height="3" rx="0.5" fill={c.bg} />
      </StarburstFrame>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEVEL — crest/shield frame (4 icons)
// ═══════════════════════════════════════════════════════════════════════════

function CrestFrame({ gold, bg, children }: { gold: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <path d="M24 3L42 12V28C42 36 34 43 24 46C14 43 6 36 6 28V12L24 3Z"
        fill={bg} stroke={gold} strokeWidth="1.5" strokeLinejoin="round" />
      {children}
    </>
  );
}

export function AchievementIcon_level_5({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <CrestFrame gold={c.gold} bg={c.bg}>
        {/* Rising star */}
        <path d="M24 13l2.4 7.4H34l-6.2 4.5 2.4 7.4L24 28l-6.2 4.3 2.4-7.4L14 20.4h7.6z"
          fill={c.gold} opacity={c.accent} />
      </CrestFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_level_10({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const accent = unlocked ? '#FFD700' : '#444';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <CrestFrame gold={c.gold} bg={c.bg}>
        {/* Clock/dedication symbol */}
        <circle cx="24" cy="24" r="9" stroke={accent} strokeWidth="2" fill="none" opacity={c.accent} />
        <path d="M24 18v6l3 3" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity={c.accent} />
        {/* Small star at top */}
        <circle cx="24" cy="11" r="2" fill={c.gold} opacity={c.sub} />
      </CrestFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_level_20({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const accent = unlocked ? '#4FC3F7' : '#444';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <CrestFrame gold={accent} bg={c.bg}>
        {/* Star outline with inner glow */}
        <path d="M24 11L27.09 17.26L34 18.27L29 23.14L30.18 30.02L24 26.77L17.82 30.02L19 23.14L14 18.27L20.91 17.26L24 11Z"
          fill={accent} opacity="0.3" stroke={accent} strokeWidth="1.5" />
        {/* Inner dot */}
        <circle cx="24" cy="22" r="2.5" fill={accent} opacity={c.accent} />
      </CrestFrame>
    </BadgeSvg>
  );
}

export function AchievementIcon_level_30({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  const purple = unlocked ? '#C084FC' : '#444';
  const goldAccent = unlocked ? '#FFD700' : '#333';
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <CrestFrame gold={purple} bg={c.bg}>
        {/* Multi-pointed star with gem */}
        <path d="M24 10l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"
          fill={purple} stroke={goldAccent} strokeWidth="1" opacity={c.accent} />
        <circle cx="24" cy="23" r="3" fill={goldAccent} opacity="0.8" />
      </CrestFrame>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Default fallback
// ═══════════════════════════════════════════════════════════════════════════

export function DefaultBadgeIcon({ size = 48, unlocked = true }: BadgeIconProps) {
  const c = colors(unlocked);
  return (
    <BadgeSvg size={size} unlocked={unlocked}>
      <circle cx="24" cy="24" r="20" fill={c.bg} stroke={c.gold} strokeWidth="1.5" />
      <text x="24" y="28" textAnchor="middle" fontSize="16" fontWeight="700"
        fill={c.gold} fontFamily="system-ui, sans-serif" opacity={c.accent}>?</text>
    </BadgeSvg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Export map — all 43 achievements
// ═══════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENT_ICONS: Record<string, React.FC<BadgeIconProps>> = {
  // Attendance (10)
  first_class: AchievementIcon_first_class,
  three_in_week: AchievementIcon_three_in_week,
  ten_classes: AchievementIcon_ten_classes,
  thirty_classes: AchievementIcon_thirty_classes,
  hundred_classes: AchievementIcon_hundred_classes,
  fivehundred_classes: AchievementIcon_fivehundred_classes,
  early_bird: AchievementIcon_early_bird,
  night_owl: AchievementIcon_night_owl,
  perfect_week: AchievementIcon_perfect_week,
  sunrise_session: AchievementIcon_sunrise_session,
  // Streak (4)
  streak_4: AchievementIcon_streak_4,
  streak_8: AchievementIcon_streak_8,
  streak_12: AchievementIcon_streak_12,
  streak_52: AchievementIcon_streak_52,
  // Competition (5)
  first_comp: AchievementIcon_first_comp,
  any_medal: AchievementIcon_any_medal,
  silver_medal: AchievementIcon_silver_medal,
  gold_medal: AchievementIcon_gold_medal,
  double_gold: AchievementIcon_double_gold,
  // Belt (9)
  first_stripe: AchievementIcon_first_stripe,
  blue_belt: AchievementIcon_blue_belt,
  purple_belt: AchievementIcon_purple_belt,
  brown_belt: AchievementIcon_brown_belt,
  black_belt: AchievementIcon_black_belt,
  grey_belt: AchievementIcon_grey_belt,
  yellow_belt: AchievementIcon_yellow_belt,
  orange_belt: AchievementIcon_orange_belt,
  green_belt: AchievementIcon_green_belt,
  // Games (9)
  game_first: AchievementIcon_game_first,
  game_win_fast: AchievementIcon_game_win_fast,
  game_win_5: AchievementIcon_game_win_5,
  game_streak_3: AchievementIcon_game_streak_3,
  game_win_10: AchievementIcon_game_win_10,
  game_50: AchievementIcon_game_50,
  game_lb_week: AchievementIcon_game_lb_week,
  game_midnight: AchievementIcon_game_midnight,
  game_and_class: AchievementIcon_game_and_class,
  // App (4)
  app_day1: AchievementIcon_app_day1,
  app_week: AchievementIcon_app_week,
  first_message: AchievementIcon_first_message,
  profile_complete: AchievementIcon_profile_complete,
  // Special (3)
  birthday_warrior: AchievementIcon_birthday_warrior,
  holiday_warrior: AchievementIcon_holiday_warrior,
  secret_1: AchievementIcon_secret_1,
  // Level (4)
  level_5: AchievementIcon_level_5,
  level_10: AchievementIcon_level_10,
  level_20: AchievementIcon_level_20,
  level_30: AchievementIcon_level_30,
};

export function AchievementBadge({ achievementKey, size = 48, unlocked = true }: { achievementKey: string; size?: number; unlocked?: boolean }) {
  const Icon = ACHIEVEMENT_ICONS[achievementKey];
  if (!Icon) return <DefaultBadgeIcon size={size} unlocked={unlocked} />;
  return <Icon size={size} unlocked={unlocked} />;
}
