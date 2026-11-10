import { Point } from '../types.ts';
import { GameLogic } from '../constants/gameConstants.ts';

/**
 * BFS algorithm to verify whether a reachable path exists between start and target
 * taking into account wall wrapping and obstacles.
 */
export function isPathAvailable(
  head: Point,
  target: Point,
  obstacles: Point[],
  gridSize: number = GameLogic.DEFAULT_GRID_SIZE,
  gridHeight: number = GameLogic.DEFAULT_GRID_HEIGHT,
  blockedExtra: Point[] = []
): boolean {
  if (head[0] === target[0] && head[1] === target[1]) return true;

  const blocked = new Set<string>();
  for (const [ox, oy] of obstacles) {
    blocked.add(`${ox},${oy}`);
  }
  for (const [bx, by] of blockedExtra) {
    // Target itself shouldn't be blocked even if passed in extra
    if (bx !== target[0] || by !== target[1]) {
      blocked.add(`${bx},${by}`);
    }
  }

  // If start or target is blocked, no path
  if (blocked.has(`${head[0]},${head[1]}`) || blocked.has(`${target[0]},${target[1]}`)) {
    return false;
  }

  const visited = new Set<string>();
  const queue: Point[] = [head];
  visited.add(`${head[0]},${head[1]}`);

  const directions = [
    [0, -1], // UP
    [0, 1],  // DOWN
    [-1, 0], // LEFT
    [1, 0],  // RIGHT
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const [cx, cy] = current;

    if (cx === target[0] && cy === target[1]) {
      return true;
    }

    for (const [dx, dy] of directions) {
      let nx = cx + dx;
      let ny = cy + dy;

      // Wrapping borders
      if (nx < 0) nx = gridSize - 1;
      else if (nx >= gridSize) nx = 0;
      if (ny < 0) ny = gridHeight - 1;
      else if (ny >= gridHeight) ny = 0;

      const key = `${nx},${ny}`;
      if (!visited.has(key) && !blocked.has(key)) {
        visited.add(key);
        queue.push([nx, ny]);
      }
    }
  }

  return false;
}
