import { Point } from '../types.ts';
import { STORAGE_KEYS, storage } from './storage.ts';
import { isPathAvailable } from './pathfinding.ts';
import { GameLogic } from '../constants/gameConstants.ts';

export interface CustomMaze {
  id: string;
  name: string;
  obstacles: Point[];
  createdAt: number;
}

export class MazeEditorService {
  public getCustomMazes(): CustomMaze[] {
    return storage.getJson<CustomMaze[]>(STORAGE_KEYS.customMazes, []);
  }

  public saveMaze(name: string, obstacles: Point[]): { success: boolean; error?: string; maze?: CustomMaze } {
    if (!name.trim()) {
      return { success: false, error: 'Name cannot be empty' };
    }

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
      id: `maze_${Date.now()}`,
      name: name.trim(),
      obstacles,
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
      v: 1,
      n: maze.name,
      o: maze.obstacles,
    });
    return btoa(json);
  }

  public importFromBase64(base64Str: string): { success: boolean; error?: string; maze?: CustomMaze } {
    try {
      const decoded = atob(base64Str);
      const parsed = JSON.parse(decoded);
      if (!parsed.n || !Array.isArray(parsed.o)) {
        return { success: false, error: 'Invalid map code structure' };
      }
      return this.saveMaze(parsed.n, parsed.o);
    } catch {
      return { success: false, error: 'Corrupt or invalid map code' };
    }
  }
}

export const mazeEditorService = new MazeEditorService();
