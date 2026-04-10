import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface GameRecord {
  date: string;
  game: "bjj" | "chess";
  result: "win" | "loss" | "draw";
  opponent: string;
  difficulty?: string;
  rounds?: number;
  finisher?: string;
}

export interface GameStats {
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  lossStreak: number;
  records: GameRecord[];
}

interface GameRecordContextType {
  stats: GameStats;
  addRecord: (record: Omit<GameRecord, "date">) => void;
  resetStats: () => void;
}

const STORAGE_KEY = "lbjj_game_stats_v2";

const defaultStats: GameStats = {
  wins: 0, losses: 0, streak: 0, bestStreak: 0, lossStreak: 0, records: [],
};

function loadStats(): GameStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultStats, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultStats;
}

function saveStats(stats: GameStats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); }
  catch { /* storage full */ }
}

const GameRecordContext = createContext<GameRecordContextType>({
  stats: defaultStats,
  addRecord: () => {},
  resetStats: () => {},
});

export function GameRecordProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<GameStats>(loadStats);

  useEffect(() => { saveStats(stats); }, [stats]);

  function addRecord(record: Omit<GameRecord, "date">) {
    setStats(prev => {
      const isWin  = record.result === "win";
      const isLoss = record.result === "loss";
      const newStreak     = isWin  ? prev.streak + 1      : 0;
      const newLossStreak = isLoss ? prev.lossStreak + 1   : 0;
      // Streak bonus: 3+ win streak = +2 per win
      const winDelta = isWin ? (prev.streak >= 2 ? 2 : 1) : 0;
      // Loss penalty: every 3 consecutive losses = -1 win point
      const lossPenalty = (isLoss && newLossStreak >= 3) ? 1 : 0;

      const updated: GameStats = {
        wins:       Math.max(0, prev.wins + winDelta - lossPenalty),
        losses:     prev.losses + (isLoss ? 1 : 0),
        streak:     newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        lossStreak: lossPenalty > 0 ? 0 : newLossStreak,
        records:    [{ ...record, date: new Date().toISOString() }, ...prev.records].slice(0, 50),
      };
      return updated;
    });
  }

  function resetStats() {
    const fresh = { ...defaultStats };
    setStats(fresh);
    saveStats(fresh);
  }

  return (
    <GameRecordContext.Provider value={{ stats, addRecord, resetStats }}>
      {children}
    </GameRecordContext.Provider>
  );
}

export function useGameRecords() {
  return useContext(GameRecordContext);
}
