import { describe, expect, it } from 'vitest';
import { createInitialGameState, gameReducer } from './gameReducer.ts';
import { isPathAvailable } from './pathfinding.ts';
import { GameLogic } from '../constants/gameConstants.ts';

describe('Simulation test (1,000 steps)', () => {
  it('ensures no food/bonus collision and no inaccessible maps during play', () => {
    let state = createInitialGameState();
    let seed = 12345;

    for (let i = 0; i < 1000; i++) {
      seed = (seed * 16807) % 2147483647;
      state = gameReducer(state, { type: 'TICK', randomSeed: seed });

      // If game collided or finished, reset to keep simulating
      if (state.event?.type === 'collision' || state.event?.type === 'victory') {
        state = gameReducer(state, {
          type: 'RESET',
          state: createInitialGameState(),
          randomSeed: seed,
        });
        continue;
      }

      // Check BFR-19: Food and Bonus Food never occupy the exact same cell
      if (state.bonusFood) {
        expect(state.bonusFood).not.toEqual(state.food);
      }

      // Check BFR-20: Path from head to food is available
      const pathExists = isPathAvailable(
        state.snake[0],
        state.food,
        state.obstacles,
        GameLogic.DEFAULT_GRID_SIZE,
        GameLogic.DEFAULT_GRID_HEIGHT
      );
      expect(pathExists).toBe(true);
    }
  });
});
