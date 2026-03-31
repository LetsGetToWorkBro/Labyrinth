import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import logoImg from '@assets/logo-maze.webp';
import posStanding from '@assets/pos-standing.png';
import posGuardTop from '@assets/pos-guard-top.png';
import posGuardBottom from '@assets/pos-guard-bottom.png';
import posSideControl from '@assets/pos-side-control.png';
import posMount from '@assets/pos-mount.png';
import posBackMount from '@assets/pos-back-mount.png';
import posHalfGuard from '@assets/pos-half-guard.png';
import {
  GameState, GameResult, MoveLogEntry, StatusMessage,
  createInitialGameState, processPlayerMove, isMoveAvailable,
  getRank, getNextRank, getRankIndex, getPositionGradient,
  PLAYER_MOVES, POSITION_ICONS, POSITION_DESCRIPTIONS,
  DOMINANT_POSITIONS, RANKS, BJJ_QUOTES, MAX_ROUNDS,
  Rank, Position, Difficulty, Move,
} from '@/lib/gameEngine';

const POSITION_IMAGES: Record<Position, string> = {
  'Standing': posStanding,
  'Guard (Top)': posGuardTop,
  'Guard (Bottom)': posGuardBottom,
  'Side Control': posSideControl,
  'Mount': posMount,
  'Back Mount': posBackMount,
  'Half Guard': posHalfGuard,
};

// ===== APP STATE (no localStorage) =====
interface AppState {
  wins: number;
  losses: number;
  streak: number;
  lossStreak: number;
  recentMatches: GameResult[];
  view: 'hub' | 'difficulty' | 'game';
}

function GamesPage() {
  const [appState, setAppState] = useState<AppState>({
    wins: 0, losses: 0, streak: 0, lossStreak: 0, recentMatches: [], view: 'hub',
  });

  const rank = getRank(appState.wins);
  const nextRank = getNextRank(appState.wins);

  const startGame = (difficulty: Difficulty) => {
    setAppState(s => ({ ...s, view: 'game', currentDifficulty: difficulty } as any));
    setGameDifficulty(difficulty);
  };

  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('Medium');

  const handleGameEnd = useCallback((result: GameResult) => {
    setAppState(prev => {
      const isWin = result.result === 'win';
      let newWins = prev.wins;
      let newLosses = prev.losses;
      let newStreak = prev.streak;
      let newLossStreak = prev.lossStreak;

      if (isWin) {
        const streakBonus = prev.streak >= 2 ? 2 : 1; // 3-win streak (0-indexed next will be 3) = double
        newWins = prev.wins + streakBonus;
        newStreak = prev.streak + 1;
        newLossStreak = 0;
      } else {
        newLosses = prev.losses + 1;
        newStreak = 0;
        newLossStreak = prev.lossStreak + 1;
        // Loss penalty: after 3 consecutive losses, lose 1 win point
        if (newLossStreak >= 3) {
          newWins = Math.max(0, prev.wins - 1);
          newLossStreak = 0; // Reset counter after penalty
        }
      }

      return {
        ...prev,
        wins: newWins,
        losses: newLosses,
        streak: newStreak,
        lossStreak: newLossStreak,
        recentMatches: [result, ...prev.recentMatches].slice(0, 5),
      };
    });
  }, []);

  const goToHub = () => setAppState(s => ({ ...s, view: 'hub' }));

  if (appState.view === 'hub' || appState.view === 'difficulty') {
    return (
      <GamesHub
        appState={appState}
        rank={rank}
        nextRank={nextRank}
        onPlay={() => setAppState(s => ({ ...s, view: 'difficulty' }))}
        onStartGame={startGame}
        showDifficulty={appState.view === 'difficulty'}
        onBack={goToHub}
      />
    );
  }

  return (
    <BJJChessGame
      difficulty={gameDifficulty}
      rank={rank}
      wins={appState.wins}
      onGameEnd={handleGameEnd}
      onExit={goToHub}
    />
  );
}

// ===== GAMES HUB =====
interface GamesHubProps {
  appState: AppState;
  rank: Rank;
  nextRank: Rank | null;
  onPlay: () => void;
  onStartGame: (d: Difficulty) => void;
  showDifficulty: boolean;
  onBack: () => void;
}

function GamesHub({ appState, rank, nextRank, onPlay, onStartGame, showDifficulty, onBack }: GamesHubProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(i => (i + 1) % BJJ_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const winsToNext = nextRank ? nextRank.minWins - appState.wins : 0;
  const progressToNext = nextRank
    ? ((appState.wins - rank.minWins) / (nextRank.minWins - rank.minWins)) * 100
    : 100;

  return (
    <div style={{
      minHeight: '100dvh',
      maxWidth: 430,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      background: '#0A0A0A',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 20px 12px', gap: 10,
      }}>
        <img src={logoImg} alt="Labyrinth" style={{ height: 28, opacity: 0.9 }} />
        <span style={{ color: '#C8A24C', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>GAMES</span>
      </div>

      {/* Rank Card */}
      <div style={{
        margin: '8px 16px 0',
        background: '#1A1A1A',
        borderRadius: 16,
        padding: '20px',
        border: `1.5px solid ${rank.color}33`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${rank.color}, ${rank.color}88, ${rank.color})`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s ease-in-out infinite',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `linear-gradient(135deg, ${rank.color}22, ${rank.color}44)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, animation: 'rankUpPulse 3s ease-in-out infinite',
          }}>
            {rank.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: rank.color, fontSize: 18, fontWeight: 700 }}>{rank.name}</div>
            <div style={{ color: '#999', fontSize: 13, marginTop: 2 }}>
              {appState.wins} wins · {appState.losses} losses
              {appState.streak >= 2 && <span style={{ color: '#C8A24C' }}> · 🔥 {appState.streak} streak</span>}
            </div>
            {nextRank && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  height: 4, borderRadius: 2, background: '#222',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})`,
                    width: `${Math.min(100, progressToNext)}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <div style={{ color: '#666', fontSize: 11, marginTop: 3 }}>
                  {winsToNext} wins to {nextRank.emoji} {nextRank.name}
                </div>
              </div>
            )}
            {!nextRank && (
              <div style={{ color: '#C8A24C', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                MAX RANK ACHIEVED ⭐
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quote */}
      <div style={{
        margin: '16px 16px 0', padding: '14px 18px',
        background: '#111', borderRadius: 12,
        borderLeft: '3px solid #C8A24C33',
      }}>
        <div key={quoteIdx} style={{
          color: '#999', fontSize: 13, fontStyle: 'italic', lineHeight: 1.5,
          animation: 'fadeIn 0.5s ease',
        }}>
          "{BJJ_QUOTES[quoteIdx]}"
        </div>
      </div>

      {/* Game Card */}
      <div style={{
        margin: '20px 16px 0',
        background: '#1A1A1A',
        borderRadius: 16,
        padding: '20px',
        border: '1px solid #222',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #C8A24C22, #C8A24C44)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>♟️</div>
          <div>
            <div style={{ color: '#F0F0F0', fontSize: 16, fontWeight: 700 }}>BJJ Position Chess</div>
            <div style={{ color: '#999', fontSize: 12 }}>Outsmart the AI in 12 rounds</div>
          </div>
        </div>
        <div style={{ color: '#666', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
          Navigate positions, chain combos, and hunt for submissions. Every move costs stamina — manage it wisely or tap out from exhaustion.
        </div>

        {!showDifficulty ? (
          <button
            data-testid="button-play"
            onClick={onPlay}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              background: 'linear-gradient(135deg, #C8A24C, #A08030)',
              color: '#0A0A0A', fontWeight: 700, fontSize: 15,
              border: 'none', cursor: 'pointer',
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Play
          </button>
        ) : (
          <div style={{ animation: 'popupIn 0.25s ease' }}>
            <div style={{ color: '#999', fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              Select Difficulty
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  data-testid={`button-difficulty-${d.toLowerCase()}`}
                  onClick={() => onStartGame(d)}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10,
                    background: d === 'Easy' ? '#1a2a1a' : d === 'Medium' ? '#2a2a1a' : '#2a1a1a',
                    border: `1px solid ${d === 'Easy' ? '#2a4a2a' : d === 'Medium' ? '#4a4a2a' : '#4a2a2a'}`,
                    color: d === 'Easy' ? '#4CAF50' : d === 'Medium' ? '#C8A24C' : '#E05555',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                  onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {d}
                </button>
              ))}
            </div>
            <button
              onClick={onBack}
              style={{
                width: '100%', marginTop: 8, padding: '10px',
                background: 'transparent', border: '1px solid #333',
                borderRadius: 10, color: '#999', fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Recent Matches */}
      <div style={{ margin: '20px 16px 0' }}>
        <div style={{ color: '#999', fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
          Recent Matches
        </div>
        {appState.recentMatches.length === 0 ? (
          <div style={{
            background: '#111', borderRadius: 12, padding: '32px 20px',
            textAlign: 'center', color: '#666', fontSize: 13,
          }}>
            No matches yet. Start your first game!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {appState.recentMatches.map((m, i) => (
              <div key={i} style={{
                background: '#111', borderRadius: 10, padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderLeft: `3px solid ${m.result === 'win' ? '#C8A24C' : '#E05555'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{m.result === 'win' ? '🏆' : '💀'}</span>
                  <div>
                    <div style={{
                      color: m.result === 'win' ? '#C8A24C' : '#E05555',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {m.result === 'win' ? 'Victory' : 'Defeat'}
                    </div>
                    <div style={{ color: '#666', fontSize: 11 }}>
                      {m.finisher} · R{m.rounds} · {m.difficulty}
                    </div>
                  </div>
                </div>
                <div style={{ color: '#666', fontSize: 11 }}>
                  {m.playerStaminaLeft}❤️
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div style={{
        margin: '20px 16px 0',
        background: '#111', borderRadius: 12, padding: '14px 16px',
        display: 'flex', justifyContent: 'space-around',
      }}>
        <StatItem label="Win Rate" value={appState.wins + appState.losses > 0 ? `${Math.round((appState.wins / (appState.wins + appState.losses)) * 100)}%` : '—'} />
        <StatItem label="Streak" value={appState.streak > 0 ? `🔥 ${appState.streak}` : '0'} />
        <StatItem label="Rank" value={rank.emoji} />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#F0F0F0', fontSize: 16, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}


// ===== BJJ CHESS GAME =====
interface BJJChessGameProps {
  difficulty: Difficulty;
  rank: Rank;
  wins: number;
  onGameEnd: (result: GameResult) => void;
  onExit: () => void;
}

function BJJChessGame({ difficulty, rank, wins, onGameEnd, onExit }: BJJChessGameProps) {
  const [game, setGame] = useState<GameState>(() => createInitialGameState(difficulty));
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState<StatusMessage | null>(null);
  const [bigEmoji, setBigEmoji] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [comboText, setComboText] = useState<string | null>(null);
  const [positionKey, setPositionKey] = useState(0);
  const [showRankUp, setShowRankUp] = useState(false);
  const [newRankData, setNewRankData] = useState<Rank | null>(null);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [opponentTaunt, setOpponentTaunt] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [submissionFlash, setSubmissionFlash] = useState<'gold' | 'red' | null>(null);
  const [floatingNumbers, setFloatingNumbers] = useState<{id: number, value: string, x: number, type: 'damage' | 'heal'}[]>([]);
  const gameEndedRef = useRef(false);
  const animatingRef = useRef(false);

  const currentRank = getRank(wins);
  const nextRankObj = getNextRank(wins);

  const moves = PLAYER_MOVES[game.position];

  const handleMove = useCallback((moveIndex: number) => {
    if (animatingRef.current || game.gameResult) return;
    animatingRef.current = true;

    const outcome = processPlayerMove(game, moveIndex, currentRank);

    // Screen shake on crits and submissions
    if (outcome.playerIsCrit || outcome.playerSubmission || outcome.aiSubmission) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }

    // Explosion ring on submissions
    if (outcome.playerSubmission || outcome.aiSubmission) {
      setShowExplosion(true);
      setTimeout(() => setShowExplosion(false), 1000);
    }

    // Full-screen submission flash
    if (outcome.playerSubmission) {
      setSubmissionFlash('gold');
      setTimeout(() => setSubmissionFlash(null), 800);
    } else if (outcome.aiSubmission) {
      setSubmissionFlash('red');
      setTimeout(() => setSubmissionFlash(null), 800);
    }

    // Floating damage numbers
    const staminaCost = PLAYER_MOVES[game.position][moveIndex].staminaCost;
    setFloatingNumbers(prev => [...prev, {
      id: Date.now(),
      value: `-${staminaCost}`,
      x: 30 + Math.random() * 40,
      type: 'damage' as const
    }]);
    setTimeout(() => {
      setFloatingNumbers(prev => prev.slice(1));
    }, 1500);

    // Show player move overlay
    setOverlayMsg(outcome.playerStatusMessage);
    setShowOverlay(true);

    // Big emoji
    const emojiMap: Record<string, string> = {
      success: '💥', fail: '🛡️', crit: '⚡', submission: '🏆', exhaustion: '😵',
    };
    setBigEmoji(emojiMap[outcome.playerStatusMessage.type] || '💥');

    // Position change animation
    if (outcome.newState.position !== game.position) {
      setPositionKey(k => k + 1);
    }

    // Combo text
    if (outcome.newState.comboCount >= 3) {
      setComboText('UNSTOPPABLE! 🔥🔥🔥');
    } else if (outcome.newState.comboCount >= 2) {
      setComboText('COMBO! 🔥');
    } else {
      setComboText(null);
    }

    setTimeout(() => {
      setBigEmoji(null);
      setShowOverlay(false);

      // Show AI taunt
      if (outcome.newState.opponentTaunt && !outcome.newState.gameResult) {
        setOpponentTaunt(outcome.newState.opponentTaunt);
        setTimeout(() => setOpponentTaunt(null), 1500);
      }

      // If AI had a status, show it briefly
      if (outcome.aiStatusMessage && !outcome.playerSubmission) {
        setBigEmoji(outcome.aiStatusMessage.type === 'exhaustion' ? '😵' : '💀');
        setTimeout(() => setBigEmoji(null), 800);
      }

      setGame(outcome.newState);
      animatingRef.current = false;

      // Handle game end
      if (outcome.newState.gameResult && !gameEndedRef.current) {
        gameEndedRef.current = true;
        onGameEnd(outcome.newState.gameResult);

        // Check rank up
        if (outcome.newState.gameResult.result === 'win') {
          const oldRank = getRank(wins);
          const streakBonus = 0; // already calculated in parent
          const newWins = wins + 1; // approximate
          const newRank = getRank(newWins);
          if (getRankIndex(newWins) > getRankIndex(wins)) {
            setNewRankData(newRank);
            setShowRankUp(true);
            setTimeout(() => {
              setShowRankUp(false);
              setTimeout(() => setShowEndScreen(true), 200);
            }, 3000);
            return;
          }
        }

        setTimeout(() => setShowEndScreen(true), 600);
      }
    }, 1400);
  }, [game, currentRank, wins, onGameEnd]);

  const handleReset = useCallback(() => {
    gameEndedRef.current = false;
    animatingRef.current = false;
    setGame(createInitialGameState(difficulty));
    setShowEndScreen(false);
    setShowOverlay(false);
    setBigEmoji(null);
    setComboText(null);
    setOpponentTaunt(null);
    setShowLog(false);
    setShaking(false);
    setShowExplosion(false);
    setSubmissionFlash(null);
    setFloatingNumbers([]);
  }, [difficulty]);

  // ===== RENDER: END SCREEN =====
  if (showEndScreen && game.gameResult) {
    return (
      <GameEndScreen
        result={game.gameResult}
        rank={currentRank}
        wins={wins}
        onPlayAgain={handleReset}
        onExit={onExit}
      />
    );
  }

  const progressToNext = nextRankObj
    ? ((wins - currentRank.minWins) / (nextRankObj.minWins - currentRank.minWins)) * 100
    : 100;

  return (
    <div style={{
      height: '100dvh',
      maxWidth: 430,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      background: '#0A0A0A',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      animation: shaking ? 'screenShake 0.5s ease' : (game.playerStamina < 30 ? 'lowStaminaPulse 2s ease-in-out infinite' : undefined),
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px',
        background: '#0A0A0A',
        borderBottom: '1px solid #1A1A1A',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button
          data-testid="button-exit"
          onClick={onExit}
          style={{
            background: 'transparent', border: 'none', color: '#999',
            fontSize: 14, cursor: 'pointer', padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← Games
        </button>
        <div style={{ color: '#F0F0F0', fontSize: 14, fontWeight: 700 }}>
          {game.round > MAX_ROUNDS ? 'Sudden Death' : `Round ${Math.min(game.round, MAX_ROUNDS)}/${MAX_ROUNDS}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14 }}>{currentRank.emoji}</span>
          <span style={{ color: currentRank.color, fontSize: 12, fontWeight: 600 }}>
            {currentRank.name.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Rank progress bar */}
      <div style={{ padding: '0 16px', flexShrink: 0 }}>
        <div style={{ height: 2, background: '#1A1A1A', borderRadius: 1 }}>
          <div style={{
            height: '100%', borderRadius: 1,
            background: currentRank.color,
            width: `${Math.min(100, progressToNext)}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Stamina Bars */}
      <div style={{ padding: '10px 16px 6px', flexShrink: 0 }}>
        {/* Player Stamina */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ color: '#999', fontSize: 11, fontWeight: 600, width: 36, flexShrink: 0 }}>YOU</span>
          <div style={{ flex: 1, height: 10, background: '#1A1A1A', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              background: game.playerStamina > 30
                ? 'linear-gradient(90deg, #C8A24C, #DAB85C)'
                : game.playerStamina > 15
                  ? 'linear-gradient(90deg, #E0A030, #C88020)'
                  : 'linear-gradient(90deg, #E05555, #C03030)',
              width: `${game.playerStamina}%`,
              transition: 'width 0.4s ease',
              animation: game.playerStamina <= 20 ? 'staminaPulse 1s ease infinite' : 'none',
            }} />
          </div>
          <span style={{
            color: game.playerStamina <= 20 ? '#E05555' : '#F0F0F0',
            fontSize: 12, fontWeight: 700, width: 28, textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {game.playerStamina}
          </span>
          {/* Momentum stars */}
          <div style={{ display: 'flex', gap: 1, width: 40 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                fontSize: 10,
                opacity: i < game.momentum ? 1 : 0.2,
                color: '#C8A24C',
                transition: 'opacity 0.3s ease',
              }}>
                ★
              </span>
            ))}
          </div>
        </div>
        {/* Opponent Stamina */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#666', fontSize: 11, fontWeight: 600, width: 36, flexShrink: 0 }}>OPP</span>
          <div style={{ flex: 1, height: 10, background: '#1A1A1A', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 5,
              background: game.aiStamina > 30
                ? 'linear-gradient(90deg, #555, #666)'
                : 'linear-gradient(90deg, #E05555, #C03030)',
              width: `${game.aiStamina}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{
            color: '#999', fontSize: 12, fontWeight: 700, width: 28, textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {game.aiStamina}
          </span>
          <div style={{
            width: 40, display: 'flex', justifyContent: 'flex-end',
          }}>
            <div style={{
              background: '#222', borderRadius: 4, padding: '1px 5px',
              color: '#666', fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            }}>AI</div>
          </div>
        </div>
      </div>

      {/* Opponent Taunt */}
      {opponentTaunt && (
        <div style={{
          padding: '0 16px', flexShrink: 0,
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#1A1A1A', borderRadius: 8, padding: '6px 12px',
            color: '#666', fontSize: 12, fontStyle: 'italic',
            textAlign: 'right',
          }}>
            "{opponentTaunt}" — AI
          </div>
        </div>
      )}

      {/* Position Display — fills remaining space */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: getPositionGradient(game.position),
        transition: 'background 0.5s ease',
      }}>
        {/* Radar circles */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute',
              width: 150 + i * 80,
              height: 150 + i * 80,
              borderRadius: '50%',
              border: `1px solid ${DOMINANT_POSITIONS.includes(game.position) ? 'rgba(200,162,76,0.12)' : 'rgba(255,255,255,0.04)'}`,
              animation: `radarPulse ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }} />
          ))}
        </div>

        {/* Explosion ring on submissions */}
        {showExplosion && (
          <>
            {[0, 1, 2].map(i => (
              <div key={`explosion-${i}`} style={{
                position: 'absolute',
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '4px solid',
                borderColor: i === 0 ? '#C8A24C' : i === 1 ? 'rgba(200,162,76,0.6)' : 'rgba(200,162,76,0.3)',
                animation: `explosionRing 0.8s ease-out forwards`,
                animationDelay: `${i * 0.15}s`,
                pointerEvents: 'none',
                zIndex: 25,
              }} />
            ))}
          </>
        )}

        {/* Floating damage numbers */}
        {floatingNumbers.map(fn => (
          <div key={fn.id} style={{
            position: 'absolute',
            left: `${fn.x}%`,
            top: '40%',
            color: fn.type === 'damage' ? '#E05555' : '#4CAF50',
            fontSize: 24,
            fontWeight: 900,
            animation: 'floatUp 1.5s ease-out forwards',
            pointerEvents: 'none',
            zIndex: 15,
            textShadow: '0 0 10px rgba(224,85,85,0.5)',
          }}>
            {fn.value}
          </div>
        ))}

        {/* Combo text */}
        {comboText && (
          <div style={{
            position: 'absolute', top: 20,
            color: '#C8A24C', fontSize: 16, fontWeight: 800,
            animation: 'bounceIn 0.4s ease',
            textShadow: '0 0 20px rgba(200,162,76,0.5)',
            letterSpacing: 1,
          }}>
            {comboText}
          </div>
        )}

        {/* Position Icon + Name */}
        <div key={positionKey} style={{
          textAlign: 'center',
          animation: 'slideInRight 0.35s ease',
        }}>
          <img 
            src={POSITION_IMAGES[game.position]} 
            alt={game.position}
            style={{
              width: 140,
              height: 140,
              objectFit: 'contain',
              animation: 'pulseGlow 3s ease-in-out infinite',
              marginBottom: 12,
              filter: DOMINANT_POSITIONS.includes(game.position) 
                ? 'drop-shadow(0 0 20px rgba(200,162,76,0.4))' 
                : 'drop-shadow(0 0 12px rgba(255,255,255,0.15))',
              transition: 'filter 0.5s ease',
            }}
          />
          <div style={{
            color: DOMINANT_POSITIONS.includes(game.position) ? '#C8A24C' : '#F0F0F0',
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}>
            {game.position}
          </div>
          <div style={{
            color: '#666',
            fontSize: 13,
            marginTop: 4,
          }}>
            {POSITION_DESCRIPTIONS[game.position]}
          </div>
          {game.isSuddenDeath && (
            <div style={{
              color: '#E05555', fontSize: 13, fontWeight: 700, marginTop: 8,
              animation: 'staminaPulse 0.8s ease infinite',
            }}>
              ⚠️ SUDDEN DEATH
            </div>
          )}
        </div>

        {/* Big Emoji Burst */}
        {bigEmoji && (
          <div style={{
            position: 'absolute',
            fontSize: 120,
            animation: 'bigEmojiBurst 1.2s ease forwards',
            pointerEvents: 'none',
            zIndex: 20,
          }}>
            {bigEmoji}
          </div>
        )}
      </div>

      {/* Move Overlay */}
      {showOverlay && overlayMsg && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 30,
          pointerEvents: 'none',
          animation: overlayMsg.type === 'crit' ? 'critFlash 0.6s ease' : 
                     overlayMsg.type === 'success' ? 'goldFlash 0.6s ease' :
                     overlayMsg.type === 'fail' ? 'redFlash 0.6s ease' :
                     'goldFlash 0.6s ease',
        }}>
          <div style={{
            background: overlayMsg.type === 'submission' ? 'rgba(200,162,76,0.95)'
                       : overlayMsg.type === 'crit' ? 'rgba(200,162,76,0.9)'
                       : overlayMsg.type === 'fail' ? 'rgba(224,85,85,0.9)'
                       : 'rgba(200,162,76,0.85)',
            borderRadius: overlayMsg.type === 'submission' ? 20 : 16,
            padding: overlayMsg.type === 'submission' ? '24px 48px' : '16px 32px',
            animation: overlayMsg.type === 'submission' ? 'bigTextSlam 0.6s ease forwards' : 'victoryBurst 0.5s ease',
            textAlign: 'center',
            border: overlayMsg.type === 'crit' ? '2px solid #C8A24C' : overlayMsg.type === 'submission' ? '3px solid #C8A24C' : 'none',
            boxShadow: overlayMsg.type === 'crit' ? '0 0 40px rgba(200,162,76,0.5)' : overlayMsg.type === 'submission' ? '0 0 60px rgba(200,162,76,0.6)' : 'none',
          }}>
            <div style={{ fontSize: overlayMsg.type === 'submission' ? 48 : 32, marginBottom: overlayMsg.type === 'submission' ? 8 : 4 }}>{overlayMsg.emoji}</div>
            <div style={{
              color: '#0A0A0A',
              fontSize: overlayMsg.type === 'submission' ? 28 : 18,
              fontWeight: 800,
              letterSpacing: overlayMsg.type === 'submission' ? 1 : 0.5,
            }}>
              {overlayMsg.message}
            </div>
          </div>
        </div>
      )}

      {/* Move Cards */}
      <div style={{
        padding: '10px 12px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        flexShrink: 0,
        background: '#0A0A0A',
        borderTop: '1px solid #1A1A1A',
      }}>
        <div style={{
          color: '#666', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1.5, marginBottom: 8, textAlign: 'center',
        }}>
          Choose Your Move
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {moves.map((move, i) => {
            const available = isMoveAvailable(move, currentRank);
            const totalMoves = moves.length;
            const rotation = (i - (totalMoves - 1) / 2) * 1.2;
            return (
              <MoveCard
                key={`${game.position}-${i}`}
                move={move}
                available={available}
                rotation={rotation}
                disabled={animatingRef.current || !!game.gameResult}
                onClick={() => available && handleMove(i)}
              />
            );
          })}
        </div>

        {/* Bottom actions */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center',
        }}>
          <button
            data-testid="button-reset"
            onClick={handleReset}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'transparent', border: '1px solid #333',
              color: '#666', fontSize: 12, cursor: 'pointer',
            }}
          >
            Reset Match
          </button>
          <button
            data-testid="button-log"
            onClick={() => setShowLog(!showLog)}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'transparent', border: '1px solid #333',
              color: '#666', fontSize: 12, cursor: 'pointer',
            }}
          >
            {showLog ? 'Hide' : 'Show'} Log
          </button>
        </div>
      </div>

      {/* Move Log Drawer */}
      {showLog && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '50%',
          background: '#111',
          borderTop: '2px solid #C8A24C33',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          animation: 'slideUp 0.3s ease',
          overflowY: 'auto',
          zIndex: 40,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          <div style={{
            padding: '12px 16px 8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #1A1A1A',
            position: 'sticky', top: 0, background: '#111', zIndex: 1,
          }}>
            <span style={{ color: '#F0F0F0', fontSize: 14, fontWeight: 700 }}>Move History</span>
            <button
              onClick={() => setShowLog(false)}
              style={{
                background: 'transparent', border: 'none',
                color: '#999', fontSize: 18, cursor: 'pointer',
              }}
            >✕</button>
          </div>
          <div style={{ padding: '8px 16px 16px' }}>
            {game.moveLog.length === 0 ? (
              <div style={{ color: '#666', fontSize: 13, padding: 16, textAlign: 'center' }}>
                No moves yet
              </div>
            ) : (
              game.moveLog.map((entry, i) => (
                <div key={i} style={{
                  padding: '6px 0',
                  borderBottom: '1px solid #1A1A1A',
                  fontSize: 12,
                  display: 'flex',
                  gap: 6,
                  color: entry.isSubmission ? '#C8A24C' : entry.success ? '#F0F0F0' : '#E05555',
                }}>
                  <span style={{ color: '#666', minWidth: 26 }}>R{entry.round}</span>
                  <span style={{ color: '#999' }}>{entry.actor === 'player' ? 'You' : 'AI'}</span>
                  <span>→ {entry.moveName}</span>
                  <span>{entry.success ? '✅' : '❌'}</span>
                  {entry.isCrit && <span style={{ color: '#C8A24C' }}>⚡</span>}
                  <span style={{ color: '#666' }}>→ {entry.resultPosition}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Rank Up Celebration */}
      {showRankUp && newRankData && (
        <RankUpOverlay rank={newRankData} />
      )}

      {/* Full-screen submission flash */}
      {submissionFlash && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: submissionFlash === 'gold' 
            ? 'radial-gradient(circle, rgba(200,162,76,0.6) 0%, rgba(200,162,76,0) 70%)' 
            : 'radial-gradient(circle, rgba(224,85,85,0.6) 0%, rgba(224,85,85,0) 70%)',
          animation: 'submissionFlash 0.8s ease-out forwards',
          pointerEvents: 'none',
          zIndex: 100,
        }} />
      )}
    </div>
  );
}


// ===== MOVE CARD =====
interface MoveCardProps {
  move: Move;
  available: boolean;
  rotation: number;
  disabled: boolean;
  onClick: () => void;
}

function MoveCard({ move, available, rotation, disabled, onClick }: MoveCardProps) {
  const [hovered, setHovered] = useState(false);
  const isSubmission = !!move.submissionChance;

  return (
    <button
      data-testid={`button-move-${move.name.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
      disabled={disabled || !available}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={() => setHovered(true)}
      onTouchEnd={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: !available ? '#111' : hovered ? '#222' : '#1A1A1A',
        borderRadius: 12,
        padding: '12px 14px',
        border: isSubmission && available ? '1px solid #C8A24C33' : '1px solid #222',
        borderBottom: isSubmission && available ? '2px solid #C8A24C44' : '1px solid #222',
        cursor: available ? 'pointer' : 'default',
        opacity: !available ? 0.4 : disabled ? 0.6 : 1,
        transform: hovered && available ? `translateY(-3px) rotate(0deg)` : `rotate(${rotation}deg)`,
        transition: 'all 0.2s ease',
        width: '100%',
        textAlign: 'left',
        minHeight: 48,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{!available ? '🔒' : move.icon}</span>
        <div>
          <div style={{
            color: !available ? '#666' : isSubmission ? '#C8A24C' : '#F0F0F0',
            fontSize: 14,
            fontWeight: 600,
          }}>
            {move.name}
            {move.requiredRank && !available && (
              <span style={{ color: '#666', fontSize: 11, marginLeft: 6 }}>
                ({move.requiredRank})
              </span>
            )}
          </div>
          {isSubmission && available && (
            <div style={{ color: '#C8A24C', fontSize: 10, opacity: 0.7, marginTop: 1 }}>
              {move.submissionChance}% submission
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: '#E05555', fontSize: 11, fontWeight: 600 }}>
          -{move.staminaCost}⚡
        </span>
        <span style={{
          color: move.successRate >= 60 ? '#4CAF50' : move.successRate >= 40 ? '#C8A24C' : '#E05555',
          fontSize: 12, fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {move.successRate}%
        </span>
      </div>
    </button>
  );
}


// ===== RANK UP OVERLAY =====
function RankUpOverlay({ rank }: { rank: Rank }) {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(10,10,10,0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: -10,
          left: `${Math.random() * 100}%`,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: i % 3 === 0 ? '#C8A24C' : i % 3 === 1 ? rank.color : '#F0F0F0',
          animation: `particleFall ${2 + Math.random() * 2}s ease-in forwards`,
          animationDelay: `${Math.random() * 0.5}s`,
          ['--drift' as any]: `${(Math.random() - 0.5) * 100}px`,
          ['--spin' as any]: `${Math.random() * 720}deg`,
        }} />
      ))}
      <div style={{
        fontSize: 80,
        animation: 'victoryBurst 0.8s ease, rankUpPulse 1.5s ease-in-out infinite 0.8s',
      }}>
        {rank.emoji}
      </div>
      <div style={{
        marginTop: 24,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 3,
        color: '#999',
        textTransform: 'uppercase',
      }}>
        Promoted to
      </div>
      <div style={{
        marginTop: 8,
        fontSize: 28,
        fontWeight: 800,
        color: rank.color,
        background: `linear-gradient(90deg, ${rank.color}, #F0F0F0, ${rank.color})`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'shimmer 2s ease-in-out infinite',
      }}>
        {rank.name.toUpperCase()}!
      </div>
    </div>
  );
}


// ===== GAME END SCREEN =====
interface GameEndScreenProps {
  result: GameResult;
  rank: Rank;
  wins: number;
  onPlayAgain: () => void;
  onExit: () => void;
}

function GameEndScreen({ result, rank, wins, onPlayAgain, onExit }: GameEndScreenProps) {
  const isWin = result.result === 'win';
  const currentRank = getRank(wins);
  const nextRankObj = getNextRank(wins);
  const progressToNext = nextRankObj
    ? ((wins - currentRank.minWins) / (nextRankObj.minWins - currentRank.minWins)) * 100
    : 100;
  const winsToNext = nextRankObj ? nextRankObj.minWins - wins : 0;

  return (
    <div style={{
      height: '100dvh',
      maxWidth: 430,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: isWin
        ? 'linear-gradient(180deg, #0A0A0A 0%, #1a1505 50%, #0A0A0A 100%)'
        : 'linear-gradient(180deg, #0A0A0A 0%, #1a0a0a 50%, #0A0A0A 100%)',
      padding: '20px',
      paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
      animation: 'fadeIn 0.5s ease',
    }}>
      {/* Trophy/Skull */}
      <div style={{
        fontSize: 80,
        marginBottom: 20,
        animation: isWin ? 'victoryBurst 0.8s ease' : 'popupIn 0.5s ease',
        filter: isWin ? 'drop-shadow(0 0 30px rgba(200,162,76,0.4))' : 'none',
      }}>
        {isWin ? '🏆' : '💀'}
      </div>

      {/* Result text */}
      <div style={{
        fontSize: 28,
        fontWeight: 800,
        color: isWin ? '#C8A24C' : '#E05555',
        marginBottom: 4,
        textAlign: 'center',
        ...(isWin ? {
          background: 'linear-gradient(90deg, #C8A24C, #F0D078, #C8A24C)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 2s ease-in-out infinite',
        } : {}),
      }}>
        {isWin ? 'VICTORY' : 'DEFEAT'}
      </div>

      <div style={{
        color: isWin ? '#C8A24C' : '#E05555',
        fontSize: 14,
        fontWeight: 600,
        opacity: 0.8,
        marginBottom: 24,
      }}>
        {result.finisher}
      </div>

      {/* Stats Card */}
      <div style={{
        background: '#1A1A1A',
        borderRadius: 16,
        padding: '20px',
        width: '100%',
        maxWidth: 320,
        border: isWin ? '1px solid #C8A24C22' : '1px solid #222',
        marginBottom: 20,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <EndStatItem label="Rounds" value={`${result.rounds}`} />
          <EndStatItem label="Stamina Left" value={`${result.playerStaminaLeft}`} />
          <EndStatItem label="Peak Momentum" value={`${'★'.repeat(result.maxMomentum)}${'☆'.repeat(3 - result.maxMomentum)}`} />
          <EndStatItem label="Difficulty" value={result.difficulty} />
        </div>
      </div>

      {/* Rank Progress */}
      <div style={{
        background: '#1A1A1A',
        borderRadius: 12,
        padding: '14px 20px',
        width: '100%',
        maxWidth: 320,
        marginBottom: 28,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{ color: '#F0F0F0', fontSize: 13, fontWeight: 600 }}>
            {currentRank.emoji} {currentRank.name}
          </span>
          {nextRankObj && (
            <span style={{ color: '#666', fontSize: 11 }}>
              {winsToNext} wins to {nextRankObj.emoji}
            </span>
          )}
        </div>
        <div style={{ height: 6, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${currentRank.color}, ${nextRankObj?.color || currentRank.color})`,
            width: `${Math.min(100, progressToNext)}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 320 }}>
        <button
          data-testid="button-play-again"
          onClick={onPlayAgain}
          style={{
            flex: 1, padding: '14px', borderRadius: 12,
            background: 'linear-gradient(135deg, #C8A24C, #A08030)',
            color: '#0A0A0A', fontWeight: 700, fontSize: 15,
            border: 'none', cursor: 'pointer',
            transition: 'transform 0.1s ease',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Run It Back
        </button>
        <button
          data-testid="button-exit-games"
          onClick={onExit}
          style={{
            flex: 1, padding: '14px', borderRadius: 12,
            background: 'transparent',
            border: '1px solid #333',
            color: '#999', fontWeight: 600, fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Games
        </button>
      </div>
    </div>
  );
}

function EndStatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#F0F0F0', fontSize: 16, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}


export default GamesPage;
