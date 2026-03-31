import { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
  onGameEnd?: (result: "win" | "loss" | "draw") => void;
}

type Position =
  | "Standing"
  | "Guard (Top)"
  | "Guard (Bottom)"
  | "Side Control"
  | "Mount"
  | "Back Mount"
  | "Half Guard";

type BeltRank = "White Belt" | "Blue Belt" | "Purple Belt" | "Brown Belt" | "Black Belt";

interface BJJMove {
  name: string;
  icon: string;
  successRate: number;
  resultOnSuccess: Position;
  resultOnFail: Position;
  staminaCost: number;
  submissionChance?: number;
  submissionName?: string;
  requiredRank?: BeltRank;
}

interface RoundPopup {
  message: string;
  emoji: string;
  type: "success" | "fail" | "critical" | "submission_win" | "submission_loss" | "exhaustion";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BELT_RANKS: { rank: BeltRank; minWins: number; color: string; emoji: string }[] = [
  { rank: "White Belt", minWins: 0, color: "#F0F0F0", emoji: "🤍" },
  { rank: "Blue Belt", minWins: 3, color: "#3B6FD8", emoji: "💙" },
  { rank: "Purple Belt", minWins: 6, color: "#8B4FBF", emoji: "💜" },
  { rank: "Brown Belt", minWins: 10, color: "#8B5E3C", emoji: "🤎" },
  { rank: "Black Belt", minWins: 15, color: "#555", emoji: "🖤" },
];

function getRank(wins: number): typeof BELT_RANKS[0] {
  for (let i = BELT_RANKS.length - 1; i >= 0; i--) {
    if (wins >= BELT_RANKS[i].minWins) return BELT_RANKS[i];
  }
  return BELT_RANKS[0];
}

function getNextRank(wins: number): typeof BELT_RANKS[0] | null {
  const current = getRank(wins);
  const idx = BELT_RANKS.findIndex(b => b.rank === current.rank);
  return idx < BELT_RANKS.length - 1 ? BELT_RANKS[idx + 1] : null;
}

function hasRank(wins: number, required: BeltRank): boolean {
  const reqIdx = BELT_RANKS.findIndex(b => b.rank === required);
  const curIdx = BELT_RANKS.findIndex(b => b.rank === getRank(wins).rank);
  return curIdx >= reqIdx;
}

const POSITION_EMOJIS: Record<Position, string> = {
  "Standing": "🧍",
  "Guard (Top)": "🛡️",
  "Guard (Bottom)": "🛡️",
  "Side Control": "⚔️",
  "Mount": "🏔️",
  "Back Mount": "🎯",
  "Half Guard": "🤼",
};

const DOMINANT_POSITIONS: Position[] = ["Side Control", "Mount", "Back Mount"];

function isDominant(pos: Position): boolean {
  return DOMINANT_POSITIONS.includes(pos);
}

// ── Move Data ─────────────────────────────────────────────────────────────────

function getPlayerMoves(position: Position, wins: number): BJJMove[] {
  const moves: BJJMove[] = [];
  switch (position) {
    case "Standing":
      moves.push(
        { name: "Takedown", icon: "⚡", successRate: 65, resultOnSuccess: "Guard (Top)", resultOnFail: "Guard (Bottom)", staminaCost: 10 },
        { name: "Pull Guard", icon: "🛡️", successRate: 85, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Standing", staminaCost: 5 },
        { name: "Sprawl", icon: "🦎", successRate: 70, resultOnSuccess: "Standing", resultOnFail: "Guard (Bottom)", staminaCost: 8 },
      );
      // Brown Belt special
      moves.push({
        name: "Flying Triangle", icon: "🦅", successRate: 25, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Guard (Bottom)",
        staminaCost: 15, submissionChance: 25, submissionName: "Flying Triangle", requiredRank: "Brown Belt",
      });
      break;

    case "Guard (Top)":
      moves.push(
        { name: "Pass Guard", icon: "➡️", successRate: 55, resultOnSuccess: "Side Control", resultOnFail: "Guard (Top)", staminaCost: 10 },
        { name: "Stack Pass", icon: "💪", successRate: 50, resultOnSuccess: "Half Guard", resultOnFail: "Guard (Top)", staminaCost: 12 },
        { name: "Stand Up", icon: "🧍", successRate: 70, resultOnSuccess: "Standing", resultOnFail: "Guard (Top)", staminaCost: 6 },
      );
      break;

    case "Guard (Bottom)":
      moves.push(
        { name: "Sweep", icon: "🔄", successRate: 45, resultOnSuccess: "Guard (Top)", resultOnFail: "Guard (Bottom)", staminaCost: 10 },
        { name: "Triangle", icon: "📐", successRate: 30, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Guard (Bottom)",
          staminaCost: 12, submissionChance: 30, submissionName: "Triangle Choke" },
        { name: "Stand Up", icon: "🧍", successRate: 60, resultOnSuccess: "Standing", resultOnFail: "Guard (Bottom)", staminaCost: 8 },
      );
      // Purple Belt special
      moves.push({
        name: "Berimbolo", icon: "🌀", successRate: 60, resultOnSuccess: "Back Mount", resultOnFail: "Guard (Bottom)",
        staminaCost: 14, requiredRank: "Purple Belt",
      });
      break;

    case "Side Control":
      moves.push(
        { name: "Mount Advance", icon: "🏔️", successRate: 55, resultOnSuccess: "Mount", resultOnFail: "Half Guard", staminaCost: 8 },
        { name: "Kimura", icon: "💀", successRate: 35, resultOnSuccess: "Side Control", resultOnFail: "Guard (Bottom)",
          staminaCost: 10, submissionChance: 35, submissionName: "Kimura" },
        { name: "Escape", icon: "↩️", successRate: 40, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Side Control", staminaCost: 12 },
      );
      break;

    case "Mount":
      moves.push(
        { name: "Armbar", icon: "💀", successRate: 45, resultOnSuccess: "Mount", resultOnFail: "Guard (Bottom)",
          staminaCost: 10, submissionChance: 45, submissionName: "Armbar" },
        { name: "Choke", icon: "💀", successRate: 40, resultOnSuccess: "Mount", resultOnFail: "Half Guard",
          staminaCost: 10, submissionChance: 40, submissionName: "Cross Collar Choke" },
        { name: "S-Mount", icon: "🦂", successRate: 50, resultOnSuccess: "Mount", resultOnFail: "Side Control", staminaCost: 8 },
        { name: "Escape", icon: "↩️", successRate: 35, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Mount", staminaCost: 12 },
      );
      // Blue Belt special
      moves.push({
        name: "Ezekiel Choke", icon: "🤜", successRate: 35, resultOnSuccess: "Mount", resultOnFail: "Half Guard",
        staminaCost: 10, submissionChance: 35, submissionName: "Ezekiel Choke", requiredRank: "Blue Belt",
      });
      break;

    case "Back Mount":
      moves.push(
        { name: "RNC", icon: "💀", successRate: 55, resultOnSuccess: "Back Mount", resultOnFail: "Guard (Top)",
          staminaCost: 10, submissionChance: 55, submissionName: "Rear Naked Choke" },
        { name: "Armbar", icon: "💀", successRate: 40, resultOnSuccess: "Back Mount", resultOnFail: "Side Control",
          staminaCost: 10, submissionChance: 40, submissionName: "Armbar from Back" },
        { name: "Escape", icon: "↩️", successRate: 30, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Back Mount", staminaCost: 14 },
      );
      break;

    case "Half Guard":
      moves.push(
        { name: "Pass to Side", icon: "➡️", successRate: 55, resultOnSuccess: "Side Control", resultOnFail: "Half Guard", staminaCost: 10 },
        { name: "Recover Guard", icon: "🛡️", successRate: 50, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Half Guard", staminaCost: 8 },
        { name: "Sweep", icon: "🔄", successRate: 40, resultOnSuccess: "Guard (Top)", resultOnFail: "Half Guard", staminaCost: 10 },
      );
      // Black Belt special
      moves.push({
        name: "Heel Hook", icon: "🦶", successRate: 45, resultOnSuccess: "Half Guard", resultOnFail: "Guard (Bottom)",
        staminaCost: 12, submissionChance: 45, submissionName: "Heel Hook", requiredRank: "Black Belt",
      });
      break;
  }
  return moves;
}

// AI move from its position
function getAIMoves(position: Position): BJJMove[] {
  // AI gets simpler move set
  switch (position) {
    case "Standing":
      return [
        { name: "Takedown", icon: "⚡", successRate: 50, resultOnSuccess: "Guard (Top)", resultOnFail: "Standing", staminaCost: 10 },
        { name: "Pull Guard", icon: "🛡️", successRate: 70, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Standing", staminaCost: 5 },
      ];
    case "Guard (Top)":
      return [
        { name: "Pass Guard", icon: "➡️", successRate: 45, resultOnSuccess: "Side Control", resultOnFail: "Guard (Top)", staminaCost: 10 },
        { name: "Stand Up", icon: "🧍", successRate: 60, resultOnSuccess: "Standing", resultOnFail: "Guard (Top)", staminaCost: 6 },
      ];
    case "Guard (Bottom)":
      return [
        { name: "Sweep", icon: "🔄", successRate: 35, resultOnSuccess: "Guard (Top)", resultOnFail: "Guard (Bottom)", staminaCost: 10 },
        { name: "Triangle", icon: "📐", successRate: 20, resultOnSuccess: "Guard (Bottom)", resultOnFail: "Guard (Bottom)",
          staminaCost: 12, submissionChance: 20, submissionName: "Triangle Choke" },
      ];
    case "Side Control":
      return [
        { name: "Mount", icon: "🏔️", successRate: 40, resultOnSuccess: "Mount", resultOnFail: "Side Control", staminaCost: 8 },
        { name: "Kimura", icon: "💀", successRate: 25, resultOnSuccess: "Side Control", resultOnFail: "Guard (Bottom)",
          staminaCost: 10, submissionChance: 25, submissionName: "Kimura" },
      ];
    case "Mount":
      return [
        { name: "Armbar", icon: "💀", successRate: 35, resultOnSuccess: "Mount", resultOnFail: "Guard (Bottom)",
          staminaCost: 10, submissionChance: 35, submissionName: "Armbar" },
        { name: "Choke", icon: "💀", successRate: 30, resultOnSuccess: "Mount", resultOnFail: "Half Guard",
          staminaCost: 10, submissionChance: 30, submissionName: "Cross Collar Choke" },
      ];
    case "Back Mount":
      return [
        { name: "RNC", icon: "💀", successRate: 45, resultOnSuccess: "Back Mount", resultOnFail: "Guard (Top)",
          staminaCost: 10, submissionChance: 45, submissionName: "Rear Naked Choke" },
      ];
    case "Half Guard":
      return [
        { name: "Pass", icon: "➡️", successRate: 40, resultOnSuccess: "Side Control", resultOnFail: "Half Guard", staminaCost: 10 },
        { name: "Sweep", icon: "🔄", successRate: 30, resultOnSuccess: "Guard (Top)", resultOnFail: "Half Guard", staminaCost: 10 },
      ];
    default:
      return [];
  }
}

// Flip position perspective for AI
function flipPosition(pos: Position): Position {
  switch (pos) {
    case "Guard (Top)": return "Guard (Bottom)";
    case "Guard (Bottom)": return "Guard (Top)";
    default: return pos;
  }
}

const MAX_ROUNDS = 12;
const CRITICAL_CHANCE = 0.15;
const CRITICAL_BONUS = 25;
const MOMENTUM_BONUS = 20;

// ── Component ─────────────────────────────────────────────────────────────────

export default function BjjChessGame({ onBack, onGameEnd }: Props) {
  // Game state
  const [position, setPosition] = useState<Position>("Standing");
  const [round, setRound] = useState(1);
  const [playerStamina, setPlayerStamina] = useState(100);
  const [aiStamina, setAiStamina] = useState(100);
  const [momentum, setMomentum] = useState(0); // 0-3
  const [processing, setProcessing] = useState(false);
  const [suddenDeath, setSuddenDeath] = useState(false);

  // Popup
  const [popup, setPopup] = useState<RoundPopup | null>(null);

  // Game over
  const [gameOver, setGameOver] = useState<{
    result: "win" | "loss";
    finisher: string;
    rounds: number;
    playerStaminaLeft: number;
    aiStaminaLeft: number;
    maxMomentum: number;
    type: "submission" | "exhaustion";
  } | null>(null);

  // Rank tracking
  const [wins, setWins] = useState(0);
  const [maxMomentum, setMaxMomentum] = useState(0);

  // Critical hit flash
  const [criticalFlash, setCriticalFlash] = useState(false);

  const currentRank = getRank(wins);
  const nextRank = getNextRank(wins);

  // Show popup for 1.5s
  const showPopup = useCallback((p: RoundPopup) => {
    setPopup(p);
    setTimeout(() => setPopup(null), 1500);
  }, []);

  function executeRound(moveIndex: number) {
    if (processing || gameOver) return;
    setProcessing(true);

    const playerMoves = getPlayerMoves(position, wins);
    const move = playerMoves[moveIndex];

    // Can't use locked moves
    if (move.requiredRank && !hasRank(wins, move.requiredRank)) {
      setProcessing(false);
      return;
    }

    // Drain stamina
    const newPlayerStamina = Math.max(0, playerStamina - move.staminaCost);
    setPlayerStamina(newPlayerStamina);

    // Check exhaustion
    if (newPlayerStamina <= 0) {
      setGameOver({
        result: "loss", finisher: "Exhaustion Tap", rounds: round,
        playerStaminaLeft: 0, aiStaminaLeft: aiStamina, maxMomentum, type: "exhaustion",
      });
      showPopup({ message: "You're gassed! Exhaustion tap!", emoji: "😵", type: "exhaustion" });
      onGameEnd?.("loss");
      setProcessing(false);
      return;
    }

    // Check critical hit
    const isCritical = Math.random() < CRITICAL_CHANCE;
    if (isCritical) {
      setCriticalFlash(true);
      setTimeout(() => setCriticalFlash(false), 600);
    }

    // Calculate success rate with modifiers
    let effectiveRate = move.successRate;
    // Stamina penalty: below 30 stamina, lose effectiveness
    if (newPlayerStamina < 30) {
      effectiveRate *= 0.7 + (newPlayerStamina / 100);
    }
    // Critical bonus
    if (isCritical) effectiveRate = Math.min(95, effectiveRate + CRITICAL_BONUS);
    // Momentum bonus
    if (momentum >= 3) effectiveRate = Math.min(95, effectiveRate + MOMENTUM_BONUS);

    const roll = Math.random() * 100;
    const playerSuccess = roll < effectiveRate;

    // Check submission
    if (playerSuccess && move.submissionChance && move.submissionName) {
      let subRate = move.submissionChance;
      if (isCritical) subRate = Math.min(90, subRate + CRITICAL_BONUS);
      if (momentum >= 3) subRate = Math.min(90, subRate + 10);
      const subRoll = Math.random() * 100;
      if (subRoll < subRate) {
        const newWins = wins + 1;
        setWins(newWins);
        setGameOver({
          result: "win", finisher: move.submissionName, rounds: round,
          playerStaminaLeft: newPlayerStamina, aiStaminaLeft: aiStamina, maxMomentum, type: "submission",
        });
        showPopup({
          message: `${move.submissionName}! TAP TAP TAP!`,
          emoji: "🏆",
          type: "submission_win",
        });
        onGameEnd?.("win");
        setProcessing(false);
        return;
      }
    }

    let newPos = playerSuccess ? move.resultOnSuccess : move.resultOnFail;

    // Update momentum
    if (playerSuccess) {
      const newMom = Math.min(3, momentum + 1);
      setMomentum(newMom);
      if (newMom > maxMomentum) setMaxMomentum(newMom);
    } else {
      setMomentum(0);
    }

    // AI turn
    const aiPosition = flipPosition(newPos);
    const aiMoves = getAIMoves(aiPosition);
    if (aiMoves.length > 0) {
      const aiMove = aiMoves[Math.floor(Math.random() * aiMoves.length)];
      const newAiStamina = Math.max(0, aiStamina - aiMove.staminaCost);
      setAiStamina(newAiStamina);

      // AI exhaustion
      if (newAiStamina <= 0) {
        const newWins = wins + 1;
        setWins(newWins);
        setGameOver({
          result: "win", finisher: "Opponent Exhaustion", rounds: round,
          playerStaminaLeft: newPlayerStamina, aiStaminaLeft: 0, maxMomentum, type: "exhaustion",
        });
        showPopup({ message: "Opponent gassed out!", emoji: "💪", type: "submission_win" });
        onGameEnd?.("win");
        setProcessing(false);
        return;
      }

      let aiEffRate = aiMove.successRate;
      if (newAiStamina < 30) aiEffRate *= 0.7 + (newAiStamina / 100);

      const aiRoll = Math.random() * 100;
      const aiSuccess = aiRoll < aiEffRate;

      // AI submission check
      if (aiSuccess && aiMove.submissionChance && aiMove.submissionName) {
        const aiSubRoll = Math.random() * 100;
        if (aiSubRoll < aiMove.submissionChance * 0.7) {
          setGameOver({
            result: "loss", finisher: aiMove.submissionName, rounds: round,
            playerStaminaLeft: newPlayerStamina, aiStaminaLeft: newAiStamina, maxMomentum, type: "submission",
          });
          showPopup({ message: `Caught in ${aiMove.submissionName}!`, emoji: "💀", type: "submission_loss" });
          onGameEnd?.("loss");
          setProcessing(false);
          return;
        }
      }

      if (aiSuccess) {
        // AI modifies position from their perspective, flip back
        newPos = flipPosition(aiMove.resultOnSuccess);
      }
    }

    setPosition(newPos);

    // Sudden death check
    const newRound = round + 1;
    setRound(newRound);
    if (newRound > MAX_ROUNDS && !suddenDeath) {
      setSuddenDeath(true);
    }

    // In sudden death, every round increases sub chances automatically (handled by the higher base rates)

    // Show round result popup
    if (playerSuccess) {
      showPopup({
        message: isCritical ? `CRITICAL ${move.name}! → ${newPos}` : `${move.name} → ${newPos}`,
        emoji: isCritical ? "⚡" : "✅",
        type: isCritical ? "critical" : "success",
      });
    } else {
      showPopup({ message: `${move.name} defended!`, emoji: "❌", type: "fail" });
    }

    setTimeout(() => {
      setProcessing(false);
    }, 300);
  }

  function resetGame() {
    setPosition("Standing");
    setRound(1);
    setPlayerStamina(100);
    setAiStamina(100);
    setMomentum(0);
    setProcessing(false);
    setSuddenDeath(false);
    setPopup(null);
    setGameOver(null);
    setCriticalFlash(false);
    setMaxMomentum(0);
  }

  const playerMoves = getPlayerMoves(position, wins);

  function getBarColor(rate: number): string {
    if (rate >= 60) return "#C8A24C";
    if (rate >= 40) return "#b08a30";
    if (rate >= 25) return "#c87040";
    return "#c85050";
  }

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes goldFlash {
          0% { background: rgba(200,162,76,0.3); }
          100% { background: transparent; }
        }
        @keyframes critFlash {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,162,76,0); }
          50% { box-shadow: 0 0 30px 8px rgba(200,162,76,0.4); }
        }
        @keyframes popupIn {
          from { transform: scale(0.8) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes victoryBurst {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes staminaPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .move-btn:active { transform: scale(0.97); }
      `}</style>

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", height: "100vh", paddingBottom: 40, WebkitOverflowScrolling: "touch" }}>

        {/* Header */}
        <div style={{ padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 8px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={onBack}
              style={{
                background: "none", border: "none", color: "#C8A24C", fontSize: 14, fontWeight: 600,
                cursor: "pointer", padding: "8px 4px 8px 0", WebkitTapHighlightColor: "transparent",
              }}
            >
              ← Games
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: suddenDeath ? "#E05555" : "#666", fontWeight: suddenDeath ? 700 : 400 }}>
                {suddenDeath ? "⚠️ SUDDEN DEATH" : `Round ${round}/${MAX_ROUNDS}`}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                background: `${currentRank.color}22`, color: currentRank.color,
                border: `1px solid ${currentRank.color}33`,
              }}>
                {currentRank.emoji} {currentRank.rank}
              </span>
            </div>
          </div>
        </div>

        {/* Stamina Bars */}
        <div style={{ padding: "0 16px", marginBottom: 6 }}>
          {/* Player stamina */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: "#999", fontWeight: 600 }}>YOU</span>
              <span style={{ fontSize: 10, color: playerStamina < 30 ? "#E05555" : "#C8A24C", fontWeight: 600 }}>{playerStamina}</span>
            </div>
            <div style={{ background: "#1A1A1A", borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{
                width: `${playerStamina}%`, height: "100%", borderRadius: 4,
                background: playerStamina < 30 ? "#E05555" : "linear-gradient(90deg, #b08a30, #C8A24C)",
                transition: "width 0.4s ease",
                animation: playerStamina < 20 ? "staminaPulse 1s ease infinite" : "none",
              }} />
            </div>
          </div>
          {/* Momentum stars */}
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                fontSize: 14, opacity: i < momentum ? 1 : 0.2,
                filter: i < momentum ? "none" : "grayscale(1)",
                transition: "all 0.3s",
              }}>⭐</span>
            ))}
            {momentum >= 3 && (
              <span style={{ fontSize: 9, color: "#C8A24C", fontWeight: 700, marginLeft: 4, alignSelf: "center" }}>
                +{MOMENTUM_BONUS}% NEXT MOVE
              </span>
            )}
          </div>
          {/* AI stamina */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>OPPONENT</span>
              <span style={{ fontSize: 10, color: aiStamina < 30 ? "#E05555" : "#666", fontWeight: 600 }}>{aiStamina}</span>
            </div>
            <div style={{ background: "#1A1A1A", borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{
                width: `${aiStamina}%`, height: "100%", borderRadius: 4,
                background: aiStamina < 30 ? "#E05555" : "#555",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>
        </div>

        {/* Position Display */}
        <div style={{
          margin: "12px 16px", padding: "20px 16px", borderRadius: 12, textAlign: "center",
          background: "#111", border: criticalFlash ? "1px solid rgba(200,162,76,0.6)" : "1px solid #1A1A1A",
          animation: criticalFlash ? "critFlash 0.6s ease-out" : "none",
          transition: "border-color 0.3s",
        }}>
          <div style={{ fontSize: 44, marginBottom: 6, lineHeight: 1 }}>
            {POSITION_EMOJIS[position] || "🥋"}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800, letterSpacing: 0.5, lineHeight: 1.2,
            ...(isDominant(position) ? {
              background: "linear-gradient(90deg, #C8A24C, #E8D48C, #C8A24C)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            } : { color: "#F0F0F0" }),
          }}>
            {position}
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
            {isDominant(position) ? "⚔️ Dominant position" : "Neutral ground"}
          </div>
        </div>

        {/* Round Result Popup */}
        {popup && (
          <div style={{
            margin: "0 16px 8px", padding: "10px 14px", borderRadius: 10,
            animation: "popupIn 0.25s ease-out",
            background: popup.type === "submission_win" || popup.type === "critical" ? "rgba(200,162,76,0.12)" :
                        popup.type === "success" ? "rgba(76,175,128,0.1)" :
                        popup.type === "fail" ? "rgba(200,80,80,0.1)" :
                        popup.type === "submission_loss" || popup.type === "exhaustion" ? "rgba(200,80,80,0.15)" : "#111",
            border: popup.type === "critical" ? "1px solid rgba(200,162,76,0.4)" : "1px solid #1A1A1A",
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
              color: popup.type === "success" || popup.type === "submission_win" || popup.type === "critical" ? "#C8A24C" : "#E05555",
            }}>
              <span style={{ fontSize: 18 }}>{popup.emoji}</span>
              {popup.message}
            </div>
          </div>
        )}

        {/* Move Cards */}
        {!gameOver && (
          <div style={{ padding: "0 16px", marginTop: 8 }}>
            <div style={{ fontSize: 10, color: "#666", marginBottom: 8, letterSpacing: 1.5, fontWeight: 600 }}>
              CHOOSE YOUR MOVE
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {playerMoves.map((move, i) => {
                const isLocked = move.requiredRank && !hasRank(wins, move.requiredRank);
                const isSpecial = !!move.requiredRank;
                const isFinisher = !!move.submissionChance;

                return (
                  <button
                    key={i}
                    className="move-btn"
                    onClick={() => !isLocked && executeRound(i)}
                    disabled={processing || !!isLocked}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: isLocked ? "#0D0D0D" : "#111",
                      borderRadius: 10,
                      padding: "12px 14px",
                      border: isSpecial && !isLocked ? "1px solid rgba(139,79,191,0.3)" : "1px solid #1A1A1A",
                      boxShadow: isSpecial && !isLocked ? "0 0 12px rgba(139,79,191,0.08)" : "none",
                      cursor: isLocked ? "default" : processing ? "wait" : "pointer",
                      opacity: processing ? 0.6 : isLocked ? 0.4 : 1,
                      transition: "all 0.15s ease",
                      WebkitTapHighlightColor: "transparent",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{isLocked ? "🔒" : move.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: isLocked ? "#444" : "#F0F0F0" }}>
                          {move.name}
                        </span>
                        {isFinisher && !isLocked && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, color: "#C8A24C",
                            background: "rgba(200,162,76,0.12)", padding: "2px 6px", borderRadius: 4,
                          }}>
                            ⚡ FINISH
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 10, color: "#666", fontWeight: 600 }}>
                          -{move.staminaCost} ⚡
                        </span>
                        {!isLocked && (
                          <span style={{ fontSize: 14, fontWeight: 700, color: getBarColor(move.successRate) }}>
                            {move.successRate}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {!isLocked && (
                      <div style={{ background: "#1A1A1A", borderRadius: 3, height: 4, overflow: "hidden", marginBottom: 4 }}>
                        <div style={{
                          width: `${move.successRate}%`, height: "100%", borderRadius: 3,
                          background: getBarColor(move.successRate), transition: "width 0.3s",
                        }} />
                      </div>
                    )}

                    {/* Locked label */}
                    {isLocked && move.requiredRank && (
                      <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                        🔒 Unlock at {move.requiredRank}
                      </div>
                    )}

                    {/* Submission chance */}
                    {isFinisher && !isLocked && (
                      <div style={{ fontSize: 10, color: "#C8A24C", marginTop: 2 }}>
                        Submission: {move.submissionChance}%{momentum >= 3 ? " (+10% momentum)" : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reset button */}
        {!gameOver && (
          <div style={{ textAlign: "center", padding: "20px 16px 40px" }}>
            <button
              onClick={resetGame}
              style={{
                padding: "10px 32px", fontSize: 13, fontWeight: 600, color: "#666",
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, cursor: "pointer",
              }}
            >
              Reset Match
            </button>
          </div>
        )}

      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: gameOver.result === "win" ? "rgba(0,0,0,0.92)" : "rgba(30,0,0,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, animation: "popupIn 0.3s ease-out",
        }}>
          <div style={{
            textAlign: "center", animation: "victoryBurst 0.5s ease-out",
            padding: "24px 20px", maxWidth: 370, width: "100%",
          }}>
            {/* Icon */}
            <div style={{ fontSize: 56, marginBottom: 8, lineHeight: 1 }}>
              {gameOver.result === "win" ? "🥋" : "😵"}
            </div>

            {/* Title */}
            <div style={{
              fontSize: 24, fontWeight: 800, letterSpacing: 2, marginBottom: 4,
              ...(gameOver.result === "win" ? {
                background: "linear-gradient(90deg, #C8A24C, #E8D48C, #C8A24C, #E8D48C)",
                backgroundSize: "400% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 3s linear infinite",
              } : { color: "#E05555" }),
            }}>
              {gameOver.type === "exhaustion"
                ? "EXHAUSTION TAP!"
                : gameOver.result === "win" ? "SUBMISSION!" : "TAPPED OUT"}
            </div>

            {/* Finisher */}
            <div style={{
              fontSize: 16, fontWeight: 600, marginBottom: 16,
              color: gameOver.result === "win" ? "#C8A24C" : "#E05555",
            }}>
              {gameOver.finisher}
            </div>

            {/* Stats */}
            <div style={{
              background: "rgba(255,255,255,0.04)", borderRadius: 10,
              padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#666" }}>Rounds</span>
                <span style={{ fontSize: 12, color: "#F0F0F0", fontWeight: 600 }}>{gameOver.rounds}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#666" }}>Stamina Left</span>
                <span style={{ fontSize: 12, color: "#F0F0F0", fontWeight: 600 }}>{gameOver.playerStaminaLeft}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#666" }}>Peak Momentum</span>
                <span style={{ fontSize: 12, color: "#F0F0F0", fontWeight: 600 }}>
                  {"⭐".repeat(gameOver.maxMomentum || 0)}{gameOver.maxMomentum === 0 ? "—" : ""}
                </span>
              </div>
            </div>

            {/* Rank Progress */}
            {nextRank && (
              <div style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 10,
                padding: "12px 16px", marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>RANK PROGRESS</span>
                  <span style={{ fontSize: 11, color: currentRank.color, fontWeight: 700 }}>
                    {currentRank.emoji} {currentRank.rank}
                  </span>
                </div>
                <div style={{ background: "#1A1A1A", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{
                    width: `${Math.min(100, ((wins - getRank(wins).minWins) / (nextRank.minWins - getRank(wins).minWins)) * 100)}%`,
                    height: "100%", borderRadius: 4,
                    background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})`,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>
                  {nextRank.minWins - wins} win{nextRank.minWins - wins !== 1 ? "s" : ""} to {nextRank.emoji} {nextRank.rank}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={resetGame}
                style={{
                  padding: "12px 28px", fontSize: 14, fontWeight: 700, color: "#0A0A0A",
                  background: "#C8A24C", borderRadius: 10, border: "none", cursor: "pointer",
                  letterSpacing: 0.5,
                }}
              >
                Run it Back
              </button>
              <button
                onClick={onBack}
                style={{
                  padding: "12px 28px", fontSize: 14, fontWeight: 600, color: "#999",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, cursor: "pointer",
                }}
              >
                Games
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
