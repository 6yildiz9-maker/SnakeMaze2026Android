import { GameLogic } from '../constants/gameConstants.ts';
import { Direction, Point } from '../types.ts';

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
}

export interface GameEvent {
  type: 'move' | 'regular-food' | 'bonus-food' | 'collision' | 'victory';
  score: number;
  directionChanged: Direction | null;
  wallHit: boolean;
  narrowPass: boolean;
  diedToOwnTail: boolean;
  gameSpeed: number;
  gameSpeedBefore: number;
}

export type GameAction =
  | { type: 'RESET'; state: GameEngineState; randomSeed: number }
  | { type: 'RESTORE'; state: GameEngineState }
  | { type: 'QUEUE_DIRECTION'; direction: Direction }
  | { type: 'CLEAR_BONUS' }
  | { type: 'TICK'; randomSeed: number };

export function createInitialGameState(): GameEngineState {
  const midX = Math.floor(GameLogic.DEFAULT_GRID_SIZE / 2);
  const midY = Math.floor(GameLogic.DEFAULT_GRID_HEIGHT / 2);
  return {
    snake: [[midX, midY], [midX, midY + 1], [midX, midY + 2]],
    direction: 'UP',
    directionQueue: [],
    food: [midX, midY - 4],
    bonusFood: null,
    obstacles: [],
    score: 0,
    gameSpeed: GameLogic.INITIAL_SPEED,
    lastNarrowCell: null,
    eventId: 0,
    event: null,
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
  const occupied = new Set([
    ...snake.map(([x, y]) => `${x},${y}`),
    ...obstacles.map(([x, y]) => `${x},${y}`),
    ...exclude.filter((point): point is Point => point !== null).map(([x, y]) => `${x},${y}`),
  ]);
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
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const startX = Math.floor(random() * (GameLogic.DEFAULT_GRID_SIZE - 4)) + 2;
    const startY = Math.floor(random() * (GameLogic.DEFAULT_GRID_HEIGHT - 4)) + 2;
    const cells: Point[] = [
      [startX, startY],
      [startX + 1, startY],
      [startX, startY + 1],
      [startX + 1, startY + 1],
    ];
    const isClear = cells.every(
      ([x, y]) =>
        !snake.some(([sx, sy]) => sx === x && sy === y) &&
        (food[0] !== x || food[1] !== y) &&
        (!bonusFood || bonusFood[0] !== x || bonusFood[1] !== y) &&
        !obstacles.some(([ox, oy]) => ox === x && oy === y)
    );
    if (isClear) return [...obstacles, ...cells];
  }
  return obstacles;
}

function isNarrowPass(cell: Point, obstacles: Point[]) {
  const blocked = (x: number, y: number) =>
    x < 0 ||
    x >= GameLogic.DEFAULT_GRID_SIZE ||
    y < 0 ||
    y >= GameLogic.DEFAULT_GRID_HEIGHT ||
    obstacles.some(([ox, oy]) => ox === x && oy === y);
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
      const initialState = { ...action.state };
      initialState.food = freeCells(initialState.snake, [], [], random) ?? initialState.food;
      return { ...initialState, directionQueue: [], eventId: state.eventId, event: null };
    }
    case 'RESTORE':
      return { ...action.state, directionQueue: [], eventId: state.eventId, event: null };
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
    case 'TICK': {
      const random = nextRandom(action.randomSeed);
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
      const isNarrow =
        state.snake.length > GameLogic.MIN_SNAKE_LENGTH_FOR_NARROW_PASS &&
        isNarrowPass(head, state.obstacles);
      const narrowPass =
        isNarrow &&
        (!state.lastNarrowCell ||
          state.lastNarrowCell[0] !== head[0] ||
          state.lastNarrowCell[1] !== head[1]);
      const lastNarrowCell = isNarrow ? head : null;
      const hitOwnTail = state.snake.some(([x, y]) => x === head[0] && y === head[1]);
      const hitObstacle = state.obstacles.some(([x, y]) => x === head[0] && y === head[1]);
      const snake = [head, ...state.snake];
      const movedState = {
        ...state,
        direction,
        directionQueue,
        lastNarrowCell,
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

      if (state.bonusFood && head[0] === state.bonusFood[0] && head[1] === state.bonusFood[1]) {
        const tail = state.snake[state.snake.length - 1];
        snake.push(tail, tail);
        const score = state.score + GameLogic.BONUS_POINTS;
        const level = Math.floor(score / 10);
        const obstacles =
          level > 0 && state.obstacles.length < level * 4
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
          }
        );
      }

      if (head[0] === state.food[0] && head[1] === state.food[1]) {
        const score = state.score + GameLogic.REGULAR_POINTS;
        const gameSpeed = Math.max(
          GameLogic.MIN_SPEED,
          state.gameSpeed - GameLogic.SPEED_INCREMENT
        );
        const level = Math.floor(score / 10);
        const obstacles =
          level > 0 && state.obstacles.length < level * 4
            ? addObstacle(state.obstacles, snake, state.food, state.bonusFood, random)
            : state.obstacles;
        const bonusFood =
          score > 0 && score % GameLogic.BONUS_FOOD_SPAWN_INTERVAL === 0
            ? freeCells(snake, obstacles, [state.food], random)
            : state.bonusFood;
        const food = freeCells(snake, obstacles, [bonusFood], random);
        if (!food) {
          return withEvent(
            { ...movedState, snake, obstacles, bonusFood, score, gameSpeed },
            {
              type: 'victory',
              score,
              directionChanged,
              wallHit,
              narrowPass,
              diedToOwnTail: false,
            }
          );
        }
        return withEvent(
          { ...movedState, snake, obstacles, bonusFood, food, score, gameSpeed },
          {
            type: 'regular-food',
            score,
            directionChanged,
            wallHit,
            narrowPass,
            diedToOwnTail: false,
          },
          state.gameSpeed
        );
      }

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
