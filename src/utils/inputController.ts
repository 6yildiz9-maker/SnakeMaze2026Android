import { ControlMode, Direction } from '../types.ts';

export type ButtonSize = 'small' | 'medium' | 'large';
export type HandOrientation = 'right' | 'left'; // left: Left-handed (mirrored)

export function isValidDirectionChange(current: Direction, next: Direction): boolean {
  if (current === 'UP' && next === 'DOWN') return false;
  if (current === 'DOWN' && next === 'UP') return false;
  if (current === 'LEFT' && next === 'RIGHT') return false;
  if (current === 'RIGHT' && next === 'LEFT') return false;
  return true;
}

/**
 * Resolves next direction for classic zig-zag 2-button control
 */
export function resolveZigZagDirection(
  button: 'left' | 'right',
  currentDirection: Direction,
  lastQueuedDirection?: Direction
): Direction {
  const reference = lastQueuedDirection ?? currentDirection;
  if (button === 'left') {
    // If UP/DOWN -> LEFT, else -> DOWN
    return reference === 'UP' || reference === 'DOWN' ? 'LEFT' : 'DOWN';
  } else {
    // If UP/DOWN -> RIGHT, else -> UP
    return reference === 'UP' || reference === 'DOWN' ? 'RIGHT' : 'UP';
  }
}

/**
 * Common input controller processing all inputs into valid queued directions
 */
export class InputController {
  private queue: Direction[] = [];
  private currentDirection: Direction = 'UP';
  private mode: ControlMode = 'classic';
  private maxQueueSize: number = 3;

  constructor(currentDirection: Direction = 'UP', mode: ControlMode = 'classic') {
    this.currentDirection = currentDirection;
    this.mode = mode;
  }

  public setMode(mode: ControlMode) {
    this.mode = mode;
  }

  public setCurrentDirection(direction: Direction) {
    this.currentDirection = direction;
  }

  public getQueue(): Direction[] {
    return [...this.queue];
  }

  public clearQueue() {
    this.queue = [];
  }

  public handleDirection(direction: Direction): boolean {
    const last = this.queue[this.queue.length - 1] ?? this.currentDirection;
    if (this.queue.length >= this.maxQueueSize) return false;
    if (!isValidDirectionChange(last, direction)) return false;

    this.queue.push(direction);
    return true;
  }

  public handleZigZag(button: 'left' | 'right'): Direction | null {
    const last = this.queue[this.queue.length - 1];
    const next = resolveZigZagDirection(button, this.currentDirection, last);
    const success = this.handleDirection(next);
    return success ? next : null;
  }

  public handleSwipe(dx: number, dy: number, minDistance = 25): Direction | null {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < minDistance) return null;

    let targetDir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      targetDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      targetDir = dy > 0 ? 'DOWN' : 'UP';
    }

    const success = this.handleDirection(targetDir);
    return success ? targetDir : null;
  }

  public handleKey(key: string): Direction | null {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        return this.handleDirection('UP') ? 'UP' : null;
      case 'ArrowDown':
      case 's':
      case 'S':
        return this.handleDirection('DOWN') ? 'DOWN' : null;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (this.mode === 'classic' && (key === 'a' || key === 'A')) {
          return this.handleZigZag('left');
        }
        return this.handleDirection('LEFT') ? 'LEFT' : null;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (this.mode === 'classic' && (key === 'd' || key === 'D')) {
          return this.handleZigZag('right');
        }
        return this.handleDirection('RIGHT') ? 'RIGHT' : null;
      default:
        return null;
    }
  }

  public popNextDirection(): Direction | null {
    return this.queue.shift() ?? null;
  }
}
