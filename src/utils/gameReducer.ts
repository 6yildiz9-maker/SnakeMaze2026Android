import { GameLogic } from '../constants/gameConstants.ts';
import { Direction, FoodType, GameMode, Point } from '../types.ts';
import { GAME_MODES, GameModeConfig } from '../constants/gameModes.ts';
import { applyFoodEffect } from './foodTypes.ts';
import { isPathAvailable } from './pathfinding.ts';
import { difficultyManager, DifficultyProfile } from './difficultyManager.ts';

export interface GameEngineState {
  snake: Point[];
  direction: Direction;
  directionQueue: Direction[];
  food: Point;
  bonusFood: Point | null;
  obstacles: Point[];
  score: number;
  gameSpeed: number;
  lastNarrowCell: Point | null;
  eventId: number;
  event: GameEvent | null;
  difficultyProfile?: DifficultyProfile;
  mode: GameMode;
  modeConfig: GameModeConfig;
  foodType: FoodType;
  timeRemainingMs?: number;
}

export interface GameEvent {
  type: 'move' | 'regular-food' | 'bonus-food' | 'collision' | 'victory' | 'time_up';
  score: number;
  directionChanged: Direction | null;
  wallHit: boolean;
  narrowPass: boolean;
  diedToOwnTail: boolean;
  gameSpeed: number;
  gameSpeedBefore: number;
  foodType?: FoodType;
  sound?: 'regular' | 'bonus' | 'golden' | 'ice' | 'poison' | 'mystery';
}

export type GameAction =
  | { type: 'RESET'; state?: GameEngineState; randomSeed: number; mode?: GameMode; customObstacles?: Point[] }
  | { type: 'RESTORE'; state: GameEngineState }
  | { type: 'QUEUE_DIRECTION'; direction: Direction }
  | { type: 'CLEAR_BONUS' }
  | { type: 'SET_DIFFICULTY_PROFILE'; profile: DifficultyProfile }
  | { type: 'TICK'; randomSeed: number; elapsedMs?: number };

export function createInitialGameState(
  mode: GameMode = 'maze',
  customObstacles: Point[] = []
): GameEngineState {
  const midX = Math.floor(GameLogic.DEFAULT_GRID_SIZE / 2);
  const midY = Math.floor(GameLogic.DEFAULT_GRID_HEIGHT / 2);
  const modeConfig = GAME_MODES[mode] || GAME_MODES.maze;

  return {
    snake: [[midX, midY], [midX, midY + 1], [midX, midY + 2]],
    direction: 'UP',
    directionQueue: [],
    food: [midX, midY - 4],
    bonusFood: null,
    obstacles: modeConfig.hasObstacles ? [...customObstacles] : [],
    score: 0,
    gameSpeed: modeConfig.initialSpeed ?? difficultyManager.getConfig().initialSpeed,
    lastNarrowCell: null,
    eventId: 0,
    event: null,
    difficultyProfile: difficultyManager.getProfile(),
    mode,
    modeConfig,
    foodType: 'regular',
    timeRemainingMs: modeConfig.timeLimitSeconds ? modeConfig.timeLimitSeconds * 1000 : undefined,
  };
}

function isValidDirectionChange(current: Direction, next: Direction) {
  return !(
    (current === 'UP' && next === 'DOWN') ||
    (current === 'DOWN' && next === 'UP') ||
    (current === 'LEFT' && next === 'RIGHT') ||
    (current === 'RIGHT' && next === 'LEFT')
  );
}

function nextRandom(seed: number) {
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}

function freeCells(
  snake: Point[],
  obstacles: Point[],
  exclude: Array<Point | null>,
  random: () => number
): Point | null {
  const occupied = new Set<string>();
  for (const [sx, sy] of snake) occupied.add(`${sx},${sy}`);
  for (const [ox, oy] of obstacles) occupied.add(`${ox},${oy}`);
  for (const point of exclude) {
    if (point !== null) occupied.add(`${point[0]},${point[1]}`);
  }

  const free: Point[] = [];
  for (let x = 0; x < GameLogic.DEFAULT_GRID_SIZE; x += 1) {
    for (let y = 0; y < GameLogic.DEFAULT_GRID_HEIGHT; y += 1) {
      if (!occupied.has(`${x},${y}`)) free.push([x, y]);
    }
  }
  return free.length ? free[Math.floor(random() * free.length)] : null;
}

function addObstacle(
  obstacles: Point[],
  snake: Point[],
  food: Point,
  bonusFood: Point | null,
  random: () => number
): Point[] {
  const head = snake[0];
  const occupied = new Set<string>();
  for (const [sx, sy] of snake) occupied.add(`${sx},${sy}`);
  for (const [ox, oy] of obstacles) occupied.add(`${ox},${oy}`);
  occupied.add(`${food[0]},${food[1]}`);
  if (bonusFood) occupied.add(`${bonusFood[0]},${bonusFood[1]}`);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const startX = Math.floor(random() * (GameLogic.DEFAULT_GRID_SIZE - 4)) + 2;
    const startY = Math.floor(random() * (GameLogic.DEFAULT_GRID_HEIGHT - 4)) + 2;
    const cells: Point[] = [
      [startX, startY],
      [startX + 1, startY],
      [startX, startY + 1],
      [startX + 1, startY + 1],
    ];

    const isClear = cells.every(([x, y]) => !occupied.has(`${x},${y}`));
    if (isClear) {
      const candidateObstacles = [...obstacles, ...cells];
      // BFR-20: BFS verification - ensure path from head to food remains accessible
      const pathOk = isPathAvailable(
        head,
        food,
        candidateObstacles,
        GameLogic.DEFAULT_GRID_SIZE,
        GameLogic.DEFAULT_GRID_HEIGHT,
        snake.slice(1) // exclude head itself as obstacle for path check
      );
      if (pathOk) {
        return candidateObstacles;
      }
    }
  }
  return obstacles;
}

function isNarrowPass(cell: Point, obstaclesSet: Set<string>) {
  const blocked = (x: number, y: number) =>
    x < 0 ||
    x >= GameLogic.DEFAULT_GRID_SIZE ||
    y < 0 ||
    y >= GameLogic.DEFAULT_GRID_HEIGHT ||
    obstaclesSet.has(`${x},${y}`);

  return (
    (blocked(cell[0] - 1, cell[1]) && blocked(cell[0] + 1, cell[1])) ||
    (blocked(cell[0], cell[1] - 1) && blocked(cell[0], cell[1] + 1))
  );
}

function withEvent(
  state: GameEngineState,
  event: Omit<GameEvent, 'gameSpeed' | 'gameSpeedBefore'>,
  gameSpeedBefore = state.gameSpeed
): GameEngineState {
  return {
    ...state,
    eventId: state.eventId + 1,
    event: { ...event, gameSpeed: state.gameSpeed, gameSpeedBefore },
  };
}

export function gameReducer(state: GameEngineState, action: GameAction): GameEngineState {
  switch (action.type) {
    case 'RESET': {
      const random = nextRandom(action.randomSeed);
      const mode = action.mode ?? action.state?.mode ?? state.mode ?? 'maze';
      const customObs = action.customObstacles ?? action.state?.obstacles ?? [];
      const baseState = action.state ?? createInitialGameState(mode, customObs);
      const modeConfig = GAME_MODES[mode] || GAME_MODES.maze;
      const initialState = {
        ...baseState,
        mode,
        modeConfig,
        obstacles: modeConfig.hasObstacles ? [...customObs] : [],
      };
      initialState.food = freeCells(initialState.snake, initialState.obstacles, [], random) ?? initialState.food;
      return { ...initialState, directionQueue: [], eventId: state.eventId, event: null };
    }
    case 'RESTORE':
      return {
        ...action.state,
        mode: action.state.mode || 'maze',
        modeConfig: action.state.modeConfig || GAME_MODES[action.state.mode || 'maze'],
        foodType: action.state.foodType || 'regular',
        directionQueue: [],
        eventId: state.eventId,
        event: null,
      };
    case 'QUEUE_DIRECTION': {
      const lastDirection = state.directionQueue[state.directionQueue.length - 1] ?? state.direction;
      if (
        state.directionQueue.length >= 3 ||
        !isValidDirectionChange(lastDirection, action.direction)
      ) {
        return state;
      }
      return { ...state, directionQueue: [...state.directionQueue, action.direction] };
    }
    case 'CLEAR_BONUS':
      return state.bonusFood ? { ...state, bonusFood: null } : state;
    case 'SET_DIFFICULTY_PROFILE':
      difficultyManager.setProfile(action.profile);
      return { ...state, difficultyProfile: action.profile };
    case 'TICK': {
      const random = nextRandom(action.randomSeed);

      // FR-13-R: Time Attack countdown
      let nextTimeRemaining = state.timeRemainingMs;
      if (state.modeConfig.timeLimitSeconds !== undefined) {
        const elapsed = action.elapsedMs ?? state.gameSpeed;
        nextTimeRemaining = Math.max(
          0,
          (state.timeRemainingMs ?? state.modeConfig.timeLimitSeconds * 1000) - elapsed
        );
        if (nextTimeRemaining <= 0) {
          return withEvent(
            { ...state, timeRemainingMs: 0 },
            {
              type: 'time_up',
              score: state.score,
              directionChanged: null,
              wallHit: false,
              narrowPass: false,
              diedToOwnTail: false,
            }
          );
        }
      }

      const requestedDirection = state.directionQueue[0];
      const directionChanged =
        requestedDirection && isValidDirectionChange(state.direction, requestedDirection)
          ? requestedDirection
          : null;
      const direction = directionChanged ?? state.direction;
      const directionQueue = requestedDirection ? state.directionQueue.slice(1) : state.directionQueue;
      const [headX, headY] = state.snake[0];
      let nextX = headX + (direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0);
      let nextY = headY + (direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0);
      const wallHit =
        nextX < 0 ||
        nextX >= GameLogic.DEFAULT_GRID_SIZE ||
        nextY < 0 ||
        nextY >= GameLogic.DEFAULT_GRID_HEIGHT;

      if (nextX < 0) nextX = GameLogic.DEFAULT_GRID_SIZE - 1;
      else if (nextX >= GameLogic.DEFAULT_GRID_SIZE) nextX = 0;
      if (nextY < 0) nextY = GameLogic.DEFAULT_GRID_HEIGHT - 1;
      else if (nextY >= GameLogic.DEFAULT_GRID_HEIGHT) nextY = 0;

      const head: Point = [nextX, nextY];
      const headKey = `${nextX},${nextY}`;

      // Set-based O(1) obstacles lookup
      const obstaclesSet = new Set<string>();
      for (const [ox, oy] of state.obstacles) obstaclesSet.add(`${ox},${oy}`);

      const isNarrow =
        state.snake.length > GameLogic.MIN_SNAKE_LENGTH_FOR_NARROW_PASS &&
        isNarrowPass(head, obstaclesSet);
      const narrowPass =
        isNarrow &&
        (!state.lastNarrowCell ||
          state.lastNarrowCell[0] !== head[0] ||
          state.lastNarrowCell[1] !== head[1]);
      const lastNarrowCell = isNarrow ? head : null;

      // Check whether this tick eats food
      const eatsRegularFood = head[0] === state.food[0] && head[1] === state.food[1];
      const eatsBonusFood = Boolean(
        state.bonusFood && head[0] === state.bonusFood[0] && head[1] === state.bonusFood[1]
      );
      const growsThisTick = eatsRegularFood || eatsBonusFood;

      // BFR-18: Tail-Follow collision logic (P0)
      const bodyToCheck = growsThisTick ? state.snake : state.snake.slice(0, -1);
      const bodySet = new Set<string>();
      for (const [bx, by] of bodyToCheck) bodySet.add(`${bx},${by}`);

      const hitOwnTail = bodySet.has(headKey);
      const hitObstacle = obstaclesSet.has(headKey);

      const snake = [head, ...state.snake];
      const movedState = {
        ...state,
        direction,
        directionQueue,
        lastNarrowCell,
        timeRemainingMs: nextTimeRemaining,
      };

      if (hitOwnTail || hitObstacle) {
        return withEvent(movedState, {
          type: 'collision',
          score: state.score,
          directionChanged,
          wallHit,
          narrowPass,
          diedToOwnTail: hitOwnTail,
        });
      }

      // Bonus Food eaten
      if (eatsBonusFood) {
        const tail = state.snake[state.snake.length - 1];
        snake.push(tail, tail); // grows +2 segments
        const score = state.score + GameLogic.BONUS_POINTS;

        // Obstacles only spawn in modes with hasObstacles === true
        const maxObs = difficultyManager.getMaxObstacles(score);
        const obstacles =
          state.modeConfig.hasObstacles &&
          score >= difficultyManager.getObstacleThreshold() &&
          state.obstacles.length < maxObs
            ? addObstacle(state.obstacles, snake, state.food, null, random)
            : state.obstacles;

        return withEvent(
          {
            ...movedState,
            snake,
            obstacles,
            bonusFood: null,
            score,
          },
          {
            type: 'bonus-food',
            score,
            directionChanged,
            wallHit,
            narrowPass,
            diedToOwnTail: false,
            foodType: 'bonus',
            sound: 'bonus',
          }
        );
      }

      // Regular / Specialized Food eaten (FR-14-R)
      if (eatsRegularFood) {
        const effect = applyFoodEffect(state.foodType, random);
        const score = Math.max(0, state.score + effect.scoreDelta);

        // Adjust speed using mode speedIncrement + difficulty profile + food effect
        const speedInc = state.modeConfig.speedIncrement;
        const minSpeed = difficultyManager.getMinSpeed();
        const gameSpeed = Math.max(
          minSpeed,
          state.gameSpeed - speedInc + effect.speedDelta
        );

        // Adjust snake segments
        if (effect.segmentsDelta < 0 && snake.length > 3) {
          snake.pop(); // cancel initial growth
          if (snake.length > 3) snake.pop(); // shrink 1 segment
        } else if (effect.segmentsDelta > 1) {
          const tail = state.snake[state.snake.length - 1];
          for (let i = 1; i < effect.segmentsDelta; i++) {
            snake.push(tail);
          }
        }

        // Obstacles only spawn in modes with hasObstacles === true (FR-13-R)
        const maxObs = difficultyManager.getMaxObstacles(score);
        const obstacles =
          state.modeConfig.hasObstacles &&
          score >= difficultyManager.getObstacleThreshold() &&
          state.obstacles.length < maxObs
            ? addObstacle(state.obstacles, snake, state.food, state.bonusFood, random)
            : state.obstacles;

        // Bonus Food only in modes with hasBonusFood === true
        const bonusInterval = difficultyManager.getBonusInterval();
        const bonusFood =
          state.modeConfig.hasBonusFood &&
          score > 0 &&
          score % bonusInterval === 0
            ? freeCells(snake, obstacles, [state.food], random)
            : state.bonusFood;

        // Roll next food type (FR-14-R)
        const isClassic = !state.modeConfig.hasObstacles;
        const nextFoodType = difficultyManager.rollFoodType(random, isClassic, score);

        const food = freeCells(snake, obstacles, [bonusFood], random);
        if (!food) {
          return withEvent(
            { ...movedState, snake, obstacles, bonusFood, score, gameSpeed, foodType: nextFoodType },
            {
              type: 'victory',
              score,
              directionChanged,
              wallHit,
              narrowPass,
              diedToOwnTail: false,
              foodType: state.foodType,
              sound: effect.sound,
            }
          );
        }
        return withEvent(
          { ...movedState, snake, obstacles, bonusFood, food, score, gameSpeed, foodType: nextFoodType },
          {
            type: 'regular-food',
            score,
            directionChanged,
            wallHit,
            narrowPass,
            diedToOwnTail: false,
            foodType: state.foodType,
            sound: effect.sound,
          },
          state.gameSpeed
        );
      }

      // Normal movement: pop tail
      snake.pop();
      if (directionChanged || wallHit || narrowPass) {
        return withEvent(
          { ...movedState, snake },
          {
            type: 'move',
            score: state.score,
            directionChanged,
            wallHit,
            narrowPass,
            diedToOwnTail: false,
          }
        );
      }
      return { ...movedState, snake };
    }
    default:
      return state;
  }
}
