import { describe, expect, it } from 'vitest';
import { GameLogic } from '../constants/gameConstants.ts';
import { createInitialGameState, gameReducer } from './gameReducer.ts';

describe('gameReducer', () => {
  it('wraps at the board edge without changing the configured direction', () => {
    const state = {
      ...createInitialGameState(),
      snake: [[0, 0], [1, 0], [2, 0]] as [number, number][],
      direction: 'LEFT' as const,
      food: [10, 10] as [number, number],
    };

    const next = gameReducer(state, { type: 'TICK', randomSeed: 1 });

    expect(next.snake[0]).toEqual([GameLogic.DEFAULT_GRID_SIZE - 1, 0]);
    expect(next.event?.wallHit).toBe(true);
  });

  it('rejects a 180-degree direction reversal', () => {
    const state = createInitialGameState();
    const queued = gameReducer(state, { type: 'QUEUE_DIRECTION', direction: 'DOWN' });
    const next = gameReducer(queued, { type: 'TICK', randomSeed: 2 });

    expect(queued).toBe(state);
    expect(next.direction).toBe('UP');
    expect(next.snake[0]).toEqual([10, 9]);
  });

  it('scores and grows by one segment when regular food is eaten', () => {
    const state = {
      ...createInitialGameState(),
      snake: [[2, 2], [2, 3], [2, 4]] as [number, number][],
      direction: 'UP' as const,
      food: [2, 1] as [number, number],
    };

    const next = gameReducer(state, { type: 'TICK', randomSeed: 3 });

    expect(next.score).toBe(1);
    expect(next.gameSpeed).toBe(GameLogic.INITIAL_SPEED - GameLogic.SPEED_INCREMENT);
    expect(next.snake).toHaveLength(4);
    expect(next.event?.type).toBe('regular-food');
  });

  it('awards bonus food and adds three segments total', () => {
    const state = {
      ...createInitialGameState(),
      snake: [[2, 2], [2, 3], [2, 4]] as [number, number][],
      direction: 'UP' as const,
      food: [10, 10] as [number, number],
      bonusFood: [2, 1] as [number, number],
    };

    const next = gameReducer(state, { type: 'TICK', randomSeed: 4 });

    expect(next.score).toBe(GameLogic.BONUS_POINTS);
    expect(next.snake).toHaveLength(6);
    expect(next.bonusFood).toBeNull();
    expect(next.event?.type).toBe('bonus-food');
  });

  it('reports obstacle collisions without mutating the board', () => {
    const state = {
      ...createInitialGameState(),
      snake: [[2, 2], [2, 3], [2, 4]] as [number, number][],
      direction: 'UP' as const,
      food: [10, 10] as [number, number],
      obstacles: [[2, 1]] as [number, number][],
    };

    const next = gameReducer(state, { type: 'TICK', randomSeed: 5 });

    expect(next.event?.type).toBe('collision');
    expect(next.event?.diedToOwnTail).toBe(false);
    expect(next.snake).toEqual(state.snake);
  });

  // ================= BFR-18 TAIL-FOLLOW SCENARIO TESTS (P0) =================
  describe('BFR-18 Tail-Follow Collision Scenarios', () => {
    it('(a) following own tail on normal move survives because tail cell vacates', () => {
      // Loop forming snake: head at [2,2], moving LEFT to [2,1] which is the current tail position
      // Snake: [2,2] (head), [3,2], [3,1], [2,1] (tail)
      const state = {
        ...createInitialGameState(),
        snake: [
          [2, 2],
          [3, 2],
          [3, 1],
          [2, 1],
        ] as [number, number][],
        direction: 'UP' as const, // Next step moves to [2,1]
        food: [15, 15] as [number, number], // Food is far away
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 10 });

      // Tail [2,1] vacated, so moving to [2,1] is NOT collision
      expect(next.event?.type).not.toBe('collision');
      expect(next.snake[0]).toEqual([2, 1]);
      expect(next.snake).toHaveLength(4);
    });

    it('(b) entering tail cell when eating food results in collision (tail remains)', () => {
      // Loop forming snake: head at [2,2], food is on [2,1] which ALSO happens to be tail cell
      const state = {
        ...createInitialGameState(),
        snake: [
          [2, 2],
          [3, 2],
          [3, 1],
          [2, 1],
        ] as [number, number][],
        direction: 'UP' as const, // Moving to [2,1]
        food: [2, 1] as [number, number], // Food is on tail cell!
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 11 });

      // Because it eats food, tail cannot vacate -> collision!
      expect(next.event?.type).toBe('collision');
      expect(next.event?.diedToOwnTail).toBe(true);
    });

    it('(c) entering a non-tail body segment always results in collision', () => {
      // Snake with head [2,2], body [3,2], [3,3], [3,4], [3,5].
      // Snake attempts to turn into [3,2] (which is its neck / non-tail body)
      const state = {
        ...createInitialGameState(),
        snake: [
          [2, 2],
          [3, 2],
          [3, 3],
          [3, 4],
          [3, 5],
        ] as [number, number][],
        direction: 'RIGHT' as const, // Head moves to [3,2] which is neck
        food: [15, 15] as [number, number],
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 12 });

      expect(next.event?.type).toBe('collision');
      expect(next.event?.diedToOwnTail).toBe(true);
    });

    it('(d) tail follow combined with wall wrapping survives', () => {
      // Snake head at [0, 5], moving LEFT -> wraps to [19, 5].
      // Tail is at [19, 5].
      const state = {
        ...createInitialGameState(),
        snake: [
          [0, 5],
          [1, 5],
          [1, 6],
          [19, 6],
          [19, 5], // tail at wrapped boundary
        ] as [number, number][],
        direction: 'LEFT' as const,
        food: [10, 10] as [number, number],
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 13 });

      expect(next.event?.wallHit).toBe(true);
      expect(next.event?.type).not.toBe('collision');
      expect(next.snake[0]).toEqual([19, 5]);
      expect(next.snake).toHaveLength(5);
    });
  });
});
