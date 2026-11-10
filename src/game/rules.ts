/**
 * Core pure game logic and collision rules for Snake.
 * Decoupled from React and DOM for testability.
 */

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Point {
  x: number;
  y: number;
}

export type GameMode = 'classic' | 'portal' | 'obstacles';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type FoodType = 'apple' | 'golden' | 'speed' | 'freeze';

export interface FoodItem {
  id: string;
  x: number;
  y: number;
  type: FoodType;
  expiresAt?: number; // timestamp if temporary
  points: number;
}

export const GRID_COLS = 24;
export const GRID_ROWS = 24;

export const DIFFICULTY_SPEEDS: Record<Difficulty, number> = {
  easy: 140,   // ms per tick
  normal: 105, // ms per tick
  hard: 75,    // ms per tick
};

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 1.0,
  normal: 1.5,
  hard: 2.0,
};

/**
 * Checks if two directions are directly opposite (e.g., UP and DOWN).
 */
export function isOppositeDirection(d1: Direction, d2: Direction): boolean {
  return (
    (d1 === 'UP' && d2 === 'DOWN') ||
    (d1 === 'DOWN' && d2 === 'UP') ||
    (d1 === 'LEFT' && d2 === 'RIGHT') ||
    (d1 === 'RIGHT' && d2 === 'LEFT')
  );
}

/**
 * Computes next head coordinates given current position, direction, and boundary rules.
 */
export function getNextHeadPosition(
  head: Point,
  direction: Direction,
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
  wrapAround: boolean = false
): Point {
  let { x, y } = head;
  switch (direction) {
    case 'UP':
      y -= 1;
      break;
    case 'DOWN':
      y += 1;
      break;
    case 'LEFT':
      x -= 1;
      break;
    case 'RIGHT':
      x += 1;
      break;
  }

  if (wrapAround) {
    x = (x + cols) % cols;
    y = (y + rows) % rows;
  }

  return { x, y };
}

/**
 * Checks if a point is out of grid bounds.
 */
export function isOutOfBounds(point: Point, cols: number = GRID_COLS, rows: number = GRID_ROWS): boolean {
  return point.x < 0 || point.x >= cols || point.y < 0 || point.y >= rows;
}

/**
 * Checks if a point collides with any point in a list (e.g. snake body or obstacle).
 */
export function isPointInList(point: Point, list: Point[]): boolean {
  return list.some(item => item.x === point.x && item.y === point.y);
}

/**
 * Checks self-collision: head hitting any part of the rest of the body.
 */
export function checkSelfCollision(head: Point, body: Point[]): boolean {
  // body[0] is typically the head, so we check body.slice(1)
  return body.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

/**
 * Computes final score increment for eating a food item given combo and difficulty.
 */
export function calculateEatScore(
  basePoints: number,
  comboCount: number,
  difficulty: Difficulty,
  speedBoostActive: boolean = false
): number {
  const comboMultiplier = Math.min(1 + (comboCount - 1) * 0.25, 4.0);
  const diffMultiplier = DIFFICULTY_MULTIPLIERS[difficulty];
  const boostMult = speedBoostActive ? 2.0 : 1.0;
  return Math.round(basePoints * comboMultiplier * diffMultiplier * boostMult);
}

/**
 * Generates an unoccupied point on the grid.
 */
export function getRandomEmptyPosition(
  occupied: Point[],
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
  randomFn: () => number = Math.random
): Point | null {
  const totalCells = cols * rows;
  if (occupied.length >= totalCells) {
    return null; // Arena is completely full
  }

  // Pick candidate randomly
  for (let attempt = 0; attempt < 100; attempt++) {
    const x = Math.floor(randomFn() * cols);
    const y = Math.floor(randomFn() * rows);
    const candidate = { x, y };
    if (!isPointInList(candidate, occupied)) {
      return candidate;
    }
  }

  // Fallback: sequential search if grid is very crowded
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const candidate = { x, y };
      if (!isPointInList(candidate, occupied)) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Spawns a food item. Standard apple or special power-ups based on roll.
 */
export function generateFoodItem(
  snake: Point[],
  obstacles: Point[] = [],
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
  randomFn: () => number = Math.random,
  now: number = Date.now()
): FoodItem | null {
  const occupied = [...snake, ...obstacles];
  const position = getRandomEmptyPosition(occupied, cols, rows, randomFn);
  if (!position) return null;

  const roll = randomFn();
  let type: FoodType = 'apple';
  let points = 10;
  let expiresAt: number | undefined = undefined;

  // 15% chance for special items if random check passes
  if (roll < 0.08) {
    type = 'golden';
    points = 35;
    expiresAt = now + 9000; // 9s lifetime
  } else if (roll < 0.14) {
    type = 'speed';
    points = 20;
    expiresAt = now + 8000;
  } else if (roll < 0.20) {
    type = 'freeze';
    points = 20;
    expiresAt = now + 8000;
  }

  return {
    id: `food-${now}-${position.x}-${position.y}`,
    x: position.x,
    y: position.y,
    type,
    points,
    expiresAt,
  };
}

/**
 * Generates symmetric layout obstacles for 'obstacles' mode.
 */
export function generateObstacles(cols: number = GRID_COLS, rows: number = GRID_ROWS): Point[] {
  const obstacles: Point[] = [];
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);

  // 4 corner barriers (3x1 and 1x3)
  const offset = 4;
  for (let i = 0; i < 3; i++) {
    // Top-left
    obstacles.push({ x: offset + i, y: offset });
    obstacles.push({ x: offset, y: offset + i });

    // Top-right
    obstacles.push({ x: cols - 1 - offset - i, y: offset });
    obstacles.push({ x: cols - 1 - offset, y: offset + i });

    // Bottom-left
    obstacles.push({ x: offset + i, y: rows - 1 - offset });
    obstacles.push({ x: offset, y: rows - 1 - offset - i });

    // Bottom-right
    obstacles.push({ x: cols - 1 - offset - i, y: rows - 1 - offset });
    obstacles.push({ x: cols - 1 - offset, y: rows - 1 - offset - i });
  }

  // Central cross pillars with open middle
  obstacles.push({ x: cx - 3, y: cy });
  obstacles.push({ x: cx + 3, y: cy });
  obstacles.push({ x: cx, y: cy - 3 });
  obstacles.push({ x: cx, y: cy + 3 });

  // Deduplicate
  const seen = new Set<string>();
  return obstacles.filter(p => {
    const key = `${p.x},${p.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Creates initial snake position at center facing right, guaranteed safe from obstacles.
 */
export function createInitialSnake(cols: number = GRID_COLS, rows: number = GRID_ROWS): Point[] {
  const startX = Math.floor(cols / 2);
  const startY = Math.floor(rows / 2);
  return [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
}
