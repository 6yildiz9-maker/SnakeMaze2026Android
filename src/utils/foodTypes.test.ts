import { describe, expect, it } from 'vitest';
import { applyFoodEffect, FOOD_DEFINITIONS } from './foodTypes.ts';

describe('foodTypes applyFoodEffect', () => {
  it('applies golden food effect: +5 points, normal speed, +1 segment, golden sound', () => {
    const res = applyFoodEffect('golden');
    expect(res.scoreDelta).toBe(5);
    expect(res.speedDelta).toBe(0);
    expect(res.segmentsDelta).toBe(1);
    expect(res.sound).toBe('golden');
  });

  it('applies ice food effect: +2 points, slows down snake (+40ms), +1 segment, ice sound', () => {
    const res = applyFoodEffect('ice');
    expect(res.scoreDelta).toBe(2);
    expect(res.speedDelta).toBe(40);
    expect(res.segmentsDelta).toBe(1);
    expect(res.sound).toBe('ice');
  });

  it('applies poison food effect: -1 point, normal speed, drops 1 segment (-1), poison sound', () => {
    const res = applyFoodEffect('poison');
    expect(res.scoreDelta).toBe(-1);
    expect(res.speedDelta).toBe(0);
    expect(res.segmentsDelta).toBe(-1);
    expect(res.sound).toBe('poison');
  });

  it('applies mystery food effect with deterministic random roll', () => {
    // Roll < 0.35 -> golden-like effect
    const res1 = applyFoodEffect('mystery', () => 0.1);
    expect(res1.scoreDelta).toBe(5);
    expect(res1.sound).toBe('golden');

    // 0.35 <= Roll < 0.7 -> ice-like effect
    const res2 = applyFoodEffect('mystery', () => 0.5);
    expect(res2.scoreDelta).toBe(2);
    expect(res2.speedDelta).toBe(40);
    expect(res2.sound).toBe('ice');

    // Roll >= 0.7 -> bonus-speed effect
    const res3 = applyFoodEffect('mystery', () => 0.85);
    expect(res3.scoreDelta).toBe(3);
    expect(res3.speedDelta).toBe(-10);
    expect(res3.segmentsDelta).toBe(2);
    expect(res3.sound).toBe('bonus');
  });

  it('applies bonus food effect: +3 points, +2 segments, bonus sound', () => {
    const res = applyFoodEffect('bonus');
    expect(res.scoreDelta).toBe(3);
    expect(res.speedDelta).toBe(0);
    expect(res.segmentsDelta).toBe(2);
    expect(res.sound).toBe('bonus');
  });

  it('applies regular food effect: +1 point, +1 segment, regular sound', () => {
    const res = applyFoodEffect('regular');
    expect(res.scoreDelta).toBe(1);
    expect(res.speedDelta).toBe(0);
    expect(res.segmentsDelta).toBe(1);
    expect(res.sound).toBe('regular');
  });

  it('verifies distinct shapes and properties in FOOD_DEFINITIONS', () => {
    expect(FOOD_DEFINITIONS.regular.shape).toBe('square');
    expect(FOOD_DEFINITIONS.bonus.shape).toBe('circle');
    expect(FOOD_DEFINITIONS.golden.shape).toBe('star');
    expect(FOOD_DEFINITIONS.ice.shape).toBe('diamond');
    expect(FOOD_DEFINITIONS.poison.shape).toBe('triangle');
    expect(FOOD_DEFINITIONS.mystery.shape).toBe('mystery');
  });
});
