import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOppositeDirection,
  getNextHeadPosition,
  isOutOfBounds,
  isPointInList,
  checkSelfCollision,
  calculateEatScore,
  getRandomEmptyPosition,
  generateObstacles,
  createInitialSnake,
} from './rules.ts';

test('isOppositeDirection detects directly reverse vectors', () => {
  assert.equal(isOppositeDirection('UP', 'DOWN'), true);
  assert.equal(isOppositeDirection('DOWN', 'UP'), true);
  assert.equal(isOppositeDirection('LEFT', 'RIGHT'), true);
  assert.equal(isOppositeDirection('RIGHT', 'LEFT'), true);

  assert.equal(isOppositeDirection('UP', 'LEFT'), false);
  assert.equal(isOppositeDirection('UP', 'RIGHT'), false);
  assert.equal(isOppositeDirection('DOWN', 'LEFT'), false);
  assert.equal(isOppositeDirection('LEFT', 'UP'), false);
});

test('getNextHeadPosition advances correctly without wrap', () => {
  const head = { x: 5, y: 5 };
  assert.deepEqual(getNextHeadPosition(head, 'UP', 20, 20, false), { x: 5, y: 4 });
  assert.deepEqual(getNextHeadPosition(head, 'DOWN', 20, 20, false), { x: 5, y: 6 });
  assert.deepEqual(getNextHeadPosition(head, 'LEFT', 20, 20, false), { x: 4, y: 5 });
  assert.deepEqual(getNextHeadPosition(head, 'RIGHT', 20, 20, false), { x: 6, y: 5 });
});

test('getNextHeadPosition wraps around boundaries when wrapAround is true', () => {
  const atRight = { x: 19, y: 5 };
  assert.deepEqual(getNextHeadPosition(atRight, 'RIGHT', 20, 20, true), { x: 0, y: 5 });

  const atLeft = { x: 0, y: 5 };
  assert.deepEqual(getNextHeadPosition(atLeft, 'LEFT', 20, 20, true), { x: 19, y: 5 });

  const atTop = { x: 5, y: 0 };
  assert.deepEqual(getNextHeadPosition(atTop, 'UP', 20, 20, true), { x: 5, y: 19 });

  const atBottom = { x: 5, y: 19 };
  assert.deepEqual(getNextHeadPosition(atBottom, 'DOWN', 20, 20, true), { x: 5, y: 0 });
});

test('isOutOfBounds detects wall collisions correctly', () => {
  assert.equal(isOutOfBounds({ x: 0, y: 0 }, 20, 20), false);
  assert.equal(isOutOfBounds({ x: 19, y: 19 }, 20, 20), false);
  assert.equal(isOutOfBounds({ x: -1, y: 10 }, 20, 20), true);
  assert.equal(isOutOfBounds({ x: 20, y: 10 }, 20, 20), true);
  assert.equal(isOutOfBounds({ x: 10, y: -1 }, 20, 20), true);
  assert.equal(isOutOfBounds({ x: 10, y: 20 }, 20, 20), true);
});

test('checkSelfCollision detects body overlap', () => {
  const body = [
    { x: 5, y: 5 }, // head
    { x: 4, y: 5 },
    { x: 3, y: 5 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
  ];

  // Head hitting a body segment
  assert.equal(checkSelfCollision({ x: 3, y: 5 }, body), true);
  // Head on empty cell
  assert.equal(checkSelfCollision({ x: 5, y: 4 }, body), false);
});

test('calculateEatScore calculates score with combo, difficulty and speed boost', () => {
  // Normal difficulty, base 10, combo 1
  assert.equal(calculateEatScore(10, 1, 'normal'), 15);
  // Easy difficulty, base 10, combo 1
  assert.equal(calculateEatScore(10, 1, 'easy'), 10);
  // Hard difficulty, base 10, combo 1
  assert.equal(calculateEatScore(10, 1, 'hard'), 20);
  // Normal difficulty, combo 3 (1 + 2*0.25 = 1.5x)
  assert.equal(calculateEatScore(10, 3, 'normal'), 23);
  // Speed boost active (double points)
  assert.equal(calculateEatScore(10, 1, 'normal', true), 30);
});

test('getRandomEmptyPosition does not return occupied cells', () => {
  const occupied = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  // 2x2 grid with 3 cells occupied, only { x: 1, y: 1 } is available
  const result = getRandomEmptyPosition(occupied, 2, 2);
  assert.deepEqual(result, { x: 1, y: 1 });
});

test('createInitialSnake generates a 3-segment safe snake', () => {
  const snake = createInitialSnake(24, 24);
  assert.equal(snake.length, 3);
  assert.deepEqual(snake[0], { x: 12, y: 12 });
  assert.deepEqual(snake[1], { x: 11, y: 12 });
  assert.deepEqual(snake[2], { x: 10, y: 12 });
});
