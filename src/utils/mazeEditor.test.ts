import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { mazeEditorService } from './mazeEditor.ts';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const memoryStorage = new MemoryStorage();

beforeAll(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: memoryStorage },
  });
});

afterEach(() => memoryStorage.clear());

describe('mazeEditorService', () => {
  it('saves a playable custom maze and imports Unicode map codes', () => {
    const saved = mazeEditorService.saveMaze('Benim Labirentim', [[3, 3], [4, 3]]);
    expect(saved.success).toBe(true);
    expect(saved.maze).toBeDefined();

    if (!saved.maze) throw new Error('Expected the valid maze to be saved.');
    const code = mazeEditorService.exportToBase64(saved.maze);
    const imported = mazeEditorService.importFromBase64(code);
    expect(imported.success).toBe(true);
    expect(imported.maze?.name).toBe('Benim Labirentim');
    expect(imported.maze?.obstacles).toEqual([[3, 3], [4, 3]]);
    expect(imported.maze?.id).not.toBe(saved.maze.id);
    expect(mazeEditorService.getCustomMazes()).toHaveLength(2);
  });

  it('rejects maze blocks on the starting snake, first food, and invalid board cells', () => {
    expect(mazeEditorService.saveMaze('Blocked start', [[10, 11]]).success).toBe(false);
    expect(mazeEditorService.saveMaze('Blocked food', [[10, 6]]).success).toBe(false);
    expect(mazeEditorService.saveMaze('Outside board', [[20, 2]]).success).toBe(false);
    expect(mazeEditorService.getCustomMazes()).toEqual([]);
  });

  it('rejects a map whose walls seal the starting cell', () => {
    const result = mazeEditorService.saveMaze('Sealed', [[9, 6], [11, 6], [10, 5], [10, 7]]);
    expect(result.success).toBe(false);
    expect(result.error).toContain('unsolvable');
  });

  it('does not mutate the caller obstacle list when saving', () => {
    const obstacles: [number, number][] = [[2, 2]];
    mazeEditorService.saveMaze('Copy test', obstacles);
    obstacles[0][0] = 8;
    expect(mazeEditorService.getCustomMazes()[0].obstacles).toEqual([[2, 2]]);
  });
});

afterAll(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
});
