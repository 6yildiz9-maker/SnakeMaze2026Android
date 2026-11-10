import { describe, expect, it, beforeEach, beforeAll, afterAll } from 'vitest';
import { QuestManager } from './quests.ts';
import { GameOverData } from '../types.ts';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

const memoryStorage = new MemoryStorage();
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

beforeAll(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: memoryStorage },
  });
});

afterAll(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
});

describe('QuestManager', () => {
  let manager: QuestManager;

  beforeEach(() => {
    memoryStorage.clear();
    manager = new QuestManager();
  });

  it('generates 3 daily quests', () => {
    const quests = manager.getDailyQuests();
    expect(quests).toHaveLength(3);
    expect(quests.every((q) => !q.completed)).toBe(true);
  });

  it('advances quest progress after game session', () => {
    expect(manager.getDailyQuests()).toHaveLength(3);
    const gameData: GameOverData = {
      score: 50,
      sessionFoodEaten: 30,
      bonusFoodEatenInGame: 2,
      foodEatenWithoutWall: 20,
      foodEatenAtMaxSpeed: 5,
      bonusEatenFast: true,
      diedToOwnTail: false,
      wallHit: false,
      mazePasses: 2,
      usedSingleDirection: false,
    };

    let completions = 0;
    const updated = manager.processGameSession(gameData, () => {
      completions++;
    });

    expect(updated).toHaveLength(3);
    const hasProgress = updated.some((q) => q.current > 0);
    expect(hasProgress).toBe(true);
    expect(completions).toBeGreaterThanOrEqual(0);
  });
});
