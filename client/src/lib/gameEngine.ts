// BJJ Position Chess — Complete Game Engine
// Matches spec exactly from game-spec.md

export const MAX_ROUNDS = 12;
export const CRIT_CHANCE = 0.15;
export const CRIT_BONUS = 25;
export const MOMENTUM_BONUS = 20;
export const MOMENTUM_SUB_BONUS = 10; // Original game used +10 for submission momentum bonus

// ===== RANK SYSTEM =====
export interface Rank {
  name: string;
  minWins: number;
  color: string;
  emoji: string;
}

export const RANKS: Rank[] = [
  { name: 'White Belt', minWins: 0, color: '#F0F0F0', emoji: '🤍' },
  { name: 'Blue Belt', minWins: 3, color: '#3B6FD8', emoji: '💙' },
  { name: 'Purple Belt', minWins: 6, color: '#8B4FBF', emoji: '💜' },
  { name: 'Brown Belt', minWins: 10, color: '#8B5E3C', emoji: '🤎' },
  { name: 'Black Belt', minWins: 15, color: '#555', emoji: '🖤' },
];

export function getRank(wins: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (wins >= r.minWins) rank = r;
  }
  return rank;
}

export function getNextRank(wins: number): Rank | null {
  const current = getRank(wins);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getRankIndex(wins: number): number {
  const rank = getRank(wins);
  return RANKS.indexOf(rank);
}

// ===== POSITIONS =====
export type Position = 'Standing' | 'Guard (Top)' | 'Guard (Bottom)' | 'Side Control' | 'Mount' | 'Back Mount' | 'Half Guard';

export const POSITION_ICONS: Record<Position, string> = {
  'Standing': '🧍',
  'Guard (Top)': '🛡️',
  'Guard (Bottom)': '🛡️',
  'Side Control': '⚔️',
  'Mount': '🏔️',
  'Back Mount': '🎯',
  'Half Guard': '🤼',
};

export const POSITION_DESCRIPTIONS: Record<Position, string> = {
  'Standing': 'Neutral ground',
  'Guard (Top)': 'Controlling from above',
  'Guard (Bottom)': 'Fighting from below',
  'Side Control': 'Dominant pressure',
  'Mount': 'Full control',
  'Back Mount': 'Ultimate position',
  'Half Guard': 'Transitional battle',
};

export const DOMINANT_POSITIONS: Position[] = ['Side Control', 'Mount', 'Back Mount'];

// Position hierarchy for combo system (ascending dominance)
const POSITION_HIERARCHY: Position[] = ['Standing', 'Guard (Top)', 'Side Control', 'Mount', 'Back Mount'];

export function isPositionAdvance(from: Position, to: Position): boolean {
  const fromIdx = POSITION_HIERARCHY.indexOf(from);
  const toIdx = POSITION_HIERARCHY.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  return toIdx > fromIdx;
}

// ===== MOVES =====
export interface Move {
  name: string;
  icon: string;
  successRate: number;
  successPosition: Position;
  failPosition: Position;
  staminaCost: number;
  submissionChance?: number;
  submissionName?: string;
  requiredRank?: string; // belt name
}

export const PLAYER_MOVES: Record<Position, Move[]> = {
  'Standing': [
    { name: 'Takedown', icon: '⚡', successRate: 65, successPosition: 'Guard (Top)', failPosition: 'Guard (Bottom)', staminaCost: 10 },
    { name: 'Pull Guard', icon: '🛡️', successRate: 85, successPosition: 'Guard (Bottom)', failPosition: 'Standing', staminaCost: 5 },
    { name: 'Sprawl', icon: '🦎', successRate: 70, successPosition: 'Standing', failPosition: 'Guard (Bottom)', staminaCost: 8 },
    { name: 'Flying Triangle', icon: '🦅', successRate: 25, successPosition: 'Guard (Bottom)', failPosition: 'Guard (Bottom)', staminaCost: 15, submissionChance: 25, submissionName: 'Flying Triangle', requiredRank: 'Brown Belt' },
  ],
  'Guard (Top)': [
    { name: 'Pass Guard', icon: '➡️', successRate: 55, successPosition: 'Side Control', failPosition: 'Guard (Top)', staminaCost: 10 },
    { name: 'Stack Pass', icon: '💪', successRate: 50, successPosition: 'Half Guard', failPosition: 'Guard (Top)', staminaCost: 12 },
    { name: 'Stand Up', icon: '🧍', successRate: 70, successPosition: 'Standing', failPosition: 'Guard (Top)', staminaCost: 6 },
  ],
  'Guard (Bottom)': [
    { name: 'Sweep', icon: '🔄', successRate: 45, successPosition: 'Guard (Top)', failPosition: 'Guard (Bottom)', staminaCost: 10 },
    { name: 'Triangle', icon: '📐', successRate: 30, successPosition: 'Guard (Bottom)', failPosition: 'Guard (Bottom)', staminaCost: 12, submissionChance: 30, submissionName: 'Triangle Choke' },
    { name: 'Stand Up', icon: '🧍', successRate: 60, successPosition: 'Standing', failPosition: 'Guard (Bottom)', staminaCost: 8 },
    { name: 'Berimbolo', icon: '🌀', successRate: 60, successPosition: 'Back Mount', failPosition: 'Guard (Bottom)', staminaCost: 14, requiredRank: 'Purple Belt' },
  ],
  'Side Control': [
    { name: 'Mount Advance', icon: '🏔️', successRate: 55, successPosition: 'Mount', failPosition: 'Half Guard', staminaCost: 8 },
    { name: 'Kimura', icon: '💀', successRate: 35, successPosition: 'Side Control', failPosition: 'Guard (Bottom)', staminaCost: 10, submissionChance: 35, submissionName: 'Kimura' },
    { name: 'Escape', icon: '↩️', successRate: 40, successPosition: 'Guard (Bottom)', failPosition: 'Side Control', staminaCost: 12 },
  ],
  'Mount': [
    { name: 'Armbar', icon: '💀', successRate: 45, successPosition: 'Mount', failPosition: 'Guard (Bottom)', staminaCost: 10, submissionChance: 45, submissionName: 'Armbar' },
    { name: 'Choke', icon: '💀', successRate: 40, successPosition: 'Mount', failPosition: 'Half Guard', staminaCost: 10, submissionChance: 40, submissionName: 'Cross Collar Choke' },
    { name: 'S-Mount', icon: '🦂', successRate: 50, successPosition: 'Mount', failPosition: 'Side Control', staminaCost: 8 },
    { name: 'Escape', icon: '↩️', successRate: 35, successPosition: 'Guard (Bottom)', failPosition: 'Mount', staminaCost: 12 },
    { name: 'Ezekiel Choke', icon: '🤜', successRate: 35, successPosition: 'Mount', failPosition: 'Half Guard', staminaCost: 10, submissionChance: 35, submissionName: 'Ezekiel Choke', requiredRank: 'Blue Belt' },
  ],
  'Back Mount': [
    { name: 'RNC', icon: '💀', successRate: 55, successPosition: 'Back Mount', failPosition: 'Guard (Top)', staminaCost: 10, submissionChance: 55, submissionName: 'Rear Naked Choke' },
    { name: 'Armbar', icon: '💀', successRate: 40, successPosition: 'Back Mount', failPosition: 'Side Control', staminaCost: 10, submissionChance: 40, submissionName: 'Armbar from Back' },
    { name: 'Escape', icon: '↩️', successRate: 30, successPosition: 'Guard (Bottom)', failPosition: 'Back Mount', staminaCost: 14 },
  ],
  'Half Guard': [
    { name: 'Pass to Side', icon: '➡️', successRate: 55, successPosition: 'Side Control', failPosition: 'Half Guard', staminaCost: 10 },
    { name: 'Recover Guard', icon: '🛡️', successRate: 50, successPosition: 'Guard (Bottom)', failPosition: 'Half Guard', staminaCost: 8 },
    { name: 'Sweep', icon: '🔄', successRate: 40, successPosition: 'Guard (Top)', failPosition: 'Half Guard', staminaCost: 10 },
    { name: 'Heel Hook', icon: '🦶', successRate: 45, successPosition: 'Half Guard', failPosition: 'Guard (Bottom)', staminaCost: 12, submissionChance: 45, submissionName: 'Heel Hook', requiredRank: 'Black Belt' },
  ],
};

// ===== AI MOVES =====
export interface AIMove {
  name: string;
  successRate: number;
  staminaCost: number;
  submissionChance?: number;
  submissionName?: string;
}

export const AI_MOVES: Record<Position, AIMove[]> = {
  'Standing': [
    { name: 'Takedown', successRate: 50, staminaCost: 10 },
    { name: 'Pull Guard', successRate: 70, staminaCost: 5 },
  ],
  'Guard (Top)': [
    { name: 'Pass Guard', successRate: 45, staminaCost: 10 },
    { name: 'Stand Up', successRate: 60, staminaCost: 6 },
  ],
  'Guard (Bottom)': [
    { name: 'Sweep', successRate: 35, staminaCost: 10 },
    { name: 'Triangle', successRate: 20, staminaCost: 12, submissionChance: 20, submissionName: 'Triangle Choke' },
  ],
  'Side Control': [
    { name: 'Mount', successRate: 40, staminaCost: 8 },
    { name: 'Kimura', successRate: 25, staminaCost: 10, submissionChance: 25, submissionName: 'Kimura' },
  ],
  'Mount': [
    { name: 'Armbar', successRate: 35, staminaCost: 10, submissionChance: 35, submissionName: 'Armbar' },
    { name: 'Choke', successRate: 30, staminaCost: 10, submissionChance: 30, submissionName: 'Cross Collar Choke' },
  ],
  'Back Mount': [
    { name: 'RNC', successRate: 45, staminaCost: 10, submissionChance: 45, submissionName: 'Rear Naked Choke' },
  ],
  'Half Guard': [
    { name: 'Pass', successRate: 40, staminaCost: 10 },
    { name: 'Sweep', successRate: 30, staminaCost: 10 },
  ],
};

// Mirror position for AI
export function getAIPosition(playerPosition: Position): Position {
  if (playerPosition === 'Guard (Top)') return 'Guard (Bottom)';
  if (playerPosition === 'Guard (Bottom)') return 'Guard (Top)';
  return playerPosition;
}

// ===== DIFFICULTY =====
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export function adjustAISuccessRate(rate: number, difficulty: Difficulty): number {
  switch (difficulty) {
    case 'Easy': return Math.max(5, rate - 20);
    case 'Hard': return Math.min(95, rate + 15);
    default: return rate;
  }
}

export function adjustAISubChance(chance: number, difficulty: Difficulty): number {
  switch (difficulty) {
    case 'Easy': return chance * 0.5;
    case 'Hard': return Math.min(95, chance + 10);
    default: return chance;
  }
}

// ===== GAME STATE =====
export interface StatusMessage {
  message: string;
  emoji: string;
  type: 'success' | 'fail' | 'crit' | 'submission' | 'exhaustion' | 'info';
}

export interface GameResult {
  result: 'win' | 'loss';
  finisher: string;
  rounds: number;
  playerStaminaLeft: number;
  aiStaminaLeft: number;
  maxMomentum: number;
  type: 'submission' | 'exhaustion' | 'decision';
  difficulty: Difficulty;
}

export interface MoveLogEntry {
  round: number;
  actor: 'player' | 'ai';
  moveName: string;
  success: boolean;
  resultPosition: Position;
  isCrit?: boolean;
  isSubmission?: boolean;
  submissionName?: string;
}

export interface GameState {
  position: Position;
  round: number;
  playerStamina: number;
  aiStamina: number;
  momentum: number;
  maxMomentum: number;
  isAnimating: boolean;
  isSuddenDeath: boolean;
  statusMessage: StatusMessage | null;
  gameResult: GameResult | null;
  isCritical: boolean;
  difficulty: Difficulty;
  moveLog: MoveLogEntry[];
  comboCount: number;
  lastPositionBeforeMove: Position;
  bigEmoji: string | null;
  opponentTaunt: string | null;
}

export function createInitialGameState(difficulty: Difficulty): GameState {
  return {
    position: 'Standing',
    round: 1,
    playerStamina: 100,
    aiStamina: 100,
    momentum: 0,
    maxMomentum: 0,
    isAnimating: false,
    isSuddenDeath: false,
    statusMessage: null,
    gameResult: null,
    isCritical: false,
    difficulty,
    moveLog: [],
    comboCount: 0,
    lastPositionBeforeMove: 'Standing',
    bigEmoji: null,
    opponentTaunt: null,
  };
}

// ===== TAUNTS =====
const SUCCESS_TAUNTS = ["Not bad...", "Is that all you got?", "Oss!", "I see you training", "Interesting...", "You're getting tired"];
const FAIL_TAUNTS = ["Lucky.", "That won't work twice", "Nice try", "Almost had me"];

function randomTaunt(success: boolean): string {
  const arr = success ? SUCCESS_TAUNTS : FAIL_TAUNTS;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== QUOTES =====
export const BJJ_QUOTES = [
  "A black belt is a white belt who never gave up.",
  "Tap, snap, or nap. The choice is yours.",
  "Position before submission.",
  "The ground is my ocean. I'm the shark.",
  "Jiu-jitsu is the gentle art of folding clothes while people are still wearing them.",
  "Flow with the go.",
  "Every expert was once a beginner.",
  "Be water, my friend.",
  "There is no losing in jiu-jitsu. You either win or you learn.",
  "The more you sweat in training, the less you bleed in combat.",
  "Discipline equals freedom.",
  "In jiu-jitsu, pressure makes diamonds.",
];

// ===== PROCESS PLAYER MOVE =====
export interface MoveOutcome {
  newState: GameState;
  playerMoveSuccess: boolean;
  playerIsCrit: boolean;
  playerSubmission: boolean;
  aiMoveSuccess: boolean;
  aiIsCrit: boolean;
  aiSubmission: boolean;
  aiMoveName: string;
  playerStatusMessage: StatusMessage;
  aiStatusMessage: StatusMessage | null;
}

export function processPlayerMove(state: GameState, moveIndex: number, playerRank: Rank): MoveOutcome {
  const moves = PLAYER_MOVES[state.position];
  const move = moves[moveIndex];
  
  let newState = { ...state };
  newState.lastPositionBeforeMove = state.position;
  newState.isAnimating = true;
  
  // Deduct player stamina
  newState.playerStamina = Math.max(0, newState.playerStamina - move.staminaCost);
  
  // Check player exhaustion
  if (newState.playerStamina <= 0) {
    newState.gameResult = {
      result: 'loss',
      finisher: 'Exhaustion',
      rounds: newState.round,
      playerStaminaLeft: 0,
      aiStaminaLeft: newState.aiStamina,
      maxMomentum: newState.maxMomentum,
      type: 'exhaustion',
      difficulty: newState.difficulty,
    };
    return {
      newState,
      playerMoveSuccess: false,
      playerIsCrit: false,
      playerSubmission: false,
      aiMoveSuccess: false,
      aiIsCrit: false,
      aiSubmission: false,
      aiMoveName: '',
      playerStatusMessage: { message: 'EXHAUSTED!', emoji: '😵', type: 'fail' },
      aiStatusMessage: null,
    };
  }
  
  // Roll player move
  let effectiveRate = move.successRate;
  
  // Low-stamina penalty: when stamina < 30, reduce success rate (original game behavior)
  if (newState.playerStamina < 30) {
    effectiveRate *= (0.7 + newState.playerStamina / 100);
  }
  
  const playerIsCrit = Math.random() < CRIT_CHANCE;
  if (playerIsCrit) effectiveRate += CRIT_BONUS;
  if (state.momentum >= 3) effectiveRate += MOMENTUM_BONUS;
  
  // Combo bonus
  if (state.comboCount >= 3) effectiveRate += 10;
  else if (state.comboCount >= 2) effectiveRate += 5;
  
  effectiveRate = Math.min(99, effectiveRate);
  
  const playerSuccess = Math.random() * 100 < effectiveRate;
  let playerSubmission = false;
  let playerStatusMessage: StatusMessage;
  
  if (playerSuccess) {
    newState.position = move.successPosition;
    newState.momentum = Math.min(3, newState.momentum + 1);
    newState.maxMomentum = Math.max(newState.maxMomentum, newState.momentum);
    
    // Check combo
    if (isPositionAdvance(state.position, move.successPosition)) {
      newState.comboCount = state.comboCount + 1;
    } else {
      newState.comboCount = 0;
    }
    
    // Check submission
    if (move.submissionChance) {
      let subRate = move.submissionChance;
      if (playerIsCrit) subRate += CRIT_BONUS;
      if (state.momentum >= 3) subRate += MOMENTUM_SUB_BONUS;
      subRate = Math.min(99, subRate);
      
      if (Math.random() * 100 < subRate) {
        playerSubmission = true;
        newState.gameResult = {
          result: 'win',
          finisher: move.submissionName || 'Submission',
          rounds: newState.round,
          playerStaminaLeft: newState.playerStamina,
          aiStaminaLeft: newState.aiStamina,
          maxMomentum: newState.maxMomentum,
          type: 'submission',
          difficulty: newState.difficulty,
        };
        playerStatusMessage = {
          message: `SUBMISSION! ${move.submissionName}`,
          emoji: '🏆',
          type: 'submission',
        };
        return {
          newState,
          playerMoveSuccess: true,
          playerIsCrit,
          playerSubmission: true,
          aiMoveSuccess: false,
          aiIsCrit: false,
          aiSubmission: false,
          aiMoveName: '',
          playerStatusMessage,
          aiStatusMessage: null,
        };
      }
    }
    
    if (playerIsCrit) {
      playerStatusMessage = { message: `CRITICAL HIT! ${move.name}!`, emoji: '⚡', type: 'crit' };
    } else {
      playerStatusMessage = { message: `${move.name}!`, emoji: '💥', type: 'success' };
    }
  } else {
    newState.position = move.failPosition;
    newState.momentum = 0;
    newState.comboCount = 0;
    playerStatusMessage = { message: `${move.name} defended!`, emoji: '🛡️', type: 'fail' };
  }
  
  // Log player move
  newState.moveLog = [...state.moveLog, {
    round: newState.round,
    actor: 'player',
    moveName: move.name,
    success: playerSuccess,
    resultPosition: newState.position,
    isCrit: playerIsCrit,
    isSubmission: playerSubmission,
  }];
  
  // ===== AI TURN =====
  const aiPosition = getAIPosition(newState.position);
  const aiMoves = AI_MOVES[aiPosition];
  
  let aiMoveChoice: AIMove;
  if (newState.difficulty === 'Hard') {
    // Pick best counter move (highest success rate)
    aiMoveChoice = aiMoves.reduce((best, m) => m.successRate > best.successRate ? m : best, aiMoves[0]);
  } else {
    aiMoveChoice = aiMoves[Math.floor(Math.random() * aiMoves.length)];
  }
  
  // Deduct AI stamina
  newState.aiStamina = Math.max(0, newState.aiStamina - aiMoveChoice.staminaCost);
  
  // Check AI exhaustion
  if (newState.aiStamina <= 0) {
    newState.gameResult = {
      result: 'win',
      finisher: 'Opponent Exhausted',
      rounds: newState.round,
      playerStaminaLeft: newState.playerStamina,
      aiStaminaLeft: 0,
      maxMomentum: newState.maxMomentum,
      type: 'exhaustion',
      difficulty: newState.difficulty,
    };
    return {
      newState,
      playerMoveSuccess: playerSuccess,
      playerIsCrit,
      playerSubmission: false,
      aiMoveSuccess: false,
      aiIsCrit: false,
      aiSubmission: false,
      aiMoveName: aiMoveChoice.name,
      playerStatusMessage,
      aiStatusMessage: { message: 'OPPONENT EXHAUSTED!', emoji: '😵', type: 'exhaustion' },
    };
  }
  
  // Roll AI move
  let aiEffectiveRate = adjustAISuccessRate(aiMoveChoice.successRate, newState.difficulty);
  const aiIsCrit = Math.random() < CRIT_CHANCE;
  if (aiIsCrit) aiEffectiveRate += CRIT_BONUS;
  aiEffectiveRate = Math.min(99, aiEffectiveRate);
  
  const aiSuccess = Math.random() * 100 < aiEffectiveRate;
  let aiSubmission = false;
  let aiStatusMessage: StatusMessage | null = null;
  
  if (aiSuccess && aiMoveChoice.submissionChance) {
    let aiSubRate = adjustAISubChance(aiMoveChoice.submissionChance, newState.difficulty) * 0.7;
    if (aiIsCrit) aiSubRate += CRIT_BONUS;
    aiSubRate = Math.min(99, aiSubRate);
    
    if (Math.random() * 100 < aiSubRate) {
      aiSubmission = true;
      newState.gameResult = {
        result: 'loss',
        finisher: aiMoveChoice.submissionName || 'Submission',
        rounds: newState.round,
        playerStaminaLeft: newState.playerStamina,
        aiStaminaLeft: newState.aiStamina,
        maxMomentum: newState.maxMomentum,
        type: 'submission',
        difficulty: newState.difficulty,
      };
      aiStatusMessage = {
        message: `AI ${aiMoveChoice.submissionName}!`,
        emoji: '💀',
        type: 'submission',
      };
    }
  }
  
  if (!aiSubmission) {
    newState.opponentTaunt = randomTaunt(aiSuccess);
  }
  
  // Log AI move
  newState.moveLog = [...newState.moveLog, {
    round: newState.round,
    actor: 'ai',
    moveName: aiMoveChoice.name,
    success: aiSuccess,
    resultPosition: newState.position,
    isCrit: aiIsCrit,
    isSubmission: aiSubmission,
  }];
  
  // Advance round
  newState.round = newState.round + 1;
  
  // Check sudden death (round > MAX_ROUNDS)
  if (newState.round > MAX_ROUNDS && !newState.gameResult) {
    newState.isSuddenDeath = true;
    // Lower stamina wins
    if (newState.playerStamina > newState.aiStamina) {
      newState.gameResult = {
        result: 'win',
        finisher: 'Decision (Stamina Advantage)',
        rounds: MAX_ROUNDS,
        playerStaminaLeft: newState.playerStamina,
        aiStaminaLeft: newState.aiStamina,
        maxMomentum: newState.maxMomentum,
        type: 'decision',
        difficulty: newState.difficulty,
      };
    } else {
      newState.gameResult = {
        result: 'loss',
        finisher: 'Decision (Stamina Disadvantage)',
        rounds: MAX_ROUNDS,
        playerStaminaLeft: newState.playerStamina,
        aiStaminaLeft: newState.aiStamina,
        maxMomentum: newState.maxMomentum,
        type: 'decision',
        difficulty: newState.difficulty,
      };
    }
  }
  
  return {
    newState,
    playerMoveSuccess: playerSuccess,
    playerIsCrit,
    playerSubmission: false,
    aiMoveSuccess: aiSuccess,
    aiIsCrit,
    aiSubmission,
    aiMoveName: aiMoveChoice.name,
    playerStatusMessage,
    aiStatusMessage,
  };
}

export function isMoveAvailable(move: Move, rank: Rank): boolean {
  if (!move.requiredRank) return true;
  const reqIdx = RANKS.findIndex(r => r.name === move.requiredRank);
  const currentIdx = RANKS.indexOf(rank);
  return currentIdx >= reqIdx;
}

export function getPositionGradient(position: Position): string {
  if (DOMINANT_POSITIONS.includes(position)) {
    return 'radial-gradient(circle at center, rgba(200,162,76,0.15) 0%, rgba(200,162,76,0.05) 40%, transparent 70%)';
  }
  if (position === 'Guard (Bottom)') {
    return 'radial-gradient(circle at center, rgba(224,85,85,0.1) 0%, rgba(224,85,85,0.03) 40%, transparent 70%)';
  }
  return 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)';
}
