import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { RankThresholds } from '../constants/gameConstants.ts';
import { achievementsManager, ALL_ACHIEVEMENTS } from './achievementsManager.ts';
import type { GameData } from '../types.ts';
import { achievementStorageKey } from './storage.ts';

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

const gameData: GameData = {
  score: 0,
  sessionPlayTime: 0,
  totalPlayTime: 0,
  totalFoodEaten: 0,
  totalGamesStarted: 0,
  foodEatenWithoutWall: 0,
  bonusFoodEatenInGame: 0,
  foodEatenAtMaxSpeed: 0,
  mazePasses: 0,
  usedSingleDirection: false,
  usedAllThemes: false,
  usedCustomTheme: false,
  diedToOwnTail: false,
  diedNearHighScore: false,
  diedFast: false,
};

describe('Achievements and ranks', () => {
  it('awards food, custom-maze, and snake-length badges for earned milestones', () => {
    achievementsManager.checkAchievements({
      ...gameData,
      goldenFoodsThisGame: 3,
      iceFoodsThisGame: 3,
      poisonFoodsThisGame: 3,
      mysteryFoodsThisGame: 5,
      playedCustomMaze: true,
      longestSnakeThisGame: 25,
    });

    for (const id of [
      'golden_bounty',
      'ice_breaker',
      'toxic_taster',
      'mystery_master',
      'custom_cartographer',
      'long_serpent',
    ]) {
      expect(memoryStorage.getItem(achievementStorageKey(id))).toBe('true');
    }
    expect(ALL_ACHIEVEMENTS).toHaveLength(25);
  });

  it('uses the expanded rank ladder at each score threshold', () => {
    expect(achievementsManager.getRankKey(RankThresholds.LEGENDARY + 1)).toBe('rank_mythical_leviathan');
    expect(achievementsManager.getRankKey(RankThresholds.STAR_SERPENT + 1)).toBe('rank_star_serpent');
    expect(achievementsManager.getRankKey(RankThresholds.COSMIC_COIL + 1)).toBe('rank_cosmic_coil');
    expect(achievementsManager.getRankKey(RankThresholds.INFINITY_SERPENT + 1)).toBe('rank_infinity_serpent');
  });
});

afterAll(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
});
