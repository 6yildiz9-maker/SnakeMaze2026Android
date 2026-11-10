import { describe, expect, it } from 'vitest';
import { isPathAvailable } from './pathfinding.ts';
import { Point } from '../types.ts';

describe('isPathAvailable (BFS)', () => {
  it('returns true when direct path is open', () => {
    const head: Point = [5, 5];
    const food: Point = [5, 10];
    const obstacles: Point[] = [];
    expect(isPathAvailable(head, food, obstacles)).toBe(true);
  });

  it('navigates around obstacles using wrapping borders', () => {
    const head: Point = [0, 5];
    const food: Point = [19, 5];
    const obstacles: Point[] = [];
    // Direct step left wraps to 19,5
    expect(isPathAvailable(head, food, obstacles, 20, 20)).toBe(true);
  });

  it('returns false when target is completely surrounded by obstacles', () => {
    const head: Point = [10, 10];
    const food: Point = [5, 5];
    // Enclose 5,5 with a 3x3 wall box around it
    const obstacles: Point[] = [
      [4, 4], [5, 4], [6, 4],
      [4, 5],         [6, 5],
      [4, 6], [5, 6], [6, 6],
    ];
    expect(isPathAvailable(head, food, obstacles, 20, 20)).toBe(false);
  });

  it('returns false when map is completely blocked', () => {
    const head: Point = [0, 0];
    const food: Point = [10, 10];
    // All neighbors of 0,0 blocked
    const obstacles: Point[] = [
      [1, 0], [0, 1], [19, 0], [0, 19]
    ];
    expect(isPathAvailable(head, food, obstacles, 20, 20)).toBe(false);
  });

  it('returns true when head and food are already the same cell', () => {
    const head: Point = [3, 3];
    const food: Point = [3, 3];
    expect(isPathAvailable(head, food, [])).toBe(true);
  });
});
