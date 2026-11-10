import { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, Difficulty, Direction } from './game/rules.ts';
import { SnakeCanvas } from './components/SnakeCanvas.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHud } from './components/GameHud.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { GameOverModal } from './components/GameOverModal.tsx';
import { MobileControls } from './components/MobileControls.tsx';
import { sound } from './utils/audio.ts';

export default function App() {
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'gameover'>('title');
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [runKey, setRunKey] = useState(0); // increment to reset canvas simulation session

  // Live HUD States
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [combo, setCombo] = useState(1);
  const [powerUp, setPowerUp] = useState<{ type: string; timeLeft: number } | null>(null);

  // End of run stats
  const [gameOverStats, setGameOverStats] = useState<{
    score: number;
    length: number;
    apples: number;
    timeSeconds: number;
    isNewHigh: boolean;
  } | null>(null);

  const [isMuted, setIsMuted] = useState(() => sound.getMuted());
  const controlDirectionRef = useRef<Direction | null>(null);

  // High score for current mode & difficulty
  const [highScore, setHighScore] = useState(0);

  const refreshHighScore = useCallback(() => {
    try {
      const key = `neon_snake_high_${gameMode}_${difficulty}`;
      const val = parseInt(localStorage.getItem(key) || '0', 10);
      setHighScore(val);
    } catch {
      setHighScore(0);
    }
  }, [gameMode, difficulty]);

  useEffect(() => {
    refreshHighScore();
  }, [refreshHighScore]);

  // Sync document.body.dataset.state with gameState
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Support ?autostart=1 query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setGameState('playing');
        setRunKey(prev => prev + 1);
      }
    }
  }, []);

  // Keyboard Space/Enter to start game from Title screen
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        sound.playClick();
        handleStartGame();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState]);

  const handleStartGame = () => {
    setScore(0);
    setLength(3);
    setCombo(1);
    setPowerUp(null);
    setGameOverStats(null);
    setGameState('playing');
    setRunKey(prev => prev + 1);
  };

  const handlePauseToggle = () => {
    setGameState(current => (current === 'playing' ? 'paused' : current === 'paused' ? 'playing' : current));
  };

  const handleScoreUpdate = useCallback((newScore: number, newLength: number, newCombo: number) => {
    setScore(newScore);
    setLength(newLength);
    setCombo(newCombo);
  }, []);

  const handlePowerUpUpdate = useCallback((newPowerUp: { type: string; timeLeft: number } | null) => {
    setPowerUp(newPowerUp);
  }, []);

  const handleGameOver = useCallback((finalStats: {
    score: number;
    length: number;
    apples: number;
    timeSeconds: number;
    isNewHigh: boolean;
  }) => {
    setGameOverStats(finalStats);
    setGameState('gameover');
    refreshHighScore();
  }, [refreshHighScore]);

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Touch Swipe Gesture Detection for Mobile
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'playing' || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const minSwipeDistance = 20;

    if (Math.max(absX, absY) < minSwipeDistance) return;

    if (absX > absY) {
      controlDirectionRef.current = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      controlDirectionRef.current = dy > 0 ? 'DOWN' : 'UP';
    }
  };

  return (
    <div
      className="relative w-screen h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Playing HUD */}
      {gameState === 'playing' && (
        <GameHud
          score={score}
          highScore={highScore}
          length={length}
          combo={combo}
          powerUp={powerUp}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePauseToggle}
          onRestart={handleStartGame}
        />
      )}

      {/* 2. Main Game Arena Canvas */}
      <div className="flex-1 w-full h-full flex items-center justify-center pt-14 pb-4 px-2 sm:px-4">
        <SnakeCanvas
          key={runKey}
          gameState={gameState}
          gameMode={gameMode}
          difficulty={difficulty}
          onScoreUpdate={handleScoreUpdate}
          onPowerUpUpdate={handlePowerUpUpdate}
          onGameOver={handleGameOver}
          onPauseToggle={handlePauseToggle}
          controlDirectionRef={controlDirectionRef}
        />
      </div>

      {/* 3. Mobile On-Screen D-Pad Controller */}
      {gameState === 'playing' && (
        <MobileControls
          onDirection={(dir) => {
            controlDirectionRef.current = dir;
          }}
        />
      )}

      {/* 4. Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStart={handleStartGame}
          gameMode={gameMode}
          setGameMode={setGameMode}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          highScore={highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 5. Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={handleStartGame}
          onHome={() => setGameState('title')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 6. Game Over Modal */}
      {gameState === 'gameover' && gameOverStats && (
        <GameOverModal
          score={gameOverStats.score}
          highScore={highScore}
          length={gameOverStats.length}
          apples={gameOverStats.apples}
          timeSeconds={gameOverStats.timeSeconds}
          isNewHigh={gameOverStats.isNewHigh}
          onRestart={handleStartGame}
          onHome={() => setGameState('title')}
        />
      )}
    </div>
  );
}
