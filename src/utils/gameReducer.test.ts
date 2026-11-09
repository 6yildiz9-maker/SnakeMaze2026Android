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
});
