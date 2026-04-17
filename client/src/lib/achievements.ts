import { getActualLevel } from '@/lib/xp';

export interface Achievement {
  key: string;
  label: string;
  desc: string;
  icon: string;       // emoji
  category: 'attendance' | 'streak' | 'competition' | 'belt' | 'app' | 'games' | 'special' | 'level';
  secret?: boolean;   // hidden until unlocked
  color: string;      // accent color for the card
}

export const ALL_ACHIEVEMENTS: Achievement[] = [

  // ── ATTENDANCE ──────────────────────────────────────────────────
  { key: 'first_class',     label: 'First Step',       icon: '🥋', color: '#C8A24C', category: 'attendance', desc: 'Attend your very first class.' },
  { key: 'three_in_week',   label: '3-Peat',           icon: '🔥', color: '#F97316', category: 'attendance', desc: 'Attend 3 classes in a single week.' },
  { key: 'ten_classes',     label: 'Mat Warrior',      icon: '💪', color: '#3B82F6', category: 'attendance', desc: 'Complete 10 total classes.' },
  { key: 'thirty_classes',  label: 'Consistent',       icon: '📅', color: '#8B5CF6', category: 'attendance', desc: 'Complete 30 total classes.' },
  { key: 'hundred_classes', label: 'Century Club',     icon: '💯', color: '#C8A24C', category: 'attendance', desc: 'Complete 100 total classes.' },
  { key: 'fivehundred_classes', label: 'Labyrinth Legend', icon: '🏛️', color: '#C8A24C', category: 'attendance', desc: 'Complete 500 total classes. You are the gym.' },
  { key: 'early_bird',      label: 'Early Bird',       icon: '⏰', color: '#FCD34D', category: 'attendance', desc: 'Check in to a class before 7:00 AM.' },
  { key: 'night_owl',       label: 'Night Owl',        icon: '🌙', color: '#6366F1', category: 'attendance', desc: 'Check in to a class after 7:00 PM.' },
  { key: 'perfect_week',    label: 'Perfect Week',     icon: '📆', color: '#10B981', category: 'attendance', desc: 'Attend 5 classes in a single week.' },
  { key: 'sunrise_session', label: 'Sunrise Session',  icon: '🌅', color: '#F59E0B', category: 'attendance', desc: 'Check in to a 6:00 AM class.' },

  // ── STREAKS ─────────────────────────────────────────────────────
  { key: 'streak_4',  label: 'On Fire',      icon: '🔥', color: '#F97316', category: 'streak', desc: 'Train 4 consecutive weeks.' },
  { key: 'streak_8',  label: 'Unstoppable',  icon: '⚡', color: '#8B5CF6', category: 'streak', desc: 'Train 8 consecutive weeks.' },
  { key: 'streak_12', label: 'Streak King',  icon: '👑', color: '#C8A24C', category: 'streak', desc: 'Train 12 consecutive weeks.' },
  { key: 'streak_52', label: 'Full Year',    icon: '🌟', color: '#C8A24C', category: 'streak', desc: 'Train every week for an entire year. Legendary.' },

  // ── COMPETITION ─────────────────────────────────────────────────
  { key: 'first_comp',     label: 'First Competitor', icon: '🎯', color: '#3B82F6', category: 'competition', desc: 'Enter your first tournament.' },
  { key: 'any_medal',      label: 'Podium',           icon: '🥉', color: '#CD7F32', category: 'competition', desc: 'Win any medal at a tournament.' },
  { key: 'silver_medal',   label: 'Silver Medalist',  icon: '🥈', color: '#9CA3AF', category: 'competition', desc: 'Win a silver medal.' },
  { key: 'gold_medal',     label: 'Gold Medalist',    icon: '🥇', color: '#C8A24C', category: 'competition', desc: 'Win a gold medal.' },
  { key: 'double_gold',    label: 'Double Gold',      icon: '🏆', color: '#C8A24C', category: 'competition', desc: 'Win two gold medals at the same tournament.' },

  // ── BELT PROMOTIONS ─────────────────────────────────────────────
  { key: 'first_stripe',  label: 'First Stripe',   icon: '⭐', color: '#FFFFFF', category: 'belt', desc: 'Earn your first stripe.' },
  { key: 'blue_belt',     label: 'Blue Belt',      icon: '💙', color: '#1A56DB', category: 'belt', desc: 'Earn your blue belt. The hardest belt to get.' },
  { key: 'purple_belt',   label: 'Purple Belt',    icon: '💜', color: '#7E3AF2', category: 'belt', desc: 'Earn your purple belt. You are a force.' },
  { key: 'brown_belt',    label: 'Brown Belt',     icon: '🤎', color: '#92400E', category: 'belt', desc: 'Earn your brown belt. Black belt is close.' },
  { key: 'black_belt',    label: 'Black Belt',     icon: '🖤', color: '#C8A24C', category: 'belt', desc: 'Earn your black belt. A lifetime achievement.' },
  // Kids belt promotions
  { key: 'grey_belt',     label: 'Grey Belt',      icon: '🛡️', color: '#6B6B6B', category: 'belt', desc: 'Earn your grey belt. The journey has begun.' },
  { key: 'yellow_belt',   label: 'Yellow Belt',    icon: '⭐', color: '#C49B1A', category: 'belt', desc: 'Earn your yellow belt. Technique is building.' },
  { key: 'orange_belt',   label: 'Orange Belt',    icon: '🔥', color: '#C4641A', category: 'belt', desc: 'Earn your orange belt. Competing with confidence.' },
  { key: 'green_belt',    label: 'Green Belt',     icon: '🏆', color: '#2D8040', category: 'belt', desc: 'Earn your green belt. Top of the kids program.' },

  // ── APP ENGAGEMENT ───────────────────────────────────────────────
  { key: 'app_day1',          label: 'Day One',           icon: '📱', color: '#3B82F6', category: 'app', desc: 'Log in to the app for the first time.' },
  { key: 'app_week',          label: 'Week Regular',      icon: '📆', color: '#10B981', category: 'app', desc: 'Log in 7 days in a row.' },
  { key: 'first_message',     label: 'First Message',     icon: '🗣️', color: '#8B5CF6', category: 'app', desc: 'Send your first chat message.' },
  { key: 'profile_complete',  label: 'Profile Complete',  icon: '📸', color: '#C8A24C', category: 'app', desc: 'Add a profile photo.' },

  // ── GAMES (BJJ Chess) ────────────────────────────────────────────
  { key: 'game_first',        label: 'First Move',        icon: '♟️', color: '#6B7280', category: 'games', desc: 'Play your first game of BJJ Chess.' },
  { key: 'game_win_fast',     label: 'Opening Theory',    icon: '🎯', color: '#3B82F6', category: 'games', desc: 'Win a game in under 10 moves.' },
  { key: 'game_win_5',        label: 'Strategist',        icon: '🧠', color: '#8B5CF6', category: 'games', desc: 'Win 5 BJJ Chess games total.' },
  { key: 'game_streak_3',     label: 'Hot Streak',        icon: '🔥', color: '#F97316', category: 'games', desc: 'Win 3 BJJ Chess games in a row.' },
  { key: 'game_win_10',       label: 'Chess King',        icon: '👑', color: '#C8A24C', category: 'games', desc: 'Win 10 BJJ Chess games in a row.' },
  { key: 'game_50',           label: 'Addict',            icon: '🎮', color: '#6366F1', category: 'games', desc: 'Play 50 total BJJ Chess games.' },
  { key: 'game_lb_week',      label: 'Leaderboard Champ', icon: '🏆', color: '#C8A24C', category: 'games', desc: 'Top the weekly games leaderboard.' },
  { key: 'game_midnight',     label: 'Midnight Roller',   icon: '🌙', color: '#4B5563', category: 'games', desc: 'Play a game after midnight.' },
  { key: 'game_and_class',    label: 'Mind & Body',       icon: '⚖️', color: '#10B981', category: 'games', desc: 'Play a game AND attend a class on the same day.' },

  // ── SPECIAL / SECRET ────────────────────────────────────────────
  { key: 'birthday_warrior',  label: 'Birthday Warrior',  icon: '🎂', color: '#EC4899', category: 'special', desc: 'Train on your birthday.' },
  { key: 'holiday_warrior',   label: 'Holiday Warrior',   icon: '🎄', color: '#10B981', category: 'special', desc: 'Train on a holiday.' },
  { key: 'secret_1',          label: '???',               icon: '🤫', color: '#374151', category: 'special', secret: true, desc: 'A secret achievement. Keep training to discover it.' },

  // ── LEVEL / XP ───────────────────────────────────────────────────
  { key: 'level_5',   label: 'Rising Star',         icon: '⭐', color: '#C8A24C', category: 'level', desc: 'Reach Level 5.' },
  { key: 'level_10',  label: 'Seasoned Warrior',    icon: '🕐', color: '#FFD700', category: 'level', desc: 'Reach Level 10.' },
  { key: 'level_20',  label: 'Labyrinth Veteran',   icon: '🌟', color: '#4FC3F7', category: 'level', desc: 'Reach Level 20.' },
  { key: 'level_30',  label: 'Legend of the Mat',    icon: '💎', color: '#C084FC', category: 'level', desc: 'Reach Level 30 — a legend.' },
];

export const ACHIEVEMENT_CATEGORIES = [
  { key: 'attendance',  label: '🥋 Attendance',   color: '#C8A24C' },
  { key: 'streak',      label: '🔥 Streaks',       color: '#F97316' },
  { key: 'competition', label: '🏆 Competition',   color: '#C8A24C' },
  { key: 'belt',        label: '🎗️ Promotions',    color: '#8B5CF6' },
  { key: 'games',       label: '♟️ BJJ Chess',      color: '#6366F1' },
  { key: 'app',         label: '📱 App',            color: '#3B82F6' },
  { key: 'special',     label: '✨ Special',        color: '#EC4899' },
  { key: 'level',       label: '⚔️ Level',          color: '#C8A24C' },
];

export function checkAndUnlockAchievements(profile: any, stats: any): string[] {
  const earned: string[] = JSON.parse(localStorage.getItem('lbjj_achievements') || '[]');
  const newlyEarned: string[] = [];

  const unlock = (key: string) => {
    if (!earned.includes(key)) {
      earned.push(key);
      newlyEarned.push(key);
    }
  };

  // App day 1
  unlock('app_day1');

  // Profile complete
  if (localStorage.getItem('lbjj_profile_picture')) unlock('profile_complete');

  // Belt achievements
  const belt = (profile.belt || profile.Belt || '').toLowerCase();
  if (belt === 'blue')   unlock('blue_belt');
  if (belt === 'purple') unlock('purple_belt');
  if (belt === 'brown')  unlock('brown_belt');
  if (belt === 'black')  unlock('black_belt');
  if (belt === 'grey' || belt === 'gray') unlock('grey_belt');
  if (belt === 'yellow') unlock('yellow_belt');
  if (belt === 'orange') unlock('orange_belt');
  if (belt === 'green')  unlock('green_belt');

  // Attendance
  const classCount = stats.classesAttended || 0;
  if (classCount >= 1)   unlock('first_class');
  if (classCount >= 10)  unlock('ten_classes');
  if (classCount >= 30)  unlock('thirty_classes');
  if (classCount >= 100) unlock('hundred_classes');
  if (classCount >= 500) unlock('fivehundred_classes');

  // Streak
  const streak = stats.currentStreak || profile.currentStreak || profile.CurrentStreak || 0;
  if (streak >= 4)  unlock('streak_4');
  if (streak >= 8)  unlock('streak_8');
  if (streak >= 12) unlock('streak_12');
  if (streak >= 52) unlock('streak_52');

  // Games
  const gameWins = stats.wins || 0;
  const gamesPlayed = stats.gamesPlayed || 0;
  if (gamesPlayed >= 1)  unlock('game_first');
  if (gamesPlayed >= 50) unlock('game_50');
  if (gameWins >= 5)     unlock('game_win_5');

  // Face ID = app engagement
  if (localStorage.getItem('lbjj_passkey_registered')) unlock('app_day1');

  // Level / XP
  const totalPoints = profile.totalPoints || profile.TotalPoints || 0;
  if (totalPoints > 0) {
    const level = getActualLevel(totalPoints);
    if (level >= 5)  unlock('level_5');
    if (level >= 10) unlock('level_10');
    if (level >= 20) unlock('level_20');
    if (level >= 30) unlock('level_30');
  }

  // Weekly training achievements
  const weekly: string[] = (() => { try { return JSON.parse(localStorage.getItem('lbjj_weekly_training') || '[]'); } catch { return []; } })();
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const thisWeekCount = weekly.filter(d => new Date(d) >= weekStart).length;
  if (thisWeekCount >= 3) unlock('three_in_week');
  if (thisWeekCount >= 5) unlock('perfect_week');

  // Time-based
  const hour = new Date().getHours();
  if (hour < 7) unlock('early_bird');
  if (hour >= 19) unlock('night_owl');
  if (hour >= 0 && hour < 3) unlock('game_midnight');

  // Belt stripe
  const stripes = profile.stripes || profile.Stripes || 0;
  if (stripes > 0) unlock('first_stripe');

  // First message sent
  if (localStorage.getItem('lbjj_first_message_sent')) unlock('first_message');

  // Game achievements
  const gameStreak = stats.streak || stats.currentGameStreak || 0;
  if (gameStreak >= 3) unlock('game_streak_3');
  if ((stats.wins || 0) >= 10) unlock('game_win_10');

  // Game AND class same day
  const today = new Date().toISOString().split('T')[0];
  if (weekly.includes(today) && localStorage.getItem('lbjj_game_played_' + today)) unlock('game_and_class');

  localStorage.setItem('lbjj_achievements', JSON.stringify(earned));
  return newlyEarned;
}
