import { Direction, ControlMode } from '../types.ts';

export function isValidDirectionChange(current: Direction, next: Direction): boolean {
  return !(
    (current === 'UP' && next === 'DOWN') ||
    (current === 'DOWN' && next === 'UP') ||
    (current === 'LEFT' && next === 'RIGHT') ||
    (current === 'RIGHT' && next === 'LEFT')
  );
}

export function resolveZigZagDirection(
  turn: 'left' | 'right',
  currentDirection: Direction
): Direction {
  if (currentDirection === 'UP' || currentDirection === 'DOWN') {
    return turn === 'left' ? 'LEFT' : 'RIGHT';
  }
  return turn === 'left' ? 'DOWN' : 'UP';
}

export class InputController {
  private currentDirection: Direction;
  private mode: ControlMode;
  private queue: Direction[] = [];
  private readonly maxQueueSize = 3;

  constructor(initialDirection: Direction = 'UP', mode: ControlMode = 'classic') {
    this.currentDirection = initialDirection;
    this.mode = mode;
  }

  public getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  public setCurrentDirection(dir: Direction): void {
    this.currentDirection = dir;
  }

  public setControlMode(mode: ControlMode): void {
    this.mode = mode;
  }

  public getControlMode(): ControlMode {
    return this.mode;
  }

  public getQueue(): Direction[] {
    return [...this.queue];
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public popNextDirection(): Direction | undefined {
    return this.queue.shift();
  }

  public handleDirection(dir: Direction): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      return false;
    }

    const lastDirection = this.queue[this.queue.length - 1] ?? this.currentDirection;
    if (!isValidDirectionChange(lastDirection, dir)) {
      return false;
    }

    this.queue.push(dir);
    return true;
  }

  public handleKey(key: string): Direction | null {
    let targetDir: Direction | null = null;
    const pendingDirection = this.queue[this.queue.length - 1] ?? this.currentDirection;

    switch (key) {
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
        targetDir = 'LEFT';
        break;
      case 'ArrowRight':
        targetDir = 'RIGHT';
        break;
      case 'a':
      case 'A':
        targetDir = this.mode === 'classic'
          ? resolveZigZagDirection('left', pendingDirection)
          : 'LEFT';
        break;
      case 'd':
      case 'D':
        targetDir = this.mode === 'classic'
          ? resolveZigZagDirection('right', pendingDirection)
          : 'RIGHT';
        break;
      default:
        return null;
    }

    if (targetDir) {
      const added = this.handleDirection(targetDir);
      return added ? targetDir : null;
    }

    return null;
  }

  public handleSwipe(dx: number, dy: number, threshold = 25): Direction | null {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) {
      return null;
    }

    let dir: Direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      dir = dy > 0 ? 'DOWN' : 'UP';
    }

    const added = this.handleDirection(dir);
    return added ? dir : null;
  }

  public handleZigZag(turn: 'left' | 'right'): Direction | null {
    const pendingDirection = this.queue[this.queue.length - 1] ?? this.currentDirection;
    const targetDir = resolveZigZagDirection(turn, pendingDirection);
    const added = this.handleDirection(targetDir);
    return added ? targetDir : null;
  }
}
