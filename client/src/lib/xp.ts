// XP Level System — Diablo 3 inspired progression
// Level curve: each level requires ~20% more XP than the last

export const XP_LEVELS = [
  { level: 1,  xpRequired: 0,    title: 'White Belt Rookie' },
  { level: 2,  xpRequired: 100,  title: 'Mat Newcomer' },
  { level: 3,  xpRequired: 250,  title: 'Consistent Driller' },
  { level: 4,  xpRequired: 450,  title: 'Class Regular' },
  { level: 5,  xpRequired: 700,  title: 'Rising Competitor' },
  { level: 6,  xpRequired: 1000, title: 'Dedicated Grappler' },
  { level: 7,  xpRequired: 1350, title: 'Technique Seeker' },
  { level: 8,  xpRequired: 1750, title: 'Iron Will' },
  { level: 9,  xpRequired: 2200, title: 'Battle Tested' },
  { level: 10, xpRequired: 2700, title: 'Seasoned Warrior' },
  { level: 15, xpRequired: 5000, title: 'Gym Pillar' },
  { level: 20, xpRequired: 8500, title: 'Labyrinth Veteran' },
  { level: 25, xpRequired: 13000, title: 'Elite Grappler' },
  { level: 30, xpRequired: 19000, title: 'Legend of the Mat' },
  { level: 40, xpRequired: 35000, title: 'Paragon' },
  { level: 50, xpRequired: 60000, title: 'Grandmaster Paragon' },
];

export function getLevelFromXP(xp: number): { level: number; title: string; xpForLevel: number; xpForNext: number; progress: number } {
  let currentLevel = XP_LEVELS[0];
  let nextLevel = XP_LEVELS[1];

  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      currentLevel = XP_LEVELS[i];
      nextLevel = XP_LEVELS[i + 1] || XP_LEVELS[i]; // max level
      break;
    }
  }

  // Fill in missing levels (between defined breakpoints)
  const xpForLevel = currentLevel.xpRequired;
  const xpForNext = nextLevel.xpRequired;
  const progress = xpForNext === xpForLevel ? 1 : (xp - xpForLevel) / (xpForNext - xpForLevel);

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xpForLevel,
    xpForNext,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

export function getActualLevel(xp: number): number {
  // Smooth level curve filling gaps between defined breakpoints
  // Use the defined breakpoints as anchors, interpolate between
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      if (i === XP_LEVELS.length - 1) return XP_LEVELS[i].level;
      const nextXP = XP_LEVELS[i + 1].xpRequired;
      const levelDiff = XP_LEVELS[i + 1].level - XP_LEVELS[i].level;
      const fraction = (xp - XP_LEVELS[i].xpRequired) / (nextXP - XP_LEVELS[i].xpRequired);
      return Math.floor(XP_LEVELS[i].level + fraction * levelDiff);
    }
  }
  return 1;
}

// Ring tier based on level
export type RingTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'paragon';

export function getRingTier(level: number): RingTier {
  if (level < 2)  return 'none';
  if (level < 5)  return 'bronze';
  if (level < 10) return 'silver';
  if (level < 15) return 'gold';
  if (level < 20) return 'platinum';
  if (level < 30) return 'diamond';
  return 'paragon';
}
