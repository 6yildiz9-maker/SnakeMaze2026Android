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

  // ================= FR-13-R & FR-14-R GAME MODES & FOOD EFFECTS =================
  describe('Game Modes & Food Effects (FR-13-R, FR-14-R)', () => {
    it('classic mode never generates obstacles even after high scores', () => {
      let state = createInitialGameState('classic');
      expect(state.modeConfig.hasObstacles).toBe(false);
      expect(state.obstacles).toHaveLength(0);

      // Simulate eating food multiple times
      for (let i = 0; i < 15; i++) {
        state = {
          ...state,
          snake: [[5, 5], [5, 6], [5, 7]],
          direction: 'UP',
          food: [5, 4],
          score: 50 + i * 2,
        };
        state = gameReducer(state, { type: 'TICK', randomSeed: 100 + i });
        expect(state.obstacles).toHaveLength(0);
      }
    });

    it('time_attack mode triggers time_up preserving score when time expires', () => {
      const state = {
        ...createInitialGameState('time_attack'),
        timeRemainingMs: 100,
        score: 42,
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 1, elapsedMs: 200 });
      expect(next.timeRemainingMs).toBe(0);
      expect(next.event?.type).toBe('time_up');
      expect(next.score).toBe(42);
    });

    it('preserves exact remaining time on time_attack across ticks and state restore', () => {
      const state = {
        ...createInitialGameState('time_attack'),
        timeRemainingMs: 50000,
      };

      const ticked = gameReducer(state, { type: 'TICK', randomSeed: 1, elapsedMs: 300 });
      expect(ticked.timeRemainingMs).toBe(49700);

      const restored = gameReducer(ticked, { type: 'RESTORE', state: ticked });
      expect(restored.timeRemainingMs).toBe(49700);
      expect(restored.mode).toBe('time_attack');
    });

    it('survival mode uses higher speed increment (4)', () => {
      const state = {
        ...createInitialGameState('survival'),
        snake: [[5, 5], [5, 6], [5, 7]] as [number, number][],
        direction: 'UP' as const,
        food: [5, 4] as [number, number],
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 1 });
      expect(next.event?.type).toBe('regular-food');
      expect(next.gameSpeed).toBe(state.gameSpeed - 4);
    });

    it('handles golden food (+5 score, golden sound)', () => {
      const state = {
        ...createInitialGameState('maze'),
        snake: [[5, 5], [5, 6], [5, 7]] as [number, number][],
        direction: 'UP' as const,
        food: [5, 4] as [number, number],
        foodType: 'golden' as const,
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 1 });
      expect(next.score).toBe(5);
      expect(next.event?.sound).toBe('golden');
    });

    it('handles ice food (+2 score, slows down game speed, ice sound)', () => {
      const state = {
        ...createInitialGameState('maze'),
        snake: [[5, 5], [5, 6], [5, 7]] as [number, number][],
        direction: 'UP' as const,
        food: [5, 4] as [number, number],
        foodType: 'ice' as const,
        gameSpeed: 200,
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 1 });
      expect(next.score).toBe(2);
      expect(next.event?.sound).toBe('ice');
      // 200 - 2 (speedIncrement) + 40 (ice slowing delta) = 238
      expect(next.gameSpeed).toBe(238);
    });

    it('handles poison food (-1 score, drops 1 segment, poison sound)', () => {
      const state = {
        ...createInitialGameState('maze'),
        snake: [[5, 5], [5, 6], [5, 7], [5, 8], [5, 9]] as [number, number][],
        direction: 'UP' as const,
        food: [5, 4] as [number, number],
        foodType: 'poison' as const,
        score: 10,
      };

      const next = gameReducer(state, { type: 'TICK', randomSeed: 1 });
      expect(next.score).toBe(9);
      expect(next.event?.sound).toBe('poison');
      expect(next.snake).toHaveLength(4); // 5 - 1 = 4
    });

    it('loads custom obstacles on RESET in maze mode', () => {
      const customObs: [number, number][] = [[1, 1], [1, 2]];
      const next = gameReducer(createInitialGameState('maze'), {
        type: 'RESET',
        mode: 'maze',
        customObstacles: customObs,
        randomSeed: 1,
      });

      expect(next.obstacles).toEqual(customObs);
    });
  });
});

