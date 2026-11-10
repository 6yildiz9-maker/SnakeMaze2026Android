import { Point } from '../types.ts';
import { STORAGE_KEYS, storage } from './storage.ts';
import { isPathAvailable } from './pathfinding.ts';
import { GameLogic } from '../constants/gameConstants.ts';

export interface CustomMaze {
  id: string;
  name: string;
  description: string;
  difficulty: MazeDifficulty;
  obstacles: Point[];
  createdAt: number;
}

export type MazeDifficulty = 'easy' | 'medium' | 'hard';

function isPoint(value: unknown): value is Point {
  return Array.isArray(value) &&
    value.length === 2 &&
    value.every((coordinate) => Number.isInteger(coordinate));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class MazeEditorService {
  private validateObstacles(obstacles: Point[]): string | null {
    const midX = Math.floor(GameLogic.DEFAULT_GRID_SIZE / 2);
    const midY = Math.floor(GameLogic.DEFAULT_GRID_HEIGHT / 2);
    const blockedStartCells = new Set([
      `${midX},${midY}`,
      `${midX},${midY + 1}`,
      `${midX},${midY + 2}`,
      `${midX},${midY - 4}`,
    ]);
    const seen = new Set<string>();

    for (const point of obstacles) {
      if (
        !Array.isArray(point) ||
        point.length !== 2 ||
        !point.every(Number.isInteger) ||
        point[0] < 0 ||
        point[0] >= GameLogic.DEFAULT_GRID_SIZE ||
        point[1] < 0 ||
        point[1] >= GameLogic.DEFAULT_GRID_HEIGHT
      ) {
        return 'Map contains an invalid cell.';
      }

      const key = `${point[0]},${point[1]}`;
      if (seen.has(key)) return 'Map contains duplicate cells.';
      if (blockedStartCells.has(key)) return 'Keep the snake start and first food cells clear.';
      seen.add(key);
    }

    return null;
  }

  public getCustomMazes(): CustomMaze[] {
    const stored = storage.getJson<unknown>(STORAGE_KEYS.customMazes, []);
    if (!Array.isArray(stored)) return [];

    return stored.flatMap((value): CustomMaze[] => {
      if (
        !isRecord(value) ||
        typeof value.id !== 'string' ||
        typeof value.name !== 'string' ||
        typeof value.createdAt !== 'number' ||
        !Number.isFinite(value.createdAt) ||
        !Array.isArray(value.obstacles) ||
        !value.obstacles.every(isPoint)
      ) {
        return [];
      }

      const obstacles = value.obstacles;
      if (this.validateObstacles(obstacles)) return [];

      return [{
        id: value.id,
        name: value.name,
        description: typeof value.description === 'string' ? value.description : '',
        difficulty: value.difficulty === 'medium' || value.difficulty === 'hard'
          ? value.difficulty
          : 'easy',
        obstacles: obstacles.map(([x, y]) => [x, y]),
        createdAt: value.createdAt,
      }];
    });
  }

  public saveMaze(
    name: string,
    obstacles: Point[],
    options: { description?: string; difficulty?: MazeDifficulty } = {}
  ): { success: boolean; error?: string; maze?: CustomMaze } {
    if (!name.trim()) {
      return { success: false, error: 'Name cannot be empty' };
    }
    if (name.trim().length > 32) {
      return { success: false, error: 'Name must be 32 characters or fewer.' };
    }
    if ((options.description?.length ?? 0) > 120) {
      return { success: false, error: 'Description must be 120 characters or fewer.' };
    }
    if (
      options.difficulty !== undefined &&
      options.difficulty !== 'easy' &&
      options.difficulty !== 'medium' &&
      options.difficulty !== 'hard'
    ) {
      return { success: false, error: 'Map difficulty is invalid.' };
    }
    if (!Array.isArray(obstacles)) {
      return { success: false, error: 'Map obstacle data is invalid.' };
    }
    const invalidMap = this.validateObstacles(obstacles);
    if (invalidMap) return { success: false, error: invalidMap };

    // Default head at center, food at top-center
    const midX = Math.floor(GameLogic.DEFAULT_GRID_SIZE / 2);
    const midY = Math.floor(GameLogic.DEFAULT_GRID_HEIGHT / 2);
    const head: Point = [midX, midY];
    const food: Point = [midX, midY - 4];

    // BFS verification: Is the maze solvable?
    const solvable = isPathAvailable(
      head,
      food,
      obstacles,
      GameLogic.DEFAULT_GRID_SIZE,
      GameLogic.DEFAULT_GRID_HEIGHT
    );

    if (!solvable) {
      return {
        success: false,
        error: 'Maze is unsolvable! Player cannot reach the food.',
      };
    }

    const mazes = this.getCustomMazes();
    const newMaze: CustomMaze = {
      id: `maze_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      description: options.description?.trim() ?? '',
      difficulty: options.difficulty ?? 'easy',
      obstacles: obstacles.map(([x, y]) => [x, y]),
      createdAt: Date.now(),
    };

    mazes.push(newMaze);
    storage.setItem(STORAGE_KEYS.customMazes, JSON.stringify(mazes));
    return { success: true, maze: newMaze };
  }

  public deleteMaze(id: string): void {
    const mazes = this.getCustomMazes().filter((m) => m.id !== id);
    storage.setItem(STORAGE_KEYS.customMazes, JSON.stringify(mazes));
  }

  public exportToBase64(maze: CustomMaze): string {
    const json = JSON.stringify({
      v: 2,
      n: maze.name,
      d: maze.difficulty,
      x: maze.description,
      o: maze.obstacles,
    });
    const bytes = new TextEncoder().encode(json);
    return btoa(String.fromCharCode(...bytes));
  }

  public importFromBase64(base64Str: string): { success: boolean; error?: string; maze?: CustomMaze } {
    try {
      const decoded = atob(base64Str);
      const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
      const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (
        !isRecord(parsed) ||
        !('n' in parsed) ||
        typeof parsed.n !== 'string' ||
        !('o' in parsed) ||
        !Array.isArray(parsed.o) ||
        !parsed.o.every(isPoint) ||
        ('v' in parsed && parsed.v !== 1 && parsed.v !== 2) ||
        ('d' in parsed && parsed.d !== 'easy' && parsed.d !== 'medium' && parsed.d !== 'hard') ||
        ('x' in parsed && typeof parsed.x !== 'string')
      ) {
        return { success: false, error: 'Invalid map code structure' };
      }
      return this.saveMaze(parsed.n, parsed.o, {
        description: typeof parsed.x === 'string' ? parsed.x : '',
        difficulty: parsed.d === 'medium' || parsed.d === 'hard' ? parsed.d : 'easy',
      });
    } catch {
      return { success: false, error: 'Corrupt or invalid map code' };
    }
  }
}

export const mazeEditorService = new MazeEditorService();
