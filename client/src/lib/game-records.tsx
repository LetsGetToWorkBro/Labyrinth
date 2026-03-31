import { createContext, useContext, useState, ReactNode } from "react";

export interface GameRecord {
  date: string;
  game: "bjj" | "chess";
  result: "win" | "loss" | "draw";
  opponent: string;
}

export interface GameStats {
  bjj: { wins: number; losses: number; draws: number };
  chess: { wins: number; losses: number; draws: number };
  records: GameRecord[];
}

interface GameRecordContextType {
  stats: GameStats;
  records: GameRecord[];
  addRecord: (game: "bjj" | "chess", result: "win" | "loss" | "draw", opponent: string) => void;
}

const defaultStats: GameStats = {
  bjj: { wins: 0, losses: 0, draws: 0 },
  chess: { wins: 0, losses: 0, draws: 0 },
  records: [],
};

const GameRecordContext = createContext<GameRecordContextType>({
  stats: defaultStats,
  records: [],
  addRecord: () => {},
});

export function GameRecordProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<GameStats>(defaultStats);

  function addRecord(game: "bjj" | "chess", result: "win" | "loss" | "draw", opponent: string) {
    const record: GameRecord = {
      date: new Date().toISOString(),
      game,
      result,
      opponent,
    };

    setStats((prev) => {
      const gameStats = { ...prev[game] };
      if (result === "win") gameStats.wins += 1;
      else if (result === "loss") gameStats.losses += 1;
      else gameStats.draws += 1;

      return {
        ...prev,
        [game]: gameStats,
        records: [record, ...prev.records],
      };
    });
  }

  return (
    <GameRecordContext.Provider value={{ stats, records: stats.records, addRecord }}>
      {children}
    </GameRecordContext.Provider>
  );
}

export function useGameRecords() {
  return useContext(GameRecordContext);
}
