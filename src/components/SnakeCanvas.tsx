import React, { useEffect, useRef } from 'react';
import {
  Point,
  Direction,
  GameMode,
  Difficulty,
  FoodItem,
  GRID_COLS,
  GRID_ROWS,
  DIFFICULTY_SPEEDS,
  isOppositeDirection,
  getNextHeadPosition,
  isOutOfBounds,
  isPointInList,
  checkSelfCollision,
  calculateEatScore,
  generateFoodItem,
  generateObstacles,
  createInitialSnake,
} from '../game/rules.ts';
import { ParticlePool } from '../game/particles.ts';
import { sound } from '../utils/audio.ts';

interface SnakeCanvasProps {
  gameState: 'title' | 'playing' | 'paused' | 'gameover';
  gameMode: GameMode;
  difficulty: Difficulty;
  onScoreUpdate: (score: number, length: number, combo: number) => void;
  onPowerUpUpdate: (powerUp: { type: string; timeLeft: number } | null) => void;
  onGameOver: (finalStats: { score: number; length: number; apples: number; timeSeconds: number; isNewHigh: boolean }) => void;
  onPauseToggle: () => void;
  controlDirectionRef: React.MutableRefObject<Direction | null>;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  gameState,
  gameMode,
  difficulty,
  onScoreUpdate,
  onPowerUpUpdate,
  onGameOver,
  onPauseToggle,
  controlDirectionRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep references to avoid re-triggering simulation loop on props change
  const propsRef = useRef({
    gameState,
    gameMode,
    difficulty,
    onScoreUpdate,
    onPowerUpUpdate,
    onGameOver,
    onPauseToggle,
  });

  useEffect(() => {
    propsRef.current = {
      gameState,
      gameMode,
      difficulty,
      onScoreUpdate,
      onPowerUpUpdate,
      onGameOver,
      onPauseToggle,
    };
  }, [gameState, gameMode, difficulty, onScoreUpdate, onPowerUpUpdate, onGameOver, onPauseToggle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game Simulation State
    let snake: Point[] = createInitialSnake();
    let currentDirection: Direction = 'RIGHT';
    let nextDirection: Direction = 'RIGHT';
    let inputQueue: Direction[] = [];
    let hasStartedMoving = false; // Survives without input until first steering action

    const obstacles: Point[] = propsRef.current.gameMode === 'obstacles' ? generateObstacles() : [];
    let foodList: FoodItem[] = [];

    // Scoring & Stats
    let score = 0;
    let applesEaten = 0;
    let combo = 1;
    let lastEatTime = 0;
    const COMBO_DURATION_MS = 3800;

    // Power-up state
    let activePowerUp: { type: 'speed' | 'freeze'; expiresAt: number } | null = null;

    // Timing & Engine
    let lastTickTime = performance.now();
    let gameStartTime = performance.now();
    let trauma = 0; // for screen shake
    const particles = new ParticlePool(280);

    // Initial Food spawn
    const firstFood = generateFoodItem(snake, obstacles);
    if (firstFood) foodList.push(firstFood);

    // Initial score update
    propsRef.current.onScoreUpdate(score, snake.length, combo);

    // Keydown Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = propsRef.current.gameState;

      // Global hotkeys
      if (e.key === 'm' || e.key === 'M') {
        sound.toggleMute();
        return;
      }

      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (state === 'playing' || state === 'paused') {
          e.preventDefault();
          propsRef.current.onPauseToggle();
          return;
        }
      }

      if (state !== 'playing') return;

      let targetDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          targetDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          targetDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          targetDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          targetDir = 'RIGHT';
          break;
      }

      if (targetDir) {
        e.preventDefault();
        if (!hasStartedMoving) {
          if (targetDir === 'LEFT') return; // Can't reverse immediately into body
          hasStartedMoving = true;
          currentDirection = targetDir;
          nextDirection = targetDir;
          gameStartTime = performance.now();
          sound.playTurn();
          return;
        }

        // Buffer up to 2 directions for crisp cornering
        const lastQueued = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : nextDirection;
        if (!isOppositeDirection(targetDir, lastQueued) && targetDir !== lastQueued && inputQueue.length < 2) {
          inputQueue.push(targetDir);
          sound.playTurn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Canvas Resizing
    let cellPixelSize = 20;
    let canvasWidth = 480;
    let canvasHeight = 480;

    const updateSize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const minDimension = Math.floor(Math.min(rect.width, rect.height) * 0.96);
      // Ensure it's multiple of GRID_COLS
      cellPixelSize = Math.max(12, Math.floor(minDimension / GRID_COLS));
      canvasWidth = cellPixelSize * GRID_COLS;
      canvasHeight = cellPixelSize * GRID_ROWS;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);
    updateSize();

    // Simulation Step
    const runTick = () => {
      if (propsRef.current.gameState !== 'playing' || !hasStartedMoving) return;

      // Consume next buffered direction
      if (inputQueue.length > 0) {
        nextDirection = inputQueue.shift()!;
      }
      currentDirection = nextDirection;

      const wrapAround = propsRef.current.gameMode !== 'classic';
      const head = snake[0];
      const nextHead = getNextHeadPosition(head, currentDirection, GRID_COLS, GRID_ROWS, wrapAround);

      // Check wall collision (in classic mode)
      if (!wrapAround && isOutOfBounds(nextHead, GRID_COLS, GRID_ROWS)) {
        triggerDeath('wall');
        return;
      }

      // Check obstacle collision
      if (isPointInList(nextHead, obstacles)) {
        triggerDeath('obstacle');
        return;
      }

      // Check self collision
      if (checkSelfCollision(nextHead, snake)) {
        triggerDeath('self');
        return;
      }

      // Check food consumption
      const eatenFoodIndex = foodList.findIndex(f => f.x === nextHead.x && f.y === nextHead.y);
      let grew = false;

      if (eatenFoodIndex >= 0) {
        const eaten = foodList[eatenFoodIndex];
        foodList.splice(eatenFoodIndex, 1);
        grew = true;
        applesEaten++;

        // Combo check
        const now = performance.now();
        if (now - lastEatTime < COMBO_DURATION_MS) {
          combo = Math.min(combo + 1, 5);
        } else {
          combo = 1;
        }
        lastEatTime = now;

        const isSpeedBoost = activePowerUp?.type === 'speed';
        const pointsAwarded = calculateEatScore(eaten.points, combo, propsRef.current.difficulty, isSpeedBoost);
        score += pointsAwarded;

        // Visual juice & sound
        const worldX = (nextHead.x + 0.5) * cellPixelSize;
        const worldY = (nextHead.y + 0.5) * cellPixelSize;

        if (eaten.type === 'apple') {
          sound.playEat(combo);
          particles.emit(worldX, worldY, 14, '#34d399', 1.2);
        } else if (eaten.type === 'golden') {
          sound.playSpecialEat('golden');
          particles.emit(worldX, worldY, 28, '#f59e0b', 2.0);
          trauma = Math.min(trauma + 0.3, 0.6);
        } else if (eaten.type === 'speed') {
          sound.playSpecialEat('speed');
          particles.emit(worldX, worldY, 24, '#f97316', 1.8);
          activePowerUp = { type: 'speed', expiresAt: Date.now() + 6000 };
        } else if (eaten.type === 'freeze') {
          sound.playSpecialEat('freeze');
          particles.emit(worldX, worldY, 24, '#38bdf8', 1.8);
          activePowerUp = { type: 'freeze', expiresAt: Date.now() + 6000 };
        }

        // Spawn replacement food
        const newFood = generateFoodItem(snake, obstacles);
        if (newFood) foodList.push(newFood);

        // Maybe spawn occasional secondary bonus if snake length is high enough
        if (foodList.length < 2 && Math.random() < 0.35 && snake.length > 6) {
          const bonusFood = generateFoodItem(snake, obstacles);
          if (bonusFood) foodList.push(bonusFood);
        }

        propsRef.current.onScoreUpdate(score, snake.length + 1, combo);
      }

      // Advance Snake segments
      const newSnake = [nextHead, ...snake];
      if (!grew) {
        newSnake.pop();
      }
      snake = newSnake;

      // Update PowerUp status
      const nowMs = Date.now();
      if (activePowerUp) {
        if (nowMs >= activePowerUp.expiresAt) {
          activePowerUp = null;
          propsRef.current.onPowerUpUpdate(null);
        } else {
          propsRef.current.onPowerUpUpdate({
            type: activePowerUp.type,
            timeLeft: Math.ceil((activePowerUp.expiresAt - nowMs) / 1000),
          });
        }
      } else {
        propsRef.current.onPowerUpUpdate(null);
      }
    };

    const triggerDeath = (_cause: string) => {
      sound.playCrash();
      trauma = 0.9;

      const head = snake[0];
      particles.emit(
        (head.x + 0.5) * cellPixelSize,
        (head.y + 0.5) * cellPixelSize,
        45,
        '#ef4444',
        2.8
      );

      // Save high score
      let highKey = `neon_snake_high_${propsRef.current.gameMode}_${propsRef.current.difficulty}`;
      let storedHigh = 0;
      try {
        storedHigh = parseInt(localStorage.getItem(highKey) || '0', 10);
      } catch {
        // Ignore
      }
      const isNewHigh = score > storedHigh;
      if (isNewHigh) {
        try {
          localStorage.setItem(highKey, String(score));
        } catch {
          // Ignore
        }
      }

      const totalSeconds = Math.round((performance.now() - gameStartTime) / 1000);
      propsRef.current.onGameOver({
        score,
        length: snake.length,
        apples: applesEaten,
        timeSeconds: totalSeconds,
        isNewHigh,
      });
    };

    // Main 60 FPS Render & Animation Loop
    let animationFrameId: number;
    let lastFrameTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
      lastFrameTime = timestamp;

      // Check external mobile controller input
      if (controlDirectionRef.current && propsRef.current.gameState === 'playing') {
        const targetDir = controlDirectionRef.current;
        controlDirectionRef.current = null;
        if (!hasStartedMoving) {
          if (targetDir !== 'LEFT') {
            hasStartedMoving = true;
            currentDirection = targetDir;
            nextDirection = targetDir;
            gameStartTime = performance.now();
            sound.playTurn();
          }
        } else {
          const lastQueued = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : nextDirection;
          if (!isOppositeDirection(targetDir, lastQueued) && targetDir !== lastQueued && inputQueue.length < 2) {
            inputQueue.push(targetDir);
            sound.playTurn();
          }
        }
      }

      // Calculate effective tick speed
      let baseSpeed = DIFFICULTY_SPEEDS[propsRef.current.difficulty];
      if (activePowerUp?.type === 'speed') {
        baseSpeed = Math.round(baseSpeed * 0.65); // Faster
      } else if (activePowerUp?.type === 'freeze') {
        baseSpeed = Math.round(baseSpeed * 1.55); // Slower
      }

      // Check combo decay
      if (combo > 1 && timestamp - lastEatTime > COMBO_DURATION_MS) {
        combo = 1;
        propsRef.current.onScoreUpdate(score, snake.length, combo);
      }

      // Run simulation tick if playing
      if (propsRef.current.gameState === 'playing') {
        if (timestamp - lastTickTime >= baseSpeed) {
          runTick();
          lastTickTime = timestamp;
        }

        // Clean up expired temporary foods
        const nowMs = Date.now();
        const initialLen = foodList.length;
        foodList = foodList.filter(f => !f.expiresAt || f.expiresAt > nowMs);
        if (foodList.length === 0 && initialLen > 0) {
          const fresh = generateFoodItem(snake, obstacles);
          if (fresh) foodList.push(fresh);
        }
      }

      // Update particles
      particles.update(dt * 60);

      // Camera shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (trauma > 0.01) {
        const shakeMagnitude = trauma * trauma * 12;
        shakeX = (Math.random() * 2 - 1) * shakeMagnitude;
        shakeY = (Math.random() * 2 - 1) * shakeMagnitude;
        trauma = Math.max(0, trauma - dt * 1.8);
      }

      // CLEAR & RENDER CANVAS
      ctx.save();
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.translate(shakeX, shakeY);

      // 1. Draw Background Grid
      ctx.fillStyle = '#0a101d';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Grid line dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = 0; x <= GRID_COLS; x++) {
        for (let y = 0; y <= GRID_ROWS; y++) {
          ctx.beginPath();
          ctx.arc(x * cellPixelSize, y * cellPixelSize, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Border outline
      ctx.strokeStyle = propsRef.current.gameMode === 'classic' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

      // 2. Draw Obstacles
      if (obstacles.length > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        obstacles.forEach(obs => {
          const ox = obs.x * cellPixelSize;
          const oy = obs.y * cellPixelSize;
          ctx.beginPath();
          ctx.roundRect(ox + 1.5, oy + 1.5, cellPixelSize - 3, cellPixelSize - 3, 3);
          ctx.fill();
          ctx.stroke();

          // Obsidian inner hazard cross
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(ox + cellPixelSize * 0.4, oy + cellPixelSize * 0.4, cellPixelSize * 0.2, cellPixelSize * 0.2);
        });
      }

      // 3. Draw Foods
      const pulse = 0.5 + 0.5 * Math.sin(timestamp * 0.008);
      foodList.forEach(food => {
        const fx = food.x * cellPixelSize;
        const fy = food.y * cellPixelSize;
        const radius = (cellPixelSize / 2) * (0.8 + 0.1 * pulse);
        const cx = fx + cellPixelSize / 2;
        const cy = fy + cellPixelSize / 2;

        ctx.save();
        if (food.type === 'apple') {
          // Glow
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Apple leaf
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(cx + 2, cy - radius * 0.8, 3, 2, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (food.type === 'golden') {
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
          ctx.fill();

          // Golden Star shimmer
          ctx.fillStyle = '#fffbeb';
          ctx.beginPath();
          ctx.arc(cx - 2, cy - 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (food.type === 'speed') {
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Chili Flame mark
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (food.type === 'freeze') {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();

          // Ice Crystal spark
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // 4. Draw Snake
      const snakeLength = snake.length;
      for (let i = snakeLength - 1; i >= 0; i--) {
        const seg = snake[i];
        const sx = seg.x * cellPixelSize;
        const sy = seg.y * cellPixelSize;
        const isHead = i === 0;

        ctx.save();
        if (isHead) {
          // Snake Head with bright neon gradient
          ctx.shadowColor = activePowerUp?.type === 'speed' ? '#f97316' : '#10b981';
          ctx.shadowBlur = 12;
          ctx.fillStyle = activePowerUp?.type === 'speed' ? '#fb923c' : '#34d399';

          ctx.beginPath();
          ctx.roundRect(sx + 1, sy + 1, cellPixelSize - 2, cellPixelSize - 2, 6);
          ctx.fill();

          // Eyes pointing in currentDirection
          ctx.fillStyle = '#090d16';
          let eye1X = sx + cellPixelSize * 0.3;
          let eye1Y = sy + cellPixelSize * 0.3;
          let eye2X = sx + cellPixelSize * 0.7;
          let eye2Y = sy + cellPixelSize * 0.3;

          if (currentDirection === 'DOWN') {
            eye1Y = sy + cellPixelSize * 0.7;
            eye2Y = sy + cellPixelSize * 0.7;
          } else if (currentDirection === 'LEFT') {
            eye1X = sx + cellPixelSize * 0.3;
            eye1Y = sy + cellPixelSize * 0.3;
            eye2X = sx + cellPixelSize * 0.3;
            eye2Y = sy + cellPixelSize * 0.7;
          } else if (currentDirection === 'RIGHT') {
            eye1X = sx + cellPixelSize * 0.7;
            eye1Y = sy + cellPixelSize * 0.3;
            eye2X = sx + cellPixelSize * 0.7;
            eye2Y = sy + cellPixelSize * 0.7;
          }

          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, cellPixelSize * 0.12, 0, Math.PI * 2);
          ctx.arc(eye2X, eye2Y, cellPixelSize * 0.12, 0, Math.PI * 2);
          ctx.fill();

          // Glint in eyes
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(eye1X - 0.5, eye1Y - 0.5, cellPixelSize * 0.05, 0, Math.PI * 2);
          ctx.arc(eye2X - 0.5, eye2Y - 0.5, cellPixelSize * 0.05, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Body segment with smooth tapering and color shift
          const t = i / snakeLength;
          // Interpolate from emerald to cyan/teal
          const r = Math.round(16 + t * (6 - 16));
          const g = Math.round(185 + t * (148 - 185));
          const b = Math.round(129 + t * (162 - 129));
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

          const inset = 1.5 + t * 1.5;
          ctx.beginPath();
          ctx.roundRect(
            sx + inset,
            sy + inset,
            cellPixelSize - inset * 2,
            cellPixelSize - inset * 2,
            4
          );
          ctx.fill();
        }
        ctx.restore();
      }

      // 5. Draw Particles
      particles.render(ctx);

      // 6. Draw Ready to Move Indicator
      if (!hasStartedMoving && propsRef.current.gameState === 'playing') {
        ctx.save();
        const textPulse = 0.7 + 0.3 * Math.sin(timestamp * 0.005);
        ctx.fillStyle = `rgba(52, 211, 153, ${textPulse})`;
        ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PRESS WASD / ARROWS TO STEER', canvasWidth / 2, canvasHeight - 20);
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center relative overflow-hidden select-none"
      data-testid="snake-game-stage"
    >
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-2xl border border-slate-800 bg-[#0a101d]"
      />
    </div>
  );
};
