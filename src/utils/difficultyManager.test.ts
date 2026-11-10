import { describe, expect, it } from 'vitest';
import { DifficultyManager } from './difficultyManager.ts';

describe('DifficultyManager', () => {
  it('retro profile exactly mirrors v1.0 parameters and thresholds', () => {
    const retro = new DifficultyManager('retro');
    expect(retro.getObstacleThreshold()).toBe(10);
    expect(retro.getBonusInterval()).toBe(10);
    expect(retro.getBonusPoints()).toBe(3);
    expect(retro.getSpeed(0)).toBe(300);
    expect(retro.getSpeed(10)).toBe(280);
    expect(retro.getSpeed(120)).toBe(80); // clamped at 80ms min speed
    expect(retro.getMaxObstacles(0)).toBe(0);
    expect(retro.getMaxObstacles(10)).toBe(4);
    expect(retro.getMaxObstacles(20)).toBe(8);
  });

  it('modern profile delays obstacles until 40 points', () => {
    const modern = new DifficultyManager('modern');
    expect(modern.getObstacleThreshold()).toBe(40);
    expect(modern.getMaxObstacles(10)).toBe(0);
    expect(modern.getMaxObstacles(39)).toBe(0);
    expect(modern.getMaxObstacles(40)).toBe(4);
    expect(modern.getLevel(10)).toBe(1);
    expect(modern.getLevel(50)).toBe(3);
  });

  it('allows switching between profiles at runtime', () => {
    const manager = new DifficultyManager('modern');
    expect(manager.getProfile()).toBe('modern');
    manager.setProfile('retro');
    expect(manager.getProfile()).toBe('retro');
    expect(manager.getObstacleThreshold()).toBe(10);
  });
});
