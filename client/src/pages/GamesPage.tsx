import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft } from 'lucide-react';
import logoImg from '@assets/maze-gold-md.png';
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


// ===== APP STATE =====
import { useGameRecords } from '@/lib/game-records';
import { useAuth } from '@/lib/auth-context';
import { saveGameScore, getLeaderboard, type LeaderboardEntry } from '@/lib/api';
import { checkAndUnlockAchievements, ALL_ACHIEVEMENTS } from '@/lib/achievements';

function showBadgeUnlock(badge: { key: string; label: string; icon: string; desc: string; color?: string }) {
  const color = badge.color || '#C8A24C';
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 10000; animation: fadeInOverlay 0.3s ease-out forwards;
  `;
  overlay.innerHTML = `
    <div style="text-align:center;padding:40px;max-width:300px;animation:slideUpCard 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;">
      <div style="font-size:14px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-bottom:16px;">New Badge Unlocked</div>
      <div style="width:100px;height:100px;border-radius:50%;background:${color}22;border:3px solid ${color};
        display:flex;align-items:center;justify-content:center;margin:0 auto 20px;
        font-size:48px;box-shadow:0 0 30px ${color}66;animation:badgePulse 1s ease-in-out infinite alternate;">
        ${badge.icon}
      </div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">${badge.label}</div>
      <div style="font-size:14px;color:#888;line-height:1.5;">${badge.desc}</div>
      <div style="margin-top:24px;font-size:12px;color:#555;">Tap to dismiss</div>
    </div>
  `;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUpCard { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes badgePulse { from { box-shadow: 0 0 20px ${color}44; } to { box-shadow: 0 0 50px ${color}99; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);
  const dismiss = () => { overlay.remove(); style.remove(); };
  overlay.onclick = dismiss;
  setTimeout(dismiss, 4000);
}

function GamesPage() {
  const { stats, addRecord } = useGameRecords();
  const { member } = useAuth();

  const rank     = getRank(stats.wins);
  const nextRank = getNextRank(stats.wins);

  const [view, setView]           = useState<'hub' | 'difficulty' | 'game'>('hub');
  const [gameDifficulty, setGameDifficulty] = useState<Difficulty>('Medium');

  const startGame = (difficulty: Difficulty) => {
    setGameDifficulty(difficulty);
    setView('game');
  };

  // Hide tab bar during active game by setting a body attribute
  useEffect(() => {
    if (view === 'game') {
      document.body.setAttribute('data-game-active', 'true');
    } else {
      document.body.removeAttribute('data-game-active');
    }
    return () => document.body.removeAttribute('data-game-active');
  }, [view]);

  const handleGameEnd = useCallback((result: GameResult) => {
    addRecord({
      game: 'bjj',
      result: result.result === 'win' ? 'win' : 'loss',
      opponent: `AI (${result.difficulty})`,
      difficulty: result.difficulty,
      rounds: result.rounds,
      finisher: result.finisher,
    });

    // Push score to GAS leaderboard (fire-and-forget)
    if (member) {
      const currentRank = getRank(stats.wins + (result.result === 'win' ? 1 : 0));
      saveGameScore({
        wins:        stats.wins + (result.result === 'win' ? 1 : 0),
        losses:      stats.losses + (result.result === 'loss' ? 1 : 0),
        streak:      result.result === 'win' ? stats.streak + 1 : 0,
        bestStreak:  Math.max(stats.bestStreak, result.result === 'win' ? stats.streak + 1 : 0),
        topRankName: currentRank.name,
      }).catch(() => {});
    }

    // Check and unlock local achievements after game
    const profile = (() => { try { return JSON.parse(localStorage.getItem('lbjj_member_profile') || '{}'); } catch { return {}; } })();
    const gameStatsLocal = (() => { try { return JSON.parse(localStorage.getItem('lbjj_game_stats_v2') || '{}'); } catch { return {}; } })();
    const newlyEarned = checkAndUnlockAchievements(profile, gameStatsLocal);
    if (newlyEarned.length > 0) {
      const first = ALL_ACHIEVEMENTS.find(a => a.key === newlyEarned[0]);
      if (first) {
        showBadgeUnlock({ key: first.key, label: first.label, icon: first.icon, desc: first.desc, color: first.color });
        setTimeout(() => { window.location.hash = '#/achievements'; }, 3000);
      }
    }
  }, [stats, member, addRecord]);

  if (view === 'hub' || view === 'difficulty') {
    return (
      <GamesHub
        stats={stats}
        rank={rank}
        nextRank={nextRank}
        onPlay={() => setView('difficulty')}
        onStartGame={startGame}
        showDifficulty={view === 'difficulty'}
        onBack={() => setView('hub')}
      />
    );
  }

  return (
    <BJJChessGame
      difficulty={gameDifficulty}
      rank={rank}
      wins={stats.wins}
      onGameEnd={handleGameEnd}
      onExit={() => setView('hub')}
    />
  );
}

// ===== GAMES HUB =====
interface GamesHubProps {
  stats: ReturnType<typeof useGameRecords>['stats'];
  rank: Rank;
  nextRank: Rank | null;
  onPlay: () => void;
  onStartGame: (d: Difficulty) => void;
  showDifficulty: boolean;
  onBack: () => void;
}

function GamesHub({ stats, rank, nextRank, onPlay, onStartGame, showDifficulty, onBack }: GamesHubProps) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [hubTab, setHubTab]     = useState<'play' | 'leaderboard'>('play');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading]     = useState(false);
  const [lbLoaded, setLbLoaded]       = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(i => (i + 1) % BJJ_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hubTab === 'leaderboard' && !lbLoaded) {
      setLbLoading(true);
      getLeaderboard().then(data => {
        setLeaderboard(data);
        setLbLoaded(true);
        setLbLoading(false);
      }).catch(() => { setLbLoading(false); });
    }
  }, [hubTab, lbLoaded]);

  const winsToNext    = nextRank ? nextRank.minWins - stats.wins : 0;
  const progressToNext = nextRank
    ? ((stats.wins - rank.minWins) / (nextRank.minWins - rank.minWins)) * 100
    : 100;

  const GOLD = '#C8A24C';

  return (
    <div className="app-content" style={{
      maxWidth: 430, margin: '0 auto',
      display: 'flex', flexDirection: 'column', background: '#0A0A0A',
      overflowX: 'hidden', width: '100%',
      paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 70px))',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px', gap: 10 }}>
        <button onClick={() => window.history.back()} style={{
          background: 'none', border: 'none', padding: '8px',
          cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <img src={logoImg} alt="Labyrinth" style={{ height: 26, opacity: 0.9 }} />
          <span style={{ color: GOLD, fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>GAMES</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Hub tabs */}
      <div style={{ display: 'flex', margin: '0 16px 12px', gap: 4, padding: 4, backgroundColor: '#111', borderRadius: 12, border: '1px solid #1A1A1A' }}>
        {(['play', 'leaderboard'] as const).map(t => (
          <button key={t} onClick={() => setHubTab(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              backgroundColor: hubTab === t ? '#1A1A1A' : 'transparent',
              color: hubTab === t ? GOLD : '#666',
            }}
          >
            {t === 'play' ? '♟️ Play' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* ── Play tab ── */}
      {hubTab === 'play' && (
        <>
          {/* Rank Card */}
          <div style={{ margin: '0 16px 12px', background: '#1A1A1A', borderRadius: 16, padding: '16px 18px', border: `1.5px solid ${rank.color}33`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${rank.color}, ${rank.color}88, ${rank.color})`, backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: `linear-gradient(135deg, ${rank.color}22, ${rank.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, animation: 'rankUpPulse 3s ease-in-out infinite', flexShrink: 0 }}>
                {rank.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: rank.color, fontSize: 17, fontWeight: 700 }}>{rank.name}</div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                  {stats.wins}W · {stats.losses}L · {stats.wins + stats.losses > 0 ? Math.round(stats.wins / (stats.wins + stats.losses) * 100) : 0}% win rate
                  {stats.streak >= 2 && <span style={{ color: GOLD }}> · 🔥 {stats.streak}</span>}
                </div>
                {nextRank && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ height: 4, borderRadius: 2, background: '#222', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${rank.color}, ${nextRank.color})`, width: `${Math.min(100, progressToNext)}%`, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{winsToNext} wins to {nextRank.emoji} {nextRank.name}</div>
                  </div>
                )}
                {!nextRank && <div style={{ color: GOLD, fontSize: 11, marginTop: 4, fontWeight: 600 }}>MAX RANK ⭐</div>}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ margin: '0 16px 12px', background: '#111', borderRadius: 12, padding: '10px 16px', display: 'flex', justifyContent: 'space-around', border: '1px solid #1A1A1A' }}>
            <StatItem label="Win Rate"    value={stats.wins + stats.losses > 0 ? `${Math.round(stats.wins / (stats.wins + stats.losses) * 100)}%` : '—'} />
            <StatItem label="Best Streak" value={stats.bestStreak > 0 ? `🔥 ${stats.bestStreak}` : '0'} />
            <StatItem label="Rank"        value={rank.emoji} />
          </div>

          {/* Quote */}
          <div style={{ margin: '0 16px 12px', padding: '12px 16px', background: '#111', borderRadius: 12, borderLeft: '3px solid #C8A24C33', border: '1px solid #1A1A1A', borderLeftWidth: 3, borderLeftColor: '#C8A24C33' }}>
            <div key={quoteIdx} style={{ color: '#999', fontSize: 12, fontStyle: 'italic', lineHeight: 1.5, animation: 'fadeIn 0.5s ease' }}>
              "{BJJ_QUOTES[quoteIdx]}"
            </div>
          </div>

          {/* Game Card */}
          <div style={{ margin: '0 16px 12px', background: '#1A1A1A', borderRadius: 16, padding: '18px', border: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: 'linear-gradient(135deg, #C8A24C22, #C8A24C44)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>♟️</div>
              <div>
                <div style={{ color: '#F0F0F0', fontSize: 15, fontWeight: 700 }}>BJJ Position Chess</div>
                <div style={{ color: '#999', fontSize: 11 }}>Outsmart the AI in 12 rounds</div>
              </div>
            </div>
            <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
              Navigate positions, chain combos, and hunt for submissions. Every move costs stamina — manage it wisely or tap out.
            </div>

            {!showDifficulty ? (
              <button data-testid="button-play" onClick={onPlay}
                style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'linear-gradient(135deg, #C8A24C, #A08030)', color: '#0A0A0A', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
                Play
              </button>
            ) : (
              <div style={{ animation: 'popupIn 0.25s ease' }}>
                <div style={{ color: '#999', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Select Difficulty</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button key={d} data-testid={`button-difficulty-${d.toLowerCase()}`} onClick={() => onStartGame(d)}
                      style={{ flex: 1, padding: '11px 6px', borderRadius: 10, background: d === 'Easy' ? '#1a2a1a' : d === 'Medium' ? '#2a2a1a' : '#2a1a1a', border: `1px solid ${d === 'Easy' ? '#2a4a2a' : d === 'Medium' ? '#4a4a2a' : '#4a2a2a'}`, color: d === 'Easy' ? '#4CAF50' : d === 'Medium' ? GOLD : '#E05555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
                      {d}
                    </button>
                  ))}
                </div>
                <button onClick={onBack} style={{ width: '100%', marginTop: 8, padding: '9px', background: 'transparent', border: '1px solid #333', borderRadius: 10, color: '#999', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Recent matches */}
          <div style={{ margin: '0 16px' }}>
            <div style={{ color: '#666', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Matches</div>
            {stats.records.length === 0 ? (
              <div style={{ background: '#111', borderRadius: 12, padding: '24px 20px', textAlign: 'center', color: '#666', fontSize: 13, border: '1px solid #1A1A1A' }}>
                No matches yet. Start your first game!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stats.records.slice(0, 5).map((m, i) => (
                  <div key={i} style={{ background: '#111', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `3px solid ${m.result === 'win' ? GOLD : '#E05555'}`, border: '1px solid #1A1A1A', borderLeftWidth: 3, borderLeftColor: m.result === 'win' ? GOLD : '#E05555' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{m.result === 'win' ? '🏆' : '💀'}</span>
                      <div>
                        <div style={{ color: m.result === 'win' ? GOLD : '#E05555', fontSize: 12, fontWeight: 700 }}>{m.result === 'win' ? 'Victory' : 'Defeat'}</div>
                        <div style={{ color: '#666', fontSize: 11 }}>{m.finisher || '—'} · R{m.rounds || '—'} · {m.difficulty || '—'}</div>
                      </div>
                    </div>
                    <div style={{ color: '#555', fontSize: 10 }}>{m.date ? new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Leaderboard tab ── */}
      {hubTab === 'leaderboard' && (
        <div style={{ margin: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Gym Leaderboard
            </div>
            <div style={{ fontSize: 10, color: '#555', fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#1A1A1A', border: '1px solid #222' }}>
              This Week
            </div>
          </div>

          {lbLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ height: 56, borderRadius: 12, backgroundColor: '#111', border: '1px solid #1A1A1A', opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ background: '#111', borderRadius: 12, padding: '32px 20px', textAlign: 'center', border: '1px solid #1A1A1A' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
              <div style={{ color: '#888', fontSize: 13, marginBottom: 6 }}>No scores yet</div>
              <div style={{ color: '#555', fontSize: 12 }}>Play a game to get on the board!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leaderboard.map((entry, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                const isTop3 = i < 3;
                return (
                  <div key={i} style={{
                    background: isTop3 ? `${GOLD}0A` : '#111',
                    borderRadius: 12, padding: '12px 14px',
                    border: `1px solid ${isTop3 ? GOLD + '20' : '#1A1A1A'}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    {/* Rank number or medal */}
                    <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {medal
                        ? <span style={{ fontSize: 18 }}>{medal}</span>
                        : <span style={{ color: '#555', fontSize: 13, fontWeight: 700 }}>#{entry.rank}</span>}
                    </div>

                    {/* Belt dot + Name + rank */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {entry.belt && (
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: { white: '#E0E0E0', blue: '#3B82F6', purple: '#8B5CF6', brown: '#92400E', black: '#1A1A1A' }[entry.belt.toLowerCase()] || '#666',
                          border: entry.belt.toLowerCase() === 'black' ? '1px solid #C8A24C' : '1px solid transparent',
                        }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: isTop3 ? '#F0F0F0' : '#DDD', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.name}
                        </div>
                        <div style={{ color: '#666', fontSize: 11, marginTop: 1 }}>
                          {entry.topRank}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, textAlign: 'right' }}>
                      <div>
                        <div style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>{entry.classCount || entry.score || entry.wins}{ entry.classCount ? '' : 'W' }</div>
                        <div style={{ color: '#555', fontSize: 10 }}>{entry.classCount ? 'classes' : `${entry.winRate}%`}</div>
                      </div>
                      <div>
                        <div style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>{'\uD83D\uDD25'}{entry.bestStreak}</div>
                        <div style={{ color: '#555', fontSize: 10 }}>best</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => { setLbLoaded(false); setLbLoading(true); getLeaderboard().then(d => { setLeaderboard(d); setLbLoaded(true); setLbLoading(false); }).catch(() => { setLbLoading(false); }); }}
            style={{ width: '100%', marginTop: 12, padding: '10px', background: 'transparent', border: '1px solid #1A1A1A', borderRadius: 10, color: '#555', fontSize: 12, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#F0F0F0', fontSize: 15, fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{label}</div>
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
      width: '100%',
      maxWidth: '100vw',
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
        width: '100%',
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
